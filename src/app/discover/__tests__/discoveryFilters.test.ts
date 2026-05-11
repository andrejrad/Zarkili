import {
  DEFAULT_FILTERS,
  applyDiscoveryFilters,
  applyDiscoveryFiltersAndSort,
  countActiveFilterDimensions,
  hasActiveFilters,
  sortDiscoveryResults,
} from "../discoveryFilters";
import type { DiscoverySalonCard } from "../../../domains/discovery";

function salon(p: Partial<DiscoverySalonCard> & { id: string }): DiscoverySalonCard {
  return {
    id: p.id,
    tenantId: p.tenantId ?? `t-${p.id}`,
    name: p.name ?? `Salon ${p.id}`,
    city: p.city ?? "Beverly Hills",
    categories: p.categories ?? ["hair"],
    rating: p.rating ?? 4.5,
    reviewCount: p.reviewCount ?? 100,
    priceFrom: p.priceFrom ?? 50,
    currency: p.currency ?? "USD",
    nextAvailableLabel: p.nextAvailableLabel ?? "Today",
    featuredService: p.featuredService ?? "Cut & blow-dry",
    member: p.member ?? false,
    bookingEnabled: p.bookingEnabled ?? true,
    messageEnabled: p.messageEnabled ?? true,
  };
}

describe("applyDiscoveryFilters", () => {
  const salons = [
    salon({ id: "1", name: "Bloom Studio", categories: ["hair"], priceFrom: 40, rating: 4.8, member: true }),
    salon({ id: "2", name: "Nail Bar", categories: ["nails"], priceFrom: 30, rating: 4.2, nextAvailableLabel: "Tomorrow" }),
    salon({ id: "3", name: "Glow Spa", categories: ["skin", "spa"], priceFrom: 120, rating: 4.6, nextAvailableLabel: "Sat Nov 8" }),
    salon({ id: "4", name: "Cheap Cuts", categories: ["hair"], priceFrom: 20, rating: 3.5, nextAvailableLabel: "Today" }),
  ];

  it("returns all when filters are default", () => {
    expect(applyDiscoveryFilters(salons, DEFAULT_FILTERS)).toHaveLength(4);
  });

  it("filters by query (case-insensitive substring across name/city/featuredService)", () => {
    const out = applyDiscoveryFilters(salons, { ...DEFAULT_FILTERS, query: "bloom" });
    expect(out.map((s) => s.id)).toEqual(["1"]);
  });

  it("filters by category", () => {
    const out = applyDiscoveryFilters(salons, { ...DEFAULT_FILTERS, category: "nails" });
    expect(out.map((s) => s.id)).toEqual(["2"]);
  });

  it("filters by price range", () => {
    const out = applyDiscoveryFilters(salons, { ...DEFAULT_FILTERS, priceRange: [25, 50] });
    expect(out.map((s) => s.id).sort()).toEqual(["1", "2"]);
  });

  it("filters by minimum rating", () => {
    const out = applyDiscoveryFilters(salons, { ...DEFAULT_FILTERS, minRating: 4.5 });
    expect(out.map((s) => s.id).sort()).toEqual(["1", "3"]);
  });

  it("filters by availability today", () => {
    const out = applyDiscoveryFilters(salons, { ...DEFAULT_FILTERS, availability: "today" });
    expect(out.map((s) => s.id).sort()).toEqual(["1", "4"]);
  });

  it("filters by availability tomorrow", () => {
    const out = applyDiscoveryFilters(salons, { ...DEFAULT_FILTERS, availability: "tomorrow" });
    expect(out.map((s) => s.id)).toEqual(["2"]);
  });

  it("filters this-week (today + tomorrow + weekday labels)", () => {
    const out = applyDiscoveryFilters(salons, { ...DEFAULT_FILTERS, availability: "this-week" });
    expect(out.map((s) => s.id).sort()).toEqual(["1", "2", "3", "4"]);
  });

  it("filters memberOnly", () => {
    const out = applyDiscoveryFilters(salons, { ...DEFAULT_FILTERS, memberOnly: true });
    expect(out.map((s) => s.id)).toEqual(["1"]);
  });
});

describe("sortDiscoveryResults", () => {
  const salons = [
    salon({ id: "a", rating: 4.0, reviewCount: 10, priceFrom: 100, member: false }),
    salon({ id: "b", rating: 4.8, reviewCount: 50, priceFrom: 80, member: true }),
    salon({ id: "c", rating: 4.8, reviewCount: 200, priceFrom: 60, member: false }),
  ];

  it("recommended sort: members first, then rating desc, then review count", () => {
    const out = sortDiscoveryResults(salons, "recommended");
    expect(out.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("rating-desc sort breaks ties by review count", () => {
    const out = sortDiscoveryResults(salons, "rating-desc");
    expect(out.map((s) => s.id)).toEqual(["c", "b", "a"]);
  });

  it("price-asc sort", () => {
    const out = sortDiscoveryResults(salons, "price-asc");
    expect(out.map((s) => s.id)).toEqual(["c", "b", "a"]);
  });

  it("price-desc sort", () => {
    const out = sortDiscoveryResults(salons, "price-desc");
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
    const salons = [
      salon({ id: "1", rating: 4.0, priceFrom: 80, categories: ["hair"] }),
      salon({ id: "2", rating: 4.9, priceFrom: 200, categories: ["hair"], member: true }),
      salon({ id: "3", rating: 4.8, priceFrom: 60, categories: ["nails"] }),
    ];
    const out = applyDiscoveryFiltersAndSort(salons, {
      ...DEFAULT_FILTERS,
      category: "hair",
      sort: "price-asc",
    });
    expect(out.map((s) => s.id)).toEqual(["1", "2"]);
  });
});
