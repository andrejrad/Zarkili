/**
 * editorialRepository.ts — W22-DEBT-3
 *
 * Firestore repository for editorial cards and sponsored listings.
 *
 * Collections (global — not tenant-scoped):
 *   platformEditorial/{cardId}      — EditorialCard docs
 *   sponsoredListings/{listingId}   — SponsoredListing docs
 *
 * Editorial cards appear in the DiscoverHomeScreen editorial row.
 * Sponsored listings appear in the DiscoverFeedScreen as FTC-compliant
 * `isSponsored=true` feed entries.
 *
 * Both collections are globally managed by the platform team via admin tooling
 * (future: Admin Console editorial editor, outside current scope).
 */

import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  type Firestore,
} from "firebase/firestore";

import type { EditorialCard, SponsoredListing } from "./model";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EDITORIAL_COLLECTION = "platformEditorial";
const SPONSORED_COLLECTION = "sponsoredListings";

function toIso(ts: unknown): string {
  if (!ts) return "";
  if (typeof (ts as { toDate?: unknown }).toDate === "function") {
    return (ts as { toDate(): Date }).toDate().toISOString();
  }
  return String(ts);
}

function docToEditorialCard(id: string, data: Record<string, unknown>): EditorialCard {
  return {
    cardId: id,
    title: String(data.title ?? ""),
    subtitle: typeof data.subtitle === "string" ? data.subtitle : undefined,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
    deepLink: typeof data.deepLink === "string" ? data.deepLink : undefined,
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
    expiresAt: data.expiresAt ? toIso(data.expiresAt) : undefined,
    active: Boolean(data.active),
  };
}

function docToSponsoredListing(id: string, data: Record<string, unknown>): SponsoredListing {
  return {
    listingId: id,
    tenantId: String(data.tenantId ?? ""),
    salonName: String(data.salonName ?? ""),
    caption: String(data.caption ?? ""),
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
    createdAt: toIso(data.createdAt),
    startsAt: String(data.startsAt ?? ""),
    endsAt: String(data.endsAt ?? ""),
    active: Boolean(data.active),
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EditorialRepository = {
  /** List active editorial cards ordered by sortOrder asc */
  listEditorialCards(): Promise<EditorialCard[]>;
  /** List active sponsored listings whose date window covers today */
  listActiveSponsoredListings(todayIso: string): Promise<SponsoredListing[]>;
};

// ---------------------------------------------------------------------------
// Firestore adapter
// ---------------------------------------------------------------------------

export function createFirestoreEditorialRepository(db: Firestore): EditorialRepository {
  return {
    async listEditorialCards() {
      const col = collection(db, EDITORIAL_COLLECTION);
      const snap = await getDocs(
        query(col, where("active", "==", true), orderBy("sortOrder", "asc")),
      );
      return snap.docs.map((d) =>
        docToEditorialCard(d.id, d.data() as Record<string, unknown>),
      );
    },

    async listActiveSponsoredListings(todayIso: string) {
      const col = collection(db, SPONSORED_COLLECTION);
      // Firestore only allows one range inequality per query.
      // Filter startsAt <= today on the DB; filter endsAt >= today client-side.
      const snap = await getDocs(
        query(
          col,
          where("active", "==", true),
          where("startsAt", "<=", todayIso),
          orderBy("startsAt", "desc"),
        ),
      );
      return snap.docs
        .map((d) => docToSponsoredListing(d.id, d.data() as Record<string, unknown>))
        .filter((listing) => listing.endsAt >= todayIso);
    },
  };
}

/**
 * Converts a SponsoredListing to a discovery feed post with isSponsored=true,
 * ready to be injected at the top of the DiscoverFeedScreen posts list.
 */
export function sponsoredListingToFeedPost(listing: SponsoredListing) {
  return {
    id: `sponsored-${listing.listingId}`,
    salonId: listing.tenantId,
    salonName: listing.salonName,
    caption: listing.caption,
    imageUrl: listing.imageUrl,
    likeCount: 0,
    postedAt: "",
    isSponsored: true,
  };
}
