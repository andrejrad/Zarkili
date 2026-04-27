import { describe, expect, it, jest } from "@jest/globals";

import {
  DEFAULT_RISK_POLICY,
  RISK_POLICY_VERSION,
  computeHeuristicRiskScore,
  createNoShowFraudService,
  filterReasonCodesToAllowList,
  resolveRecommendedAction,
  type NoShowFraudDependencies,
  type RiskInput,
  type RiskInputSignals,
  type RiskModelOutput,
} from "../noShowFraudService";

import type { AiBudgetUsageSnapshot } from "../../../shared/ai";

const MONTH = "2026-04";

const baseSignals: RiskInputSignals = {
  priorBookings: 10,
  priorNoShows: 0,
  priorLateCancellations: 0,
  priorCompletedBookings: 10,
  daysSinceLastBooking: 30,
  leadTimeHours: 48,
  bookingsLast24h: 1,
  paymentDisputeCount: 0,
  highRiskHourBand: false,
  servicePriceUsd: 80,
};

function snapshot(featureSpend = 0, globalSpend = 0): AiBudgetUsageSnapshot {
  return {
    monthKey: MONTH,
    globalSpendUsd: globalSpend,
    featureSpendUsd: { "no-show-fraud": featureSpend },
  };
}

function makeDeps(overrides: Partial<NoShowFraudDependencies> = {}): NoShowFraudDependencies {
  return {
    getUsageSnapshot: async () => snapshot(),
    callModel: async () => ({ riskScore: 0.1, reasonCodes: [] }),
    ...overrides,
  };
}

function makeInput(overrides: Partial<RiskInput> = {}): RiskInput {
  return {
    tenantId: "t1",
    monthKey: MONTH,
    bookingId: "b1",
    clientHash: "h1",
    signals: baseSignals,
    ...overrides,
  };
}

describe("computeHeuristicRiskScore", () => {
  it("scores established clean clients near zero with established-good-history reason", () => {
    const r = computeHeuristicRiskScore(baseSignals);
    expect(r.score).toBe(0);
    expect(r.reasonCodes).toContain("established-good-history");
  });

  it("flags new accounts with low history", () => {
    const r = computeHeuristicRiskScore({
      ...baseSignals,
      priorBookings: 0,
      priorCompletedBookings: 0,
      priorNoShows: 0,
      priorLateCancellations: 0,
    });
    expect(r.reasonCodes).toContain("new-account-low-history");
    expect(r.score).toBeGreaterThan(0);
  });

  it("flags high no-show rate and accumulates score", () => {
    const r = computeHeuristicRiskScore({
      ...baseSignals,
      priorBookings: 4,
      priorNoShows: 3,
      priorCompletedBookings: 1,
    });
    expect(r.reasonCodes).toContain("high-no-show-rate");
    expect(r.score).toBeGreaterThanOrEqual(0.45);
  });

  it("flags rapid velocity, very-short-lead-time, and payment-dispute-history", () => {
    const r = computeHeuristicRiskScore({
      ...baseSignals,
      bookingsLast24h: 5,
      leadTimeHours: 0.5,
      paymentDisputeCount: 2,
    });
    expect(r.reasonCodes).toContain("rapid-velocity");
    expect(r.reasonCodes).toContain("very-short-lead-time");
    expect(r.reasonCodes).toContain("payment-dispute-history");
  });

  it("clamps the result to [0,1]", () => {
    const r = computeHeuristicRiskScore({
      ...baseSignals,
      priorBookings: 4,
      priorNoShows: 4,
      priorLateCancellations: 4,
      priorCompletedBookings: 0,
      bookingsLast24h: 10,
      leadTimeHours: 0,
      paymentDisputeCount: 5,
      highRiskHourBand: true,
      servicePriceUsd: 500,
    });
    expect(r.score).toBeLessThanOrEqual(1);
    expect(r.score).toBeGreaterThan(0.9);
  });
});

describe("resolveRecommendedAction", () => {
  it("maps each band correctly under the default policy", () => {
    expect(resolveRecommendedAction(0.0, DEFAULT_RISK_POLICY)).toBe("allow");
    expect(resolveRecommendedAction(0.4, DEFAULT_RISK_POLICY)).toBe("require-deposit");
    expect(resolveRecommendedAction(0.6, DEFAULT_RISK_POLICY)).toBe("require-prepayment");
    expect(resolveRecommendedAction(0.8, DEFAULT_RISK_POLICY)).toBe("manual-review");
    expect(resolveRecommendedAction(0.95, DEFAULT_RISK_POLICY)).toBe("block");
  });

  it("respects tenant-specific thresholds", () => {
    const policy = {
      depositThreshold: 0.2,
      prepaymentThreshold: 0.4,
      manualReviewThreshold: 0.6,
      blockThreshold: 0.99,
    };
    expect(resolveRecommendedAction(0.25, policy)).toBe("require-deposit");
    expect(resolveRecommendedAction(0.45, policy)).toBe("require-prepayment");
    expect(resolveRecommendedAction(0.7, policy)).toBe("manual-review");
    expect(resolveRecommendedAction(1.0, policy)).toBe("block");
  });
});

describe("filterReasonCodesToAllowList", () => {
  it("drops unknown codes injected by the model", () => {
    const filtered = filterReasonCodesToAllowList([
      "high-no-show-rate",
      "ethnicity-bias" as never,
      "rapid-velocity",
    ]);
    expect(filtered).toEqual(["high-no-show-rate", "rapid-velocity"]);
  });
});

describe("createNoShowFraudService", () => {
  it("returns rules-only with requiresHumanReview=true when guard is exhausted", async () => {
    const log = jest.fn();
    const svc = createNoShowFraudService(
      makeDeps({
        getUsageSnapshot: async () => snapshot(150, 1500),
        callModel: jest.fn() as unknown as NoShowFraudDependencies["callModel"],
        logRiskAssessment: log,
      })
    );
    const result = await svc.assessRisk(makeInput());
    expect(result.mode).toBe("rules-only");
    expect(result.providerCalled).toBe(false);
    expect(result.assessment.requiresHumanReview).toBe(true);
    expect(result.assessment.policyVersion).toBe(RISK_POLICY_VERSION);
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("downshifts to low-cost in protection state", async () => {
    const callModel = jest
      .fn<(...args: unknown[]) => Promise<RiskModelOutput>>()
      .mockResolvedValue({ riskScore: 0.1, reasonCodes: [] });
    const svc = createNoShowFraudService(
      makeDeps({
        // 95 / 110 cap → ~86% → protection band (>= 0.7 and >0.9? above 0.9 = protection).
        getUsageSnapshot: async () => snapshot(100, 1000),
        callModel: callModel as unknown as NoShowFraudDependencies["callModel"],
      })
    );
    const result = await svc.assessRisk(makeInput());
    expect(result.guard.disablePremiumModel).toBe(true);
    expect(result.modelTierUsed).toBe("low-cost");
    expect(callModel).toHaveBeenCalledWith(expect.objectContaining({ modelTier: "low-cost" }));
  });

  it("uses high tier in healthy state", async () => {
    const callModel = jest
      .fn<(...args: unknown[]) => Promise<RiskModelOutput>>()
      .mockResolvedValue({ riskScore: 0.05, reasonCodes: ["established-good-history"] });
    const svc = createNoShowFraudService(
      makeDeps({ callModel: callModel as unknown as NoShowFraudDependencies["callModel"] })
    );
    const result = await svc.assessRisk(makeInput());
    expect(result.modelTierUsed).toBe("high");
    expect(result.assessment.recommendedAction).toBe("allow");
    expect(result.assessment.requiresHumanReview).toBe(false);
  });

  it("forces requiresHumanReview=true on manual-review and block actions", async () => {
    const callModel = jest
      .fn<(...args: unknown[]) => Promise<RiskModelOutput>>()
      .mockResolvedValue({ riskScore: 0.97, reasonCodes: ["payment-dispute-history"] });
    const svc = createNoShowFraudService(
      makeDeps({ callModel: callModel as unknown as NoShowFraudDependencies["callModel"] })
    );
    const result = await svc.assessRisk(makeInput());
    expect(result.assessment.recommendedAction).toBe("block");
    expect(result.assessment.requiresHumanReview).toBe(true);
  });

  it("filters unknown reason codes from the model and falls back to heuristic codes when empty", async () => {
    const callModel = jest
      .fn<(...args: unknown[]) => Promise<RiskModelOutput>>()
      .mockResolvedValue({ riskScore: 0.5, reasonCodes: ["nationality-bias"] as never });
    const svc = createNoShowFraudService(
      makeDeps({ callModel: callModel as unknown as NoShowFraudDependencies["callModel"] })
    );
    const result = await svc.assessRisk(
      makeInput({
        signals: {
          ...baseSignals,
          priorBookings: 4,
          priorNoShows: 2,
          priorCompletedBookings: 2,
        },
      })
    );
    // Heuristic fallback codes are used (high-no-show-rate at minimum).
    expect(result.assessment.reasonCodes.length).toBeGreaterThan(0);
    expect(result.assessment.reasonCodes).not.toContain("nationality-bias");
  });

  it("falls back to rules-only on model error and still logs observability once", async () => {
    const telemetry = jest.fn();
    const log = jest.fn();
    const svc = createNoShowFraudService(
      makeDeps({
        callModel: async () => {
          throw new Error("model unavailable");
        },
        logTelemetryEvent: telemetry,
        logRiskAssessment: log,
      })
    );
    const result = await svc.assessRisk(makeInput());
    expect(result.mode).toBe("rules-only");
    expect(result.providerCalled).toBe(true);
    expect(result.assessment.requiresHumanReview).toBe(true);
    expect(telemetry).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("runs in rules-only when no callModel dependency is provided", async () => {
    const svc = createNoShowFraudService({
      getUsageSnapshot: async () => snapshot(),
    });
    const result = await svc.assessRisk(makeInput());
    expect(result.mode).toBe("rules-only");
    expect(result.providerCalled).toBe(false);
    expect(result.assessment.requiresHumanReview).toBe(true);
  });

  it("emits a guard decision and a single telemetry event per call", async () => {
    const guardLog = jest.fn();
    const telemetry = jest.fn();
    const svc = createNoShowFraudService(
      makeDeps({ logGuardDecision: guardLog, logTelemetryEvent: telemetry })
    );
    await svc.assessRisk(makeInput());
    expect(guardLog).toHaveBeenCalledTimes(1);
    expect(telemetry).toHaveBeenCalledTimes(1);
  });

  it("respects tenant policy override for action thresholds", async () => {
    const callModel = jest
      .fn<(...args: unknown[]) => Promise<RiskModelOutput>>()
      .mockResolvedValue({ riskScore: 0.45, reasonCodes: ["high-no-show-rate"] });
    const svc = createNoShowFraudService(
      makeDeps({ callModel: callModel as unknown as NoShowFraudDependencies["callModel"] })
    );
    const strictPolicy = {
      depositThreshold: 0.1,
      prepaymentThreshold: 0.2,
      manualReviewThreshold: 0.3,
      blockThreshold: 0.99,
    };
    const result = await svc.assessRisk(makeInput({ policy: strictPolicy }));
    expect(result.assessment.recommendedAction).toBe("manual-review");
    expect(result.assessment.requiresHumanReview).toBe(true);
  });
});
