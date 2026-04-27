import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import type {
  DiscoveryCategory,
  DiscoveryCategoryId,
  DiscoveryRecentBooking,
  DiscoverySalonCard,
} from "./model";

type DiscoveryRepositoryOptions = {
  categories: DiscoveryCategory[];
  featuredSalons: DiscoverySalonCard[];
  recentBookings: DiscoveryRecentBooking[];
};

export function createDiscoveryRepository(options: DiscoveryRepositoryOptions) {
  async function listCategories(): Promise<DiscoveryCategory[]> {
    return options.categories;
  }

  async function listFeaturedSalons(): Promise<DiscoverySalonCard[]> {
    return options.featuredSalons;
  }

  async function listRecentBookings(): Promise<DiscoveryRecentBooking[]> {
    return options.recentBookings;
  }

  return {
    listCategories,
    listFeaturedSalons,
    listRecentBookings,
  };
}

export type DiscoveryRepository = ReturnType<typeof createDiscoveryRepository>;

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

/**
 * Firestore-backed discovery repository.
 *
 * Collections:
 *   discoveryFeaturedSalons/{salonId}  — public read, DiscoverySalonCard shape
 *
 * Categories are hardcoded because they map 1:1 to the DiscoveryCategoryId enum.
 * Recent bookings return [] — user-scoped booking history is a separate concern.
 */
export function createFirestoreDiscoveryRepository(db: Firestore): DiscoveryRepository {
  async function listCategories(): Promise<DiscoveryCategory[]> {
    return STATIC_CATEGORIES;
  }

  async function listFeaturedSalons(): Promise<DiscoverySalonCard[]> {
    const col = collection(db, "discoveryFeaturedSalons");
    const q = query(col, orderBy("rating", "desc"), limit(20));
    const snap = await getDocs(q);

    return snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        tenantId: d["tenantId"] as string,
        name: d["name"] as string,
        city: d["city"] as string,
        categories: (d["categories"] as Exclude<DiscoveryCategoryId, "all">[]) ?? [],
        rating: (d["rating"] as number) ?? 0,
        reviewCount: (d["reviewCount"] as number) ?? 0,
        priceFrom: (d["priceFrom"] as number) ?? 0,
        currency: (d["currency"] as string) ?? "EUR",
        nextAvailableLabel: (d["nextAvailableLabel"] as string) ?? "",
        featuredService: (d["featuredService"] as string) ?? "",
        member: (d["member"] as boolean) ?? false,
        bookingEnabled: (d["bookingEnabled"] as boolean) ?? false,
        messageEnabled: (d["messageEnabled"] as boolean) ?? false,
      } satisfies DiscoverySalonCard;
    });
  }

  async function listRecentBookings(): Promise<DiscoveryRecentBooking[]> {
    // User-scoped recent bookings are a future concern — requires auth context.
    return [];
  }

  return {
    listCategories,
    listFeaturedSalons,
    listRecentBookings,
  };
}