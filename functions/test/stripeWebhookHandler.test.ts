/**
 * stripeWebhookHandler.test.ts (W13-DEBT-1, W13-DEBT-4)
 *
 * Integration test for the pure handler. Uses in-memory billing/connect
 * repository stubs and a self-signed Stripe-Signature header.
 */

import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";

import { handleStripeWebhook } from "../src/stripeWebhookHandler";
import type { Subscription } from "../src/stripe/billingDispatcher";
import type { ConnectAccount } from "../src/stripe/connectDispatcher";

const SECRET = "whsec_test";
const TENANT = "t1";
const NOW_S = 1700000000;
const NOW_TS = { seconds: NOW_S, nanoseconds: 0 };

function sign(body: string, t = NOW_S, secret = SECRET): string {
  const sig = createHmac("sha256", secret)
    .update(`${t}.${body}`, "utf8")
    .digest("hex");
  return `t=${t},v1=${sig}`;
}

type State = {
  subs: Map<string, Subscription>;
  accounts: Map<string, ConnectAccount>;
  billingIdemp: Set<string>;
  connectIdemp: Set<string>;
};

function makeDeps(initial?: Partial<State>): { deps: any; state: State } {
  const state: State = {
    subs: new Map(initial?.subs ?? []),
    accounts: new Map(initial?.accounts ?? []),
    billingIdemp: new Set(initial?.billingIdemp ?? []),
    connectIdemp: new Set(initial?.connectIdemp ?? []),
  };
  const billing = {
    async hasProcessedEvent(tid: string, eid: string) {
      return state.billingIdemp.has(`${tid}:${eid}`);
    },
    async getSubscription(tid: string) {
      return state.subs.get(tid) ?? null;
    },
    async saveSubscriptionWithIdempotency(sub: Subscription, eid: string) {
      state.subs.set(sub.tenantId, sub);
      state.billingIdemp.add(`${sub.tenantId}:${eid}`);
    },
    async recordProcessedEvent(tid: string, eid: string) {
      state.billingIdemp.add(`${tid}:${eid}`);
    },
    async resolveTenantBySubscriptionId(subId: string) {
      for (const [, s] of state.subs) {
        if (s.stripeSubscriptionId === subId) return s.tenantId;
      }
      return null;
    },
    async resolveTenantByCustomerId(cusId: string) {
      for (const [, s] of state.subs) {
        if (s.stripeCustomerId === cusId) return s.tenantId;
      }
      return null;
    },
  };
  const connect = {
    async hasProcessedEvent(tid: string, eid: string) {
      return state.connectIdemp.has(`${tid}:${eid}`);
    },
    async getAccount(tid: string) {
      return state.accounts.get(tid) ?? null;
    },
    async saveAccountWithIdempotency(acc: ConnectAccount, eid: string) {
      state.accounts.set(acc.tenantId, acc);
      state.connectIdemp.add(`${acc.tenantId}:${eid}`);
    },
    async resolveTenantByAccountId(acctId: string) {
      for (const [, a] of state.accounts) {
        if (a.stripeAccountId === acctId) return a.tenantId;
      }
      return null;
    },
  };
  return {
    state,
    deps: { billing, connect, now: () => NOW_TS },
  };
}

function subPayload(opts: { evtId?: string; tenantId?: string; cancel?: boolean } = {}) {
  return JSON.stringify({
    id: opts.evtId ?? "evt_sub_created",
    type: "customer.subscription.created",
    data: {
      object: {
        id: "sub_1",
        customer: "cus_1",
        status: "active",
        cancel_at_period_end: opts.cancel ?? false,
        current_period_start: 1697408000,
        current_period_end: 1702592000,
        trial_end: null,
        metadata: { planId: "professional", tenantId: opts.tenantId ?? TENANT },
        items: { data: [{ plan: { interval: "month" } }] },
      },
    },
  });
}

describe("handleStripeWebhook", () => {
  it("rejects missing signature with 401", async () => {
    const body = subPayload();
    const { deps } = makeDeps();
    const r = await handleStripeWebhook({
      rawBody: body,
      signatureHeader: undefined,
      webhookSecret: SECRET,
      nowSeconds: NOW_S,
      deps,
    });
    expect(r.status).toBe(401);
  });

  it("rejects bad signature with 401", async () => {
    const body = subPayload();
    const { deps } = makeDeps();
    const r = await handleStripeWebhook({
      rawBody: body,
      signatureHeader: `t=${NOW_S},v1=deadbeef`,
      webhookSecret: SECRET,
      nowSeconds: NOW_S,
      deps,
    });
    expect(r.status).toBe(401);
  });

  it("returns 400 for invalid JSON after signature passes", async () => {
    const body = "not json";
    const { deps } = makeDeps();
    const r = await handleStripeWebhook({
      rawBody: body,
      signatureHeader: sign(body),
      webhookSecret: SECRET,
      nowSeconds: NOW_S,
      deps,
    });
    expect(r.status).toBe(400);
  });

  it("ignores unsupported event types with 200", async () => {
    const body = JSON.stringify({
      id: "evt_x",
      type: "charge.dispute.created",
      data: { object: {} },
    });
    const { deps } = makeDeps();
    const r = await handleStripeWebhook({
      rawBody: body,
      signatureHeader: sign(body),
      webhookSecret: SECRET,
      nowSeconds: NOW_S,
      deps,
    });
    expect(r).toEqual({
      status: 200,
      body: { received: true, outcome: "ignored" },
    });
  });

  it("creates a subscription end-to-end", async () => {
    const body = subPayload();
    const { deps, state } = makeDeps();
    const r = await handleStripeWebhook({
      rawBody: body,
      signatureHeader: sign(body),
      webhookSecret: SECRET,
      nowSeconds: NOW_S,
      deps,
    });
    expect(r.status).toBe(200);
    expect(state.subs.get(TENANT)?.status).toBe("active");
    expect(state.billingIdemp.has(`${TENANT}:evt_sub_created`)).toBe(true);
  });

  it("returns duplicate on a repeat event id", async () => {
    const body = subPayload();
    const { deps, state } = makeDeps({ billingIdemp: new Set([`${TENANT}:evt_sub_created`]) });
    state.subs.set(TENANT, {
      tenantId: TENANT,
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      planId: "professional",
      interval: "monthly",
      status: "active",
      currentPeriodStart: NOW_TS,
      currentPeriodEnd: NOW_TS,
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      pastDueSince: null,
      lastEventId: "evt_sub_created",
      createdAt: NOW_TS,
      updatedAt: NOW_TS,
    });
    const r = await handleStripeWebhook({
      rawBody: body,
      signatureHeader: sign(body),
      webhookSecret: SECRET,
      nowSeconds: NOW_S,
      deps,
    });
    expect(r).toEqual({
      status: 200,
      body: { received: true, outcome: "duplicate" },
    });
  });

  it("preserves cancelAtPeriodEnd on update (W13-DEBT-4 e2e)", async () => {
    // Seed with an active subscription
    const seed: Subscription = {
      tenantId: TENANT,
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      planId: "professional",
      interval: "monthly",
      status: "active",
      currentPeriodStart: NOW_TS,
      currentPeriodEnd: { seconds: 1702592000, nanoseconds: 0 },
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      pastDueSince: null,
      lastEventId: null,
      createdAt: NOW_TS,
      updatedAt: NOW_TS,
    };
    const { deps, state } = makeDeps();
    state.subs.set(TENANT, seed);

    const body = JSON.stringify({
      id: "evt_cancel_at_period_end",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          status: "active",
          cancel_at_period_end: true,
          current_period_start: 1697408000,
          current_period_end: 1702592000,
          trial_end: null,
          metadata: { planId: "professional", tenantId: TENANT },
          items: { data: [{ plan: { interval: "month" } }] },
        },
      },
    });
    const r = await handleStripeWebhook({
      rawBody: body,
      signatureHeader: sign(body),
      webhookSecret: SECRET,
      nowSeconds: NOW_S,
      deps,
    });
    expect(r.status).toBe(200);
    expect(state.subs.get(TENANT)?.cancelAtPeriodEnd).toBe(true);
    expect(state.subs.get(TENANT)?.status).toBe("active");
  });

  it("returns 404 when tenant cannot be resolved", async () => {
    const body = JSON.stringify({
      id: "evt_unresolved",
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_x",
          customer: "cus_unknown",
          status: "active",
          cancel_at_period_end: false,
          current_period_start: 1697408000,
          current_period_end: 1702592000,
          trial_end: null,
          metadata: { planId: "professional" },
          items: { data: [{ plan: { interval: "month" } }] },
        },
      },
    });
    const { deps } = makeDeps();
    const r = await handleStripeWebhook({
      rawBody: body,
      signatureHeader: sign(body),
      webhookSecret: SECRET,
      nowSeconds: NOW_S,
      deps,
    });
    expect(r.status).toBe(404);
  });
});
