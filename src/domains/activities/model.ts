/**
 * Activities & Challenges domain model
 *
 * An Activity is a tenant-defined challenge that customers can participate in
 * to earn rewards (discounts, points, free services, etc.).
 *
 * Lifecycle: draft → active → inactive | expired
 *
 * Collections:
 *   tenants/{tenantId}/activities/{activityId}
 *   tenants/{tenantId}/activityParticipations/{participationId}
 */

import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityType =
  | "visit_streak"   // N visits in a row
  | "spend_goal"     // total spend reaches X
  | "referral"       // refer N new customers
  | "custom";        // admin-defined rule

export type ActivityStatus = "draft" | "active" | "inactive" | "expired";

export type ActivityRule = {
  type: ActivityType;
  /** Target value (e.g. visit streak count, spend amount, referral count) */
  targetValue: number;
  /** Optional time window in days for the rule (e.g. must do 3 visits in 30 days) */
  windowDays?: number;
};

export type ActivityRewardType = "discount_percent" | "discount_fixed" | "free_service" | "points";

export type ActivityReward = {
  type: ActivityRewardType;
  /** Numeric value: % discount, fixed amount, points earned, etc. */
  value: number;
  description: string;
};

/** Stored at tenants/{tenantId}/activities/{activityId} */
export type Activity = {
  activityId: string;
  tenantId: string;
  type: ActivityType;
  name: string;
  status: ActivityStatus;
  startDate: string; // ISO "YYYY-MM-DD"
  endDate: string;   // ISO "YYYY-MM-DD"
  rule: ActivityRule;
  reward: ActivityReward;
  createdBy: string;
  createdAt: Timestamp | { _type: string };
  updatedAt: Timestamp | { _type: string };
};

/** Stored at tenants/{tenantId}/activityParticipations/{participationId} */
export type ParticipationRecord = {
  participationId: string;
  activityId: string;
  tenantId: string;
  userId: string;
  /** Current progress toward the rule target */
  progress: number;
  completed: boolean;
  /** ISO timestamp when the reward was awarded, if ever */
  rewardedAt?: string;
  createdAt: Timestamp | { _type: string };
  updatedAt: Timestamp | { _type: string };
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type ActivityErrorCode =
  | "ACTIVITY_NOT_FOUND"
  | "TENANT_REQUIRED"
  | "ALREADY_COMPLETED"
  | "ACTIVITY_NOT_ACTIVE"
  | "INVALID_STATUS_TRANSITION";

export class ActivityError extends Error {
  constructor(
    public readonly code: ActivityErrorCode,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "ActivityError";
  }
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

export const ACTIVITY_VALID_TRANSITIONS: Record<ActivityStatus, ActivityStatus[]> = {
  draft:    ["active", "inactive"],
  active:   ["inactive", "expired"],
  inactive: ["active"],
  expired:  [],
};

export function isValidActivityTransition(from: ActivityStatus, to: ActivityStatus): boolean {
  return ACTIVITY_VALID_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------
// Completion check (pure)
// ---------------------------------------------------------------------------

export function isActivityCompleted(
  participation: Pick<ParticipationRecord, "progress" | "completed">,
  rule: ActivityRule,
): boolean {
  if (participation.completed) return true;
  return participation.progress >= rule.targetValue;
}
