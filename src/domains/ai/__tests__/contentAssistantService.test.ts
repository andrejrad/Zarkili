import {
  buildTemplateDraft,
  createContentAssistantService,
  type ContentBriefInput,
  type ContentModelInput,
  type ContentModelOutput,
} from "../contentAssistantService";

const FEATURE_CAP = 120; // content-creation

function createUsage(spend: number, global: number) {
  return {
    monthKey: "2026-04",
    globalSpendUsd: global,
    featureSpendUsd: { "content-creation": spend },
  };
}

const brief: ContentBriefInput = {
  tenantId: "tenantA",
  monthKey: "2026-04",
  channel: "email",
  tone: "friendly",
  purpose: "Win-back returning clients absent for 60 days",
  approvalMode: "human-approval",
};

describe("buildTemplateDraft", () => {
  it("emits subject for email and applies tone prefix", () => {
    const draft = buildTemplateDraft(brief);
    expect(draft.channel).toBe("email");
    expect(draft.subject).not.toBeNull();
    expect(draft.body.startsWith("Hi! ")).toBe(true);
    expect(draft.status).toBe("needs-review");
    expect(draft.reasonCodes).toContain("template-fallback");
    expect(draft.reasonCodes).toContain("tone-applied");
  });

  it("omits subject for non-email channels", () => {
    const draft = buildTemplateDraft({ ...brief, channel: "sms" });
    expect(draft.subject).toBeNull();
  });
});

describe("content assistant service", () => {
  it("returns template-fallback when cap is exhausted (no provider call)", async () => {
    const callModel = jest.fn<Promise<ContentModelOutput>, [ContentModelInput]>();
    const service = createContentAssistantService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP, 200),
      callModel,
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
    });
    const result = await service.generate(brief);
    expect(callModel).not.toHaveBeenCalled();
    expect(result.mode).toBe("template-fallback");
    expect(result.draft.status).toBe("needs-review");
    expect(result.guard.state).toBe("exhausted");
  });

  it("downshifts to low-cost in protection and emits ai-generated draft", async () => {
    const service = createContentAssistantService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP * 0.92, 200),
      callModel: async (input) => ({ subject: "Subject!", body: `tier=${input.modelTier}` }),
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
    });
    const result = await service.generate(brief);
    expect(result.mode).toBe("ai-generated");
    expect(result.draft.body).toBe("tier=low-cost");
    expect(result.draft.subject).toBe("Subject!");
    expect(result.draft.status).toBe("needs-review");
  });

  it("falls back to template when safety filter rejects model output", async () => {
    const service = createContentAssistantService({
      getUsageSnapshot: async () => createUsage(20, 100),
      callModel: async () => ({ subject: "S", body: "spammy" }),
      applySafetyFilter: () => ({ safe: false, reasons: ["spam"] }),
    });
    const result = await service.generate(brief);
    expect(result.mode).toBe("template-fallback");
    expect(result.providerCalled).toBe(true);
    expect(result.draft.status).toBe("needs-review");
  });

  it("falls back to template on model error", async () => {
    const service = createContentAssistantService({
      getUsageSnapshot: async () => createUsage(20, 100),
      callModel: async () => {
        throw new Error("503");
      },
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
    });
    const result = await service.generate(brief);
    expect(result.mode).toBe("template-fallback");
    expect(result.providerCalled).toBe(true);
  });

  it("rejects approvalMode other than human-approval", async () => {
    const service = createContentAssistantService({
      getUsageSnapshot: async () => createUsage(20, 100),
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
    });
    await expect(
      service.generate({ ...brief, approvalMode: "auto-send" as unknown as "human-approval" })
    ).rejects.toThrow();
  });

  it("never auto-sends — every output is needs-review", async () => {
    const service = createContentAssistantService({
      getUsageSnapshot: async () => createUsage(20, 100),
      callModel: async () => ({ subject: "ok", body: "fine" }),
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
    });
    const result = await service.generate(brief);
    expect(result.draft.status).toBe("needs-review");
  });

  it("emits warning telemetry when usage crosses warning threshold", async () => {
    const logTelemetryEvent = jest.fn();
    const logAlert = jest.fn();
    const service = createContentAssistantService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP * 0.75, 200),
      callModel: async () => ({ body: "ok" }),
      applySafetyFilter: () => ({ safe: true, reasons: [] }),
      logTelemetryEvent,
      logAlert,
    });
    const result = await service.generate(brief);
    expect(result.guard.state).toBe("warning");
    expect(logTelemetryEvent).toHaveBeenCalledTimes(1);
    expect(logAlert).toHaveBeenCalledTimes(1);
  });
});
