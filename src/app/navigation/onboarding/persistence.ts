import type { OnboardingDraftService } from "../../../domains/auth";

import {
  createInitialOnboardingState,
  isValidOnboardingStep,
  type OnboardingFlow,
  type OnboardingProgressPersistence,
  type OnboardingState,
  type OnboardingStep,
  type ResumeOnboardingDraftInput,
  type SaveOnboardingDraftInput,
} from "./contracts";

function toDraftStep(flow: OnboardingFlow, step: OnboardingStep): string {
  if (flow === "client" && step === "account-guest") {
    return "account";
  }

  return step;
}

function fromDraftStep(flow: OnboardingFlow, step: string): OnboardingStep {
  const mapped = flow === "client" && step === "account" ? "account-guest" : step;
  if (isValidOnboardingStep(flow, mapped as OnboardingStep)) {
    return mapped as OnboardingStep;
  }

  return createInitialOnboardingState("", "", flow).currentStep;
}

function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === "object" && "toDate" in value) {
    const maybeTimestamp = value as { toDate: () => Date };
    return maybeTimestamp.toDate();
  }

  return new Date();
}

function mapCompletedSteps(flow: OnboardingFlow, value: unknown): OnboardingStep[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "string" ? fromDraftStep(flow, entry) : null))
    .filter((entry): entry is OnboardingStep => entry != null);
}

function mapResumeDraftToState(
  input: ResumeOnboardingDraftInput,
  draft: {
    currentStep: string;
    payload: Record<string, unknown>;
    updatedAt: unknown;
    status: "draft" | "submitted";
  }
): OnboardingState {
  const currentStep = fromDraftStep(input.flow, draft.currentStep);
  const completedSteps = mapCompletedSteps(input.flow, draft.payload.completedSteps);

  return {
    tenantId: input.tenantId,
    userId: input.userId,
    flow: input.flow,
    currentStep,
    completedSteps,
    status: draft.status === "submitted" ? "completed" : "in_progress",
    updatedAt: toDate(draft.updatedAt),
  };
}

export function createOnboardingProgressPersistence(
  onboardingDraftService: OnboardingDraftService
): OnboardingProgressPersistence {
  async function saveDraft(input: SaveOnboardingDraftInput): Promise<void> {
    const normalizedStep = toDraftStep(input.flow, input.currentStep);
    const normalizedCompletedSteps = input.completedSteps.map((step) => toDraftStep(input.flow, step));

    await onboardingDraftService.saveValidatedDraft({
      tenantId: input.tenantId,
      userId: input.userId,
      flowType: input.flow,
      currentStep: normalizedStep,
      payload: {
        completedSteps: normalizedCompletedSteps,
      },
    });
  }

  async function resumeDraft(input: ResumeOnboardingDraftInput): Promise<OnboardingState | null> {
    const draft = await onboardingDraftService.resumeValidatedDraft(
      input.tenantId,
      input.userId,
      input.flow
    );

    if (!draft) {
      return null;
    }

    return mapResumeDraftToState(input, {
      currentStep: draft.currentStep,
      payload: draft.payload,
      updatedAt: draft.updatedAt,
      status: draft.status,
    });
  }

  return {
    saveDraft,
    resumeDraft,
  };
}
