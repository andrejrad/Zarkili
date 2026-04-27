/**
 * Analytics metrics service — pure computation functions.
 *
 * All functions take an array of Booking objects (any source) and return
 * typed metrics.  No Firestore calls — fully testable without mocks.
 *
 * Metric definitions
 * ──────────────────
 * Retention rate   = clients who visited on ≥ 2 distinct dates / total unique clients
 * Rebooking rate   = clients with ≥ 2 completed bookings / total unique clients
 * At-risk          = clients whose last completed visit was > thresholdDays ago
 * Avg visit interval = mean of per-client mean gaps between consecutive visits
 */

import type { Booking, BookingStatus } from "../bookings/model";
import type {
  AnalyticsFilter,
  AtRiskMetrics,
  ClientRiskEntry,
  ClientRiskLevel,
  RebookingMetrics,
  RetentionMetrics,
  ServicePerformanceMetrics,
  StaffPerformanceMetrics,
  VisitIntervalMetrics,
} from "./model";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VISIT_STATUSES: BookingStatus[] = ["completed"];
const NO_SHOW_STATUSES: BookingStatus[] = ["no_show"];
const CANCEL_STATUSES: BookingStatus[] = ["cancelled", "rejected"];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function daysDiff(dateA: string, dateB: string): number {
  return (
    Math.abs(new Date(dateA).getTime() - new Date(dateB).getTime()) /
    86_400_000
  );
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function filterToWindow(bookings: Booking[], filter: AnalyticsFilter): Booking[] {
  return bookings.filter(
    (b) =>
      b.tenantId === filter.tenantId &&
      b.date >= filter.dateRange.start &&
      b.date <= filter.dateRange.end &&
      (!filter.locationId || b.locationId === filter.locationId) &&
      (!filter.staffId || b.staffId === filter.staffId),
  );
}

function groupByClient(bookings: Booking[]): Map<string, Booking[]> {
  const map = new Map<string, Booking[]>();
  for (const b of bookings) {
    const list = map.get(b.customerUserId) ?? [];
    list.push(b);
    map.set(b.customerUserId, list);
  }
  return map;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// ---------------------------------------------------------------------------
// Retention
// ---------------------------------------------------------------------------

/**
 * Retention rate = clients who completed ≥ 2 distinct-date visits in window /
 *                  total unique clients with ≥ 1 completed visit in window.
 */
export function computeRetentionMetrics(
  bookings: Booking[],
  filter: AnalyticsFilter,
): RetentionMetrics {
  const window = filterToWindow(bookings, filter).filter((b) =>
    VISIT_STATUSES.includes(b.status),
  );
  const byClient = groupByClient(window);
  const totalUniqueClients = byClient.size;

  let retainedClients = 0;
  for (const clientBookings of byClient.values()) {
    const distinctDates = new Set(clientBookings.map((b) => b.date));
    if (distinctDates.size >= 2) retainedClients++;
  }

  return {
    totalUniqueClients,
    retainedClients,
    retentionRate:
      totalUniqueClients === 0 ? 0 : retainedClients / totalUniqueClients,
  };
}

// ---------------------------------------------------------------------------
// Rebooking
// ---------------------------------------------------------------------------

/**
 * Rebooking rate = clients with ≥ 2 completed bookings in window /
 *                  total unique clients with ≥ 1 completed booking in window.
 */
export function computeRebookingMetrics(
  bookings: Booking[],
  filter: AnalyticsFilter,
): RebookingMetrics {
  const window = filterToWindow(bookings, filter).filter((b) =>
    VISIT_STATUSES.includes(b.status),
  );
  const byClient = groupByClient(window);
  const totalUniqueClients = byClient.size;

  let rebookedClients = 0;
  for (const clientBookings of byClient.values()) {
    if (clientBookings.length >= 2) rebookedClients++;
  }

  return {
    totalUniqueClients,
    rebookedClients,
    rebookingRate:
      totalUniqueClients === 0 ? 0 : rebookedClients / totalUniqueClients,
  };
}

// ---------------------------------------------------------------------------
// At-risk
// ---------------------------------------------------------------------------

/**
 * At-risk clients = clients whose last completed visit was > thresholdDays ago.
 */
export function computeAtRiskMetrics(
  bookings: Booking[],
  tenantId: string,
  thresholdDays: number,
  today: string = todayIso(),
): AtRiskMetrics {
  const completed = bookings.filter(
    (b) => b.tenantId === tenantId && VISIT_STATUSES.includes(b.status),
  );

  const lastVisit = new Map<string, string>();
  for (const b of completed) {
    const prev = lastVisit.get(b.customerUserId);
    if (!prev || b.date > prev) lastVisit.set(b.customerUserId, b.date);
  }

  let atRiskClients = 0;
  for (const date of lastVisit.values()) {
    if (daysDiff(today, date) > thresholdDays) atRiskClients++;
  }

  return { atRiskClients, thresholdDays };
}

// ---------------------------------------------------------------------------
// Visit interval
// ---------------------------------------------------------------------------

/**
 * Returns the mean and median of per-client average gaps between consecutive
 * completed visits. Returns null values when fewer than 2 visits exist.
 */
export function computeVisitIntervalMetrics(
  bookings: Booking[],
  tenantId: string,
): VisitIntervalMetrics {
  const completed = bookings.filter(
    (b) => b.tenantId === tenantId && VISIT_STATUSES.includes(b.status),
  );
  const byClient = groupByClient(completed);

  const clientMeans: number[] = [];
  for (const clientBookings of byClient.values()) {
    if (clientBookings.length < 2) continue;
    const sortedDates = clientBookings.map((b) => b.date).sort();
    const intervals: number[] = [];
    for (let i = 1; i < sortedDates.length; i++) {
      intervals.push(daysDiff(sortedDates[i - 1], sortedDates[i]));
    }
    const mean = intervals.reduce((a, x) => a + x, 0) / intervals.length;
    clientMeans.push(mean);
  }

  if (clientMeans.length === 0) {
    return { avgDaysBetweenVisits: null, medianDaysBetweenVisits: null };
  }

  const avg = clientMeans.reduce((a, x) => a + x, 0) / clientMeans.length;
  return {
    avgDaysBetweenVisits: Math.round(avg),
    medianDaysBetweenVisits: median(clientMeans),
  };
}

// ---------------------------------------------------------------------------
// Staff performance
// ---------------------------------------------------------------------------

/**
 * Per-staff aggregates: completed, no-show, cancellation counts + no-show rate.
 */
export function computeStaffPerformance(
  bookings: Booking[],
  filter: AnalyticsFilter,
): StaffPerformanceMetrics[] {
  const window = filterToWindow(bookings, filter);
  const staffMap = new Map<
    string,
    { completed: number; noShow: number; cancel: number }
  >();

  for (const b of window) {
    const curr = staffMap.get(b.staffId) ?? { completed: 0, noShow: 0, cancel: 0 };
    if (VISIT_STATUSES.includes(b.status)) curr.completed++;
    else if (NO_SHOW_STATUSES.includes(b.status)) curr.noShow++;
    else if (CANCEL_STATUSES.includes(b.status)) curr.cancel++;
    staffMap.set(b.staffId, curr);
  }

  return Array.from(staffMap.entries()).map(
    ([staffId, { completed, noShow, cancel }]) => ({
      staffId,
      completedBookings: completed,
      noShowCount: noShow,
      cancellationCount: cancel,
      noShowRate:
        completed + noShow === 0 ? 0 : noShow / (completed + noShow),
    }),
  );
}

// ---------------------------------------------------------------------------
// Service performance
// ---------------------------------------------------------------------------

/**
 * Per-service aggregates with popularity ranking (by completed bookings).
 */
export function computeServicePerformance(
  bookings: Booking[],
  filter: AnalyticsFilter,
): ServicePerformanceMetrics[] {
  const window = filterToWindow(bookings, filter);
  const serviceMap = new Map<string, { completed: number; cancel: number }>();

  for (const b of window) {
    const curr = serviceMap.get(b.serviceId) ?? { completed: 0, cancel: 0 };
    if (VISIT_STATUSES.includes(b.status)) curr.completed++;
    else if (CANCEL_STATUSES.includes(b.status)) curr.cancel++;
    serviceMap.set(b.serviceId, curr);
  }

  return Array.from(serviceMap.entries())
    .map(([serviceId, { completed, cancel }]) => ({
      serviceId,
      completedBookings: completed,
      cancellationCount: cancel,
      popularityRank: 0,
    }))
    .sort((a, b) => b.completedBookings - a.completedBookings)
    .map((entry, idx) => ({ ...entry, popularityRank: idx + 1 }));
}

// ---------------------------------------------------------------------------
// Client attention list
// ---------------------------------------------------------------------------

/**
 * Returns at-risk clients (last visit > 30 days ago), sorted by longest
 * time-since-last-visit descending.
 */
export function buildClientAttentionList(
  bookings: Booking[],
  tenantId: string,
  today: string = todayIso(),
): ClientRiskEntry[] {
  const completed = bookings.filter(
    (b) => b.tenantId === tenantId && VISIT_STATUSES.includes(b.status),
  );

  const clientData = new Map<string, { lastVisit: string; count: number }>();
  for (const b of completed) {
    const curr = clientData.get(b.customerUserId);
    if (!curr) {
      clientData.set(b.customerUserId, { lastVisit: b.date, count: 1 });
    } else {
      curr.count++;
      if (b.date > curr.lastVisit) curr.lastVisit = b.date;
    }
  }

  const entries: ClientRiskEntry[] = [];
  for (const [userId, { lastVisit, count }] of clientData.entries()) {
    const days = Math.floor(daysDiff(today, lastVisit));
    if (days < 30) continue;
    const riskLevel: ClientRiskLevel =
      days > 90 ? "high" : days > 60 ? "medium" : "low";
    entries.push({
      userId,
      lastVisitDate: lastVisit,
      daysSinceLastVisit: days,
      riskLevel,
      totalVisits: count,
    });
  }

  return entries.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
}
