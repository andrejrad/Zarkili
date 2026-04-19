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

import type { CreateTenantInput, Tenant, UpdateTenantInput } from "./model";

const COLLECTION = "tenants";

function validateCreateInput(input: CreateTenantInput): void {
  if (!input.name?.trim()) throw new Error("Tenant name is required");
  if (!input.slug?.trim()) throw new Error("Tenant slug is required");
  if (!input.ownerUserId?.trim()) throw new Error("Tenant ownerUserId is required");
  if (!input.timezone?.trim()) throw new Error("Tenant timezone is required");
}

function validateUpdateInput(input: UpdateTenantInput): void {
  if (Object.keys(input).length === 0) {
    throw new Error("Update payload must not be empty");
  }
  if ("name" in input && !input.name?.trim()) {
    throw new Error("Tenant name must not be blank");
  }
  if ("slug" in input && !input.slug?.trim()) {
    throw new Error("Tenant slug must not be blank");
  }
}

export function createTenantRepository(db: Firestore) {
  async function createTenant(tenantId: string, input: CreateTenantInput): Promise<Tenant> {
    validateCreateInput(input);

    const ref = doc(db, COLLECTION, tenantId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`Tenant with id ${tenantId} already exists`);
    }

    const data = {
      ...input,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, data);
    const snapshot = await getDoc(ref);
    return { ...(snapshot.data() as Omit<Tenant, "tenantId">), tenantId };
  }

  async function getTenantById(tenantId: string): Promise<Tenant | null> {
    const ref = doc(db, COLLECTION, tenantId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { ...(snapshot.data() as Omit<Tenant, "tenantId">), tenantId: snapshot.id };
  }

  async function getTenantBySlug(slug: string): Promise<Tenant | null> {
    const q = query(collection(db, COLLECTION), where("slug", "==", slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { ...(docSnap.data() as Omit<Tenant, "tenantId">), tenantId: docSnap.id };
  }

  async function updateTenant(tenantId: string, input: UpdateTenantInput): Promise<void> {
    validateUpdateInput(input);
    const ref = doc(db, COLLECTION, tenantId);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      throw new Error(`Tenant ${tenantId} not found`);
    }
    await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
  }

  async function listActiveTenants(): Promise<Tenant[]> {
    const q = query(collection(db, COLLECTION), where("status", "==", "active"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      ...(d.data() as Omit<Tenant, "tenantId">),
      tenantId: d.id,
    }));
  }

  return { createTenant, getTenantById, getTenantBySlug, updateTenant, listActiveTenants };
}

export type TenantRepository = ReturnType<typeof createTenantRepository>;
