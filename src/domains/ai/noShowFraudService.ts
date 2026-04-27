/**
 * Week 20 - Task 20.1: No-Show / Fraud Risk Scoring
 *
 * Pure-logic risk scoring with explainable outputs (score + reason codes +
 * recommended action). Follows the canonical supportTriageService template:
 * factory, dependency-injected ports, full cost-guard pipeline, telemetry,
 * alerting, and deterministic rules-only fallback when the AI cap is
 * exhausted (or when no model is configured).
 *
 * Consent-safety:
 *   The risk model consumes ONLY behavioural and transactional signals from
 *   the calling tenant's own bookings/payments. It does NOT receive PII,
 *   demographic markers, geographic precision below city, or any cross-tenant
 *   data. This is enforced at the INPUT TYPE — `RiskInputSignals` is the
 *   exhaustive consent-safe surface; nothing else can be passed.
 *
 * Discriminatory-signal review:
 *   See ../../../documentation/new-platform/AI_RISK_MODEL_POLICY.md for the
 *   full audit and the explicit list of forbidden signals (race, religion,
 *   political affiliation, exact address, full name, ID numbers, etc.).
 *
 * Override and review path:
 *   Every decision exposes `requiresHumanReview` and `policyVersion`. Tenant
 *   admins can override any decision via the staff-facing flow; the service
 *   never auto-blocks without `requiresHumanReview === true`.
 */

import {
  buildAiCostTelemetryEvent,
  defaultAiBudgetGuardConfig,
  evaluateAiBudgetGuard,
  type AiAlertLevel,
  type AiBudgetGuardConfig,
  type AiBudgetGuardDecision,
  type AiBudgetUsageSnapshot,
  type AiCostTelemetryEvent,
} from "../../shared/ai";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type RiskModelTier = "low-cost" | "high";
export type RiskMode = "ai-augmented" | "rules-only";

/** Consent-safe behavioural signals. PII is explicitly excluded. */
export type RiskInputSignals = {
  /** Total prior bookings for this client at this tenant. */
  priorBookings: number;
  /** Prior no-shows for this client at this tenant. */
  priorNoShows: number;
  /** Prior late cancellations (within tenant's late-cancel window). */
  priorLateCancellations: number;
  /** Prior on-time completed bookings. */
  priorCompletedBookings: number;
  /** Days since the most recent completed booking (Number.POSITIVE_INFINITY for new clients). */
  daysSinceLastBooking: number;
  /** Hours from now until the booking start time. */
  leadTimeHours: number;
  /** Bookings created by this client in the last 24h (velocity signal). */
  bookingsLast24h: number;
  /** Payment chargebacks/disputes recorded against this client at this tenant. */
  paymentDisputeCount: number;
  /** Whether the booking is during a tenant-flagged elevated-risk hour band. */
  highRiskHourBand: boolean;
  /** Service price tier (>=0). Higher tiers attract more deposit-protected fraud. */
  servicePriceUsd: number;
};

export type RiskReasonCode =
  | "high-no-show-rate"
  | "high-late-cancellation-rate"
  | "new-account-low-history"
  | "rapid-velocity"
  | "very-short-lead-time"
  | "payment-dispute-history"
  | "high-risk-hour-band"
  | "high-value-service"
  | "established-good-history";

export type RiskRecommendedAction =
  | "allow"
  | "require-deposit"
  | "require-prepayment"
  | "manual-review"
  | "block";

export type RiskInput = {
  tenantId: string;
  monthKey: string;
  bookingId: string;
  /** Opaque, hashed client identifier; the service does not reverse it. */
  clientHash: string;
  signals: RiskInputSignals;
  /** Optional per-tenant policy override. Defaults to `DEFAULT_RISK_POLICY`. */
  policy?: RiskPolicy;
};

export type RiskPolicy = {
  /** Score in [0,1] above which we recommend a deposit. */
  depositThreshold: number;
  /** Score above which we recommend prepayment. */
  prepaymentThreshold: number;
  /** Score above which we recommend manual review. */
  manualReviewThreshold: number;
  /**
   * Score above which we recommend block. NOTE: a `block` action still
   * requires `requiresHumanReview: true` — the service never silently denies.
   */
  blockThreshold: number;
};

export const DEFAULT_RISK_POLICY: RiskPolicy = {
  depositThreshold: 0.4,
  prepaymentThreshold: 0.6,
  manualReviewThreshold: 0.8,
  blockThreshold: 0.95,
};

export const RISK_POLICY_VERSION = "v1.0.0";

export type RiskAssessment = {
  bookingId: string;
  riskScore: number;
  reasonCodes: RiskReasonCode[];
  recommendedAction: RiskRecommendedAction;
  /** Always true when the assessment came from rules-only fallback or when action is `manual-review`/`block`. */
  requiresHumanReview: boolean;
  policyVersion: string;
};

export type RiskModelInput = {
  tenantId: string;
  bookingId: string;
  clientHash: string;
  signals: RiskInputSignals;
  /** Heuristic baseline so the model can defend against drift. */
  heuristic: {
    score: number;
    reasonCodes: RiskReasonCode[];
  };
  modelTier: RiskModelTier;
};

export type RiskModelOutput = {
  riskScore: number;
  reasonCodes: RiskReasonCode[];
};

export type RiskResult = {
  mode: RiskMode;
  assessment: RiskAssessment;
  guard: AiBudgetGuardDecision;
  modelTierUsed: RiskModelTier | null;
  providerCalled: boolean;
};

export type NoShowFraudDependencies = {
  getUsageSnapshot: (monthKey: string) => Promise<AiBudgetUsageSnapshot>;
  /** Optional. When omitted, the service runs in rules-only mode. */
  callModel?: (input: RiskModelInput) => Promise<RiskModelOutput>;
  logGuardDecision?: (input: {
    feature: "no-show-fraud";
    tenantId: string;
    monthKey: string;
    decision: AiBudgetGuardDecision;
  }) => void;
  logTelemetryEvent?: (event: AiCostTelemetryEvent) => void;
  logAlert?: (input: {
    level: AiAlertLevel;
    feature: "no-show-fraud";
    tenantId: string;
    monthKey: string;
    event: AiCostTelemetryEvent;
  }) => void;
  /** Drift / outcome observability hook (per-call). */
  logRiskAssessment?: (input: {
    tenantId: string;
    monthKey: string;
    bookingId: string;
    mode: RiskMode;
    assessment: RiskAssessment;
  }) => void;
  budgetConfig?: AiBudgetGuardConfig;
};

// ---------------------------------------------------------------------------
// Pure helpers (independently exported and tested)
// ---------------------------------------------------------------------------

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Deterministic baseline risk score derived purely from the consent-safe
 * signals. Used in two places:
 *  1. As the model's heuristic input (so the model can defend against drift).
 *  2. As the rules-only fallback when the AI cap is exhausted or no model is configured.
 */
export function computeHeuristicRiskScore(signals: RiskInputSignals): {
  score: number;
  reasonCodes: RiskReasonCode[];
} {
  const reasonCodes: RiskReasonCode[] = [];
  let score = 0;

  const totalHistory =
    signals.priorBookings + signals.priorNoShows + signals.priorLateCancellations + signals.priorCompletedBookings;

  if (totalHistory < 2) {
    score += 0.25;
    reasonCodes.push("new-account-low-history");
  }

  if (signals.priorBookings > 0) {
    const noShowRate = signals.priorNoShows / Math.max(1, signals.priorBookings);
    if (noShowRate >= 0.5) {
      score += 0.45;
      reasonCodes.push("high-no-show-rate");
    } else if (noShowRate >= 0.25) {
      score += 0.25;
      reasonCodes.push("high-no-show-rate");
    }

    const lateCancelRate = signals.priorLateCancellations / Math.max(1, signals.priorBookings);
    if (lateCancelRate >= 0.5) {
      score += 0.25;
      reasonCodes.push("high-late-cancellation-rate");
    } else if (lateCancelRate >= 0.25) {
      score += 0.15;
      reasonCodes.push("high-late-cancellation-rate");
    }
  }

  if (signals.bookingsLast24h >= 4) {
    score += 0.2;
    reasonCodes.push("rapid-velocity");
  }

  if (signals.leadTimeHours <= 1) {
    score += 0.1;
    reasonCodes.push("very-short-lead-time");
  }

  if (signals.paymentDisputeCount >= 1) {
    score += 0.35;
    reasonCodes.push("payment-dispute-history");
  }

  if (signals.highRiskHourBand) {
    score += 0.05;
    reasonCodes.push("high-risk-hour-band");
  }

  if (signals.servicePriceUsd >= 250) {
    score += 0.05;
    reasonCodes.push("high-value-service");
  }

  // Trust signal (lowers risk) — well-established clients with clean history.
  if (
    signals.priorCompletedBookings >= 5 &&
    signals.priorNoShows === 0 &&
    signals.paymentDisputeCount === 0 &&
    signals.daysSinceLastBooking <= 365
  ) {
    score -= 0.25;
    reasonCodes.push("established-good-history");
  }

  return { score: clamp01(score), reasonCodes };
}

/**
 * Maps a clamped risk score to a recommended action, given a tenant policy.
 * The thresholds are checked from highest to lowest — block first, then
 * manual-review, prepayment, deposit, otherwise allow.
 */
export function resolveRecommendedAction(score: number, policy: RiskPolicy): RiskRecommendedAction {
  const clamped = clamp01(score);
  if (clamped >= policy.blockThreshold) return "block";
  if (clamped >= policy.manualReviewThreshold) return "manual-review";
  if (clamped >= policy.prepaymentThreshold) return "require-prepayment";
  if (clamped >= policy.depositThreshold) return "require-deposit";
  return "allow";
}

function dedupeReasonCodes(codes: RiskReasonCode[]): RiskReasonCode[] {
  const seen = new Set<RiskReasonCode>();
  const out: RiskReasonCode[] = [];
  for (const code of codes) {
    if (!seen.has(code)) {
      seen.add(code);
      out.push(code);
    }
  }
  return out;
}

const ALLOWED_REASON_CODES: ReadonlySet<RiskReasonCode> = new Set<RiskReasonCode>([
  "high-no-show-rate",
  "high-late-cancellation-rate",
  "new-account-low-history",
  "rapid-velocity",
  "very-short-lead-time",
  "payment-dispute-history",
  "high-risk-hour-band",
  "high-value-service",
  "established-good-history",
]);

/** Defence-in-depth: drop any reason code the model emitted that is not in the allow-list. */
export function filterReasonCodesToAllowList(codes: RiskReasonCode[]): RiskReasonCode[] {
  return codes.filter((code) => ALLOWED_REASON_CODES.has(code));
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export function createNoShowFraudService(deps: NoShowFraudDependencies) {
  const budgetConfig = deps.budgetConfig ?? defaultAiBudgetGuardConfig;

  function emitObservability(input: {
    tenantId: string;
    usage: AiBudgetUsageSnapshot;
    guard: AiBudgetGuardDecision;
    providerCalled: boolean;
    modelTierUsed: RiskModelTier | null;
  }): void {
    const event = buildAiCostTelemetryEvent({
      feature: "no-show-fraud",
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
        feature: "no-show-fraud",
        tenantId: input.tenantId,
        monthKey: event.monthKey,
        event,
      });
    }
  }

  function buildRulesOnlyAssessment(input: RiskInput): RiskAssessment {
    const policy = input.policy ?? DEFAULT_RISK_POLICY;
    const { score, reasonCodes } = computeHeuristicRiskScore(input.signals);
    const recommendedAction = resolveRecommendedAction(score, policy);
    return {
      bookingId: input.bookingId,
      riskScore: score,
      reasonCodes,
      recommendedAction,
      // Rules-only assessments ALWAYS require human review (per task 20.1 spec).
      requiresHumanReview: true,
      policyVersion: RISK_POLICY_VERSION,
    };
  }

  async function assessRisk(input: RiskInput): Promise<RiskResult> {
    const policy = input.policy ?? DEFAULT_RISK_POLICY;
    const usage = await deps.getUsageSnapshot(input.monthKey);
    const guard = evaluateAiBudgetGuard({
      feature: "no-show-fraud",
      usage,
      config: budgetConfig,
    });

    deps.logGuardDecision?.({
      feature: "no-show-fraud",
      tenantId: input.tenantId,
      monthKey: input.monthKey,
      decision: guard,
    });

    const fallback = (): RiskResult => {
      const assessment = buildRulesOnlyAssessment(input);
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: false,
        modelTierUsed: null,
      });
      const result: RiskResult = {
        mode: "rules-only",
        assessment,
        guard,
        modelTierUsed: null,
        providerCalled: false,
      };
      deps.logRiskAssessment?.({
        tenantId: input.tenantId,
        monthKey: input.monthKey,
        bookingId: input.bookingId,
        mode: result.mode,
        assessment,
      });
      return result;
    };

    if (!guard.allowed || !deps.callModel) {
      return fallback();
    }

    const modelTier: RiskModelTier = guard.disablePremiumModel ? "low-cost" : "high";
    const heuristic = computeHeuristicRiskScore(input.signals);

    try {
      const modelOutput = await deps.callModel({
        tenantId: input.tenantId,
        bookingId: input.bookingId,
        clientHash: input.clientHash,
        signals: input.signals,
        heuristic,
        modelTier,
      });

      const score = clamp01(modelOutput.riskScore);
      const filtered = dedupeReasonCodes(filterReasonCodesToAllowList(modelOutput.reasonCodes));
      const recommendedAction = resolveRecommendedAction(score, policy);

      // requiresHumanReview is forced TRUE for `manual-review` and `block`,
      // and otherwise honours the AI score. Defence-in-depth: never auto-deny.
      const requiresHumanReview =
        recommendedAction === "manual-review" || recommendedAction === "block";

      const assessment: RiskAssessment = {
        bookingId: input.bookingId,
        riskScore: score,
        reasonCodes: filtered.length > 0 ? filtered : heuristic.reasonCodes,
        recommendedAction,
        requiresHumanReview,
        policyVersion: RISK_POLICY_VERSION,
      };

      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: true,
        modelTierUsed: modelTier,
      });

      const result: RiskResult = {
        mode: "ai-augmented",
        assessment,
        guard,
        modelTierUsed: modelTier,
        providerCalled: true,
      };

      deps.logRiskAssessment?.({
        tenantId: input.tenantId,
        monthKey: input.monthKey,
        bookingId: input.bookingId,
        mode: result.mode,
        assessment,
      });

      return result;
    } catch {
      // Model error → rules-only fallback (still emits observability once).
      const assessment = buildRulesOnlyAssessment(input);
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: true,
        modelTierUsed: modelTier,
      });
      const result: RiskResult = {
        mode: "rules-only",
        assessment,
        guard,
        modelTierUsed: modelTier,
        providerCalled: true,
      };
      deps.logRiskAssessment?.({
        tenantId: input.tenantId,
        monthKey: input.monthKey,
        bookingId: input.bookingId,
        mode: result.mode,
        assessment,
      });
      return result;
    }
  }

  return {
    assessRisk,
  };
}
