/**
 * W46 — messagingAdminModel
 *
 * Domain types for admin messaging surfaces: inbox triage, thread assignment,
 * canned replies, auto-reply configuration, message archive / search, and
 * block/report from inbox.
 *
 * These are ADMIN surfaces.  Consumer messaging types live in
 * src/app/messaging/messagingHelpers.ts.
 */

// ---------------------------------------------------------------------------
// Admin thread view
// ---------------------------------------------------------------------------

export type AdminThreadStatus = "open" | "assigned" | "resolved" | "archived";

export type AdminThread = {
  threadId: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  subject: string | null;
  lastMessage: string;
  lastMessageAt: string; // ISO datetime
  unreadCount: number;
  messageCount: number;
  status: AdminThreadStatus;
  isAutoReplied: boolean;
  tags: string[];
};

// ---------------------------------------------------------------------------
// Thread actions
// ---------------------------------------------------------------------------

export type ThreadAssignInput = {
  threadId: string;
  tenantId: string;
  staffId: string;
  staffName: string;
  assignedBy: string;
};

export type ThreadResolveInput = {
  threadId: string;
  tenantId: string;
  resolvedBy: string;
  note: string | null;
};

export type ThreadArchiveInput = {
  threadId: string;
  tenantId: string;
  archivedBy: string;
};

export type BlockFromInboxInput = {
  threadId: string;
  clientId: string;
  tenantId: string;
  reason: string;
  blockedBy: string;
};

export type ReportFromInboxInput = {
  threadId: string;
  clientId: string;
  tenantId: string;
  reason: string;
  reportedBy: string;
};

// ---------------------------------------------------------------------------
// Canned replies
// ---------------------------------------------------------------------------

export type CannedReply = {
  cannedId: string;
  tenantId: string;
  title: string;
  body: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
};

export type CannedReplyInput = Omit<CannedReply, "cannedId" | "createdAt">;

// ---------------------------------------------------------------------------
// Auto-reply config
// ---------------------------------------------------------------------------

export type AutoReplyDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type AutoReplyConfig = {
  tenantId: string;
  enabled: boolean;
  outsideHoursMessage: string;
  useCustomMessage: boolean;
  openHour: number; // 0–23
  closeHour: number; // 0–23
  enabledDays: AutoReplyDay[];
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Message archive filter
// ---------------------------------------------------------------------------

export type MessageArchiveFilter = {
  clientId?: string;
  staffId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
  status?: AdminThreadStatus;
};

// ---------------------------------------------------------------------------
// Generic result wrapper
// ---------------------------------------------------------------------------

export type MessagingAdminResult<T> = { ok: true; data: T } | { ok: false; message: string };
