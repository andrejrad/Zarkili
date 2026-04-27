/**
 * stripe/connectDispatcher.test.ts (W13-DEBT-1)
 */

import { describe, it, expect } from "vitest";

import {
  applyConnectEvent,
  ConnectDispatchError,
  type ConnectAccount,
} from "../../src/stripe/connectDispatcher";
import type { ParsedConnectEvent } from "../../src/stripe/parseEvent";

const NOW = { seconds: 1700000000, nanoseconds: 0 };

function makeAccount(overrides: Partial<ConnectAccount> = {}): ConnectAccount {
  return {
    tenantId: "t1",
    stripeAccountId: "acct_1",
    accountType: "express",
    country: "US",
    status: "pending_verification",
    payoutsEnabled: false,
    chargesEnabled: false,
    detailsSubmitted: false,
    taxFormType: null,
    taxFormCapturedAt: null,
    eligible1099K: false,
    lastPayoutFailureAt: null,
    lastPayoutFailureReason: null,
    restrictionReasons: [],
    lastEventId: null,
    createdAt: { seconds: 1690000000, nanoseconds: 0 },
    updatedAt: { seconds: 1690000000, nanoseconds: 0 },
    ...overrides,
  };
}

describe("applyConnectEvent — account.updated", () => {
  it("derives active when charges+payouts enabled, details submitted, no requirements", () => {
    const event: ParsedConnectEvent = {
      id: "evt_1",
      type: "account.updated",
      tenantId: "t1",
      account: {
        stripeAccountId: "acct_1",
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        requirementsCurrentlyDue: [],
        disabledReason: null,
      },
    };
    const r = applyConnectEvent(makeAccount(), event, NOW);
    expect(r.account?.status).toBe("active");
    expect(r.account?.restrictionReasons).toEqual([]);
  });

  it("derives restricted when requirements are present", () => {
    const event: ParsedConnectEvent = {
      id: "evt_2",
      type: "account.updated",
      tenantId: "t1",
      account: {
        stripeAccountId: "acct_1",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: true,
        requirementsCurrentlyDue: ["external_account"],
        disabledReason: "requirements.past_due",
      },
    };
    const r = applyConnectEvent(makeAccount({ status: "active" }), event, NOW);
    expect(r.account?.status).toBe("restricted");
    expect(r.account?.restrictionReasons).toEqual(["external_account"]);
  });

  it("rejects ACCOUNT_MISMATCH when stripe account id differs", () => {
    const event: ParsedConnectEvent = {
      id: "evt_3",
      type: "account.updated",
      tenantId: "t1",
      account: {
        stripeAccountId: "acct_OTHER",
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        requirementsCurrentlyDue: [],
        disabledReason: null,
      },
    };
    expect(() => applyConnectEvent(makeAccount(), event, NOW)).toThrow(
      ConnectDispatchError,
    );
  });

  it("throws ACCOUNT_NOT_FOUND when current is null", () => {
    const event: ParsedConnectEvent = {
      id: "evt_x",
      type: "account.updated",
      tenantId: "t1",
      account: {
        stripeAccountId: "acct_1",
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        requirementsCurrentlyDue: [],
        disabledReason: null,
      },
    };
    expect(() => applyConnectEvent(null, event, NOW)).toThrow(/ACCOUNT_NOT_FOUND/);
  });
});

describe("applyConnectEvent — payout events", () => {
  it("payout.failed stamps failure fields", () => {
    const event: ParsedConnectEvent = {
      id: "evt_pf",
      type: "payout.failed",
      tenantId: "t1",
      payout: {
        stripeAccountId: "acct_1",
        payoutId: "po_1",
        failureCode: "account_closed",
        failureMessage: "Bank account is closed",
      },
    };
    const r = applyConnectEvent(makeAccount(), event, NOW);
    expect(r.account?.lastPayoutFailureAt).toEqual(NOW);
    expect(r.account?.lastPayoutFailureReason).toBe("Bank account is closed");
  });

  it("payout.failed falls back to failureCode when message is null", () => {
    const event: ParsedConnectEvent = {
      id: "evt_pf2",
      type: "payout.failed",
      tenantId: "t1",
      payout: {
        stripeAccountId: "acct_1",
        payoutId: "po_2",
        failureCode: "account_closed",
        failureMessage: null,
      },
    };
    const r = applyConnectEvent(makeAccount(), event, NOW);
    expect(r.account?.lastPayoutFailureReason).toBe("account_closed");
  });

  it("payout.paid clears failure state", () => {
    const event: ParsedConnectEvent = {
      id: "evt_pp",
      type: "payout.paid",
      tenantId: "t1",
      payout: {
        stripeAccountId: "acct_1",
        payoutId: "po_3",
        failureCode: null,
        failureMessage: null,
      },
    };
    const r = applyConnectEvent(
      makeAccount({
        lastPayoutFailureAt: { seconds: 1699000000, nanoseconds: 0 },
        lastPayoutFailureReason: "old_reason",
      }),
      event,
      NOW,
    );
    expect(r.account?.lastPayoutFailureAt).toBeNull();
    expect(r.account?.lastPayoutFailureReason).toBeNull();
  });
});
