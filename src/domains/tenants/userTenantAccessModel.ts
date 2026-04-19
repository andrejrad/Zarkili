import { Timestamp } from "firebase/firestore";

export type UserTenantAccess = {
  accessId: string;
  userId: string;
  tenantId: string;
  accessLevel: "owner" | "admin" | "manager" | "technician" | "client";
  subscriptionStatus: "trialing" | "active" | "past_due" | "suspended" | "cancelled";
  subscribedAt: Timestamp;
  unreadMessageCount: number;
  lastMessageAt: Timestamp | null;
  lastAccessedAt: Timestamp | null;
  status: "active" | "inactive";
  updatedAt: Timestamp;
};

export type CreateUserTenantAccessInput = Omit<
  UserTenantAccess,
  "accessId" | "updatedAt"
>;
