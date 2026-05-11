/**
 * W45 — Campaign & Promotions Admin domain model
 *
 * Admin-facing types for Campaign List/Builder/Performance,
 * Transactional Template overrides, and Promo Code management.
 */

// ---------------------------------------------------------------------------
// Shared result wrapper
// ---------------------------------------------------------------------------

export type CampaignAdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

// ---------------------------------------------------------------------------
// Campaign list & builder
// ---------------------------------------------------------------------------

export type CampaignListEntry = {
  campaignId: string;
  name: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "cancelled";
  channel: "email" | "sms" | "push";
  segmentName: string;
  scheduledAt: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
};

export type CampaignBuilderInput = {
  tenantId: string;
  name: string;
  channel: "email" | "sms" | "push";
  segmentId: string;
  segmentName: string;
  /** Required when channel === "email" */
  subject?: string;
  body: string;
  scheduledAt: string;
  abEnabled: boolean;
  abVariantB?: string;
  sendTimeOptimization: boolean;
  createdBy: string;
};

// ---------------------------------------------------------------------------
// Compliance check
// ---------------------------------------------------------------------------

export type ComplianceCheckItem = {
  itemId: string;
  label: string;
  passed: boolean;
  detail?: string;
};

// ---------------------------------------------------------------------------
// Campaign performance
// ---------------------------------------------------------------------------

export type HourlyDeliveryEntry = {
  hour: string;
  delivered: number;
};

export type CampaignMetricsDetail = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  failed: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
};

export type CampaignPerformanceDetail = {
  campaignId: string;
  name: string;
  channel: "email" | "sms" | "push";
  status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "cancelled";
  scheduledAt: string;
  completedAt?: string;
  metrics: CampaignMetricsDetail;
  hourlyDelivery: HourlyDeliveryEntry[];
};

// ---------------------------------------------------------------------------
// Transactional templates
// ---------------------------------------------------------------------------

export type TransactionalTemplateType =
  | "booking_confirmation"
  | "booking_reminder"
  | "no_show"
  | "cancellation"
  | "receipt"
  | "password_reset";

export type TransactionalTemplateChannel = "email" | "sms" | "push";

export type TransactionalTemplateDefault = {
  templateType: TransactionalTemplateType;
  channel: TransactionalTemplateChannel;
  /** Present when channel === "email" */
  subject?: string;
  body: string;
  variables: string[];
};

export type TransactionalTemplateOverride = {
  overrideId: string;
  tenantId: string;
  templateType: TransactionalTemplateType;
  channel: TransactionalTemplateChannel;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------

export type PromoCodeType = "percent" | "fixed" | "free_service";

export type PromoCodeStatus = "active" | "paused" | "expired" | "depleted";

export type PromoCode = {
  codeId: string;
  tenantId: string;
  code: string;
  type: PromoCodeType;
  value: number;
  description: string;
  status: PromoCodeStatus;
  applicableServiceIds: string[];
  validFrom: string;
  /** null = no expiry */
  validUntil: string | null;
  /** null = unlimited */
  maxUses: number | null;
  /** null = no per-client cap */
  perClientCap: number | null;
  usesCount: number;
  createdBy: string;
  createdAt: string;
};

export type PromoCodeCreateInput = {
  tenantId: string;
  code: string;
  type: PromoCodeType;
  /** Must be > 0 */
  value: number;
  description: string;
  validFrom: string;
  validUntil: string | null;
  maxUses: number | null;
  perClientCap: number | null;
  createdBy: string;
};
