/**
 * activityAdminService.ts
 *
 * Orchestrates admin-side activity/challenge operations:
 *   listActivities   — paginated list of all activities for a tenant
 *   createActivity   — create a new draft activity
 *   activateActivity — transition draft/inactive → active
 *   deactivateActivity — transition active → inactive
 */

import type { ActivityRepository } from "../../domains/activities/repository";
import { ActivityError } from "../../domains/activities/model";
import type {
  Activity,
  ActivityType,
  ActivityRule,
  ActivityReward,
} from "../../domains/activities/model";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type CreateActivityInput = {
  tenantId: string;
  type: ActivityType;
  name: string;
  startDate: string;  // "YYYY-MM-DD"
  endDate:   string;  // "YYYY-MM-DD"
  rule: ActivityRule;
  reward: ActivityReward;
  createdBy: string;
};

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type ActivityAdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createActivityAdminService(activityRepository: ActivityRepository) {
  /**
   * List all activities for a tenant, most recently created first.
   */
  async function listActivities(tenantId: string): Promise<ActivityAdminResult<Activity[]>> {
    if (!tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }
    try {
      const activities = await activityRepository.listActivities(tenantId);
      return { ok: true, data: activities };
    } catch (err) {
      const code = err instanceof ActivityError ? err.code : "UNKNOWN_ERROR";
      const message = err instanceof Error ? err.message : "Failed to load activities";
      return { ok: false, code, message };
    }
  }

  /**
   * Create a new activity in draft status.
   */
  async function createActivity(
    input: CreateActivityInput,
  ): Promise<ActivityAdminResult<Activity>> {
    if (!input.tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }
    if (!input.name.trim()) {
      return { ok: false, code: "VALIDATION_ERROR", message: "Activity name is required" };
    }
    if (input.endDate < input.startDate) {
      return { ok: false, code: "VALIDATION_ERROR", message: "End date must be on or after start date" };
    }
    if (input.rule.targetValue <= 0) {
      return { ok: false, code: "VALIDATION_ERROR", message: "Target value must be greater than zero" };
    }
    try {
      const activity = await activityRepository.createActivity({ ...input, status: "draft" });
      return { ok: true, data: activity };
    } catch (err) {
      const code = err instanceof ActivityError ? err.code : "UNKNOWN_ERROR";
      const message = err instanceof Error ? err.message : "Failed to create activity";
      return { ok: false, code, message };
    }
  }

  /**
   * Activate an activity (draft/inactive → active).
   */
  async function activateActivity(
    tenantId: string,
    activityId: string,
  ): Promise<ActivityAdminResult<void>> {
    try {
      await activityRepository.activateActivity(tenantId, activityId);
      return { ok: true, data: undefined };
    } catch (err) {
      const code = err instanceof ActivityError ? err.code : "UNKNOWN_ERROR";
      const message = err instanceof Error ? err.message : "Failed to activate activity";
      return { ok: false, code, message };
    }
  }

  /**
   * Deactivate an activity (active → inactive).
   */
  async function deactivateActivity(
    tenantId: string,
    activityId: string,
  ): Promise<ActivityAdminResult<void>> {
    try {
      await activityRepository.deactivateActivity(tenantId, activityId);
      return { ok: true, data: undefined };
    } catch (err) {
      const code = err instanceof ActivityError ? err.code : "UNKNOWN_ERROR";
      const message = err instanceof Error ? err.message : "Failed to deactivate activity";
      return { ok: false, code, message };
    }
  }

  return { listActivities, createActivity, activateActivity, deactivateActivity };
}

export type ActivityAdminService = ReturnType<typeof createActivityAdminService>;
