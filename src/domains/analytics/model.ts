/**
 * Analytics domain model
 *
 * Shared types for retention, rebooking, at-risk, visit-interval,
 * staff/service performance, client attention lists, subscription tier
 * context, campaign/challenge KPIs, AI feature contracts, and exports.
 */

import type { TenantPlan } from "../tenants/model";

// ---------------------------------------------------------------------------
// Date range & filter
// ---------------------------------------------------------------------------

export type AnalyticsDateRange = {
  /** "YYYY-MM-DD" inclusive */
  start: string;
  /** "YYYY-MM-DD" inclusive */
  end: string;
};

export type AnalyticsFilter = {
  tenantId: string;
  dateRange: AnalyticsDateRange;
  locationId?: string;
  staffId?: string;
};

// ---------------------------------------------------------------------------
// Core booking metrics
// ---------------------------------------------------------------------------

export type RetentionMetrics = {
  totalUniqueClients: number;
  /** Clients who visited on ≥ 2 distinct dates in the window */
  retainedClients: number;
  /** 0–1; 0 when no clients exist */
  retentionRate: number;
};

export type RebookingMetrics = {
  totalUniqueClients: number;
  /** Clients with ≥ 2 completed bookings in the window */
  rebookedClients: number;
  /** 0–1 */
  rebookingRate: number;
};

export type AtRiskMetrics = {
  /** Count of clients whose last visit was > thresholdDays ago */
  atRiskClients: number;
  thresholdDays: number;
};

export type VisitIntervalMetrics = {
  /** Mean of per-client average intervals; null when < 2 visits exist */
  avgDaysBetweenVisits: number | null;
  medianDaysBetweenVisits: number | null;
};

export type StaffPerformanceMetrics = {
  staffId: string;
  completedBookings: number;
  noShowCount: number;
  cancellationCount: number;
  /** 0–1 */
  noShowRate: number;
};

export type ServicePerformanceMetrics = {
  serviceId: string;
  completedBookings: number;
  cancellationCount: number;
  /** 1-indexed; 1 = most popular */
  popularityRank: number;
};

export type ClientRiskLevel = "high" | "medium" | "low";

export type ClientRiskEntry = {
  userId: string;
  /** "YYYY-MM-DD" */
  lastVisitDate: string;
  daysSinceLastVisit: number;
  /** high >90 d, medium 60–90 d, low 30–60 d */
  riskLevel: ClientRiskLevel;
  totalVisits: number;
};

// ---------------------------------------------------------------------------
// Subscription tier context
// ---------------------------------------------------------------------------

export type ReportKey =
  | "retention"
  | "rebooking"
  | "at_risk"
  | "visit_interval"
  | "staff_performance"
  | "service_performance"
  | "campaign_analytics"
  | "challenge_analytics"
  | "export";

export type TenantAnalyticsContext = {
  tenantId: string;
  subscriptionTier: TenantPlan;
  accessibleReports: ReportKey[];
};

// ---------------------------------------------------------------------------
// Campaign & challenge KPIs
// ---------------------------------------------------------------------------

export type CampaignKpis = {
  campaignId: string;
  name: string;
  channel: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  /** Bookings completed after clicking (real conversion event); 0 when not tracked */
  converted: number;
  failed: number;
  /** opened / delivered; 0 when delivered = 0 */
  openRate: number;
  /** clicked / delivered; 0 when delivered = 0 */
  clickRate: number;
  /** clicked / sent (proxy for conversion); 0 when sent = 0 */
  conversionRate: number;
};

export type ChallengeKpis = {
  activityId: string;
  name: string;
  participants: number;
  completed: number;
  /** 0–1 */
  completionRate: number;
  rewardsAwarded: number;
};

// ---------------------------------------------------------------------------
// AI feature store contracts
// ---------------------------------------------------------------------------

export type ConfidenceLevel = "high" | "medium" | "low";

export type ExplainabilityMeta = {
  reasonCodes: string[];
  confidence: ConfidenceLevel;
  sourceSignals: string[];
};

export type DataQualityFlag = {
  field: string;
  issue: "missing" | "stale" | "out_of_range";
  severity: "warning" | "error";
};

export type ConsentFilter = {
  requireExplicitConsent: boolean;
  excludeOptedOut: boolean;
  datasetScope: "analytics_only" | "messaging" | "full";
};

export type SchedulingFeatureVector = {
  userId: string;
  tenantId: string;
  /** 0 = Sunday … 6 = Saturday */
  preferredDayOfWeek: number[];
  preferredTimeSlot: string[];
  avgLeadHours: number;
  noShowRate: number;
  explainability: ExplainabilityMeta;
};

export type RetentionFeatureVector = {
  userId: string;
  tenantId: string;
  daysSinceLastVisit: number;
  totalVisits: number;
  avgVisitIntervalDays: number | null;
  loyaltyPoints: number;
  /** 0–1 */
  churnRiskScore: number;
  explainability: ExplainabilityMeta;
};

export type NoShowRiskFeatureVector = {
  userId: string;
  tenantId: string;
  bookingId: string;
  historicalNoShowRate: number;
  daysTillAppointment: number;
  hasReceivedReminder: boolean;
  /** 0–1 */
  noShowRiskScore: number;
  explainability: ExplainabilityMeta;
};

export type MarketplacePersonalizationVector = {
  userId: string;
  tenantId: string;
  preferredServiceIds: string[];
  preferredStaffIds: string[];
  avgSpend: number;
  explainability: ExplainabilityMeta;
};

export type AiFeatureContract<T> = {
  version: string;
  schema: string;
  contract: T;
  qualityFlags: DataQualityFlag[];
  consentFilter: ConsentFilter;
};

// ---------------------------------------------------------------------------
// Export (Task 11.5)
// ---------------------------------------------------------------------------

export type ExportFormat = "csv" | "json";

export type ExportMetadata = {
  tenantId: string;
  /** ISO timestamp */
  generatedAt: string;
  format: ExportFormat;
  filterApplied: AnalyticsFilter;
  rowCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type ExportResult<T> = {
  data: T[];
  metadata: ExportMetadata;
  /** Serialised CSV or JSON string ready for download */
  formatted: string;
};
