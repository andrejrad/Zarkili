/**
 * stripe/billingDispatcher.test.ts (W13-DEBT-1, W13-DEBT-4)
 */

import { describe, it, expect } from "vitest";

import {
  applySubscriptionEvent,
  BillingDispatchError,
  type Subscription,
} from "../../src/stripe/billingDispatcher";
import type { ParsedSubscriptionEvent } from "../../src/stripe/parseEvent";

const NOW = { seconds: 1700000000, nanoseconds: 0 };
const PERIOD_END = { seconds: 1702592000, nanoseconds: 0 };

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    tenantId: "t1",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    planId: "professional",
    interval: "monthly",
    status: "active",
    currentPeriodStart: { seconds: 1697408000, nanoseconds: 0 },
    currentPeriodEnd: PERIOD_END,
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    pastDueSince: null,
    lastEventId: "evt_prev",
    createdAt: { seconds: 1690000000, nanoseconds: 0 },
    updatedAt: { seconds: 1697408000, nanoseconds: 0 },
    ...overrides,
  };
}

function subEvent(
  type: ParsedSubscriptionEvent["type"],
  overrides: Partial<NonNullable<ParsedSubscriptionEvent["subscription"]>> = {},
  evtId = "evt_1",
): ParsedSubscriptionEvent {
  return {
    id: evtId,
    type,
    tenantId: "t1",
    subscription: {
      stripeSubscriptionId: "sub_1",
      stripeCustomerId: "cus_1",
      planId: "professional",
      interval: "monthly",
      stripeStatus: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: { seconds: 1697408000, nanoseconds: 0 },
      currentPeriodEnd: PERIOD_END,
      trialEndsAt: null,
      ...overrides,
    },
  };
}

describe("applySubscriptionEvent — created", () => {
  it("creates a new active subscription", () => {
    const r = applySubscriptionEvent(null, subEvent("customer.subscription.created"), NOW);
    expect(r.outcome).toBe("applied");
    expect(r.subscription?.status).toBe("active");
    expect(r.subscription?.createdAt).toEqual(NOW);
    expect(r.subscription?.lastEventId).toBe("evt_1");
  });

  it("creates trialing when stripeStatus=trialing", () => {
    const r = applySubscriptionEvent(
      null,
      subEvent("customer.subscription.created", { stripeStatus: "trialing" }),
      NOW,
    );
    expect(r.subscription?.status).toBe("trialing");
  });

  it("throws INVALID_STATUS on unknown stripe status", () => {
    expect(() =>
      applySubscriptionEvent(
        null,
        subEvent("customer.subscription.created", { stripeStatus: "weird" }),
        NOW,
      ),
    ).toThrow(BillingDispatchError);
  });
});

describe("applySubscriptionEvent — updated", () => {
  it("preserves cancelAtPeriodEnd=true (W13-DEBT-4)", () => {
    const r = applySubscriptionEvent(
      makeSub(),
      subEvent("customer.subscription.updated", { cancelAtPeriodEnd: true }),
      NOW,
    );
    expect(r.subscription?.cancelAtPeriodEnd).toBe(true);
    expect(r.subscription?.status).toBe("active");
  });

  it("transitions active → past_due and stamps pastDueSince", () => {
    const r = applySubscriptionEvent(
      makeSub({ status: "active" }),
      subEvent("customer.subscription.updated", { stripeStatus: "past_due" }),
      NOW,
    );
    expect(r.subscription?.status).toBe("past_due");
    expect(r.subscription?.pastDueSince).toEqual(NOW);
  });

  it("preserves existing pastDueSince when remaining past_due", () => {
    const earlier = { seconds: 1699000000, nanoseconds: 0 };
    const r = applySubscriptionEvent(
      makeSub({ status: "past_due", pastDueSince: earlier }),
      subEvent("customer.subscription.updated", { stripeStatus: "past_due" }),
      NOW,
    );
    expect(r.subscription?.pastDueSince).toEqual(earlier);
  });

  it("clears pastDueSince when transitioning back to active", () => {
    const r = applySubscriptionEvent(
      makeSub({ status: "past_due", pastDueSince: { seconds: 1699000000, nanoseconds: 0 } }),
      subEvent("customer.subscription.updated", { stripeStatus: "active" }),
      NOW,
    );
    expect(r.subscription?.pastDueSince).toBeNull();
    expect(r.subscription?.status).toBe("active");
  });

  it("rejects illegal cancelled → active", () => {
    expect(() =>
      applySubscriptionEvent(
        makeSub({ status: "cancelled" }),
        subEvent("customer.subscription.updated", { stripeStatus: "active" }),
        NOW,
      ),
    ).toThrow(/INVALID_TRANSITION/);
  });
});

describe("applySubscriptionEvent — deleted", () => {
  it("transitions to cancelled and clears cancelAtPeriodEnd", () => {
    const r = applySubscriptionEvent(
      makeSub({ status: "active", cancelAtPeriodEnd: true }),
      { id: "evt_del", type: "customer.subscription.deleted", tenantId: "t1" },
      NOW,
    );
    expect(r.subscription?.status).toBe("cancelled");
    expect(r.subscription?.cancelAtPeriodEnd).toBe(false);
  });

  it("throws SUBSCRIPTION_NOT_FOUND when current is null", () => {
    expect(() =>
      applySubscriptionEvent(
        null,
        { id: "evt_del", type: "customer.subscription.deleted", tenantId: "t1" },
        NOW,
      ),
    ).toThrow(/SUBSCRIPTION_NOT_FOUND/);
  });
});

describe("applySubscriptionEvent — invoice events", () => {
  it("invoice.payment_failed transitions active → past_due", () => {
    const r = applySubscriptionEvent(
      makeSub({ status: "active" }),
      { id: "evt_if", type: "invoice.payment_failed", tenantId: "t1" },
      NOW,
    );
    expect(r.subscription?.status).toBe("past_due");
    expect(r.subscription?.pastDueSince).toEqual(NOW);
  });

  it("invoice.payment_succeeded recovers past_due → active and clears pastDueSince", () => {
    const r = applySubscriptionEvent(
      makeSub({ status: "past_due", pastDueSince: { seconds: 1699000000, nanoseconds: 0 } }),
      { id: "evt_ip", type: "invoice.payment_succeeded", tenantId: "t1" },
      NOW,
    );
    expect(r.subscription?.status).toBe("active");
    expect(r.subscription?.pastDueSince).toBeNull();
  });

  it("invoice.payment_succeeded is no-op on active subs (status unchanged, lastEventId stamped)", () => {
    const sub = makeSub({ status: "active" });
    const r = applySubscriptionEvent(
      sub,
      { id: "evt_ip2", type: "invoice.payment_succeeded", tenantId: "t1" },
      NOW,
    );
    expect(r.subscription?.status).toBe("active");
    expect(r.subscription?.lastEventId).toBe("evt_ip2");
  });

  it("invoice.payment_succeeded ignored when no subscription on file", () => {
    const r = applySubscriptionEvent(
      null,
      { id: "evt_x", type: "invoice.payment_succeeded", tenantId: "t1" },
      NOW,
    );
    expect(r).toEqual({ outcome: "ignored", subscription: null });
  });
});

describe("applySubscriptionEvent — trial_will_end", () => {
  it("stamps lastEventId without changing status", () => {
    const sub = makeSub({ status: "trialing" });
    const r = applySubscriptionEvent(
      sub,
      { id: "evt_twe", type: "customer.subscription.trial_will_end", tenantId: "t1" },
      NOW,
    );
    expect(r.subscription?.status).toBe("trialing");
    expect(r.subscription?.lastEventId).toBe("evt_twe");
  });

  it("ignored when no subscription on file", () => {
    const r = applySubscriptionEvent(
      null,
      { id: "evt_twe", type: "customer.subscription.trial_will_end", tenantId: "t1" },
      NOW,
    );
    expect(r.outcome).toBe("ignored");
  });
});
