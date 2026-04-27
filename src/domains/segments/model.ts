/**
 * Segments domain model
 *
 * A Segment is a named cohort of customers derived from booking/activity data.
 * Segments are tenant-scoped and consent-aware — only customers who have
 * opted in to marketing communications appear in segments.
 *
 * Baseline segments (computed on-demand, not persisted):
 *   at_risk_30d         — had bookings, none in last 30 days
 *   inactive_60d        — no bookings in last 60 days
 *   new_customers_30d   — first booking within last 30 days
 *   high_value          — lifetime booking value above the tenant's threshold
 */

import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Segment definitions
// ---------------------------------------------------------------------------

export type BaselineSegmentId =
  | "at_risk_30d"
  | "inactive_60d"
  | "new_customers_30d"
  | "high_value";

export const ALL_BASELINE_SEGMENTS: BaselineSegmentId[] = [
  "at_risk_30d",
  "inactive_60d",
  "new_customers_30d",
  "high_value",
];

/** Criteria snapshot stored with each segment definition */
export type SegmentCriteria = {
  /** Look-back window in days for activity checks */
  lookbackDays: number;
  /** Minimum lifetime booking count to be included */
  minBookingCount?: number;
  /** Minimum lifetime spend (in the tenant's currency units) for high_value */
  minLifetimeSpend?: number;
};

export const BASELINE_SEGMENT_CRITERIA: Record<BaselineSegmentId, SegmentCriteria> = {
  at_risk_30d:       { lookbackDays: 30 },
  inactive_60d:      { lookbackDays: 60 },
  new_customers_30d: { lookbackDays: 30, minBookingCount: 1 },
  high_value:        { lookbackDays: 365, minLifetimeSpend: 500 },
};

// ---------------------------------------------------------------------------
// Segment result
// ---------------------------------------------------------------------------

export type SegmentResult = {
  tenantId: string;
  segmentId: BaselineSegmentId;
  customerIds: string[];
  count: number;
  /** ISO timestamp of when this result was computed */
  computedAt: string;
};

// ---------------------------------------------------------------------------
// Customer marketing consent
// ---------------------------------------------------------------------------

/** Stored in Firestore at tenants/{tenantId}/marketingConsent/{userId} */
export type MarketingConsent = {
  userId: string;
  tenantId: string;
  /** Has the customer opted in to marketing communications for this tenant */
  optedIn: boolean;
  updatedAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Customer booking summary (input to segment computation)
// ---------------------------------------------------------------------------

/** Lightweight booking record used for segment evaluation — no PII beyond userId */
export type BookingSummary = {
  userId: string;
  /** ISO date string "YYYY-MM-DD" */
  date: string;
  /** Amount paid for this booking */
  amount: number;
  status: "completed" | "cancelled" | "no_show" | string;
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type SegmentErrorCode = "INVALID_SEGMENT" | "TENANT_REQUIRED";

export class SegmentError extends Error {
  constructor(
    public readonly code: SegmentErrorCode,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "SegmentError";
  }
}

// ---------------------------------------------------------------------------
// Pure computation helpers
// ---------------------------------------------------------------------------

/**
 * Compute the at_risk_30d segment.
 * Customers who have at least one completed booking historically,
 * but none within the last `lookbackDays` days.
 */
export function computeAtRiskSegment(
  bookings: BookingSummary[],
  consentedUserIds: Set<string>,
  nowIso: string,
  lookbackDays: number,
): string[] {
  const cutoff = subtractDays(nowIso, lookbackDays);
  const hasCompleted    = new Set<string>();
  const hasRecentBooked = new Set<string>();

  for (const b of bookings) {
    if (b.status === "completed") {
      hasCompleted.add(b.userId);
      if (b.date >= cutoff) hasRecentBooked.add(b.userId);
    }
  }

  return [...hasCompleted]
    .filter((id) => !hasRecentBooked.has(id) && consentedUserIds.has(id));
}

/**
 * Compute the inactive_60d segment.
 * Customers with no bookings (any status) in the last `lookbackDays` days
 * but who have at least one booking ever.
 */
export function computeInactiveSegment(
  bookings: BookingSummary[],
  consentedUserIds: Set<string>,
  nowIso: string,
  lookbackDays: number,
): string[] {
  const cutoff = subtractDays(nowIso, lookbackDays);
  const everBooked    = new Set<string>();
  const recentlyBooked = new Set<string>();

  for (const b of bookings) {
    everBooked.add(b.userId);
    if (b.date >= cutoff) recentlyBooked.add(b.userId);
  }

  return [...everBooked]
    .filter((id) => !recentlyBooked.has(id) && consentedUserIds.has(id));
}

/**
 * Compute the new_customers_30d segment.
 * Customers whose very first completed booking falls within the last `lookbackDays` days.
 */
export function computeNewCustomersSegment(
  bookings: BookingSummary[],
  consentedUserIds: Set<string>,
  nowIso: string,
  lookbackDays: number,
): string[] {
  const cutoff = subtractDays(nowIso, lookbackDays);
  const firstCompleted = new Map<string, string>(); // userId → earliest completed date

  for (const b of bookings) {
    if (b.status !== "completed") continue;
    const prev = firstCompleted.get(b.userId);
    if (prev === undefined || b.date < prev) {
      firstCompleted.set(b.userId, b.date);
    }
  }

  const result: string[] = [];
  for (const [userId, firstDate] of firstCompleted) {
    if (firstDate >= cutoff && consentedUserIds.has(userId)) {
      result.push(userId);
    }
  }
  return result;
}

/**
 * Compute the high_value segment.
 * Customers whose total spend on completed bookings exceeds `minLifetimeSpend`.
 */
export function computeHighValueSegment(
  bookings: BookingSummary[],
  consentedUserIds: Set<string>,
  minLifetimeSpend: number,
): string[] {
  const spendByUser = new Map<string, number>();

  for (const b of bookings) {
    if (b.status !== "completed") continue;
    spendByUser.set(b.userId, (spendByUser.get(b.userId) ?? 0) + b.amount);
  }

  const result: string[] = [];
  for (const [userId, spend] of spendByUser) {
    if (spend >= minLifetimeSpend && consentedUserIds.has(userId)) {
      result.push(userId);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Date utility (avoids pulling in date-fns for a single operation)
// ---------------------------------------------------------------------------

/** Returns an ISO date string `days` before `isoDate` (YYYY-MM-DD). */
export function subtractDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
