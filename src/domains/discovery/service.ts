import type { DiscoveryExploreFeed, DiscoveryFeedPost, DiscoveryHomeFeed, DiscoveryHomeFeedWithEditorial, EditorialCard, ServiceDetailObject, ServiceTypeCard, SponsoredListing } from "./model";
import type { DiscoveryRepository, FirestoreDiscoveryRepository, SearchSuggestion, ServiceCardsParams, ServiceCardsResult } from "./repository";
import type { EditorialRepository } from "./editorialRepository";
import { sponsoredListingToFeedPost } from "./editorialRepository";

export function createDiscoveryService(
  repository: DiscoveryRepository | FirestoreDiscoveryRepository,
  editorialRepo?: EditorialRepository,
) {
  async function getHomeFeed(userId?: string | null): Promise<DiscoveryHomeFeed> {
    const [categories, featuredSalons, recentBookings, recommendedSalons] = await Promise.all([
      repository.listCategories(),
      repository.listFeaturedSalons(userId),
      repository.listRecentBookings(),
      repository.listRecommendedSalons(),
    ]);

    return {
      categories,
      featuredSalons,
      recentBookings,
      recommendedSalons,
      // TODO: fetch real recent reviews from Firestore (GET /home/guest-reviews)
      guestReviews: [
        { id: "rv-1", text: "Booked my lash lift in 30 seconds. Maria was amazing.", reviewerName: "Aisha K.", serviceName: "Lash lift", salonName: "Studio Nico" },
        { id: "rv-2", text: "Found exactly what I wanted and the slot was confirmed instantly.", reviewerName: "Priya S.", serviceName: "Gel manicure", salonName: "Velvet Bloom" },
        { id: "rv-3", text: "Love how easy the rebook button makes everything. Coming back every 3 weeks now.", reviewerName: "Zara M.", serviceName: "Hair blowdry", salonName: "Crown Republic" },
      ],
    };
  }

  /** W22-DEBT-3: Home feed extended with editorial cards */
  async function getHomeFeedWithEditorial(userId?: string | null): Promise<DiscoveryHomeFeedWithEditorial> {
    const [base, editorialCards] = await Promise.all([
      getHomeFeed(userId),
      editorialRepo ? editorialRepo.listEditorialCards() : Promise.resolve<EditorialCard[]>([]),
    ]);
    return { ...base, editorialCards };
  }

  async function getExploreFeed(userId?: string | null): Promise<DiscoveryExploreFeed> {
    const categories = await repository.listCategories();
    let salons: ServiceTypeCard[] = [];
    try {
      const result = await repository.getServiceCards({
        lat: 51.505,
        lng: -0.09,
        radiusMetres: 10_000,
        sort: "recommended",
        pageSize: 20,
        userId: userId ?? undefined,
      });
      salons = result.services;
    } catch (err) {
      // Geo-query may fail when Firestore index is building or no services exist nearby.
      // Degrade gracefully to empty salons — screen shows categories + empty state.
      console.error("[Discovery] getExploreFeed getServiceCards failed:", err);
    }
    return { categories, salons };
  }

  /** W22-DEBT-3: Active sponsored listings converted to feed posts */
  async function getActiveSponsoredPosts(todayIso: string): Promise<DiscoveryFeedPost[]> {
    if (!editorialRepo) return [];
    const listings: SponsoredListing[] = await editorialRepo.listActiveSponsoredListings(todayIso);
    return listings.map(sponsoredListingToFeedPost);
  }

  async function getExploreFeedPage(
    params: Pick<ServiceCardsParams, "cursor" | "pageSize"> & { userId?: string | null }
  ): Promise<ServiceCardsResult> {
    return repository.getServiceCards({
      lat: 51.505,
      lng: -0.09,
      radiusMetres: 10_000,
      sort: "recommended",
      pageSize: params.pageSize ?? 20,
      cursor: params.cursor ?? null,
      userId: params.userId ?? undefined,
    });
  }

  async function getServiceDetail(serviceId: string): Promise<ServiceDetailObject | null> {
    return (repository as FirestoreDiscoveryRepository).getServiceDetail(serviceId);
  }

  async function getSearchSuggestions(q: string, lat?: number, lng?: number): Promise<SearchSuggestion[]> {
    return (repository as FirestoreDiscoveryRepository).getSearchSuggestions(q, lat, lng);
  }

  async function toggleSavedService(_uid: string, _serviceId: string, _save: boolean): Promise<void> {
    // TODO: persist saved state via repository once backend supports it
  }

  return {
    getHomeFeed,
    getHomeFeedWithEditorial,
    getExploreFeed,
    getExploreFeedPage,
    getActiveSponsoredPosts,
    getServiceDetail,
    getSearchSuggestions,
    toggleSavedService,
  };
}

export type DiscoveryService = ReturnType<typeof createDiscoveryService>;