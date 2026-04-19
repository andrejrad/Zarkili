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

export type SupportTriageModelTier = "low-cost" | "high";

export type SupportTriageInput = {
  tenantId: string;
  monthKey: string;
  message: string;
};

export type SupportTriageModelInput = {
  tenantId: string;
  message: string;
  modelTier: SupportTriageModelTier;
};

export type SupportTriageModelOutput = {
  answer: string;
  confidence: number;
  escalate: boolean;
};

export type SupportTriageResult = {
  mode: "ai-response" | "human-escalation";
  message: string;
  guard: AiBudgetGuardDecision;
  modelTierUsed: SupportTriageModelTier | null;
  providerCalled: boolean;
};

export type SupportTriageDependencies = {
  getUsageSnapshot: (monthKey: string) => Promise<AiBudgetUsageSnapshot>;
  callModel: (input: SupportTriageModelInput) => Promise<SupportTriageModelOutput>;
  logGuardDecision?: (input: {
    feature: "support-triage";
    tenantId: string;
    monthKey: string;
    decision: AiBudgetGuardDecision;
  }) => void;
  logTelemetryEvent?: (event: AiCostTelemetryEvent) => void;
  logAlert?: (input: {
    level: AiAlertLevel;
    feature: "support-triage";
    tenantId: string;
    monthKey: string;
    event: AiCostTelemetryEvent;
  }) => void;
  budgetConfig?: AiBudgetGuardConfig;
};

export const SUPPORT_TRIAGE_FALLBACK_MESSAGE =
  "Your request has been routed to human support. We will respond as soon as possible.";

export function createSupportTriageService(deps: SupportTriageDependencies) {
  const budgetConfig = deps.budgetConfig ?? defaultAiBudgetGuardConfig;

  function emitObservability(input: {
    tenantId: string;
    usage: AiBudgetUsageSnapshot;
    guard: AiBudgetGuardDecision;
    providerCalled: boolean;
    modelTierUsed: SupportTriageModelTier | null;
  }): void {
    const event = buildAiCostTelemetryEvent({
      feature: "support-triage",
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
        feature: "support-triage",
        tenantId: input.tenantId,
        monthKey: event.monthKey,
        event,
      });
    }
  }

  async function triage(input: SupportTriageInput): Promise<SupportTriageResult> {
    const usage = await deps.getUsageSnapshot(input.monthKey);
    const guard = evaluateAiBudgetGuard({
      feature: "support-triage",
      usage,
      config: budgetConfig,
    });

    deps.logGuardDecision?.({
      feature: "support-triage",
      tenantId: input.tenantId,
      monthKey: input.monthKey,
      decision: guard,
    });

    if (!guard.allowed) {
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: false,
        modelTierUsed: null,
      });

      return {
        mode: "human-escalation",
        message: SUPPORT_TRIAGE_FALLBACK_MESSAGE,
        guard,
        modelTierUsed: null,
        providerCalled: false,
      };
    }

    const modelTier: SupportTriageModelTier = guard.disablePremiumModel ? "low-cost" : "high";

    try {
      const modelResult = await deps.callModel({
        tenantId: input.tenantId,
        message: input.message,
        modelTier,
      });

      if (modelResult.escalate) {
        emitObservability({
          tenantId: input.tenantId,
          usage,
          guard,
          providerCalled: true,
          modelTierUsed: modelTier,
        });

        return {
          mode: "human-escalation",
          message: SUPPORT_TRIAGE_FALLBACK_MESSAGE,
          guard,
          modelTierUsed: modelTier,
          providerCalled: true,
        };
      }

      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: true,
        modelTierUsed: modelTier,
      });

      return {
        mode: "ai-response",
        message: modelResult.answer,
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
        mode: "human-escalation",
        message: SUPPORT_TRIAGE_FALLBACK_MESSAGE,
        guard,
        modelTierUsed: modelTier,
        providerCalled: true,
      };
    }
  }

  return {
    triage,
  };
}
