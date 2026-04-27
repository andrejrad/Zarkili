/**
 * W15.1 — Salon Onboarding Wizard service.
 *
 * Orchestrates draft persistence, per-step validation, and step completion
 * on top of the OnboardingRepository.
 */

import {
  STEP_GUIDANCE,
  validateStepPayload,
  type OnboardingStep,
  type SalonOnboardingState,
  type StepValidationResult,
  type WizardStepDraft,
} from "./model";
import type { OnboardingRepository } from "./repository";

export class WizardValidationError extends Error {
  constructor(
    public readonly step: OnboardingStep,
    public readonly missingFields: string[],
  ) {
    super(`Step "${step}" is missing required fields: ${missingFields.join(", ")}`);
    this.name = "WizardValidationError";
  }
}

export type ResumePayload = {
  state: SalonOnboardingState;
  drafts: Record<OnboardingStep, WizardStepDraft | undefined>;
};

export type WizardService = {
  /** Validate a payload without persisting. */
  validate(step: OnboardingStep, payload: Record<string, unknown>): StepValidationResult;

  /** Return guidance text for a step. */
  guidanceFor(step: OnboardingStep): string;

  /** Save a per-step draft after validating it can be parsed (no required-field check). */
  saveDraft(
    tenantId: string,
    step: OnboardingStep,
    payload: Record<string, unknown>,
  ): Promise<WizardStepDraft>;

  /**
   * Submit a step: validate required fields, persist draft, then mark step completed.
   * Throws WizardValidationError when required fields are missing.
   */
  submitStep(
    tenantId: string,
    step: OnboardingStep,
    payload: Record<string, unknown>,
  ): Promise<SalonOnboardingState>;

  /** Resume an in-progress wizard: returns current state + all per-step drafts. */
  resume(tenantId: string): Promise<ResumePayload>;
};

export function createWizardService(repository: OnboardingRepository): WizardService {
  function validate(step: OnboardingStep, payload: Record<string, unknown>): StepValidationResult {
    return validateStepPayload(step, payload);
  }

  function guidanceFor(step: OnboardingStep): string {
    return STEP_GUIDANCE[step];
  }

  async function saveDraft(
    tenantId: string,
    step: OnboardingStep,
    payload: Record<string, unknown>,
  ): Promise<WizardStepDraft> {
    if (!payload || typeof payload !== "object") {
      throw new Error("payload must be an object");
    }
    return repository.saveDraft(tenantId, step, payload);
  }

  async function submitStep(
    tenantId: string,
    step: OnboardingStep,
    payload: Record<string, unknown>,
  ): Promise<SalonOnboardingState> {
    const result = validateStepPayload(step, payload);
    if (!result.ok) {
      throw new WizardValidationError(step, result.missingFields);
    }
    await repository.saveDraft(tenantId, step, payload);
    return repository.advanceStep(tenantId, step, "completed");
  }

  async function resume(tenantId: string): Promise<ResumePayload> {
    let state = await repository.getOnboardingState(tenantId);
    if (!state) {
      state = await repository.startOnboarding(tenantId);
    }

    const draftList = await repository.listDrafts(tenantId);
    const drafts: Record<string, WizardStepDraft | undefined> = {};
    for (const d of draftList) {
      drafts[d.step] = d;
    }

    return { state, drafts: drafts as ResumePayload["drafts"] };
  }

  return { validate, guidanceFor, saveDraft, submitStep, resume };
}
