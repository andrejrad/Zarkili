import {
  checkSchedulingQuality,
  checkRetentionQuality,
  checkNoShowRiskQuality,
  checkMarketplaceQuality,
  buildSchedulingContract,
  buildRetentionContract,
  buildNoShowRiskContract,
  buildMarketplaceContract,
  ANALYTICS_ONLY_CONSENT,
  MESSAGING_CONSENT,
} from "../aiDataContracts";
import type {
  SchedulingFeatureVector,
  RetentionFeatureVector,
  NoShowRiskFeatureVector,
  MarketplacePersonalizationVector,
} from "../model";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_EXPLAINABILITY = {
  reasonCodes: ["last_visit_age"],
  confidence: "high" as const,
  sourceSignals: ["booking_history"],
};

const SCHEDULING: SchedulingFeatureVector = {
  userId: "u1",
  tenantId: "t1",
  preferredDayOfWeek: [1, 3],
  preferredTimeSlot: ["morning"],
  avgLeadHours: 24,
  noShowRate: 0.05,
  explainability: VALID_EXPLAINABILITY,
};

const RETENTION: RetentionFeatureVector = {
  userId: "u1",
  tenantId: "t1",
  daysSinceLastVisit: 30,
  totalVisits: 5,
  avgVisitIntervalDays: 15,
  loyaltyPoints: 120,
  churnRiskScore: 0.3,
  explainability: VALID_EXPLAINABILITY,
};

const NO_SHOW: NoShowRiskFeatureVector = {
  userId: "u1",
  tenantId: "t1",
  bookingId: "b1",
  historicalNoShowRate: 0.1,
  daysTillAppointment: 3,
  hasReceivedReminder: false,
  noShowRiskScore: 0.2,
  explainability: VALID_EXPLAINABILITY,
};

const MARKETPLACE: MarketplacePersonalizationVector = {
  userId: "u1",
  tenantId: "t1",
  preferredServiceIds: ["svc1"],
  preferredStaffIds: ["staff1"],
  avgSpend: 55,
  explainability: VALID_EXPLAINABILITY,
};

// ---------------------------------------------------------------------------
// checkSchedulingQuality
// ---------------------------------------------------------------------------

describe("checkSchedulingQuality", () => {
  it("returns no flags for a valid vector", () => {
    expect(checkSchedulingQuality(SCHEDULING)).toHaveLength(0);
  });

  it("flags missing preferredDayOfWeek", () => {
    const flags = checkSchedulingQuality({ ...SCHEDULING, preferredDayOfWeek: [] });
    expect(flags).toContainEqual(
      expect.objectContaining({ field: "preferredDayOfWeek", issue: "missing" }),
    );
  });

  it("flags negative avgLeadHours", () => {
    const flags = checkSchedulingQuality({ ...SCHEDULING, avgLeadHours: -1 });
    expect(flags).toContainEqual(
      expect.objectContaining({ field: "avgLeadHours", issue: "out_of_range", severity: "error" }),
    );
  });

  it("flags noShowRate out of [0,1]", () => {
    const flags = checkSchedulingQuality({ ...SCHEDULING, noShowRate: 1.5 });
    expect(flags).toContainEqual(
      expect.objectContaining({ field: "noShowRate", issue: "out_of_range" }),
    );
  });
});

// ---------------------------------------------------------------------------
// checkRetentionQuality
// ---------------------------------------------------------------------------

describe("checkRetentionQuality", () => {
  it("returns no flags for valid vector", () => {
    expect(checkRetentionQuality(RETENTION)).toHaveLength(0);
  });

  it("flags zero totalVisits as missing", () => {
    const flags = checkRetentionQuality({ ...RETENTION, totalVisits: 0 });
    expect(flags).toContainEqual(
      expect.objectContaining({ field: "totalVisits", issue: "missing", severity: "warning" }),
    );
  });

  it("flags churnRiskScore > 1", () => {
    const flags = checkRetentionQuality({ ...RETENTION, churnRiskScore: 1.1 });
    expect(flags).toContainEqual(
      expect.objectContaining({ field: "churnRiskScore", issue: "out_of_range" }),
    );
  });
});

// ---------------------------------------------------------------------------
// checkNoShowRiskQuality
// ---------------------------------------------------------------------------

describe("checkNoShowRiskQuality", () => {
  it("returns no flags for valid vector", () => {
    expect(checkNoShowRiskQuality(NO_SHOW)).toHaveLength(0);
  });

  it("flags negative daysTillAppointment", () => {
    const flags = checkNoShowRiskQuality({ ...NO_SHOW, daysTillAppointment: -1 });
    expect(flags).toContainEqual(
      expect.objectContaining({ field: "daysTillAppointment", issue: "out_of_range" }),
    );
  });
});

// ---------------------------------------------------------------------------
// checkMarketplaceQuality
// ---------------------------------------------------------------------------

describe("checkMarketplaceQuality", () => {
  it("returns no flags for valid vector", () => {
    expect(checkMarketplaceQuality(MARKETPLACE)).toHaveLength(0);
  });

  it("flags empty preferredServiceIds", () => {
    const flags = checkMarketplaceQuality({ ...MARKETPLACE, preferredServiceIds: [] });
    expect(flags).toContainEqual(
      expect.objectContaining({ field: "preferredServiceIds", issue: "missing" }),
    );
  });

  it("flags negative avgSpend", () => {
    const flags = checkMarketplaceQuality({ ...MARKETPLACE, avgSpend: -10 });
    expect(flags).toContainEqual(
      expect.objectContaining({ field: "avgSpend", issue: "out_of_range" }),
    );
  });
});

// ---------------------------------------------------------------------------
// Contract builders
// ---------------------------------------------------------------------------

describe("buildSchedulingContract", () => {
  it("uses analytics_only consent", () => {
    const c = buildSchedulingContract(SCHEDULING);
    expect(c.consentFilter).toEqual(ANALYTICS_ONLY_CONSENT);
    expect(c.schema).toBe("scheduling_feature_v1");
    expect(c.version).toBe("1.0");
  });

  it("includes quality flags for invalid input", () => {
    const c = buildSchedulingContract({ ...SCHEDULING, preferredDayOfWeek: [] });
    expect(c.qualityFlags.length).toBeGreaterThan(0);
  });
});

describe("buildRetentionContract", () => {
  it("uses analytics_only consent", () => {
    const c = buildRetentionContract(RETENTION);
    expect(c.consentFilter).toEqual(ANALYTICS_ONLY_CONSENT);
  });
});

describe("buildNoShowRiskContract", () => {
  it("returns valid contract for clean vector", () => {
    const c = buildNoShowRiskContract(NO_SHOW);
    expect(c.qualityFlags).toHaveLength(0);
  });
});

describe("buildMarketplaceContract", () => {
  it("uses messaging consent (stricter)", () => {
    const c = buildMarketplaceContract(MARKETPLACE);
    expect(c.consentFilter).toEqual(MESSAGING_CONSENT);
    expect(c.consentFilter.requireExplicitConsent).toBe(true);
  });
});
