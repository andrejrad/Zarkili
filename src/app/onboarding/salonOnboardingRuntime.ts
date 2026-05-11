/**
 * salonOnboardingRuntime.ts — W37 singleton for the salon onboarding wizard service.
 */

import { createOnboardingRepository } from "../../domains/onboarding/repository";
import { createWizardService } from "../../domains/onboarding/wizardService";
import { db } from "../../shared/config/firebase";
import { createWaitlistRepository } from "../../domains/waitlist/repository";

const onboardingRepository = createOnboardingRepository(db);
export const appWizardService = createWizardService(onboardingRepository);

export const appWaitlistRepository = createWaitlistRepository(db);
