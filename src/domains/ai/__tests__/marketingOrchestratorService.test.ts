import {
  createMarketingOrchestratorService,
  evaluateRulesEngine,
  isInQuietHours,
  type CampaignDefinition,
  type DispatchContextItem,
  type EligibilityCandidate,
  type EvaluateBatchInput,
  type PersonalizationModelInput,
  type PersonalizationModelOutput,
} from "../marketingOrchestratorService";

const FEATURE_CAP = 180; // marketing-orchestration

function createUsage(spend: number, global: number) {
  return {
    monthKey: "2026-04",
    globalSpendUsd: global,
    featureSpendUsd: { "marketing-orchestration": spend },
  };
}

const winBack: CampaignDefinition = {
  campaignId: "win-back",
  triggerType: "behavior-based",
  channel: "email",
  autoSendEnabled: false,
  minIntervalHours: 24 * 7,
};

const reminder: CampaignDefinition = {
  campaignId: "reminder",
  triggerType: "time-based",
  channel: "sms",
  autoSendEnabled: true,
  minIntervalHours: 12,
};

function ctx(clientId: string, opts: Partial<DispatchContextItem> = {}): DispatchContextItem {
  return {
    clientId,
    lastDispatchedAtMsByCampaign: {},
    consent: { channels: { email: true, sms: true } },
    ...opts,
  };
}

function batch(overrides: Partial<EvaluateBatchInput> = {}): EvaluateBatchInput {
  return {
    tenantId: "tenantA",
    monthKey: "2026-04",
    nowMs: 1_700_000_000_000,
    nowMinutesOfDay: 14 * 60,
    campaigns: [winBack, reminder],
    candidates: [{ clientId: "C1", campaignId: "win-back", triggerSatisfied: true }],
    context: [ctx("C1")],
    ...overrides,
  };
}

describe("isInQuietHours", () => {
  it("handles non-wrapping ranges", () => {
    expect(isInQuietHours(60, { startMinutes: 0, endMinutes: 120 })).toBe(true);
    expect(isInQuietHours(120, { startMinutes: 0, endMinutes: 120 })).toBe(false);
  });
  it("handles overnight (wrap-midnight) ranges", () => {
    const overnight = { startMinutes: 22 * 60, endMinutes: 7 * 60 };
    expect(isInQuietHours(23 * 60, overnight)).toBe(true);
    expect(isInQuietHours(2 * 60, overnight)).toBe(true);
    expect(isInQuietHours(8 * 60, overnight)).toBe(false);
  });
  it("returns false when policy is undefined or zero-width", () => {
    expect(isInQuietHours(60, undefined)).toBe(false);
    expect(isInQuietHours(60, { startMinutes: 60, endMinutes: 60 })).toBe(false);
  });
});

describe("evaluateRulesEngine", () => {
  it("blocks when consent missing for the channel", () => {
    const decisions = evaluateRulesEngine(
      batch({
        context: [{ clientId: "C1", lastDispatchedAtMsByCampaign: {}, consent: { channels: { email: false } } }],
      })
    );
    expect(decisions[0].status).toBe("blocked-no-consent");
  });

  it("blocks when trigger not satisfied", () => {
    const decisions = evaluateRulesEngine(
      batch({ candidates: [{ clientId: "C1", campaignId: "win-back", triggerSatisfied: false }] })
    );
    expect(decisions[0].status).toBe("blocked-trigger-not-satisfied");
  });

  it("blocks during quiet hours", () => {
    const decisions = evaluateRulesEngine(
      batch({ nowMinutesOfDay: 23 * 60, quietHours: { startMinutes: 22 * 60, endMinutes: 7 * 60 } })
    );
    expect(decisions[0].status).toBe("blocked-quiet-hours");
  });

  it("blocks under per-campaign frequency cap", () => {
    const decisions = evaluateRulesEngine(
      batch({
        context: [
          ctx("C1", {
            lastDispatchedAtMsByCampaign: { "win-back": batch().nowMs - 1 * 3_600_000 },
          }),
        ],
      })
    );
    expect(decisions[0].status).toBe("blocked-frequency-cap");
  });

  it("dedupes within batch", () => {
    const decisions = evaluateRulesEngine(
      batch({
        candidates: [
          { clientId: "C1", campaignId: "win-back", triggerSatisfied: true },
          { clientId: "C1", campaignId: "win-back", triggerSatisfied: true },
        ],
      })
    );
    expect(decisions[1].status).toBe("blocked-duplicate-in-batch");
  });

  it("queues needs-review when campaign auto-send disabled", () => {
    const decisions = evaluateRulesEngine(batch());
    expect(decisions[0].status).toBe("queued-needs-review");
  });

  it("queues auto-send only when campaign opts in AND no rule blocks", () => {
    const decisions = evaluateRulesEngine(
      batch({
        candidates: [{ clientId: "C1", campaignId: "reminder", triggerSatisfied: true }],
      })
    );
    expect(decisions[0].status).toBe("queued-auto-send");
  });
});

describe("marketing orchestrator service", () => {
  it("returns rules-only mode when cap is exhausted (no provider call)", async () => {
    const callPersonalizationModel = jest.fn<Promise<PersonalizationModelOutput>, [PersonalizationModelInput]>();
    const service = createMarketingOrchestratorService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP, 300),
      callPersonalizationModel,
    });
    const result = await service.evaluateBatch(batch());
    expect(callPersonalizationModel).not.toHaveBeenCalled();
    expect(result.mode).toBe("rules-only");
    expect(result.guard.state).toBe("exhausted");
    // Rule decisions still computed and returned.
    expect(result.decisions.length).toBe(1);
  });

  it("downshifts to low-cost in protection and personalises only queued dispatches", async () => {
    const callPersonalizationModel = jest.fn(async (input: PersonalizationModelInput) => ({
      snippet: `for ${input.clientId} via ${input.modelTier}`,
    }));
    const service = createMarketingOrchestratorService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP * 0.92, 300),
      callPersonalizationModel,
    });
    const result = await service.evaluateBatch(
      batch({
        candidates: [
          { clientId: "C1", campaignId: "reminder", triggerSatisfied: true },
          { clientId: "C2", campaignId: "win-back", triggerSatisfied: false },
        ],
        context: [ctx("C1"), ctx("C2")],
      })
    );

    // Only C1's queued dispatch is personalised; C2 is rule-blocked.
    expect(callPersonalizationModel).toHaveBeenCalledTimes(1);
    expect(callPersonalizationModel).toHaveBeenCalledWith(expect.objectContaining({ modelTier: "low-cost", clientId: "C1" }));
    const c1 = result.decisions.find((d) => d.clientId === "C1")!;
    const c2 = result.decisions.find((d) => d.clientId === "C2")!;
    expect(c1.personalization.mode).toBe("ai-personalized");
    expect(c2.personalization.mode).toBe("rules-only");
    expect(c2.status).toBe("blocked-trigger-not-satisfied");
  });

  it("does not personalise when no model dep wired", async () => {
    const service = createMarketingOrchestratorService({
      getUsageSnapshot: async () => createUsage(20, 100),
    });
    const result = await service.evaluateBatch(batch());
    expect(result.mode).toBe("rules-only");
  });

  it("survives per-client model errors with rules-only personalization", async () => {
    const service = createMarketingOrchestratorService({
      getUsageSnapshot: async () => createUsage(20, 100),
      callPersonalizationModel: async () => {
        throw new Error("provider 503");
      },
    });
    const result = await service.evaluateBatch(batch());
    expect(result.mode).toBe("ai-personalized");
    expect(result.providerCalled).toBe(true);
    expect(result.decisions[0].personalization.mode).toBe("rules-only");
  });

  it("emits warning telemetry when usage crosses warning threshold", async () => {
    const logTelemetryEvent = jest.fn();
    const logAlert = jest.fn();
    const service = createMarketingOrchestratorService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP * 0.75, 200),
      callPersonalizationModel: async () => ({ snippet: "ok" }),
      logTelemetryEvent,
      logAlert,
    });
    const result = await service.evaluateBatch(batch());
    expect(result.guard.state).toBe("warning");
    expect(logTelemetryEvent).toHaveBeenCalledTimes(1);
    expect(logAlert).toHaveBeenCalledTimes(1);
  });
});
