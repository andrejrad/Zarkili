import type {
  AiBudgetGuardConfig,
  AiBudgetGuardDecision,
  AiBudgetUsageSnapshot,
  AiFeatureKey,
} from "./budgetGuard";

export type AiAlertLevel = "none" | "warning" | "critical";

export type AiCostTelemetryEvent = {
  feature: AiFeatureKey;
  tenantId: string;
  monthKey: string;
  guardState: AiBudgetGuardDecision["state"];
  guardScope: AiBudgetGuardDecision["scope"];
  providerCalled: boolean;
  modelTierUsed: string | null;
  featureSpendUsd: number;
  featureCapUsd: number;
  featureUtilization: number;
  globalSpendUsd: number;
  globalCapUsd: number;
  globalUtilization: number;
  alertLevel: AiAlertLevel;
};

export type BuildAiCostTelemetryEventInput = {
  feature: AiFeatureKey;
  tenantId: string;
  usage: AiBudgetUsageSnapshot;
  config: AiBudgetGuardConfig;
  guard: AiBudgetGuardDecision;
  providerCalled: boolean;
  modelTierUsed: string | null;
};

function toUtilization(spendUsd: number, capUsd: number): number {
  if (capUsd <= 0) {
    return 1;
  }

  return spendUsd / capUsd;
}

function resolveAlertLevel(featureUtilization: number, globalUtilization: number): AiAlertLevel {
  if (featureUtilization >= 0.9 || globalUtilization >= 0.9) {
    return "critical";
  }

  if (featureUtilization >= 0.7 || globalUtilization >= 0.7) {
    return "warning";
  }

  return "none";
}

export function buildAiCostTelemetryEvent(input: BuildAiCostTelemetryEventInput): AiCostTelemetryEvent {
  const featureSpendUsd = input.usage.featureSpendUsd[input.feature] ?? 0;
  const featureCapUsd = input.config.featureCaps[input.feature].monthlyCapUsd;
  const globalSpendUsd = input.usage.globalSpendUsd;
  const globalCapUsd = input.config.globalMonthlyCapUsd;
  const featureUtilization = toUtilization(featureSpendUsd, featureCapUsd);
  const globalUtilization = toUtilization(globalSpendUsd, globalCapUsd);
  const alertLevel = resolveAlertLevel(featureUtilization, globalUtilization);

  return {
    feature: input.feature,
    tenantId: input.tenantId,
    monthKey: input.usage.monthKey,
    guardState: input.guard.state,
    guardScope: input.guard.scope,
    providerCalled: input.providerCalled,
    modelTierUsed: input.modelTierUsed,
    featureSpendUsd,
    featureCapUsd,
    featureUtilization,
    globalSpendUsd,
    globalCapUsd,
    globalUtilization,
    alertLevel,
  };
}
