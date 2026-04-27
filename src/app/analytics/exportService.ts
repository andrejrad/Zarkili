/**
 * Export service — secure CSV/JSON downloads with RBAC, metadata, and pagination.
 *
 * Access policy
 * ─────────────
 * tenant_owner / tenant_admin  — full tenant export
 * location_manager             — must specify locationId; scoped to that location only
 * technician / client          — forbidden (FORBIDDEN error)
 */

import { computeCampaignKpisBatch } from "../../domains/analytics/campaignMetricsService";
import { buildClientAttentionList } from "../../domains/analytics/metricsService";
import type { AnalyticsRepository } from "../../domains/analytics/analyticsRepository";
import type { TenantUserRole } from "../../domains/tenants/tenantUsersModel";
import type {
  AnalyticsFilter,
  CampaignKpis,
  ClientRiskEntry,
  ExportFormat,
  ExportMetadata,
  ExportResult,
} from "../../domains/analytics/model";
import type { Booking } from "../../domains/bookings/model";

// ---------------------------------------------------------------------------
// RBAC configuration
// ---------------------------------------------------------------------------

const EXPORT_ALLOWED_ROLES: TenantUserRole[] = [
  "tenant_owner",
  "tenant_admin",
  "location_manager",
];

const DEFAULT_PAGE_SIZE = 500;

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type ExportAccessResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

// ---------------------------------------------------------------------------
// Format serialisers
// ---------------------------------------------------------------------------

const BOOKING_CSV_HEADERS: (keyof Booking)[] = [
  "bookingId",
  "tenantId",
  "locationId",
  "staffId",
  "serviceId",
  "customerUserId",
  "date",
  "status",
];

function bookingsToCsv(bookings: Booking[]): string {
  const header = BOOKING_CSV_HEADERS.join(",");
  if (bookings.length === 0) return `${header}\n`;
  const rows = bookings.map((b) =>
    BOOKING_CSV_HEADERS.map((key) => {
      const value = b[key];
      const str = value === null || value === undefined ? "" : String(value);
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(","),
  );
  return [header, ...rows].join("\n");
}

function toJson(data: unknown[]): string {
  return JSON.stringify(data, null, 2);
}

// ---------------------------------------------------------------------------
// Campaign KPI serialisers
// ---------------------------------------------------------------------------

const CAMPAIGN_KPI_CSV_HEADERS: (keyof CampaignKpis)[] = [
  "campaignId",
  "name",
  "channel",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "converted",
  "failed",
  "openRate",
  "clickRate",
  "conversionRate",
];

function campaignKpisToCsv(rows: CampaignKpis[]): string {
  const header = CAMPAIGN_KPI_CSV_HEADERS.join(",");
  if (rows.length === 0) return `${header}\n`;
  const lines = rows.map((r) =>
    CAMPAIGN_KPI_CSV_HEADERS.map((key) => {
      const value = r[key];
      const str = value === null || value === undefined ? "" : String(value);
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(","),
  );
  return [header, ...lines].join("\n");
}

// ---------------------------------------------------------------------------
// Client attention list serialisers
// ---------------------------------------------------------------------------

const CLIENT_RISK_CSV_HEADERS: (keyof ClientRiskEntry)[] = [
  "userId",
  "lastVisitDate",
  "daysSinceLastVisit",
  "riskLevel",
  "totalVisits",
];

function clientRiskEntriesToCsv(rows: ClientRiskEntry[]): string {
  const header = CLIENT_RISK_CSV_HEADERS.join(",");
  if (rows.length === 0) return `${header}\n`;
  const lines = rows.map((r) =>
    CLIENT_RISK_CSV_HEADERS.map((key) => {
      const value = r[key];
      const str = value === null || value === undefined ? "" : String(value);
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(","),
  );
  return [header, ...lines].join("\n");
}

// ---------------------------------------------------------------------------
// Audit event
// ---------------------------------------------------------------------------

export type ExportAuditEvent = {
  method: "exportBookings" | "exportCampaignKpis" | "exportClientAttentionList";
  actorRole: TenantUserRole;
  tenantId: string;
  format: ExportFormat;
  filter: AnalyticsFilter;
  rowCount: number;
  generatedAt: string;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createExportService(
  analyticsRepository: AnalyticsRepository,
  logAuditEvent?: (event: ExportAuditEvent) => void,
) {
  async function exportBookings(opts: {
    actorRole: TenantUserRole;
    filter: AnalyticsFilter;
    format: ExportFormat;
    page?: number;
    pageSize?: number;
  }): Promise<ExportAccessResult<ExportResult<Booking>>> {
    if (!EXPORT_ALLOWED_ROLES.includes(opts.actorRole)) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Your role does not have export access",
      };
    }

    if (opts.actorRole === "location_manager" && !opts.filter.locationId) {
      return {
        ok: false,
        code: "LOCATION_REQUIRED",
        message: "Location managers must specify a locationId for export",
      };
    }

    if (!opts.filter.tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }

    try {
      const page = Math.max(1, opts.page ?? 1);
      const pageSize = Math.max(1, opts.pageSize ?? DEFAULT_PAGE_SIZE);

      const allBookings = await analyticsRepository.fetchCompletedBookings(
        opts.filter.tenantId,
        opts.filter.dateRange,
        opts.filter.locationId,
      );

      const start = (page - 1) * pageSize;
      const pageData = allBookings.slice(start, start + pageSize);
      const hasMore = start + pageSize < allBookings.length;

      const metadata: ExportMetadata = {
        tenantId: opts.filter.tenantId,
        generatedAt: new Date().toISOString(),
        format: opts.format,
        filterApplied: opts.filter,
        rowCount: pageData.length,
        page,
        pageSize,
        hasMore,
      };

      const formatted =
        opts.format === "csv" ? bookingsToCsv(pageData) : toJson(pageData);

      logAuditEvent?.({
        method: "exportBookings",
        actorRole: opts.actorRole,
        tenantId: opts.filter.tenantId,
        format: opts.format,
        filter: opts.filter,
        rowCount: pageData.length,
        generatedAt: metadata.generatedAt,
      });

      return { ok: true, data: { data: pageData, metadata, formatted } };
    } catch (err) {
      return {
        ok: false,
        code: "EXPORT_ERROR",
        message: err instanceof Error ? err.message : "Export failed",
      };
    }
  }

  async function exportCampaignKpis(opts: {
    actorRole: TenantUserRole;
    filter: AnalyticsFilter;
    format: ExportFormat;
    page?: number;
    pageSize?: number;
  }): Promise<ExportAccessResult<ExportResult<CampaignKpis>>> {
    if (!EXPORT_ALLOWED_ROLES.includes(opts.actorRole)) {
      return { ok: false, code: "FORBIDDEN", message: "Your role does not have export access" };
    }
    if (opts.actorRole === "location_manager" && !opts.filter.locationId) {
      return { ok: false, code: "LOCATION_REQUIRED", message: "Location managers must specify a locationId for export" };
    }
    if (!opts.filter.tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }

    try {
      const page = Math.max(1, opts.page ?? 1);
      const pageSize = Math.max(1, opts.pageSize ?? DEFAULT_PAGE_SIZE);

      const campaigns = await analyticsRepository.fetchCampaigns(opts.filter.tenantId);
      const allKpis = computeCampaignKpisBatch(campaigns);

      const start = (page - 1) * pageSize;
      const pageData = allKpis.slice(start, start + pageSize);
      const hasMore = start + pageSize < allKpis.length;

      const metadata: ExportMetadata = {
        tenantId: opts.filter.tenantId,
        generatedAt: new Date().toISOString(),
        format: opts.format,
        filterApplied: opts.filter,
        rowCount: pageData.length,
        page,
        pageSize,
        hasMore,
      };

      const formatted = opts.format === "csv" ? campaignKpisToCsv(pageData) : toJson(pageData);

      logAuditEvent?.({
        method: "exportCampaignKpis",
        actorRole: opts.actorRole,
        tenantId: opts.filter.tenantId,
        format: opts.format,
        filter: opts.filter,
        rowCount: pageData.length,
        generatedAt: metadata.generatedAt,
      });

      return { ok: true, data: { data: pageData, metadata, formatted } };
    } catch (err) {
      return {
        ok: false,
        code: "EXPORT_ERROR",
        message: err instanceof Error ? err.message : "Export failed",
      };
    }
  }

  async function exportClientAttentionList(opts: {
    actorRole: TenantUserRole;
    filter: AnalyticsFilter;
    format: ExportFormat;
    page?: number;
    pageSize?: number;
  }): Promise<ExportAccessResult<ExportResult<ClientRiskEntry>>> {
    if (!EXPORT_ALLOWED_ROLES.includes(opts.actorRole)) {
      return { ok: false, code: "FORBIDDEN", message: "Your role does not have export access" };
    }
    if (opts.actorRole === "location_manager" && !opts.filter.locationId) {
      return { ok: false, code: "LOCATION_REQUIRED", message: "Location managers must specify a locationId for export" };
    }
    if (!opts.filter.tenantId) {
      return { ok: false, code: "TENANT_REQUIRED", message: "Tenant ID is required" };
    }

    try {
      const page = Math.max(1, opts.page ?? 1);
      const pageSize = Math.max(1, opts.pageSize ?? DEFAULT_PAGE_SIZE);

      const bookings = await analyticsRepository.fetchAllBookingsByTenant(
        opts.filter.tenantId,
        new Date(Date.now() - 730 * 86_400_000).toISOString().slice(0, 10),
      );
      const allEntries = buildClientAttentionList(bookings, opts.filter.tenantId);

      const start = (page - 1) * pageSize;
      const pageData = allEntries.slice(start, start + pageSize);
      const hasMore = start + pageSize < allEntries.length;

      const metadata: ExportMetadata = {
        tenantId: opts.filter.tenantId,
        generatedAt: new Date().toISOString(),
        format: opts.format,
        filterApplied: opts.filter,
        rowCount: pageData.length,
        page,
        pageSize,
        hasMore,
      };

      const formatted = opts.format === "csv" ? clientRiskEntriesToCsv(pageData) : toJson(pageData);

      logAuditEvent?.({
        method: "exportClientAttentionList",
        actorRole: opts.actorRole,
        tenantId: opts.filter.tenantId,
        format: opts.format,
        filter: opts.filter,
        rowCount: pageData.length,
        generatedAt: metadata.generatedAt,
      });

      return { ok: true, data: { data: pageData, metadata, formatted } };
    } catch (err) {
      return {
        ok: false,
        code: "EXPORT_ERROR",
        message: err instanceof Error ? err.message : "Export failed",
      };
    }
  }

  return { exportBookings, exportCampaignKpis, exportClientAttentionList };
}

export type ExportService = ReturnType<typeof createExportService>;
