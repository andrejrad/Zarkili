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
  AssignTenantUserInput,
  BillingCycle,
  SubscriptionStatus,
  SubscriptionTier,
  TenantUser,
  TenantUserRole,
  UpdateTenantUserRoleInput,
} from "./tenantUsersModel";

const COLLECTION = "tenantUsers";

const tenantUserRoles: TenantUserRole[] = [
  "tenant_owner",
  "tenant_admin",
  "location_manager",
  "technician",
  "client",
];

const subscriptionTiers: SubscriptionTier[] = ["starter", "professional", "enterprise"];
const subscriptionStatuses: SubscriptionStatus[] = [
  "trialing",
  "active",
  "past_due",
  "suspended",
  "cancelled",
];
const billingCycles: BillingCycle[] = ["monthly", "annual"];

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

function assertRole(value: string, field: string): asserts value is TenantUserRole {
  if (!tenantUserRoles.includes(value as TenantUserRole)) {
    throw new Error(`${field} is invalid`);
  }
}

function assertSubscriptionShape(input: AssignTenantUserInput): void {
  const subscription = input.subscription;

  if (!subscriptionTiers.includes(subscription.tier)) {
    throw new Error("subscription.tier is invalid");
  }

  if (!subscriptionStatuses.includes(subscription.status)) {
    throw new Error("subscription.status is invalid");
  }

  if (!billingCycles.includes(subscription.billingCycle)) {
    throw new Error("subscription.billingCycle is invalid");
  }

  if (!subscription.startDate) {
    throw new Error("subscription.startDate is required");
  }

  if (subscription.status === "trialing" && !subscription.trialEndsAt) {
    throw new Error("subscription.trialEndsAt is required for trialing status");
  }

  if (
    (subscription.status === "active" || subscription.status === "past_due") &&
    !subscription.nextBillingDate
  ) {
    throw new Error("subscription.nextBillingDate is required for active or past_due status");
  }

  if (subscription.status === "suspended") {
    if (!subscription.suspendedAt) {
      throw new Error("subscription.suspendedAt is required for suspended status");
    }
    if (!subscription.suspensionReason?.trim()) {
      throw new Error("subscription.suspensionReason is required for suspended status");
    }
  }
}

function assertRoleTransitionAllowed(
  currentRole: TenantUserRole,
  input: UpdateTenantUserRoleInput
): void {
  const { actorRole, nextRole } = input;

  if (actorRole !== "tenant_owner" && actorRole !== "tenant_admin") {
    throw new Error("Only tenant_owner or tenant_admin can change roles");
  }

  if (actorRole === "tenant_admin" && (currentRole === "tenant_owner" || nextRole === "tenant_owner")) {
    throw new Error("tenant_admin cannot change tenant_owner role");
  }

  if (currentRole === nextRole) {
    throw new Error("Role transition is invalid: role is unchanged");
  }
}

function validateAssignInput(input: AssignTenantUserInput): void {
  assertNonEmpty(input.tenantId, "tenantId");
  assertNonEmpty(input.userId, "userId");
  assertRole(input.role, "role");

  if (!Array.isArray(input.permissions)) {
    throw new Error("permissions must be an array");
  }

  if (input.status !== "active" && input.status !== "inactive") {
    throw new Error("status is invalid");
  }

  assertSubscriptionShape(input);
}

export function createTenantUsersRepository(db: Firestore) {
  async function assignUserToTenant(
    membershipId: string,
    input: AssignTenantUserInput
  ): Promise<TenantUser> {
    assertNonEmpty(membershipId, "membershipId");
    validateAssignInput(input);

    const ref = doc(db, COLLECTION, membershipId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`Tenant user with id ${membershipId} already exists`);
    }

    await setDoc(ref, {
      membershipId,
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const snapshot = await getDoc(ref);
    return snapshot.data() as TenantUser;
  }

  async function updateTenantUserRole(
    membershipId: string,
    input: UpdateTenantUserRoleInput
  ): Promise<void> {
    assertNonEmpty(membershipId, "membershipId");
    assertRole(input.actorRole, "actorRole");
    assertRole(input.nextRole, "nextRole");

    const ref = doc(db, COLLECTION, membershipId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error(`Tenant user ${membershipId} not found`);
    }

    const existing = snapshot.data() as TenantUser;
    assertRoleTransitionAllowed(existing.role, input);

    await updateDoc(ref, {
      role: input.nextRole,
      updatedAt: serverTimestamp(),
    });
  }

  async function listTenantUsers(tenantId: string): Promise<TenantUser[]> {
    assertNonEmpty(tenantId, "tenantId");

    const snapshot = await getDocs(query(collection(db, COLLECTION), where("tenantId", "==", tenantId)));
    return snapshot.docs.map((docSnap) => docSnap.data() as TenantUser);
  }

  async function getUserTenantRoles(userId: string): Promise<TenantUser[]> {
    assertNonEmpty(userId, "userId");

    const snapshot = await getDocs(query(collection(db, COLLECTION), where("userId", "==", userId)));
    return snapshot.docs.map((docSnap) => docSnap.data() as TenantUser);
  }

  return {
    assignUserToTenant,
    updateTenantUserRole,
    listTenantUsers,
    getUserTenantRoles,
  };
}

export type TenantUsersRepository = ReturnType<typeof createTenantUsersRepository>;
