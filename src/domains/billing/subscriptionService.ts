/**
 * Subscription service — webhook event application + state-machine enforcement.
 *
 * Responsibilities:
 *   1. Idempotently apply Stripe webhook events to the normalized Subscription record.
 *   2. Map raw Stripe statuses to the internal SubscriptionStatus surface.
 *   3. Reject illegal status transitions before persisting (defense in depth).
 *   4. Stamp pastDueSince when a subscription enters past_due (cleared on recovery).
 *   5. Provide pure helpers (createInitialSubscription, cancelSubscription) for tests
 *      and for non-webhook code paths (e.g. admin manual cancel).
 *
 * All Firestore I/O is delegated to BillingRepository.
 */

import type { Timestamp } from "firebase/firestore";

import {
  BillingError,
  isValidTransition,
  mapStripeStatus,
  type StripeWebhookEvent,
  type Subscription,
  type SubscriptionStatus,
} from "./model";
import type { BillingRepository } from "./repository";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type ApplyWebhookOutcome = "applied" | "duplicate" | "ignored";

export type ApplyWebhookResult = {
  outcome: ApplyWebhookOutcome;
  subscription: Subscription | null;
  fromStatus: SubscriptionStatus | null;
  toStatus: SubscriptionStatus | null;
};

// ---------------------------------------------------------------------------
// Service surface
// ---------------------------------------------------------------------------

export type SubscriptionService = {
  applyWebhookEvent(event: StripeWebhookEvent): Promise<ApplyWebhookResult>;
  getSubscription(tenantId: string): Promise<Subscription | null>;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function createInitialSubscription(args: {
  tenantId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planId: Subscription["planId"];
  interval: Subscription["interval"];
  status: SubscriptionStatus;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: Timestamp | null;
  now: Timestamp;
  eventId?: string | null;
}): Subscription {
  return {
    tenantId: args.tenantId,
    stripeCustomerId: args.stripeCustomerId,
    stripeSubscriptionId: args.stripeSubscriptionId,
    planId: args.planId,
    interval: args.interval,
    status: args.status,
    currentPeriodStart: args.currentPeriodStart,
    currentPeriodEnd: args.currentPeriodEnd,
    cancelAtPeriodEnd: args.cancelAtPeriodEnd,
    trialEndsAt: args.trialEndsAt,
    pastDueSince: args.status === "past_due" ? args.now : null,
    lastEventId: args.eventId ?? null,
    createdAt: args.now,
    updatedAt: args.now,
  };
}

/**
 * Compute the next subscription record from an existing one + a target status.
 * Throws BillingError("INVALID_TRANSITION") if the transition is not allowed.
 */
export function transitionSubscription(
  existing: Subscription,
  next: {
    status: SubscriptionStatus;
    currentPeriodStart: Timestamp;
    currentPeriodEnd: Timestamp;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: Timestamp | null;
    now: Timestamp;
    eventId?: string | null;
  },
): Subscription {
  if (!isValidTransition(existing.status, next.status)) {
    throw new BillingError(
      "INVALID_TRANSITION",
      `Illegal subscription transition: ${existing.status} → ${next.status}`,
    );
  }

  let pastDueSince = existing.pastDueSince;
  if (next.status === "past_due") {
    pastDueSince = pastDueSince ?? next.now;
  } else if (next.status === "active" || next.status === "trialing") {
    pastDueSince = null;
  }

  return {
    ...existing,
    status: next.status,
    currentPeriodStart: next.currentPeriodStart,
    currentPeriodEnd: next.currentPeriodEnd,
    cancelAtPeriodEnd: next.cancelAtPeriodEnd,
    trialEndsAt: next.trialEndsAt,
    pastDueSince,
    lastEventId: next.eventId ?? existing.lastEventId,
    updatedAt: next.now,
  };
}

// ---------------------------------------------------------------------------
// Internal: derive next status from a webhook event + current subscription
// ---------------------------------------------------------------------------

function deriveStatusFromEvent(
  event: StripeWebhookEvent,
  existing: Subscription | null,
): SubscriptionStatus | null {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      if (!event.subscription) {
        throw new BillingError("MISSING_PAYLOAD", `${event.type} requires subscription payload`);
      }
      return mapStripeStatus(event.subscription.stripeStatus);
    }
    case "customer.subscription.deleted":
      return "cancelled";
    case "invoice.payment_failed":
      return "past_due";
    case "invoice.payment_succeeded":
      // Recover from past_due/suspended to active; otherwise no status change.
      if (existing && (existing.status === "past_due" || existing.status === "suspended")) {
        return "active";
      }
      return null;
    case "customer.subscription.trial_will_end":
      // Informational — does not change status.
      return null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSubscriptionService(
  repository: BillingRepository,
  options?: { now?: () => Timestamp },
): SubscriptionService {
  const now = options?.now ?? defaultNow;

  async function applyWebhookEvent(event: StripeWebhookEvent): Promise<ApplyWebhookResult> {
    if (!event.id) {
      throw new BillingError("MISSING_PAYLOAD", "Webhook event id is required");
    }
    if (!event.tenantId) {
      throw new BillingError("MISSING_PAYLOAD", "Webhook event tenantId is required");
    }

    if (await repository.hasProcessedEvent(event.tenantId, event.id)) {
      const existing = await repository.getSubscription(event.tenantId);
      return {
        outcome: "duplicate",
        subscription: existing,
        fromStatus: existing?.status ?? null,
        toStatus: existing?.status ?? null,
      };
    }

    const existing = await repository.getSubscription(event.tenantId);

    if (existing && existing.tenantId !== event.tenantId) {
      throw new BillingError(
        "TENANT_MISMATCH",
        `Subscription tenantId ${existing.tenantId} does not match event tenantId ${event.tenantId}`,
      );
    }

    const ts = now();

    // Subscription.created with no existing record — create initial subscription.
    if (event.type === "customer.subscription.created") {
      if (!event.subscription) {
        throw new BillingError("MISSING_PAYLOAD", "subscription payload required for created event");
      }
      const status = mapStripeStatus(event.subscription.stripeStatus);
      const next = createInitialSubscription({
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
        now: ts,
        eventId: event.id,
      });
      await repository.saveSubscriptionWithIdempotency(next, event.id);
      return {
        outcome: "applied",
        subscription: next,
        fromStatus: null,
        toStatus: status,
      };
    }

    // All non-create events require an existing subscription.
    if (!existing) {
      throw new BillingError(
        "SUBSCRIPTION_NOT_FOUND",
        `No subscription exists for tenant ${event.tenantId} to apply event ${event.type}`,
      );
    }

    const targetStatus = deriveStatusFromEvent(event, existing);

    // Informational / no-op event — record idempotency only.
    if (targetStatus === null) {
      await repository.recordProcessedEvent(event.tenantId, event.id);
      return {
        outcome: "ignored",
        subscription: existing,
        fromStatus: existing.status,
        toStatus: existing.status,
      };
    }

    // Resolve period/trial fields: prefer payload when present, else carry over.
    const currentPeriodStart = event.subscription?.currentPeriodStart ?? existing.currentPeriodStart;
    const currentPeriodEnd = event.subscription?.currentPeriodEnd ?? existing.currentPeriodEnd;
    const cancelAtPeriodEnd = event.subscription?.cancelAtPeriodEnd ?? existing.cancelAtPeriodEnd;
    const trialEndsAt = event.subscription
      ? event.subscription.trialEndsAt
      : existing.trialEndsAt;

    const next = transitionSubscription(existing, {
      status: targetStatus,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      trialEndsAt,
      now: ts,
      eventId: event.id,
    });

    await repository.saveSubscriptionWithIdempotency(next, event.id);
    return {
      outcome: "applied",
      subscription: next,
      fromStatus: existing.status,
      toStatus: next.status,
    };
  }

  function getSubscription(tenantId: string): Promise<Subscription | null> {
    return repository.getSubscription(tenantId);
  }

  return { applyWebhookEvent, getSubscription };
}

function defaultNow(): Timestamp {
  const seconds = Math.floor(Date.now() / 1000);
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}
