/**
 * salonProfileService.ts — W38-DEBT-2 implementation.
 *
 * Loads a full salon profile from Firestore for the public discovery view:
 *   - tenants/{tenantId}            → salon metadata
 *   - tenants/{tenantId}/locations  → first location for city/address
 *   - tenants/{tenantId}/services   → bookable services (active, ordered by sortOrder)
 *   - tenants/{tenantId}/staff      → staff members (active, ordered by displayName)
 *   - tenants/{tenantId}/reviews    → guest review snippets (ordered by createdAt desc, limit 20)
 *
 * NOTE: Services and staff are fetched with a single orderBy (no compound where+orderBy)
 * to avoid missing-index errors; active/status filtering is done in JS since subcollections
 * are small (< 50 docs). Reviews use where(status=="published")+orderBy to satisfy the
 * Firestore security rule (list queries reject docs that don't pass the rule, so a query
 * without the status filter would be denied if any pending_moderation doc exists).
 *
 * This service is read-only and does NOT require the caller to be authenticated
 * as the salon owner; it is used from the consumer discovery flow.
 */

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { SERVICE_TYPES_COLLECTION } from "./../services/paths";

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
  /** W50-DEBT-17: service_type IDs this staff member can perform. */
  serviceTypeIds?: string[];
};

export type SalonProfileData = {
  salon: SalonProfile;
  services: SalonServiceSummary[];
  staff: (SalonStaffSummary & { bio?: string })[];
  reviews: SalonReviewSnippet[];
};

type SalonProfileResult =
  | { type: "ok"; data: SalonProfileData }
  | { type: "not_found" }
  | { type: "error"; message: string };

export function createSalonProfileService(db: Firestore) {
  async function getSalonProfile(tenantId: string): Promise<SalonProfileResult> {
    // -----------------------------------------------------------------------
    // 1. Tenant root document
    // -----------------------------------------------------------------------
    const tenantRef = doc(db, "tenants", tenantId);
    let tenantSnap;
    try {
      tenantSnap = await getDoc(tenantRef);
    } catch (e) {
      return { type: "error", message: e instanceof Error ? e.message : "Failed to load salon." };
    }

    if (!tenantSnap.exists()) {
      return { type: "not_found" };
    }

    const td = tenantSnap.data();

    // -----------------------------------------------------------------------
    // 1b. First location (for city & address — top-level locations collection)
    // -----------------------------------------------------------------------
    let city = (td["city"] as string | undefined) ?? "";
    let addressLine = (td["addressLine1"] as string | undefined) ?? "";
    try {
      const locsSnap = await getDocs(
        query(collection(db, "locations"), where("tenantId", "==", tenantId), limit(1))
      );
      if (!locsSnap.empty) {
        const loc = locsSnap.docs[0].data();
        const addr = loc["address"] as { city?: string; line1?: string; state?: string } | undefined;
        city = city || (addr?.city ?? (loc["city"] as string | undefined) ?? "");
        addressLine = addressLine || (addr?.line1 ?? (loc["addressLine1"] as string | undefined) ?? "");
      }
    } catch {
      // Non-fatal — city/address stay as empty strings
    }

    const salon: SalonProfile = {
      id: tenantId,
      name:
        (td["brandName"] as string | undefined) ??
        (td["legalName"] as string | undefined) ??
        (td["name"] as string | undefined) ??
        "Salon",
      tagline: td["tagline"] as string | undefined,
      city,
      addressLine,
      rating: (td["rating"] as number | undefined) ?? 0,
      reviewCount: (td["reviewCount"] as number | undefined) ?? 0,
      description: (td["description"] as string | undefined) ?? "",
    };

    // -----------------------------------------------------------------------
    // 2. Services — v3 catalogue: collectionGroup over service_types,
    //    filtered by tenantId (= brandId) + active.
    //    Fields: name, active, priceFrom/basePrice (pence), durationFrom/baseDurationMinutes
    // -----------------------------------------------------------------------
    let services: SalonServiceSummary[] = [];
    try {
      const servicesSnap = await getDocs(
        query(
          collectionGroup(db, SERVICE_TYPES_COLLECTION),
          where("tenantId", "==", tenantId),
          where("active", "==", true),
        ),
      );
      services = servicesSnap.docs.map((d) => {
        const s = d.data();
        // price is stored in dollars; fall back through legacy field names
        const priceCents =
          (s["basePrice"] as number | undefined) ??
          (s["priceFrom"] as number | undefined) ??
          (s["price"] as number | undefined) ??
          0;
        const durationMinutes =
          (s["durationFrom"] as number | undefined) ??
          (s["baseDurationMinutes"] as number | undefined) ??
          (s["durationMinutes"] as number | undefined) ??
          60;
        return {
          id: d.id,
          name: (s["name"] as string | undefined) ?? "",
          durationMinutes,
          priceCents,
        };
      });
    } catch {
      // Non-fatal: show profile without services rather than failing completely
    }

    // -----------------------------------------------------------------------
    // 3. Staff — top-level staff collection, filtered by tenantId
    //    Fields: displayName (or name), role, status, averageRating/rating, bio
    // -----------------------------------------------------------------------
    let staff: (SalonStaffSummary & { bio?: string })[] = [];
    try {
      const staffSnap = await getDocs(
        query(
          collection(db, "staff"),
          where("tenantId", "==", tenantId),
          where("status", "==", "active"),
        ),
      );
      staff = staffSnap.docs.map((d) => {
        const s = d.data();
        return {
          id: d.id,
          name:
            (s["displayName"] as string | undefined) ??
            (s["name"] as string | undefined) ??
            "",
          role: (s["role"] as string | undefined) ?? (s["specialtyTags"] as string[] | undefined)?.[0] ?? "",
          rating: (s["averageRating"] as number | undefined) ?? (s["rating"] as number | undefined),
          reviewCount: (s["reviewCount"] as number | undefined) ?? 0,
          specialties: (s["specialtyTags"] as string[] | undefined) ?? [],
          imageUrl: (s["photoUrl"] as string | undefined) ?? undefined,
          bio: s["bio"] as string | undefined,
          // W50-DEBT-17: which service_types this stylist can perform
          serviceTypeIds: (s["serviceTypeIds"] as string[] | undefined) ?? [],
        };
      });
    } catch {
      // Non-fatal
    }

    // -----------------------------------------------------------------------
    // 4. Reviews — top-level reviews collection, filtered by tenantId
    //    MUST use where("status","==","published") — without it the Firestore
    //    security rule (allow read: if status=="published") rejects a list
    //    query that would surface pending/hidden docs.
    //    Composite index required: tenantId ASC + status ASC + createdAt DESC.
    // -----------------------------------------------------------------------
    let reviews: SalonReviewSnippet[] = [];
    try {
      const reviewsSnap = await getDocs(
        query(
          collection(db, "reviews"),
          where("tenantId", "==", tenantId),
          where("status", "==", "published"),
          orderBy("createdAt", "desc"),
          limit(10),
        ),
      );
      reviews = reviewsSnap.docs.map((d) => {
        const r = d.data();
        let postedAt = r["createdAt"] as string | undefined;
        if (r["createdAt"] && typeof r["createdAt"] === "object" && "toDate" in r["createdAt"]) {
          const date: Date = (r["createdAt"] as { toDate(): Date }).toDate();
          postedAt = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
        return {
          id: d.id,
          authorName: (r["authorName"] as string | undefined) ?? "Anonymous",
          rating: (r["rating"] as number | undefined) ?? 5,
          text: (r["comment"] as string | undefined) ?? (r["text"] as string | undefined) ?? "",
          postedAt: postedAt ?? "",
        };
      });
    } catch {
      // Non-fatal
    }

    // Override rating/reviewCount with values computed from the live reviews
    // fetch. The tenant document fields (td["rating"] / td["reviewCount"]) are
    // not populated by the seed, and ratingAggregates is a server-maintained
    // cache that may not exist yet. Using the fetched reviews as the source of
    // truth is correct for the profile header.
    const liveReviewCount = reviews.length;
    const liveRating =
      liveReviewCount > 0
        ? Math.round(
            (reviews.reduce((s, r) => s + r.rating, 0) / liveReviewCount) * 10,
          ) / 10
        : 0;
    const salonWithLiveStats: typeof salon = {
      ...salon,
      ...(liveReviewCount > 0 ? { reviewCount: liveReviewCount, rating: liveRating } : {}),
    };

    return { type: "ok", data: { salon: salonWithLiveStats, services, staff, reviews } };
  }

  return { getSalonProfile };
}

export type SalonProfileService = ReturnType<typeof createSalonProfileService>;
