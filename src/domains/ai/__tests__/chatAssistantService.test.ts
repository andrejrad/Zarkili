import {
  CHAT_ASSISTANT_FALLBACK_MESSAGE,
  createChatAssistantService,
  DEFAULT_CHAT_CONFIDENCE_THRESHOLD,
  type ChatAssistantInput,
  type ChatContext,
  type ChatModelInput,
  type ChatModelOutput,
} from "../chatAssistantService";

const SUPPORT_FEATURE_CAP = 120; // matches starterFeatureCaps["support-triage"]

function createUsage(supportSpendUsd: number, globalSpendUsd: number) {
  return {
    monthKey: "2026-04",
    globalSpendUsd,
    featureSpendUsd: {
      "support-triage": supportSpendUsd,
    },
  };
}

function makeContext(tenantId: string): ChatContext {
  return {
    tenantId,
    snippets: [{ title: "FAQ", body: "Booking changes can be made up to 24h before." }],
  };
}

function makeInput(overrides: Partial<ChatAssistantInput> = {}): ChatAssistantInput {
  return {
    tenantId: "tenantA",
    monthKey: "2026-04",
    surface: "client",
    message: "How do I reschedule?",
    ...overrides,
  };
}

describe("chat assistant service budget guard integration", () => {
  it("returns deterministic fallback when support cap is exhausted (no provider call)", async () => {
    const callModel = jest.fn<Promise<ChatModelOutput>, [ChatModelInput]>();
    const retrieveContext = jest.fn();
    const service = createChatAssistantService({
      getUsageSnapshot: async () => createUsage(SUPPORT_FEATURE_CAP, 300),
      retrieveContext,
      callModel,
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
    });

    const result = await service.respond(makeInput());

    expect(callModel).not.toHaveBeenCalled();
    expect(retrieveContext).not.toHaveBeenCalled();
    expect(result.mode).toBe("human-escalation");
    expect(result.message).toBe(CHAT_ASSISTANT_FALLBACK_MESSAGE);
    expect(result.escalationReason).toBe("budget-exhausted");
    expect(result.providerCalled).toBe(false);
    expect(result.guard.state).toBe("exhausted");
    expect(result.guard.scope).toBe("feature");
  });

  it("downshifts to low-cost tier in protection state", async () => {
    const callModel = jest.fn(async (input: ChatModelInput) => ({
      answer: `handled with ${input.modelTier}`,
      confidence: 0.85,
    }));
    const service = createChatAssistantService({
      getUsageSnapshot: async () => createUsage(SUPPORT_FEATURE_CAP * 0.92, 400),
      retrieveContext: async ({ tenantId }) => makeContext(tenantId),
      callModel,
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
    });

    const result = await service.respond(makeInput());

    expect(callModel).toHaveBeenCalledTimes(1);
    expect(callModel).toHaveBeenCalledWith(expect.objectContaining({ modelTier: "low-cost" }));
    expect(result.mode).toBe("ai-response");
    expect(result.guard.state).toBe("protection");
    expect(result.guard.disablePremiumModel).toBe(true);
    expect(result.modelTierUsed).toBe("low-cost");
  });

  it("uses high tier when guard is healthy", async () => {
    const callModel = jest.fn(async (input: ChatModelInput) => ({
      answer: `served with ${input.modelTier}`,
      confidence: 0.9,
    }));
    const service = createChatAssistantService({
      getUsageSnapshot: async () => createUsage(20, 200),
      retrieveContext: async ({ tenantId }) => makeContext(tenantId),
      callModel,
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
    });

    const result = await service.respond(makeInput());

    expect(callModel).toHaveBeenCalledWith(expect.objectContaining({ modelTier: "high" }));
    expect(result.mode).toBe("ai-response");
    expect(result.guard.state).toBe("healthy");
    expect(result.modelTierUsed).toBe("high");
    expect(result.escalationReason).toBeNull();
  });

  it("emits warning telemetry when usage crosses warning threshold", async () => {
    const logTelemetryEvent = jest.fn();
    const logAlert = jest.fn();
    const service = createChatAssistantService({
      getUsageSnapshot: async () => createUsage(SUPPORT_FEATURE_CAP * 0.75, 200),
      retrieveContext: async ({ tenantId }) => makeContext(tenantId),
      callModel: async () => ({ answer: "ok", confidence: 0.8 }),
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
      logTelemetryEvent,
      logAlert,
    });

    const result = await service.respond(makeInput());

    expect(result.guard.state).toBe("warning");
    expect(logTelemetryEvent).toHaveBeenCalledTimes(1);
    expect(logAlert).toHaveBeenCalledTimes(1);
    expect(logAlert.mock.calls[0][0].level).not.toBe("none");
  });
});

describe("chat assistant service safety + escalation", () => {
  it("escalates when safety filter rejects model output", async () => {
    const service = createChatAssistantService({
      getUsageSnapshot: async () => createUsage(10, 100),
      retrieveContext: async ({ tenantId }) => makeContext(tenantId),
      callModel: async () => ({ answer: "unsafe content", confidence: 0.95 }),
      applySafetyFilter: () => ({ safe: false, reasons: ["pii"] }),
    });

    const result = await service.respond(makeInput());

    expect(result.mode).toBe("human-escalation");
    expect(result.escalationReason).toBe("unsafe-output");
    expect(result.providerCalled).toBe(true);
  });

  it("escalates when confidence is below threshold", async () => {
    const service = createChatAssistantService({
      getUsageSnapshot: async () => createUsage(10, 100),
      retrieveContext: async ({ tenantId }) => makeContext(tenantId),
      callModel: async () => ({ answer: "maybe", confidence: 0.4 }),
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
    });

    const result = await service.respond(makeInput());

    expect(result.mode).toBe("human-escalation");
    expect(result.escalationReason).toBe("low-confidence");
    expect(result.confidence).toBe(0.4);
    expect(DEFAULT_CHAT_CONFIDENCE_THRESHOLD).toBeGreaterThan(0.4);
  });

  it("rejects context retrieved for a different tenant (isolation guard)", async () => {
    const callModel = jest.fn();
    const service = createChatAssistantService({
      getUsageSnapshot: async () => createUsage(10, 100),
      retrieveContext: async () => makeContext("OTHER-TENANT"),
      callModel,
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
    });

    const result = await service.respond(makeInput({ tenantId: "tenantA" }));

    expect(callModel).not.toHaveBeenCalled();
    expect(result.mode).toBe("human-escalation");
    expect(result.escalationReason).toBe("context-isolation-violation");
  });

  it("escalates with model-error when context retrieval throws", async () => {
    const service = createChatAssistantService({
      getUsageSnapshot: async () => createUsage(10, 100),
      retrieveContext: async () => {
        throw new Error("retrieval down");
      },
      callModel: jest.fn(),
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
    });

    const result = await service.respond(makeInput());

    expect(result.mode).toBe("human-escalation");
    expect(result.escalationReason).toBe("model-error");
    expect(result.providerCalled).toBe(false);
  });

  it("escalates with model-error when callModel throws", async () => {
    const service = createChatAssistantService({
      getUsageSnapshot: async () => createUsage(10, 100),
      retrieveContext: async ({ tenantId }) => makeContext(tenantId),
      callModel: async () => {
        throw new Error("provider 503");
      },
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
    });

    const result = await service.respond(makeInput());

    expect(result.mode).toBe("human-escalation");
    expect(result.escalationReason).toBe("model-error");
    expect(result.providerCalled).toBe(true);
  });

  it("respects a custom confidence threshold from deps", async () => {
    const service = createChatAssistantService({
      getUsageSnapshot: async () => createUsage(10, 100),
      retrieveContext: async ({ tenantId }) => makeContext(tenantId),
      callModel: async () => ({ answer: "ok", confidence: 0.65 }),
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
      confidenceThreshold: 0.8,
    });

    const result = await service.respond(makeInput());

    expect(result.mode).toBe("human-escalation");
    expect(result.escalationReason).toBe("low-confidence");
  });

  it("invokes guard decision logger on every call", async () => {
    const logGuardDecision = jest.fn();
    const service = createChatAssistantService({
      getUsageSnapshot: async () => createUsage(10, 100),
      retrieveContext: async ({ tenantId }) => makeContext(tenantId),
      callModel: async () => ({ answer: "ok", confidence: 0.9 }),
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
      logGuardDecision,
    });

    await service.respond(makeInput());

    expect(logGuardDecision).toHaveBeenCalledTimes(1);
    expect(logGuardDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: "support-triage",
        tenantId: "tenantA",
        monthKey: "2026-04",
      })
    );
  });
});
