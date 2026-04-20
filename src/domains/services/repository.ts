import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import type { CreateServiceInput, Service, UpdateServiceInput } from "./model";

const COLLECTION = "services";
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

function assertLocationIds(locationIds: string[]): void {
  if (!Array.isArray(locationIds)) {
    throw new Error("locationIds must be an array");
  }

  if (locationIds.some((locationId) => typeof locationId !== "string" || locationId.trim().length === 0)) {
    throw new Error("locationIds contains invalid value");
  }
}

function assertDurationMinutes(durationMinutes: number): void {
  if (!Number.isInteger(durationMinutes)) {
    throw new Error("durationMinutes must be an integer");
  }

  if (durationMinutes < MIN_DURATION_MINUTES || durationMinutes > MAX_DURATION_MINUTES) {
    throw new Error(
      `durationMinutes must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES}`
    );
  }
}

function assertBufferMinutes(bufferMinutes: number): void {
  if (!Number.isInteger(bufferMinutes)) {
    throw new Error("bufferMinutes must be an integer");
  }

  if (bufferMinutes < MIN_BUFFER_MINUTES || bufferMinutes > MAX_BUFFER_MINUTES) {
    throw new Error(`bufferMinutes must be between ${MIN_BUFFER_MINUTES} and ${MAX_BUFFER_MINUTES}`);
  }
}

function assertPrice(price: number): void {
  if (typeof price !== "number" || Number.isNaN(price)) {
    throw new Error("price must be a number");
  }

  if (price < MIN_PRICE || price > MAX_PRICE) {
    throw new Error(`price must be between ${MIN_PRICE} and ${MAX_PRICE}`);
  }
}

function validateCreateInput(input: CreateServiceInput): void {
  assertNonEmpty(input.tenantId, "tenantId");
  assertLocationIds(input.locationIds);
  assertNonEmpty(input.name, "name");
  assertNonEmpty(input.category, "category");
  assertDurationMinutes(input.durationMinutes);
  assertBufferMinutes(input.bufferMinutes);
  assertPrice(input.price);
  assertNonEmpty(input.currency, "currency");

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

  if ("locationIds" in input && input.locationIds) {
    assertLocationIds(input.locationIds);
  }

  if ("name" in input && input.name != null) {
    assertNonEmpty(input.name, "name");
  }

  if ("category" in input && input.category != null) {
    assertNonEmpty(input.category, "category");
  }

  if ("durationMinutes" in input && input.durationMinutes != null) {
    assertDurationMinutes(input.durationMinutes);
  }

  if ("bufferMinutes" in input && input.bufferMinutes != null) {
    assertBufferMinutes(input.bufferMinutes);
  }

  if ("price" in input && input.price != null) {
    assertPrice(input.price);
  }

  if ("currency" in input && input.currency != null) {
    assertNonEmpty(input.currency, "currency");
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
  async function createService(serviceId: string, input: CreateServiceInput): Promise<Service> {
    assertNonEmpty(serviceId, "serviceId");
    validateCreateInput(input);

    const ref = doc(db, COLLECTION, serviceId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`Service with id ${serviceId} already exists`);
    }

    const data = {
      ...input,
      serviceId,
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

    const ref = doc(db, COLLECTION, serviceId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error(`Service ${serviceId} not found`);
    }

    const stored = snapshot.data() as Service;
    if (stored.tenantId !== tenantId) {
      throw new Error("Cross-tenant service update is not allowed");
    }

    await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
  }

  async function listServicesByTenant(tenantId: string): Promise<Service[]> {
    assertNonEmpty(tenantId, "tenantId");

    const q = query(
      collection(db, COLLECTION),
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
      collection(db, COLLECTION),
      where("tenantId", "==", tenantId),
      where("active", "==", true),
      where("locationIds", "array-contains", locationId)
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

    const ref = doc(db, COLLECTION, serviceId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error(`Service ${serviceId} not found`);
    }

    const stored = snapshot.data() as Service;
    if (stored.tenantId !== tenantId) {
      throw new Error("Cross-tenant service archive is not allowed");
    }

    await updateDoc(ref, {
      active: false,
      updatedAt: serverTimestamp(),
    });
  }

  return {
    createService,
    updateService,
    listServicesByTenant,
    listServicesByLocation,
    archiveService,
  };
}

export type ServiceRepository = ReturnType<typeof createServiceRepository>;
