/**
 * functions/src/stripe/billingDispatcher.ts (W13-DEBT-1, W13-DEBT-4)
 *
 * Pure mapper: (current Subscription | null, ParsedSubscriptionEvent) → next Subscription.
 *
 * This duplicates the minimum state-machine logic from
 * `src/domains/billing/model.ts` because functions/tsconfig.json scopes
 * compilation to functions/src and cannot reach the domain package.
 * Domain tests in src/ continue to be the source-of-truth for the rules.
 */

import type { ParsedSubscriptionEvent } from "./parseEvent.js";

type LocalTimestamp = { seconds: number; nanoseconds: number };

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled";

export type Subscription = {
  tenantId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planId: "starter" | "professional" | "enterprise";
  interval: "monthly" | "annual";
  status: SubscriptionStatus;
  currentPeriodStart: LocalTimestamp;
  currentPeriodEnd: LocalTimestamp;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: LocalTimestamp | null;
  pastDueSince: LocalTimestamp | null;
  lastEventId: string | null;
  createdAt: LocalTimestamp;
  updatedAt: LocalTimestamp;
};

const STRIPE_TO_INTERNAL: Record<string, SubscriptionStatus> = {
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  unpaid: "suspended",
  paused: "suspended",
  incomplete: "trialing",
  incomplete_expired: "cancelled",
  canceled: "cancelled",
};

const ALLOWED: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  trialing: ["trialing", "active", "past_due", "cancelled"],
  active: ["active", "past_due", "suspended", "cancelled"],
  past_due: ["past_due", "active", "suspended", "cancelled"],
  suspended: ["suspended", "active", "cancelled"],
  cancelled: ["cancelled"],
};

export type BillingDispatchErrorCode =
  | "INVALID_STATUS"
  | "INVALID_TRANSITION"
  | "MISSING_PAYLOAD"
  | "SUBSCRIPTION_NOT_FOUND";

export class BillingDispatchError extends Error {
  constructor(public readonly code: BillingDispatchErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "BillingDispatchError";
  }
}

function mapStripeStatus(s: string): SubscriptionStatus {
  const mapped = STRIPE_TO_INTERNAL[s];
  if (!mapped) {
    throw new BillingDispatchError("INVALID_STATUS", `Unrecognised Stripe status "${s}"`);
  }
  return mapped;
}

function assertTransition(from: SubscriptionStatus, to: SubscriptionStatus): void {
  if (!ALLOWED[from].includes(to)) {
    throw new BillingDispatchError(
      "INVALID_TRANSITION",
      `Illegal transition ${from} → ${to}`,
    );
  }
}

export type DispatchOutcome = "applied" | "ignored";

export type DispatchResult = {
  outcome: DispatchOutcome;
  subscription: Subscription | null;
};

/**
 * Apply a parsed subscription event onto the current subscription record.
 * Pure — all I/O happens in the caller.
 */
export function applySubscriptionEvent(
  current: Subscription | null,
  event: ParsedSubscriptionEvent,
  now: LocalTimestamp,
): DispatchResult {
  switch (event.type) {
    case "customer.subscription.created": {
      if (!event.subscription) {
        throw new BillingDispatchError("MISSING_PAYLOAD", "subscription payload required");
      }
      const status = mapStripeStatus(event.subscription.stripeStatus);
      const next: Subscription = {
        tenantId: event.tenantId,
        stripeCustomerId: event.subscription.stripeCustomerId,
        stripeSubscriptionId: event.subscription.stripeSubscriptionId,
        planId: event.subscription.planId,
        interval: event.subscription.interval,
        status,
        currentPeriodStart: event.subscription.currentPeriodStart,
        currentPeriodEnd: event.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: event.subscription.cancelAtPeriodEnd,
        trialEndsAt: event.subscription.trialEndsAt,
        pastDueSince: status === "past_due" ? now : null,
        lastEventId: event.id,
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
      };
      return { outcome: "applied", subscription: next };
    }

    case "customer.subscription.updated": {
      if (!event.subscription) {
        throw new BillingDispatchError("MISSING_PAYLOAD", "subscription payload required");
      }
      const nextStatus = mapStripeStatus(event.subscription.stripeStatus);
      if (current) {
        assertTransition(current.status, nextStatus);
      }
      const pastDueSince =
        nextStatus === "past_due"
          ? current?.pastDueSince ?? now
          : null;
      const next: Subscription = {
        tenantId: event.tenantId,
        stripeCustomerId: event.subscription.stripeCustomerId,
        stripeSubscriptionId: event.subscription.stripeSubscriptionId,
        planId: event.subscription.planId,
        interval: event.subscription.interval,
        status: nextStatus,
        currentPeriodStart: event.subscription.currentPeriodStart,
        currentPeriodEnd: event.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: event.subscription.cancelAtPeriodEnd,
        trialEndsAt: event.subscription.trialEndsAt,
        pastDueSince,
        lastEventId: event.id,
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
      };
      return { outcome: "applied", subscription: next };
    }

    case "customer.subscription.deleted": {
      if (!current) {
        throw new BillingDispatchError(
          "SUBSCRIPTION_NOT_FOUND",
          `no subscription on file for tenant ${event.tenantId}`,
        );
      }
      assertTransition(current.status, "cancelled");
      const next: Subscription = {
        ...current,
        status: "cancelled",
        cancelAtPeriodEnd: false,
        pastDueSince: null,
        lastEventId: event.id,
        updatedAt: now,
      };
      return { outcome: "applied", subscription: next };
    }

    case "customer.subscription.trial_will_end": {
      // Informational — domain stamps lastEventId only (no status change).
      if (!current) return { outcome: "ignored", subscription: null };
      return {
        outcome: "applied",
        subscription: { ...current, lastEventId: event.id, updatedAt: now },
      };
    }

    case "invoice.payment_failed": {
      if (!current) {
        throw new BillingDispatchError(
          "SUBSCRIPTION_NOT_FOUND",
          `no subscription on file for tenant ${event.tenantId}`,
        );
      }
      // Stripe will follow up with subscription.updated → past_due. We only
      // stamp pastDueSince if it isn't already set, mirroring the domain.
      const next: Subscription = {
        ...current,
        status: current.status === "cancelled" ? current.status : "past_due",
        pastDueSince: current.pastDueSince ?? now,
        lastEventId: event.id,
        updatedAt: now,
      };
      if (current.status !== "cancelled") {
        assertTransition(current.status, "past_due");
      }
      return { outcome: "applied", subscription: next };
    }

    case "invoice.payment_succeeded": {
      if (!current) return { outcome: "ignored", subscription: null };
      // Recovery: clear pastDueSince and move past_due/suspended → active.
      let nextStatus: SubscriptionStatus = current.status;
      if (current.status === "past_due" || current.status === "suspended") {
        nextStatus = "active";
        assertTransition(current.status, "active");
      }
      const next: Subscription = {
        ...current,
        status: nextStatus,
        pastDueSince: null,
        lastEventId: event.id,
        updatedAt: now,
      };
      return { outcome: "applied", subscription: next };
    }
  }
}
