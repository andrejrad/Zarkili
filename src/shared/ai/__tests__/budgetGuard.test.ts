import {
  AI_GLOBAL_STARTER_CAP_USD,
  defaultAiBudgetGuardConfig,
  evaluateAiBudgetGuard,
  type AiBudgetGuardConfig,
  type AiFeatureKey,
} from "../budgetGuard";

function createConfig(overrides?: Partial<AiBudgetGuardConfig>): AiBudgetGuardConfig {
  return {
    ...defaultAiBudgetGuardConfig,
    ...overrides,
    featureCaps: {
      ...defaultAiBudgetGuardConfig.featureCaps,
      ...(overrides?.featureCaps ?? {}),
    },
  };
}

function evaluate(feature: AiFeatureKey, featureSpendUsd: number, globalSpendUsd: number, config?: AiBudgetGuardConfig) {
  return evaluateAiBudgetGuard({
    feature,
    usage: {
      monthKey: "2026-04",
      globalSpendUsd,
      featureSpendUsd: {
        [feature]: featureSpendUsd,
      },
    },
    config: config ?? defaultAiBudgetGuardConfig,
  });
}

describe("shared ai budget guard", () => {
  it("matches documented starter global cap", () => {
    expect(AI_GLOBAL_STARTER_CAP_USD).toBe(1090);
  });

  it("returns healthy when feature and global spend are below warning", () => {
    const result = evaluate("content-creation", 20, 100);

    expect(result.allowed).toBe(true);
    expect(result.state).toBe("healthy");
    expect(result.scope).toBe("feature");
    expect(result.disablePremiumModel).toBe(false);
    expect(result.useDeterministicFallback).toBe(false);
  });

  it("returns warning when feature spend crosses warning threshold", () => {
    const result = evaluate("content-creation", 84, 100);

    expect(result.allowed).toBe(true);
    expect(result.state).toBe("warning");
    expect(result.scope).toBe("feature");
  });

  it("returns protection and disables premium when feature spend exceeds protection threshold", () => {
    const result = evaluate("content-creation", 109, 100);

    expect(result.allowed).toBe(true);
    expect(result.state).toBe("protection");
    expect(result.scope).toBe("feature");
    expect(result.disablePremiumModel).toBe(true);
    expect(result.useDeterministicFallback).toBe(false);
  });

  it("returns exhausted and deterministic fallback when feature cap is hit", () => {
    const result = evaluate("content-creation", 120, 100);

    expect(result.allowed).toBe(false);
    expect(result.state).toBe("exhausted");
    expect(result.scope).toBe("feature");
    expect(result.disablePremiumModel).toBe(true);
    expect(result.useDeterministicFallback).toBe(true);
  });

  it("enforces feature checks before global checks", () => {
    const config = createConfig({
      globalMonthlyCapUsd: 100,
    });

    const result = evaluate("content-creation", 120, 100, config);

    expect(result.scope).toBe("feature");
    expect(result.state).toBe("exhausted");
  });

  it("returns global protection when feature is healthy but global spend is high", () => {
    const config = createConfig({
      globalMonthlyCapUsd: 100,
    });

    const result = evaluate("content-creation", 20, 95, config);

    expect(result.allowed).toBe(true);
    expect(result.state).toBe("protection");
    expect(result.scope).toBe("global");
    expect(result.disablePremiumModel).toBe(true);
  });

  it("returns global exhausted when global cap is reached", () => {
    const config = createConfig({
      globalMonthlyCapUsd: 100,
    });

    const result = evaluate("content-creation", 20, 100, config);

    expect(result.allowed).toBe(false);
    expect(result.state).toBe("exhausted");
    expect(result.scope).toBe("global");
    expect(result.useDeterministicFallback).toBe(true);
  });

  it("treats zero cap as exhausted", () => {
    const config = createConfig({
      globalMonthlyCapUsd: 0,
    });

    const result = evaluate("content-creation", 0, 0, config);

    expect(result.allowed).toBe(false);
    expect(result.state).toBe("exhausted");
    expect(result.scope).toBe("global");
  });
});
