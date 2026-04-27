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
import {
  enumerateConstraintSafeSlots,
  type CandidateSlot,
  type StaffAvailability,
} from "./schedulingAssistantService";

const FEATURE_KEY = "scheduling-optimization" as const;

export type OptimizationTier = "low-cost" | "high";
export type OptimizationMode = "ai-augmented" | "heuristic-fallback";

/**
 * Salon-side optimisation surface: looks at projected day load and emits
 * recommendations to staff for buffer management, low-utilisation flags, and
 * overbooking-risk flags. All outputs are observational (no auto-actions).
 */
export type DayPlanInput = {
  staffId: string;
  workWindow: { startMinutes: number; endMinutes: number };
  bookings: ReadonlyArray<{ startMinutes: number; endMinutes: number }>;
};

export type StaffPlanInsight = {
  staffId: string;
  utilizationRatio: number; // 0..1
  flags: ReadonlyArray<"low-utilization" | "high-utilization-overbooking-risk" | "tight-buffers">;
  suggestedBufferMinutes: number; // recommended minimum gap between bookings
};

export function analyzeDayPlan(input: DayPlanInput): StaffPlanInsight {
  const total = Math.max(0, input.workWindow.endMinutes - input.workWindow.startMinutes);
  const booked = input.bookings.reduce((sum, b) => sum + Math.max(0, b.endMinutes - b.startMinutes), 0);
  const ratio = total === 0 ? 0 : Math.min(1, booked / total);

  const sortedByStart = [...input.bookings].sort((a, b) => a.startMinutes - b.startMinutes);
  let minGap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < sortedByStart.length; i++) {
    minGap = Math.min(minGap, sortedByStart[i].startMinutes - sortedByStart[i - 1].endMinutes);
  }

  const flags: StaffPlanInsight["flags"][number][] = [];
  if (ratio < 0.4) flags.push("low-utilization");
  if (ratio > 0.85) flags.push("high-utilization-overbooking-risk");
  if (Number.isFinite(minGap) && minGap < 10) flags.push("tight-buffers");

  // Suggest a minimum buffer scaled by load: heavier load -> larger buffer.
  const suggestedBufferMinutes = ratio > 0.85 ? 15 : ratio > 0.6 ? 10 : 5;
  return { staffId: input.staffId, utilizationRatio: ratio, flags, suggestedBufferMinutes };
}

/**
 * Rescheduling-on-cancellation surface: given the cancelled slot, find the
 * top-N constraint-safe replacement slots (same staff first, fall through to
 * other staff) so an outreach hook can offer them to the next-best candidate.
 */
export type CancellationEvent = {
  cancelledStaffId: string;
  cancelledStartMinutes: number;
  cancelledEndMinutes: number;
};

export type RescheduleSuggestion = {
  slot: CandidateSlot;
  // Smaller deviation = better.
  startDeviationMinutes: number;
  reasonCodes: ReadonlyArray<"same-staff" | "other-staff" | "ai-personalized">;
};

export function buildHeuristicRescheduleSuggestions(
  event: CancellationEvent,
  dayStaff: ReadonlyArray<StaffAvailability>,
  serviceDurationMinutes: number,
  businessHours: { startMinutes: number; endMinutes: number },
  topN: number
): ReadonlyArray<RescheduleSuggestion> {
  const candidates = enumerateConstraintSafeSlots({
    serviceDurationMinutes,
    businessHours,
    staff: dayStaff,
  });

  const ranked: RescheduleSuggestion[] = candidates.map((slot) => {
    const isSameStaff = slot.staffId === event.cancelledStaffId;
    return {
      slot,
      startDeviationMinutes: Math.abs(slot.startMinutes - event.cancelledStartMinutes),
      reasonCodes: [isSameStaff ? "same-staff" : "other-staff"],
    };
  });

  return [...ranked]
    .sort((a, b) => {
      const aSame = a.reasonCodes.includes("same-staff") ? 0 : 1;
      const bSame = b.reasonCodes.includes("same-staff") ? 0 : 1;
      if (aSame !== bSame) return aSame - bSame;
      return a.startDeviationMinutes - b.startDeviationMinutes;
    })
    .slice(0, topN);
}

export type OptimizeDayInput = {
  tenantId: string;
  monthKey: string;
  staffPlans: ReadonlyArray<DayPlanInput>;
  // Optional rescheduling sub-task that runs in the same evaluation.
  reschedule?: {
    event: CancellationEvent;
    serviceDurationMinutes: number;
    businessHours: { startMinutes: number; endMinutes: number };
    dayStaff: ReadonlyArray<StaffAvailability>;
    topN?: number;
  };
};

export type OptimizeDayResult = {
  mode: OptimizationMode;
  insights: ReadonlyArray<StaffPlanInsight>;
  rescheduleSuggestions: ReadonlyArray<RescheduleSuggestion>;
  guard: AiBudgetGuardDecision;
  modelTierUsed: OptimizationTier | null;
  providerCalled: boolean;
};

export type OptimizationModelInput = {
  tenantId: string;
  modelTier: OptimizationTier;
  insights: ReadonlyArray<StaffPlanInsight>;
  candidates: ReadonlyArray<CandidateSlot>;
};

export type OptimizationModelOutput = {
  rerankedCandidates: ReadonlyArray<{ staffId: string; startMinutes: number }>;
};

export type SchedulingOptimizationDependencies = {
  getUsageSnapshot: (monthKey: string) => Promise<AiBudgetUsageSnapshot>;
  callModel?: (input: OptimizationModelInput) => Promise<OptimizationModelOutput>;
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
  // Latency target in ms for AI-augmented path; if exceeded, the next call may
  // be downshifted by the operator. Currently observational — recorded in telemetry only.
  latencyTargetMs?: number;
};

export const DEFAULT_OPTIMIZATION_LATENCY_TARGET_MS = 1500;

export function createSchedulingOptimizationService(deps: SchedulingOptimizationDependencies) {
  const budgetConfig = deps.budgetConfig ?? defaultAiBudgetGuardConfig;

  function emitObservability(input: {
    tenantId: string;
    usage: AiBudgetUsageSnapshot;
    guard: AiBudgetGuardDecision;
    providerCalled: boolean;
    modelTierUsed: OptimizationTier | null;
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

  async function optimizeDay(input: OptimizeDayInput): Promise<OptimizeDayResult> {
    const insights = input.staffPlans.map(analyzeDayPlan);
    const heuristicReschedule = input.reschedule
      ? buildHeuristicRescheduleSuggestions(
          input.reschedule.event,
          input.reschedule.dayStaff,
          input.reschedule.serviceDurationMinutes,
          input.reschedule.businessHours,
          input.reschedule.topN ?? 3
        )
      : [];

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

    if (!guard.allowed || !deps.callModel || !input.reschedule) {
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: false,
        modelTierUsed: null,
      });
      return {
        mode: "heuristic-fallback",
        insights,
        rescheduleSuggestions: heuristicReschedule,
        guard,
        modelTierUsed: null,
        providerCalled: false,
      };
    }

    const modelTier: OptimizationTier = guard.disablePremiumModel ? "low-cost" : "high";
    const candidates = heuristicReschedule.map((s) => s.slot);

    try {
      const r = await deps.callModel({
        tenantId: input.tenantId,
        modelTier,
        insights,
        candidates,
      });

      const safe = new Set(candidates.map((c) => `${c.staffId}|${c.startMinutes}`));
      const merged: RescheduleSuggestion[] = r.rerankedCandidates
        .filter((rc) => safe.has(`${rc.staffId}|${rc.startMinutes}`))
        .map((rc) => {
          const original = heuristicReschedule.find(
            (h) => h.slot.staffId === rc.staffId && h.slot.startMinutes === rc.startMinutes
          )!;
          return {
            slot: original.slot,
            startDeviationMinutes: original.startDeviationMinutes,
            reasonCodes: ["ai-personalized"],
          };
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
          mode: "heuristic-fallback",
          insights,
          rescheduleSuggestions: heuristicReschedule,
          guard,
          modelTierUsed: modelTier,
          providerCalled: true,
        };
      }

      return {
        mode: "ai-augmented",
        insights,
        rescheduleSuggestions: merged,
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
        mode: "heuristic-fallback",
        insights,
        rescheduleSuggestions: heuristicReschedule,
        guard,
        modelTierUsed: modelTier,
        providerCalled: true,
      };
    }
  }

  return { optimizeDay };
}
