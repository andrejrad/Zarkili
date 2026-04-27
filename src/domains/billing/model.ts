import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Plans and intervals
// ---------------------------------------------------------------------------

export type BillingPlanId = "starter" | "professional" | "enterprise";

export type PlanInterval = "monthly" | "annual";

// ---------------------------------------------------------------------------
// Subscription status
// ---------------------------------------------------------------------------
//
// Normalized status surface (kept minimal per Task 13.1):
//   trialing   — created with a trial period; no successful charge yet
//   active     — paid and current
//   past_due   — last invoice failed; in dunning grace window
//   suspended  — past_due grace exhausted (or admin action); access gated
//   cancelled  — terminal; subscription ended
//
// Stripe sub-statuses such as `incomplete`, `incomplete_expired`,
// `unpaid`, and `paused` map into this surface (see STRIPE_TO_INTERNAL_STATUS).
//

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled";

export const SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = [
  "trialing",
  "active",
  "past_due",
  "suspended",
  "cancelled",
] as const;

// ---------------------------------------------------------------------------
// Subscription record (normalized — single active subscription per tenant)
// ---------------------------------------------------------------------------

export type Subscription = {
  tenantId: string;
  /** Stripe customer id (cus_…) for the tenant. */
  stripeCustomerId: string;
  /** Stripe subscription id (sub_…). */
  stripeSubscriptionId: string;
  planId: BillingPlanId;
  interval: PlanInterval;
  status: SubscriptionStatus;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  /** Set while in trial; null after trial ends or if no trial offered. */
  trialEndsAt: Timestamp | null;
  /** First time the subscription entered past_due (cleared on recovery). */
  pastDueSince: Timestamp | null;
  /** Last successfully applied Stripe webhook event id (for audit). */
  lastEventId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Webhook event envelope (subset — only fields we use in domain layer)
// ---------------------------------------------------------------------------

export type StripeWebhookEventType =
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "customer.subscription.trial_will_end"
  | "invoice.payment_failed"
  | "invoice.payment_succeeded";

export type StripeSubscriptionPayload = {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  planId: BillingPlanId;
  interval: PlanInterval;
  /** Raw Stripe status string. */
  stripeStatus: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  trialEndsAt: Timestamp | null;
};

export type StripeInvoicePayload = {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  /** "paid" | "open" | "void" | "uncollectible" — only paid/uncollectible used. */
  invoiceStatus: string;
};

export type StripeWebhookEvent = {
  /** Stripe event id (evt_…). Used as idempotency key. */
  id: string;
  type: StripeWebhookEventType;
  tenantId: string;
  /** Discriminated payload — subscription events use sub, invoice events use invoice. */
  subscription?: StripeSubscriptionPayload;
  invoice?: StripeInvoicePayload;
};

// ---------------------------------------------------------------------------
// Webhook → internal status mapping
// ---------------------------------------------------------------------------

const STRIPE_TO_INTERNAL_STATUS: Record<string, SubscriptionStatus> = {
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  unpaid: "suspended",
  paused: "suspended",
  incomplete: "trialing",
  incomplete_expired: "cancelled",
  canceled: "cancelled",
};

export function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  const mapped = STRIPE_TO_INTERNAL_STATUS[stripeStatus];
  if (!mapped) {
    throw new BillingError(
      "INVALID_STATUS",
      `Unrecognised Stripe subscription status "${stripeStatus}"`,
    );
  }
  return mapped;
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  trialing: ["trialing", "active", "past_due", "cancelled"],
  active: ["active", "past_due", "suspended", "cancelled"],
  past_due: ["past_due", "active", "suspended", "cancelled"],
  suspended: ["suspended", "active", "cancelled"],
  cancelled: ["cancelled"],
};

export function isValidTransition(
  from: SubscriptionStatus,
  to: SubscriptionStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type BillingErrorCode =
  | "INVALID_STATUS"
  | "INVALID_TRANSITION"
  | "MISSING_PAYLOAD"
  | "TENANT_MISMATCH"
  | "SUBSCRIPTION_NOT_FOUND";

export class BillingError extends Error {
  constructor(
    public readonly code: BillingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BillingError";
  }
}
