/**
 * Reporting service — app-layer analytics orchestration.
 *
 * Wraps domain metrics functions with:
 *   - AnalyticsRepository data fetching
 *   - Subscription tier context (getTenantAnalyticsContext)
 *   - Consistent ok/error result shape
 *
 * Report access per plan
 * ──────────────────────
 * free_trial    : retention, rebooking
 * starter       : + at_risk, visit_interval
 * professional  : + staff_performance, service_performance, campaign_analytics, challenge_analytics
 * enterprise    : + export
 */

import type { AnalyticsRepository } from "../../domains/analytics/analyticsRepository";
import type { TenantPlan } from "../../domains/tenants/model";
import type { TenantUserRole } from "../../domains/tenants/tenantUsersModel";
import type {
  AnalyticsFilter,
  AtRiskMetrics,
  ClientRiskEntry,
  RebookingMetrics,
  RetentionMetrics,
  ReportKey,
  ServicePerformanceMetrics,
  StaffPerformanceMetrics,
  TenantAnalyticsContext,
  VisitIntervalMetrics,
} from "../../domains/analytics/model";
import {
  buildClientAttentionList,
  computeAtRiskMetrics,
  computeRebookingMetrics,
  computeRetentionMetrics,
  computeServicePerformance,
  computeStaffPerformance,
  computeVisitIntervalMetrics,
} from "../../domains/analytics/metricsService";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type ReportingResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

// ---------------------------------------------------------------------------
// Plan → accessible reports
// ---------------------------------------------------------------------------

const PLAN_REPORTS: Record<TenantPlan, ReportKey[]> = {
  free_trial:   ["retention", "rebooking"],
  starter:      ["retention", "rebooking", "at_risk", "visit_interval"],
  professional: [
    "retention",
    "rebooking",
    "at_risk",
    "visit_interval",
    "staff_performance",
    "service_performance",
    "campaign_analytics",
    "challenge_analytics",
  ],
  enterprise: [
    "retention",
    "rebooking",
    "at_risk",
    "visit_interval",
    "staff_performance",
    "service_performance",
    "campaign_analytics",
    "challenge_analytics",
    "export",
  ],
};

// ---------------------------------------------------------------------------
// Safety cap for unbounded historical queries
// ---------------------------------------------------------------------------

/**
 * Maximum lookback window for all-status booking queries.
 * Caps Firestore reads at 2 years of history, sufficient for all analytics.
 * Prevents full-collection scans on large long-running tenants.
 */
const ANALYTICS_MAX_LOOKBACK_DAYS = 730;

/** Roles that may NOT access analytics reports. */
const REPORTING_FORBIDDEN_ROLES: TenantUserRole[] = ["technician", "client"];

function analyticsLookbackSince(): string {
  const d = new Date(Date.now() - ANALYTICS_MAX_LOOKBACK_DAYS * 86_400_000);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createReportingService(analyticsRepository: AnalyticsRepository) {
  /**
   * Returns tenant subscription tier context, including the list of reports the
   * current plan grants access to.  A Week-14 gate check can compare a desired
   * ReportKey against accessibleReports before rendering.
   */
  async function getTenantAnalyticsContext(
    tenantId: string,
    subscriptionTier: TenantPlan,
  ): Promise<TenantAnalyticsContext> {
    return {
      tenantId,
      subscriptionTier,
      accessibleReports: PLAN_REPORTS[subscriptionTier] ?? [],
    };
  }

  async function getRetentionReport(
    filter: AnalyticsFilter,
    actorRole: TenantUserRole,
  ): Promise<ReportingResult<RetentionMetrics>> {
    if (REPORTING_FORBIDDEN_ROLES.includes(actorRole)) {
      return { ok: false, code: "FORBIDDEN", message: "Your role does not have reporting access" };
    }
    if (!filter.tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }
    try {
      const bookings = await analyticsRepository.fetchCompletedBookings(
        filter.tenantId,
        filter.dateRange,
        filter.locationId,
      );
      return { ok: true, data: computeRetentionMetrics(bookings, filter) };
    } catch (err) {
      return {
        ok: false,
        code: "QUERY_ERROR",
        message: err instanceof Error ? err.message : "Query failed",
      };
    }
  }

  async function getRebookingReport(
    filter: AnalyticsFilter,
    actorRole: TenantUserRole,
  ): Promise<ReportingResult<RebookingMetrics>> {
    if (REPORTING_FORBIDDEN_ROLES.includes(actorRole)) {
      return { ok: false, code: "FORBIDDEN", message: "Your role does not have reporting access" };
    }
    if (!filter.tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }
    try {
      const bookings = await analyticsRepository.fetchCompletedBookings(
        filter.tenantId,
        filter.dateRange,
        filter.locationId,
      );
      return { ok: true, data: computeRebookingMetrics(bookings, filter) };
    } catch (err) {
      return {
        ok: false,
        code: "QUERY_ERROR",
        message: err instanceof Error ? err.message : "Query failed",
      };
    }
  }

  async function getAtRiskReport(
    tenantId: string,
    thresholdDays: number,
    actorRole: TenantUserRole,
    today?: string,
  ): Promise<ReportingResult<AtRiskMetrics>> {
    if (REPORTING_FORBIDDEN_ROLES.includes(actorRole)) {
      return { ok: false, code: "FORBIDDEN", message: "Your role does not have reporting access" };
    }
    if (!tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }
    try {
      const bookings = await analyticsRepository.fetchAllBookingsByTenant(tenantId, analyticsLookbackSince());
      return { ok: true, data: computeAtRiskMetrics(bookings, tenantId, thresholdDays, today) };
    } catch (err) {
      return {
        ok: false,
        code: "QUERY_ERROR",
        message: err instanceof Error ? err.message : "Query failed",
      };
    }
  }

  async function getVisitIntervalReport(
    tenantId: string,
    actorRole: TenantUserRole,
  ): Promise<ReportingResult<VisitIntervalMetrics>> {
    if (REPORTING_FORBIDDEN_ROLES.includes(actorRole)) {
      return { ok: false, code: "FORBIDDEN", message: "Your role does not have reporting access" };
    }
    if (!tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }
    try {
      const bookings = await analyticsRepository.fetchAllBookingsByTenant(tenantId, analyticsLookbackSince());
      return { ok: true, data: computeVisitIntervalMetrics(bookings, tenantId) };
    } catch (err) {
      return {
        ok: false,
        code: "QUERY_ERROR",
        message: err instanceof Error ? err.message : "Query failed",
      };
    }
  }

  async function getStaffPerformanceReport(
    filter: AnalyticsFilter,
    actorRole: TenantUserRole,
  ): Promise<ReportingResult<StaffPerformanceMetrics[]>> {
    if (REPORTING_FORBIDDEN_ROLES.includes(actorRole)) {
      return { ok: false, code: "FORBIDDEN", message: "Your role does not have reporting access" };
    }
    if (!filter.tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }
    try {
      const bookings = await analyticsRepository.fetchAllBookingsByTenant(filter.tenantId, analyticsLookbackSince());
      return { ok: true, data: computeStaffPerformance(bookings, filter) };
    } catch (err) {
      return {
        ok: false,
        code: "QUERY_ERROR",
        message: err instanceof Error ? err.message : "Query failed",
      };
    }
  }

  async function getServicePerformanceReport(
    filter: AnalyticsFilter,
    actorRole: TenantUserRole,
  ): Promise<ReportingResult<ServicePerformanceMetrics[]>> {
    if (REPORTING_FORBIDDEN_ROLES.includes(actorRole)) {
      return { ok: false, code: "FORBIDDEN", message: "Your role does not have reporting access" };
    }
    if (!filter.tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }
    try {
      const bookings = await analyticsRepository.fetchAllBookingsByTenant(filter.tenantId, analyticsLookbackSince());
      return { ok: true, data: computeServicePerformance(bookings, filter) };
    } catch (err) {
      return {
        ok: false,
        code: "QUERY_ERROR",
        message: err instanceof Error ? err.message : "Query failed",
      };
    }
  }

  async function getClientAttentionList(
    tenantId: string,
    actorRole: TenantUserRole,
    today?: string,
  ): Promise<ReportingResult<ClientRiskEntry[]>> {
    if (REPORTING_FORBIDDEN_ROLES.includes(actorRole)) {
      return { ok: false, code: "FORBIDDEN", message: "Your role does not have reporting access" };
    }
    if (!tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }
    try {
      const bookings = await analyticsRepository.fetchAllBookingsByTenant(tenantId, analyticsLookbackSince());
      return { ok: true, data: buildClientAttentionList(bookings, tenantId, today) };
    } catch (err) {
      return {
        ok: false,
        code: "QUERY_ERROR",
        message: err instanceof Error ? err.message : "Query failed",
      };
    }
  }

  return {
    getTenantAnalyticsContext,
    getRetentionReport,
    getRebookingReport,
    getAtRiskReport,
    getVisitIntervalReport,
    getStaffPerformanceReport,
    getServicePerformanceReport,
    getClientAttentionList,
  };
}

export type ReportingService = ReturnType<typeof createReportingService>;
