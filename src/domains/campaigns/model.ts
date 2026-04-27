/**
 * Campaigns domain model
 *
 * Campaigns are tenant-scoped marketing messages sent to a specific segment
 * via a chosen channel (email, SMS, push).
 *
 * Lifecycle: draft → scheduled → sending → completed | paused | cancelled
 *
 * Subscription gating (to be enforced in Week 14):
 *   The requiredSubscriptionTier field stores the minimum tier at creation time.
 */

import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Enums / literals
// ---------------------------------------------------------------------------

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "completed"
  | "paused"
  | "cancelled";

export type CampaignChannel = "email" | "sms" | "push";

export type CampaignSubscriptionTier = "starter" | "professional" | "enterprise";

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

/** Stored at tenants/{tenantId}/campaigns/{campaignId} */
export type Campaign = {
  campaignId: string;
  tenantId: string;
  name: string;
  channel: CampaignChannel;
  /** References a segment (e.g. "at_risk_30d") */
  segmentId: string;
  /** References a message template */
  templateId: string;
  status: CampaignStatus;
  /** ISO date-time when the campaign should be dispatched */
  scheduledAt: string;
  /** Minimum subscription tier required to send this campaign (gated in Week 14) */
  requiredSubscriptionTier: CampaignSubscriptionTier;
  createdBy: string;
  createdAt: Timestamp | { _type: string };
  updatedAt: Timestamp | { _type: string };
  metrics: CampaignMetrics;
};

export type CampaignMetrics = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  /** Bookings completed after clicking (real conversion event); 0 when not tracked */
  converted: number;
  failed: number;
};

export const EMPTY_METRICS: CampaignMetrics = {
  sent: 0,
  delivered: 0,
  opened: 0,
  clicked: 0,
  converted: 0,
  failed: 0,
};

// ---------------------------------------------------------------------------
// Send log
// ---------------------------------------------------------------------------

/** Stored at tenants/{tenantId}/campaignSendLogs/{logId} */
export type CampaignSendLog = {
  logId: string;
  campaignId: string;
  tenantId: string;
  userId: string;
  status: "sent" | "failed" | "delivered" | "opened" | "clicked";
  channel: CampaignChannel;
  timestamp: Timestamp | { _type: string };
  errorCode?: string;
  /** True when the recipient produced a desired follow-up action (e.g., booking). */
  converted?: boolean;
  /** Identifier of the conversion event (typically bookingId). */
  conversionRef?: string;
  /** Timestamp the conversion was attributed. */
  convertedAt?: Timestamp | { _type: string };
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type CampaignErrorCode =
  | "CAMPAIGN_NOT_FOUND"
  | "TENANT_REQUIRED"
  | "INVALID_STATUS_TRANSITION"
  | "CAMPAIGN_NOT_SCHEDULED"
  | "SEND_LOG_NOT_FOUND";

export class CampaignError extends Error {
  constructor(
    public readonly code: CampaignErrorCode,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "CampaignError";
  }
}

// ---------------------------------------------------------------------------
// Valid status transitions
// ---------------------------------------------------------------------------

export const VALID_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft:      ["scheduled", "cancelled"],
  scheduled:  ["sending",   "paused", "cancelled"],
  sending:    ["completed", "paused", "cancelled"],
  paused:     ["sending",   "cancelled"],
  completed:  [],
  cancelled:  [],
};

export function isValidTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}
