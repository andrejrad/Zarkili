import { Timestamp } from "firebase/firestore";

export type TenantUserRole =
  | "tenant_owner"
  | "tenant_admin"
  | "location_manager"
  | "technician"
  | "client";

export type SubscriptionTier = "starter" | "professional" | "enterprise";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled";

export type BillingCycle = "monthly" | "annual";

export type TenantUserSubscription = {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: Timestamp;
  trialEndsAt: Timestamp | null;
  nextBillingDate: Timestamp | null;
  suspendedAt: Timestamp | null;
  suspensionReason: string | null;
};

export type TenantUser = {
  membershipId: string;
  tenantId: string;
  userId: string;
  role: TenantUserRole;
  permissions: string[];
  status: "active" | "inactive";
  subscription: TenantUserSubscription;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type AssignTenantUserInput = Omit<
  TenantUser,
  "membershipId" | "createdAt" | "updatedAt"
>;

export type UpdateTenantUserRoleInput = {
  actorRole: TenantUserRole;
  nextRole: TenantUserRole;
};
