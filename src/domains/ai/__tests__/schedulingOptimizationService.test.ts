import {
  analyzeDayPlan,
  buildHeuristicRescheduleSuggestions,
  createSchedulingOptimizationService,
  type CancellationEvent,
  type DayPlanInput,
  type OptimizationModelInput,
  type OptimizationModelOutput,
} from "../schedulingOptimizationService";
import type { StaffAvailability } from "../schedulingAssistantService";

const FEATURE_CAP = 180; // scheduling-optimization

function createUsage(spend: number, global: number) {
  return {
    monthKey: "2026-04",
    globalSpendUsd: global,
    featureSpendUsd: { "scheduling-optimization": spend },
  };
}

const lowLoad: DayPlanInput = {
  staffId: "S1",
  workWindow: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
  bookings: [{ startMinutes: 10 * 60, endMinutes: 11 * 60 }],
};

const highLoad: DayPlanInput = {
  staffId: "S2",
  workWindow: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
  bookings: [
    { startMinutes: 9 * 60, endMinutes: 10 * 60 },
    { startMinutes: 10 * 60 + 5, endMinutes: 11 * 60 + 5 },
    { startMinutes: 11 * 60 + 10, endMinutes: 12 * 60 + 10 },
    { startMinutes: 12 * 60 + 15, endMinutes: 14 * 60 + 15 },
    { startMinutes: 14 * 60 + 20, endMinutes: 16 * 60 + 20 },
  ],
};

describe("analyzeDayPlan", () => {
  it("flags low utilization and recommends small buffer", () => {
    const insight = analyzeDayPlan(lowLoad);
    expect(insight.utilizationRatio).toBeLessThan(0.4);
    expect(insight.flags).toContain("low-utilization");
    expect(insight.suggestedBufferMinutes).toBe(5);
  });

  it("flags high utilization + tight buffers and recommends larger buffer", () => {
    const insight = analyzeDayPlan(highLoad);
    expect(insight.utilizationRatio).toBeGreaterThan(0.85);
    expect(insight.flags).toContain("high-utilization-overbooking-risk");
    expect(insight.flags).toContain("tight-buffers");
    expect(insight.suggestedBufferMinutes).toBe(15);
  });
});

describe("buildHeuristicRescheduleSuggestions", () => {
  const dayStaff: ReadonlyArray<StaffAvailability> = [
    {
      staffId: "S1",
      workWindows: [{ startMinutes: 9 * 60, endMinutes: 17 * 60 }],
      bookings: [{ startMinutes: 14 * 60, endMinutes: 15 * 60 }],
    },
    {
      staffId: "S2",
      workWindows: [{ startMinutes: 9 * 60, endMinutes: 17 * 60 }],
      bookings: [],
    },
  ];

  const event: CancellationEvent = {
    cancelledStaffId: "S1",
    cancelledStartMinutes: 11 * 60,
    cancelledEndMinutes: 12 * 60,
  };

  it("prefers same-staff slots and minimises start deviation", () => {
    const suggestions = buildHeuristicRescheduleSuggestions(
      event,
      dayStaff,
      60,
      { startMinutes: 9 * 60, endMinutes: 17 * 60 },
      3
    );
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].slot.staffId).toBe("S1");
    expect(suggestions[0].reasonCodes).toContain("same-staff");
    // Closest in time among S1 candidates.
    const firstDev = suggestions[0].startDeviationMinutes;
    expect(firstDev).toBeGreaterThanOrEqual(0);
  });

  it("never proposes a slot that collides with existing bookings", () => {
    const suggestions = buildHeuristicRescheduleSuggestions(
      event,
      dayStaff,
      60,
      { startMinutes: 9 * 60, endMinutes: 17 * 60 },
      10
    );
    const collide = suggestions.some(
      (s) =>
        s.slot.staffId === "S1" &&
        s.slot.startMinutes < 15 * 60 &&
        s.slot.endMinutes > 14 * 60
    );
    expect(collide).toBe(false);
  });
});

describe("scheduling optimization service", () => {
  const dayStaff: ReadonlyArray<StaffAvailability> = [
    {
      staffId: "S1",
      workWindows: [{ startMinutes: 9 * 60, endMinutes: 17 * 60 }],
      bookings: [{ startMinutes: 14 * 60, endMinutes: 15 * 60 }],
    },
  ];
  const event: CancellationEvent = {
    cancelledStaffId: "S1",
    cancelledStartMinutes: 11 * 60,
    cancelledEndMinutes: 12 * 60,
  };

  it("returns heuristic-fallback when cap is exhausted (no provider call)", async () => {
    const callModel = jest.fn<Promise<OptimizationModelOutput>, [OptimizationModelInput]>();
    const service = createSchedulingOptimizationService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP, 200),
      callModel,
    });
    const result = await service.optimizeDay({
      tenantId: "tenantA",
      monthKey: "2026-04",
      staffPlans: [lowLoad],
      reschedule: {
        event,
        serviceDurationMinutes: 60,
        businessHours: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
        dayStaff,
      },
    });
    expect(callModel).not.toHaveBeenCalled();
    expect(result.mode).toBe("heuristic-fallback");
    expect(result.insights).toHaveLength(1);
    expect(result.rescheduleSuggestions.length).toBeGreaterThan(0);
  });

  it("downshifts to low-cost in protection and re-validates model picks", async () => {
    const service = createSchedulingOptimizationService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP * 0.92, 200),
      callModel: async (input: OptimizationModelInput) => ({
        rerankedCandidates: input.candidates.slice(0, 1).map((c) => ({ staffId: c.staffId, startMinutes: c.startMinutes })),
      }),
    });
    const result = await service.optimizeDay({
      tenantId: "tenantA",
      monthKey: "2026-04",
      staffPlans: [lowLoad],
      reschedule: {
        event,
        serviceDurationMinutes: 60,
        businessHours: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
        dayStaff,
      },
    });
    expect(result.mode).toBe("ai-augmented");
    expect(result.modelTierUsed).toBe("low-cost");
    expect(result.rescheduleSuggestions[0].reasonCodes).toContain("ai-personalized");
  });

  it("rejects model picks not in the constraint-safe candidate set", async () => {
    const service = createSchedulingOptimizationService({
      getUsageSnapshot: async () => createUsage(20, 100),
      callModel: async () => ({ rerankedCandidates: [{ staffId: "GHOST", startMinutes: 9 * 60 }] }),
    });
    const result = await service.optimizeDay({
      tenantId: "tenantA",
      monthKey: "2026-04",
      staffPlans: [lowLoad],
      reschedule: {
        event,
        serviceDurationMinutes: 60,
        businessHours: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
        dayStaff,
      },
    });
    expect(result.mode).toBe("heuristic-fallback");
    expect(result.providerCalled).toBe(true);
  });

  it("falls back to heuristic on model error", async () => {
    const service = createSchedulingOptimizationService({
      getUsageSnapshot: async () => createUsage(20, 100),
      callModel: async () => {
        throw new Error("provider 503");
      },
    });
    const result = await service.optimizeDay({
      tenantId: "tenantA",
      monthKey: "2026-04",
      staffPlans: [lowLoad],
      reschedule: {
        event,
        serviceDurationMinutes: 60,
        businessHours: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
        dayStaff,
      },
    });
    expect(result.mode).toBe("heuristic-fallback");
    expect(result.providerCalled).toBe(true);
  });

  it("returns insights even when no reschedule sub-task is provided", async () => {
    const service = createSchedulingOptimizationService({
      getUsageSnapshot: async () => createUsage(20, 100),
    });
    const result = await service.optimizeDay({
      tenantId: "tenantA",
      monthKey: "2026-04",
      staffPlans: [lowLoad, highLoad],
    });
    expect(result.insights).toHaveLength(2);
    expect(result.rescheduleSuggestions).toHaveLength(0);
    expect(result.mode).toBe("heuristic-fallback");
  });

  it("emits warning telemetry when usage crosses warning threshold", async () => {
    const logTelemetryEvent = jest.fn();
    const logAlert = jest.fn();
    const service = createSchedulingOptimizationService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP * 0.75, 200),
      callModel: async (input) => ({
        rerankedCandidates: input.candidates.slice(0, 1).map((c) => ({ staffId: c.staffId, startMinutes: c.startMinutes })),
      }),
      logTelemetryEvent,
      logAlert,
    });
    const result = await service.optimizeDay({
      tenantId: "tenantA",
      monthKey: "2026-04",
      staffPlans: [lowLoad],
      reschedule: {
        event,
        serviceDurationMinutes: 60,
        businessHours: { startMinutes: 9 * 60, endMinutes: 17 * 60 },
        dayStaff,
      },
    });
    expect(result.guard.state).toBe("warning");
    expect(logTelemetryEvent).toHaveBeenCalledTimes(1);
    expect(logAlert).toHaveBeenCalledTimes(1);
  });
});
