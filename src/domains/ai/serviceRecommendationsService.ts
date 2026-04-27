import {
  buildAiCostTelemetryEvent,
  defaultAiBudgetGuardConfig,
  evaluateAiBudgetGuard,
  type AiAlertLevel,
  type AiBudgetGuardConfig,
  type AiBudgetGuardDecision,
  type AiCostTelemetryEvent,
  type AiBudgetUsageSnapshot,
} from "../../shared/ai";

const FEATURE_KEY = "service-recommendations" as const;

export type RecommendationModelTier = "low-cost" | "high";
export type RecommendationSourceMode = "ai-augmented" | "deterministic-fallback";

export type ServiceCatalogItem = {
  serviceId: string;
  name: string;
  category: string;
  priceUsd: number;
  available: boolean;
  // Optional, e.g. ["adult-only"]; matched against client.disallowedCategories.
  tags?: ReadonlyArray<string>;
};

export type ClientProfile = {
  clientId: string;
  pastServiceIds: ReadonlyArray<string>;
  // Soft policy guards. Recommendations breaching these are filtered out.
  maxPriceUsd?: number;
  disallowedCategories?: ReadonlyArray<string>;
};

export type RecommendationReasonCode =
  | "repeat-affinity"
  | "category-affinity"
  | "popular-in-tenant"
  | "ai-personalized"
  | "fallback-default";

export type ServiceRecommendation = {
  serviceId: string;
  score: number; // 0..1
  confidence: number; // 0..1
  reasonCodes: ReadonlyArray<RecommendationReasonCode>;
  sourceSignals: ReadonlyArray<string>;
};

export type RecommendationsInput = {
  tenantId: string;
  monthKey: string;
  client: ClientProfile;
  catalog: ReadonlyArray<ServiceCatalogItem>;
  topN?: number;
};

export type RecommendationsModelInput = {
  tenantId: string;
  client: ClientProfile;
  candidateServiceIds: ReadonlyArray<string>;
  modelTier: RecommendationModelTier;
};

export type RecommendationsModelOutput = {
  recommendations: ReadonlyArray<{
    serviceId: string;
    score: number;
    confidence: number;
    sourceSignals: ReadonlyArray<string>;
  }>;
};

export type RecommendationsResult = {
  mode: RecommendationSourceMode;
  recommendations: ReadonlyArray<ServiceRecommendation>;
  guard: AiBudgetGuardDecision;
  modelTierUsed: RecommendationModelTier | null;
  providerCalled: boolean;
};

export type ServiceRecommendationsDependencies = {
  getUsageSnapshot: (monthKey: string) => Promise<AiBudgetUsageSnapshot>;
  callModel?: (input: RecommendationsModelInput) => Promise<RecommendationsModelOutput>;
  logGuardDecision?: (input: {
    feature: typeof FEATURE_KEY;
    tenantId: string;
    monthKey: string;
    decision: AiBudgetGuardDecision;
  }) => void;
  logTelemetryEvent?: (event: AiCostTelemetryEvent) => void;
  logAlert?: (input: {
    level: AiAlertLevel;
    feature: typeof FEATURE_KEY;
    tenantId: string;
    monthKey: string;
    event: AiCostTelemetryEvent;
  }) => void;
  budgetConfig?: AiBudgetGuardConfig;
};

export const DEFAULT_TOP_N = 3;

/**
 * Filters the catalog to services the client is allowed to receive.
 * Drops unavailable services, services exceeding the client's price cap,
 * and services in disallowed categories.
 */
export function filterCatalogForClient(
  catalog: ReadonlyArray<ServiceCatalogItem>,
  client: ClientProfile
): ReadonlyArray<ServiceCatalogItem> {
  const disallowed = new Set(client.disallowedCategories ?? []);
  return catalog.filter((item) => {
    if (!item.available) return false;
    if (client.maxPriceUsd !== undefined && item.priceUsd > client.maxPriceUsd) return false;
    if (disallowed.has(item.category)) return false;
    if (item.tags && item.tags.some((t) => disallowed.has(t))) return false;
    return true;
  });
}

/**
 * Pure deterministic recommender based on:
 *   - repeat-affinity: services the client has booked before
 *   - category-affinity: services in categories the client has booked before
 *   - popular-in-tenant: fallback ordering by lower price (proxy for entry-level popularity)
 *
 * Score is in [0,1]. This function is also used as the deterministic fallback
 * when the AI budget guard requires it (exhausted state).
 */
export function buildDeterministicRecommendations(
  catalog: ReadonlyArray<ServiceCatalogItem>,
  client: ClientProfile,
  topN: number
): ReadonlyArray<ServiceRecommendation> {
  const past = new Set(client.pastServiceIds);
  const pastCategories = new Set(
    catalog.filter((item) => past.has(item.serviceId)).map((item) => item.category)
  );

  const ranked = catalog.map((item): ServiceRecommendation => {
    const reasonCodes: RecommendationReasonCode[] = [];
    const sourceSignals: string[] = [];
    let score = 0.2;

    if (past.has(item.serviceId)) {
      score = Math.max(score, 0.85);
      reasonCodes.push("repeat-affinity");
      sourceSignals.push(`past-booking:${item.serviceId}`);
    } else if (pastCategories.has(item.category)) {
      score = Math.max(score, 0.6);
      reasonCodes.push("category-affinity");
      sourceSignals.push(`past-category:${item.category}`);
    } else {
      reasonCodes.push("popular-in-tenant");
      sourceSignals.push("default-ordering");
    }

    return {
      serviceId: item.serviceId,
      score,
      confidence: score,
      reasonCodes,
      sourceSignals,
    };
  });

  return [...ranked]
    .sort((a, b) => b.score - a.score || a.serviceId.localeCompare(b.serviceId))
    .slice(0, topN);
}

export function createServiceRecommendationsService(deps: ServiceRecommendationsDependencies) {
  const budgetConfig = deps.budgetConfig ?? defaultAiBudgetGuardConfig;

  function emitObservability(input: {
    tenantId: string;
    usage: AiBudgetUsageSnapshot;
    guard: AiBudgetGuardDecision;
    providerCalled: boolean;
    modelTierUsed: RecommendationModelTier | null;
  }): void {
    const event = buildAiCostTelemetryEvent({
      feature: FEATURE_KEY,
      tenantId: input.tenantId,
      usage: input.usage,
      config: budgetConfig,
      guard: input.guard,
      providerCalled: input.providerCalled,
      modelTierUsed: input.modelTierUsed,
    });

    deps.logTelemetryEvent?.(event);
    if (event.alertLevel !== "none") {
      deps.logAlert?.({
        level: event.alertLevel,
        feature: FEATURE_KEY,
        tenantId: input.tenantId,
        monthKey: event.monthKey,
        event,
      });
    }
  }

  async function recommend(input: RecommendationsInput): Promise<RecommendationsResult> {
    const topN = input.topN ?? DEFAULT_TOP_N;
    const filteredCatalog = filterCatalogForClient(input.catalog, input.client);

    const usage = await deps.getUsageSnapshot(input.monthKey);
    const guard = evaluateAiBudgetGuard({
      feature: FEATURE_KEY,
      usage,
      config: budgetConfig,
    });

    deps.logGuardDecision?.({
      feature: FEATURE_KEY,
      tenantId: input.tenantId,
      monthKey: input.monthKey,
      decision: guard,
    });

    const deterministic = buildDeterministicRecommendations(filteredCatalog, input.client, topN);

    if (!guard.allowed || !deps.callModel) {
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: false,
        modelTierUsed: null,
      });
      return {
        mode: "deterministic-fallback",
        recommendations: deterministic,
        guard,
        modelTierUsed: null,
        providerCalled: false,
      };
    }

    const modelTier: RecommendationModelTier = guard.disablePremiumModel ? "low-cost" : "high";

    try {
      const modelResult = await deps.callModel({
        tenantId: input.tenantId,
        client: input.client,
        candidateServiceIds: filteredCatalog.map((item) => item.serviceId),
        modelTier,
      });

      // Re-filter model output against catalog policies (defence in depth).
      const allowed = new Set(filteredCatalog.map((item) => item.serviceId));
      const merged: ServiceRecommendation[] = modelResult.recommendations
        .filter((rec) => allowed.has(rec.serviceId))
        .slice(0, topN)
        .map((rec) => ({
          serviceId: rec.serviceId,
          score: rec.score,
          confidence: rec.confidence,
          reasonCodes: ["ai-personalized"],
          sourceSignals: rec.sourceSignals,
        }));

      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: true,
        modelTierUsed: modelTier,
      });

      // If model returned nothing usable, fall back to deterministic so the
      // caller always has at least the safe ranking to render.
      if (merged.length === 0) {
        return {
          mode: "deterministic-fallback",
          recommendations: deterministic,
          guard,
          modelTierUsed: modelTier,
          providerCalled: true,
        };
      }

      return {
        mode: "ai-augmented",
        recommendations: merged,
        guard,
        modelTierUsed: modelTier,
        providerCalled: true,
      };
    } catch {
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: true,
        modelTierUsed: modelTier,
      });
      return {
        mode: "deterministic-fallback",
        recommendations: deterministic,
        guard,
        modelTierUsed: modelTier,
        providerCalled: true,
      };
    }
  }

  return { recommend };
}
