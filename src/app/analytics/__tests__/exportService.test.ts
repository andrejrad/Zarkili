import { createExportService } from "../exportService";
import type { AnalyticsRepository } from "../../../domains/analytics/analyticsRepository";
import type { Booking } from "../../../domains/bookings/model";
import type { Campaign } from "../../../domains/campaigns/model";

// ---------------------------------------------------------------------------
// Stubs & fixtures
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

const BASE_OPTS = {
  actorRole: "tenant_admin" as const,
  filter: {
    tenantId: "t1",
    dateRange: { start: "2026-01-01", end: "2026-12-31" },
  },
  format: "json" as const,
};

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

describe("exportService — RBAC", () => {
  it("rejects technician role", async () => {
    const svc = createExportService(stubRepo());
    const result = await svc.exportBookings({ ...BASE_OPTS, actorRole: "technician" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("rejects client role", async () => {
    const svc = createExportService(stubRepo());
    const result = await svc.exportBookings({ ...BASE_OPTS, actorRole: "client" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("allows tenant_admin", async () => {
    const svc = createExportService(stubRepo());
    const result = await svc.exportBookings(BASE_OPTS);
    expect(result.ok).toBe(true);
  });

  it("allows tenant_owner", async () => {
    const svc = createExportService(stubRepo());
    const result = await svc.exportBookings({ ...BASE_OPTS, actorRole: "tenant_owner" });
    expect(result.ok).toBe(true);
  });

  it("rejects location_manager without locationId", async () => {
    const svc = createExportService(stubRepo());
    const result = await svc.exportBookings({
      ...BASE_OPTS,
      actorRole: "location_manager",
      filter: { ...BASE_OPTS.filter, locationId: undefined },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("LOCATION_REQUIRED");
  });

  it("allows location_manager with locationId", async () => {
    const svc = createExportService(stubRepo());
    const result = await svc.exportBookings({
      ...BASE_OPTS,
      actorRole: "location_manager",
      filter: { ...BASE_OPTS.filter, locationId: "loc1" },
    });
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

describe("exportService — pagination", () => {
  it("returns first page of results", async () => {
    const bookings = Array.from({ length: 10 }, (_, i) =>
      makeBooking({ bookingId: `b${i}` }),
    );
    const svc = createExportService(
      stubRepo({ fetchCompletedBookings: jest.fn(async () => bookings) }),
    );
    const result = await svc.exportBookings({ ...BASE_OPTS, page: 1, pageSize: 3 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.data).toHaveLength(3);
      expect(result.data.metadata.hasMore).toBe(true);
      expect(result.data.metadata.page).toBe(1);
    }
  });

  it("returns last page with hasMore=false", async () => {
    const bookings = Array.from({ length: 5 }, (_, i) =>
      makeBooking({ bookingId: `b${i}` }),
    );
    const svc = createExportService(
      stubRepo({ fetchCompletedBookings: jest.fn(async () => bookings) }),
    );
    const result = await svc.exportBookings({ ...BASE_OPTS, page: 2, pageSize: 3 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.data).toHaveLength(2);
      expect(result.data.metadata.hasMore).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Format validity
// ---------------------------------------------------------------------------

describe("exportService — format", () => {
  it("JSON format produces parseable output with metadata", async () => {
    const svc = createExportService(
      stubRepo({ fetchCompletedBookings: jest.fn(async () => [makeBooking()]) }),
    );
    const result = await svc.exportBookings({ ...BASE_OPTS, format: "json" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(() => JSON.parse(result.data.formatted)).not.toThrow();
      expect(result.data.metadata.format).toBe("json");
    }
  });

  it("CSV format includes header row", async () => {
    const svc = createExportService(
      stubRepo({ fetchCompletedBookings: jest.fn(async () => [makeBooking()]) }),
    );
    const result = await svc.exportBookings({ ...BASE_OPTS, format: "csv" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.formatted).toContain("bookingId");
      expect(result.data.formatted).toContain("tenantId");
      expect(result.data.metadata.format).toBe("csv");
    }
  });

  it("CSV with empty data returns only header", async () => {
    const svc = createExportService(stubRepo());
    const result = await svc.exportBookings({ ...BASE_OPTS, format: "csv" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const lines = result.data.formatted.trim().split("\n");
      expect(lines).toHaveLength(1); // header only
    }
  });
});

// ---------------------------------------------------------------------------
// Metadata fields
// ---------------------------------------------------------------------------

describe("exportService — metadata", () => {
  it("includes tenantId, generatedAt, rowCount", async () => {
    const svc = createExportService(
      stubRepo({ fetchCompletedBookings: jest.fn(async () => [makeBooking()]) }),
    );
    const result = await svc.exportBookings(BASE_OPTS);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.metadata.tenantId).toBe("t1");
      expect(result.data.metadata.generatedAt).toBeTruthy();
      expect(result.data.metadata.rowCount).toBe(1);
    }
  });
});

// ---------------------------------------------------------------------------
// exportCampaignKpis
// ---------------------------------------------------------------------------

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    campaignId: "cmp1",
    tenantId: "t1",
    name: "Spring promo",
    channel: "email",
    segmentId: "seg1",
    templateId: "tmpl1",
    status: "completed",
    scheduledAt: "2026-03-01T10:00:00Z",
    requiredSubscriptionTier: "starter",
    createdBy: "admin",
    createdAt: { seconds: 0, nanoseconds: 0 } as never,
    updatedAt: { seconds: 0, nanoseconds: 0 } as never,
    metrics: {
      sent: 100,
      delivered: 90,
      opened: 45,
      clicked: 20,
      converted: 5,
      failed: 10,
    },
    ...overrides,
  };
}

describe("exportService — exportCampaignKpis", () => {
  it("rejects forbidden roles", async () => {
    const svc = createExportService(stubRepo());
    const result = await svc.exportCampaignKpis({ ...BASE_OPTS, actorRole: "technician" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("rejects location_manager without locationId", async () => {
    const svc = createExportService(stubRepo());
    const result = await svc.exportCampaignKpis({
      ...BASE_OPTS,
      actorRole: "location_manager",
      filter: { ...BASE_OPTS.filter },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("LOCATION_REQUIRED");
  });

  it("returns campaign KPI rows for allowed role", async () => {
    const svc = createExportService(
      stubRepo({ fetchCampaigns: jest.fn(async () => [makeCampaign()]) }),
    );
    const result = await svc.exportCampaignKpis(BASE_OPTS);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0].campaignId).toBe("cmp1");
      expect(result.data.metadata.rowCount).toBe(1);
    }
  });

  it("CSV format includes campaign KPI headers", async () => {
    const svc = createExportService(
      stubRepo({ fetchCampaigns: jest.fn(async () => [makeCampaign()]) }),
    );
    const result = await svc.exportCampaignKpis({ ...BASE_OPTS, format: "csv" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.formatted).toContain("campaignId");
      expect(result.data.formatted).toContain("openRate");
      expect(result.data.formatted).toContain("converted");
    }
  });

  it("JSON format is parseable", async () => {
    const svc = createExportService(
      stubRepo({ fetchCampaigns: jest.fn(async () => [makeCampaign()]) }),
    );
    const result = await svc.exportCampaignKpis({ ...BASE_OPTS, format: "json" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(() => JSON.parse(result.data.formatted)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// exportClientAttentionList
// ---------------------------------------------------------------------------

describe("exportService — exportClientAttentionList", () => {
  it("rejects forbidden roles", async () => {
    const svc = createExportService(stubRepo());
    const result = await svc.exportClientAttentionList({ ...BASE_OPTS, actorRole: "client" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("returns client risk entries for allowed role", async () => {
    const oldBooking = makeBooking({
      bookingId: "b-old",
      customerUserId: "user-risk",
      status: "completed",
      date: "2025-12-01",
    });
    const svc = createExportService(
      stubRepo({ fetchAllBookingsByTenant: jest.fn(async () => [oldBooking]) }),
    );
    const result = await svc.exportClientAttentionList(BASE_OPTS);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0].userId).toBe("user-risk");
      expect(result.data.metadata.rowCount).toBe(1);
    }
  });

  it("CSV format includes client risk headers", async () => {
    const oldBooking = makeBooking({
      customerUserId: "user-risk",
      status: "completed",
      date: "2025-12-01",
    });
    const svc = createExportService(
      stubRepo({ fetchAllBookingsByTenant: jest.fn(async () => [oldBooking]) }),
    );
    const result = await svc.exportClientAttentionList({ ...BASE_OPTS, format: "csv" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.formatted).toContain("userId");
      expect(result.data.formatted).toContain("riskLevel");
      expect(result.data.formatted).toContain("daysSinceLastVisit");
    }
  });

  it("returns empty list when no at-risk clients", async () => {
    const recentBooking = makeBooking({
      customerUserId: "user-fresh",
      status: "completed",
      date: new Date().toISOString().slice(0, 10),
    });
    const svc = createExportService(
      stubRepo({ fetchAllBookingsByTenant: jest.fn(async () => [recentBooking]) }),
    );
    const result = await svc.exportClientAttentionList(BASE_OPTS);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.data).toHaveLength(0);
  });
});
