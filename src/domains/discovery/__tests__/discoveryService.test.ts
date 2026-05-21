import { createDiscoveryService } from "../service";
import { discoveryCategories, featuredDiscoverySalons, recommendedDiscoverySalons } from "../mockData";
import type { DiscoveryRepository } from "../repository";

function makeRepo(overrides: Partial<DiscoveryRepository> = {}): DiscoveryRepository {
  return {
    listCategories: jest.fn().mockResolvedValue(discoveryCategories),
    listFeaturedSalons: jest.fn().mockResolvedValue(featuredDiscoverySalons),
    listRecentBookings: jest.fn().mockResolvedValue([]),
    listRecommendedSalons: jest.fn().mockResolvedValue(recommendedDiscoverySalons),
    getServiceCards: jest.fn().mockResolvedValue({ services: featuredDiscoverySalons, nextCursor: null, total: featuredDiscoverySalons.length, locationLabel: "" }),
    ...overrides,
  };
}

describe("DiscoveryService.getHomeFeed", () => {
  it("returns categories, featuredSalons, recentBookings, and recommendedSalons from the repository", async () => {
    const repo = makeRepo();
    const service = createDiscoveryService(repo);

    const feed = await service.getHomeFeed();

    expect(feed.categories).toEqual(discoveryCategories);
    expect(feed.featuredSalons).toEqual(featuredDiscoverySalons);
    expect(feed.recentBookings).toEqual([]);
    expect(feed.recommendedSalons).toEqual(recommendedDiscoverySalons);
  });

  it("includes all 13 expected categories", async () => {
    const service = createDiscoveryService(makeRepo());
    const feed = await service.getHomeFeed();

    const ids = feed.categories.map((c) => c.id);
    expect(ids).toContain("all");
    expect(ids).toContain("nails");
    expect(ids).toContain("hair");
    expect(ids).toContain("wellness");
    expect(ids).toHaveLength(13);
  });

  it("includes recentBookings from the repository", async () => {
    const recentBookings = [
      {
        id: "booking-1",
        salonName: "Luna Studio",
        serviceName: "Gloss + blowout",
        dateTimeLabel: "Tomorrow 10:00 AM",
        statusLabel: "Confirmed",
      },
    ];
    const repo = makeRepo({ listRecentBookings: jest.fn().mockResolvedValue(recentBookings) });
    const service = createDiscoveryService(repo);

    const feed = await service.getHomeFeed();

    expect(feed.recentBookings).toEqual(recentBookings);
  });

  it("calls repository methods concurrently (all four awaited)", async () => {
    const listCategories = jest.fn().mockResolvedValue(discoveryCategories);
    const listFeaturedSalons = jest.fn().mockResolvedValue(featuredDiscoverySalons);
    const listRecentBookings = jest.fn().mockResolvedValue([]);
    const listRecommendedSalons = jest.fn().mockResolvedValue([]);

    const service = createDiscoveryService({ listCategories, listFeaturedSalons, listRecentBookings, listRecommendedSalons, getServiceCards: jest.fn().mockResolvedValue({ services: [], nextCursor: null, total: 0, locationLabel: "" }) });
    await service.getHomeFeed();

    expect(listCategories).toHaveBeenCalledTimes(1);
    expect(listFeaturedSalons).toHaveBeenCalledTimes(1);
    expect(listRecentBookings).toHaveBeenCalledTimes(1);
    expect(listRecommendedSalons).toHaveBeenCalledTimes(1);
  });
});

describe("DiscoveryService.getExploreFeed", () => {
  it("returns categories and salons from the repository", async () => {
    const service = createDiscoveryService(makeRepo());
    const feed = await service.getExploreFeed();

    expect(feed.categories).toEqual(discoveryCategories);
    expect(feed.salons).toEqual(featuredDiscoverySalons);
  });

  it("returns empty salons list when repository has none", async () => {
    const service = createDiscoveryService(makeRepo({ getServiceCards: jest.fn().mockResolvedValue({ services: [], nextCursor: null, total: 0, locationLabel: "" }) }));
    const feed = await service.getExploreFeed();

    expect(feed.salons).toEqual([]);
  });

  it("propagates repository errors", async () => {
    const service = createDiscoveryService({
      listCategories: jest.fn().mockRejectedValue(new Error("Firestore unavailable")),
      listFeaturedSalons: jest.fn().mockResolvedValue([]),
      listRecentBookings: jest.fn().mockResolvedValue([]),
      listRecommendedSalons: jest.fn().mockResolvedValue([]),
      getServiceCards: jest.fn().mockResolvedValue({ services: [], nextCursor: null, total: 0, locationLabel: "" }),
    });

    await expect(service.getExploreFeed()).rejects.toThrow("Firestore unavailable");
  });
});

describe("mockData contract", () => {
  it("discoveryCategories has all 13 categories starting with 'all'", () => {
    expect(discoveryCategories[0].id).toBe("all");
    expect(discoveryCategories).toHaveLength(13);
  });

  it("featuredDiscoverySalons have all required ServiceTypeCard fields", () => {
    for (const salon of featuredDiscoverySalons) {
      expect(typeof salon.id).toBe("string");
      expect(typeof salon.tenantId).toBe("string");
      expect(typeof salon.serviceName).toBe("string");
      expect(
        salon.serviceAverageRating === null || typeof salon.serviceAverageRating === "number"
      ).toBe(true);
      expect(typeof salon.isBookableOnline).toBe("boolean");
      expect(typeof salon.categoryId).toBe("string");
    }
  });

  it("featuredDiscoverySalons includes at least one bookingEnabled salon", () => {
    expect(featuredDiscoverySalons.some((s) => s.isBookableOnline)).toBe(true);
  });

  it("featuredDiscoverySalons includes at least one salon with bookingEnabled false", () => {
    expect(featuredDiscoverySalons.some((s) => !s.isBookableOnline)).toBe(true);
  });
});
