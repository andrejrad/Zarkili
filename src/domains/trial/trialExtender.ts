/**
 * trialExtender.ts (W15-DEBT-2 — production wiring)
 *
 * Adapter that converts a `TrialService` into the `TrialExtender` callback
 * shape consumed by `OnboardingAdminService`. Wiring this into the admin
 * service factory in production replaces the previous "log a timeline event
 * but don't actually move the trial" placeholder.
 *
 * Pure adapter — no I/O of its own. The underlying `TrialService` performs
 * the read-modify-write through the trial repository.
 */

import type { TrialService } from "./trialService";

/**
 * The `TrialExtender` shape expected by `OnboardingAdminService`. Repeated
 * here as a structural type so the trial domain does not depend on the
 * onboarding domain.
 */
export type TrialExtender = (tenantId: string, daysAdded: number) => Promise<void>;

/**
 * Build a `TrialExtender` from a `TrialService`. The returned callback
 * delegates to `service.extendTrial` and ignores the returned `Trial`
 * (the onboarding admin service only needs the side effect, not the
 * extended trial record — it independently appends a timeline event).
 */
export function createTrialExtender(service: TrialService): TrialExtender {
  return async (tenantId: string, daysAdded: number): Promise<void> => {
    await service.extendTrial(tenantId, daysAdded);
  };
}
