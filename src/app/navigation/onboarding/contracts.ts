export type SalonOnboardingStep =
  | "account"
  | "business-profile"
  | "payment-setup"
  | "services"
  | "staff"
  | "policies"
  | "availability"
  | "marketplace"
  | "verification";

export type ClientOnboardingStep =
  | "account-guest"
  | "phone-verify"
  | "profile"
  | "payment-method"
  | "preferences"
  | "notifications"
  | "loyalty";

export type OnboardingFlow = "salon" | "client";

export type OnboardingStep = SalonOnboardingStep | ClientOnboardingStep;

export const salonOnboardingSteps: readonly SalonOnboardingStep[] = [
  "account",
  "business-profile",
  "payment-setup",
  "services",
  "staff",
  "policies",
  "availability",
  "marketplace",
  "verification",
] as const;

export const clientOnboardingSteps: readonly ClientOnboardingStep[] = [
  "account-guest",
  "phone-verify",
  "profile",
  "payment-method",
  "preferences",
  "notifications",
  "loyalty",
] as const;

export const onboardingStepLabels: Record<OnboardingStep, string> = {
  account: "Account",
  "business-profile": "Business Profile",
  "payment-setup": "Payment Setup",
  services: "Services",
  staff: "Staff",
  policies: "Policies",
  availability: "Availability",
  marketplace: "Marketplace",
  verification: "Verification",
  "account-guest": "Account/Guest",
  "phone-verify": "Phone Verify",
  profile: "Profile",
  "payment-method": "Payment Method",
  preferences: "Preferences",
  notifications: "Notifications",
  loyalty: "Loyalty",
};

export type OnboardingStateStatus = "idle" | "in_progress" | "completed" | "paused";

export type OnboardingState<TStep extends OnboardingStep = OnboardingStep> = {
  tenantId: string;
  userId: string;
  flow: OnboardingFlow;
  currentStep: TStep;
  completedSteps: TStep[];
  status: OnboardingStateStatus;
  updatedAt: Date;
};

export type SaveOnboardingDraftInput<TStep extends OnboardingStep = OnboardingStep> = {
  tenantId: string;
  userId: string;
  flow: OnboardingFlow;
  currentStep: TStep;
  completedSteps: TStep[];
};

export type ResumeOnboardingDraftInput = {
  tenantId: string;
  userId: string;
  flow: OnboardingFlow;
};

export type OnboardingProgressPersistence = {
  saveDraft: (input: SaveOnboardingDraftInput) => Promise<void>;
  resumeDraft: (input: ResumeOnboardingDraftInput) => Promise<OnboardingState | null>;
};

export function getOnboardingSteps(flow: OnboardingFlow): readonly OnboardingStep[] {
  return flow === "salon" ? salonOnboardingSteps : clientOnboardingSteps;
}

export function isValidOnboardingStep(flow: OnboardingFlow, step: OnboardingStep): boolean {
  return getOnboardingSteps(flow).includes(step);
}

export function createInitialOnboardingState(
  tenantId: string,
  userId: string,
  flow: OnboardingFlow
): OnboardingState {
  const firstStep = getOnboardingSteps(flow)[0];
  return {
    tenantId,
    userId,
    flow,
    currentStep: firstStep,
    completedSteps: [],
    status: "in_progress",
    updatedAt: new Date(),
  };
}

export function getNextOnboardingStep(
  flow: OnboardingFlow,
  currentStep: OnboardingStep
): OnboardingStep | null {
  const steps = getOnboardingSteps(flow);
  const currentIndex = steps.findIndex((step) => step === currentStep);
  if (currentIndex < 0 || currentIndex >= steps.length - 1) {
    return null;
  }

  return steps[currentIndex + 1];
}

export function moveOnboardingToStep(
  state: OnboardingState,
  nextStep: OnboardingStep
): OnboardingState {
  if (!isValidOnboardingStep(state.flow, nextStep)) {
    throw new Error(`Step '${nextStep}' is not valid for flow '${state.flow}'`);
  }

  return {
    ...state,
    currentStep: nextStep,
    status: "in_progress",
    updatedAt: new Date(),
  };
}

export function completeCurrentOnboardingStep(state: OnboardingState): OnboardingState {
  const completedSet = new Set(state.completedSteps);
  completedSet.add(state.currentStep);

  const nextStep = getNextOnboardingStep(state.flow, state.currentStep);
  return {
    ...state,
    completedSteps: [...completedSet],
    currentStep: (nextStep ?? state.currentStep) as OnboardingStep,
    status: nextStep ? "in_progress" : "completed",
    updatedAt: new Date(),
  };
}
