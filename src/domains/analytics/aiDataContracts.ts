/**
 * AI Data Readiness and Feature Store Contracts
 *
 * Defines feature vector contracts for:
 *   - Scheduling optimisation
 *   - Client retention / churn risk
 *   - No-show risk
 *   - Marketplace personalisation
 *
 * Each contract ships with:
 *   - ExplainabilityMeta  (reasonCodes, confidence, sourceSignals)
 *   - DataQualityFlag[]   — detected data problems
 *   - ConsentFilter       — privacy-safe usage scope
 *
 * These contracts are data-layer stubs; no model inference is performed here.
 * AI models will consume these contracts in Weeks 19–20.
 */

import type {
  AiFeatureContract,
  ConsentFilter,
  DataQualityFlag,
  MarketplacePersonalizationVector,
  NoShowRiskFeatureVector,
  RetentionFeatureVector,
  SchedulingFeatureVector,
} from "./model";

// ---------------------------------------------------------------------------
// Consent presets
// ---------------------------------------------------------------------------

export const ANALYTICS_ONLY_CONSENT: ConsentFilter = {
  requireExplicitConsent: false,
  excludeOptedOut: true,
  datasetScope: "analytics_only",
};

export const MESSAGING_CONSENT: ConsentFilter = {
  requireExplicitConsent: true,
  excludeOptedOut: true,
  datasetScope: "messaging",
};

// ---------------------------------------------------------------------------
// Data quality checks
// ---------------------------------------------------------------------------

export function checkSchedulingQuality(
  vector: SchedulingFeatureVector,
): DataQualityFlag[] {
  const flags: DataQualityFlag[] = [];
  if (vector.preferredDayOfWeek.length === 0) {
    flags.push({ field: "preferredDayOfWeek", issue: "missing", severity: "warning" });
  }
  if (vector.avgLeadHours < 0) {
    flags.push({ field: "avgLeadHours", issue: "out_of_range", severity: "error" });
  }
  if (vector.noShowRate < 0 || vector.noShowRate > 1) {
    flags.push({ field: "noShowRate", issue: "out_of_range", severity: "error" });
  }
  return flags;
}

export function checkRetentionQuality(
  vector: RetentionFeatureVector,
): DataQualityFlag[] {
  const flags: DataQualityFlag[] = [];
  if (vector.daysSinceLastVisit < 0) {
    flags.push({ field: "daysSinceLastVisit", issue: "out_of_range", severity: "error" });
  }
  if (vector.totalVisits === 0) {
    flags.push({ field: "totalVisits", issue: "missing", severity: "warning" });
  }
  if (vector.churnRiskScore < 0 || vector.churnRiskScore > 1) {
    flags.push({ field: "churnRiskScore", issue: "out_of_range", severity: "error" });
  }
  return flags;
}

export function checkNoShowRiskQuality(
  vector: NoShowRiskFeatureVector,
): DataQualityFlag[] {
  const flags: DataQualityFlag[] = [];
  if (vector.historicalNoShowRate < 0 || vector.historicalNoShowRate > 1) {
    flags.push({ field: "historicalNoShowRate", issue: "out_of_range", severity: "error" });
  }
  if (vector.daysTillAppointment < 0) {
    flags.push({ field: "daysTillAppointment", issue: "out_of_range", severity: "error" });
  }
  if (vector.noShowRiskScore < 0 || vector.noShowRiskScore > 1) {
    flags.push({ field: "noShowRiskScore", issue: "out_of_range", severity: "error" });
  }
  return flags;
}

export function checkMarketplaceQuality(
  vector: MarketplacePersonalizationVector,
): DataQualityFlag[] {
  const flags: DataQualityFlag[] = [];
  if (vector.preferredServiceIds.length === 0) {
    flags.push({ field: "preferredServiceIds", issue: "missing", severity: "warning" });
  }
  if (vector.avgSpend < 0) {
    flags.push({ field: "avgSpend", issue: "out_of_range", severity: "error" });
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Contract builders
// ---------------------------------------------------------------------------

export function buildSchedulingContract(
  vector: SchedulingFeatureVector,
): AiFeatureContract<SchedulingFeatureVector> {
  return {
    version: "1.0",
    schema: "scheduling_feature_v1",
    contract: vector,
    qualityFlags: checkSchedulingQuality(vector),
    consentFilter: ANALYTICS_ONLY_CONSENT,
  };
}

export function buildRetentionContract(
  vector: RetentionFeatureVector,
): AiFeatureContract<RetentionFeatureVector> {
  return {
    version: "1.0",
    schema: "retention_feature_v1",
    contract: vector,
    qualityFlags: checkRetentionQuality(vector),
    consentFilter: ANALYTICS_ONLY_CONSENT,
  };
}

export function buildNoShowRiskContract(
  vector: NoShowRiskFeatureVector,
): AiFeatureContract<NoShowRiskFeatureVector> {
  return {
    version: "1.0",
    schema: "no_show_risk_v1",
    contract: vector,
    qualityFlags: checkNoShowRiskQuality(vector),
    consentFilter: ANALYTICS_ONLY_CONSENT,
  };
}

export function buildMarketplaceContract(
  vector: MarketplacePersonalizationVector,
): AiFeatureContract<MarketplacePersonalizationVector> {
  return {
    version: "1.0",
    schema: "marketplace_personalization_v1",
    contract: vector,
    qualityFlags: checkMarketplaceQuality(vector),
    consentFilter: MESSAGING_CONSENT,
  };
}
