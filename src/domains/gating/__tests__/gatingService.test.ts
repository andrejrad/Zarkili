import type { Timestamp } from "firebase/firestore";

import type { Subscription, SubscriptionStatus } from "../../billing/model";
import type { Trial, TrialStatus } from "../../trial/model";
import {
  buildDenialAudit,
  decideGate,
  FEATURE_GROUPS,
  PAST_DUE_GRACE_DAYS,
  type GateContext,
} from "../model";
import type { GatingAuditRepository } from "../repository";
import {
  createGatingService,
  GateDeniedError,
} from "../gatingService";

const DAY = 86_400;

function ts(seconds: number): Timestamp {
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}

function makeSubscription(over: Partial<Subscription> = {}): Subscription {
  return {
    tenantId: "tenant_a",
    stripeCustomerId: "cus_a",
    stripeSubscriptionId: "sub_a",
    planId: "professional",
    interval: "monthly",
    status: "active",
    currentPeriodStart: ts(0),
    currentPeriodEnd: ts(30 * DAY),
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    pastDueSince: null,
    lastEventId: null,
    createdAt: ts(0),
    updatedAt: ts(0),
    ...over,
  };
}

function makeTrial(status: TrialStatus, over: Partial<Trial> = {}): Trial {
  return {
    tenantId: "tenant_a",
    status,
    trialLengthDays: 14,
    startedAt: ts(0),
    endsAt: ts(14 * DAY),
    expiredAt: status === "expired" ? ts(14 * DAY + 1) : null,
    upgradedAt: null,
    upgradeSubscriptionId: null,
    lastJobRunId: null,
    createdAt: ts(0),
    updatedAt: ts(0),
    ...over,
  };
}

function ctx(over: Partial<GateContext> = {}): GateContext {
  return { subscription: null, trial: null, now: ts(1_000), ...over };
}

// ---------------------------------------------------------------------------
// decideGate matrix
// ---------------------------------------------------------------------------

describe("decideGate — matrix by subscription status", () => {
  test.each(FEATURE_GROUPS)("%s: active subscription → allow", (feature) => {
    const d = decideGate(feature, ctx({ subscription: makeSubscription({ status: "active" }) }));
    expect(d.outcome).toBe("allow");
    expect(d.reason).toBe("active");
  });

  test.each(FEATURE_GROUPS)("%s: cancelled subscription → deny", (feature) => {
    const d = decideGate(feature, ctx({ subscription: makeSubscription({ status: "cancelled" }) }));
    expect(d.outcome).toBe("deny");
    expect(d.reason).toBe("cancelled");
  });

  test.each(FEATURE_GROUPS)("%s: suspended subscription → deny", (feature) => {
    const d = decideGate(feature, ctx({ subscription: makeSubscription({ status: "suspended" }) }));
    expect(d.outcome).toBe("deny");
    expect(d.reason).toBe("suspended");
  });
});

describe("decideGate — past_due grace policy", () => {
  it("inside grace window: lenient features warn, strict features deny", () => {
    const sub = makeSubscription({ status: "past_due", pastDueSince: ts(0) });
    const within = ctx({ subscription: sub, now: ts(2 * DAY) });
    expect(decideGate("booking_creation", within).outcome).toBe("allow_with_warning");
    expect(decideGate("marketplace_visibility", within).outcome).toBe("allow_with_warning");
    expect(decideGate("advanced_analytics", within).outcome).toBe("allow_with_warning");
    // outbound_campaigns + ai_automations have revokeOnPastDue=true
    expect(decideGate("outbound_campaigns", within).outcome).toBe("deny");
    expect(decideGate("ai_automations", within).outcome).toBe("deny");
  });

  it("after grace window: all features deny with grace_exhausted reason", () => {
    const sub = makeSubscription({ status: "past_due", pastDueSince: ts(0) });
    const after = ctx({ subscription: sub, now: ts((PAST_DUE_GRACE_DAYS + 1) * DAY) });
    for (const feature of FEATURE_GROUPS) {
      const d = decideGate(feature, after);
      expect(d.outcome).toBe("deny");
      expect(d.reason).toBe("past_due_grace_exhausted");
    }
  });

  it("missing pastDueSince is treated defensively as in grace", () => {
    const sub = makeSubscription({ status: "past_due", pastDueSince: null });
    const d = decideGate("booking_creation", ctx({ subscription: sub, now: ts(0) }));
    expect(d.outcome).toBe("allow_with_warning");
    expect(d.reason).toBe("past_due_in_grace");
  });
});

describe("decideGate — trial-only states (no subscription yet)", () => {
  it("active trial → allow", () => {
    const d = decideGate("booking_creation", ctx({ trial: makeTrial("active") }));
    expect(d.outcome).toBe("allow");
    expect(d.reason).toBe("trialing");
  });

  it("expiring_soon trial → warn", () => {
    const d = decideGate("ai_automations", ctx({ trial: makeTrial("expiring_soon") }));
    expect(d.outcome).toBe("allow_with_warning");
    expect(d.reason).toBe("trial_expiring_soon");
  });

  it("expired trial → deny", () => {
    const d = decideGate("advanced_analytics", ctx({ trial: makeTrial("expired") }));
    expect(d.outcome).toBe("deny");
    expect(d.reason).toBe("trial_expired");
  });

  it("not_started trial → deny", () => {
    const d = decideGate("booking_creation", ctx({ trial: makeTrial("not_started") }));
    expect(d.outcome).toBe("deny");
    expect(d.reason).toBe("trial_not_started");
  });

  it("upgraded trial without sub yet → allow (webhook race)", () => {
    const d = decideGate("booking_creation", ctx({ trial: makeTrial("upgraded") }));
    expect(d.outcome).toBe("allow");
  });

  it("no trial + no sub → deny with trial_not_started", () => {
    const d = decideGate("booking_creation", ctx());
    expect(d.outcome).toBe("deny");
    expect(d.reason).toBe("trial_not_started");
  });
});

describe("decideGate — subscription.trialing falls back to trial state", () => {
  it("trialing sub + active trial → allow", () => {
    const d = decideGate(
      "booking_creation",
      ctx({ subscription: makeSubscription({ status: "trialing" }), trial: makeTrial("active") }),
    );
    expect(d.outcome).toBe("allow");
  });

  it("trialing sub + expired trial → deny", () => {
    const d = decideGate(
      "booking_creation",
      ctx({ subscription: makeSubscription({ status: "trialing" }), trial: makeTrial("expired") }),
    );
    expect(d.outcome).toBe("deny");
  });
});

// ---------------------------------------------------------------------------
// buildDenialAudit
// ---------------------------------------------------------------------------

describe("buildDenialAudit", () => {
  it("returns null for allow", () => {
    const d = decideGate("booking_creation", ctx({ subscription: makeSubscription() }));
    expect(buildDenialAudit("tenant_a", "user_a", d, ts(0))).toBeNull();
  });

  it("captures full denial context", () => {
    const d = decideGate(
      "booking_creation",
      ctx({ subscription: makeSubscription({ status: "cancelled" }) }),
    );
    const ev = buildDenialAudit("tenant_a", "user_a", d, ts(123));
    expect(ev).toMatchObject({
      tenantId: "tenant_a",
      userId: "user_a",
      feature: "booking_creation",
      outcome: "deny",
      reason: "cancelled",
      subscriptionStatus: "cancelled",
    });
    expect(ev?.attemptedAt.seconds).toBe(123);
  });
});

// ---------------------------------------------------------------------------
// GatingService
// ---------------------------------------------------------------------------

function makeAuditMock(): { repo: GatingAuditRepository; events: Array<unknown> } {
  const events: Array<unknown> = [];
  return {
    events,
    repo: {
      async recordDenial(event: import("../model").GateDenialAuditEvent) {
        events.push(event);
      },
    },
  };
}

describe("GatingService.check", () => {
  it("allow does not record an audit event", async () => {
    const { repo, events } = makeAuditMock();
    const svc = createGatingService(repo, { now: () => ts(1_000) });
    const d = await svc.check("booking_creation", {
      tenantId: "tenant_a",
      userId: "user_a",
      subscription: makeSubscription({ status: "active" }),
      trial: null,
    });
    expect(d.outcome).toBe("allow");
    expect(events).toHaveLength(0);
  });

  it("deny records an audit event", async () => {
    const { repo, events } = makeAuditMock();
    const svc = createGatingService(repo, { now: () => ts(1_000) });
    const d = await svc.check("booking_creation", {
      tenantId: "tenant_a",
      userId: "user_a",
      subscription: makeSubscription({ status: "cancelled" }),
      trial: null,
    });
    expect(d.outcome).toBe("deny");
    expect(events).toHaveLength(1);
  });

  it("warning is not audited by default but is when auditWarnings=true", async () => {
    const { repo, events } = makeAuditMock();
    const sub = makeSubscription({ status: "past_due", pastDueSince: ts(0) });
    const inputBase = {
      tenantId: "tenant_a",
      userId: "user_a",
      subscription: sub,
      trial: null,
    };

    const svc = createGatingService(repo, { now: () => ts(2 * DAY) });
    const d1 = await svc.check("booking_creation", inputBase);
    expect(d1.outcome).toBe("allow_with_warning");
    expect(events).toHaveLength(0);

    const noisy = createGatingService(repo, { now: () => ts(2 * DAY), auditWarnings: true });
    const d2 = await noisy.check("booking_creation", inputBase);
    expect(d2.outcome).toBe("allow_with_warning");
    expect(events).toHaveLength(1);
  });
});

describe("GatingService.checkAll", () => {
  it("returns one decision per feature group", async () => {
    const { repo } = makeAuditMock();
    const svc = createGatingService(repo, { now: () => ts(1_000) });
    const decisions = await svc.checkAll({
      tenantId: "tenant_a",
      userId: null,
      subscription: makeSubscription({ status: "active" }),
      trial: null,
    });
    expect(decisions.map((d) => d.feature)).toEqual(FEATURE_GROUPS);
    for (const d of decisions) expect(d.outcome).toBe("allow");
  });
});

describe("GatingService.assertAllowed", () => {
  it("passes through warnings and returns the decision", async () => {
    const { repo } = makeAuditMock();
    const svc = createGatingService(repo, { now: () => ts(2 * DAY) });
    const sub = makeSubscription({ status: "past_due", pastDueSince: ts(0) });
    const d = await svc.assertAllowed("booking_creation", {
      tenantId: "tenant_a",
      userId: "user_a",
      subscription: sub,
      trial: null,
    });
    expect(d.outcome).toBe("allow_with_warning");
  });

  it("throws GateDeniedError on deny and the audit is still recorded", async () => {
    const { repo, events } = makeAuditMock();
    const svc = createGatingService(repo, { now: () => ts(1_000) });
    let caught: unknown;
    try {
      await svc.assertAllowed("ai_automations", {
        tenantId: "tenant_a",
        userId: "user_a",
        subscription: makeSubscription({ status: "cancelled" }),
        trial: null,
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(GateDeniedError);
    expect(events).toHaveLength(1);
  });
});

// Cover the unused export to silence typescript "imported but unused"
describe("SubscriptionStatus type re-export", () => {
  it("is referenced for typecheck-only assertion", () => {
    const s: SubscriptionStatus = "active";
    expect(s).toBe("active");
  });
});
