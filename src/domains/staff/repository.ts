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

import type {
  CreateStaffInput,
  StaffConstraint,
  StaffMember,
  StaffRole,
  StaffStatus,
  UpdateStaffInput,
} from "./model";

const COLLECTION = "staff";
const validRoles: StaffRole[] = ["owner", "manager", "technician", "assistant"];
const validStatuses: StaffStatus[] = ["active", "inactive"];

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

function assertStringArray(values: string[], field: string): void {
  if (!Array.isArray(values)) {
    throw new Error(`${field} must be an array`);
  }

  if (values.some((value) => typeof value !== "string" || value.trim().length === 0)) {
    throw new Error(`${field} contains invalid value`);
  }
}

function assertRole(role: string): asserts role is StaffRole {
  if (!validRoles.includes(role as StaffRole)) {
    throw new Error("role is invalid");
  }
}

function assertStatus(status: string): asserts status is StaffStatus {
  if (!validStatuses.includes(status as StaffStatus)) {
    throw new Error("status is invalid");
  }
}

function assertConstraints(constraints: StaffConstraint[]): void {
  if (!Array.isArray(constraints)) {
    throw new Error("constraints must be an array");
  }

  if (
    constraints.some(
      (constraint) =>
        !constraint
        || typeof constraint !== "object"
        || typeof constraint.key !== "string"
        || constraint.key.trim().length === 0
    )
  ) {
    throw new Error("constraints contains invalid value");
  }
}

function validateCreateInput(input: CreateStaffInput): void {
  assertNonEmpty(input.tenantId, "tenantId");
  assertStringArray(input.locationIds, "locationIds");
  assertNonEmpty(input.userId, "userId");
  assertNonEmpty(input.displayName, "displayName");
  assertRole(input.role);
  assertStatus(input.status);
  assertStringArray(input.skills, "skills");
  assertStringArray(input.serviceIds, "serviceIds");
  assertConstraints(input.constraints);
}

function validateUpdateInput(input: UpdateStaffInput): void {
  if (Object.keys(input).length === 0) {
    throw new Error("Update payload must not be empty");
  }

  if ("locationIds" in input && input.locationIds) {
    assertStringArray(input.locationIds, "locationIds");
  }

  if ("displayName" in input && input.displayName != null) {
    assertNonEmpty(input.displayName, "displayName");
  }

  if ("role" in input && input.role != null) {
    assertRole(input.role);
  }

  if ("status" in input && input.status != null) {
    assertStatus(input.status);
  }

  if ("skills" in input && input.skills) {
    assertStringArray(input.skills, "skills");
  }

  if ("serviceIds" in input && input.serviceIds) {
    assertStringArray(input.serviceIds, "serviceIds");
  }

  if ("constraints" in input && input.constraints) {
    assertConstraints(input.constraints);
  }
}

export function createStaffRepository(db: Firestore) {
  async function createStaff(staffId: string, input: CreateStaffInput): Promise<StaffMember> {
    assertNonEmpty(staffId, "staffId");
    validateCreateInput(input);

    const ref = doc(db, COLLECTION, staffId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`Staff with id ${staffId} already exists`);
    }

    const data = {
      ...input,
      staffId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, data);
    const snapshot = await getDoc(ref);
    return { ...(snapshot.data() as Omit<StaffMember, "staffId">), staffId };
  }

  async function updateStaff(
    staffId: string,
    tenantId: string,
    input: UpdateStaffInput
  ): Promise<void> {
    assertNonEmpty(staffId, "staffId");
    assertNonEmpty(tenantId, "tenantId");
    validateUpdateInput(input);

    const ref = doc(db, COLLECTION, staffId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error(`Staff ${staffId} not found`);
    }

    const stored = snapshot.data() as StaffMember;
    if (stored.tenantId !== tenantId) {
      throw new Error("Cross-tenant staff update is not allowed");
    }

    await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
  }

  async function listLocationStaff(tenantId: string, locationId: string): Promise<StaffMember[]> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(locationId, "locationId");

    const q = query(
      collection(db, COLLECTION),
      where("tenantId", "==", tenantId),
      where("status", "==", "active"),
      where("locationIds", "array-contains", locationId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Omit<StaffMember, "staffId">),
      staffId: docSnap.id,
    }));
  }

  async function listServiceQualifiedStaff(
    tenantId: string,
    locationId: string,
    serviceId: string
  ): Promise<StaffMember[]> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(locationId, "locationId");
    assertNonEmpty(serviceId, "serviceId");

    const q = query(
      collection(db, COLLECTION),
      where("tenantId", "==", tenantId),
      where("status", "==", "active"),
      where("locationIds", "array-contains", locationId),
      where("serviceIds", "array-contains", serviceId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Omit<StaffMember, "staffId">),
      staffId: docSnap.id,
    }));
  }

  async function deactivateStaff(staffId: string, tenantId: string): Promise<void> {
    assertNonEmpty(staffId, "staffId");
    assertNonEmpty(tenantId, "tenantId");

    const ref = doc(db, COLLECTION, staffId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error(`Staff ${staffId} not found`);
    }

    const stored = snapshot.data() as StaffMember;
    if (stored.tenantId !== tenantId) {
      throw new Error("Cross-tenant staff deactivation is not allowed");
    }

    await updateDoc(ref, {
      status: "inactive",
      updatedAt: serverTimestamp(),
    });
  }

  return {
    createStaff,
    updateStaff,
    listLocationStaff,
    listServiceQualifiedStaff,
    deactivateStaff,
  };
}

export type StaffRepository = ReturnType<typeof createStaffRepository>;
