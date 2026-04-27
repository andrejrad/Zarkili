/**
 * W15.2 — Salon Onboarding Admin Controls.
 *
 * Provides platform-owner / tenant-owner level operations:
 *   - extendTrial
 *   - resetStep
 *   - applyVerificationOverride
 *
 * Every action is permission-checked and appended to the onboardingTimeline
 * audit log via the OnboardingRepository.
 */

import type {
  OnboardingAdminAction,
  OnboardingStep,
  OnboardingTimelineEvent,
  SalonOnboardingState,
} from "./model";
import type { OnboardingRepository } from "./repository";

export type AdminActor = {
  userId: string;
  role: "platform_admin" | "tenant_owner" | string;
};

export class OnboardingPermissionError extends Error {
  constructor(action: OnboardingAdminAction, role: string) {
    super(`Role "${role}" is not permitted to perform "${action}"`);
    this.name = "OnboardingPermissionError";
  }
}

/** Optional callback for actually extending trial in the trial domain. */
export type TrialExtender = (tenantId: string, daysAdded: number) => Promise<void>;

export type OnboardingAdminService = {
  extendTrial(
    actor: AdminActor,
    tenantId: string,
    daysAdded: number,
    reason: string,
    eventId: string,
  ): Promise<OnboardingTimelineEvent>;

  resetStep(
    actor: AdminActor,
    tenantId: string,
    step: OnboardingStep,
    reason: string,
    eventId: string,
  ): Promise<{ event: OnboardingTimelineEvent; state: SalonOnboardingState }>;

  applyVerificationOverride(
    actor: AdminActor,
    tenantId: string,
    reason: string,
    eventId: string,
  ): Promise<{ event: OnboardingTimelineEvent; state: SalonOnboardingState }>;

  listTimeline(tenantId: string): Promise<OnboardingTimelineEvent[]>;
};

export type OnboardingAdminDeps = {
  repository: OnboardingRepository;
  /** Optional — when present, called to extend the trial in the trial domain. */
  trialExtender?: TrialExtender;
};

const ALLOWED_ROLES: ReadonlySet<string> = new Set(["platform_admin", "tenant_owner"]);

function assertPermitted(actor: AdminActor, action: OnboardingAdminAction): void {
  if (!ALLOWED_ROLES.has(actor.role)) {
    throw new OnboardingPermissionError(action, actor.role);
  }
}

function assertReason(reason: string): void {
  if (typeof reason !== "string" || reason.trim().length === 0) {
    throw new Error("reason is required for audited admin actions");
  }
}

function assertPositiveInt(value: number, field: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
}

export function createOnboardingAdminService(
  deps: OnboardingAdminDeps,
): OnboardingAdminService {
  const { repository, trialExtender } = deps;

  async function extendTrial(
    actor: AdminActor,
    tenantId: string,
    daysAdded: number,
    reason: string,
    eventId: string,
  ): Promise<OnboardingTimelineEvent> {
    assertPermitted(actor, "extend_trial");
    assertReason(reason);
    assertPositiveInt(daysAdded, "daysAdded");

    if (trialExtender) {
      await trialExtender(tenantId, daysAdded);
    }

    return repository.appendTimelineEvent({
      eventId,
      tenantId,
      action: "extend_trial",
      actorUserId: actor.userId,
      actorRole: actor.role as "platform_admin" | "tenant_owner",
      reason,
      details: { daysAdded },
    });
  }

  async function resetStep(
    actor: AdminActor,
    tenantId: string,
    step: OnboardingStep,
    reason: string,
    eventId: string,
  ): Promise<{ event: OnboardingTimelineEvent; state: SalonOnboardingState }> {
    assertPermitted(actor, "reset_step");
    assertReason(reason);

    const state = await repository.advanceStep(tenantId, step, "pending");
    const event = await repository.appendTimelineEvent({
      eventId,
      tenantId,
      action: "reset_step",
      actorUserId: actor.userId,
      actorRole: actor.role as "platform_admin" | "tenant_owner",
      reason,
      details: { step },
    });

    return { event, state };
  }

  async function applyVerificationOverride(
    actor: AdminActor,
    tenantId: string,
    reason: string,
    eventId: string,
  ): Promise<{ event: OnboardingTimelineEvent; state: SalonOnboardingState }> {
    assertPermitted(actor, "verification_override");
    assertReason(reason);

    const state = await repository.advanceStep(tenantId, "VERIFICATION", "completed");
    const event = await repository.appendTimelineEvent({
      eventId,
      tenantId,
      action: "verification_override",
      actorUserId: actor.userId,
      actorRole: actor.role as "platform_admin" | "tenant_owner",
      reason,
      details: { step: "VERIFICATION" },
    });

    return { event, state };
  }

  async function listTimeline(tenantId: string): Promise<OnboardingTimelineEvent[]> {
    return repository.listTimeline(tenantId);
  }

  return { extendTrial, resetStep, applyVerificationOverride, listTimeline };
}
