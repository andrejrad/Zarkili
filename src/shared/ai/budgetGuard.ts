export const AI_BUDGET_WARNING_THRESHOLD = 0.7;
export const AI_BUDGET_PROTECTION_THRESHOLD = 0.9;

export const aiFeatureKeys = [
  "content-creation",
  "marketing-orchestration",
  "service-recommendations",
  "scheduling-optimization",
  "retention-insights",
  "support-triage",
  "no-show-fraud",
  "marketplace-personalization",
] as const;

export type AiFeatureKey = (typeof aiFeatureKeys)[number];

export type AiBudgetState = "healthy" | "warning" | "protection" | "exhausted";
export type AiBudgetScope = "feature" | "global";

export type AiFeatureBudgetConfig = {
  monthlyCapUsd: number;
};

export type AiBudgetGuardConfig = {
  globalMonthlyCapUsd: number;
  warningThreshold: number;
  protectionThreshold: number;
  featureCaps: Record<AiFeatureKey, AiFeatureBudgetConfig>;
};

export type AiBudgetUsageSnapshot = {
  monthKey: string;
  globalSpendUsd: number;
  featureSpendUsd: Partial<Record<AiFeatureKey, number>>;
};

export type EvaluateAiBudgetGuardInput = {
  feature: AiFeatureKey;
  usage: AiBudgetUsageSnapshot;
  config: AiBudgetGuardConfig;
};

export type AiBudgetGuardDecision = {
  allowed: boolean;
  state: AiBudgetState;
  scope: AiBudgetScope;
  disablePremiumModel: boolean;
  useDeterministicFallback: boolean;
  reason: string;
};

const starterFeatureCaps: Record<AiFeatureKey, AiFeatureBudgetConfig> = {
  "content-creation": { monthlyCapUsd: 120 },
  "marketing-orchestration": { monthlyCapUsd: 180 },
  "service-recommendations": { monthlyCapUsd: 140 },
  "scheduling-optimization": { monthlyCapUsd: 180 },
  "retention-insights": { monthlyCapUsd: 150 },
  "support-triage": { monthlyCapUsd: 120 },
  "no-show-fraud": { monthlyCapUsd: 110 },
  "marketplace-personalization": { monthlyCapUsd: 90 },
};

export const AI_GLOBAL_STARTER_CAP_USD = Object.values(starterFeatureCaps).reduce(
  (sum, featureCap) => sum + featureCap.monthlyCapUsd,
  0
);

export const defaultAiBudgetGuardConfig: AiBudgetGuardConfig = {
  globalMonthlyCapUsd: AI_GLOBAL_STARTER_CAP_USD,
  warningThreshold: AI_BUDGET_WARNING_THRESHOLD,
  protectionThreshold: AI_BUDGET_PROTECTION_THRESHOLD,
  featureCaps: starterFeatureCaps,
};

function resolveBudgetState(spendUsd: number, capUsd: number, config: AiBudgetGuardConfig): AiBudgetState {
  if (capUsd <= 0) {
    return "exhausted";
  }

  const ratio = spendUsd / capUsd;
  if (ratio >= 1) {
    return "exhausted";
  }

  if (ratio > config.protectionThreshold) {
    return "protection";
  }

  if (ratio >= config.warningThreshold) {
    return "warning";
  }

  return "healthy";
}

function toDecision(state: AiBudgetState, scope: AiBudgetScope, feature: AiFeatureKey): AiBudgetGuardDecision {
  if (state === "exhausted") {
    return {
      allowed: false,
      state,
      scope,
      disablePremiumModel: true,
      useDeterministicFallback: true,
      reason: `${scope} budget exhausted for ${feature}`,
    };
  }

  if (state === "protection") {
    return {
      allowed: true,
      state,
      scope,
      disablePremiumModel: true,
      useDeterministicFallback: false,
      reason: `${scope} budget in protection state for ${feature}`,
    };
  }

  if (state === "warning") {
    return {
      allowed: true,
      state,
      scope,
      disablePremiumModel: false,
      useDeterministicFallback: false,
      reason: `${scope} budget in warning state for ${feature}`,
    };
  }

  return {
    allowed: true,
    state,
    scope,
    disablePremiumModel: false,
    useDeterministicFallback: false,
    reason: `${scope} budget healthy for ${feature}`,
  };
}

export function evaluateAiBudgetGuard({ feature, usage, config }: EvaluateAiBudgetGuardInput): AiBudgetGuardDecision {
  const featureCapUsd = config.featureCaps[feature].monthlyCapUsd;
  const featureSpendUsd = usage.featureSpendUsd[feature] ?? 0;

  const featureState = resolveBudgetState(featureSpendUsd, featureCapUsd, config);
  if (featureState === "exhausted" || featureState === "protection") {
    return toDecision(featureState, "feature", feature);
  }

  const globalState = resolveBudgetState(usage.globalSpendUsd, config.globalMonthlyCapUsd, config);
  if (globalState === "exhausted" || globalState === "protection") {
    return toDecision(globalState, "global", feature);
  }

  return toDecision(featureState, "feature", feature);
}
