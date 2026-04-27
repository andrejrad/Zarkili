/**
 * Campaign analytics service — app-layer wrapper for campaign and challenge KPI computation.
 */

import type { AnalyticsRepository } from "../../domains/analytics/analyticsRepository";
import type { TenantUserRole } from "../../domains/tenants/tenantUsersModel";
import {
  computeCampaignKpisBatch,
  computeChallengeKpisBatch,
} from "../../domains/analytics/campaignMetricsService";
import type { CampaignKpis, ChallengeKpis } from "../../domains/analytics/model";
import type { ParticipationRecord } from "../../domains/activities/model";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type CampaignAnalyticsResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Roles that may NOT access campaign analytics. */
const CAMPAIGN_ANALYTICS_FORBIDDEN_ROLES: TenantUserRole[] = ["technician", "client"];

export function createCampaignAnalyticsService(
  analyticsRepository: AnalyticsRepository,
) {
  async function getCampaignKpis(
    tenantId: string,
    actorRole: TenantUserRole,
  ): Promise<CampaignAnalyticsResult<CampaignKpis[]>> {
    if (CAMPAIGN_ANALYTICS_FORBIDDEN_ROLES.includes(actorRole)) {
      return { ok: false, code: "FORBIDDEN", message: "Your role does not have analytics access" };
    }
    if (!tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }
    try {
      const campaigns = await analyticsRepository.fetchCampaigns(tenantId);
      return { ok: true, data: computeCampaignKpisBatch(campaigns) };
    } catch (err) {
      return {
        ok: false,
        code: "QUERY_ERROR",
        message: err instanceof Error ? err.message : "Query failed",
      };
    }
  }

  async function getChallengeKpis(
    tenantId: string,
    actorRole: TenantUserRole,
  ): Promise<CampaignAnalyticsResult<ChallengeKpis[]>> {
    if (CAMPAIGN_ANALYTICS_FORBIDDEN_ROLES.includes(actorRole)) {
      return { ok: false, code: "FORBIDDEN", message: "Your role does not have analytics access" };
    }
    if (!tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }
    try {
      const activities = await analyticsRepository.fetchActivities(tenantId);
      const participationsByActivityId = new Map<string, ParticipationRecord[]>();
      await Promise.all(
        activities.map(async (activity) => {
          const pars = await analyticsRepository.fetchParticipations(
            tenantId,
            activity.activityId,
          );
          participationsByActivityId.set(activity.activityId, pars);
        }),
      );
      return {
        ok: true,
        data: computeChallengeKpisBatch(activities, participationsByActivityId),
      };
    } catch (err) {
      return {
        ok: false,
        code: "QUERY_ERROR",
        message: err instanceof Error ? err.message : "Query failed",
      };
    }
  }

  return { getCampaignKpis, getChallengeKpis };
}

export type CampaignAnalyticsService = ReturnType<typeof createCampaignAnalyticsService>;
