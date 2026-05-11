export type DiscoveryCategoryId =
  | "all"
  | "nails"
  | "hair"
  | "skin"
  | "lashes"
  | "brows"
  | "massage"
  | "makeup"
  | "barber"
  | "waxing"
  | "spa"
  | "injectables"
  | "wellness";

export type DiscoveryCategory = {
  id: DiscoveryCategoryId;
};

export type DiscoverySalonCard = {
  id: string;
  tenantId: string;
  name: string;
  city: string;
  categories: Exclude<DiscoveryCategoryId, "all">[];
  rating: number;
  reviewCount: number;
  priceFrom: number;
  currency: string;
  nextAvailableLabel: string;
  featuredService: string;
  member: boolean;
  bookingEnabled: boolean;
  messageEnabled: boolean;
  /** Geographic coordinates for map pin placement. Optional until Firestore population (W22-DEBT-1). */
  locationLat?: number;
  locationLng?: number;
};

export type DiscoveryRecentBooking = {
  id: string;
  salonName: string;
  serviceName: string;
  dateTimeLabel: string;
  statusLabel: string;
};

export type DiscoveryHomeFeed = {
  categories: DiscoveryCategory[];
  featuredSalons: DiscoverySalonCard[];
  recentBookings: DiscoveryRecentBooking[];
};

export type DiscoveryExploreFeed = {
  categories: DiscoveryCategory[];
  salons: DiscoverySalonCard[];
};

// ---------------------------------------------------------------------------
// W22-DEBT-3: Editorial + sponsored feed types
// ---------------------------------------------------------------------------

/**
 * Editorial card: curated story-style card shown in the Home discovery row.
 * Stored in `platformEditorial/{cardId}` (global, not tenant-scoped).
 */
export type EditorialCard = {
  cardId: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  /** Internal link target — e.g. "ExploreResults?category=nails" */
  deepLink?: string;
  /** Ordinal for display ordering */
  sortOrder: number;
  /** YYYY-MM-DD — card is hidden after this date */
  expiresAt?: string;
  active: boolean;
};

/**
 * Sponsored listing: a salon card appearing in the DiscoverFeed with
 * an FTC-required "Sponsored" badge.
 * Stored in `sponsoredListings/{listingId}` (global).
 */
export type SponsoredListing = {
  listingId: string;
  tenantId: string;
  salonName: string;
  caption: string;
  imageUrl?: string;
  /** ISO datetime when the listing was created */
  createdAt: string;
  /** YYYY-MM-DD start date */
  startsAt: string;
  /** YYYY-MM-DD end date */
  endsAt: string;
  active: boolean;
};

/** Extends DiscoveryHomeFeed with editorial cards row */
export type DiscoveryHomeFeedWithEditorial = DiscoveryHomeFeed & {
  editorialCards: EditorialCard[];
};