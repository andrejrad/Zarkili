import {
  createSupportTriageService,
  SUPPORT_TRIAGE_FALLBACK_MESSAGE,
  type SupportTriageModelInput,
} from "../supportTriageService";
import { defaultAiBudgetGuardConfig } from "../../../shared/ai";

function createUsage(featureSpendUsd: number, globalSpendUsd: number) {
  return {
    monthKey: "2026-04",
    globalSpendUsd,
    featureSpendUsd: {
      "support-triage": featureSpendUsd,
    },
  };
}

describe("support triage service budget guard integration", () => {
  it("bypasses provider and returns deterministic fallback when support-triage cap is exhausted", async () => {
    const callModel = jest.fn<Promise<{ answer: string; confidence: number; escalate: boolean }>, [SupportTriageModelInput]>();
    const service = createSupportTriageService({
      getUsageSnapshot: async () => createUsage(120, 300),
      callModel,
    });

    const result = await service.triage({
      tenantId: "tenantA",
      monthKey: "2026-04",
      message: "Need help with my booking",
    });

    expect(callModel).not.toHaveBeenCalled();
    expect(result.providerCalled).toBe(false);
    expect(result.mode).toBe("human-escalation");
    expect(result.message).toBe(SUPPORT_TRIAGE_FALLBACK_MESSAGE);
    expect(result.guard.state).toBe("exhausted");
    expect(result.guard.scope).toBe("feature");
  });

  it("keeps provider call and disables premium tier in protection state", async () => {
    const callModel = jest.fn(async (input: SupportTriageModelInput) => ({
      answer: `handled with ${input.modelTier}`,
      confidence: 0.82,
      escalate: false,
    }));
    const service = createSupportTriageService({
      getUsageSnapshot: async () => createUsage(109, 400),
      callModel,
    });

    const result = await service.triage({
      tenantId: "tenantA",
      monthKey: "2026-04",
      message: "How do I change my appointment?",
    });

    expect(callModel).toHaveBeenCalledTimes(1);
    expect(callModel).toHaveBeenCalledWith(
      expect.objectContaining({
        modelTier: "low-cost",
      })
    );
    expect(result.mode).toBe("ai-response");
    expect(result.guard.state).toBe("protection");
    expect(result.guard.disablePremiumModel).toBe(true);
  });

  it("uses high tier when guard is healthy", async () => {
    const callModel = jest.fn(async (input: SupportTriageModelInput) => ({
      answer: `handled with ${input.modelTier}`,
      confidence: 0.9,
      escalate: false,
    }));

    const service = createSupportTriageService({
      getUsageSnapshot: async () => createUsage(20, 200),
      callModel,
    });

    const result = await service.triage({
      tenantId: "tenantA",
      monthKey: "2026-04",
      message: "Can I get availability details?",
    });

    expect(callModel).toHaveBeenCalledWith(
      expect.objectContaining({
        modelTier: "high",
      })
    );
    expect(result.mode).toBe("ai-response");
    expect(result.guard.state).toBe("healthy");
  });

  it("returns deterministic fallback when provider throws", async () => {
    const callModel = jest.fn(async () => {
      throw new Error("provider unavailable");
    });

    const service = createSupportTriageService({
      getUsageSnapshot: async () => createUsage(20, 200),
      callModel,
    });

    const result = await service.triage({
      tenantId: "tenantA",
      monthKey: "2026-04",
      message: "Need urgent support",
    });

    expect(callModel).toHaveBeenCalledTimes(1);
    expect(result.providerCalled).toBe(true);
    expect(result.mode).toBe("human-escalation");
    expect(result.message).toBe(SUPPORT_TRIAGE_FALLBACK_MESSAGE);
  });

  it("returns deterministic fallback when model requests escalation", async () => {
    const callModel = jest.fn(async () => ({
      answer: "Escalating",
      confidence: 0.51,
      escalate: true,
    }));

    const service = createSupportTriageService({
      getUsageSnapshot: async () => createUsage(20, 200),
      callModel,
      budgetConfig: defaultAiBudgetGuardConfig,
    });

    const result = await service.triage({
      tenantId: "tenantA",
      monthKey: "2026-04",
      message: "I want to delete my account",
    });

    expect(callModel).toHaveBeenCalledTimes(1);
    expect(result.mode).toBe("human-escalation");
    expect(result.message).toBe(SUPPORT_TRIAGE_FALLBACK_MESSAGE);
  });
});
