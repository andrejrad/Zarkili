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

import type { CreateLocationInput, Location, UpdateLocationInput } from "./model";

const COLLECTION = "locations";

function validateCreateInput(input: CreateLocationInput): void {
  if (!input.tenantId?.trim()) throw new Error("Location tenantId is required");
  if (!input.name?.trim()) throw new Error("Location name is required");
  if (!input.code?.trim()) throw new Error("Location code is required");
  if (!input.timezone?.trim()) throw new Error("Location timezone is required");
  if (!input.address?.city?.trim()) throw new Error("Location address.city is required");
  if (!input.address?.country?.trim()) throw new Error("Location address.country is required");
}

function validateUpdateInput(input: UpdateLocationInput): void {
  if (Object.keys(input).length === 0) {
    throw new Error("Update payload must not be empty");
  }
  if ("name" in input && !input.name?.trim()) {
    throw new Error("Location name must not be blank");
  }
  if ("code" in input && !input.code?.trim()) {
    throw new Error("Location code must not be blank");
  }
}

export function createLocationRepository(db: Firestore) {
  async function createLocation(locationId: string, input: CreateLocationInput): Promise<Location> {
    validateCreateInput(input);

    const ref = doc(db, COLLECTION, locationId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`Location with id ${locationId} already exists`);
    }

    const data = {
      ...input,
      locationId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, data);
    const snapshot = await getDoc(ref);
    return { ...(snapshot.data() as Omit<Location, "locationId">), locationId };
  }

  async function getLocationById(locationId: string): Promise<Location | null> {
    const ref = doc(db, COLLECTION, locationId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { ...(snapshot.data() as Omit<Location, "locationId">), locationId: snapshot.id };
  }

  async function listTenantLocations(tenantId: string): Promise<Location[]> {
    if (!tenantId?.trim()) throw new Error("tenantId is required for listTenantLocations");

    const q = query(
      collection(db, COLLECTION),
      where("tenantId", "==", tenantId),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      ...(d.data() as Omit<Location, "locationId">),
      locationId: d.id,
    }));
  }

  async function updateLocation(
    locationId: string,
    tenantId: string,
    input: UpdateLocationInput
  ): Promise<void> {
    validateUpdateInput(input);

    const ref = doc(db, COLLECTION, locationId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error(`Location ${locationId} not found`);
    }

    // Tenant guard: never allow updating a location that belongs to a different tenant
    const stored = snapshot.data() as Location;
    if (stored.tenantId !== tenantId) {
      throw new Error("Cross-tenant location update is not allowed");
    }

    await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
  }

  async function deactivateLocation(locationId: string, tenantId: string): Promise<void> {
    const ref = doc(db, COLLECTION, locationId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error(`Location ${locationId} not found`);
    }

    const stored = snapshot.data() as Location;
    if (stored.tenantId !== tenantId) {
      throw new Error("Cross-tenant location deactivation is not allowed");
    }

    await updateDoc(ref, { status: "inactive", updatedAt: serverTimestamp() });
  }

  return { createLocation, getLocationById, listTenantLocations, updateLocation, deactivateLocation };
}

export type LocationRepository = ReturnType<typeof createLocationRepository>;
