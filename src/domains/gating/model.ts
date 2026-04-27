/**
 * Feature gating — domain model (Task 14.2)
 *
 * Inputs:
 *   - Subscription.status (Week 13.1) — trialing | active | past_due | suspended | cancelled
 *   - Trial.status       (Week 14.1)  — not_started | active | expiring_soon | expired | upgraded
 *   - ConnectAccount.status (Week 13.2 — informational, not gated here)
 *
 * Output: a deterministic decision per feature group
 *   - allow                                 — full access
 *   - allow_with_warning (banner)           — past_due grace window OR expiring_soon trial
 *   - deny                                  — suspended/cancelled/expired
 *
 * Past-due grace period:
 *   Tenants in `past_due` keep access for `PAST_DUE_GRACE_DAYS` after
 *   `pastDueSince`. After the grace window, gates flip to deny and the admin
 *   shell renders the suspension banner + upgrade CTA.
 *
 * Denials produce `GateDenialAuditEvent` records — the caller is expected to
 * persist them (no I/O in this layer).
 */

import type { Timestamp } from "firebase/firestore";

import type { Subscription, SubscriptionStatus } from "../billing/model";
import type { Trial, TrialStatus } from "../trial/model";

// ---------------------------------------------------------------------------
// Feature groups
// ---------------------------------------------------------------------------

export type FeatureGroup =
  | "booking_creation"
  | "marketplace_visibility"
  | "outbound_campaigns"
  | "advanced_analytics"
  | "ai_automations";

export const FEATURE_GROUPS: readonly FeatureGroup[] = [
  "booking_creation",
  "marketplace_visibility",
  "outbound_campaigns",
  "advanced_analytics",
  "ai_automations",
] as const;

// ---------------------------------------------------------------------------
// Decision surface
// ---------------------------------------------------------------------------

export type GateOutcome = "allow" | "allow_with_warning" | "deny";

export type GateReason =
  | "active"
  | "trialing"
  | "trial_expiring_soon"
  | "trial_expired"
  | "trial_not_started"
  | "past_due_in_grace"
  | "past_due_grace_exhausted"
  | "suspended"
  | "cancelled"
  | "no_subscription";

export type GateDecision = {
  feature: FeatureGroup;
  outcome: GateOutcome;
  reason: GateReason;
  /** Empty for `allow`; populated for warnings and denials. */
  message: string;
  /** Echoed back so callers can correlate; mirrors Subscription.status. */
  subscriptionStatus: SubscriptionStatus | null;
  trialStatus: TrialStatus | null;
};

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const PAST_DUE_GRACE_DAYS = 7;

const SECONDS_PER_DAY = 86_400;

/**
 * Per-feature policy overrides. By default every feature follows the same
 * gating rules; entries here let us tighten/loosen specific groups (e.g.
 * keep `booking_creation` available longer to avoid breaking client flow,
 * or lock `outbound_campaigns` immediately on past_due).
 */
const PER_FEATURE_POLICY: Record<FeatureGroup, { revokeOnPastDue?: boolean }> = {
  booking_creation: { revokeOnPastDue: false },
  marketplace_visibility: { revokeOnPastDue: false },
  outbound_campaigns: { revokeOnPastDue: true },
  advanced_analytics: { revokeOnPastDue: false },
  ai_automations: { revokeOnPastDue: true },
};

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export type GateDenialAuditEvent = {
  tenantId: string;
  userId: string | null;
  feature: FeatureGroup;
  outcome: Exclude<GateOutcome, "allow">;
  reason: GateReason;
  subscriptionStatus: SubscriptionStatus | null;
  trialStatus: TrialStatus | null;
  attemptedAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Core decision function
// ---------------------------------------------------------------------------

export type GateContext = {
  subscription: Subscription | null;
  trial: Trial | null;
  now: Timestamp;
};

export function decideGate(feature: FeatureGroup, ctx: GateContext): GateDecision {
  const sub = ctx.subscription;
  const trial = ctx.trial;
  const subStatus = sub?.status ?? null;
  const trialStatus = trial?.status ?? null;

  // No subscription record yet → fall back on trial state.
  if (!sub) {
    return decideFromTrial(feature, trial, ctx.now);
  }

  switch (sub.status) {
    case "active":
      return allow(feature, "active", subStatus, trialStatus);
    case "trialing":
      return decideFromTrial(feature, trial, ctx.now, subStatus);
    case "past_due":
      return decidePastDue(feature, sub, ctx.now, trialStatus);
    case "suspended":
      return deny(feature, "suspended", subStatus, trialStatus,
        "Your subscription is suspended. Update your payment method to restore access.");
    case "cancelled":
      return deny(feature, "cancelled", subStatus, trialStatus,
        "Your subscription has been cancelled.");
    default: {
      const exhaustive: never = sub.status;
      throw new Error(`Unhandled subscription status ${String(exhaustive)}`);
    }
  }
}

function decideFromTrial(
  feature: FeatureGroup,
  trial: Trial | null,
  _now: Timestamp,
  subStatus: SubscriptionStatus | null = null,
): GateDecision {
  if (!trial || trial.status === "not_started") {
    return deny(feature, "trial_not_started", subStatus, trial?.status ?? null,
      "Activate your free trial to use this feature.");
  }
  switch (trial.status) {
    case "active":
      return allow(feature, "trialing", subStatus, trial.status);
    case "expiring_soon":
      return warn(feature, "trial_expiring_soon", subStatus, trial.status,
        "Your free trial ends soon. Upgrade to keep access without interruption.");
    case "expired":
      return deny(feature, "trial_expired", subStatus, trial.status,
        "Your free trial has expired. Upgrade to continue using this feature.");
    case "upgraded":
      // Upgrade should produce an active subscription; if Subscription is
      // missing we still allow (the webhook hasn't landed yet).
      return allow(feature, "active", subStatus, trial.status);
    default: {
      const exhaustive: never = trial.status;
      throw new Error(`Unhandled trial status ${String(exhaustive)}`);
    }
  }
}

function decidePastDue(
  feature: FeatureGroup,
  sub: Subscription,
  now: Timestamp,
  trialStatus: TrialStatus | null,
): GateDecision {
  const policy = PER_FEATURE_POLICY[feature];
  const since = sub.pastDueSince;
  if (!since) {
    // Defensive: missing pastDueSince — treat as just-entered.
    return warn(feature, "past_due_in_grace", sub.status, trialStatus,
      "Payment failed. Update your payment method to avoid suspension.");
  }
  const elapsedDays = (now.seconds - since.seconds) / SECONDS_PER_DAY;
  if (elapsedDays > PAST_DUE_GRACE_DAYS || policy.revokeOnPastDue) {
    return deny(feature, "past_due_grace_exhausted", sub.status, trialStatus,
      "Payment failed and the grace window has ended. Update your payment method to restore access.");
  }
  return warn(feature, "past_due_in_grace", sub.status, trialStatus,
    "Payment failed. Update your payment method to avoid suspension.");
}

// ---------------------------------------------------------------------------
// Result helpers
// ---------------------------------------------------------------------------

function allow(
  feature: FeatureGroup,
  reason: GateReason,
  subStatus: SubscriptionStatus | null,
  trialStatus: TrialStatus | null,
): GateDecision {
  return { feature, outcome: "allow", reason, message: "", subscriptionStatus: subStatus, trialStatus };
}

function warn(
  feature: FeatureGroup,
  reason: GateReason,
  subStatus: SubscriptionStatus | null,
  trialStatus: TrialStatus | null,
  message: string,
): GateDecision {
  return {
    feature,
    outcome: "allow_with_warning",
    reason,
    message,
    subscriptionStatus: subStatus,
    trialStatus,
  };
}

function deny(
  feature: FeatureGroup,
  reason: GateReason,
  subStatus: SubscriptionStatus | null,
  trialStatus: TrialStatus | null,
  message: string,
): GateDecision {
  return {
    feature,
    outcome: "deny",
    reason,
    message,
    subscriptionStatus: subStatus,
    trialStatus,
  };
}

// ---------------------------------------------------------------------------
// Audit factory
// ---------------------------------------------------------------------------

export function buildDenialAudit(
  tenantId: string,
  userId: string | null,
  decision: GateDecision,
  attemptedAt: Timestamp,
): GateDenialAuditEvent | null {
  if (decision.outcome === "allow") return null;
  return {
    tenantId,
    userId,
    feature: decision.feature,
    outcome: decision.outcome,
    reason: decision.reason,
    subscriptionStatus: decision.subscriptionStatus,
    trialStatus: decision.trialStatus,
    attemptedAt,
  };
}
