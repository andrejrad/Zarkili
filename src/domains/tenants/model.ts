import { Timestamp } from "firebase/firestore";

export type TenantStatus = "active" | "suspended" | "inactive";

export type TenantPlan = "free_trial" | "starter" | "professional" | "enterprise";

export type TenantBranding = {
  logoUrl: string | null;
  primary: string;
  secondary: string;
  accent: string;
  fontHeading: string;
  fontBody: string;
  radius: number;
};

export type TenantSettings = {
  bookingLeadHours: number;
  bookingMaxDays: number;
  cancellationWindowHours: number;
  allowGuestBooking: boolean;
  requireDeposit: boolean;
};

export type Tenant = {
  tenantId: string;
  name: string;
  slug: string;
  status: TenantStatus;
  ownerUserId: string;
  plan: TenantPlan;
  country: string;
  defaultLanguage: string;
  defaultCurrency: string;
  timezone: string;
  branding: TenantBranding;
  settings: TenantSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateTenantInput = Omit<Tenant, "tenantId" | "createdAt" | "updatedAt">;

export type UpdateTenantInput = Partial<
  Pick<Tenant, "name" | "slug" | "status" | "plan" | "country" | "defaultLanguage" | "defaultCurrency" | "timezone" | "branding" | "settings">
>;
