import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

import type {
  CreateUserTenantAccessInput,
  UserTenantAccess,
} from "./userTenantAccessModel";

const COLLECTION = "userTenantAccess";

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

function buildAccessId(userId: string, tenantId: string): string {
  return `${userId}_${tenantId}`;
}

function validateCreateInput(input: CreateUserTenantAccessInput): void {
  assertNonEmpty(input.userId, "userId");
  assertNonEmpty(input.tenantId, "tenantId");

  if (input.unreadMessageCount < 0) {
    throw new Error("unreadMessageCount cannot be negative");
  }
}

export function createUserTenantAccessRepository(db: Firestore) {
  async function createUserTenantAccess(
    input: CreateUserTenantAccessInput
  ): Promise<UserTenantAccess> {
    validateCreateInput(input);

    const accessId = buildAccessId(input.userId, input.tenantId);
    const ref = doc(db, COLLECTION, accessId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`User tenant access with id ${accessId} already exists`);
    }

    await setDoc(ref, {
      accessId,
      ...input,
      updatedAt: serverTimestamp(),
    });

    const snapshot = await getDoc(ref);
    return snapshot.data() as UserTenantAccess;
  }

  async function updateUnreadMessageCount(
    userId: string,
    tenantId: string,
    unreadMessageCount: number,
    lastMessageAt: unknown
  ): Promise<void> {
    assertNonEmpty(userId, "userId");
    assertNonEmpty(tenantId, "tenantId");

    if (unreadMessageCount < 0) {
      throw new Error("unreadMessageCount cannot be negative");
    }

    const accessId = buildAccessId(userId, tenantId);
    const ref = doc(db, COLLECTION, accessId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error(`User tenant access ${accessId} not found`);
    }

    await updateDoc(ref, {
      unreadMessageCount,
      lastMessageAt,
      updatedAt: serverTimestamp(),
    });
  }

  async function getUserTenants(userId: string): Promise<UserTenantAccess[]> {
    assertNonEmpty(userId, "userId");

    const snapshot = await getDocs(query(collection(db, COLLECTION), where("userId", "==", userId)));
    return snapshot.docs.map((docSnap) => docSnap.data() as UserTenantAccess);
  }

  async function getTenantUsers(tenantId: string): Promise<UserTenantAccess[]> {
    assertNonEmpty(tenantId, "tenantId");

    const snapshot = await getDocs(query(collection(db, COLLECTION), where("tenantId", "==", tenantId)));
    return snapshot.docs.map((docSnap) => docSnap.data() as UserTenantAccess);
  }

  async function deactivateUserTenantAccess(userId: string, tenantId: string): Promise<void> {
    assertNonEmpty(userId, "userId");
    assertNonEmpty(tenantId, "tenantId");

    const accessId = buildAccessId(userId, tenantId);
    const ref = doc(db, COLLECTION, accessId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error(`User tenant access ${accessId} not found`);
    }

    await updateDoc(ref, {
      status: "inactive",
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Updates the next upcoming confirmed appointment fields on a user's access
   * record for a given tenant.  Pass null for both `at` and `serviceName` to
   * clear the fields (e.g. after a booking is cancelled).
   */
  async function updateNextAppointment(
    userId: string,
    tenantId: string,
    at: unknown,
    serviceName: string | null,
  ): Promise<void> {
    assertNonEmpty(userId, "userId");
    assertNonEmpty(tenantId, "tenantId");

    const accessId = buildAccessId(userId, tenantId);
    const ref = doc(db, COLLECTION, accessId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error(`User tenant access ${accessId} not found`);
    }

    await updateDoc(ref, {
      nextAppointmentAt: at,
      nextAppointmentServiceName: serviceName,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Real-time subscription: fires immediately with current data, then on every
   * change to the user's access records.  Returns an unsubscribe function.
   */
  function subscribeUserTenants(
    userId: string,
    onChange: (accesses: UserTenantAccess[]) => void,
  ): Unsubscribe {
    assertNonEmpty(userId, "userId");
    const q = query(collection(db, COLLECTION), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const accesses = snapshot.docs.map((d) => d.data() as UserTenantAccess);
      onChange(accesses);
    });
  }

  return {
    createUserTenantAccess,
    updateUnreadMessageCount,
    updateNextAppointment,
    getUserTenants,
    getTenantUsers,
    deactivateUserTenantAccess,
    subscribeUserTenants,
  };
}

export type UserTenantAccessRepository = ReturnType<typeof createUserTenantAccessRepository>;
