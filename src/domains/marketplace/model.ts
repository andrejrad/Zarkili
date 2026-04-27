/**
 * Marketplace domain model
 *
 * The Marketplace is an optional discovery surface where salon profiles and
 * posts are visible to prospective customers.
 *
 * Anti-client-theft guard:
 *   When a customer is browsing within a specific tenant's context (i.e. they
 *   arrived via a salon's booking link), competitor recommendations are
 *   suppressed. `isCompetitorRecommendationAllowed` encodes this rule.
 *
 * Collections:
 *   tenants/{tenantId}/marketplaceProfile        (single doc, id = tenantId)
 *   tenants/{tenantId}/marketplacePosts/{postId}
 *   tenants/{tenantId}/marketplaceSettings       (single doc, id = tenantId)
 */

import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

export type VisibilityMode =
  | "full_profile"             // profile + posts visible in search and discovery
  | "posts_only"               // posts visible; profile excluded from search
  | "hidden_search_direct_link"; // no search/discovery; accessible only via direct link

// ---------------------------------------------------------------------------
// Salon public profile
// ---------------------------------------------------------------------------

/** Stored at tenants/{tenantId}/marketplaceProfile/{tenantId} */
export type SalonPublicProfile = {
  tenantId: string;
  name: string;
  tagline: string;
  bio: string;
  coverImageUrl?: string;
  logoUrl?: string;
  /** Public booking link exposed on the marketplace */
  bookingUrl?: string;
  /** Curated service tags used in discovery */
  serviceTags: string[];
  /** Style aesthetic tags */
  styleTags: string[];
  city?: string;
  countryCode?: string;
  updatedAt: Timestamp | { _type: string };
};

// ---------------------------------------------------------------------------
// Marketplace post
// ---------------------------------------------------------------------------

/** Stored at tenants/{tenantId}/marketplacePosts/{postId} */
export type MarketplacePost = {
  postId: string;
  tenantId: string;
  title: string;
  description: string;
  imageUrls: string[];
  serviceTags: string[];
  styleTags: string[];
  /** Optional reference to a bookable service — powers "book this look" */
  bookThisLookServiceId?: string;
  isPublished: boolean;
  createdAt: Timestamp | { _type: string };
  updatedAt: Timestamp | { _type: string };
};

// ---------------------------------------------------------------------------
// Marketplace settings
// ---------------------------------------------------------------------------

/** Stored at tenants/{tenantId}/marketplaceSettings/{tenantId} */
export type MarketplaceSettings = {
  tenantId: string;
  visibilityMode: VisibilityMode;
  /** Whether the salon opts in to the marketplace discovery feature */
  optedIn: boolean;
  updatedAt: Timestamp | { _type: string };
};

// ---------------------------------------------------------------------------
// Anti-client-theft guard
// ---------------------------------------------------------------------------

/**
 * Returns true if competitor profiles may be recommended.
 * When a tenantContext is provided (customer arrived via a salon's link),
 * competitor recommendations are suppressed.
 */
export function isCompetitorRecommendationAllowed(tenantContext: string | null): boolean {
  return tenantContext === null;
}

/**
 * Filter a list of profiles to those visible in discovery/search.
 * Profiles with `posts_only` or `hidden_search_direct_link` visibility are excluded.
 * If tenantContext is set, profiles belonging to the context tenant are excluded too.
 */
export function filterVisibleProfiles(
  profiles: Array<{ tenantId: string; settings: MarketplaceSettings }>,
  tenantContext: string | null,
): Array<{ tenantId: string; settings: MarketplaceSettings }> {
  return profiles.filter(({ tenantId, settings }) => {
    if (!settings.optedIn) return false;
    if (settings.visibilityMode !== "full_profile") return false;
    if (tenantContext !== null && tenantId === tenantContext) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type MarketplaceErrorCode =
  | "PROFILE_NOT_FOUND"
  | "POST_NOT_FOUND"
  | "TENANT_REQUIRED"
  | "COMPETITOR_RECOMMENDATION_BLOCKED"
  | "COMMISSION_MESSAGING_FORBIDDEN"
  | "INVALID_ATTRIBUTION";

export class MarketplaceError extends Error {
  constructor(
    public readonly code: MarketplaceErrorCode,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "MarketplaceError";
  }
}

// ---------------------------------------------------------------------------
// Marketplace attribution (W17.2 — anti-client-theft / data transparency)
// ---------------------------------------------------------------------------

/**
 * Records that a booking originated from the marketplace surface.
 * Stored alongside a booking (or in `tenants/{tenantId}/marketplaceAcquisitions/{bookingId}`)
 * so the salon can see exactly which posts/profiles drove which bookings.
 *
 * The salon — *not* the platform — owns the resulting client. Attribution is
 * informational (analytics + transparency) and never gates the salon's
 * relationship with the customer.
 */
export type MarketplaceAttribution = {
  /** The salon that ultimately receives the booking (and the client). */
  tenantId: string;
  /** The customer who booked. */
  customerUserId: string;
  /** If the click originated from a specific post, that post's id. */
  sourcePostId?: string;
  /**
   * The tenant whose post/profile drove the click. Equals `tenantId` for
   * normal flows; surfaces edge cases where a profile-of-record differs
   * from the booking salon (rare).
   */
  sourceTenantId: string;
  /** Wall-clock millis when attribution was captured (booking creation time). */
  capturedAt: number;
};

/** A booking-flow context passed into the guardrail service. */
export type BookingFlowContext = {
  /** The salon the customer is currently booking with. Required. */
  tenantId: string;
  /** Optional post that drove the click (for "Book this look"). */
  sourcePostId?: string;
};

/** Minimal recommendation shape the guardrail enforces against. */
export type RecommendedSalon = {
  tenantId: string;
  /** Free-form label for diagnostics ("similar near you", "people also booked", etc). */
  reason?: string;
};
