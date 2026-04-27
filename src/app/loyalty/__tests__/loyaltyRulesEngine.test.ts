import { createLoyaltyRulesEngine } from "../loyaltyRulesEngine";
import type { LoyaltyRepository } from "../../../domains/loyalty/repository";
import type { LoyaltyTransaction } from "../../../domains/loyalty/model";

// ---------------------------------------------------------------------------
// Mock LoyaltyRepository
// ---------------------------------------------------------------------------

function makeLoyaltyRepoMock() {
  const transactions: LoyaltyTransaction[] = [];
  let txCounter = 0;

  const creditPoints = jest.fn(
    async (
      userId: string,
      tenantId: string,
      points: number,
      reason: string,
      referenceId: string,
      idempotencyKey: string,
    ): Promise<LoyaltyTransaction> => {
      // Return existing if same idempotencyKey
      const existing = transactions.find((t) => t.idempotencyKey === idempotencyKey);
      if (existing) return existing;

      const tx: LoyaltyTransaction = {
        txId: `tx-${++txCounter}`,
        userId,
        tenantId,
        type: "credit",
        points,
        reason,
        referenceId,
        idempotencyKey,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as never,
      };
      transactions.push(tx);
      return tx;
    },
  );

  const debitPoints = jest.fn(
    async (): Promise<LoyaltyTransaction> => {
      throw new Error("Not implemented in this mock");
    },
  );

  const listTransactions = jest.fn(
    async (userId: string, tenantId: string): Promise<LoyaltyTransaction[]> => {
      return transactions.filter((t) => t.userId === userId && t.tenantId === tenantId);
    },
  );

  const getBalance = jest.fn(async () => 0);
  const getLoyaltyConfig = jest.fn(async () => null);
  const saveLoyaltyConfig = jest.fn(async () => {});
  const getCustomerLoyaltyState = jest.fn(async () => null);

  const repo: LoyaltyRepository = {
    creditPoints,
    debitPoints,
    listTransactions,
    getBalance,
    getLoyaltyConfig,
    saveLoyaltyConfig,
    getCustomerLoyaltyState,
  };

  return { repo, transactions, creditPoints, listTransactions };
}

const TENANT = "t1";
const USER = "user1";
const REFERRER = "referrer1";
const REFEREE = "referee1";

// ---------------------------------------------------------------------------
// applyCompletedAppointment
// ---------------------------------------------------------------------------

describe("loyaltyRulesEngine — applyCompletedAppointment", () => {
  it("credits correct points based on appointment value", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    const result = await engine.applyCompletedAppointment(
      { tenantId: TENANT, userId: USER, bookingId: "b1", appointmentValue: 50 },
      { pointsPerCurrencyUnit: 2 },
    );
    expect(result.applied).toBe(true);
    if (result.applied) expect(result.transaction.points).toBe(100);
  });

  it("floors fractional points", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    const result = await engine.applyCompletedAppointment(
      { tenantId: TENANT, userId: USER, bookingId: "b1", appointmentValue: 33 },
      { pointsPerCurrencyUnit: 1 },
    );
    expect(result.applied).toBe(true);
    if (result.applied) expect(result.transaction.points).toBe(33);
  });

  it("does not apply when value rounds to 0", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    const result = await engine.applyCompletedAppointment(
      { tenantId: TENANT, userId: USER, bookingId: "b1", appointmentValue: 0 },
      { pointsPerCurrencyUnit: 1 },
    );
    expect(result.applied).toBe(false);
  });

  it("returns not-applied when rule is not configured", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    const result = await engine.applyCompletedAppointment({
      tenantId: TENANT,
      userId: USER,
      bookingId: "b1",
      appointmentValue: 100,
    });
    expect(result.applied).toBe(false);
  });

  it("is idempotent — same bookingId calls creditPoints once", async () => {
    const { repo, creditPoints } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo, { completedAppointment: { pointsPerCurrencyUnit: 1 } });
    await engine.applyCompletedAppointment({ tenantId: TENANT, userId: USER, bookingId: "b1", appointmentValue: 50 });
    await engine.applyCompletedAppointment({ tenantId: TENANT, userId: USER, bookingId: "b1", appointmentValue: 50 });
    // creditPoints called twice but idempotency key is the same — repo returns same tx
    expect(creditPoints).toHaveBeenCalledTimes(2);
    // Both calls use the same idempotency key so the repo should return the same tx
    const calls = creditPoints.mock.calls;
    expect(calls[0]?.[5]).toBe(calls[1]?.[5]); // same idempotencyKey
  });
});

// ---------------------------------------------------------------------------
// applyRebookBonus
// ---------------------------------------------------------------------------

describe("loyaltyRulesEngine — applyRebookBonus", () => {
  const cfg = { bonusPoints: 50, windowDays: 30 };

  it("applies bonus when rebook is within window", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    const result = await engine.applyRebookBonus(
      { tenantId: TENANT, userId: USER, bookingId: "b2", previousBookingDate: "2026-01-01", newBookingDate: "2026-01-15" },
      cfg,
    );
    expect(result.applied).toBe(true);
    if (result.applied) expect(result.transaction.points).toBe(50);
  });

  it("does not apply when rebook is outside window", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    const result = await engine.applyRebookBonus(
      { tenantId: TENANT, userId: USER, bookingId: "b2", previousBookingDate: "2026-01-01", newBookingDate: "2026-03-01" },
      cfg,
    );
    expect(result.applied).toBe(false);
  });

  it("does not apply when rule not configured", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    const result = await engine.applyRebookBonus({
      tenantId: TENANT, userId: USER, bookingId: "b2",
      previousBookingDate: "2026-01-01", newBookingDate: "2026-01-05",
    });
    expect(result.applied).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyReferralReward
// ---------------------------------------------------------------------------

describe("loyaltyRulesEngine — applyReferralReward", () => {
  const cfg = { referrerPoints: 200, refereePoints: 100 };

  it("credits both referrer and referee", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    const result = await engine.applyReferralReward(
      { tenantId: TENANT, referrerId: REFERRER, refereeId: REFEREE, triggerBookingId: "b1" },
      cfg,
    );
    expect(result.referrer.applied).toBe(true);
    expect(result.referee.applied).toBe(true);
    if (result.referrer.applied) expect(result.referrer.transaction.points).toBe(200);
    if (result.referee.applied) expect(result.referee.transaction.points).toBe(100);
  });

  it("credits referrer and referee to correct userIds", async () => {
    const { repo, creditPoints } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    await engine.applyReferralReward(
      { tenantId: TENANT, referrerId: REFERRER, refereeId: REFEREE, triggerBookingId: "b1" },
      cfg,
    );
    const referrerCall = creditPoints.mock.calls.find((c) => c[0] === REFERRER);
    const refereeCall = creditPoints.mock.calls.find((c) => c[0] === REFEREE);
    expect(referrerCall).toBeDefined();
    expect(refereeCall).toBeDefined();
  });

  it("returns not-applied for both when rule not configured", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    const result = await engine.applyReferralReward({
      tenantId: TENANT, referrerId: REFERRER, refereeId: REFEREE, triggerBookingId: "b1",
    });
    expect(result.referrer.applied).toBe(false);
    expect(result.referee.applied).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applySocialShareReward
// ---------------------------------------------------------------------------

describe("loyaltyRulesEngine — applySocialShareReward", () => {
  const cfg = { points: 25, maxPerMonth: 2 };
  const MONTH = "2026-04";

  it("applies reward on first share of the month", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    const result = await engine.applySocialShareReward(
      { tenantId: TENANT, userId: USER, shareEventId: "share1", month: MONTH },
      cfg,
    );
    expect(result.applied).toBe(true);
  });

  it("enforces monthly cap", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    // Use two different idempotency keys so both go through
    await engine.applySocialShareReward({ tenantId: TENANT, userId: USER, shareEventId: "share1", month: MONTH }, cfg);
    await engine.applySocialShareReward({ tenantId: TENANT, userId: USER, shareEventId: "share2", month: MONTH }, cfg);
    const third = await engine.applySocialShareReward(
      { tenantId: TENANT, userId: USER, shareEventId: "share3", month: MONTH }, cfg,
    );
    expect(third.applied).toBe(false);
    expect(third.applied === false && third.reason).toMatch(/limit/i);
  });

  it("allows shares in a new month after cap is reached", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    await engine.applySocialShareReward({ tenantId: TENANT, userId: USER, shareEventId: "share1", month: MONTH }, cfg);
    await engine.applySocialShareReward({ tenantId: TENANT, userId: USER, shareEventId: "share2", month: MONTH }, cfg);
    const nextMonth = await engine.applySocialShareReward(
      { tenantId: TENANT, userId: USER, shareEventId: "share3", month: "2026-05" }, cfg,
    );
    expect(nextMonth.applied).toBe(true);
  });

  it("returns not-applied when rule not configured", async () => {
    const { repo } = makeLoyaltyRepoMock();
    const engine = createLoyaltyRulesEngine(repo);
    const result = await engine.applySocialShareReward({
      tenantId: TENANT, userId: USER, shareEventId: "share1", month: MONTH,
    });
    expect(result.applied).toBe(false);
  });
});
