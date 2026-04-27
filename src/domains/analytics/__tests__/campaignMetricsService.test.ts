import {
  computeCampaignKpis,
  computeCampaignKpisBatch,
  computeChallengeKpis,
  computeChallengeKpisBatch,
} from "../campaignMetricsService";
import type { Campaign, CampaignMetrics } from "../../campaigns/model";
import type { Activity, ParticipationRecord } from "../../activities/model";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeCampaign(metrics: Partial<CampaignMetrics> = {}): Campaign {
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
      converted: 0,
      failed: 10,
      ...metrics,
    },
  };
}

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    activityId: "act1",
    tenantId: "t1",
    type: "visit_streak",
    name: "Visit 3 times",
    status: "active",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    rule: { type: "visit_streak", targetValue: 3 },
    reward: { type: "discount_percent", value: 15, description: "15% off" },
    createdBy: "admin",
    createdAt: { seconds: 0, nanoseconds: 0 } as never,
    updatedAt: { seconds: 0, nanoseconds: 0 } as never,
    ...overrides,
  };
}

function makeParticipation(overrides: Partial<ParticipationRecord> = {}): ParticipationRecord {
  return {
    participationId: "par1",
    activityId: "act1",
    tenantId: "t1",
    userId: "user1",
    progress: 1,
    completed: false,
    createdAt: { seconds: 0, nanoseconds: 0 } as never,
    updatedAt: { seconds: 0, nanoseconds: 0 } as never,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computeCampaignKpis
// ---------------------------------------------------------------------------

describe("computeCampaignKpis", () => {
  it("computes openRate as opened/delivered", () => {
    const kpis = computeCampaignKpis(makeCampaign({ opened: 45, delivered: 90 }));
    expect(kpis.openRate).toBeCloseTo(0.5);
  });

  it("computes clickRate as clicked/delivered", () => {
    const kpis = computeCampaignKpis(makeCampaign({ clicked: 20, delivered: 100 }));
    expect(kpis.clickRate).toBeCloseTo(0.2);
  });

  it("computes conversionRate as clicked/sent", () => {
    const kpis = computeCampaignKpis(makeCampaign({ clicked: 10, sent: 100 }));
    expect(kpis.conversionRate).toBeCloseTo(0.1);
  });

  it("returns 0 rates when denominator is zero", () => {
    const kpis = computeCampaignKpis(
      makeCampaign({ sent: 0, delivered: 0, opened: 0, clicked: 0 }),
    );
    expect(kpis.openRate).toBe(0);
    expect(kpis.clickRate).toBe(0);
    expect(kpis.conversionRate).toBe(0);
  });

  it("preserves raw counts", () => {
    const kpis = computeCampaignKpis(makeCampaign());
    expect(kpis.sent).toBe(100);
    expect(kpis.delivered).toBe(90);
    expect(kpis.failed).toBe(10);
  });
});

describe("computeCampaignKpisBatch", () => {
  it("returns one entry per campaign", () => {
    const campaigns = [
      makeCampaign(),
      { ...makeCampaign(), campaignId: "cmp2", name: "Summer" },
    ];
    expect(computeCampaignKpisBatch(campaigns)).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// computeChallengeKpis
// ---------------------------------------------------------------------------

describe("computeChallengeKpis", () => {
  it("returns 0 completionRate with no participants", () => {
    const kpis = computeChallengeKpis(makeActivity(), []);
    expect(kpis.participants).toBe(0);
    expect(kpis.completionRate).toBe(0);
    expect(kpis.rewardsAwarded).toBe(0);
  });

  it("counts completed participants correctly", () => {
    const participations = [
      makeParticipation({ participationId: "p1", completed: true, rewardedAt: "2026-03-01" }),
      makeParticipation({ participationId: "p2", completed: false }),
      makeParticipation({ participationId: "p3", completed: true }),
    ];
    const kpis = computeChallengeKpis(makeActivity(), participations);
    expect(kpis.participants).toBe(3);
    expect(kpis.completed).toBe(2);
    expect(kpis.completionRate).toBeCloseTo(2 / 3);
    expect(kpis.rewardsAwarded).toBe(1); // only p1 has rewardedAt
  });
});

describe("computeChallengeKpisBatch", () => {
  it("returns empty KPIs for activities with no participations", () => {
    const activities = [makeActivity()];
    const result = computeChallengeKpisBatch(activities, new Map());
    expect(result[0].participants).toBe(0);
  });
});
