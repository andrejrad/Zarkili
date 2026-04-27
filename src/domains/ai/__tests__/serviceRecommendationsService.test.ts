import {
  buildDeterministicRecommendations,
  createServiceRecommendationsService,
  filterCatalogForClient,
  type ClientProfile,
  type RecommendationsModelInput,
  type RecommendationsModelOutput,
  type ServiceCatalogItem,
} from "../serviceRecommendationsService";

const FEATURE_CAP = 140; // matches starterFeatureCaps["service-recommendations"]

function createUsage(featureSpend: number, globalSpend: number) {
  return {
    monthKey: "2026-04",
    globalSpendUsd: globalSpend,
    featureSpendUsd: { "service-recommendations": featureSpend },
  };
}

const catalog: ReadonlyArray<ServiceCatalogItem> = [
  { serviceId: "haircut", name: "Haircut", category: "hair", priceUsd: 40, available: true },
  { serviceId: "color", name: "Color", category: "hair", priceUsd: 120, available: true },
  { serviceId: "manicure", name: "Manicure", category: "nails", priceUsd: 30, available: true },
  { serviceId: "pedicure", name: "Pedicure", category: "nails", priceUsd: 35, available: true },
  { serviceId: "wax", name: "Wax", category: "wax", priceUsd: 50, available: false },
  { serviceId: "massage-deep", name: "Deep Massage", category: "spa", priceUsd: 90, available: true, tags: ["adult-only"] },
];

const clientReturning: ClientProfile = {
  clientId: "C1",
  pastServiceIds: ["haircut", "manicure"],
  maxPriceUsd: 100,
  disallowedCategories: ["adult-only"],
};

describe("filterCatalogForClient", () => {
  it("drops unavailable, over-budget, and disallowed services", () => {
    const filtered = filterCatalogForClient(catalog, clientReturning).map((c) => c.serviceId);
    expect(filtered).toContain("haircut");
    expect(filtered).toContain("manicure");
    expect(filtered).toContain("pedicure");
    expect(filtered).not.toContain("wax"); // unavailable
    expect(filtered).not.toContain("color"); // over priceUsd cap
    expect(filtered).not.toContain("massage-deep"); // disallowed tag
  });
});

describe("buildDeterministicRecommendations", () => {
  it("ranks repeat-affinity services first with reason codes", () => {
    const filtered = filterCatalogForClient(catalog, clientReturning);
    const recs = buildDeterministicRecommendations(filtered, clientReturning, 3);
    expect(recs[0].serviceId).toMatch(/haircut|manicure/);
    expect(recs[0].reasonCodes).toContain("repeat-affinity");
    expect(recs[0].score).toBeGreaterThan(0.7);
  });

  it("uses category-affinity when no repeat match exists", () => {
    const newClient: ClientProfile = { clientId: "C2", pastServiceIds: ["haircut"] };
    const recs = buildDeterministicRecommendations(catalog, newClient, 5);
    const color = recs.find((r) => r.serviceId === "color");
    expect(color?.reasonCodes).toContain("category-affinity");
  });

  it("falls back to popular-in-tenant for first-time clients", () => {
    const cold: ClientProfile = { clientId: "C3", pastServiceIds: [] };
    const recs = buildDeterministicRecommendations(catalog, cold, 2);
    expect(recs.every((r) => r.reasonCodes.includes("popular-in-tenant"))).toBe(true);
  });
});

describe("service recommendations service budget guard integration", () => {
  it("returns deterministic-fallback when feature cap is exhausted (no provider call)", async () => {
    const callModel = jest.fn<Promise<RecommendationsModelOutput>, [RecommendationsModelInput]>();
    const service = createServiceRecommendationsService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP, 200),
      callModel,
    });

    const result = await service.recommend({
      tenantId: "tenantA",
      monthKey: "2026-04",
      client: clientReturning,
      catalog,
    });

    expect(callModel).not.toHaveBeenCalled();
    expect(result.mode).toBe("deterministic-fallback");
    expect(result.providerCalled).toBe(false);
    expect(result.guard.state).toBe("exhausted");
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("downshifts to low-cost tier in protection state and emits ai-augmented mode", async () => {
    const callModel = jest.fn(async (input: RecommendationsModelInput) => ({
      recommendations: [
        { serviceId: "manicure", score: 0.95, confidence: 0.9, sourceSignals: [`tier:${input.modelTier}`] },
      ],
    }));
    const service = createServiceRecommendationsService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP * 0.92, 400),
      callModel,
    });

    const result = await service.recommend({
      tenantId: "tenantA",
      monthKey: "2026-04",
      client: clientReturning,
      catalog,
    });

    expect(callModel).toHaveBeenCalledWith(expect.objectContaining({ modelTier: "low-cost" }));
    expect(result.mode).toBe("ai-augmented");
    expect(result.guard.state).toBe("protection");
    expect(result.recommendations[0].reasonCodes).toContain("ai-personalized");
  });

  it("uses high tier in healthy state", async () => {
    const callModel = jest.fn(async (input: RecommendationsModelInput) => ({
      recommendations: [
        { serviceId: "haircut", score: 0.9, confidence: 0.9, sourceSignals: [`tier:${input.modelTier}`] },
      ],
    }));
    const service = createServiceRecommendationsService({
      getUsageSnapshot: async () => createUsage(20, 200),
      callModel,
    });

    const result = await service.recommend({
      tenantId: "tenantA",
      monthKey: "2026-04",
      client: clientReturning,
      catalog,
    });

    expect(callModel).toHaveBeenCalledWith(expect.objectContaining({ modelTier: "high" }));
    expect(result.mode).toBe("ai-augmented");
    expect(result.guard.state).toBe("healthy");
  });

  it("filters out model recommendations that violate catalog policies", async () => {
    const callModel = jest.fn(async () => ({
      recommendations: [
        // unavailable
        { serviceId: "wax", score: 0.99, confidence: 0.95, sourceSignals: ["model"] },
        // over price cap
        { serviceId: "color", score: 0.9, confidence: 0.9, sourceSignals: ["model"] },
        // valid
        { serviceId: "manicure", score: 0.8, confidence: 0.85, sourceSignals: ["model"] },
      ],
    }));
    const service = createServiceRecommendationsService({
      getUsageSnapshot: async () => createUsage(20, 200),
      callModel,
    });

    const result = await service.recommend({
      tenantId: "tenantA",
      monthKey: "2026-04",
      client: clientReturning,
      catalog,
    });

    expect(result.mode).toBe("ai-augmented");
    const ids = result.recommendations.map((r) => r.serviceId);
    expect(ids).toEqual(["manicure"]);
  });

  it("falls back to deterministic mode when model output is empty after policy filter", async () => {
    const callModel = jest.fn(async () => ({
      recommendations: [{ serviceId: "wax", score: 0.99, confidence: 0.95, sourceSignals: [] }],
    }));
    const service = createServiceRecommendationsService({
      getUsageSnapshot: async () => createUsage(20, 200),
      callModel,
    });

    const result = await service.recommend({
      tenantId: "tenantA",
      monthKey: "2026-04",
      client: clientReturning,
      catalog,
    });

    expect(result.mode).toBe("deterministic-fallback");
    expect(result.providerCalled).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("falls back to deterministic mode when model throws", async () => {
    const callModel = jest.fn(async () => {
      throw new Error("provider error");
    });
    const service = createServiceRecommendationsService({
      getUsageSnapshot: async () => createUsage(20, 200),
      callModel,
    });

    const result = await service.recommend({
      tenantId: "tenantA",
      monthKey: "2026-04",
      client: clientReturning,
      catalog,
    });

    expect(result.mode).toBe("deterministic-fallback");
    expect(result.providerCalled).toBe(true);
  });

  it("emits warning telemetry when usage crosses warning threshold", async () => {
    const logTelemetryEvent = jest.fn();
    const logAlert = jest.fn();
    const service = createServiceRecommendationsService({
      getUsageSnapshot: async () => createUsage(FEATURE_CAP * 0.75, 200),
      callModel: async () => ({
        recommendations: [{ serviceId: "haircut", score: 0.9, confidence: 0.9, sourceSignals: [] }],
      }),
      logTelemetryEvent,
      logAlert,
    });

    const result = await service.recommend({
      tenantId: "tenantA",
      monthKey: "2026-04",
      client: clientReturning,
      catalog,
    });

    expect(result.guard.state).toBe("warning");
    expect(logTelemetryEvent).toHaveBeenCalledTimes(1);
    expect(logAlert).toHaveBeenCalledTimes(1);
  });

  it("returns deterministic-only when no callModel dep is provided", async () => {
    const service = createServiceRecommendationsService({
      getUsageSnapshot: async () => createUsage(20, 200),
    });

    const result = await service.recommend({
      tenantId: "tenantA",
      monthKey: "2026-04",
      client: clientReturning,
      catalog,
    });

    expect(result.mode).toBe("deterministic-fallback");
    expect(result.providerCalled).toBe(false);
    expect(result.guard.state).toBe("healthy");
  });
});
