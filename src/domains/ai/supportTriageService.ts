import {
  defaultAiBudgetGuardConfig,
  evaluateAiBudgetGuard,
  type AiBudgetGuardConfig,
  type AiBudgetGuardDecision,
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
  budgetConfig?: AiBudgetGuardConfig;
};

export const SUPPORT_TRIAGE_FALLBACK_MESSAGE =
  "Your request has been routed to human support. We will respond as soon as possible.";

export function createSupportTriageService(deps: SupportTriageDependencies) {
  const budgetConfig = deps.budgetConfig ?? defaultAiBudgetGuardConfig;

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
        return {
          mode: "human-escalation",
          message: SUPPORT_TRIAGE_FALLBACK_MESSAGE,
          guard,
          modelTierUsed: modelTier,
          providerCalled: true,
        };
      }

      return {
        mode: "ai-response",
        message: modelResult.answer,
        guard,
        modelTierUsed: modelTier,
        providerCalled: true,
      };
    } catch {
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
