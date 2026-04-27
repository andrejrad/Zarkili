import {
  assertNoCompetitorRecommendations,
  filterToContextTenant,
  attributeAcquisition,
  assertNoCommissionMessaging,
  findCommissionTokens,
  FORBIDDEN_COMMISSION_TOKENS,
} from "../guardrailsService";
import { MarketplaceError } from "../model";
import type { BookingFlowContext, RecommendedSalon } from "../model";

// ---------------------------------------------------------------------------
// assertNoCompetitorRecommendations
// ---------------------------------------------------------------------------

describe("assertNoCompetitorRecommendations", () => {
  const ctx: BookingFlowContext = { tenantId: "salon-A" };

  it("allows an empty recommendation list", () => {
    expect(() => assertNoCompetitorRecommendations(ctx, [])).not.toThrow();
  });

  it("allows recommendations that all match the booking-flow tenant", () => {
    const recs: RecommendedSalon[] = [
      { tenantId: "salon-A", reason: "more from this salon" },
      { tenantId: "salon-A" },
    ];
    expect(() => assertNoCompetitorRecommendations(ctx, recs)).not.toThrow();
  });

  it("throws COMPETITOR_RECOMMENDATION_BLOCKED on any cross-tenant rec", () => {
    const recs: RecommendedSalon[] = [
      { tenantId: "salon-A" },
      { tenantId: "salon-B", reason: "people also booked" },
    ];
    try {
      assertNoCompetitorRecommendations(ctx, recs);
      fail("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(MarketplaceError);
      expect((err as MarketplaceError).code).toBe("COMPETITOR_RECOMMENDATION_BLOCKED");
      expect((err as MarketplaceError).message).toContain("salon-B");
    }
  });

  it("throws INVALID_ATTRIBUTION when context.tenantId is empty", () => {
    try {
      assertNoCompetitorRecommendations({ tenantId: "" }, []);
      fail("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(MarketplaceError);
      expect((err as MarketplaceError).code).toBe("INVALID_ATTRIBUTION");
    }
  });
});

// ---------------------------------------------------------------------------
// filterToContextTenant
// ---------------------------------------------------------------------------

describe("filterToContextTenant", () => {
  it("returns only same-tenant recommendations", () => {
    const recs: RecommendedSalon[] = [
      { tenantId: "salon-A" },
      { tenantId: "salon-B" },
      { tenantId: "salon-A", reason: "x" },
    ];
    const out = filterToContextTenant({ tenantId: "salon-A" }, recs);
    expect(out).toHaveLength(2);
    expect(out.every((r) => r.tenantId === "salon-A")).toBe(true);
  });

  it("returns [] when context tenant is empty", () => {
    expect(filterToContextTenant({ tenantId: "" }, [{ tenantId: "salon-A" }])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// attributeAcquisition
// ---------------------------------------------------------------------------

describe("attributeAcquisition", () => {
  it("captures full attribution with explicit sourcePostId / sourceTenantId", () => {
    const out = attributeAcquisition({
      tenantId: "salon-A",
      customerUserId: "user-1",
      sourcePostId: "post-9",
      sourceTenantId: "salon-A",
      capturedAt: 1700000000000,
    });
    expect(out).toEqual({
      tenantId: "salon-A",
      customerUserId: "user-1",
      sourcePostId: "post-9",
      sourceTenantId: "salon-A",
      capturedAt: 1700000000000,
    });
  });

  it("defaults sourceTenantId to tenantId when omitted", () => {
    const out = attributeAcquisition({
      tenantId: "salon-A",
      customerUserId: "user-1",
    });
    expect(out.sourceTenantId).toBe("salon-A");
    expect(out.sourcePostId).toBeUndefined();
  });

  it("defaults capturedAt to Date.now() when omitted", () => {
    const before = Date.now();
    const out = attributeAcquisition({ tenantId: "salon-A", customerUserId: "user-1" });
    const after = Date.now();
    expect(out.capturedAt).toBeGreaterThanOrEqual(before);
    expect(out.capturedAt).toBeLessThanOrEqual(after);
  });

  it("throws INVALID_ATTRIBUTION when tenantId is missing", () => {
    expect(() =>
      attributeAcquisition({ tenantId: "", customerUserId: "user-1" }),
    ).toThrow(MarketplaceError);
  });

  it("throws INVALID_ATTRIBUTION when customerUserId is missing", () => {
    expect(() =>
      attributeAcquisition({ tenantId: "salon-A", customerUserId: "  " }),
    ).toThrow(MarketplaceError);
  });
});

// ---------------------------------------------------------------------------
// no-commission messaging
// ---------------------------------------------------------------------------

describe("findCommissionTokens", () => {
  it("returns [] for clean copy", () => {
    expect(findCommissionTokens("Discover stylists in your city.")).toEqual([]);
  });

  it("detects the literal token 'commission' (case-insensitive)", () => {
    expect(findCommissionTokens("Zero Commission, ever.")).toContain("commission");
  });

  it("detects multi-word phrases", () => {
    const hits = findCommissionTokens("There is no marketplace fee on bookings.");
    expect(hits).toContain("marketplace fee");
  });

  it("returns [] for empty text", () => {
    expect(findCommissionTokens("")).toEqual([]);
  });

  it("each forbidden token is itself detected (sanity)", () => {
    for (const tok of FORBIDDEN_COMMISSION_TOKENS) {
      expect(findCommissionTokens(`x ${tok} y`)).toContain(tok);
    }
  });
});

describe("assertNoCommissionMessaging", () => {
  it("passes on clean copy", () => {
    expect(() => assertNoCommissionMessaging("Find your stylist.")).not.toThrow();
  });

  it("throws COMMISSION_MESSAGING_FORBIDDEN with offenders listed", () => {
    try {
      assertNoCommissionMessaging("We charge a small platform fee per booking fee.");
      fail("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(MarketplaceError);
      expect((err as MarketplaceError).code).toBe("COMMISSION_MESSAGING_FORBIDDEN");
      expect((err as MarketplaceError).message).toContain("platform fee");
    }
  });
});
