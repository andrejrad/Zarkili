import type { Timestamp } from "firebase/firestore";

import {
  ONBOARDING_STEPS,
  STEP_GUIDANCE,
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
import { WizardValidationError, createWizardService } from "../wizardService";

function ts(seconds = 0): Timestamp {
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}

/** In-memory OnboardingRepository stub — exercises the service in isolation. */
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
      const idx = ONBOARDING_STEPS.indexOf(step);
      let nextStep = state!.currentStep;
      for (let i = idx + 1; i < ONBOARDING_STEPS.length; i += 1) {
        if (statuses[ONBOARDING_STEPS[i]!] === "pending") {
          nextStep = ONBOARDING_STEPS[i]!;
          break;
        }
      }
      state = {
        ...state!,
        currentStep: nextStep,
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
      const full: OnboardingTimelineEvent = { ...event, createdAt: ts(timeline.length + 10) };
      timeline.push(full);
      return full;
    },
    async listTimeline() {
      return [...timeline].reverse();
    },
  };

  return { repo, getDrafts: () => drafts, getState: () => state };
}

const TENANT = "salon1";

describe("WizardService — validate + guidance", () => {
  it("delegates validate to validateStepPayload", () => {
    const { repo } = makeStubRepo();
    const svc = createWizardService(repo);
    const r = svc.validate("BUSINESS_PROFILE", {});
    expect(r.ok).toBe(false);
    expect(r.missingFields.length).toBeGreaterThan(0);
  });

  it("returns guidance text per step", () => {
    const { repo } = makeStubRepo();
    const svc = createWizardService(repo);
    expect(svc.guidanceFor("SERVICES")).toBe(STEP_GUIDANCE.SERVICES);
  });
});

describe("WizardService — saveDraft", () => {
  it("persists a draft via the repository", async () => {
    const stub = makeStubRepo();
    const svc = createWizardService(stub.repo);
    await svc.saveDraft(TENANT, "BUSINESS_PROFILE", { legalName: "Acme" });
    expect(stub.getDrafts().get("BUSINESS_PROFILE")?.payload).toMatchObject({
      legalName: "Acme",
    });
  });

  it("rejects non-object payloads", async () => {
    const { repo } = makeStubRepo();
    const svc = createWizardService(repo);
    await expect(
      svc.saveDraft(TENANT, "BUSINESS_PROFILE", null as unknown as Record<string, unknown>),
    ).rejects.toThrow("payload must be an object");
  });
});

describe("WizardService — submitStep", () => {
  it("rejects payload with missing required fields", async () => {
    const { repo } = makeStubRepo();
    const svc = createWizardService(repo);
    await expect(
      svc.submitStep(TENANT, "BUSINESS_PROFILE", { legalName: "Acme" }),
    ).rejects.toBeInstanceOf(WizardValidationError);
  });

  it("persists draft and advances step on valid submit", async () => {
    const stub = makeStubRepo();
    const svc = createWizardService(stub.repo);

    const state = await svc.submitStep(TENANT, "BUSINESS_PROFILE", {
      legalName: "Acme",
      addressLine1: "1 Main",
      city: "Zagreb",
      country: "HR",
    });

    expect(state.stepStatuses.BUSINESS_PROFILE).toBe("completed");
    expect(stub.getDrafts().get("BUSINESS_PROFILE")).toBeTruthy();
  });

  it("clears blockers as required steps are submitted", async () => {
    const { repo } = makeStubRepo();
    const svc = createWizardService(repo);

    await svc.submitStep(TENANT, "BUSINESS_PROFILE", {
      legalName: "Acme",
      addressLine1: "1 Main",
      city: "Zagreb",
      country: "HR",
    });
    await svc.submitStep(TENANT, "SERVICES", { services: [{ name: "Cut" }] });
    const final = await svc.submitStep(TENANT, "AVAILABILITY", {
      weekTemplate: { mon: [] },
    });

    expect(final.canGoLive).toBe(true);
    expect(final.blockers).toEqual([]);
  });
});

describe("WizardService — resume (smoke tests)", () => {
  it("happy path: start → submit each step → complete", async () => {
    const { repo } = makeStubRepo();
    const svc = createWizardService(repo);

    await svc.submitStep(TENANT, "BUSINESS_PROFILE", {
      legalName: "Acme",
      addressLine1: "1 Main",
      city: "Zagreb",
      country: "HR",
    });
    await svc.submitStep(TENANT, "SERVICES", { services: [{ name: "Cut" }] });
    await svc.submitStep(TENANT, "AVAILABILITY", { weekTemplate: { mon: [] } });

    const resumed = await svc.resume(TENANT);
    expect(resumed.state.canGoLive).toBe(true);
    expect(Object.keys(resumed.drafts).sort()).toEqual(
      ["AVAILABILITY", "BUSINESS_PROFILE", "SERVICES"].sort(),
    );
  });

  it("resumed path: save 2 steps as drafts, resume, finish remaining", async () => {
    const { repo } = makeStubRepo();
    const svc = createWizardService(repo);

    // Save partial drafts (no submit) for first two steps.
    await svc.saveDraft(TENANT, "ACCOUNT", { ownerEmail: "owner@acme.test" });
    await svc.saveDraft(TENANT, "BUSINESS_PROFILE", { legalName: "Acme" });

    // Resume — should return state and both drafts.
    const r1 = await svc.resume(TENANT);
    expect(r1.state.canGoLive).toBe(false);
    expect(r1.drafts.ACCOUNT?.payload).toMatchObject({ ownerEmail: "owner@acme.test" });
    expect(r1.drafts.BUSINESS_PROFILE?.payload).toMatchObject({ legalName: "Acme" });

    // Finish required steps.
    await svc.submitStep(TENANT, "BUSINESS_PROFILE", {
      legalName: "Acme",
      addressLine1: "1 Main",
      city: "Zagreb",
      country: "HR",
    });
    await svc.submitStep(TENANT, "SERVICES", { services: [{ name: "Cut" }] });
    await svc.submitStep(TENANT, "AVAILABILITY", { weekTemplate: { mon: [] } });

    const r2 = await svc.resume(TENANT);
    expect(r2.state.canGoLive).toBe(true);
  });
});
