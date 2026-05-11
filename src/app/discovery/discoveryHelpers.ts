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
};

export type SalonStaffSummary = {
  id: string;
  name: string;
  role: string;
  rating?: number;
  imageUrl?: string;
};

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
