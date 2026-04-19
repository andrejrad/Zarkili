import type {
  OnboardingDraft,
  OnboardingFlowType,
  SaveOnboardingDraftInput,
} from "./model";

export const CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION = 2;

const salonSteps = [
  "account",
  "business-profile",
  "payment-setup",
  "services",
  "staff",
  "policies",
  "availability",
  "marketplace",
  "verification",
] as const;

const clientSteps = [
  "account",
  "phone-verify",
  "profile",
  "payment-method",
  "preferences",
  "notifications",
  "loyalty",
] as const;

const flowStepsByType: Record<OnboardingFlowType, readonly string[]> = {
  salon: salonSteps,
  client: clientSteps,
};

type PayloadValidator = (payload: Record<string, unknown>) => boolean;

const payloadValidatorsByStep: Record<string, PayloadValidator> = {
  account: (payload) => typeof payload.email === "string" || typeof payload.phone === "string",
  "business-profile": (payload) => typeof payload.businessName === "string",
  "payment-setup": (payload) => typeof payload.provider === "string",
  services: (payload) => Array.isArray(payload.services),
  staff: (payload) => Array.isArray(payload.staff),
  policies: (payload) => typeof payload.cancellationWindowHours === "number",
  availability: (payload) => payload.schedule != null,
  marketplace: (payload) => typeof payload.listingEnabled === "boolean",
  verification: (payload) => typeof payload.confirmed === "boolean",
  "phone-verify": (payload) => typeof payload.phoneVerified === "boolean",
  profile: (payload) => typeof payload.firstName === "string",
  "payment-method": (payload) => typeof payload.methodType === "string",
  preferences: (payload) => typeof payload.language === "string",
  notifications: (payload) => typeof payload.pushEnabled === "boolean",
  loyalty: (payload) => typeof payload.optIn === "boolean",
};

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

function migrateBusinessProfilePayloadV1ToV2(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const businessName = payload.businessName;
  if (typeof businessName === "string" && typeof payload.displayName !== "string") {
    return {
      ...payload,
      displayName: businessName,
    };
  }

  return payload;
}

function migrateProfilePayloadV1ToV2(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const firstName = payload.firstName;
  if (typeof firstName === "string" && typeof payload.fullName !== "string") {
    return {
      ...payload,
      fullName: firstName,
    };
  }

  return payload;
}

function migratePayloadByStepToV2(
  step: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  if (step === "business-profile") {
    return migrateBusinessProfilePayloadV1ToV2(payload);
  }

  if (step === "profile") {
    return migrateProfilePayloadV1ToV2(payload);
  }

  return payload;
}

export function validateOnboardingDraftInput(input: SaveOnboardingDraftInput): void {
  assertNonEmpty(input.tenantId, "tenantId");
  assertNonEmpty(input.userId, "userId");
  assertNonEmpty(input.currentStep, "currentStep");

  const allowedSteps = flowStepsByType[input.flowType] ?? [];
  if (!allowedSteps.includes(input.currentStep)) {
    throw new Error(`Step '${input.currentStep}' is not valid for flow '${input.flowType}'`);
  }

  const validator = payloadValidatorsByStep[input.currentStep];
  if (!validator || !validator(input.payload)) {
    throw new Error(`Payload is invalid for step '${input.currentStep}'`);
  }

  if (
    input.schemaVersion != null &&
    (input.schemaVersion < 1 || !Number.isInteger(input.schemaVersion))
  ) {
    throw new Error("schemaVersion must be a positive integer");
  }
}

export function migrateOnboardingDraftToCurrentVersion(draft: OnboardingDraft): OnboardingDraft {
  const sourceVersion = draft.schemaVersion || 1;

  if (sourceVersion > CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported onboarding draft schema version: ${sourceVersion}`
    );
  }

  if (sourceVersion === CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION) {
    return draft;
  }

  let migrated = {
    ...draft,
    schemaVersion: sourceVersion,
  };

  for (let version = sourceVersion; version < CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION; version += 1) {
    if (version === 1) {
      migrated = {
        ...migrated,
        payload: migratePayloadByStepToV2(migrated.currentStep, migrated.payload),
        schemaVersion: 2,
      };
    }
  }

  return migrated;
}

export function getFlowSteps(flowType: OnboardingFlowType): readonly string[] {
  return flowStepsByType[flowType] ?? [];
}
