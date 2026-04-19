import { createOnboardingDraftRepository, createOnboardingDraftService } from "../../../domains/auth";
import { db } from "../../../shared/config";

import { createOnboardingProgressPersistence } from "./persistence";

export function createFirestoreOnboardingProgressPersistence() {
  const onboardingDraftRepository = createOnboardingDraftRepository(db);
  const onboardingDraftService = createOnboardingDraftService(onboardingDraftRepository);
  return createOnboardingProgressPersistence(onboardingDraftService);
}
