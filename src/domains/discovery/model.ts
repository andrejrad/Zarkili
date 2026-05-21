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



export type DiscoveryRecentBooking = {
  id: string;
  salonName: string;
  serviceName: string;
  dateTimeLabel: string;
  statusLabel: string;
};

export type ReviewQuote = {
  id: string;
  text: string;
  /** First name + last initial only (e.g. "Aisha K.") */
  reviewerName: string;
  serviceName: string;
  salonName: string;
};

export type DiscoveryHomeFeed = {
  categories: DiscoveryCategory[];
  featuredSalons: ServiceTypeCard[];
  recentBookings: DiscoveryRecentBooking[];
  recommendedSalons: ServiceTypeCard[];
  /** 2–3 real client review quotes shown to guest users */
  guestReviews: ReviewQuote[];
};

export type DiscoveryExploreFeed = {
  categories: DiscoveryCategory[];
  salons: ServiceTypeCard[];
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

// ---------------------------------------------------------------------------
// Phase 5 — Service data model v3 discovery types
// ---------------------------------------------------------------------------

export type ServiceTypeCard = {
  id: string;
  tenantId: string;
  locationId: string;
  categoryId: string;
  categoryName: string;
  serviceName: string;
  locationDisplayName: string;
  /** City name for the "near {city}" label — e.g. "London". */
  locationCity: string;
  priceFrom: number;
  variantCount: number;
  durationFrom: number;
  serviceAverageRating: number | null;
  serviceReviewCount: number;
  locationAverageRating: number | null;
  locationReviewCount: number;
  nextAvailableAt: string | null;
  isFullyBooked: boolean;
  primaryPhotoUrl: string | null;
  primaryPhotoSource: "client" | "salon" | null;
  isBookableOnline: boolean;
  locationLat: number;
  locationLng: number;
  distanceMetres: number | null;
  isSaved: boolean | null;
  memberPoints: number | null;
  /** CF-computed popularity score (normalizedBooking×0.6 + normalizedRating×0.3 + recencyFactor×0.1) */
  popularityScore: number;
};

// ---------------------------------------------------------------------------
// Feed post types (sponsored + editorial)
// ---------------------------------------------------------------------------

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

export type ServiceVariantObject = {
  variantId: string;
  name: string;
  durationMinutes: number;
  price: number;
  currency: string;
  isDefault: boolean;
};

export type ServiceAddonObject = {
  addonId: string;
  name: string;
  price: number;
  currency: string;
  durationMinutes: number;
};

export type TechnicianCardObject = {
  staffId: string;
  displayName: string;
  firstName: string;
  avatarUrl: string | null;
  specialtyTags: string[];
  averageRating: number | null;
  reviewCount: number;
  nextAvailableAt: string | null;
};

export type ReviewObject = {
  reviewId: string;
  reviewerName: string;
  rating: number;
  body: string;
  photoUrls: string[];
  technicianComment: string | null;
  createdAt: string;
};

export type ReviewSummary = {
  averageRating: number | null;
  totalCount: number;
  breakdown: { stars: number; count: number }[];
  recentReviews: ReviewObject[];
};

export type ServiceDetailObject = {
  serviceId: string;
  tenantId: string;
  locationId: string;
  serviceName: string;
  locationDisplayName: string;
  description: string | null;
  categoryId: string;
  variantLabel: string | null;
  variants: ServiceVariantObject[];
  addons: ServiceAddonObject[];
  photos: { url: string; source: "client" | "salon" }[];
  technicians: TechnicianCardObject[];
  reviewSummary: ReviewSummary;
  isBookableOnline: boolean;
  locationPhone: string | null;
};