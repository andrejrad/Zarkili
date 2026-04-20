import { Timestamp } from "firebase/firestore";

export type StaffRole = "owner" | "manager" | "technician" | "assistant";

export type StaffStatus = "active" | "inactive";

export type StaffConstraint = {
  key: string;
  value: string | number | boolean;
};

export type StaffMember = {
  staffId: string;
  tenantId: string;
  locationIds: string[];
  userId: string;
  displayName: string;
  role: StaffRole;
  status: StaffStatus;
  skills: string[];
  serviceIds: string[];
  constraints: StaffConstraint[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateStaffInput = Omit<StaffMember, "staffId" | "createdAt" | "updatedAt">;

export type UpdateStaffInput = Partial<
  Pick<
    StaffMember,
    | "locationIds"
    | "displayName"
    | "role"
    | "status"
    | "skills"
    | "serviceIds"
    | "constraints"
  >
>;
