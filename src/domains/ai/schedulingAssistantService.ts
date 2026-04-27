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

const FEATURE_KEY = "scheduling-optimization" as const;

export type SchedulingTier = "low-cost" | "high";
export type SchedulingMode = "ai-augmented" | "deterministic-fallback";

export type StaffAvailability = {
  staffId: string;
  // ISO day-of-week constraints (0=Sunday). Slots must fall within `workWindows`.
  workWindows: ReadonlyArray<{ startMinutes: number; endMinutes: number }>;
  // Existing bookings on the requested date; slot proposals must not collide.
  bookings: ReadonlyArray<{ startMinutes: number; endMinutes: number }>;
};

export type CandidateSlot = {
  staffId: string;
  startMinutes: number;
  endMinutes: number;
};

export type ClientPreference = {
  preferredStaffIds?: ReadonlyArray<string>;
  preferredHourBands?: ReadonlyArray<"morning" | "afternoon" | "evening">;
};

export type SchedulingSuggestion = {
  slot: CandidateSlot;
  score: number; // 0..1, higher = better
  reasonCodes: ReadonlyArray<
    "preferred-staff" | "preferred-hour-band" | "tight-fit" | "low-utilization-risk" | "ai-personalized"
  >;
};

export type SchedulingInput = {
  tenantId: string;
  monthKey: string;
  serviceDurationMinutes: number;
  businessHours: { startMinutes: number; endMinutes: number };
  staff: ReadonlyArray<StaffAvailability>;
  clientPreferences?: ClientPreference;
  topN?: number;
};

export type SchedulingModelInput = {
  tenantId: string;
  modelTier: SchedulingTier;
  candidates: ReadonlyArray<CandidateSlot>;
};

export type SchedulingModelOutput = {
  ranked: ReadonlyArray<{ staffId: string; startMinutes: number; score: number }>;
};

export type SchedulingResult = {
  mode: SchedulingMode;
  suggestions: ReadonlyArray<SchedulingSuggestion>;
  guard: AiBudgetGuardDecision;
  modelTierUsed: SchedulingTier | null;
  providerCalled: boolean;
};

export type SchedulingAssistantDependencies = {
  getUsageSnapshot: (monthKey: string) => Promise<AiBudgetUsageSnapshot>;
  callModel?: (input: SchedulingModelInput) => Promise<SchedulingModelOutput>;
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

const HOUR_BAND_RANGES: Record<"morning" | "afternoon" | "evening", { startMinutes: number; endMinutes: number }> = {
  morning: { startMinutes: 6 * 60, endMinutes: 12 * 60 },
  afternoon: { startMinutes: 12 * 60, endMinutes: 17 * 60 },
  evening: { startMinutes: 17 * 60, endMinutes: 22 * 60 },
};

/**
 * Pure constraint-safe candidate generator. Enumerates 15-minute slot starts
 * within business hours that:
 *   - fall inside a staff `workWindow`,
 *   - allow `serviceDurationMinutes` without exceeding the work window,
 *   - do NOT overlap any existing booking for that staff member.
 *
 * Returns the full set; ranking is a separate concern.
 */
export function enumerateConstraintSafeSlots(
  input: Pick<SchedulingInput, "serviceDurationMinutes" | "businessHours" | "staff">
): ReadonlyArray<CandidateSlot> {
  const out: CandidateSlot[] = [];
  const step = 15;
  for (const staff of input.staff) {
    for (const w of staff.workWindows) {
      const winStart = Math.max(w.startMinutes, input.businessHours.startMinutes);
      const winEnd = Math.min(w.endMinutes, input.businessHours.endMinutes);
      for (let s = winStart; s + input.serviceDurationMinutes <= winEnd; s += step) {
        const e = s + input.serviceDurationMinutes;
        const collides = staff.bookings.some((b) => s < b.endMinutes && e > b.startMinutes);
        if (!collides) {
          out.push({ staffId: staff.staffId, startMinutes: s, endMinutes: e });
        }
      }
    }
  }
  return out;
}

export function rankSlotsHeuristically(
  candidates: ReadonlyArray<CandidateSlot>,
  prefs: ClientPreference | undefined,
  topN: number
): ReadonlyArray<SchedulingSuggestion> {
  const preferredStaff = new Set(prefs?.preferredStaffIds ?? []);
  const preferredBands = new Set(prefs?.preferredHourBands ?? []);

  return [...candidates]
    .map((slot): SchedulingSuggestion => {
      const reasonCodes: SchedulingSuggestion["reasonCodes"][number][] = [];
      let score = 0.4;
      if (preferredStaff.has(slot.staffId)) {
        score += 0.3;
        reasonCodes.push("preferred-staff");
      }
      const band = (Object.keys(HOUR_BAND_RANGES) as Array<keyof typeof HOUR_BAND_RANGES>).find((k) => {
        const r = HOUR_BAND_RANGES[k];
        return slot.startMinutes >= r.startMinutes && slot.startMinutes < r.endMinutes;
      });
      if (band && preferredBands.has(band)) {
        score += 0.2;
        reasonCodes.push("preferred-hour-band");
      }
      if (reasonCodes.length === 0) {
        reasonCodes.push("low-utilization-risk");
      }
      return { slot, score: Math.min(1, score), reasonCodes };
    })
    .sort((a, b) => b.score - a.score || a.slot.startMinutes - b.slot.startMinutes)
    .slice(0, topN);
}

export function createSchedulingAssistantService(deps: SchedulingAssistantDependencies) {
  const budgetConfig = deps.budgetConfig ?? defaultAiBudgetGuardConfig;

  function emitObservability(input: {
    tenantId: string;
    usage: AiBudgetUsageSnapshot;
    guard: AiBudgetGuardDecision;
    providerCalled: boolean;
    modelTierUsed: SchedulingTier | null;
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

  async function suggest(input: SchedulingInput): Promise<SchedulingResult> {
    const topN = input.topN ?? 3;
    const candidates = enumerateConstraintSafeSlots(input);
    const heuristic = rankSlotsHeuristically(candidates, input.clientPreferences, topN);

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

    if (!guard.allowed || !deps.callModel || candidates.length === 0) {
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: false,
        modelTierUsed: null,
      });
      return {
        mode: "deterministic-fallback",
        suggestions: heuristic,
        guard,
        modelTierUsed: null,
        providerCalled: false,
      };
    }

    const modelTier: SchedulingTier = guard.disablePremiumModel ? "low-cost" : "high";

    try {
      const modelResult = await deps.callModel({
        tenantId: input.tenantId,
        modelTier,
        candidates,
      });

      // Re-validate model output against the constraint-safe set (defence in depth).
      const safeKeys = new Set(candidates.map((c) => `${c.staffId}|${c.startMinutes}`));
      const merged: SchedulingSuggestion[] = modelResult.ranked
        .filter((r) => safeKeys.has(`${r.staffId}|${r.startMinutes}`))
        .slice(0, topN)
        .map((r) => {
          const slot = candidates.find(
            (c) => c.staffId === r.staffId && c.startMinutes === r.startMinutes
          )!;
          return { slot, score: r.score, reasonCodes: ["ai-personalized"] };
        });

      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: true,
        modelTierUsed: modelTier,
      });

      if (merged.length === 0) {
        return {
          mode: "deterministic-fallback",
          suggestions: heuristic,
          guard,
          modelTierUsed: modelTier,
          providerCalled: true,
        };
      }

      return {
        mode: "ai-augmented",
        suggestions: merged,
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
        mode: "deterministic-fallback",
        suggestions: heuristic,
        guard,
        modelTierUsed: modelTier,
        providerCalled: true,
      };
    }
  }

  return { suggest };
}
