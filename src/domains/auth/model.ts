export type AuthSession = {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

export type TenantRole =
  | "platform_admin"
  | "tenant_owner"
  | "tenant_admin"
  | "location_manager"
  | "technician"
  | "client";

export type TenantMembership = {
  membershipId: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  status: "active" | "inactive";
};

export type SignInInput = {
  email: string;
  password: string;
};

export type CreateAccountInput = SignInInput;

export type UpdateProfileInput = {
  firstName: string;
  lastName: string;
};

export type UpdateEmailInput = {
  email: string;
};

export type PasswordResetInput = {
  email: string;
};

export type OnboardingFlowType = "salon" | "client";

export type OnboardingDraftStatus = "draft" | "submitted";

export type OnboardingDraft = {
  draftId: string;
  tenantId: string;
  userId: string;
  flowType: OnboardingFlowType;
  schemaVersion: number;
  status: OnboardingDraftStatus;
  currentStep: string;
  payload: Record<string, unknown>;
  createdAt: unknown;
  updatedAt: unknown;
};

export type SaveOnboardingDraftInput = {
  tenantId: string;
  userId: string;
  flowType: OnboardingFlowType;
  schemaVersion?: number;
  currentStep: string;
  payload: Record<string, unknown>;
};
