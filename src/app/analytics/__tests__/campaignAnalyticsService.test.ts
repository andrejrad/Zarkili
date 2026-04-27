import { createCampaignAnalyticsService } from "../campaignAnalyticsService";
import type { AnalyticsRepository } from "../../../domains/analytics/analyticsRepository";
import type { Campaign } from "../../../domains/campaigns/model";
import type { Activity, ParticipationRecord } from "../../../domains/activities/model";

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

const MOCK_CAMPAIGN: Campaign = {
  campaignId: "cmp1",
  tenantId: "t1",
  name: "Spring sale",
  channel: "email",
  segmentId: "seg1",
  templateId: "tmpl1",
  status: "completed",
  scheduledAt: "2026-03-01T09:00:00Z",
  requiredSubscriptionTier: "starter",
  createdBy: "admin",
  createdAt: { seconds: 0, nanoseconds: 0 } as never,
  updatedAt: { seconds: 0, nanoseconds: 0 } as never,
  metrics: { sent: 100, delivered: 90, opened: 45, clicked: 20, converted: 0, failed: 10 },
};

const MOCK_ACTIVITY: Activity = {
  activityId: "act1",
  tenantId: "t1",
  type: "visit_streak",
  name: "3 visits",
  status: "active",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  rule: { type: "visit_streak", targetValue: 3 },
  reward: { type: "discount_percent", value: 15, description: "15% off" },
  createdBy: "admin",
  createdAt: { seconds: 0, nanoseconds: 0 } as never,
  updatedAt: { seconds: 0, nanoseconds: 0 } as never,
};

const MOCK_PARTICIPATION: ParticipationRecord = {
  participationId: "par1",
  activityId: "act1",
  tenantId: "t1",
  userId: "u1",
  progress: 3,
  completed: true,
  rewardedAt: "2026-03-01",
  createdAt: { seconds: 0, nanoseconds: 0 } as never,
  updatedAt: { seconds: 0, nanoseconds: 0 } as never,
};

// ---------------------------------------------------------------------------
// getCampaignKpis
// ---------------------------------------------------------------------------

describe("campaignAnalyticsService — getCampaignKpis", () => {
  it("returns TENANT_REQUIRED for empty tenantId", async () => {
    const svc = createCampaignAnalyticsService(stubRepo());
    const result = await svc.getCampaignKpis("", "tenant_admin");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("TENANT_REQUIRED");
  });

  it("returns FORBIDDEN for technician", async () => {
    const svc = createCampaignAnalyticsService(stubRepo());
    const result = await svc.getCampaignKpis("t1", "technician");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("returns FORBIDDEN for client", async () => {
    const svc = createCampaignAnalyticsService(stubRepo());
    const result = await svc.getCampaignKpis("t1", "client");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("returns empty list when no campaigns", async () => {
    const svc = createCampaignAnalyticsService(stubRepo());
    const result = await svc.getCampaignKpis("t1", "tenant_admin");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toHaveLength(0);
  });

  it("returns computed KPIs for campaigns", async () => {
    const svc = createCampaignAnalyticsService(
      stubRepo({ fetchCampaigns: jest.fn(async () => [MOCK_CAMPAIGN]) }),
    );
    const result = await svc.getCampaignKpis("t1", "tenant_admin");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].openRate).toBeCloseTo(45 / 90);
      expect(result.data[0].sent).toBe(100);
    }
  });

  it("maps errors to ok: false", async () => {
    const svc = createCampaignAnalyticsService(
      stubRepo({ fetchCampaigns: jest.fn(async () => { throw new Error("fail"); }) }),
    );
    const result = await svc.getCampaignKpis("t1", "tenant_admin");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("QUERY_ERROR");
  });
});

// ---------------------------------------------------------------------------
// getChallengeKpis
// ---------------------------------------------------------------------------

describe("campaignAnalyticsService — getChallengeKpis", () => {
  it("returns TENANT_REQUIRED for empty tenantId", async () => {
    const svc = createCampaignAnalyticsService(stubRepo());
    const result = await svc.getChallengeKpis("", "tenant_admin");
    expect(result.ok).toBe(false);
  });

  it("returns FORBIDDEN for technician", async () => {
    const svc = createCampaignAnalyticsService(stubRepo());
    const result = await svc.getChallengeKpis("t1", "technician");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("returns FORBIDDEN for client", async () => {
    const svc = createCampaignAnalyticsService(stubRepo());
    const result = await svc.getChallengeKpis("t1", "client");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("returns empty list when no activities", async () => {
    const svc = createCampaignAnalyticsService(stubRepo());
    const result = await svc.getChallengeKpis("t1", "tenant_admin");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toHaveLength(0);
  });

  it("computes challenge KPIs including completion rate", async () => {
    const svc = createCampaignAnalyticsService(
      stubRepo({
        fetchActivities: jest.fn(async () => [MOCK_ACTIVITY]),
        fetchParticipations: jest.fn(async () => [MOCK_PARTICIPATION]),
      }),
    );
    const result = await svc.getChallengeKpis("t1", "tenant_admin");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].participants).toBe(1);
      expect(result.data[0].completed).toBe(1);
      expect(result.data[0].completionRate).toBe(1);
      expect(result.data[0].rewardsAwarded).toBe(1);
    }
  });
});
