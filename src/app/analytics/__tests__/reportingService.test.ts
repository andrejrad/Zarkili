import { createReportingService } from "../reportingService";
import type { AnalyticsRepository } from "../../../domains/analytics/analyticsRepository";
import type { Booking } from "../../../domains/bookings/model";

// ---------------------------------------------------------------------------
// Stub factory
// ---------------------------------------------------------------------------

function stubRepo(overrides: Partial<AnalyticsRepository> = {}): AnalyticsRepository {
  return {
    fetchCompletedBookings: jest.fn(async () => []),
    fetchAllBookingsByTenant: jest.fn(async () => []),
    fetchCampaigns: jest.fn(async () => []),
    fetchActivities: jest.fn(async () => []),
    fetchParticipations: jest.fn(async () => []),
    ...overrides,
  };
}

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    bookingId: "b1",
    tenantId: "t1",
    locationId: "loc1",
    staffId: "s1",
    serviceId: "svc1",
    customerUserId: "u1",
    date: "2026-03-01",
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

const FILTER = {
  tenantId: "t1",
  dateRange: { start: "2026-01-01", end: "2026-12-31" },
};

// ---------------------------------------------------------------------------
// getTenantAnalyticsContext
// ---------------------------------------------------------------------------

describe("reportingService — getTenantAnalyticsContext", () => {
  it("returns accessible reports for free_trial", async () => {
    const svc = createReportingService(stubRepo());
    const ctx = await svc.getTenantAnalyticsContext("t1", "free_trial");
    expect(ctx.subscriptionTier).toBe("free_trial");
    expect(ctx.accessibleReports).toContain("retention");
    expect(ctx.accessibleReports).not.toContain("export");
  });

  it("enterprise plan includes export", async () => {
    const svc = createReportingService(stubRepo());
    const ctx = await svc.getTenantAnalyticsContext("t1", "enterprise");
    expect(ctx.accessibleReports).toContain("export");
  });
});

// ---------------------------------------------------------------------------
// getRetentionReport
// ---------------------------------------------------------------------------

describe("reportingService — getRetentionReport", () => {
  it("returns TENANT_REQUIRED for empty tenantId", async () => {
    const svc = createReportingService(stubRepo());
    const result = await svc.getRetentionReport({ ...FILTER, tenantId: "" }, "tenant_admin");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("TENANT_REQUIRED");
  });

  it("returns FORBIDDEN for technician", async () => {
    const svc = createReportingService(stubRepo());
    const result = await svc.getRetentionReport(FILTER, "technician");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("returns FORBIDDEN for client", async () => {
    const svc = createReportingService(stubRepo());
    const result = await svc.getRetentionReport(FILTER, "client");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("returns retention metrics for valid request", async () => {
    const bookings = [makeBooking(), makeBooking({ bookingId: "b2", date: "2026-04-01" })];
    const svc = createReportingService(
      stubRepo({ fetchCompletedBookings: jest.fn(async () => bookings) }),
    );
    const result = await svc.getRetentionReport(FILTER, "tenant_admin");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalUniqueClients).toBe(1);
      expect(result.data.retainedClients).toBe(1); // 2 distinct dates
    }
  });

  it("maps repository errors to ok: false", async () => {
    const svc = createReportingService(
      stubRepo({
        fetchCompletedBookings: jest.fn(async () => {
          throw new Error("Firestore down");
        }),
      }),
    );
    const result = await svc.getRetentionReport(FILTER, "tenant_admin");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("QUERY_ERROR");
  });
});

// ---------------------------------------------------------------------------
// getRebookingReport
// ---------------------------------------------------------------------------

describe("reportingService — getRebookingReport", () => {
  it("returns 0 rebooking rate for single-booking clients", async () => {
    const svc = createReportingService(
      stubRepo({ fetchCompletedBookings: jest.fn(async () => [makeBooking()]) }),
    );
    const result = await svc.getRebookingReport(FILTER, "tenant_admin");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.rebookingRate).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getAtRiskReport
// ---------------------------------------------------------------------------

describe("reportingService — getAtRiskReport", () => {
  it("returns TENANT_REQUIRED for empty tenantId", async () => {
    const svc = createReportingService(stubRepo());
    const result = await svc.getAtRiskReport("", 60, "tenant_admin");
    expect(result.ok).toBe(false);
  });

  it("returns FORBIDDEN for technician", async () => {
    const svc = createReportingService(stubRepo());
    const result = await svc.getAtRiskReport("t1", 60, "technician");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("counts at-risk clients", async () => {
    const bookings = [makeBooking({ date: "2026-01-01" })]; // >90d before 2026-04-01
    const svc = createReportingService(
      stubRepo({ fetchAllBookingsByTenant: jest.fn(async () => bookings) }),
    );
    const result = await svc.getAtRiskReport("t1", 60, "tenant_admin", "2026-04-01");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.atRiskClients).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getVisitIntervalReport
// ---------------------------------------------------------------------------

describe("reportingService — getVisitIntervalReport", () => {
  it("returns nulls when no data", async () => {
    const svc = createReportingService(stubRepo());
    const result = await svc.getVisitIntervalReport("t1", "tenant_admin");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.avgDaysBetweenVisits).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getStaffPerformanceReport
// ---------------------------------------------------------------------------

describe("reportingService — getStaffPerformanceReport", () => {
  it("returns empty array when no bookings", async () => {
    const svc = createReportingService(stubRepo());
    const result = await svc.getStaffPerformanceReport(FILTER, "tenant_admin");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getClientAttentionList
// ---------------------------------------------------------------------------

describe("reportingService — getClientAttentionList", () => {
  it("returns empty list when clients visited recently", async () => {
    const recent = makeBooking({ date: "2026-03-25" });
    const svc = createReportingService(
      stubRepo({ fetchAllBookingsByTenant: jest.fn(async () => [recent]) }),
    );
    const result = await svc.getClientAttentionList("t1", "tenant_admin", "2026-04-01");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toHaveLength(0);
  });
});
