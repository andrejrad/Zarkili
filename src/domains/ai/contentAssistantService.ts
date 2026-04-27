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

const FEATURE_KEY = "content-creation" as const;

export type ContentTone = "friendly" | "formal" | "playful" | "concise";
export type ContentTier = "low-cost" | "high";
export type ContentMode = "ai-generated" | "template-fallback";
export type ContentChannel = "email" | "sms" | "push" | "in-app";

export type ContentBriefInput = {
  tenantId: string;
  monthKey: string;
  channel: ContentChannel;
  tone: ContentTone;
  // Free-form purpose, e.g. "win-back for clients absent 60 days".
  purpose: string;
  // Hard policy: drafts are never auto-sent.
  approvalMode: "human-approval";
};

export type ContentModelInput = {
  tenantId: string;
  channel: ContentChannel;
  tone: ContentTone;
  purpose: string;
  modelTier: ContentTier;
};

export type ContentModelOutput = {
  body: string;
  // Optional, if the model wants to suggest one. Subject is ignored for sms/push.
  subject?: string;
};

export type ContentDraft = {
  channel: ContentChannel;
  tone: ContentTone;
  subject: string | null;
  body: string;
  status: "needs-review";
  reasonCodes: ReadonlyArray<"ai-generated" | "template-fallback" | "tone-applied">;
};

export type ContentResult = {
  mode: ContentMode;
  draft: ContentDraft;
  guard: AiBudgetGuardDecision;
  modelTierUsed: ContentTier | null;
  providerCalled: boolean;
};

export type ContentAssistantDependencies = {
  getUsageSnapshot: (monthKey: string) => Promise<AiBudgetUsageSnapshot>;
  callModel?: (input: ContentModelInput) => Promise<ContentModelOutput>;
  applySafetyFilter: (input: { tenantId: string; text: string }) => { safe: boolean; reasons: ReadonlyArray<string> };
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

const TONE_PREFIX: Record<ContentTone, string> = {
  friendly: "Hi! ",
  formal: "Dear valued client, ",
  playful: "Hey you! ",
  concise: "",
};

/**
 * Tone-aware deterministic template. Used when the AI budget guard rejects a
 * call OR when no callModel dep is wired OR when AI output fails the safety
 * filter. Always produces a draft that is safe to put in the approval queue.
 */
export function buildTemplateDraft(input: ContentBriefInput): ContentDraft {
  const subject =
    input.channel === "email" ? `${TONE_PREFIX[input.tone].trim()} An update for you`.trim() : null;
  const prefix = TONE_PREFIX[input.tone];
  const body = `${prefix}${input.purpose}. (Draft generated from template — please personalise before sending.)`;
  return {
    channel: input.channel,
    tone: input.tone,
    subject,
    body,
    status: "needs-review",
    reasonCodes: ["template-fallback", "tone-applied"],
  };
}

export function createContentAssistantService(deps: ContentAssistantDependencies) {
  const budgetConfig = deps.budgetConfig ?? defaultAiBudgetGuardConfig;

  function emitObservability(input: {
    tenantId: string;
    usage: AiBudgetUsageSnapshot;
    guard: AiBudgetGuardDecision;
    providerCalled: boolean;
    modelTierUsed: ContentTier | null;
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

  async function generate(input: ContentBriefInput): Promise<ContentResult> {
    if (input.approvalMode !== "human-approval") {
      throw new Error("contentAssistant: only human-approval mode is supported");
    }

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

    if (!guard.allowed || !deps.callModel) {
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: false,
        modelTierUsed: null,
      });
      return {
        mode: "template-fallback",
        draft: buildTemplateDraft(input),
        guard,
        modelTierUsed: null,
        providerCalled: false,
      };
    }

    const modelTier: ContentTier = guard.disablePremiumModel ? "low-cost" : "high";

    let modelResult: ContentModelOutput;
    try {
      modelResult = await deps.callModel({
        tenantId: input.tenantId,
        channel: input.channel,
        tone: input.tone,
        purpose: input.purpose,
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
      return {
        mode: "template-fallback",
        draft: buildTemplateDraft(input),
        guard,
        modelTierUsed: modelTier,
        providerCalled: true,
      };
    }

    const safety = deps.applySafetyFilter({
      tenantId: input.tenantId,
      text: `${modelResult.subject ?? ""}\n${modelResult.body}`,
    });

    emitObservability({
      tenantId: input.tenantId,
      usage,
      guard,
      providerCalled: true,
      modelTierUsed: modelTier,
    });

    if (!safety.safe) {
      return {
        mode: "template-fallback",
        draft: buildTemplateDraft(input),
        guard,
        modelTierUsed: modelTier,
        providerCalled: true,
      };
    }

    const subject = input.channel === "email" ? modelResult.subject ?? null : null;
    return {
      mode: "ai-generated",
      draft: {
        channel: input.channel,
        tone: input.tone,
        subject,
        body: modelResult.body,
        status: "needs-review",
        reasonCodes: ["ai-generated", "tone-applied"],
      },
      guard,
      modelTierUsed: modelTier,
      providerCalled: true,
    };
  }

  return { generate };
}
