/**
 * stripe/parseEvent.test.ts (W13-DEBT-1, W13-DEBT-4)
 *
 * Validates the pure Stripe webhook → domain envelope mapper.
 * - All 6 supported billing types
 * - All 3 supported connect types
 * - cancelAtPeriodEnd preservation (W13-DEBT-4)
 * - Tenant resolver fallback (metadata > customer/subscription/account lookup)
 * - Error paths (UNSUPPORTED_TYPE / MISSING_FIELD / TENANT_UNRESOLVED /
 *   INVALID_PLAN / INVALID_INTERVAL)
 */

import { describe, it, expect, vi } from "vitest";

import {
  parseStripeEvent,
  StripeEventParseError,
  type TenantResolver,
} from "../../src/stripe/parseEvent";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const TENANT = "tenant_abc";

const fixedTenantResolver: TenantResolver = async (lookup) => {
  if (lookup.metadataTenantId) return lookup.metadataTenantId;
  if (lookup.stripeCustomerId === "cus_known") return TENANT;
  if (lookup.stripeSubscriptionId === "sub_known") return TENANT;
  if (lookup.stripeAccountId === "acct_known") return TENANT;
  return null;
};

function subscriptionEvent(overrides: {
  type?: string;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, unknown>;
  interval?: string;
  customer?: string;
  subId?: string;
  status?: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  trialEnd?: number | null;
} = {}) {
  return {
    id: "evt_sub_1",
    type: overrides.type ?? "customer.subscription.updated",
    data: {
      object: {
        id: overrides.subId ?? "sub_known",
        customer: overrides.customer ?? "cus_known",
        status: overrides.status ?? "active",
        cancel_at_period_end: overrides.cancelAtPeriodEnd ?? false,
        current_period_start: overrides.currentPeriodStart ?? 1700000000,
        current_period_end: overrides.currentPeriodEnd ?? 1702592000,
        trial_end: overrides.trialEnd ?? null,
        metadata: overrides.metadata ?? { planId: "professional" },
        items: { data: [{ plan: { interval: overrides.interval ?? "month" } }] },
      },
    },
  };
}

function invoiceEvent(type: "invoice.payment_failed" | "invoice.payment_succeeded", overrides: {
  status?: string;
  customer?: string;
  subId?: string;
} = {}) {
  return {
    id: type === "invoice.payment_failed" ? "evt_inv_failed_1" : "evt_inv_paid_1",
    type,
    data: {
      object: {
        customer: overrides.customer ?? "cus_known",
        subscription: overrides.subId ?? "sub_known",
        status: overrides.status ?? (type === "invoice.payment_failed" ? "open" : "paid"),
      },
    },
  };
}

function accountUpdatedEvent(overrides: {
  account?: string;
  charges?: boolean;
  payouts?: boolean;
  detailsSubmitted?: boolean;
  currentlyDue?: string[];
  disabledReason?: string | null;
  metadataTenantId?: string;
} = {}) {
  return {
    id: "evt_acct_1",
    type: "account.updated",
    account: overrides.account ?? "acct_known",
    data: {
      object: {
        id: overrides.account ?? "acct_known",
        charges_enabled: overrides.charges ?? true,
        payouts_enabled: overrides.payouts ?? true,
        details_submitted: overrides.detailsSubmitted ?? true,
        requirements: {
          currently_due: overrides.currentlyDue ?? [],
          disabled_reason: overrides.disabledReason ?? null,
        },
        metadata: overrides.metadataTenantId ? { tenantId: overrides.metadataTenantId } : {},
      },
    },
  };
}

function payoutEvent(type: "payout.failed" | "payout.paid", overrides: {
  account?: string;
  payoutId?: string;
  failureCode?: string | null;
  failureMessage?: string | null;
} = {}) {
  return {
    id: type === "payout.failed" ? "evt_payout_failed_1" : "evt_payout_paid_1",
    type,
    account: overrides.account ?? "acct_known",
    data: {
      object: {
        id: overrides.payoutId ?? "po_1",
        failure_code: overrides.failureCode ?? null,
        failure_message: overrides.failureMessage ?? null,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Top-level dispatch
// ---------------------------------------------------------------------------

describe("parseStripeEvent — top-level", () => {
  it("returns kind=ignored for unsupported event types", async () => {
    const out = await parseStripeEvent(
      { id: "evt_x", type: "charge.dispute.created", data: { object: {} } },
      fixedTenantResolver,
    );
    expect(out).toEqual({
      kind: "ignored",
      type: "charge.dispute.created",
      reason: "unsupported event type",
    });
  });

  it("throws MISSING_FIELD when payload is not an object", async () => {
    await expect(parseStripeEvent(null, fixedTenantResolver)).rejects.toBeInstanceOf(
      StripeEventParseError,
    );
  });

  it("throws MISSING_FIELD when id or type is absent", async () => {
    await expect(
      parseStripeEvent({ type: "customer.subscription.created" }, fixedTenantResolver),
    ).rejects.toMatchObject({ code: "MISSING_FIELD" });
    await expect(
      parseStripeEvent({ id: "evt_1" }, fixedTenantResolver),
    ).rejects.toMatchObject({ code: "MISSING_FIELD" });
  });
});

// ---------------------------------------------------------------------------
// Billing — subscription events
// ---------------------------------------------------------------------------

describe("parseStripeEvent — subscription events", () => {
  it("parses customer.subscription.created", async () => {
    const out = await parseStripeEvent(
      subscriptionEvent({ type: "customer.subscription.created" }),
      fixedTenantResolver,
    );
    expect(out.kind).toBe("billing");
    if (out.kind !== "billing") return;
    expect(out.event.type).toBe("customer.subscription.created");
    expect(out.event.tenantId).toBe(TENANT);
    expect(out.event.subscription?.planId).toBe("professional");
    expect(out.event.subscription?.interval).toBe("monthly");
    expect(out.event.subscription?.cancelAtPeriodEnd).toBe(false);
  });

  it("preserves cancelAtPeriodEnd=true on subscription.updated (W13-DEBT-4)", async () => {
    const out = await parseStripeEvent(
      subscriptionEvent({
        type: "customer.subscription.updated",
        cancelAtPeriodEnd: true,
      }),
      fixedTenantResolver,
    );
    if (out.kind !== "billing") throw new Error("expected billing kind");
    expect(out.event.subscription?.cancelAtPeriodEnd).toBe(true);
    expect(out.event.subscription?.currentPeriodEnd).toEqual({
      seconds: 1702592000,
      nanoseconds: 0,
    });
  });

  it("parses customer.subscription.deleted", async () => {
    const out = await parseStripeEvent(
      subscriptionEvent({ type: "customer.subscription.deleted", status: "canceled" }),
      fixedTenantResolver,
    );
    if (out.kind !== "billing") throw new Error("expected billing");
    expect(out.event.type).toBe("customer.subscription.deleted");
    expect(out.event.subscription?.stripeStatus).toBe("canceled");
  });

  it("parses customer.subscription.trial_will_end", async () => {
    const out = await parseStripeEvent(
      subscriptionEvent({
        type: "customer.subscription.trial_will_end",
        trialEnd: 1700100000,
      }),
      fixedTenantResolver,
    );
    if (out.kind !== "billing") throw new Error("expected billing");
    expect(out.event.subscription?.trialEndsAt).toEqual({
      seconds: 1700100000,
      nanoseconds: 0,
    });
  });

  it("normalises plan aliases (pro → professional) and interval aliases (year → annual)", async () => {
    const out = await parseStripeEvent(
      subscriptionEvent({ metadata: { planId: "PRO" }, interval: "Year" }),
      fixedTenantResolver,
    );
    if (out.kind !== "billing") throw new Error("expected billing");
    expect(out.event.subscription?.planId).toBe("professional");
    expect(out.event.subscription?.interval).toBe("annual");
  });

  it("throws INVALID_PLAN when metadata.planId is missing", async () => {
    await expect(
      parseStripeEvent(subscriptionEvent({ metadata: {} }), fixedTenantResolver),
    ).rejects.toMatchObject({ code: "INVALID_PLAN" });
  });

  it("throws INVALID_PLAN when metadata.planId is unrecognised", async () => {
    await expect(
      parseStripeEvent(
        subscriptionEvent({ metadata: { planId: "platinum" } }),
        fixedTenantResolver,
      ),
    ).rejects.toMatchObject({ code: "INVALID_PLAN" });
  });

  it("throws INVALID_INTERVAL when interval is unrecognised", async () => {
    await expect(
      parseStripeEvent(
        subscriptionEvent({ interval: "fortnight" }),
        fixedTenantResolver,
      ),
    ).rejects.toMatchObject({ code: "INVALID_INTERVAL" });
  });

  it("throws MISSING_FIELD when current_period_start is absent", async () => {
    const evt = subscriptionEvent();
    delete (evt.data.object as Record<string, unknown>).current_period_start;
    await expect(parseStripeEvent(evt, fixedTenantResolver)).rejects.toMatchObject({
      code: "MISSING_FIELD",
    });
  });

  it("prefers metadata.tenantId over customer-based resolver", async () => {
    const resolver = vi.fn(fixedTenantResolver);
    const out = await parseStripeEvent(
      subscriptionEvent({
        metadata: { planId: "starter", tenantId: "tenant_via_metadata" },
        customer: "cus_unknown",
      }),
      resolver,
    );
    if (out.kind !== "billing") throw new Error("expected billing");
    expect(out.event.tenantId).toBe("tenant_via_metadata");
    expect(resolver).toHaveBeenCalledWith(
      expect.objectContaining({ metadataTenantId: "tenant_via_metadata" }),
    );
  });

  it("throws TENANT_UNRESOLVED when resolver returns null", async () => {
    await expect(
      parseStripeEvent(
        subscriptionEvent({ customer: "cus_unknown", subId: "sub_unknown" }),
        async () => null,
      ),
    ).rejects.toMatchObject({ code: "TENANT_UNRESOLVED" });
  });
});

// ---------------------------------------------------------------------------
// Billing — invoice events
// ---------------------------------------------------------------------------

describe("parseStripeEvent — invoice events", () => {
  it("parses invoice.payment_failed", async () => {
    const out = await parseStripeEvent(
      invoiceEvent("invoice.payment_failed"),
      fixedTenantResolver,
    );
    if (out.kind !== "billing") throw new Error("expected billing");
    expect(out.event.type).toBe("invoice.payment_failed");
    expect(out.event.invoice?.invoiceStatus).toBe("open");
    expect(out.event.invoice?.stripeSubscriptionId).toBe("sub_known");
    expect(out.event.subscription).toBeUndefined();
  });

  it("parses invoice.payment_succeeded", async () => {
    const out = await parseStripeEvent(
      invoiceEvent("invoice.payment_succeeded"),
      fixedTenantResolver,
    );
    if (out.kind !== "billing") throw new Error("expected billing");
    expect(out.event.invoice?.invoiceStatus).toBe("paid");
  });
});

// ---------------------------------------------------------------------------
// Connect events
// ---------------------------------------------------------------------------

describe("parseStripeEvent — connect events", () => {
  it("parses account.updated with requirements list", async () => {
    const out = await parseStripeEvent(
      accountUpdatedEvent({
        currentlyDue: ["external_account", "tos_acceptance.date"],
        disabledReason: "requirements.past_due",
        charges: false,
        payouts: false,
      }),
      fixedTenantResolver,
    );
    expect(out.kind).toBe("connect");
    if (out.kind !== "connect") return;
    expect(out.event.type).toBe("account.updated");
    expect(out.event.account).toEqual({
      stripeAccountId: "acct_known",
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: true,
      requirementsCurrentlyDue: ["external_account", "tos_acceptance.date"],
      disabledReason: "requirements.past_due",
    });
  });

  it("parses payout.failed with failure_code/message", async () => {
    const out = await parseStripeEvent(
      payoutEvent("payout.failed", {
        payoutId: "po_99",
        failureCode: "account_closed",
        failureMessage: "Bank account is closed",
      }),
      fixedTenantResolver,
    );
    if (out.kind !== "connect") throw new Error("expected connect");
    expect(out.event.payout).toEqual({
      stripeAccountId: "acct_known",
      payoutId: "po_99",
      failureCode: "account_closed",
      failureMessage: "Bank account is closed",
    });
  });

  it("parses payout.paid with null failure fields", async () => {
    const out = await parseStripeEvent(
      payoutEvent("payout.paid"),
      fixedTenantResolver,
    );
    if (out.kind !== "connect") throw new Error("expected connect");
    expect(out.event.type).toBe("payout.paid");
    expect(out.event.payout?.failureCode).toBeNull();
  });

  it("throws TENANT_UNRESOLVED when account is unknown", async () => {
    await expect(
      parseStripeEvent(
        accountUpdatedEvent({ account: "acct_unknown" }),
        async () => null,
      ),
    ).rejects.toMatchObject({ code: "TENANT_UNRESOLVED" });
  });
});
