/**
 * Free Trial — domain model (Task 14.1)
 *
 * Sits next to billing.Subscription but tracks trial-specific state separately
 * so we can drive admin UX (banners, countdown) and analytics without
 * conflating Stripe subscription status with onboarding lifecycle.
 *
 * State machine:
 *   not_started ─activate→ active
 *   active ─tick→ expiring_soon (when ≤ 3 days remain)
 *   active|expiring_soon ─tick→ expired   (when trialEndsAt < now)
 *   active|expiring_soon ─upgrade→ upgraded (paid plan attached)
 *   expired ─upgrade→ upgraded (recoverable until grace ends)
 *
 * Once a trial is `upgraded` or `expired`, it does not return to `active`
 * (a new trial would require an admin override + a new Trial record).
 */

import type { Timestamp } from "firebase/firestore";

export type TrialStatus =
  | "not_started"
  | "active"
  | "expiring_soon"
  | "expired"
  | "upgraded";

export const TRIAL_STATUSES: readonly TrialStatus[] = [
  "not_started",
  "active",
  "expiring_soon",
  "expired",
  "upgraded",
] as const;

/** Default trial length per spec. */
export const DEFAULT_TRIAL_DAYS = 14;

/** Window before expiry that flips status to expiring_soon. */
export const EXPIRING_SOON_WINDOW_DAYS = 3;

const SECONDS_PER_DAY = 86_400;

// ---------------------------------------------------------------------------
// Trial record
// ---------------------------------------------------------------------------

export type Trial = {
  tenantId: string;
  status: TrialStatus;
  /** Trial length in days at the time of activation (audit + analytics). */
  trialLengthDays: number;
  /** Set when status moves out of not_started. */
  startedAt: Timestamp | null;
  /** Computed at activation as startedAt + trialLengthDays. */
  endsAt: Timestamp | null;
  /** Stamped when status flips to expired. */
  expiredAt: Timestamp | null;
  /** Stamped when the tenant upgrades to a paid plan. */
  upgradedAt: Timestamp | null;
  /** Stripe subscription id that consumed/closed the trial (if upgraded). */
  upgradeSubscriptionId: string | null;
  /**
   * Last expiry-job run id (epoch-second bucket). Stops the same job from
   * re-firing the same transition twice.
   */
  lastJobRunId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Activation trigger inputs
// ---------------------------------------------------------------------------

export type ActivationContext = {
  /** Onboarding wizard completed (Phase 2 W15). */
  onboardingComplete: boolean;
  /** Tenant has performed launch activation (e.g. published profile). */
  launchActivated: boolean;
};

export function canActivate(ctx: ActivationContext): boolean {
  return ctx.onboardingComplete && ctx.launchActivated;
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<TrialStatus, readonly TrialStatus[]> = {
  not_started: ["not_started", "active"],
  active: ["active", "expiring_soon", "expired", "upgraded"],
  expiring_soon: ["expiring_soon", "expired", "upgraded"],
  expired: ["expired", "upgraded"],
  upgraded: ["upgraded"],
};

export function isValidTrialTransition(from: TrialStatus, to: TrialStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

export function addDays(t: Timestamp, days: number): Timestamp {
  return { seconds: t.seconds + days * SECONDS_PER_DAY, nanoseconds: 0 } as unknown as Timestamp;
}

export function daysBetween(later: Timestamp, earlier: Timestamp): number {
  return (later.seconds - earlier.seconds) / SECONDS_PER_DAY;
}

/** Compute the status implied by a Trial + the current time (no I/O). */
export function deriveTrialStatusAt(trial: Trial, now: Timestamp): TrialStatus {
  if (trial.status === "upgraded") return "upgraded";
  if (trial.status === "not_started") return "not_started";
  if (!trial.endsAt) return trial.status;
  if (trial.endsAt.seconds <= now.seconds) return "expired";
  const remainingDays = daysBetween(trial.endsAt, now);
  if (remainingDays <= EXPIRING_SOON_WINDOW_DAYS) return "expiring_soon";
  return "active";
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type TrialErrorCode =
  | "INVALID_TRANSITION"
  | "ACTIVATION_BLOCKED"
  | "TRIAL_NOT_FOUND"
  | "ALREADY_ACTIVATED"
  | "INVALID_TRIAL_LENGTH";

export class TrialError extends Error {
  constructor(
    public readonly code: TrialErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TrialError";
  }
}
