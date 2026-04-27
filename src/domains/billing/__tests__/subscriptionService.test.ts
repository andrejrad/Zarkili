import type { Timestamp } from "firebase/firestore";

import {
  BillingError,
  isValidTransition,
  mapStripeStatus,
  type Subscription,
  type SubscriptionStatus,
} from "../model";
import type { BillingRepository } from "../repository";
import {
  createInitialSubscription,
  createSubscriptionService,
  transitionSubscription,
} from "../subscriptionService";

// ---------------------------------------------------------------------------
// In-memory BillingRepository fake (per-tenant subscription + idempotency)
// ---------------------------------------------------------------------------

type Store = {
  subscriptions: Map<string, Subscription>;
  events: Map<string, Set<string>>;
};

function makeRepo(): { repo: BillingRepository; store: Store } {
  const store: Store = { subscriptions: new Map(), events: new Map() };

  const repo: BillingRepository = {
    async getSubscription(tenantId: string) {
      return store.subscriptions.get(tenantId) ?? null;
    },
    async saveSubscriptionWithIdempotency(subscription, eventId) {
      store.subscriptions.set(subscription.tenantId, { ...subscription });
      const set = store.events.get(subscription.tenantId) ?? new Set<string>();
      set.add(eventId);
      store.events.set(subscription.tenantId, set);
    },
    async hasProcessedEvent(tenantId, eventId) {
      return store.events.get(tenantId)?.has(eventId) ?? false;
    },
    async recordProcessedEvent(tenantId, eventId) {
      const set = store.events.get(tenantId) ?? new Set<string>();
      set.add(eventId);
      store.events.set(tenantId, set);
    },
  };

  return { repo, store };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT = "tenantA";

let nowSeconds: number;
function fakeNow(): Timestamp {
  return { seconds: nowSeconds, nanoseconds: 0 } as unknown as Timestamp;
}
function ts(seconds: number): Timestamp {
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}

beforeEach(() => {
  nowSeconds = 1_000_000;
});

function makeService() {
  const { repo, store } = makeRepo();
  const service = createSubscriptionService(repo, { now: fakeNow });
  return { service, repo, store };
}

function createdEvent(overrides: Partial<{ id: string; status: string; tenantId: string }> = {}) {
  return {
    id: overrides.id ?? "evt_create_1",
    type: "customer.subscription.created" as const,
    tenantId: overrides.tenantId ?? TENANT,
    subscription: {
      stripeSubscriptionId: "sub_1",
      stripeCustomerId: "cus_1",
      planId: "starter" as const,
      interval: "monthly" as const,
      stripeStatus: overrides.status ?? "trialing",
      cancelAtPeriodEnd: false,
      currentPeriodStart: ts(1_000_000),
      currentPeriodEnd: ts(1_500_000),
      trialEndsAt: ts(1_200_000),
    },
  };
}

function updatedEvent(stripeStatus: string, eventId = "evt_update_1") {
  return {
    id: eventId,
    type: "customer.subscription.updated" as const,
    tenantId: TENANT,
    subscription: {
      stripeSubscriptionId: "sub_1",
      stripeCustomerId: "cus_1",
      planId: "starter" as const,
      interval: "monthly" as const,
      stripeStatus,
      cancelAtPeriodEnd: false,
      currentPeriodStart: ts(1_000_000),
      currentPeriodEnd: ts(1_500_000),
      trialEndsAt: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe("mapStripeStatus", () => {
  it.each<[string, SubscriptionStatus]>([
    ["trialing", "trialing"],
    ["active", "active"],
    ["past_due", "past_due"],
    ["unpaid", "suspended"],
    ["paused", "suspended"],
    ["incomplete", "trialing"],
    ["incomplete_expired", "cancelled"],
    ["canceled", "cancelled"],
  ])("maps %s -> %s", (raw, expected) => {
    expect(mapStripeStatus(raw)).toBe(expected);
  });

  it("throws for unknown stripe status", () => {
    expect(() => mapStripeStatus("bogus")).toThrow(BillingError);
  });
});

describe("isValidTransition", () => {
  const allowedSamples: Array<[SubscriptionStatus, SubscriptionStatus]> = [
    ["trialing", "active"],
    ["trialing", "past_due"],
    ["trialing", "cancelled"],
    ["active", "past_due"],
    ["active", "suspended"],
    ["past_due", "active"],
    ["past_due", "suspended"],
    ["suspended", "active"],
    ["suspended", "cancelled"],
  ];
  const forbiddenSamples: Array<[SubscriptionStatus, SubscriptionStatus]> = [
    ["cancelled", "active"],
    ["cancelled", "trialing"],
    ["active", "trialing"],
    ["suspended", "trialing"],
  ];

  it.each(allowedSamples)("allows %s -> %s", (from, to) => {
    expect(isValidTransition(from, to)).toBe(true);
  });

  it.each(forbiddenSamples)("forbids %s -> %s", (from, to) => {
    expect(isValidTransition(from, to)).toBe(false);
  });
});

describe("transitionSubscription", () => {
  function baseSub(status: SubscriptionStatus, pastDueSince: Timestamp | null = null): Subscription {
    return {
      tenantId: TENANT,
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      planId: "starter",
      interval: "monthly",
      status,
      currentPeriodStart: ts(1_000_000),
      currentPeriodEnd: ts(1_500_000),
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      pastDueSince,
      lastEventId: null,
      createdAt: ts(1_000_000),
      updatedAt: ts(1_000_000),
    };
  }

  it("stamps pastDueSince when entering past_due", () => {
    const next = transitionSubscription(baseSub("active"), {
      status: "past_due",
      currentPeriodStart: ts(1_000_000),
      currentPeriodEnd: ts(1_500_000),
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      now: ts(1_100_000),
    });
    expect(next.pastDueSince).toEqual(ts(1_100_000));
  });

  it("preserves pastDueSince across past_due updates", () => {
    const sub = baseSub("past_due", ts(1_050_000));
    const next = transitionSubscription(sub, {
      status: "past_due",
      currentPeriodStart: ts(1_000_000),
      currentPeriodEnd: ts(1_500_000),
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      now: ts(1_200_000),
    });
    expect(next.pastDueSince).toEqual(ts(1_050_000));
  });

  it("clears pastDueSince when recovering to active", () => {
    const sub = baseSub("past_due", ts(1_050_000));
    const next = transitionSubscription(sub, {
      status: "active",
      currentPeriodStart: ts(1_000_000),
      currentPeriodEnd: ts(1_500_000),
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      now: ts(1_200_000),
    });
    expect(next.pastDueSince).toBeNull();
  });

  it("throws on illegal transition", () => {
    expect(() =>
      transitionSubscription(baseSub("cancelled"), {
        status: "active",
        currentPeriodStart: ts(1_000_000),
        currentPeriodEnd: ts(1_500_000),
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        now: ts(1_100_000),
      }),
    ).toThrow(BillingError);
  });
});

describe("createInitialSubscription", () => {
  it("stamps pastDueSince when initial status is past_due", () => {
    const sub = createInitialSubscription({
      tenantId: TENANT,
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      planId: "starter",
      interval: "monthly",
      status: "past_due",
      currentPeriodStart: ts(1_000_000),
      currentPeriodEnd: ts(1_500_000),
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      now: ts(1_100_000),
    });
    expect(sub.pastDueSince).toEqual(ts(1_100_000));
  });

  it("leaves pastDueSince null for trialing/active initial status", () => {
    const sub = createInitialSubscription({
      tenantId: TENANT,
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      planId: "starter",
      interval: "monthly",
      status: "trialing",
      currentPeriodStart: ts(1_000_000),
      currentPeriodEnd: ts(1_500_000),
      cancelAtPeriodEnd: false,
      trialEndsAt: ts(1_200_000),
      now: ts(1_100_000),
    });
    expect(sub.pastDueSince).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// applyWebhookEvent — full state-machine + idempotency coverage
// ---------------------------------------------------------------------------

describe("createSubscriptionService — applyWebhookEvent", () => {
  it("creates a new subscription on customer.subscription.created", async () => {
    const { service, store } = makeService();
    const result = await service.applyWebhookEvent(createdEvent());
    expect(result.outcome).toBe("applied");
    expect(result.fromStatus).toBeNull();
    expect(result.toStatus).toBe("trialing");
    expect(result.subscription?.stripeSubscriptionId).toBe("sub_1");
    expect(store.subscriptions.get(TENANT)?.lastEventId).toBe("evt_create_1");
  });

  it("is idempotent — replaying same event returns duplicate outcome and does not double-write", async () => {
    const { service, store } = makeService();
    await service.applyWebhookEvent(createdEvent());
    const second = await service.applyWebhookEvent(createdEvent());
    expect(second.outcome).toBe("duplicate");
    expect(store.events.get(TENANT)?.size).toBe(1);
  });

  it("transitions trialing -> active on subscription.updated{active}", async () => {
    const { service } = makeService();
    await service.applyWebhookEvent(createdEvent());
    nowSeconds = 1_100_000;
    const result = await service.applyWebhookEvent(updatedEvent("active"));
    expect(result.outcome).toBe("applied");
    expect(result.fromStatus).toBe("trialing");
    expect(result.toStatus).toBe("active");
  });

  it("marks past_due on invoice.payment_failed and stamps pastDueSince", async () => {
    const { service } = makeService();
    await service.applyWebhookEvent(createdEvent({ status: "active" }));
    nowSeconds = 1_200_000;
    const result = await service.applyWebhookEvent({
      id: "evt_invoice_failed_1",
      type: "invoice.payment_failed",
      tenantId: TENANT,
      invoice: {
        stripeSubscriptionId: "sub_1",
        stripeCustomerId: "cus_1",
        invoiceStatus: "open",
      },
    });
    expect(result.outcome).toBe("applied");
    expect(result.toStatus).toBe("past_due");
    expect(result.subscription?.pastDueSince).toEqual(ts(1_200_000));
  });

  it("recovers past_due -> active on invoice.payment_succeeded and clears pastDueSince", async () => {
    const { service } = makeService();
    await service.applyWebhookEvent(createdEvent({ status: "active" }));
    await service.applyWebhookEvent({
      id: "evt_failed",
      type: "invoice.payment_failed",
      tenantId: TENANT,
      invoice: {
        stripeSubscriptionId: "sub_1",
        stripeCustomerId: "cus_1",
        invoiceStatus: "open",
      },
    });
    const result = await service.applyWebhookEvent({
      id: "evt_paid",
      type: "invoice.payment_succeeded",
      tenantId: TENANT,
      invoice: {
        stripeSubscriptionId: "sub_1",
        stripeCustomerId: "cus_1",
        invoiceStatus: "paid",
      },
    });
    expect(result.outcome).toBe("applied");
    expect(result.toStatus).toBe("active");
    expect(result.subscription?.pastDueSince).toBeNull();
  });

  it("invoice.payment_succeeded on already-active subscription is a no-op (ignored, idempotency recorded)", async () => {
    const { service, store } = makeService();
    await service.applyWebhookEvent(createdEvent({ status: "active" }));
    const result = await service.applyWebhookEvent({
      id: "evt_paid",
      type: "invoice.payment_succeeded",
      tenantId: TENANT,
      invoice: {
        stripeSubscriptionId: "sub_1",
        stripeCustomerId: "cus_1",
        invoiceStatus: "paid",
      },
    });
    expect(result.outcome).toBe("ignored");
    expect(result.toStatus).toBe("active");
    expect(store.events.get(TENANT)?.has("evt_paid")).toBe(true);
  });

  it("transitions to suspended via subscription.updated{unpaid}", async () => {
    const { service } = makeService();
    await service.applyWebhookEvent(createdEvent({ status: "active" }));
    const result = await service.applyWebhookEvent(updatedEvent("unpaid", "evt_unpaid"));
    expect(result.outcome).toBe("applied");
    expect(result.toStatus).toBe("suspended");
  });

  it("cancels via customer.subscription.deleted", async () => {
    const { service } = makeService();
    await service.applyWebhookEvent(createdEvent({ status: "active" }));
    const result = await service.applyWebhookEvent({
      id: "evt_deleted",
      type: "customer.subscription.deleted",
      tenantId: TENANT,
    });
    expect(result.outcome).toBe("applied");
    expect(result.toStatus).toBe("cancelled");
  });

  it("trial_will_end is informational and does not change status", async () => {
    const { service } = makeService();
    await service.applyWebhookEvent(createdEvent({ status: "trialing" }));
    const result = await service.applyWebhookEvent({
      id: "evt_trial_warn",
      type: "customer.subscription.trial_will_end",
      tenantId: TENANT,
      subscription: {
        stripeSubscriptionId: "sub_1",
        stripeCustomerId: "cus_1",
        planId: "starter",
        interval: "monthly",
        stripeStatus: "trialing",
        cancelAtPeriodEnd: false,
        currentPeriodStart: ts(1_000_000),
        currentPeriodEnd: ts(1_500_000),
        trialEndsAt: ts(1_100_000),
      },
    });
    expect(result.outcome).toBe("ignored");
    expect(result.toStatus).toBe("trialing");
  });

  it("rejects illegal transition from cancelled", async () => {
    const { service } = makeService();
    await service.applyWebhookEvent(createdEvent({ status: "active" }));
    await service.applyWebhookEvent({
      id: "evt_del",
      type: "customer.subscription.deleted",
      tenantId: TENANT,
    });
    await expect(
      service.applyWebhookEvent(updatedEvent("active", "evt_resurrect")),
    ).rejects.toThrow(BillingError);
  });

  it("rejects non-create events when no subscription exists", async () => {
    const { service } = makeService();
    await expect(
      service.applyWebhookEvent(updatedEvent("active", "evt_orphan")),
    ).rejects.toThrow(BillingError);
  });

  it("requires event id and tenantId", async () => {
    const { service } = makeService();
    await expect(
      service.applyWebhookEvent({ ...createdEvent(), id: "" }),
    ).rejects.toThrow(BillingError);
    await expect(
      service.applyWebhookEvent({ ...createdEvent(), tenantId: "" }),
    ).rejects.toThrow(BillingError);
  });

  it("rejects subscription.created without subscription payload", async () => {
    const { service } = makeService();
    await expect(
      service.applyWebhookEvent({
        id: "evt_bad",
        type: "customer.subscription.created",
        tenantId: TENANT,
      }),
    ).rejects.toThrow(BillingError);
  });
});
