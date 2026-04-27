import {
  createSchedulingAssistantService,
  enumerateConstraintSafeSlots,
  rankSlotsHeuristically,
  type SchedulingInput,
  type SchedulingModelInput,
  type SchedulingModelOutput,
  type StaffAvailability,
} from "../schedulingAssistantService";

const FEATURE_CAP = 180; // scheduling-optimization

function createUsage(spend: number, global: number) {
  return {
    monthKey: "2026-04",
    globalSpendUsd: global,
    featureSpendUsd: { "scheduling-optimization": spend },
  };
}

const staffA: StaffAvailability = {
  staffId: "S1",
  workWindows: [{ startMinutes: 9 * 60, endMinutes: 17 * 60 }],
  bookings: [{ startMinutes: 10 * 60, endMinutes: 11 * 60 }],
};
const staffB: StaffAvailability = {
  staffId: "S2",
  workWindows: [{ startMinutes: 10 * 60, endMinutes: 14 * 60 }],
  bookings: [],
};

const baseInput: SchedulingInput = {
  tenantId: "tenantA",
  monthKey: "2026-04",
  serviceDurationMinutes: 60,
  businessHours: { startMinutes: 9 * 60, endMinutes: 18 * 60 },
  staff: [staffA, staffB],
  topN: 3,
};

describe("enumerateConstraintSafeSlots", () => {
  it("excludes overlap with existing bookings and enforces work windows", () => {
    const slots = enumerateConstraintSafeSlots(baseInput);
    // Must not propose a slot overlapping S1's 10:00-11:00 booking.
    const collidesWithS1 = slots.some(
      (s) => s.staffId === "S1" && s.startMinutes < 11 * 60 && s.endMinutes > 10 * 60
    );
    expect(collidesWithS1).toBe(false);
    // Every slot must end inside the staff work window.
    expect(
      slots.every((s) => {
        const win = s.staffId === "S1" ? staffA.workWindows[0] : staffB.workWindows[0];
        return s.endMinutes <= win.endMinutes;
      })
    ).toBe(true);
  });

  it("returns no slots if duration exceeds windows", () => {
    const slots = enumerateConstraintSafeSlots({
      serviceDurationMinutes: 600,
      businessHours: baseInput.businessHours,
      staff: baseInput.staff,
    });
    expect(slots.length).toBe(0);
  });
});

describe("rankSlotsHeuristically", () => {
  it("prefers preferred staff and hour bands", () => {
    const candidates = enumerateConstraintSafeSlots(baseInput);
    const ranked = rankSlotsHeuristically(candidates, { preferredStaffIds: ["S2"], preferredHourBands: ["morning"] }, 3);
    expect(ranked[0].slot.staffId).toBe("S2");
    expect(ranked[0].reasonCodes).toContain("preferred-staff");
  });
});

describe("scheduling assistant service budget guard integration", () => {
  it("returns deterministic-fallback when cap is exhausted", async () => {
    const callModel = jest.fn<Promise<SchedulingModelOutput>, [SchedulingModelInput]>();
    const service = createSchedulingAssistantService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP, 200),
      callModel,
    });
    const result = await service.suggest(baseInput);
    expect(callModel).not.toHaveBeenCalled();
    expect(result.mode).toBe("deterministic-fallback");
    expect(result.guard.state).toBe("exhausted");
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("downshifts to low-cost in protection state", async () => {
    const callModel = jest.fn(async (input: SchedulingModelInput) => ({
      ranked: input.candidates.slice(0, 1).map((c) => ({ staffId: c.staffId, startMinutes: c.startMinutes, score: 0.9 })),
    }));
    const service = createSchedulingAssistantService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP * 0.92, 200),
      callModel,
    });
    const result = await service.suggest(baseInput);
    expect(callModel).toHaveBeenCalledWith(expect.objectContaining({ modelTier: "low-cost" }));
    expect(result.mode).toBe("ai-augmented");
  });

  it("rejects model output that proposes unsafe slots (defence in depth)", async () => {
    const callModel = jest.fn(async () => ({
      ranked: [
        { staffId: "GHOST", startMinutes: 9 * 60, score: 0.99 },
        { staffId: "S1", startMinutes: 10 * 60, score: 0.99 }, // overlaps existing booking - not in candidate set
      ],
    }));
    const service = createSchedulingAssistantService({
      getUsageSnapshot: async () => createUsage(20, 100),
      callModel,
    });
    const result = await service.suggest(baseInput);
    // Both unsafe -> empty merged -> fall back to heuristic.
    expect(result.mode).toBe("deterministic-fallback");
    expect(result.providerCalled).toBe(true);
  });

  it("falls back to heuristic on model error", async () => {
    const service = createSchedulingAssistantService({
      getUsageSnapshot: async () => createUsage(20, 100),
      callModel: async () => {
        throw new Error("provider 503");
      },
    });
    const result = await service.suggest(baseInput);
    expect(result.mode).toBe("deterministic-fallback");
    expect(result.providerCalled).toBe(true);
  });

  it("emits warning telemetry when usage crosses warning threshold", async () => {
    const logTelemetryEvent = jest.fn();
    const logAlert = jest.fn();
    const service = createSchedulingAssistantService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP * 0.75, 200),
      callModel: async () => ({ ranked: [] }),
      logTelemetryEvent,
      logAlert,
    });
    const result = await service.suggest(baseInput);
    expect(result.guard.state).toBe("warning");
    expect(logTelemetryEvent).toHaveBeenCalledTimes(1);
    expect(logAlert).toHaveBeenCalledTimes(1);
  });
});
