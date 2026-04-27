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

const FEATURE_KEY = "retention-insights" as const;

export type RetentionModelTier = "low-cost" | "high";
export type RetentionMode = "ai-narrative" | "metrics-only";

/**
 * Inputs the metrics-only fallback engine consumes. All values are precomputed
 * by upstream analytics jobs; the service does not reach into raw bookings.
 */
export type ClientRetentionMetrics = {
  clientId: string;
  daysSinceLastBooking: number;
  bookingsLast90Days: number;
  cancellationsLast90Days: number;
  noShowsLast90Days: number;
  averageBookingIntervalDays: number; // typical client cadence; 0 if unknown
};

export type RetentionReasonCode =
  | "elapsed-beyond-cadence"
  | "cancellations-trending-up"
  | "no-show-pattern"
  | "low-frequency"
  | "ai-narrative";

export type RetentionAction =
  | "send-personalized-offer"
  | "send-reminder"
  | "schedule-callback"
  | "no-action";

export type RetentionActionItem = {
  action: RetentionAction;
  reasonCodes: ReadonlyArray<RetentionReasonCode>;
  // Approval queue: every suggested action requires staff review.
  status: "needs-review";
};

export type RetentionInsight = {
  clientId: string;
  retentionScore: number; // 0..1, higher = more at risk
  churnHorizonDays: number;
  confidence: number; // 0..1
  reasonCodes: ReadonlyArray<RetentionReasonCode>;
  suggestedActions: ReadonlyArray<RetentionActionItem>;
  narrative: string | null; // AI-generated, null in metrics-only mode
};

export type RetentionInsightsInput = {
  tenantId: string;
  monthKey: string;
  clients: ReadonlyArray<ClientRetentionMetrics>;
};

export type RetentionModelInput = {
  tenantId: string;
  client: ClientRetentionMetrics;
  baselineScore: number;
  modelTier: RetentionModelTier;
};

export type RetentionModelOutput = {
  narrative: string;
  // Optional refinement; if absent, we keep the deterministic score.
  scoreOverride?: number;
};

export type RetentionInsightsResult = {
  mode: RetentionMode;
  insights: ReadonlyArray<RetentionInsight>;
  guard: AiBudgetGuardDecision;
  modelTierUsed: RetentionModelTier | null;
  providerCalled: boolean;
};

export type RetentionInsightsDependencies = {
  getUsageSnapshot: (monthKey: string) => Promise<AiBudgetUsageSnapshot>;
  callNarrativeModel?: (input: RetentionModelInput) => Promise<RetentionModelOutput>;
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

/**
 * Pure deterministic risk scorer. Inputs are clamped before weighting so a
 * single extreme metric cannot dominate the score. Output is in [0,1].
 */
export function computeBaselineRetentionScore(metrics: ClientRetentionMetrics): {
  score: number;
  reasonCodes: ReadonlyArray<RetentionReasonCode>;
} {
  const reasonCodes: RetentionReasonCode[] = [];
  let score = 0;

  if (metrics.averageBookingIntervalDays > 0) {
    const ratio = metrics.daysSinceLastBooking / metrics.averageBookingIntervalDays;
    if (ratio >= 1.5) {
      reasonCodes.push("elapsed-beyond-cadence");
      score += Math.min(0.5, (ratio - 1) * 0.3);
    }
  } else if (metrics.daysSinceLastBooking > 90) {
    reasonCodes.push("elapsed-beyond-cadence");
    score += 0.4;
  }

  if (metrics.cancellationsLast90Days >= 2) {
    reasonCodes.push("cancellations-trending-up");
    score += Math.min(0.25, metrics.cancellationsLast90Days * 0.08);
  }

  if (metrics.noShowsLast90Days >= 1) {
    reasonCodes.push("no-show-pattern");
    score += Math.min(0.25, metrics.noShowsLast90Days * 0.12);
  }

  if (metrics.bookingsLast90Days <= 1) {
    reasonCodes.push("low-frequency");
    score += 0.15;
  }

  return { score: Math.min(1, score), reasonCodes };
}

export function pickActionsForScore(
  score: number,
  reasonCodes: ReadonlyArray<RetentionReasonCode>
): ReadonlyArray<RetentionActionItem> {
  if (score < 0.25) {
    return [{ action: "no-action", reasonCodes, status: "needs-review" }];
  }
  if (score < 0.5) {
    return [{ action: "send-reminder", reasonCodes, status: "needs-review" }];
  }
  if (score < 0.8) {
    return [{ action: "send-personalized-offer", reasonCodes, status: "needs-review" }];
  }
  return [
    { action: "send-personalized-offer", reasonCodes, status: "needs-review" },
    { action: "schedule-callback", reasonCodes, status: "needs-review" },
  ];
}

export function estimateChurnHorizonDays(metrics: ClientRetentionMetrics, score: number): number {
  const cadence = metrics.averageBookingIntervalDays > 0 ? metrics.averageBookingIntervalDays : 60;
  // Higher risk -> shorter horizon. Clamp to a sensible window.
  const horizon = Math.round(cadence * (1 - score));
  return Math.max(7, Math.min(180, horizon));
}

export function createRetentionInsightsService(deps: RetentionInsightsDependencies) {
  const budgetConfig = deps.budgetConfig ?? defaultAiBudgetGuardConfig;

  function emitObservability(input: {
    tenantId: string;
    usage: AiBudgetUsageSnapshot;
    guard: AiBudgetGuardDecision;
    providerCalled: boolean;
    modelTierUsed: RetentionModelTier | null;
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

  function buildInsight(
    metrics: ClientRetentionMetrics,
    narrative: string | null,
    extraReason: RetentionReasonCode | null,
    scoreOverride: number | null
  ): RetentionInsight {
    const baseline = computeBaselineRetentionScore(metrics);
    const score =
      scoreOverride !== null && scoreOverride >= 0 && scoreOverride <= 1 ? scoreOverride : baseline.score;
    const reasonCodes: ReadonlyArray<RetentionReasonCode> = extraReason
      ? [...baseline.reasonCodes, extraReason]
      : baseline.reasonCodes;
    return {
      clientId: metrics.clientId,
      retentionScore: score,
      churnHorizonDays: estimateChurnHorizonDays(metrics, score),
      confidence: narrative ? 0.8 : 0.6,
      reasonCodes,
      suggestedActions: pickActionsForScore(score, reasonCodes),
      narrative,
    };
  }

  async function generate(input: RetentionInsightsInput): Promise<RetentionInsightsResult> {
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

    if (!guard.allowed || !deps.callNarrativeModel) {
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: false,
        modelTierUsed: null,
      });
      return {
        mode: "metrics-only",
        insights: input.clients.map((m) => buildInsight(m, null, null, null)),
        guard,
        modelTierUsed: null,
        providerCalled: false,
      };
    }

    const modelTier: RetentionModelTier = guard.disablePremiumModel ? "low-cost" : "high";
    const callModel = deps.callNarrativeModel;
    let providerCalled = false;

    const insights: RetentionInsight[] = [];
    for (const metrics of input.clients) {
      const baseline = computeBaselineRetentionScore(metrics);
      try {
        const result = await callModel({
          tenantId: input.tenantId,
          client: metrics,
          baselineScore: baseline.score,
          modelTier,
        });
        providerCalled = true;
        insights.push(
          buildInsight(
            metrics,
            result.narrative,
            "ai-narrative",
            result.scoreOverride !== undefined ? result.scoreOverride : null
          )
        );
      } catch {
        providerCalled = true;
        insights.push(buildInsight(metrics, null, null, null));
      }
    }

    emitObservability({
      tenantId: input.tenantId,
      usage,
      guard,
      providerCalled,
      modelTierUsed: providerCalled ? modelTier : null,
    });

    return {
      mode: "ai-narrative",
      insights,
      guard,
      modelTierUsed: modelTier,
      providerCalled,
    };
  }

  return { generate };
}
