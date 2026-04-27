/**
 * marketplace/discoveryService.ts (W17.1 — Discovery surface v1)
 *
 * Pure-logic services backing the consumer-facing marketplace surface:
 *   • Feed pagination (cursor = "createdAt:postId")
 *   • Profile search/filter predicate
 *   • Profile-view assembly (profile + recent posts + optional bookable services)
 *   • "Book this look" deep-link builder — preserves source attribution
 *
 * No Firestore or I/O here. Callers (UI / repository wrappers) feed already-
 * fetched data in and consume the results. Pagination cursors are exposed as
 * opaque strings so the wire shape is stable across UI refactors.
 */

import {
  filterVisibleProfiles,
  isCompetitorRecommendationAllowed,
  type MarketplacePost,
  type MarketplaceSettings,
  type SalonPublicProfile,
} from "./model";

// ---------------------------------------------------------------------------
// Cursor encoding ("<createdAtMillis>:<postId>")
// ---------------------------------------------------------------------------

/**
 * Encode a feed cursor. We expose pagination as an opaque string so the
 * underlying ordering (createdAt desc, postId tiebreak) can evolve without
 * breaking clients that have round-tripped a cursor.
 */
export function encodeFeedCursor(createdAtMillis: number, postId: string): string {
  return `${createdAtMillis}:${postId}`;
}

/**
 * Parse a cursor produced by `encodeFeedCursor`. Returns `null` on any
 * malformed input — callers should treat null as "start from the top".
 */
export function decodeFeedCursor(
  cursor: string | undefined | null,
): { createdAtMillis: number; postId: string } | null {
  if (!cursor) return null;
  const sep = cursor.indexOf(":");
  if (sep <= 0) return null;
  const millisStr = cursor.slice(0, sep);
  const postId = cursor.slice(sep + 1);
  const createdAtMillis = Number(millisStr);
  if (!Number.isFinite(createdAtMillis) || !postId) return null;
  return { createdAtMillis, postId };
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

/**
 * A post enriched with its createdAtMillis. We don't unwrap Firestore
 * Timestamps inside this pure module — callers project the millis they
 * already have at the repository boundary.
 */
export type FeedItem = {
  post: MarketplacePost;
  createdAtMillis: number;
};

export type FeedPage = {
  items: MarketplacePost[];
  nextCursor: string | null;
};

/**
 * Compute one page of the marketplace feed from an in-memory candidate list.
 *
 * Ordering: createdAt DESC, postId DESC (stable tiebreak so the cursor is
 * unambiguous when two posts share a createdAt millisecond).
 *
 * `tenantContext`:
 *   - `null`: anonymous discovery; all published posts visible.
 *   - non-null: the customer is in salon X's funnel — posts from any tenant
 *     other than X are suppressed (anti-client-theft inside booking flow).
 *
 * Note: this service trusts the caller to have already filtered out
 * unpublished posts; we do an extra `isPublished` guard here for safety.
 */
export function getFeedPage(opts: {
  candidates: readonly FeedItem[];
  cursor?: string | null;
  limit: number;
  tenantContext: string | null;
}): FeedPage {
  const { candidates, cursor, limit, tenantContext } = opts;

  if (limit <= 0) {
    return { items: [], nextCursor: null };
  }

  const decoded = decodeFeedCursor(cursor ?? null);

  // Anti-client-theft: when inside a booking funnel, only same-tenant posts
  // are visible in the feed. Anonymous browsing sees everyone.
  const honorsContext = (post: MarketplacePost): boolean => {
    if (isCompetitorRecommendationAllowed(tenantContext)) return true;
    return post.tenantId === tenantContext;
  };

  const sorted = [...candidates]
    .filter((c) => c.post.isPublished && honorsContext(c.post))
    .sort((a, b) => {
      if (b.createdAtMillis !== a.createdAtMillis) {
        return b.createdAtMillis - a.createdAtMillis;
      }
      return b.post.postId.localeCompare(a.post.postId);
    });

  const startIdx = decoded
    ? sorted.findIndex(
        (c) =>
          c.createdAtMillis < decoded.createdAtMillis ||
          (c.createdAtMillis === decoded.createdAtMillis &&
            c.post.postId.localeCompare(decoded.postId) < 0),
      )
    : 0;

  if (startIdx === -1) {
    return { items: [], nextCursor: null };
  }

  const page = sorted.slice(startIdx, startIdx + limit);
  const last = page[page.length - 1];
  const hasMore = startIdx + limit < sorted.length;
  return {
    items: page.map((c) => c.post),
    nextCursor: hasMore && last ? encodeFeedCursor(last.createdAtMillis, last.post.postId) : null,
  };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export type ProfileSearchFilters = {
  city?: string;
  serviceTag?: string;
  styleTag?: string;
  /** Free-text query matched against name / tagline / bio (case-insensitive). */
  text?: string;
};

/**
 * Filter a list of `(profile, settings)` pairs by user-supplied criteria.
 *
 * Visibility is enforced via `filterVisibleProfiles` — only `full_profile`
 * + opted-in tenants are searchable, and the customer's own salon is
 * suppressed when a `tenantContext` is set.
 */
export function searchProfiles(opts: {
  candidates: ReadonlyArray<{ profile: SalonPublicProfile; settings: MarketplaceSettings }>;
  filters: ProfileSearchFilters;
  tenantContext: string | null;
}): SalonPublicProfile[] {
  const { candidates, filters, tenantContext } = opts;

  const visibleTenantIds = new Set(
    filterVisibleProfiles(
      candidates.map(({ profile, settings }) => ({ tenantId: profile.tenantId, settings })),
      tenantContext,
    ).map((v) => v.tenantId),
  );

  const city = filters.city?.trim().toLowerCase();
  const serviceTag = filters.serviceTag?.trim().toLowerCase();
  const styleTag = filters.styleTag?.trim().toLowerCase();
  const text = filters.text?.trim().toLowerCase();

  return candidates
    .filter(({ profile }) => visibleTenantIds.has(profile.tenantId))
    .map(({ profile }) => profile)
    .filter((profile) => {
      if (city && profile.city?.toLowerCase() !== city) return false;
      if (serviceTag && !profile.serviceTags.some((t) => t.toLowerCase() === serviceTag)) return false;
      if (styleTag && !profile.styleTags.some((t) => t.toLowerCase() === styleTag)) return false;
      if (text) {
        const haystack = `${profile.name} ${profile.tagline} ${profile.bio}`.toLowerCase();
        if (!haystack.includes(text)) return false;
      }
      return true;
    });
}

// ---------------------------------------------------------------------------
// Profile view assembly
// ---------------------------------------------------------------------------

export type ProfileView = {
  profile: SalonPublicProfile;
  posts: MarketplacePost[];
};

/**
 * Compose a public profile view from already-fetched primitives.
 * Posts are filtered to `isPublished` and capped at `postLimit` (default 12)
 * after a createdAt-DESC sort — same ordering as the global feed.
 */
export function assembleProfileView(opts: {
  profile: SalonPublicProfile;
  posts: ReadonlyArray<FeedItem>;
  postLimit?: number;
}): ProfileView {
  const limit = opts.postLimit ?? 12;
  const sorted = [...opts.posts]
    .filter((p) => p.post.isPublished && p.post.tenantId === opts.profile.tenantId)
    .sort((a, b) => b.createdAtMillis - a.createdAtMillis)
    .slice(0, limit)
    .map((p) => p.post);
  return { profile: opts.profile, posts: sorted };
}

// ---------------------------------------------------------------------------
// "Book this look" deep-link
// ---------------------------------------------------------------------------

export type BookThisLookDeepLink = {
  path: "/book";
  params: {
    salon: string;
    sourcePostId: string;
    service?: string;
  };
};

/**
 * Build a deep-link that drops the customer into the originating salon's
 * booking flow, with `sourcePostId` preserved so attribution can be captured
 * at booking time. If the post declared a `bookThisLookServiceId`, that
 * service is pre-selected.
 *
 * Caller renders this into whatever URL/route shape the host app uses; the
 * shape returned here is intentionally framework-agnostic.
 */
export function buildBookThisLookDeepLink(post: MarketplacePost): BookThisLookDeepLink {
  const params: BookThisLookDeepLink["params"] = {
    salon: post.tenantId,
    sourcePostId: post.postId,
  };
  if (post.bookThisLookServiceId) {
    params.service = post.bookThisLookServiceId;
  }
  return { path: "/book", params };
}
