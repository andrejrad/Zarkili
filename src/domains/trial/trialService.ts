/**
 * Trial service — activation, lifecycle ticking, upgrade.
 *
 * Public surface:
 *   - activateTrial(tenantId, ctx)        — onboarding + launch trigger
 *   - tickExpiry(tenantId, runId)         — idempotent expiry/expiring_soon transition
 *   - upgradeTrial(tenantId, subscriptionId) — paid plan attached
 *   - getTrial(tenantId)
 *
 * Pure helpers (testable without I/O):
 *   - buildInitialTrial
 *   - applyTick
 *   - applyUpgrade
 */

import type { Timestamp } from "firebase/firestore";

import {
  addDays,
  canActivate,
  DEFAULT_TRIAL_DAYS,
  deriveTrialStatusAt,
  isValidTrialTransition,
  TrialError,
  type ActivationContext,
  type Trial,
  type TrialStatus,
} from "./model";
import type { TrialRepository } from "./repository";

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function buildInitialTrial(args: {
  tenantId: string;
  now: Timestamp;
  trialLengthDays?: number;
}): Trial {
  const days = args.trialLengthDays ?? DEFAULT_TRIAL_DAYS;
  if (days <= 0 || !Number.isInteger(days)) {
    throw new TrialError("INVALID_TRIAL_LENGTH", `trialLengthDays must be a positive integer (got ${days})`);
  }
  return {
    tenantId: args.tenantId,
    status: "not_started",
    trialLengthDays: days,
    startedAt: null,
    endsAt: null,
    expiredAt: null,
    upgradedAt: null,
    upgradeSubscriptionId: null,
    lastJobRunId: null,
    createdAt: args.now,
    updatedAt: args.now,
  };
}

function activateInPlace(trial: Trial, now: Timestamp): Trial {
  if (trial.status !== "not_started") {
    throw new TrialError("ALREADY_ACTIVATED", `Trial already in status ${trial.status}`);
  }
  return {
    ...trial,
    status: "active",
    startedAt: now,
    endsAt: addDays(now, trial.trialLengthDays),
    updatedAt: now,
  };
}

export function applyTick(
  trial: Trial,
  now: Timestamp,
  runId: string,
): { next: Trial; changed: boolean } {
  if (trial.status === "upgraded" || trial.status === "expired" || trial.status === "not_started") {
    return { next: trial, changed: false };
  }

  const derived = deriveTrialStatusAt(trial, now);
  if (derived === trial.status) {
    return { next: trial, changed: false };
  }
  if (!isValidTrialTransition(trial.status, derived)) {
    throw new TrialError(
      "INVALID_TRANSITION",
      `Illegal trial transition: ${trial.status} → ${derived}`,
    );
  }

  const next: Trial = {
    ...trial,
    status: derived,
    expiredAt: derived === "expired" ? now : trial.expiredAt,
    lastJobRunId: runId,
    updatedAt: now,
  };
  return { next, changed: true };
}

export function applyUpgrade(
  trial: Trial,
  now: Timestamp,
  subscriptionId: string,
): Trial {
  const target: TrialStatus = "upgraded";
  if (!isValidTrialTransition(trial.status, target)) {
    throw new TrialError(
      "INVALID_TRANSITION",
      `Illegal trial transition: ${trial.status} → ${target}`,
    );
  }
  return {
    ...trial,
    status: target,
    upgradedAt: now,
    upgradeSubscriptionId: subscriptionId,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// applyExtension — admin-extends an active/expiring/expired trial (W15-DEBT-2)
// ---------------------------------------------------------------------------

/**
 * Push a trial's `endsAt` forward by `daysAdded`. Used by
 * `OnboardingAdminService.extendTrial` in production.
 *
 * Rules:
 *   - `daysAdded` must be a positive integer.
 *   - `not_started` and `upgraded` cannot be extended (no live deadline).
 *   - `expired` is recoverable: a successful extension flips the trial back
 *     to `active` (or `expiring_soon` if the new `endsAt` is within the
 *     warning window) and clears `expiredAt`.
 *   - `active` and `expiring_soon` get their `endsAt` pushed; status is
 *     re-derived against `now` so a long-enough extension flips
 *     `expiring_soon` back to `active`.
 */
export function applyExtension(
  trial: Trial,
  daysAdded: number,
  now: Timestamp,
): Trial {
  if (!Number.isInteger(daysAdded) || daysAdded <= 0) {
    throw new TrialError(
      "INVALID_TRANSITION",
      `daysAdded must be a positive integer (got ${daysAdded})`,
    );
  }
  if (trial.status === "not_started") {
    throw new TrialError(
      "INVALID_TRANSITION",
      "Cannot extend a trial that has not been activated",
    );
  }
  if (trial.status === "upgraded") {
    throw new TrialError(
      "INVALID_TRANSITION",
      "Cannot extend a trial that has already upgraded",
    );
  }

  const baseEndsAt = trial.endsAt ?? now;
  // For an already-expired trial whose endsAt is in the past, anchor the
  // extension to "now" so the salon actually gets the full extension window.
  const anchorSeconds = Math.max(baseEndsAt.seconds, now.seconds);
  const newEndsAt = addDays(
    { seconds: anchorSeconds, nanoseconds: 0 } as unknown as Timestamp,
    daysAdded,
  );

  const candidate: Trial = {
    ...trial,
    endsAt: newEndsAt,
    expiredAt: null,
    updatedAt: now,
  };
  const derived = deriveTrialStatusAt(candidate, now);

  if (trial.status !== "expired" && derived === "expired") {
    // Pathological: extension didn't land in the future. Force callers to
    // supply a daysAdded that clears `now`.
    throw new TrialError(
      "INVALID_TRANSITION",
      "Extension did not push endsAt past `now`",
    );
  }
  return { ...candidate, status: derived };
}

export type TickResult = {
  outcome: "applied" | "duplicate" | "noop";
  fromStatus: TrialStatus;
  toStatus: TrialStatus;
  trial: Trial;
};

export type TrialService = {
  getTrial(tenantId: string): Promise<Trial | null>;
  activateTrial(
    tenantId: string,
    ctx: ActivationContext,
    options?: { trialLengthDays?: number },
  ): Promise<Trial>;
  tickExpiry(tenantId: string, runId: string): Promise<TickResult>;
  upgradeTrial(tenantId: string, subscriptionId: string): Promise<Trial>;
  /** Admin-driven extension. See `applyExtension` for status rules. */
  extendTrial(tenantId: string, daysAdded: number): Promise<Trial>;
};

export function createTrialService(
  repository: TrialRepository,
  options?: { now?: () => Timestamp },
): TrialService {
  const now = options?.now ?? defaultNow;

  async function getTrial(tenantId: string): Promise<Trial | null> {
    return repository.getTrial(tenantId);
  }

  async function activateTrial(
    tenantId: string,
    ctx: ActivationContext,
    opts?: { trialLengthDays?: number },
  ): Promise<Trial> {
    if (!canActivate(ctx)) {
      throw new TrialError(
        "ACTIVATION_BLOCKED",
        "Activation requires onboardingComplete && launchActivated",
      );
    }
    const ts = now();
    const existing = await repository.getTrial(tenantId);
    let base: Trial;
    if (!existing) {
      base = buildInitialTrial({ tenantId, now: ts, trialLengthDays: opts?.trialLengthDays });
    } else if (existing.status === "not_started") {
      base = opts?.trialLengthDays
        ? { ...existing, trialLengthDays: opts.trialLengthDays }
        : existing;
    } else {
      throw new TrialError("ALREADY_ACTIVATED", `Trial already in status ${existing.status}`);
    }

    const activated = activateInPlace(base, ts);
    await repository.saveTrial(activated);
    return activated;
  }

  async function tickExpiry(tenantId: string, runId: string): Promise<TickResult> {
    if (!runId) {
      throw new TrialError("INVALID_TRANSITION", "runId is required for tickExpiry");
    }
    if (await repository.hasJobRun(tenantId, runId)) {
      const existing = await repository.getTrial(tenantId);
      return {
        outcome: "duplicate",
        fromStatus: existing?.status ?? "not_started",
        toStatus: existing?.status ?? "not_started",
        trial: existing as Trial,
      };
    }

    const trial = await repository.getTrial(tenantId);
    if (!trial) {
      throw new TrialError("TRIAL_NOT_FOUND", `No trial exists for tenant ${tenantId}`);
    }

    const ts = now();
    const { next, changed } = applyTick(trial, ts, runId);
    if (!changed) {
      await repository.recordJobRun(tenantId, runId);
      return {
        outcome: "noop",
        fromStatus: trial.status,
        toStatus: trial.status,
        trial,
      };
    }

    await repository.saveTrialWithJobRun(next, runId);
    return {
      outcome: "applied",
      fromStatus: trial.status,
      toStatus: next.status,
      trial: next,
    };
  }

  async function upgradeTrial(tenantId: string, subscriptionId: string): Promise<Trial> {
    if (!subscriptionId) {
      throw new TrialError("INVALID_TRANSITION", "subscriptionId is required for upgrade");
    }
    const trial = await repository.getTrial(tenantId);
    if (!trial) {
      throw new TrialError("TRIAL_NOT_FOUND", `No trial exists for tenant ${tenantId}`);
    }
    const ts = now();
    const next = applyUpgrade(trial, ts, subscriptionId);
    await repository.saveTrial(next);
    return next;
  }

  async function extendTrial(tenantId: string, daysAdded: number): Promise<Trial> {
    const trial = await repository.getTrial(tenantId);
    if (!trial) {
      throw new TrialError("TRIAL_NOT_FOUND", `No trial exists for tenant ${tenantId}`);
    }
    const ts = now();
    const next = applyExtension(trial, daysAdded, ts);
    await repository.saveTrial(next);
    return next;
  }

  return { getTrial, activateTrial, tickExpiry, upgradeTrial, extendTrial };
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultNow(): Timestamp {
  const seconds = Math.floor(Date.now() / 1000);
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}
