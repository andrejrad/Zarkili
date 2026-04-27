import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Wizard steps
// ---------------------------------------------------------------------------

export const ONBOARDING_STEPS = [
  "ACCOUNT",
  "BUSINESS_PROFILE",
  "PAYMENT_SETUP",
  "SERVICES",
  "STAFF",
  "POLICIES",
  "AVAILABILITY",
  "MARKETPLACE_VISIBILITY",
  "VERIFICATION",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type OnboardingStepStatus = "pending" | "in_progress" | "completed" | "skipped";

// ---------------------------------------------------------------------------
// Go-live blockers
// ---------------------------------------------------------------------------

/**
 * Steps that MUST be "completed" before a salon can go live.
 * A missing or incomplete step in this list blocks launch.
 */
export const GO_LIVE_REQUIRED_STEPS: OnboardingStep[] = [
  "BUSINESS_PROFILE",
  "SERVICES",
  "AVAILABILITY",
];

export type GoLiveBlocker = {
  step: OnboardingStep;
  reason: string;
};

// ---------------------------------------------------------------------------
// Wizard state
// ---------------------------------------------------------------------------

export type SalonOnboardingState = {
  tenantId: string;
  stepStatuses: Record<OnboardingStep, OnboardingStepStatus>;
  currentStep: OnboardingStep;
  /** 0–100 score based on completed steps */
  completionScore: number;
  /** Empty array when all required steps are completed */
  blockers: GoLiveBlocker[];
  canGoLive: boolean;
  startedAt: Timestamp;
  updatedAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the default step-status map with every step set to "pending".
 */
export function buildInitialStepStatuses(): Record<OnboardingStep, OnboardingStepStatus> {
  return Object.fromEntries(
    ONBOARDING_STEPS.map((s) => [s, "pending" as OnboardingStepStatus]),
  ) as Record<OnboardingStep, OnboardingStepStatus>;
}

/**
 * Compute the completion score (0–100) from current step statuses.
 */
export function computeCompletionScore(
  statuses: Record<OnboardingStep, OnboardingStepStatus>,
): number {
  const total = ONBOARDING_STEPS.length;
  const done = ONBOARDING_STEPS.filter((s) => statuses[s] === "completed").length;
  return Math.round((done / total) * 100);
}

/**
 * Derive go-live blockers from current step statuses.
 */
export function deriveBlockers(
  statuses: Record<OnboardingStep, OnboardingStepStatus>,
): GoLiveBlocker[] {
  return GO_LIVE_REQUIRED_STEPS.filter((step) => statuses[step] !== "completed").map((step) => ({
    step,
    reason: `Step "${step}" must be completed before going live`,
  }));
}

// ---------------------------------------------------------------------------
// W15.1 — Wizard drafts: versioned per-step payload persistence
// ---------------------------------------------------------------------------

/**
 * Schema version for persisted wizard drafts.
 * Bump when incompatible changes are introduced to a step's required fields.
 */
export const WIZARD_SCHEMA_VERSION = 1;

/** Per-step draft document shape. */
export type WizardStepDraft = {
  tenantId: string;
  step: OnboardingStep;
  schemaVersion: number;
  payload: Record<string, unknown>;
  updatedAt: Timestamp;
};

/** Step-specific guidance shown to the salon owner inside the wizard. */
export const STEP_GUIDANCE: Record<OnboardingStep, string> = {
  ACCOUNT: "Confirm the owner email and contact phone for your salon account.",
  BUSINESS_PROFILE: "Add the salon legal name, brand name, address and primary contact details.",
  PAYMENT_SETUP: "Connect a Stripe account so the salon can collect bookings and payouts.",
  SERVICES: "Publish at least one bookable service with duration and price.",
  STAFF: "Invite at least one staff member or assign yourself as the practitioner.",
  POLICIES: "Set cancellation, no-show and deposit policies for clients.",
  AVAILABILITY: "Define opening hours and per-staff availability so clients can book.",
  MARKETPLACE_VISIBILITY: "Choose whether the salon is publicly listed in the discovery feed.",
  VERIFICATION: "Submit identity / business documents for platform verification.",
};

/** Per-step required-field list for validation. Empty array means no required fields. */
export const STEP_REQUIRED_FIELDS: Record<OnboardingStep, string[]> = {
  ACCOUNT: ["ownerEmail"],
  BUSINESS_PROFILE: ["legalName", "addressLine1", "city", "country"],
  PAYMENT_SETUP: ["stripeAccountId"],
  SERVICES: ["services"],
  STAFF: ["staff"],
  POLICIES: ["cancellationPolicy"],
  AVAILABILITY: ["weekTemplate"],
  MARKETPLACE_VISIBILITY: ["isListed"],
  VERIFICATION: ["documents"],
};

export type StepValidationResult = {
  ok: boolean;
  missingFields: string[];
};

/**
 * Validate a step payload against its required-field list.
 * Pure function — no I/O. Returns ok=true only when all required fields
 * are present and non-empty (non-empty array, non-empty string, non-null primitive).
 */
export function validateStepPayload(
  step: OnboardingStep,
  payload: Record<string, unknown> | null | undefined,
): StepValidationResult {
  const required = STEP_REQUIRED_FIELDS[step] ?? [];
  if (!payload || typeof payload !== "object") {
    return { ok: required.length === 0, missingFields: [...required] };
  }

  const missing: string[] = [];
  for (const field of required) {
    const value = (payload as Record<string, unknown>)[field];
    if (value === undefined || value === null) {
      missing.push(field);
      continue;
    }
    if (typeof value === "string" && value.trim().length === 0) {
      missing.push(field);
      continue;
    }
    if (Array.isArray(value) && value.length === 0) {
      missing.push(field);
      continue;
    }
  }

  return { ok: missing.length === 0, missingFields: missing };
}

// ---------------------------------------------------------------------------
// W15.2 — Admin operations + audit timeline
// ---------------------------------------------------------------------------

export type OnboardingAdminAction =
  | "extend_trial"
  | "reset_step"
  | "verification_override"
  | "manual_advance";

export type OnboardingTimelineEvent = {
  eventId: string;
  tenantId: string;
  action: OnboardingAdminAction;
  actorUserId: string;
  actorRole: "platform_admin" | "tenant_owner";
  reason: string;
  /** Free-form structured payload describing the change (e.g. { step, daysAdded }). */
  details: Record<string, unknown>;
  createdAt: Timestamp;
};
