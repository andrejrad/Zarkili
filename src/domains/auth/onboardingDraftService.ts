import type {
  OnboardingDraft,
  OnboardingFlowType,
  SaveOnboardingDraftInput,
} from "./model";
import {
  CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION,
  migrateOnboardingDraftToCurrentVersion,
  validateOnboardingDraftInput,
} from "./onboardingDraftContracts";
import type { OnboardingDraftRepository } from "./onboardingDraftRepository";

export function createOnboardingDraftService(repository: OnboardingDraftRepository) {
  async function saveValidatedDraft(input: SaveOnboardingDraftInput): Promise<OnboardingDraft> {
    const normalizedInput: SaveOnboardingDraftInput = {
      ...input,
      schemaVersion: input.schemaVersion ?? CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION,
    };

    validateOnboardingDraftInput(normalizedInput);
    const draft = await repository.saveDraft(normalizedInput);
    return migrateOnboardingDraftToCurrentVersion(draft);
  }

  async function resumeValidatedDraft(
    tenantId: string,
    userId: string,
    flowType: OnboardingFlowType
  ): Promise<OnboardingDraft | null> {
    const draft = await repository.resumeDraft(tenantId, userId, flowType);
    if (!draft) {
      return null;
    }

    const migrated = migrateOnboardingDraftToCurrentVersion(draft);
    validateOnboardingDraftInput({
      tenantId: migrated.tenantId,
      userId: migrated.userId,
      flowType: migrated.flowType,
      schemaVersion: migrated.schemaVersion,
      currentStep: migrated.currentStep,
      payload: migrated.payload,
    });

    return migrated;
  }

  async function discardDraft(
    tenantId: string,
    userId: string,
    flowType: OnboardingFlowType
  ): Promise<void> {
    await repository.discardDraft(tenantId, userId, flowType);
  }

  return {
    saveValidatedDraft,
    resumeValidatedDraft,
    discardDraft,
  };
}

export type OnboardingDraftService = ReturnType<typeof createOnboardingDraftService>;
