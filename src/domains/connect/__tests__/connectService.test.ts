import type { Timestamp } from "firebase/firestore";

import {
  ConnectError,
  deriveConnectStatusFromAccount,
  isValidConnectTransition,
  type ConnectAccount,
  type ConnectStatus,
  type StripeAccountPayload,
} from "../model";
import type { ConnectRepository } from "../repository";
import { buildInitialAccount, createConnectService } from "../connectService";

// ---------------------------------------------------------------------------
// In-memory ConnectRepository fake
// ---------------------------------------------------------------------------

type Store = {
  accounts: Map<string, ConnectAccount>;
  events: Map<string, Set<string>>;
};

function makeRepo(): { repo: ConnectRepository; store: Store } {
  const store: Store = { accounts: new Map(), events: new Map() };

  const repo: ConnectRepository = {
    async getAccount(tenantId) {
      return store.accounts.get(tenantId) ?? null;
    },
    async saveAccount(account) {
      store.accounts.set(account.tenantId, { ...account });
    },
    async saveAccountWithIdempotency(account, eventId) {
      store.accounts.set(account.tenantId, { ...account });
      const set = store.events.get(account.tenantId) ?? new Set<string>();
      set.add(eventId);
      store.events.set(account.tenantId, set);
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

const TENANT = "tenantUS";

let nowSeconds = 1_000_000;
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
  const service = createConnectService(repo, { now: fakeNow });
  return { service, repo, store };
}

function accountPayload(overrides: Partial<StripeAccountPayload> = {}): StripeAccountPayload {
  return {
    stripeAccountId: "acct_1",
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    requirementsCurrentlyDue: [],
    disabledReason: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe("deriveConnectStatusFromAccount", () => {
  it("active when charges + payouts enabled and no requirements outstanding", () => {
    expect(
      deriveConnectStatusFromAccount(
        accountPayload({ chargesEnabled: true, payoutsEnabled: true, detailsSubmitted: true }),
      ),
    ).toBe("active");
  });

  it("restricted when details submitted but charges disabled", () => {
    expect(
      deriveConnectStatusFromAccount(
        accountPayload({
          chargesEnabled: false,
          payoutsEnabled: true,
          detailsSubmitted: true,
          disabledReason: "requirements.past_due",
        }),
      ),
    ).toBe("restricted");
  });

  it("restricted when payouts disabled after details submitted", () => {
    expect(
      deriveConnectStatusFromAccount(
        accountPayload({ chargesEnabled: true, payoutsEnabled: false, detailsSubmitted: true }),
      ),
    ).toBe("restricted");
  });

  it("pending_verification when details not yet submitted", () => {
    expect(
      deriveConnectStatusFromAccount(
        accountPayload({ chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false }),
      ),
    ).toBe("pending_verification");
  });

  it("pending_verification when active fields true but requirements outstanding", () => {
    expect(
      deriveConnectStatusFromAccount(
        accountPayload({
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
          requirementsCurrentlyDue: ["individual.verification.document"],
        }),
      ),
    ).toBe("pending_verification");
  });
});

describe("isValidConnectTransition", () => {
  const allowed: Array<[ConnectStatus, ConnectStatus]> = [
    ["pending_verification", "active"],
    ["pending_verification", "restricted"],
    ["active", "restricted"],
    ["restricted", "active"],
    ["restricted", "pending_verification"],
  ];
  const forbidden: Array<[ConnectStatus, ConnectStatus]> = [
    ["active", "pending_verification"],
    ["active", "not_started"],
  ];

  it.each(allowed)("allows %s -> %s", (from, to) => {
    expect(isValidConnectTransition(from, to)).toBe(true);
  });
  it.each(forbidden)("forbids %s -> %s", (from, to) => {
    expect(isValidConnectTransition(from, to)).toBe(false);
  });
});

describe("buildInitialAccount", () => {
  it("requires tax form for US salons", () => {
    expect(() =>
      buildInitialAccount(
        {
          tenantId: TENANT,
          country: "US",
          stripeAccountId: "acct_1",
          taxFormType: null,
        },
        ts(1_000_000),
      ),
    ).toThrow(ConnectError);
  });

  it("captures w9 + capture timestamp for US salons", () => {
    const acc = buildInitialAccount(
      { tenantId: TENANT, country: "US", stripeAccountId: "acct_1", taxFormType: "w9" },
      ts(1_000_000),
    );
    expect(acc.taxFormType).toBe("w9");
    expect(acc.taxFormCapturedAt).toEqual(ts(1_000_000));
    expect(acc.accountType).toBe("express");
    expect(acc.status).toBe("pending_verification");
  });

  it("permits null tax form for non-US salons", () => {
    const acc = buildInitialAccount(
      { tenantId: "tenantFR", country: "FR", stripeAccountId: "acct_2", taxFormType: null },
      ts(1_000_000),
    );
    expect(acc.taxFormType).toBeNull();
    expect(acc.country).toBe("FR");
  });
});

// ---------------------------------------------------------------------------
// Service — onboardAccount + applyAccountEvent
// ---------------------------------------------------------------------------

describe("createConnectService — onboardAccount", () => {
  it("persists initial pending_verification account", async () => {
    const { service, store } = makeService();
    const account = await service.onboardAccount({
      tenantId: TENANT,
      country: "US",
      stripeAccountId: "acct_1",
      taxFormType: "w9",
    });
    expect(account.status).toBe("pending_verification");
    expect(account.taxFormType).toBe("w9");
    expect(store.accounts.get(TENANT)?.stripeAccountId).toBe("acct_1");
  });
});

describe("createConnectService — applyAccountEvent", () => {
  async function withOnboarded() {
    const ctx = makeService();
    await ctx.service.onboardAccount({
      tenantId: TENANT,
      country: "US",
      stripeAccountId: "acct_1",
      taxFormType: "w9",
    });
    return ctx;
  }

  it("transitions pending_verification -> active on full Stripe approval", async () => {
    const { service } = await withOnboarded();
    const result = await service.applyAccountEvent({
      id: "evt_acc_1",
      type: "account.updated",
      tenantId: TENANT,
      account: accountPayload({
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
      }),
    });
    expect(result.outcome).toBe("applied");
    expect(result.fromStatus).toBe("pending_verification");
    expect(result.toStatus).toBe("active");
    expect(result.account?.restrictionReasons).toEqual([]);
  });

  it("captures restriction reasons when account becomes restricted", async () => {
    const { service } = await withOnboarded();
    // First reach active
    await service.applyAccountEvent({
      id: "evt_acc_a",
      type: "account.updated",
      tenantId: TENANT,
      account: accountPayload({
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
      }),
    });
    // Then become restricted with payouts disabled
    nowSeconds = 1_100_000;
    const result = await service.applyAccountEvent({
      id: "evt_acc_b",
      type: "account.updated",
      tenantId: TENANT,
      account: accountPayload({
        chargesEnabled: true,
        payoutsEnabled: false,
        detailsSubmitted: true,
        requirementsCurrentlyDue: ["individual.verification.document"],
        disabledReason: "requirements.past_due",
      }),
    });
    expect(result.toStatus).toBe("restricted");
    expect(result.account?.restrictionReasons).toContain("individual.verification.document");
    expect(result.account?.restrictionReasons).toContain("requirements.past_due");
  });

  it("recovers restricted -> active after Stripe re-enables", async () => {
    const { service } = await withOnboarded();
    await service.applyAccountEvent({
      id: "evt_a",
      type: "account.updated",
      tenantId: TENANT,
      account: accountPayload({
        chargesEnabled: false,
        payoutsEnabled: true,
        detailsSubmitted: true,
        disabledReason: "requirements.past_due",
      }),
    });
    const recover = await service.applyAccountEvent({
      id: "evt_b",
      type: "account.updated",
      tenantId: TENANT,
      account: accountPayload({
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
      }),
    });
    expect(recover.fromStatus).toBe("restricted");
    expect(recover.toStatus).toBe("active");
    expect(recover.account?.restrictionReasons).toEqual([]);
  });

  it("is idempotent — replaying same event yields duplicate outcome", async () => {
    const { service, store } = await withOnboarded();
    const event = {
      id: "evt_dup",
      type: "account.updated" as const,
      tenantId: TENANT,
      account: accountPayload({
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
      }),
    };
    await service.applyAccountEvent(event);
    const second = await service.applyAccountEvent(event);
    expect(second.outcome).toBe("duplicate");
    expect(store.events.get(TENANT)?.size).toBe(1);
  });

  it("payout.failed records failure metadata without changing status", async () => {
    const { service } = await withOnboarded();
    await service.applyAccountEvent({
      id: "evt_active",
      type: "account.updated",
      tenantId: TENANT,
      account: accountPayload({
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
      }),
    });
    nowSeconds = 1_200_000;
    const result = await service.applyAccountEvent({
      id: "evt_payout_fail",
      type: "payout.failed",
      tenantId: TENANT,
      payout: {
        stripeAccountId: "acct_1",
        payoutId: "po_1",
        failureCode: "account_closed",
        failureMessage: "Bank account is closed",
      },
    });
    expect(result.outcome).toBe("applied");
    expect(result.toStatus).toBe("active");
    expect(result.account?.lastPayoutFailureAt).toEqual(ts(1_200_000));
    expect(result.account?.lastPayoutFailureReason).toBe("Bank account is closed");
  });

  it("payout.paid is informational and idempotency-recorded", async () => {
    const { service, store } = await withOnboarded();
    const result = await service.applyAccountEvent({
      id: "evt_paid",
      type: "payout.paid",
      tenantId: TENANT,
      payout: {
        stripeAccountId: "acct_1",
        payoutId: "po_2",
        failureCode: null,
        failureMessage: null,
      },
    });
    expect(result.outcome).toBe("ignored");
    expect(store.events.get(TENANT)?.has("evt_paid")).toBe(true);
  });

  it("rejects account.updated when no account exists for tenant", async () => {
    const { service } = makeService();
    await expect(
      service.applyAccountEvent({
        id: "evt_x",
        type: "account.updated",
        tenantId: TENANT,
        account: accountPayload(),
      }),
    ).rejects.toThrow(ConnectError);
  });

  it("rejects events without id or tenantId", async () => {
    const { service } = await withOnboarded();
    await expect(
      service.applyAccountEvent({
        id: "",
        type: "account.updated",
        tenantId: TENANT,
        account: accountPayload(),
      }),
    ).rejects.toThrow(ConnectError);
    await expect(
      service.applyAccountEvent({
        id: "evt_x",
        type: "account.updated",
        tenantId: "",
        account: accountPayload(),
      }),
    ).rejects.toThrow(ConnectError);
  });
});
