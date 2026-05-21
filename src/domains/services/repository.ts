import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import type { CreateServiceInput, Service, ServiceCategory, UpdateServiceInput } from "./model";
import {
  SERVICE_TYPES_COLLECTION,
  serviceTypeDocSegments,
  serviceTypesCollectionPath,
} from "./paths";

const CATEGORIES_COLLECTION = "service_categories";
const MIN_DURATION_MINUTES = 5;
const MAX_DURATION_MINUTES = 480;
const MIN_BUFFER_MINUTES = 0;
const MAX_BUFFER_MINUTES = 120;
const MIN_PRICE = 0;
const MAX_PRICE = 10000;

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

function assertDurationMinutes(durationMinutes: number): void {
  if (!Number.isInteger(durationMinutes)) {
    throw new Error("baseDurationMinutes must be an integer");
  }

  if (durationMinutes < MIN_DURATION_MINUTES || durationMinutes > MAX_DURATION_MINUTES) {
    throw new Error(
      `baseDurationMinutes must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES}`
    );
  }
}

function assertBufferMinutes(bufferMinutes: number): void {
  if (!Number.isInteger(bufferMinutes)) {
    throw new Error("baseBufferMinutes must be an integer");
  }

  if (bufferMinutes < MIN_BUFFER_MINUTES || bufferMinutes > MAX_BUFFER_MINUTES) {
    throw new Error(`baseBufferMinutes must be between ${MIN_BUFFER_MINUTES} and ${MAX_BUFFER_MINUTES}`);
  }
}

function assertPrice(price: number): void {
  if (typeof price !== "number" || Number.isNaN(price)) {
    throw new Error("basePrice must be a number");
  }

  if (price < MIN_PRICE || price > MAX_PRICE) {
    throw new Error(`basePrice must be between ${MIN_PRICE} and ${MAX_PRICE}`);
  }
}

function validateCreateInput(input: CreateServiceInput): void {
  assertNonEmpty(input.tenantId, "tenantId");
  assertNonEmpty(input.locationId, "locationId");
  assertNonEmpty(input.name, "name");
  assertNonEmpty(input.categoryId, "categoryId");
  assertDurationMinutes(input.baseDurationMinutes);
  assertBufferMinutes(input.baseBufferMinutes);
  assertPrice(input.basePrice);
  assertNonEmpty(input.baseCurrency, "baseCurrency");

  if (typeof input.active !== "boolean") {
    throw new Error("active must be a boolean");
  }

  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
    throw new Error("sortOrder must be a non-negative integer");
  }
}

function validateUpdateInput(input: UpdateServiceInput): void {
  if (Object.keys(input).length === 0) {
    throw new Error("Update payload must not be empty");
  }

  if ("name" in input && input.name != null) {
    assertNonEmpty(input.name, "name");
  }

  if ("categoryId" in input && input.categoryId != null) {
    assertNonEmpty(input.categoryId, "categoryId");
  }

  if ("baseDurationMinutes" in input && input.baseDurationMinutes != null) {
    assertDurationMinutes(input.baseDurationMinutes);
  }

  if ("baseBufferMinutes" in input && input.baseBufferMinutes != null) {
    assertBufferMinutes(input.baseBufferMinutes);
  }

  if ("basePrice" in input && input.basePrice != null) {
    assertPrice(input.basePrice);
  }

  if ("baseCurrency" in input && input.baseCurrency != null) {
    assertNonEmpty(input.baseCurrency, "baseCurrency");
  }

  if ("active" in input && input.active != null && typeof input.active !== "boolean") {
    throw new Error("active must be a boolean");
  }

  if ("sortOrder" in input && input.sortOrder != null) {
    if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
      throw new Error("sortOrder must be a non-negative integer");
    }
  }
}

export function createServiceRepository(db: Firestore) {
  /**
   * Resolve a service-type document path by serviceId.
   *
   * B2 transitional helper: callers that hold only a `serviceId` (e.g. legacy
   * admin flows) need to discover the `brandId` + `locationId` so we can read
   * or write the hierarchical doc at
   * `brands/{brandId}/locations/{locationId}/service_types/{serviceId}`.
   *
   * Uses a `collectionGroup` query filtered by document name. Returns null
   * when no matching service exists in the v3 hierarchy.
   */
  async function resolveServiceLocation(
    serviceId: string,
  ): Promise<{ brandId: string; locationId: string; data: Service } | null> {
    const cg = collectionGroup(db, SERVICE_TYPES_COLLECTION);
    const snap = await getDocs(cg);
    for (const docSnap of snap.docs) {
      if (docSnap.id !== serviceId) continue;
      const data = docSnap.data() as Service;
      const brandId = (data.tenantId as string | undefined) ?? "";
      const locationId = (data.locationId as string | undefined) ?? "";
      if (!brandId || !locationId) return null;
      return { brandId, locationId, data };
    }
    return null;
  }

  async function createService(serviceId: string, input: CreateServiceInput): Promise<Service> {
    assertNonEmpty(serviceId, "serviceId");
    validateCreateInput(input);

    const ref = doc(db, ...serviceTypeDocSegments(input.tenantId, input.locationId, serviceId));
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`Service with id ${serviceId} already exists`);
    }

    const data = {
      ...input,
      serviceId,
      averageRating: null,
      reviewCount: 0,
      ratingSum: 0,
      popularityScore: 0,
      nextAvailableAt: null,
      isFullyBooked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, data);
    const snapshot = await getDoc(ref);
    return { ...(snapshot.data() as Omit<Service, "serviceId">), serviceId };
  }

  async function updateService(
    serviceId: string,
    tenantId: string,
    input: UpdateServiceInput
  ): Promise<void> {
    assertNonEmpty(serviceId, "serviceId");
    assertNonEmpty(tenantId, "tenantId");
    validateUpdateInput(input);

    const resolved = await resolveServiceLocation(serviceId);
    if (!resolved) {
      throw new Error(`Service ${serviceId} not found`);
    }
    if (resolved.data.tenantId !== tenantId) {
      throw new Error("Cross-tenant service update is not allowed");
    }

    const ref = doc(
      db,
      ...serviceTypeDocSegments(resolved.brandId, resolved.locationId, serviceId),
    );
    await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
  }

  async function listServicesByTenant(tenantId: string): Promise<Service[]> {
    assertNonEmpty(tenantId, "tenantId");

    const q = query(
      collectionGroup(db, SERVICE_TYPES_COLLECTION),
      where("tenantId", "==", tenantId),
      where("active", "==", true)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Omit<Service, "serviceId">),
      serviceId: docSnap.id,
    }));
  }

  async function listServicesByLocation(tenantId: string, locationId: string): Promise<Service[]> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(locationId, "locationId");

    const q = query(
      collection(db, serviceTypesCollectionPath(tenantId, locationId)),
      where("active", "==", true)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Omit<Service, "serviceId">),
      serviceId: docSnap.id,
    }));
  }

  async function archiveService(serviceId: string, tenantId: string): Promise<void> {
    assertNonEmpty(serviceId, "serviceId");
    assertNonEmpty(tenantId, "tenantId");

    const resolved = await resolveServiceLocation(serviceId);
    if (!resolved) {
      throw new Error(`Service ${serviceId} not found`);
    }
    if (resolved.data.tenantId !== tenantId) {
      throw new Error("Cross-tenant service archive is not allowed");
    }

    const ref = doc(
      db,
      ...serviceTypeDocSegments(resolved.brandId, resolved.locationId, serviceId),
    );
    await updateDoc(ref, {
      active: false,
      updatedAt: serverTimestamp(),
    });
  }

  async function getActiveCategories(): Promise<ServiceCategory[]> {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      orderBy("displayOrder", "asc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Omit<ServiceCategory, "id">),
      id: docSnap.id,
    }));
  }

  return {
    createService,
    updateService,
    listServicesByTenant,
    listServicesByLocation,
    archiveService,
    getActiveCategories,
  };
}

export type ServiceRepository = ReturnType<typeof createServiceRepository>;

