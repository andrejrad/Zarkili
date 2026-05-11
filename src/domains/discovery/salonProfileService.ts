/**
 * salonProfileService.ts — W38-DEBT-2 implementation.
 *
 * Loads a full salon profile from Firestore for the public discovery view:
 *   - tenants/{tenantId}            → salon metadata
 *   - tenants/{tenantId}/services   → bookable services (active=true, ordered by sortOrder)
 *   - tenants/{tenantId}/staff      → staff members (status=active, ordered by displayName)
 *   - tenants/{tenantId}/reviews    → guest review snippets (ordered by createdAt desc, limit 10)
 *
 * This service is read-only and does NOT require the caller to be authenticated
 * as the salon owner; it is used from the consumer discovery flow.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import type {
  SalonProfile,
  SalonReviewSnippet,
  SalonServiceSummary,
  SalonStaffSummary,
} from "../../app/discovery/discoveryHelpers";

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
    const salon: SalonProfile = {
      id: tenantId,
      name: (td["brandName"] as string | undefined) ?? (td["legalName"] as string | undefined) ?? "Salon",
      tagline: td["tagline"] as string | undefined,
      city: (td["city"] as string | undefined) ?? "",
      addressLine: (td["addressLine1"] as string | undefined) ?? "",
      rating: (td["rating"] as number | undefined) ?? 0,
      reviewCount: (td["reviewCount"] as number | undefined) ?? 0,
      description: (td["description"] as string | undefined) ?? "",
    };

    // -----------------------------------------------------------------------
    // 2. Services subcollection
    //    Fields: name, durationMinutes, priceCents, active, sortOrder
    // -----------------------------------------------------------------------
    let services: SalonServiceSummary[] = [];
    try {
      const servicesSnap = await getDocs(
        query(
          collection(db, `tenants/${tenantId}/services`),
          where("active", "==", true),
          orderBy("sortOrder", "asc"),
        ),
      );
      services = servicesSnap.docs.map((d) => {
        const s = d.data();
        return {
          id: d.id,
          name: (s["name"] as string | undefined) ?? "",
          durationMinutes: (s["durationMinutes"] as number | undefined) ?? 60,
          priceCents: (s["priceCents"] as number | undefined) ?? 0,
        };
      });
    } catch {
      // Non-fatal: show profile without services rather than failing completely
    }

    // -----------------------------------------------------------------------
    // 3. Staff subcollection
    //    Fields: displayName (or name), role, status, rating, bio
    // -----------------------------------------------------------------------
    let staff: (SalonStaffSummary & { bio?: string })[] = [];
    try {
      const staffSnap = await getDocs(
        query(
          collection(db, `tenants/${tenantId}/staff`),
          where("status", "==", "active"),
          orderBy("displayName", "asc"),
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
          role: (s["role"] as string | undefined) ?? "",
          rating: s["rating"] as number | undefined,
          bio: s["bio"] as string | undefined,
        };
      });
    } catch {
      // Non-fatal
    }

    // -----------------------------------------------------------------------
    // 4. Reviews subcollection  (most recent 10)
    //    Fields: authorName, rating, text, createdAt (Timestamp or ISO string)
    // -----------------------------------------------------------------------
    let reviews: SalonReviewSnippet[] = [];
    try {
      const reviewsSnap = await getDocs(
        query(
          collection(db, `tenants/${tenantId}/reviews`),
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
          text: (r["text"] as string | undefined) ?? "",
          postedAt: postedAt ?? "",
        };
      });
    } catch {
      // Non-fatal
    }

    return { type: "ok", data: { salon, services, staff, reviews } };
  }

  return { getSalonProfile };
}

export type SalonProfileService = ReturnType<typeof createSalonProfileService>;
