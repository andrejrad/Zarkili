/**
 * clientCrmModel.ts — W44 Client / CRM domain types.
 *
 * Sections:
 *  1. Primitive enums / union literals
 *  2. Client list types
 *  3. Client detail types
 *  4. Merge & block types
 *  5. GDPR types
 *  6. Delete types
 *  7. Segment builder types
 *  8. Targeted-message types
 *  9. Generic result wrapper
 */

// ---------------------------------------------------------------------------
// 1. Primitive enums / union literals
// ---------------------------------------------------------------------------

export type ClientStatus = "active" | "blocked" | "deleted";
export type ClientFilter = "all" | "active" | "blocked" | "vip";
export type ClientSavedView = "myClients" | "noShowRisk" | "churned";
export type ClientTier = "bronze" | "silver" | "gold" | "platinum";

// ---------------------------------------------------------------------------
// 2. Client list types
// ---------------------------------------------------------------------------

/** A single row rendered in the admin client list. */
export type ClientListEntry = {
  clientId: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: ClientStatus;
  isVip: boolean;
  tier: ClientTier | null;
  totalBookings: number;
  totalSpendCents: number;
  lastVisitDate: string | null; // ISO-8601 date "YYYY-MM-DD"
  avatarUrl: string | null;
};

// ---------------------------------------------------------------------------
// 3. Client detail types
// ---------------------------------------------------------------------------

export type AllergyEntry = {
  allergyId: string;
  label: string;
  severity: "low" | "medium" | "high" | "critical";
};

export type ConsentRecord = {
  consentId: string;
  type: "marketing" | "data_processing" | "sms" | "email";
  grantedAt: string | null; // ISO-8601 datetime
  revokedAt: string | null; // ISO-8601 datetime
};

export type ClientBookingHistoryEntry = {
  bookingId: string;
  date: string; // ISO-8601 date
  serviceName: string;
  staffName: string;
  status: "completed" | "cancelled" | "no_show";
  amountCents: number;
};

/** Full admin-only profile — extended view of a single client. */
export type ClientDetailAdmin = {
  clientId: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: ClientStatus;
  isVip: boolean;
  tier: ClientTier | null;
  tierPoints: number;
  loyaltyBalance: number; // redeemable points
  totalBookings: number;
  totalSpendCents: number;
  sinceDate: string; // ISO-8601 date — first visit
  avatarUrl: string | null;
  notes: string | null;
  allergies: AllergyEntry[];
  photoUrls: string[];
  consents: ConsentRecord[];
  bookingHistory: ClientBookingHistoryEntry[];
};

export type ClientDetailTab =
  | "history"
  | "preferences"
  | "loyalty"
  | "notes"
  | "allergies"
  | "gallery"
  | "consents";

// ---------------------------------------------------------------------------
// 4. Merge & block types
// ---------------------------------------------------------------------------

/** Lightweight summary used in merge comparison columns. */
export type MergeCandidateSummary = {
  clientId: string;
  name: string;
  phone: string | null;
  email: string | null;
  bookingCount: number;
  loyaltyPoints: number;
};

export type MergeInput = {
  primaryClientId: string;
  duplicateClientId: string;
  reason: string;
  performedBy: string;
  tenantId: string;
};

export type BlockClientReason = "no_show" | "harassment" | "payment" | "other";

export type BlockClientInput = {
  clientId: string;
  tenantId: string;
  reason: BlockClientReason;
  /** null = permanent block. */
  durationDays: number | null;
  performedBy: string;
};

export type UnblockClientInput = {
  clientId: string;
  tenantId: string;
  performedBy: string;
};

// ---------------------------------------------------------------------------
// 5. GDPR types
// ---------------------------------------------------------------------------

export type GdprExportType = "full" | "bookings" | "loyalty";
export type GdprExportFormat = "json" | "csv";
export type GdprExportStatus = "pending" | "processing" | "ready" | "failed";

export type GdprExportRequest = {
  requestId: string;
  clientId: string;
  exportType: GdprExportType;
  format: GdprExportFormat;
  status: GdprExportStatus;
  requestedAt: string; // ISO-8601 datetime
  completedAt: string | null;
  downloadUrl: string | null;
};

export type GdprExportInput = {
  clientId: string;
  tenantId: string;
  exportType: GdprExportType;
  format: GdprExportFormat;
  requestedBy: string;
};

// ---------------------------------------------------------------------------
// 6. Delete types
// ---------------------------------------------------------------------------

export type DeleteClientInput = {
  clientId: string;
  tenantId: string;
  reason: string;
  performedBy: string;
};

// ---------------------------------------------------------------------------
// 7. Segment builder types
// ---------------------------------------------------------------------------

export type SegmentFilterField =
  | "location"
  | "lastVisitDays"
  | "totalSpendCents"
  | "minBookingCount"
  | "baselineSegment"
  | "hasNoShow"
  | "tier"
  | "isVip";

export type SegmentFilterOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "in"
  | "not_in";

export type SegmentFilter = {
  filterId: string; // client-side stable key for list rendering
  field: SegmentFilterField;
  operator: SegmentFilterOperator;
  value: string | number | boolean | string[];
};

export type SegmentBuilderInput = {
  name: string;
  filters: SegmentFilter[];
  tenantId: string;
  createdBy: string;
};

export type SegmentPreview = {
  estimatedCount: number;
  sampleClientIds: string[];
};

export type SavedSegment = {
  segmentId: string;
  name: string;
  filters: SegmentFilter[];
  estimatedCount: number;
  createdAt: string; // ISO-8601 datetime
  createdBy: string;
};

// ---------------------------------------------------------------------------
// 8. Targeted-message types
// ---------------------------------------------------------------------------

export type TargetedMessageChannel = "push" | "sms" | "email";

export type TargetedMessageInput = {
  segmentId: string;
  tenantId: string;
  channel: TargetedMessageChannel;
  subject: string | null; // required for email
  body: string;
  scheduledAt: string | null; // null = send immediately
  sentBy: string;
};

export type TargetedMessageResult = {
  messageId: string;
  recipientCount: number;
  scheduledAt: string | null;
};

// ---------------------------------------------------------------------------
// 9. Generic result wrapper
// ---------------------------------------------------------------------------

export type ClientCrmResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };
