import type { Timestamp } from "firebase/firestore";

import {
  ONBOARDING_STEPS,
  buildInitialStepStatuses,
  computeCompletionScore,
  deriveBlockers,
  type OnboardingStep,
  type OnboardingStepStatus,
  type OnboardingTimelineEvent,
  type SalonOnboardingState,
  type WizardStepDraft,
} from "../model";
import type { OnboardingRepository } from "../repository";
import {
  OnboardingPermissionError,
  createOnboardingAdminService,
  type AdminActor,
} from "../adminService";

function ts(seconds = 0): Timestamp {
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}

function makeStubRepo(tenantId = "salon1") {
  const drafts = new Map<OnboardingStep, WizardStepDraft>();
  const timeline: OnboardingTimelineEvent[] = [];
  let state: SalonOnboardingState | null = null;

  function recompute(statuses: Record<OnboardingStep, OnboardingStepStatus>) {
    return {
      stepStatuses: statuses,
      completionScore: computeCompletionScore(statuses),
      blockers: deriveBlockers(statuses),
      canGoLive: deriveBlockers(statuses).length === 0,
    };
  }

  const repo: OnboardingRepository = {
    async getOnboardingState(t) {
      if (t !== tenantId) return null;
      return state;
    },
    async startOnboarding(t) {
      if (state) return state;
      const statuses = buildInitialStepStatuses();
      state = {
        tenantId: t,
        currentStep: ONBOARDING_STEPS[0],
        startedAt: ts(1),
        updatedAt: ts(1),
        ...recompute(statuses),
      };
      return state;
    },
    async advanceStep(t, step, status) {
      if (!state) {
        await repo.startOnboarding(t);
      }
      const statuses = { ...state!.stepStatuses, [step]: status };
      state = {
        ...state!,
        currentStep: state!.currentStep,
        updatedAt: ts((state!.updatedAt as unknown as { seconds: number }).seconds + 1),
        ...recompute(statuses),
      };
      return state;
    },
    async saveOnboardingState(s) {
      state = s;
    },
    async resetOnboarding(t) {
      const statuses = buildInitialStepStatuses();
      state = {
        tenantId: t,
        currentStep: ONBOARDING_STEPS[0],
        startedAt: ts(1),
        updatedAt: ts(1),
        ...recompute(statuses),
      };
    },
    async saveDraft(_t, step, payload) {
      const draft: WizardStepDraft = {
        tenantId: _t,
        step,
        schemaVersion: 1,
        payload,
        updatedAt: ts(2),
      };
      drafts.set(step, draft);
      return draft;
    },
    async getDraft(_t, step) {
      return drafts.get(step) ?? null;
    },
    async listDrafts() {
      return Array.from(drafts.values());
    },
    async appendTimelineEvent(event) {
      if (timeline.some((e) => e.eventId === event.eventId)) {
        throw new Error(`Timeline event ${event.eventId} already exists`);
      }
      const full: OnboardingTimelineEvent = { ...event, createdAt: ts(timeline.length + 10) };
      timeline.push(full);
      return full;
    },
    async listTimeline() {
      return [...timeline].reverse();
    },
  };

  return { repo, getTimeline: () => timeline, getState: () => state };
}

const TENANT = "salon1";
const PLATFORM_ACTOR: AdminActor = { userId: "platform-1", role: "platform_admin" };
const TENANT_OWNER_ACTOR: AdminActor = { userId: "owner-1", role: "tenant_owner" };
const TECH_ACTOR: AdminActor = { userId: "tech-1", role: "technician" };

describe("OnboardingAdminService — extendTrial", () => {
  it("appends a timeline event and invokes trialExtender", async () => {
    const stub = makeStubRepo();
    const calls: Array<[string, number]> = [];
    const svc = createOnboardingAdminService({
      repository: stub.repo,
      trialExtender: async (t, d) => {
        calls.push([t, d]);
      },
    });

    const event = await svc.extendTrial(PLATFORM_ACTOR, TENANT, 7, "VIP customer", "evt-1");

    expect(event.action).toBe("extend_trial");
    expect(event.details).toEqual({ daysAdded: 7 });
    expect(calls).toEqual([[TENANT, 7]]);
    expect(stub.getTimeline()).toHaveLength(1);
  });

  it("works without trialExtender (audit-only)", async () => {
    const stub = makeStubRepo();
    const svc = createOnboardingAdminService({ repository: stub.repo });
    await svc.extendTrial(PLATFORM_ACTOR, TENANT, 3, "extended", "evt-2");
    expect(stub.getTimeline()).toHaveLength(1);
  });

  it("rejects unauthorized actors", async () => {
    const stub = makeStubRepo();
    const svc = createOnboardingAdminService({ repository: stub.repo });
    await expect(
      svc.extendTrial(TECH_ACTOR, TENANT, 7, "nope", "evt-x"),
    ).rejects.toBeInstanceOf(OnboardingPermissionError);
    expect(stub.getTimeline()).toHaveLength(0);
  });

  it("rejects non-positive daysAdded", async () => {
    const stub = makeStubRepo();
    const svc = createOnboardingAdminService({ repository: stub.repo });
    await expect(svc.extendTrial(PLATFORM_ACTOR, TENANT, 0, "r", "evt-y")).rejects.toThrow(
      /daysAdded/,
    );
    await expect(svc.extendTrial(PLATFORM_ACTOR, TENANT, -1, "r", "evt-z")).rejects.toThrow(
      /daysAdded/,
    );
  });

  it("rejects empty reason", async () => {
    const stub = makeStubRepo();
    const svc = createOnboardingAdminService({ repository: stub.repo });
    await expect(svc.extendTrial(PLATFORM_ACTOR, TENANT, 7, "   ", "evt-q")).rejects.toThrow(
      /reason/,
    );
  });

  it("propagates duplicate eventId errors from the timeline", async () => {
    const stub = makeStubRepo();
    const svc = createOnboardingAdminService({ repository: stub.repo });
    await svc.extendTrial(PLATFORM_ACTOR, TENANT, 7, "first", "evt-dup");
    await expect(
      svc.extendTrial(PLATFORM_ACTOR, TENANT, 7, "second", "evt-dup"),
    ).rejects.toThrow(/already exists/);
  });
});

describe("OnboardingAdminService — resetStep", () => {
  it("resets the step to pending and audits the action", async () => {
    const stub = makeStubRepo();
    await stub.repo.startOnboarding(TENANT);
    await stub.repo.advanceStep(TENANT, "ACCOUNT", "completed");

    const svc = createOnboardingAdminService({ repository: stub.repo });
    const { event, state } = await svc.resetStep(
      TENANT_OWNER_ACTOR,
      TENANT,
      "ACCOUNT",
      "Owner mistyped email",
      "evt-rs",
    );

    expect(state.stepStatuses.ACCOUNT).toBe("pending");
    expect(event.action).toBe("reset_step");
    expect(event.details).toEqual({ step: "ACCOUNT" });
  });

  it("rejects unauthorized actors", async () => {
    const stub = makeStubRepo();
    const svc = createOnboardingAdminService({ repository: stub.repo });
    await expect(
      svc.resetStep(TECH_ACTOR, TENANT, "ACCOUNT", "no", "evt-rsx"),
    ).rejects.toBeInstanceOf(OnboardingPermissionError);
  });
});

describe("OnboardingAdminService — applyVerificationOverride", () => {
  it("marks VERIFICATION as completed and audits the action", async () => {
    const stub = makeStubRepo();
    await stub.repo.startOnboarding(TENANT);

    const svc = createOnboardingAdminService({ repository: stub.repo });
    const { event, state } = await svc.applyVerificationOverride(
      PLATFORM_ACTOR,
      TENANT,
      "Documents pre-verified out-of-band",
      "evt-vo",
    );

    expect(state.stepStatuses.VERIFICATION).toBe("completed");
    expect(event.action).toBe("verification_override");
  });

  it("rejects unauthorized actors", async () => {
    const stub = makeStubRepo();
    const svc = createOnboardingAdminService({ repository: stub.repo });
    await expect(
      svc.applyVerificationOverride(TECH_ACTOR, TENANT, "no", "evt-vox"),
    ).rejects.toBeInstanceOf(OnboardingPermissionError);
  });
});

describe("OnboardingAdminService — listTimeline", () => {
  it("returns events in newest-first order", async () => {
    const stub = makeStubRepo();
    const svc = createOnboardingAdminService({ repository: stub.repo });

    await svc.extendTrial(PLATFORM_ACTOR, TENANT, 7, "first", "evt-1");
    await svc.extendTrial(PLATFORM_ACTOR, TENANT, 14, "second", "evt-2");

    const list = await svc.listTimeline(TENANT);
    expect(list.map((e) => e.eventId)).toEqual(["evt-2", "evt-1"]);
  });
});
