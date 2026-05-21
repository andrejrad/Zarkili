/**
 * discoveryFilters.ts — pure filter + sort helpers for B.3/B.4.
 *
 * Operates on `ServiceTypeCard[]` from the discovery domain.
 * No I/O, no React — keeps screen logic testable without renderer setup.
 */

import type {
  DiscoveryCategoryId,
  ServiceTypeCard,
} from "../../domains/discovery";

export type AvailabilityWindow = "any" | "today" | "tomorrow" | "this-week";

export type DiscoverySortKey =
  | "recommended"
  | "nearest"
  | "rating-desc"
  | "price-asc"
  | "price-desc";

export type DiscoveryFilters = {
  /** Optional substring match against serviceName + locationDisplayName. */
  query: string;
  /** "all" or any specific category. */
  category: DiscoveryCategoryId;
  /** Inclusive price range in pence. */
  priceRange: [number, number];
  /** Minimum rating, 0–5 (e.g. 4 means ≥ 4.0). */
  minRating: number;
  availability: AvailabilityWindow;
  /** Member-points services only. */
  memberOnly: boolean;
  sort: DiscoverySortKey;
  /** Distance filter in km (GPS-gated; default 5). */
  distanceKm: number;
};

export const DEFAULT_FILTERS: DiscoveryFilters = {
  query: "",
  category: "all",
  priceRange: [0, 50000],
  minRating: 0,
  availability: "any",
  memberOnly: false,
  sort: "recommended",
  distanceKm: 5,
};

function matchesAvailability(
  service: ServiceTypeCard,
  window: AvailabilityWindow,
): boolean {
  if (window === "any") return true;
  const at = service.nextAvailableAt;
  if (!at) return false;
  const serviceDate = new Date(at);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + 86_400_000);
  const dayAfterTomorrow = new Date(tomorrowStart.getTime() + 86_400_000);
  const weekEnd = new Date(todayStart.getTime() + 7 * 86_400_000);
  if (window === "today") {
    return serviceDate >= todayStart && serviceDate < tomorrowStart;
  }
  if (window === "tomorrow") {
    return serviceDate >= tomorrowStart && serviceDate < dayAfterTomorrow;
  }
  // this-week — within the next 7 days
  return serviceDate >= todayStart && serviceDate < weekEnd;
}

export function applyDiscoveryFilters(
  services: ServiceTypeCard[],
  filters: DiscoveryFilters,
): ServiceTypeCard[] {
  const q = filters.query.trim().toLowerCase();
  const [lo, hi] = filters.priceRange;
  return services.filter((s) => {
    if (q.length > 0) {
      const haystack = `${s.serviceName} ${s.locationDisplayName}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.category !== "all" && s.categoryId !== filters.category) {
      return false;
    }
    if (s.priceFrom < lo || s.priceFrom > hi) return false;
    const rating = s.serviceAverageRating ?? s.locationAverageRating ?? 0;
    if (rating < filters.minRating) return false;
    if (!matchesAvailability(s, filters.availability)) return false;
    if (filters.memberOnly && s.memberPoints === null) return false;
    return true;
  });
}

export function sortDiscoveryResults(
  services: ServiceTypeCard[],
  sort: DiscoverySortKey,
): ServiceTypeCard[] {
  const arr = [...services];
  switch (sort) {
    case "rating-desc":
      arr.sort((a, b) => {
        const ra = a.serviceAverageRating ?? a.locationAverageRating ?? 0;
        const rb = b.serviceAverageRating ?? b.locationAverageRating ?? 0;
        if (rb !== ra) return rb - ra;
        return b.serviceReviewCount - a.serviceReviewCount;
      });
      return arr;
    case "nearest":
      arr.sort((a, b) => (a.distanceMetres ?? Infinity) - (b.distanceMetres ?? Infinity));
      return arr;
    case "price-asc":
      arr.sort((a, b) => a.priceFrom - b.priceFrom);
      return arr;
    case "price-desc":
      arr.sort((a, b) => b.priceFrom - a.priceFrom);
      return arr;
    case "recommended":
    default: {
      // Member-points services first, then rating desc, then review count.
      arr.sort((a, b) => {
        const am = a.memberPoints !== null;
        const bm = b.memberPoints !== null;
        if (am !== bm) return am ? -1 : 1;
        const ra = a.serviceAverageRating ?? a.locationAverageRating ?? 0;
        const rb = b.serviceAverageRating ?? b.locationAverageRating ?? 0;
        if (rb !== ra) return rb - ra;
        return b.serviceReviewCount - a.serviceReviewCount;
      });
      return arr;
    }
  }
}

export function applyDiscoveryFiltersAndSort(
  services: ServiceTypeCard[],
  filters: DiscoveryFilters,
): ServiceTypeCard[] {
  return sortDiscoveryResults(applyDiscoveryFilters(services, filters), filters.sort);
}

/** True when filters differ from `DEFAULT_FILTERS` (used to show a "Reset" affordance). */
export function hasActiveFilters(filters: DiscoveryFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.category !== DEFAULT_FILTERS.category ||
    filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] ||
    filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1] ||
    filters.minRating !== DEFAULT_FILTERS.minRating ||
    filters.availability !== DEFAULT_FILTERS.availability ||
    filters.memberOnly !== DEFAULT_FILTERS.memberOnly
  );
}

/** Count of independent filter dimensions currently narrowing the result set. */
export function countActiveFilterDimensions(filters: DiscoveryFilters): number {
  let n = 0;
  if (filters.query.trim().length > 0) n += 1;
  if (filters.category !== DEFAULT_FILTERS.category) n += 1;
  if (
    filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] ||
    filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1]
  ) {
    n += 1;
  }
  if (filters.minRating !== DEFAULT_FILTERS.minRating) n += 1;
  if (filters.availability !== DEFAULT_FILTERS.availability) n += 1;
  if (filters.memberOnly !== DEFAULT_FILTERS.memberOnly) n += 1;
  if (filters.distanceKm !== DEFAULT_FILTERS.distanceKm) n += 1;
  return n;
}

/**
 * Badge count used in Phase 5 Filters button (4 dimensions per spec).
 * Pass `gpsGranted` to include distance dimension.
 * Pass `p95Price` (p95 of local prices) to gate the price dimension.
 */
export function countFilterBadge(
  filters: DiscoveryFilters,
  p95Price: number,
  gpsGranted: boolean
): number {
  let count = 0;
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < p95Price) count++;
  if (filters.availability !== "any") count++;
  if (filters.minRating > 0) count++;
  if (filters.distanceKm !== DEFAULT_FILTERS.distanceKm && gpsGranted) count++;
  return count;
}
