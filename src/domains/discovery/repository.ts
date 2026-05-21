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
import {
  SERVICE_TYPES_COLLECTION,
  serviceAddonsCollectionSegments,
  servicePhotosCollectionSegments,
  serviceVariantsCollectionSegments,
} from "../services/paths";
import {
  geohashQueryBounds,
  distanceBetween,
} from "geofire-common";

import type {
  DiscoveryCategory,
  DiscoveryCategoryId,
  DiscoveryRecentBooking,
  ReviewObject,
  ReviewSummary,
  ServiceDetailObject,
  ServiceTypeCard,
  ServiceVariantObject,
  ServiceAddonObject,
  TechnicianCardObject,
} from "./model";

// ---------------------------------------------------------------------------
// Legacy in-memory repository (kept for test / Storybook injection)
// ---------------------------------------------------------------------------

type DiscoveryRepositoryOptions = {
  categories: DiscoveryCategory[];
  featuredSalons: ServiceTypeCard[];
  recentBookings: DiscoveryRecentBooking[];
  recommendedSalons: ServiceTypeCard[];
};

export function createDiscoveryRepository(options: DiscoveryRepositoryOptions) {
  async function listCategories(): Promise<DiscoveryCategory[]> {
    return options.categories;
  }

  async function listFeaturedSalons(_userId?: string | null): Promise<ServiceTypeCard[]> {
    return options.featuredSalons;
  }

  async function listRecentBookings(): Promise<DiscoveryRecentBooking[]> {
    return options.recentBookings;
  }

  async function listRecommendedSalons(): Promise<ServiceTypeCard[]> {
    return options.recommendedSalons;
  }

  async function getServiceCards(_params: ServiceCardsParams): Promise<ServiceCardsResult> {
    return {
      services: options.featuredSalons,
      nextCursor: null,
      total: options.featuredSalons.length,
      locationLabel: "",
    };
  }

  return {
    listCategories,
    listFeaturedSalons,
    listRecentBookings,
    listRecommendedSalons,
    getServiceCards,
  };
}

export type DiscoveryRepository = ReturnType<typeof createDiscoveryRepository>;

// ---------------------------------------------------------------------------
// Static category list (mirrors service_categories collection)
// ---------------------------------------------------------------------------

const STATIC_CATEGORIES: DiscoveryCategory[] = [
  { id: "all" },
  { id: "nails" },
  { id: "hair" },
  { id: "skin" },
  { id: "lashes" },
  { id: "brows" },
  { id: "massage" },
  { id: "makeup" },
  { id: "barber" },
  { id: "waxing" },
  { id: "spa" },
  { id: "injectables" },
  { id: "wellness" },
];

// ---------------------------------------------------------------------------
// Geo-query parameter types
// ---------------------------------------------------------------------------

export type ServiceCardsParams = {
  lat: number;
  lng: number;
  radiusMetres?: number;
  categoryId?: string;
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  availability?: "today" | "this-week" | "any";
  sort?: "recommended" | "nearest" | "price-asc" | "rating-desc";
  cursor?: string | null;
  pageSize?: number;
  userId?: string | null;
};

export type ServiceCardsResult = {
  services: ServiceTypeCard[];
  nextCursor: string | null;
  total: number;
  locationLabel: string;
};

export type SearchSuggestion = {
  type: "service" | "location" | "tag";
  id: string;
  label: string;
  sublabel?: string;
};

// ---------------------------------------------------------------------------
// Firestore-backed discovery repository (Phase 5)
// ---------------------------------------------------------------------------

/**
 * Firestore-backed discovery repository.
 *
 * Collections used:
 *   service_categories/{categoryId}
 *   services/{serviceId}
 *   services/{serviceId}/variants/{variantId}
 *   services/{serviceId}/addons/{addonId}
 *   services/{serviceId}/photos/{photoId}
 *   staff/{staffId}
 *   reviews/{reviewId}
 *   loyaltyStates/{tenantId}_{userId}
 *   discoveryFeaturedSalons/{salonId}   — removed in Phase 9
 */
export function createFirestoreDiscoveryRepository(db: Firestore) {
  // ------------------------------------------------------------------
  // Legacy helpers (HomeScreen / DiscoverFeedScreen still use these)
  // ------------------------------------------------------------------

  async function listCategories(): Promise<DiscoveryCategory[]> {
    return STATIC_CATEGORIES;
  }

  /** @deprecated discoveryFeaturedSalons collection removed in Phase 9. Falls back to getServiceCards. */
  async function listFeaturedSalons(userId?: string | null): Promise<ServiceTypeCard[]> {
    try {
      const result = await getServiceCards({ lat: 51.505, lng: -0.09, radiusMetres: 10_000, sort: "recommended", pageSize: 6, userId: userId ?? undefined });
      return result.services;
    } catch (err) {
      console.error("[Discovery] listFeaturedSalons getServiceCards failed:", err);
      return [];
    }
  }

  async function listRecentBookings(): Promise<DiscoveryRecentBooking[]> {
    return [];
  }

  /** @deprecated discoveryFeaturedSalons collection removed in Phase 9. Falls back to getServiceCards. */
  async function listRecommendedSalons(): Promise<ServiceTypeCard[]> {
      try {
      const result = await getServiceCards({ lat: 51.505, lng: -0.09, radiusMetres: 10_000, sort: "rating-desc", pageSize: 4 });
      return result.services;
    } catch (err) {
      console.error("[Discovery] listRecommendedSalons getServiceCards failed:", err);
      return [];
    }
  }

  // ------------------------------------------------------------------
  // Phase 5: geo service card queries
  // ------------------------------------------------------------------

  async function getActiveCategories(
    _lat?: number,
    _lng?: number
  ): Promise<DiscoveryCategory[]> {
    // Future: query service_categories and filter by active services in area.
    // For now return the static list.
    return STATIC_CATEGORIES;
  }

  async function getServiceCards(
    params: ServiceCardsParams
  ): Promise<ServiceCardsResult> {
    const {
      lat,
      lng,
      radiusMetres = 5000,
      categoryId,
      priceMin,
      priceMax,
      minRating,
      availability,
      sort = "recommended",
      pageSize = 10,
    } = params;

    const bounds = geohashQueryBounds([lat, lng], radiusMetres);

    const servicesCol = collectionGroup(db, SERVICE_TYPES_COLLECTION);

    // Fan-out geo queries over each bound range
    const snapshots = await Promise.all(
      bounds.map((b) => {
        let q = query(
          servicesCol,
          where("active", "==", true),
          orderBy("geohash"),
          where("geohash", ">=", b[0]),
          where("geohash", "<=", b[1]),
          limit(200)
        );
        return getDocs(q);
      })
    );

    const allDocs = snapshots.flatMap((s) => s.docs);
    // Deduplicate by id (bounds can overlap)
    const seen = new Set<string>();
    const uniqueDocs = allDocs.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    let cards: ServiceTypeCard[] = uniqueDocs
      .map((d) => {
        const data = d.data();
        const docLat = (data["locationLat"] as number | undefined) ?? 0;
        const docLng = (data["locationLng"] as number | undefined) ?? 0;
        const distKm = distanceBetween([docLat, docLng], [lat, lng]);
        const distMetres = Math.round(distKm * 1000);

        if (distMetres > radiusMetres) return null;

        const card: ServiceTypeCard = {
          id: d.id,
          tenantId: data["tenantId"] as string,
          locationId: data["locationId"] as string,
          categoryId: data["categoryId"] as string,
          categoryName: (data["categoryName"] as string) ?? "",
          serviceName: data["name"] as string,
          locationDisplayName: (data["locationDisplayName"] as string) ?? "",
          locationCity: (data["locationCity"] as string) ?? "",
          priceFrom: (data["priceFrom"] as number | undefined) ?? (data["basePrice"] as number) ?? 0,
          variantCount: (data["variantCount"] as number) ?? 1,
          durationFrom: (data["durationFrom"] as number | undefined) ?? (data["baseDurationMinutes"] as number) ?? 0,
          serviceAverageRating:
            ((data["reviewCount"] as number) ?? 0) >= 5
              ? ((data["averageRating"] as number) ?? null)
              : null,
          serviceReviewCount: (data["reviewCount"] as number) ?? 0,
          locationAverageRating: (data["locationAverageRating"] as number | null) ?? null,
          locationReviewCount: (data["locationReviewCount"] as number) ?? 0,
          nextAvailableAt: (() => {
            const raw = data["nextAvailableAt"];
            if (raw == null) return null;
            if (typeof raw === "string") return raw;
            if (typeof (raw as { toDate?: () => Date }).toDate === "function") {
              return (raw as { toDate: () => Date }).toDate().toISOString();
            }
            return null;
          })(),
          isFullyBooked: (data["isFullyBooked"] as boolean) ?? false,
          primaryPhotoUrl: (data["primaryPhotoUrl"] as string | null) ?? (data["photoUrl"] as string | null) ?? null,
          primaryPhotoSource: (data["primaryPhotoSource"] as "client" | "salon" | null) ?? null,
          isBookableOnline: (data["isBookableOnline"] as boolean) ?? true,
          locationLat: docLat,
          locationLng: docLng,
          distanceMetres: distMetres,
          isSaved: null,
          memberPoints: null,
          popularityScore: (data["popularityScore"] as number) ?? 0,
        };
        return card;
      })
      .filter((c): c is ServiceTypeCard => c !== null);

    // Category filter
    if (categoryId && categoryId !== "all") {
      cards = cards.filter((c) => c.categoryId === categoryId);
    }

    // Price filter (basePrice is in pennies/cents)
    if (priceMin !== undefined) {
      cards = cards.filter((c) => c.priceFrom >= priceMin);
    }
    if (priceMax !== undefined) {
      cards = cards.filter((c) => c.priceFrom <= priceMax);
    }

    // Rating filter
    if (minRating && minRating > 0) {
      cards = cards.filter((c) => {
        const r = c.serviceAverageRating ?? c.locationAverageRating;
        return r != null && r >= minRating;
      });
    }

    // Availability filter
    if (availability === "today") {
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      cards = cards.filter((c) => {
        if (!c.nextAvailableAt) return false;
        return new Date(c.nextAvailableAt) <= todayEnd;
      });
    } else if (availability === "this-week") {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      cards = cards.filter((c) => {
        if (!c.nextAvailableAt) return false;
        return new Date(c.nextAvailableAt) <= weekEnd;
      });
    }

    // Sort
    if (sort === "nearest") {
      cards.sort((a, b) => (a.distanceMetres ?? Infinity) - (b.distanceMetres ?? Infinity));
    } else if (sort === "price-asc") {
      cards.sort((a, b) => a.priceFrom - b.priceFrom);
    } else if (sort === "rating-desc") {
      cards.sort((a, b) => {
        const ra = a.serviceAverageRating ?? a.locationAverageRating ?? 0;
        const rb = b.serviceAverageRating ?? b.locationAverageRating ?? 0;
        return rb - ra;
      });
    } else {
      // "recommended": popularityScore DESC (spec §3.7), distance as tiebreaker
      cards.sort((a, b) => {
        const diff = b.popularityScore - a.popularityScore;
        return diff !== 0 ? diff : (a.distanceMetres ?? Infinity) - (b.distanceMetres ?? Infinity);
      });
    }

    // Wire loyalty (memberPoints) and saved state (isSaved) from Firestore.
    // Non-fatal: permission gaps or network errors must not block core discovery.
    if (params.userId) {
      const uid = params.userId;
      const uniqueTenantIds = [...new Set(cards.map((c) => c.tenantId))];
      try {
        const [loyaltyMap, savedSnap] = await Promise.all([
          getUserLoyaltyForServices(uid, uniqueTenantIds),
          getDocs(collection(db, "users", uid, "savedServices")),
        ]);
        const savedIds = new Set<string>(savedSnap.docs.map((d) => d.id));
        cards = cards.map((c) => ({
          ...c,
          memberPoints: c.tenantId in loyaltyMap ? (loyaltyMap[c.tenantId] ?? null) : null,
          isSaved: savedIds.has(c.id),
        }));
      } catch (loyaltyErr) {
        console.error("[Discovery] loyalty/saved lookup failed (non-fatal):", loyaltyErr);
        // cards keep memberPoints: null, isSaved: null — badges simply won't show
      }
    }

    const total = cards.length;

    // Cursor pagination (cursor = last serviceId seen — simple offset for MVP)
    let startIndex = 0;
    if (params.cursor) {
      const idx = cards.findIndex((c) => c.id === params.cursor);
      if (idx !== -1) startIndex = idx + 1;
    }
    const page = cards.slice(startIndex, startIndex + pageSize);
    const nextCursor =
      page.length === pageSize && startIndex + pageSize < total
        ? (page[page.length - 1]?.id ?? null)
        : null;

    // Derive a rough city label from first result
    const locationLabel = "your area";

    return { services: page, nextCursor, total, locationLabel };
  }

  // ------------------------------------------------------------------
  // Phase 5: service detail
  // ------------------------------------------------------------------

  async function getServiceDetail(
    serviceId: string
  ): Promise<ServiceDetailObject | null> {
    // B2b: Resolve the service-type doc via collectionGroup since callers
    // (AppNavigatorShell) only hold the serviceId. Once resolved, read the
    // doc + variants/addons/photos subcollections from the v3 hierarchical
    // path `brands/{brandId}/locations/{locationId}/service_types/{serviceId}`.
    const cgSnap = await getDocs(collectionGroup(db, SERVICE_TYPES_COLLECTION));
    const serviceSnap = cgSnap.docs.find((d) => d.id === serviceId);
    if (!serviceSnap) return null;

    const svc = serviceSnap.data();
    const brandId = (svc["tenantId"] as string | undefined) ?? "";
    const locationId = (svc["locationId"] as string | undefined) ?? "";
    if (!brandId || !locationId) return null;

    const [variantsSnap, addonsSnap, photosSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, ...serviceVariantsCollectionSegments(brandId, locationId, serviceId)),
          where("active", "==", true),
          orderBy("sortOrder")
        )
      ),
      getDocs(
        query(
          collection(db, ...serviceAddonsCollectionSegments(brandId, locationId, serviceId)),
          where("active", "==", true)
        )
      ),
      getDocs(
        query(
          collection(db, ...servicePhotosCollectionSegments(brandId, locationId, serviceId)),
          orderBy("sortOrder"),
          limit(20)
        )
      ),
    ]);

    // Fetch staff who service this service
    const staffSnap = await getDocs(
      query(
        collection(db, "staff"),
        where("serviceIds", "array-contains", serviceId),
        where("status", "==", "active"),
        limit(20)
      )
    );

    // Fetch recent reviews
    const reviewsSnap = await getDocs(
      query(
        collection(db, "reviews"),
        where("serviceId", "==", serviceId),
        orderBy("createdAt", "desc"),
        limit(10)
      )
    );

    const variants: ServiceVariantObject[] = variantsSnap.docs.map((d) => {
      const v = d.data();
      return {
        variantId: d.id,
        name: v["name"] as string,
        durationMinutes: v["durationMinutes"] as number,
        price: v["price"] as number,
        currency: (v["currency"] as string) ?? "GBP",
        isDefault: (v["isDefault"] as boolean) ?? false,
      };
    });

    const addons: ServiceAddonObject[] = addonsSnap.docs.map((d) => {
      const a = d.data();
      return {
        addonId: d.id,
        name: a["name"] as string,
        price: a["price"] as number,
        currency: (a["currency"] as string) ?? "GBP",
        durationMinutes: a["durationMinutes"] as number,
      };
    });

    const photos = photosSnap.docs.map((d) => {
      const p = d.data();
      return {
        url: p["url"] as string,
        source: ((p["source"] as string) === "client" ? "client" : "salon") as
          | "client"
          | "salon",
      };
    });

    const technicians: TechnicianCardObject[] = staffSnap.docs
      .map((d) => {
        const s = d.data();
        return {
          staffId: d.id,
          displayName: (s["displayName"] as string) ?? "",
          firstName: ((s["displayName"] as string) ?? "").split(" ")[0] ?? "",
          avatarUrl: (s["photoUrl"] as string | null) ?? null,
          specialtyTags: ((s["specialtyTags"] as string[]) ?? []).slice(0, 3),
          averageRating:
            ((s["reviewCount"] as number) ?? 0) >= 3
              ? ((s["averageRating"] as number) ?? null)
              : null,
          reviewCount: (s["reviewCount"] as number) ?? 0,
          nextAvailableAt: null,
        };
      })
      .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));

    const reviews: ReviewObject[] = reviewsSnap.docs.map((d) => {
      const r = d.data();
      const createdAt =
        r["createdAt"] != null
          ? (r["createdAt"] as { toDate: () => Date }).toDate().toISOString()
          : new Date().toISOString();
      return {
        reviewId: d.id,
        reviewerName: (r["reviewerName"] as string) ?? "Anonymous",
        rating: (r["rating"] as number) ?? 5,
        body: (r["body"] as string) ?? "",
        photoUrls: (r["photoUrls"] as string[]) ?? [],
        technicianComment: (r["technicianComment"] as string | null) ?? null,
        createdAt,
      };
    });

    const totalReviewCount = (svc["reviewCount"] as number) ?? 0;
    const avgRating =
      totalReviewCount >= 5 ? ((svc["averageRating"] as number) ?? null) : null;

    const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: 0, // aggregate breakdown not stored yet — future Cloud Function
    }));

    const reviewSummary: ReviewSummary = {
      averageRating: avgRating,
      totalCount: totalReviewCount,
      breakdown,
      recentReviews: reviews,
    };

    return {
      serviceId,
      tenantId: svc["tenantId"] as string,
      locationId: svc["locationId"] as string,
      serviceName: svc["name"] as string,
      locationDisplayName: (svc["locationDisplayName"] as string) ?? "",
      description: (svc["description"] as string | null) ?? null,
      categoryId: svc["categoryId"] as string,
      variantLabel: (svc["variantLabel"] as string | null) ?? null,
      variants,
      addons,
      photos,
      technicians,
      reviewSummary,
      isBookableOnline: (svc["isBookableOnline"] as boolean) ?? true,
      locationPhone: (svc["locationPhone"] as string | null) ?? null,
    };
  }

  // ------------------------------------------------------------------
  // Phase 5: search suggestions
  // ------------------------------------------------------------------

  async function getSearchSuggestions(
    q: string,
    _lat?: number,
    _lng?: number
  ): Promise<SearchSuggestion[]> {
    if (q.trim().length < 2) return [];

    const lower = q.toLowerCase();

    // Prefix query on services (name field) — v3 collectionGroup over service_types
    const servicesSnap = await getDocs(
      query(
        collectionGroup(db, SERVICE_TYPES_COLLECTION),
        where("active", "==", true),
        orderBy("name"),
        where("name", ">=", lower),
        where("name", "<=", lower + "\uf8ff"),
        limit(5)
      )
    );

    const suggestions: SearchSuggestion[] = servicesSnap.docs.map((d) => ({
      type: "service" as const,
      id: d.id,
      label: (d.data()["name"] as string) ?? "",
      sublabel: (d.data()["locationDisplayName"] as string) ?? undefined,
    }));

    // Prefix query on locations (displayName field)
    const locationsSnap = await getDocs(
      query(
        collection(db, "locations"),
        orderBy("displayName"),
        where("displayName", ">=", lower),
        where("displayName", "<=", lower + "\uf8ff"),
        limit(3)
      )
    );
    const locationSuggestions: SearchSuggestion[] = locationsSnap.docs.map((d) => ({
      type: "location" as const,
      id: d.id,
      label: (d.data()["displayName"] as string) ?? "",
      sublabel: (d.data()["city"] as string) ?? undefined,
    }));

    return [...suggestions, ...locationSuggestions];
  }

  // ------------------------------------------------------------------
  // Phase 5: loyalty state batch fetch
  // ------------------------------------------------------------------

  async function getUserLoyaltyForServices(
    userId: string,
    tenantIds: string[]
  ): Promise<Record<string, number>> {
    const unique = [...new Set(tenantIds)];
    // Spec: user_brand_loyalty/{userId}_{brandId}, field: pointsBalance
    const snapshots = await Promise.all(
      unique.map((tid) =>
        getDoc(doc(db, "user_brand_loyalty", `${userId}_${tid}`))
      )
    );
    const result: Record<string, number> = {};
    snapshots.forEach((snap, i) => {
      if (snap.exists()) {
        result[unique[i]!] = (snap.data()["pointsBalance"] as number) ?? 0;
      }
    });
    return result;
  }

  return {
    // Legacy
    listCategories,
    listFeaturedSalons,
    listRecentBookings,
    listRecommendedSalons,
    // Phase 5
    getActiveCategories,
    getServiceCards,
    getServiceDetail,
    getSearchSuggestions,
    getUserLoyaltyForServices,
  };
}

export type FirestoreDiscoveryRepository = ReturnType<
  typeof createFirestoreDiscoveryRepository
>;
