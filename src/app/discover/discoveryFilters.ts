/**
 * discoveryFilters.ts — pure filter + sort helpers for B.3/B.4.
 *
 * Operates on `DiscoverySalonCard[]` from the existing discovery domain.
 * No I/O, no React — keeps screen logic testable without renderer setup.
 */

import type {
  DiscoveryCategoryId,
  DiscoverySalonCard,
} from "../../domains/discovery";

export type AvailabilityWindow = "any" | "today" | "tomorrow" | "this-week";

export type DiscoverySortKey =
  | "recommended"
  | "rating-desc"
  | "price-asc"
  | "price-desc";

export type DiscoveryFilters = {
  /** Optional substring match against name + city + featuredService. */
  query: string;
  /** "all" or any specific category. */
  category: DiscoveryCategoryId;
  /** Inclusive price range in USD. */
  priceRange: [number, number];
  /** Minimum rating, 0–5 (e.g. 4 means ≥ 4.0). */
  minRating: number;
  availability: AvailabilityWindow;
  /** Membership-only filter. */
  memberOnly: boolean;
  sort: DiscoverySortKey;
};

export const DEFAULT_FILTERS: DiscoveryFilters = {
  query: "",
  category: "all",
  priceRange: [0, 500],
  minRating: 0,
  availability: "any",
  memberOnly: false,
  sort: "recommended",
};

const TODAY_LABELS = ["Today", "today", "Now", "now"];
const TOMORROW_LABELS = ["Tomorrow", "tomorrow"];
const THIS_WEEK_LABELS = [
  "This week",
  "this week",
  ...TODAY_LABELS,
  ...TOMORROW_LABELS,
];

function matchesAvailability(
  salon: DiscoverySalonCard,
  window: AvailabilityWindow,
): boolean {
  if (window === "any") return true;
  const label = salon.nextAvailableLabel ?? "";
  if (window === "today") {
    return TODAY_LABELS.some((l) => label.includes(l));
  }
  if (window === "tomorrow") {
    return TOMORROW_LABELS.some((l) => label.includes(l));
  }
  // this-week is permissive — any near-term label OR a weekday string.
  return (
    THIS_WEEK_LABELS.some((l) => label.includes(l)) ||
    /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/.test(label)
  );
}

export function applyDiscoveryFilters(
  salons: DiscoverySalonCard[],
  filters: DiscoveryFilters,
): DiscoverySalonCard[] {
  const q = filters.query.trim().toLowerCase();
  const [lo, hi] = filters.priceRange;
  return salons.filter((s) => {
    if (q.length > 0) {
      const haystack = `${s.name} ${s.city} ${s.featuredService}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.category !== "all" && !s.categories.includes(filters.category)) {
      return false;
    }
    if (s.priceFrom < lo || s.priceFrom > hi) return false;
    if (s.rating < filters.minRating) return false;
    if (!matchesAvailability(s, filters.availability)) return false;
    if (filters.memberOnly && !s.member) return false;
    return true;
  });
}

export function sortDiscoveryResults(
  salons: DiscoverySalonCard[],
  sort: DiscoverySortKey,
): DiscoverySalonCard[] {
  const arr = [...salons];
  switch (sort) {
    case "rating-desc":
      arr.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
      });
      return arr;
    case "price-asc":
      arr.sort((a, b) => a.priceFrom - b.priceFrom);
      return arr;
    case "price-desc":
      arr.sort((a, b) => b.priceFrom - a.priceFrom);
      return arr;
    case "recommended":
    default: {
      // Members first, then rating desc, then review count.
      arr.sort((a, b) => {
        if (a.member !== b.member) return a.member ? -1 : 1;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
      });
      return arr;
    }
  }
}

export function applyDiscoveryFiltersAndSort(
  salons: DiscoverySalonCard[],
  filters: DiscoveryFilters,
): DiscoverySalonCard[] {
  return sortDiscoveryResults(applyDiscoveryFilters(salons, filters), filters.sort);
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
  return n;
}
