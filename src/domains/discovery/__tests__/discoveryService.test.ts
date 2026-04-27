import { createDiscoveryService } from "../service";
import { discoveryCategories, featuredDiscoverySalons } from "../mockData";
import type { DiscoveryRepository } from "../repository";

function makeRepo(overrides: Partial<DiscoveryRepository> = {}): DiscoveryRepository {
  return {
    listCategories: jest.fn().mockResolvedValue(discoveryCategories),
    listFeaturedSalons: jest.fn().mockResolvedValue(featuredDiscoverySalons),
    listRecentBookings: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("DiscoveryService.getHomeFeed", () => {
  it("returns categories, featuredSalons, and recentBookings from the repository", async () => {
    const repo = makeRepo();
    const service = createDiscoveryService(repo);

    const feed = await service.getHomeFeed();

    expect(feed.categories).toEqual(discoveryCategories);
    expect(feed.featuredSalons).toEqual(featuredDiscoverySalons);
    expect(feed.recentBookings).toEqual([]);
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

  it("calls repository methods concurrently (all three awaited)", async () => {
    const listCategories = jest.fn().mockResolvedValue(discoveryCategories);
    const listFeaturedSalons = jest.fn().mockResolvedValue(featuredDiscoverySalons);
    const listRecentBookings = jest.fn().mockResolvedValue([]);

    const service = createDiscoveryService({ listCategories, listFeaturedSalons, listRecentBookings });
    await service.getHomeFeed();

    expect(listCategories).toHaveBeenCalledTimes(1);
    expect(listFeaturedSalons).toHaveBeenCalledTimes(1);
    expect(listRecentBookings).toHaveBeenCalledTimes(1);
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
    const service = createDiscoveryService(makeRepo({ listFeaturedSalons: jest.fn().mockResolvedValue([]) }));
    const feed = await service.getExploreFeed();

    expect(feed.salons).toEqual([]);
  });

  it("propagates repository errors", async () => {
    const service = createDiscoveryService({
      listCategories: jest.fn().mockRejectedValue(new Error("Firestore unavailable")),
      listFeaturedSalons: jest.fn().mockResolvedValue([]),
      listRecentBookings: jest.fn().mockResolvedValue([]),
    });

    await expect(service.getExploreFeed()).rejects.toThrow("Firestore unavailable");
  });
});

describe("mockData contract", () => {
  it("discoveryCategories has all 13 categories starting with 'all'", () => {
    expect(discoveryCategories[0].id).toBe("all");
    expect(discoveryCategories).toHaveLength(13);
  });

  it("featuredDiscoverySalons have all required DiscoverySalonCard fields", () => {
    for (const salon of featuredDiscoverySalons) {
      expect(typeof salon.id).toBe("string");
      expect(typeof salon.tenantId).toBe("string");
      expect(typeof salon.name).toBe("string");
      expect(typeof salon.rating).toBe("number");
      expect(typeof salon.bookingEnabled).toBe("boolean");
      expect(Array.isArray(salon.categories)).toBe(true);
    }
  });

  it("featuredDiscoverySalons includes at least one bookingEnabled salon", () => {
    expect(featuredDiscoverySalons.some((s) => s.bookingEnabled)).toBe(true);
  });

  it("featuredDiscoverySalons includes at least one salon with bookingEnabled false", () => {
    expect(featuredDiscoverySalons.some((s) => !s.bookingEnabled)).toBe(true);
  });
});
