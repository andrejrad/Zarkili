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
  photoUrl: string | null;
  role: StaffRole;
  status: StaffStatus;
  skills: string[];
  specialtyTags: string[];
  serviceIds: string[];
  constraints: StaffConstraint[];
  // Derived aggregate written by Cloud Functions
  averageRating: number | null;
  reviewCount: number;
  ratingSum: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateStaffInput = Omit<
  StaffMember,
  "staffId" | "createdAt" | "updatedAt" | "averageRating" | "reviewCount" | "ratingSum"
>;

export type UpdateStaffInput = Partial<
  Pick<
    StaffMember,
    | "locationIds"
    | "displayName"
    | "photoUrl"
    | "role"
    | "status"
    | "skills"
    | "specialtyTags"
    | "serviceIds"
    | "constraints"
  >
>;
