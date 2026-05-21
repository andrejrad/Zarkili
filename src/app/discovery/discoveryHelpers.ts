/**
 * discoveryHelpers.ts — W34 Stream B.
 *
 * Shared types used across the W22 discovery screens. Presentation-only;
 * real data sources are wired in Phase 2.3 (W35–W37).
 */

export type DiscoveryCategory = {
  id: string;
  label: string;
  emoji?: string;
};

export type FeaturedSalon = {
  id: string;
  /** tenantId used to load the full salon profile from Firestore (W38-DEBT-2). */
  tenantId?: string;
  name: string;
  city: string;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  priceLevel?: 1 | 2 | 3;
  distanceMiles?: number;
  /** Geographic coordinates for map pin placement. Optional until Firestore population (W22-DEBT-1). */
  latitude?: number;
  longitude?: number;
};

export type DiscoveryFeedPost = {
  id: string;
  salonId: string;
  salonName: string;
  caption: string;
  imageUrl?: string;
  likeCount: number;
  postedAt: string;
  /** True for FTC-compliant sponsored entries — UI should render a "Sponsored" badge */
  isSponsored?: boolean;
};

export type DiscoveryFeedFilter = "all" | "trending" | "near-me" | "new";

export type DiscoveryFilters = {
  priceLevels: Array<1 | 2 | 3>;
  minRating: number;
  maxDistanceMiles: number;
  categoryIds: string[];
  openNow: boolean;
};

export const DEFAULT_DISCOVERY_FILTERS: DiscoveryFilters = {
  priceLevels: [],
  minRating: 0,
  maxDistanceMiles: 25,
  categoryIds: [],
  openNow: false,
};

export type SalonReviewSnippet = {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  postedAt: string;
};

export type SalonProfile = {
  id: string;
  name: string;
  tagline?: string;
  city: string;
  addressLine: string;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  description: string;
};

export type SalonServiceSummary = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  description?: string;
  /** Staff first-names who can perform this service (max 3 shown + "and X more"). */
  staffNames?: string[];
  /** Human-readable next available slot, e.g. "Today 4:30 PM". */
  nextAvailableLabel?: string;
  variantCount?: number;
};

/** A single pricing/duration variant for a service (e.g. "Partial" vs "Full head"). */
export type ServiceVariantSummary = {
  id: string;
  name: string;
  durationMinutes: number;
  /** Pence / cents. */
  price: number;
  isDefault: boolean;
};

/** An optional add-on that can be bolted onto a service booking. */
export type ServiceAddonSummary = {
  id: string;
  name: string;
  durationMinutes: number;
  /** Incremental pence / cents. */
  price: number;
};

export type SalonStaffSummary = {
  id: string;
  name: string;
  role: string;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
  imageUrl?: string;
  /** IDs of service types this staff member can perform. */
  serviceTypeIds?: string[];
  /** Full bio for the detail screen. */
  bio?: string;
  /** First sentence of bio — used in mini-sheet. */
  bioSummary?: string;
  /** Human-readable next available slot for a specific service, e.g. "Today 2:00 PM". */
  nextAvailableLabel?: string;
};

import { formatMoney } from "../../shared/ui/money";

/**
 * Format a price stored in minor currency units (pence/cents) for display.
 *
 * NEW-DEBT-A: currency is multi-tenant — pass an explicit `currencyCode`
 * (ISO-4217, e.g. "GBP", "USD", "EUR") when known. Falls back to GBP when
 * the caller has not yet been plumbed through with currency context.
 *
 * Note: the legacy implementation rendered the input as `$amount.toFixed(2)`,
 * which mis-displayed minor-unit amounts (e.g. 8500 → "$8500.00"). Callers
 * already pass minor units (`priceCents`, `v.price`, `a.price`).
 */
export function formatPrice(minorUnits: number, currencyCode?: string): string {
  return formatMoney(minorUnits, currencyCode);
}
