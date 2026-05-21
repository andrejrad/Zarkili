// ---------------------------------------------------------------------------
// W49 — Platform Super-Admin types
// ---------------------------------------------------------------------------

// ---- Tenant Directory ----

export type TenantStatus = "active" | "trial" | "suspended" | "churned";

export type TenantPlan = "free_trial" | "starter" | "professional" | "enterprise";

export type TenantRecord = {
  tenantId: string;
  name: string;
  displayName?: string; // legacy alias kept for backward compat
  ownerEmail: string;
  plan: TenantPlan | string; // allow arbitrary plan slugs
  status: TenantStatus;
  createdAt: string;
  locationCount: number;
  staffCount: number;
  healthScore?: number;
  supportNotes?: string;
  lastActivityAt?: string;
  suspendedAt?: string;
  suspendReason?: string;
};

export type TenantFilter = {
  status?: TenantStatus;
  plan?: TenantPlan;
  query?: string;
};

// ---- Cross-Tenant Analytics ----

export type CrossTenantKpi = {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalRevenueMtdUsd: number;
  avgHealthScore: number;
  newTenantsThisMonth: number;
  churnedThisMonth: number;
};

// ---- Platform Health ----

export type HealthSignalStatus = "healthy" | "degraded" | "down";

export type PlatformHealthSignal = {
  signalId?: string;
  service: string;
  status: HealthSignalStatus;
  latencyMs?: number;
  errorRate?: number;
  checkedAt: string;
  note?: string;
};

// ---- Pricing Plans ----

export type PricingPlan = {
  planId: TenantPlan;
  displayName: string;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  maxLocations: number;
  maxStaff: number;
  maxMonthlyAiCallsUsd: number;
  features: string[];
  isActive: boolean;
};

// ---- Feature Flags ----

export type FeatureFlagScope = "platform" | "tenant";

export type FeatureFlag = {
  flagKey: string;
  label: string;
  description?: string;
  scope: FeatureFlagScope;
  tenantId?: string;
  enabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
};

// ---- Platform Audit Log ----

export type PlatformAuditActorKind = "platform_admin" | "system" | "tenant_owner";

export type PlatformAuditEntry = {
  entryId: string;
  actorId: string;
  actorKind: PlatformAuditActorKind;
  action: string;
  targetKind: "tenant" | "user" | "plan" | "flag" | "platform" | "migration";
  targetId: string;
  detail?: string;
  occurredAt: string;
};

export type PlatformAuditFilter = {
  actorKind?: PlatformAuditActorKind;
  targetKind?: PlatformAuditEntry["targetKind"];
  dateFrom?: string;
  dateTo?: string;
  query?: string;
};

// ---- Marketplace Moderation ----

export type ModerationItemStatus = "pending" | "flagged" | "cleared" | "removed";

export type ModerationQueueItem = {
  itemId: string;
  tenantId: string;
  tenantName: string;
  postId: string;
  postTitle: string;
  postDescription: string;
  mediaUrl?: string;
  priceUsd: number;
  submittedAt: string;
  status: ModerationItemStatus;
  flagReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

// ---- Cross-Tenant AI Budget ----

export type TenantAiBudgetOverride = {
  tenantId: string;
  tenantName: string;
  platformCapUsd: number;
  currentSpendMtdUsd: number;
  overriddenAt?: string;
  overriddenBy?: string;
};

// ---- Migration Runner ----

export type MigrationJobStatus = "pending" | "running" | "completed" | "failed";

export type MigrationJob = {
  jobId: string;
  name: string;
  description: string;
  status: MigrationJobStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  progressPct?: number;
  errorMessage?: string;
  affectedTenants?: number;
};

// ---- Backup / Restore ----

export type BackupJobStatus = "scheduled" | "running" | "completed" | "failed";

export type BackupJob = {
  jobId: string;
  scope: "full" | "incremental";
  status: BackupJobStatus;
  startedAt?: string;
  completedAt?: string;
  sizeBytes?: number;
  storagePath?: string;
  errorMessage?: string;
};

// ---- Impersonation ----

export type ImpersonationSession = {
  sessionId: string;
  platformAdminId: string;
  targetTenantId: string;
  targetUserId: string;
  targetUserEmail: string;
  reason: string;
  startedAt: string;
  expiresAt: string; // 30-min cap
  endedAt?: string;
  active: boolean;
};

// ---- Security Events ----

export type SecurityEventKind =
  | "failed_login"
  | "unusual_access"
  | "impersonation_start"
  | "impersonation_end"
  | "permission_escalation"
  | "data_export"
  | "bulk_delete"
  | "api_abuse";

export type SecurityEventSeverity = "low" | "medium" | "high" | "critical";

export type SecurityEvent = {
  eventId: string;
  kind: SecurityEventKind;
  severity: SecurityEventSeverity;
  actorId: string;
  actorEmail?: string;
  tenantId?: string;
  detail?: string;
  description?: string; // alias field used in some contexts
  occurredAt: string;
  resolved: boolean;
  resolvedAt?: string;
};

export type SecurityEventFilter = {
  kind?: SecurityEventKind;
  severity?: SecurityEventSeverity;
  resolved?: boolean;
  tenantId?: string;
};

// ---- GDPR Data Export Requests ----

export type DataExportRequestStatus = "pending" | "processing" | "ready" | "delivered" | "expired";

export type DataExportRequest = {
  requestId: string;
  tenantId: string;
  requestingUserId: string;
  requestingUserEmail: string;
  status: DataExportRequestStatus;
  submittedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
};

// ---- Consent / Policy Log ----

export type ConsentPolicyEntry = {
  entryId: string;
  userId: string;
  userEmail: string;
  tenantId: string;
  policyVersion: string;
  consentGivenAt: string;
  consentWithdrawnAt?: string;
  active: boolean;
};

// ---- Incident Response ----

export type IncidentSeverity = "P1" | "P2" | "P3" | "P4" | "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "investigating" | "mitigated" | "resolved";

export type IncidentRecord = {
  incidentId: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  affectedServices?: string[];
  affectedTenants?: string[];
  mitigationNotes?: string;
  ownerEmail?: string;
};
