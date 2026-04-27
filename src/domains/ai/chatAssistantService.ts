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

// Chat assistance is feature-tagged under "support-triage" (W19): both surfaces
// are conversational text-routing and share a single cost bucket. The
// documentation/new-platform/AI_CHAT_POLICY.md doc records this decision.
const CHAT_FEATURE_KEY = "support-triage" as const;

export type ChatAssistantSurface = "client" | "admin" | "staff";
export type ChatAssistantModelTier = "low-cost" | "high";

export type ChatAssistantInput = {
  tenantId: string;
  monthKey: string;
  surface: ChatAssistantSurface;
  message: string;
  conversationId?: string;
};

export type ChatContext = {
  snippets: ReadonlyArray<{ title: string; body: string }>;
  // Tenant id the context was retrieved for; used for an isolation assertion.
  tenantId: string;
};

export type ChatModelInput = {
  tenantId: string;
  surface: ChatAssistantSurface;
  message: string;
  context: ChatContext;
  modelTier: ChatAssistantModelTier;
};

export type ChatModelOutput = {
  answer: string;
  confidence: number;
};

export type ChatSafetyResult = {
  safe: boolean;
  reasons: ReadonlyArray<string>;
};

export type ChatEscalationReason =
  | "budget-exhausted"
  | "low-confidence"
  | "unsafe-output"
  | "context-isolation-violation"
  | "model-error";

export type ChatAssistantResult = {
  mode: "ai-response" | "human-escalation";
  message: string;
  guard: AiBudgetGuardDecision;
  modelTierUsed: ChatAssistantModelTier | null;
  providerCalled: boolean;
  escalationReason: ChatEscalationReason | null;
  confidence: number | null;
};

export type ChatAssistantDependencies = {
  getUsageSnapshot: (monthKey: string) => Promise<AiBudgetUsageSnapshot>;
  retrieveContext: (input: {
    tenantId: string;
    surface: ChatAssistantSurface;
    message: string;
  }) => Promise<ChatContext>;
  callModel: (input: ChatModelInput) => Promise<ChatModelOutput>;
  applySafetyFilter: (input: { tenantId: string; text: string }) => ChatSafetyResult | Promise<ChatSafetyResult>;
  logGuardDecision?: (input: {
    feature: typeof CHAT_FEATURE_KEY;
    tenantId: string;
    monthKey: string;
    decision: AiBudgetGuardDecision;
  }) => void;
  logTelemetryEvent?: (event: AiCostTelemetryEvent) => void;
  logAlert?: (input: {
    level: AiAlertLevel;
    feature: typeof CHAT_FEATURE_KEY;
    tenantId: string;
    monthKey: string;
    event: AiCostTelemetryEvent;
  }) => void;
  budgetConfig?: AiBudgetGuardConfig;
  // Default 0.6. Below this, the assistant escalates to a human regardless of guard state.
  confidenceThreshold?: number;
};

export const CHAT_ASSISTANT_FALLBACK_MESSAGE =
  "We've routed your message to a human teammate. Someone will follow up shortly.";

export const DEFAULT_CHAT_CONFIDENCE_THRESHOLD = 0.6;

export function createChatAssistantService(deps: ChatAssistantDependencies) {
  const budgetConfig = deps.budgetConfig ?? defaultAiBudgetGuardConfig;
  const confidenceThreshold = deps.confidenceThreshold ?? DEFAULT_CHAT_CONFIDENCE_THRESHOLD;

  function emitObservability(input: {
    tenantId: string;
    usage: AiBudgetUsageSnapshot;
    guard: AiBudgetGuardDecision;
    providerCalled: boolean;
    modelTierUsed: ChatAssistantModelTier | null;
  }): void {
    const event = buildAiCostTelemetryEvent({
      feature: CHAT_FEATURE_KEY,
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
        feature: CHAT_FEATURE_KEY,
        tenantId: input.tenantId,
        monthKey: event.monthKey,
        event,
      });
    }
  }

  function escalation(
    guard: AiBudgetGuardDecision,
    reason: ChatEscalationReason,
    modelTierUsed: ChatAssistantModelTier | null,
    providerCalled: boolean,
    confidence: number | null
  ): ChatAssistantResult {
    return {
      mode: "human-escalation",
      message: CHAT_ASSISTANT_FALLBACK_MESSAGE,
      guard,
      modelTierUsed,
      providerCalled,
      escalationReason: reason,
      confidence,
    };
  }

  async function respond(input: ChatAssistantInput): Promise<ChatAssistantResult> {
    const usage = await deps.getUsageSnapshot(input.monthKey);
    const guard = evaluateAiBudgetGuard({
      feature: CHAT_FEATURE_KEY,
      usage,
      config: budgetConfig,
    });

    deps.logGuardDecision?.({
      feature: CHAT_FEATURE_KEY,
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
      return escalation(guard, "budget-exhausted", null, false, null);
    }

    const modelTier: ChatAssistantModelTier = guard.disablePremiumModel ? "low-cost" : "high";

    let context: ChatContext;
    try {
      context = await deps.retrieveContext({
        tenantId: input.tenantId,
        surface: input.surface,
        message: input.message,
      });
    } catch {
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: false,
        modelTierUsed: null,
      });
      return escalation(guard, "model-error", null, false, null);
    }

    if (context.tenantId !== input.tenantId) {
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: false,
        modelTierUsed: null,
      });
      return escalation(guard, "context-isolation-violation", null, false, null);
    }

    let modelResult: ChatModelOutput;
    try {
      modelResult = await deps.callModel({
        tenantId: input.tenantId,
        surface: input.surface,
        message: input.message,
        context,
        modelTier,
      });
    } catch {
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: true,
        modelTierUsed: modelTier,
      });
      return escalation(guard, "model-error", modelTier, true, null);
    }

    const safety = await deps.applySafetyFilter({
      tenantId: input.tenantId,
      text: modelResult.answer,
    });

    emitObservability({
      tenantId: input.tenantId,
      usage,
      guard,
      providerCalled: true,
      modelTierUsed: modelTier,
    });

    if (!safety.safe) {
      return escalation(guard, "unsafe-output", modelTier, true, modelResult.confidence);
    }

    if (modelResult.confidence < confidenceThreshold) {
      return escalation(guard, "low-confidence", modelTier, true, modelResult.confidence);
    }

    return {
      mode: "ai-response",
      message: modelResult.answer,
      guard,
      modelTierUsed: modelTier,
      providerCalled: true,
      escalationReason: null,
      confidence: modelResult.confidence,
    };
  }

  return { respond };
}
