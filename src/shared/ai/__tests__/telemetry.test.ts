import { defaultAiBudgetGuardConfig, evaluateAiBudgetGuard } from "../budgetGuard";
import { buildAiCostTelemetryEvent } from "../telemetry";

describe("shared ai telemetry", () => {
  it("builds event with warning alert at 70% feature utilization", () => {
    const usage = {
      monthKey: "2026-04",
      globalSpendUsd: 100,
      featureSpendUsd: {
        "support-triage": 84,
      },
    };

    const guard = evaluateAiBudgetGuard({
      feature: "support-triage",
      usage,
      config: defaultAiBudgetGuardConfig,
    });

    const event = buildAiCostTelemetryEvent({
      feature: "support-triage",
      tenantId: "tenantA",
      usage,
      config: defaultAiBudgetGuardConfig,
      guard,
      providerCalled: true,
      modelTierUsed: "low-cost",
    });

    expect(event.alertLevel).toBe("warning");
    expect(event.featureUtilization).toBeCloseTo(0.7, 4);
    expect(event.guardState).toBe("warning");
  });

  it("builds event with critical alert at protection threshold", () => {
    const usage = {
      monthKey: "2026-04",
      globalSpendUsd: 982,
      featureSpendUsd: {
        "support-triage": 20,
      },
    };

    const guard = evaluateAiBudgetGuard({
      feature: "support-triage",
      usage,
      config: defaultAiBudgetGuardConfig,
    });

    const event = buildAiCostTelemetryEvent({
      feature: "support-triage",
      tenantId: "tenantA",
      usage,
      config: defaultAiBudgetGuardConfig,
      guard,
      providerCalled: false,
      modelTierUsed: null,
    });

    expect(event.alertLevel).toBe("critical");
    expect(event.globalUtilization).toBeCloseTo(0.9, 2);
    expect(event.guardScope).toBe("global");
  });
});
