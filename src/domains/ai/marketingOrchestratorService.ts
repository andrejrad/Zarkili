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

const FEATURE_KEY = "marketing-orchestration" as const;

export type MarketingChannel = "email" | "sms" | "push" | "in-app";
export type MarketingTriggerType =
  | "time-based"
  | "behavior-based"
  | "booking-based"
  | "no-show-based"
  | "loyalty-based";
export type MarketingTier = "low-cost" | "high";
export type MarketingMode = "ai-personalized" | "rules-only";

export type CampaignDefinition = {
  campaignId: string;
  triggerType: MarketingTriggerType;
  channel: MarketingChannel;
  // Auto-send is allowed only if explicitly true AND nothing else blocks the dispatch.
  autoSendEnabled: boolean;
  // Per-campaign frequency cap; the rules engine refuses to dispatch if a previous
  // campaign of the same id was sent to the same client within this window.
  minIntervalHours: number;
};

export type ConsentState = {
  // Per-channel opt-in. Missing channel = not opted in.
  channels: Partial<Record<MarketingChannel, boolean>>;
};

export type QuietHoursPolicy = {
  // Inclusive start, exclusive end, in tenant local minutes-of-day.
  startMinutes: number;
  endMinutes: number;
};

export type DispatchContextItem = {
  clientId: string;
  // Last dispatch time per (campaignId), tenant-local epoch ms.
  lastDispatchedAtMsByCampaign: Partial<Record<string, number>>;
  consent: ConsentState;
};

export type EligibilityCandidate = {
  clientId: string;
  campaignId: string;
  triggerSatisfied: boolean;
};

export type DispatchDecisionStatus =
  | "queued-needs-review"
  | "queued-auto-send"
  | "blocked-no-consent"
  | "blocked-quiet-hours"
  | "blocked-frequency-cap"
  | "blocked-trigger-not-satisfied"
  | "blocked-duplicate-in-batch";

export type DispatchDecision = {
  clientId: string;
  campaignId: string;
  channel: MarketingChannel;
  status: DispatchDecisionStatus;
  reasonCodes: ReadonlyArray<string>;
  personalization: {
    mode: MarketingMode;
    snippet: string | null;
  };
};

export type EvaluateBatchInput = {
  tenantId: string;
  monthKey: string;
  // tenant-local epoch ms; the orchestrator does not call clocks directly.
  nowMs: number;
  // Tenant-local minutes of day at `nowMs` (caller's timezone math).
  nowMinutesOfDay: number;
  campaigns: ReadonlyArray<CampaignDefinition>;
  candidates: ReadonlyArray<EligibilityCandidate>;
  context: ReadonlyArray<DispatchContextItem>;
  quietHours?: QuietHoursPolicy;
};

export type PersonalizationModelInput = {
  tenantId: string;
  campaignId: string;
  clientId: string;
  modelTier: MarketingTier;
};

export type PersonalizationModelOutput = {
  snippet: string;
};

export type EvaluateBatchResult = {
  mode: MarketingMode;
  decisions: ReadonlyArray<DispatchDecision>;
  guard: AiBudgetGuardDecision;
  modelTierUsed: MarketingTier | null;
  providerCalled: boolean;
};

export type MarketingOrchestratorDependencies = {
  getUsageSnapshot: (monthKey: string) => Promise<AiBudgetUsageSnapshot>;
  callPersonalizationModel?: (input: PersonalizationModelInput) => Promise<PersonalizationModelOutput>;
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

export function isInQuietHours(nowMinutesOfDay: number, policy: QuietHoursPolicy | undefined): boolean {
  if (!policy) return false;
  if (policy.startMinutes === policy.endMinutes) return false;
  if (policy.startMinutes < policy.endMinutes) {
    return nowMinutesOfDay >= policy.startMinutes && nowMinutesOfDay < policy.endMinutes;
  }
  // Wraps midnight, e.g. 22:00 - 07:00.
  return nowMinutesOfDay >= policy.startMinutes || nowMinutesOfDay < policy.endMinutes;
}

/**
 * Pure rules-only evaluator. Encodes every safety rule the spec requires:
 *   - trigger must be satisfied;
 *   - per-channel consent must be opted in;
 *   - quiet hours suppress all dispatches;
 *   - per-campaign frequency cap (`minIntervalHours`) enforced via context;
 *   - in-batch dedupe prevents the same (client, campaign) appearing twice;
 *   - autoSend only when campaign opts in AND nothing else blocks.
 *
 * The output decisions array is the single source of truth for what may be
 * dispatched. Callers must respect `status`.
 */
export function evaluateRulesEngine(input: EvaluateBatchInput): ReadonlyArray<DispatchDecision> {
  const campaignsById = new Map(input.campaigns.map((c) => [c.campaignId, c]));
  const ctxByClient = new Map(input.context.map((c) => [c.clientId, c]));
  const seenInBatch = new Set<string>();
  const out: DispatchDecision[] = [];

  for (const cand of input.candidates) {
    const campaign = campaignsById.get(cand.campaignId);
    if (!campaign) continue;
    const ctx = ctxByClient.get(cand.clientId);
    const dedupeKey = `${cand.clientId}|${cand.campaignId}`;

    if (seenInBatch.has(dedupeKey)) {
      out.push({
        clientId: cand.clientId,
        campaignId: cand.campaignId,
        channel: campaign.channel,
        status: "blocked-duplicate-in-batch",
        reasonCodes: ["batch-dedupe"],
        personalization: { mode: "rules-only", snippet: null },
      });
      continue;
    }
    seenInBatch.add(dedupeKey);

    if (!cand.triggerSatisfied) {
      out.push({
        clientId: cand.clientId,
        campaignId: cand.campaignId,
        channel: campaign.channel,
        status: "blocked-trigger-not-satisfied",
        reasonCodes: ["trigger-eligibility"],
        personalization: { mode: "rules-only", snippet: null },
      });
      continue;
    }

    const consentOk = ctx?.consent.channels[campaign.channel] === true;
    if (!consentOk) {
      out.push({
        clientId: cand.clientId,
        campaignId: cand.campaignId,
        channel: campaign.channel,
        status: "blocked-no-consent",
        reasonCodes: ["consent-required"],
        personalization: { mode: "rules-only", snippet: null },
      });
      continue;
    }

    if (isInQuietHours(input.nowMinutesOfDay, input.quietHours)) {
      out.push({
        clientId: cand.clientId,
        campaignId: cand.campaignId,
        channel: campaign.channel,
        status: "blocked-quiet-hours",
        reasonCodes: ["quiet-hours"],
        personalization: { mode: "rules-only", snippet: null },
      });
      continue;
    }

    const lastSent = ctx?.lastDispatchedAtMsByCampaign[campaign.campaignId];
    if (lastSent !== undefined) {
      const elapsedHours = (input.nowMs - lastSent) / 3_600_000;
      if (elapsedHours < campaign.minIntervalHours) {
        out.push({
          clientId: cand.clientId,
          campaignId: cand.campaignId,
          channel: campaign.channel,
          status: "blocked-frequency-cap",
          reasonCodes: ["frequency-cap"],
          personalization: { mode: "rules-only", snippet: null },
        });
        continue;
      }
    }

    out.push({
      clientId: cand.clientId,
      campaignId: cand.campaignId,
      channel: campaign.channel,
      status: campaign.autoSendEnabled ? "queued-auto-send" : "queued-needs-review",
      reasonCodes: ["eligible"],
      personalization: { mode: "rules-only", snippet: null },
    });
  }

  return out;
}

export function createMarketingOrchestratorService(deps: MarketingOrchestratorDependencies) {
  const budgetConfig = deps.budgetConfig ?? defaultAiBudgetGuardConfig;

  function emitObservability(input: {
    tenantId: string;
    usage: AiBudgetUsageSnapshot;
    guard: AiBudgetGuardDecision;
    providerCalled: boolean;
    modelTierUsed: MarketingTier | null;
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

  async function evaluateBatch(input: EvaluateBatchInput): Promise<EvaluateBatchResult> {
    const ruleDecisions = evaluateRulesEngine(input);

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

    if (!guard.allowed || !deps.callPersonalizationModel) {
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: false,
        modelTierUsed: null,
      });
      return {
        mode: "rules-only",
        decisions: ruleDecisions,
        guard,
        modelTierUsed: null,
        providerCalled: false,
      };
    }

    const modelTier: MarketingTier = guard.disablePremiumModel ? "low-cost" : "high";
    const callModel = deps.callPersonalizationModel;

    const personalized: DispatchDecision[] = [];
    let providerCalled = false;
    for (const decision of ruleDecisions) {
      // Only personalise dispatches that will actually go out (pass rule gates).
      if (decision.status !== "queued-needs-review" && decision.status !== "queued-auto-send") {
        personalized.push(decision);
        continue;
      }
      try {
        const r = await callModel({
          tenantId: input.tenantId,
          campaignId: decision.campaignId,
          clientId: decision.clientId,
          modelTier,
        });
        providerCalled = true;
        personalized.push({
          ...decision,
          personalization: { mode: "ai-personalized", snippet: r.snippet },
        });
      } catch {
        providerCalled = true;
        personalized.push(decision); // keep rules-only personalization on error
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
      mode: "ai-personalized",
      decisions: personalized,
      guard,
      modelTierUsed: modelTier,
      providerCalled,
    };
  }

  return { evaluateBatch };
}
