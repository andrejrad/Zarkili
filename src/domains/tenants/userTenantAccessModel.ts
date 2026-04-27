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
  /** Timestamp of the user's next upcoming confirmed appointment at this tenant. */
  nextAppointmentAt: Timestamp | null;
  /** Display name of the service for the next appointment (e.g. "Haircut"). */
  nextAppointmentServiceName: string | null;
  status: "active" | "inactive";
  updatedAt: Timestamp;
};

export type CreateUserTenantAccessInput = Omit<
  UserTenantAccess,
  "accessId" | "updatedAt"
>;
