import {
  completeCurrentOnboardingStep,
  createInitialOnboardingState,
  getNextOnboardingStep,
  isValidOnboardingStep,
  moveOnboardingToStep,
} from "../onboarding/contracts";

describe("onboarding contracts", () => {
  it("creates initial salon onboarding state at account step", () => {
    const state = createInitialOnboardingState("tenantA", "userA", "salon");

    expect(state.currentStep).toBe("account");
    expect(state.status).toBe("in_progress");
  });

  it("returns next step for client onboarding flow", () => {
    expect(getNextOnboardingStep("client", "phone-verify")).toBe("profile");
  });

  it("marks onboarding completed when the last step is completed", () => {
    const state = createInitialOnboardingState("tenantA", "userA", "client");

    const completed = completeCurrentOnboardingStep(
      moveOnboardingToStep(state, "loyalty")
    );

    expect(completed.status).toBe("completed");
    expect(completed.completedSteps).toContain("loyalty");
  });

  it("rejects invalid cross-flow step transition", () => {
    const state = createInitialOnboardingState("tenantA", "userA", "salon");

    expect(() => moveOnboardingToStep(state, "phone-verify")).toThrow(
      "not valid for flow"
    );
  });

  it("validates step membership by flow", () => {
    expect(isValidOnboardingStep("salon", "services")).toBe(true);
    expect(isValidOnboardingStep("client", "services")).toBe(false);
  });
});
