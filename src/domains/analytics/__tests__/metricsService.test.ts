import {
  computeRetentionMetrics,
  computeRebookingMetrics,
  computeAtRiskMetrics,
  computeVisitIntervalMetrics,
  computeStaffPerformance,
  computeServicePerformance,
  buildClientAttentionList,
} from "../metricsService";
import type { Booking } from "../../bookings/model";
import type { AnalyticsFilter } from "../model";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    bookingId: "bid1",
    tenantId: "t1",
    locationId: "loc1",
    staffId: "staff1",
    serviceId: "svc1",
    customerUserId: "user1",
    date: "2026-04-01",
    startMinutes: 540,
    endMinutes: 600,
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    bufferMinutes: 0,
    status: "completed",
    version: 0,
    notes: null,
    lifecycleEvents: [],
    createdAt: { seconds: 0, nanoseconds: 0 } as never,
    updatedAt: { seconds: 0, nanoseconds: 0 } as never,
    ...overrides,
  };
}

const BASE_FILTER: AnalyticsFilter = {
  tenantId: "t1",
  dateRange: { start: "2026-01-01", end: "2026-12-31" },
};

// ---------------------------------------------------------------------------
// computeRetentionMetrics
// ---------------------------------------------------------------------------

describe("computeRetentionMetrics", () => {
  it("returns zero when no bookings", () => {
    const result = computeRetentionMetrics([], BASE_FILTER);
    expect(result.totalUniqueClients).toBe(0);
    expect(result.retainedClients).toBe(0);
    expect(result.retentionRate).toBe(0);
  });

  it("returns 0 retentionRate when every client has only 1 visit", () => {
    const bookings = [
      makeBooking({ customerUserId: "u1", date: "2026-03-01" }),
      makeBooking({ customerUserId: "u2", date: "2026-03-05", bookingId: "b2" }),
    ];
    const result = computeRetentionMetrics(bookings, BASE_FILTER);
    expect(result.totalUniqueClients).toBe(2);
    expect(result.retainedClients).toBe(0);
    expect(result.retentionRate).toBe(0);
  });

  it("counts retained clients who visited on ≥ 2 distinct dates", () => {
    const bookings = [
      makeBooking({ bookingId: "b1", customerUserId: "u1", date: "2026-03-01" }),
      makeBooking({ bookingId: "b2", customerUserId: "u1", date: "2026-03-15" }),
      makeBooking({ bookingId: "b3", customerUserId: "u2", date: "2026-03-05" }),
    ];
    const result = computeRetentionMetrics(bookings, BASE_FILTER);
    expect(result.totalUniqueClients).toBe(2);
    expect(result.retainedClients).toBe(1);
    expect(result.retentionRate).toBeCloseTo(0.5);
  });

  it("does not count same-date repeat bookings as retention", () => {
    const bookings = [
      makeBooking({ bookingId: "b1", customerUserId: "u1", date: "2026-03-01" }),
      makeBooking({ bookingId: "b2", customerUserId: "u1", date: "2026-03-01" }),
    ];
    const result = computeRetentionMetrics(bookings, BASE_FILTER);
    expect(result.retainedClients).toBe(0);
  });

  it("excludes bookings outside the date window", () => {
    const bookings = [
      makeBooking({ bookingId: "b1", customerUserId: "u1", date: "2025-12-01" }),
      makeBooking({ bookingId: "b2", customerUserId: "u1", date: "2026-03-01" }),
    ];
    const result = computeRetentionMetrics(bookings, BASE_FILTER);
    // Only 2026-03-01 is inside the window → 1 client, 0 retained
    expect(result.totalUniqueClients).toBe(1);
    expect(result.retainedClients).toBe(0);
  });

  it("excludes non-completed bookings", () => {
    const bookings = [
      makeBooking({ bookingId: "b1", customerUserId: "u1", date: "2026-03-01", status: "cancelled" }),
      makeBooking({ bookingId: "b2", customerUserId: "u1", date: "2026-03-15", status: "no_show" }),
    ];
    const result = computeRetentionMetrics(bookings, BASE_FILTER);
    expect(result.totalUniqueClients).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeRebookingMetrics
// ---------------------------------------------------------------------------

describe("computeRebookingMetrics", () => {
  it("returns zero when no bookings", () => {
    const result = computeRebookingMetrics([], BASE_FILTER);
    expect(result.rebookingRate).toBe(0);
  });

  it("counts clients with ≥ 2 completed bookings as rebooked", () => {
    const bookings = [
      makeBooking({ bookingId: "b1", customerUserId: "u1", date: "2026-03-01" }),
      makeBooking({ bookingId: "b2", customerUserId: "u1", date: "2026-03-01" }), // same date OK for rebooking
      makeBooking({ bookingId: "b3", customerUserId: "u2", date: "2026-03-05" }),
    ];
    const result = computeRebookingMetrics(bookings, BASE_FILTER);
    expect(result.totalUniqueClients).toBe(2);
    expect(result.rebookedClients).toBe(1);
    expect(result.rebookingRate).toBeCloseTo(0.5);
  });
});

// ---------------------------------------------------------------------------
// computeAtRiskMetrics
// ---------------------------------------------------------------------------

describe("computeAtRiskMetrics", () => {
  it("returns 0 when no bookings", () => {
    const result = computeAtRiskMetrics([], "t1", 60, "2026-04-01");
    expect(result.atRiskClients).toBe(0);
  });

  it("counts clients past threshold as at-risk", () => {
    const bookings = [
      makeBooking({ customerUserId: "u1", date: "2026-01-01" }), // >90d before 2026-04-01
      makeBooking({ bookingId: "b2", customerUserId: "u2", date: "2026-03-20" }), // ~12d ago
    ];
    const result = computeAtRiskMetrics(bookings, "t1", 60, "2026-04-01");
    expect(result.atRiskClients).toBe(1);
    expect(result.thresholdDays).toBe(60);
  });

  it("uses most recent visit per client", () => {
    const bookings = [
      makeBooking({ bookingId: "b1", customerUserId: "u1", date: "2025-12-01" }),
      makeBooking({ bookingId: "b2", customerUserId: "u1", date: "2026-03-01" }), // recent
    ];
    // March 1 is ~31 days before April 1 — not at-risk with threshold=60
    const result = computeAtRiskMetrics(bookings, "t1", 60, "2026-04-01");
    expect(result.atRiskClients).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeVisitIntervalMetrics
// ---------------------------------------------------------------------------

describe("computeVisitIntervalMetrics", () => {
  it("returns nulls when fewer than 2 visits", () => {
    const bookings = [makeBooking({ customerUserId: "u1" })];
    const result = computeVisitIntervalMetrics(bookings, "t1");
    expect(result.avgDaysBetweenVisits).toBeNull();
    expect(result.medianDaysBetweenVisits).toBeNull();
  });

  it("computes avg and median for a single client with 2 visits", () => {
    const bookings = [
      makeBooking({ bookingId: "b1", customerUserId: "u1", date: "2026-01-01" }),
      makeBooking({ bookingId: "b2", customerUserId: "u1", date: "2026-01-31" }),
    ];
    const result = computeVisitIntervalMetrics(bookings, "t1");
    expect(result.avgDaysBetweenVisits).toBe(30);
    expect(result.medianDaysBetweenVisits).toBe(30);
  });

  it("averages across multiple clients", () => {
    const bookings = [
      makeBooking({ bookingId: "b1", customerUserId: "u1", date: "2026-01-01" }),
      makeBooking({ bookingId: "b2", customerUserId: "u1", date: "2026-02-01" }), // interval ~31d
      makeBooking({ bookingId: "b3", customerUserId: "u2", date: "2026-01-01" }),
      makeBooking({ bookingId: "b4", customerUserId: "u2", date: "2026-03-01" }), // interval ~59d
    ];
    const result = computeVisitIntervalMetrics(bookings, "t1");
    expect(result.avgDaysBetweenVisits).toBeGreaterThan(0);
    expect(result.medianDaysBetweenVisits).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// computeStaffPerformance
// ---------------------------------------------------------------------------

describe("computeStaffPerformance", () => {
  it("returns empty array for no bookings", () => {
    expect(computeStaffPerformance([], BASE_FILTER)).toEqual([]);
  });

  it("aggregates completed, no-show, cancellation per staff", () => {
    const bookings = [
      makeBooking({ bookingId: "b1", staffId: "s1", status: "completed" }),
      makeBooking({ bookingId: "b2", staffId: "s1", status: "no_show" }),
      makeBooking({ bookingId: "b3", staffId: "s1", status: "cancelled" }),
      makeBooking({ bookingId: "b4", staffId: "s2", status: "completed" }),
    ];
    const result = computeStaffPerformance(bookings, BASE_FILTER);
    const s1 = result.find((r) => r.staffId === "s1");
    expect(s1?.completedBookings).toBe(1);
    expect(s1?.noShowCount).toBe(1);
    expect(s1?.cancellationCount).toBe(1);
    expect(s1?.noShowRate).toBeCloseTo(0.5); // 1/(1+1)
  });

  it("noShowRate is 0 when no no-shows", () => {
    const bookings = [makeBooking({ bookingId: "b1", staffId: "s1" })];
    const result = computeStaffPerformance(bookings, BASE_FILTER);
    expect(result[0].noShowRate).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeServicePerformance
// ---------------------------------------------------------------------------

describe("computeServicePerformance", () => {
  it("ranks services by completed bookings descending", () => {
    const bookings = [
      makeBooking({ bookingId: "b1", serviceId: "svcA" }),
      makeBooking({ bookingId: "b2", serviceId: "svcA" }),
      makeBooking({ bookingId: "b3", serviceId: "svcB" }),
    ];
    const result = computeServicePerformance(bookings, BASE_FILTER);
    expect(result.find((r) => r.serviceId === "svcA")?.popularityRank).toBe(1);
    expect(result.find((r) => r.serviceId === "svcB")?.popularityRank).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// buildClientAttentionList
// ---------------------------------------------------------------------------

describe("buildClientAttentionList", () => {
  it("returns empty when all clients visited recently", () => {
    const bookings = [
      makeBooking({ customerUserId: "u1", date: "2026-03-25" }),
    ];
    const result = buildClientAttentionList(bookings, "t1", "2026-04-01");
    expect(result).toHaveLength(0);
  });

  it("classifies risk levels correctly", () => {
    const bookings = [
      makeBooking({ bookingId: "b1", customerUserId: "high", date: "2025-12-01" }),          // >90d
      makeBooking({ bookingId: "b2", customerUserId: "medium", date: "2026-01-20" }),         // ~70d
      makeBooking({ bookingId: "b3", customerUserId: "low", date: "2026-02-20" }),            // ~40d
    ];
    const result = buildClientAttentionList(bookings, "t1", "2026-04-01");
    expect(result.find((r) => r.userId === "high")?.riskLevel).toBe("high");
    expect(result.find((r) => r.userId === "medium")?.riskLevel).toBe("medium");
    expect(result.find((r) => r.userId === "low")?.riskLevel).toBe("low");
  });

  it("sorts by daysSinceLastVisit descending", () => {
    const bookings = [
      makeBooking({ bookingId: "b1", customerUserId: "newer", date: "2026-02-20" }), // ~40d
      makeBooking({ bookingId: "b2", customerUserId: "older", date: "2025-12-01" }), // >90d
    ];
    const result = buildClientAttentionList(bookings, "t1", "2026-04-01");
    expect(result[0].userId).toBe("older");
  });
});
