import {
  computeBaselineRetentionScore,
  createRetentionInsightsService,
  estimateChurnHorizonDays,
  pickActionsForScore,
  type ClientRetentionMetrics,
  type RetentionModelInput,
  type RetentionModelOutput,
} from "../retentionInsightsService";

const FEATURE_CAP = 150; // matches starterFeatureCaps["retention-insights"]

function createUsage(featureSpend: number, globalSpend: number) {
  return {
    monthKey: "2026-04",
    globalSpendUsd: globalSpend,
    featureSpendUsd: { "retention-insights": featureSpend },
  };
}

const lowRiskClient: ClientRetentionMetrics = {
  clientId: "C-low",
  daysSinceLastBooking: 20,
  bookingsLast90Days: 4,
  cancellationsLast90Days: 0,
  noShowsLast90Days: 0,
  averageBookingIntervalDays: 25,
};

const highRiskClient: ClientRetentionMetrics = {
  clientId: "C-high",
  daysSinceLastBooking: 120,
  bookingsLast90Days: 1,
  cancellationsLast90Days: 3,
  noShowsLast90Days: 2,
  averageBookingIntervalDays: 30,
};

describe("computeBaselineRetentionScore", () => {
  it("returns low score for active client", () => {
    const { score, reasonCodes } = computeBaselineRetentionScore(lowRiskClient);
    expect(score).toBeLessThan(0.25);
    expect(reasonCodes.length).toBe(0);
  });

  it("returns high score with multiple reason codes for at-risk client", () => {
    const { score, reasonCodes } = computeBaselineRetentionScore(highRiskClient);
    expect(score).toBeGreaterThan(0.5);
    expect(reasonCodes).toEqual(
      expect.arrayContaining(["elapsed-beyond-cadence", "cancellations-trending-up", "no-show-pattern", "low-frequency"])
    );
  });

  it("clamps score to <= 1", () => {
    const extreme: ClientRetentionMetrics = {
      ...highRiskClient,
      daysSinceLastBooking: 1000,
      cancellationsLast90Days: 20,
      noShowsLast90Days: 20,
    };
    const { score } = computeBaselineRetentionScore(extreme);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe("pickActionsForScore", () => {
  it("returns no-action for low score", () => {
    const actions = pickActionsForScore(0.1, []);
    expect(actions[0].action).toBe("no-action");
    expect(actions[0].status).toBe("needs-review");
  });
  it("returns reminder for moderate score", () => {
    const actions = pickActionsForScore(0.4, []);
    expect(actions[0].action).toBe("send-reminder");
  });
  it("returns offer for elevated score", () => {
    const actions = pickActionsForScore(0.6, []);
    expect(actions[0].action).toBe("send-personalized-offer");
  });
  it("returns offer + callback for severe score, all needs-review", () => {
    const actions = pickActionsForScore(0.9, []);
    expect(actions.map((a) => a.action)).toEqual(["send-personalized-offer", "schedule-callback"]);
    expect(actions.every((a) => a.status === "needs-review")).toBe(true);
  });
});

describe("estimateChurnHorizonDays", () => {
  it("clamps horizon between 7 and 180 days", () => {
    expect(estimateChurnHorizonDays(highRiskClient, 1)).toBe(7);
    expect(estimateChurnHorizonDays(lowRiskClient, 0)).toBeGreaterThanOrEqual(7);
    expect(estimateChurnHorizonDays(lowRiskClient, 0)).toBeLessThanOrEqual(180);
  });
});

describe("retention insights service budget guard integration", () => {
  it("returns metrics-only mode when feature cap is exhausted (no provider call)", async () => {
    const callNarrativeModel = jest.fn<Promise<RetentionModelOutput>, [RetentionModelInput]>();
    const service = createRetentionInsightsService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP, 200),
      callNarrativeModel,
    });

    const result = await service.generate({
      tenantId: "tenantA",
      monthKey: "2026-04",
      clients: [lowRiskClient, highRiskClient],
    });

    expect(callNarrativeModel).not.toHaveBeenCalled();
    expect(result.mode).toBe("metrics-only");
    expect(result.insights).toHaveLength(2);
    expect(result.insights.every((i) => i.narrative === null)).toBe(true);
    expect(result.providerCalled).toBe(false);
    expect(result.guard.state).toBe("exhausted");
  });

  it("downshifts to low-cost tier in protection state", async () => {
    const callNarrativeModel = jest.fn(async (input: RetentionModelInput) => ({
      narrative: `summary using ${input.modelTier}`,
    }));
    const service = createRetentionInsightsService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP * 0.92, 400),
      callNarrativeModel,
    });

    const result = await service.generate({
      tenantId: "tenantA",
      monthKey: "2026-04",
      clients: [highRiskClient],
    });

    expect(callNarrativeModel).toHaveBeenCalledWith(expect.objectContaining({ modelTier: "low-cost" }));
    expect(result.mode).toBe("ai-narrative");
    expect(result.guard.state).toBe("protection");
    expect(result.modelTierUsed).toBe("low-cost");
  });

  it("uses high tier in healthy state and adds ai-narrative reason code", async () => {
    const service = createRetentionInsightsService({
      getUsageSnapshot: async () => createUsage(20, 200),
      callNarrativeModel: async (input) => ({
        narrative: `tier=${input.modelTier}`,
      }),
    });

    const result = await service.generate({
      tenantId: "tenantA",
      monthKey: "2026-04",
      clients: [highRiskClient],
    });

    expect(result.mode).toBe("ai-narrative");
    expect(result.insights[0].narrative).toBe("tier=high");
    expect(result.insights[0].reasonCodes).toContain("ai-narrative");
  });

  it("respects scoreOverride from model when within range", async () => {
    const service = createRetentionInsightsService({
      getUsageSnapshot: async () => createUsage(20, 200),
      callNarrativeModel: async () => ({
        narrative: "ok",
        scoreOverride: 0.95,
      }),
    });

    const result = await service.generate({
      tenantId: "tenantA",
      monthKey: "2026-04",
      clients: [lowRiskClient],
    });

    expect(result.insights[0].retentionScore).toBe(0.95);
    // Severe score => offer + callback
    expect(result.insights[0].suggestedActions.map((a) => a.action)).toEqual(
      expect.arrayContaining(["send-personalized-offer", "schedule-callback"])
    );
  });

  it("falls back to metrics-only insight per client on model error", async () => {
    const service = createRetentionInsightsService({
      getUsageSnapshot: async () => createUsage(20, 200),
      callNarrativeModel: async () => {
        throw new Error("provider 503");
      },
    });

    const result = await service.generate({
      tenantId: "tenantA",
      monthKey: "2026-04",
      clients: [highRiskClient],
    });

    expect(result.mode).toBe("ai-narrative");
    expect(result.providerCalled).toBe(true);
    expect(result.insights[0].narrative).toBeNull();
  });

  it("returns metrics-only when no callNarrativeModel dep is provided", async () => {
    const service = createRetentionInsightsService({
      getUsageSnapshot: async () => createUsage(20, 200),
    });

    const result = await service.generate({
      tenantId: "tenantA",
      monthKey: "2026-04",
      clients: [lowRiskClient],
    });

    expect(result.mode).toBe("metrics-only");
    expect(result.providerCalled).toBe(false);
  });

  it("emits warning telemetry when usage crosses warning threshold", async () => {
    const logTelemetryEvent = jest.fn();
    const logAlert = jest.fn();
    const service = createRetentionInsightsService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP * 0.75, 200),
      callNarrativeModel: async () => ({ narrative: "ok" }),
      logTelemetryEvent,
      logAlert,
    });

    const result = await service.generate({
      tenantId: "tenantA",
      monthKey: "2026-04",
      clients: [lowRiskClient],
    });

    expect(result.guard.state).toBe("warning");
    expect(logTelemetryEvent).toHaveBeenCalledTimes(1);
    expect(logAlert).toHaveBeenCalledTimes(1);
  });

  it("never auto-sends actions; everything is queued as needs-review", async () => {
    const service = createRetentionInsightsService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP, 400), // exhausted
      callNarrativeModel: async () => ({ narrative: "should not be called" }),
    });

    const result = await service.generate({
      tenantId: "tenantA",
      monthKey: "2026-04",
      clients: [highRiskClient],
    });

    const allActions = result.insights.flatMap((i) => i.suggestedActions);
    expect(allActions.length).toBeGreaterThan(0);
    expect(allActions.every((a) => a.status === "needs-review")).toBe(true);
  });
});
