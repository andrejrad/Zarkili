import {
  DEFAULT_FILTERS,
  applyDiscoveryFilters,
  applyDiscoveryFiltersAndSort,
  countActiveFilterDimensions,
  hasActiveFilters,
  sortDiscoveryResults,
} from "../discoveryFilters";
import type { ServiceTypeCard } from "../../../domains/discovery";

// ISO date helpers for availability filter tests — computed once per test run.
const NOW = new Date();
const todayISO = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 10, 0).toISOString();
const tomorrowISO = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 1, 10, 0).toISOString();
const dayInWeekISO = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 3, 10, 0).toISOString();

function service(p: Partial<ServiceTypeCard> & { id: string }): ServiceTypeCard {
  const { id, ...rest } = p;
  return {
    id,
    tenantId: `t-${id}`,
    locationId: `loc-${id}`,
    categoryId: "hair",
    categoryName: "Hair",
    serviceName: `Service ${id}`,
    locationDisplayName: "Studio · Beverly Hills",
    locationCity: "Beverly Hills",
    variantCount: 1,
    durationFrom: 45,
    serviceAverageRating: 4.5,
    serviceReviewCount: 100,
    locationAverageRating: 4.5,
    locationReviewCount: 200,
    nextAvailableAt: todayISO,
    isFullyBooked: false,
    priceFrom: 5000,
    primaryPhotoUrl: null,
    primaryPhotoSource: null,
    isBookableOnline: true,
    locationLat: 34.0,
    locationLng: -118.5,
    distanceMetres: 500,
    isSaved: null,
    memberPoints: null,
    popularityScore: 0,
    ...rest,
  };
}

describe("applyDiscoveryFilters", () => {
  const services = [
    service({ id: "1", serviceName: "Bloom Studio", categoryId: "hair", priceFrom: 40, serviceAverageRating: 4.8, memberPoints: 100, nextAvailableAt: todayISO }),
    service({ id: "2", serviceName: "Nail Bar", categoryId: "nails", priceFrom: 30, serviceAverageRating: 4.2, nextAvailableAt: tomorrowISO }),
    service({ id: "3", serviceName: "Glow Spa", categoryId: "skin", priceFrom: 120, serviceAverageRating: 4.6, nextAvailableAt: dayInWeekISO }),
    service({ id: "4", serviceName: "Cheap Cuts", categoryId: "hair", priceFrom: 20, serviceAverageRating: 3.5, nextAvailableAt: todayISO }),
  ];

  it("returns all when filters are default", () => {
    expect(applyDiscoveryFilters(services, DEFAULT_FILTERS)).toHaveLength(4);
  });

  it("filters by query (case-insensitive substring across serviceName/locationDisplayName)", () => {
    const out = applyDiscoveryFilters(services, { ...DEFAULT_FILTERS, query: "bloom" });
    expect(out.map((s) => s.id)).toEqual(["1"]);
  });

  it("filters by category", () => {
    const out = applyDiscoveryFilters(services, { ...DEFAULT_FILTERS, category: "nails" });
    expect(out.map((s) => s.id)).toEqual(["2"]);
  });

  it("filters by price range", () => {
    const out = applyDiscoveryFilters(services, { ...DEFAULT_FILTERS, priceRange: [25, 50] });
    expect(out.map((s) => s.id).sort()).toEqual(["1", "2"]);
  });

  it("filters by minimum rating", () => {
    const out = applyDiscoveryFilters(services, { ...DEFAULT_FILTERS, minRating: 4.5 });
    expect(out.map((s) => s.id).sort()).toEqual(["1", "3"]);
  });

  it("filters by availability today", () => {
    const out = applyDiscoveryFilters(services, { ...DEFAULT_FILTERS, availability: "today" });
    expect(out.map((s) => s.id).sort()).toEqual(["1", "4"]);
  });

  it("filters by availability tomorrow", () => {
    const out = applyDiscoveryFilters(services, { ...DEFAULT_FILTERS, availability: "tomorrow" });
    expect(out.map((s) => s.id)).toEqual(["2"]);
  });

  it("filters this-week (today + tomorrow + within-7-days)", () => {
    const out = applyDiscoveryFilters(services, { ...DEFAULT_FILTERS, availability: "this-week" });
    expect(out.map((s) => s.id).sort()).toEqual(["1", "2", "3", "4"]);
  });

  it("filters memberOnly", () => {
    const out = applyDiscoveryFilters(services, { ...DEFAULT_FILTERS, memberOnly: true });
    expect(out.map((s) => s.id)).toEqual(["1"]);
  });
});

describe("sortDiscoveryResults", () => {
  const services = [
    service({ id: "a", serviceAverageRating: 4.0, serviceReviewCount: 10, priceFrom: 100, memberPoints: null }),
    service({ id: "b", serviceAverageRating: 4.8, serviceReviewCount: 50, priceFrom: 80, memberPoints: 100 }),
    service({ id: "c", serviceAverageRating: 4.8, serviceReviewCount: 200, priceFrom: 60, memberPoints: null }),
  ];

  it("recommended sort: member-points first, then rating desc, then review count", () => {
    const out = sortDiscoveryResults(services, "recommended");
    expect(out.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("rating-desc sort breaks ties by review count", () => {
    const out = sortDiscoveryResults(services, "rating-desc");
    expect(out.map((s) => s.id)).toEqual(["c", "b", "a"]);
  });

  it("price-asc sort", () => {
    const out = sortDiscoveryResults(services, "price-asc");
    expect(out.map((s) => s.id)).toEqual(["c", "b", "a"]);
  });

  it("price-desc sort", () => {
    const out = sortDiscoveryResults(services, "price-desc");
    expect(out.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });
});

describe("hasActiveFilters / countActiveFilterDimensions", () => {
  it("default → no active filters", () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(countActiveFilterDimensions(DEFAULT_FILTERS)).toBe(0);
  });

  it("counts independent dimensions", () => {
    const f = {
      ...DEFAULT_FILTERS,
      query: "spa",
      category: "spa" as const,
      priceRange: [25, 200] as [number, number],
      minRating: 4,
      availability: "today" as const,
      memberOnly: true,
    };
    expect(hasActiveFilters(f)).toBe(true);
    expect(countActiveFilterDimensions(f)).toBe(6);
  });
});

describe("applyDiscoveryFiltersAndSort", () => {
  it("filters then sorts", () => {
    const services = [
      service({ id: "1", serviceAverageRating: 4.0, priceFrom: 80, categoryId: "hair" }),
      service({ id: "2", serviceAverageRating: 4.9, priceFrom: 200, categoryId: "hair", memberPoints: 100 }),
      service({ id: "3", serviceAverageRating: 4.8, priceFrom: 60, categoryId: "nails" }),
    ];
    const out = applyDiscoveryFiltersAndSort(services, {
      ...DEFAULT_FILTERS,
      category: "hair",
      sort: "price-asc",
    });
    expect(out.map((s) => s.id)).toEqual(["1", "2"]);
  });
});
