import type { DiscoveryExploreFeed, DiscoveryHomeFeed, DiscoveryHomeFeedWithEditorial, EditorialCard, SponsoredListing } from "./model";
import type { DiscoveryRepository } from "./repository";
import type { EditorialRepository } from "./editorialRepository";
import { sponsoredListingToFeedPost } from "./editorialRepository";
import type { DiscoveryFeedPost } from "../../app/discovery/discoveryHelpers";

export function createDiscoveryService(
  repository: DiscoveryRepository,
  editorialRepo?: EditorialRepository,
) {
  async function getHomeFeed(): Promise<DiscoveryHomeFeed> {
    const [categories, featuredSalons, recentBookings] = await Promise.all([
      repository.listCategories(),
      repository.listFeaturedSalons(),
      repository.listRecentBookings(),
    ]);

    return {
      categories,
      featuredSalons,
      recentBookings,
    };
  }

  /** W22-DEBT-3: Home feed extended with editorial cards */
  async function getHomeFeedWithEditorial(): Promise<DiscoveryHomeFeedWithEditorial> {
    const [base, editorialCards] = await Promise.all([
      getHomeFeed(),
      editorialRepo ? editorialRepo.listEditorialCards() : Promise.resolve<EditorialCard[]>([]),
    ]);
    return { ...base, editorialCards };
  }

  async function getExploreFeed(): Promise<DiscoveryExploreFeed> {
    const [categories, salons] = await Promise.all([
      repository.listCategories(),
      repository.listFeaturedSalons(),
    ]);

    return {
      categories,
      salons,
    };
  }

  /** W22-DEBT-3: Active sponsored listings converted to feed posts */
  async function getActiveSponsoredPosts(todayIso: string): Promise<DiscoveryFeedPost[]> {
    if (!editorialRepo) return [];
    const listings: SponsoredListing[] = await editorialRepo.listActiveSponsoredListings(todayIso);
    return listings.map(sponsoredListingToFeedPost);
  }

  return {
    getHomeFeed,
    getHomeFeedWithEditorial,
    getExploreFeed,
    getActiveSponsoredPosts,
  };
}

export type DiscoveryService = ReturnType<typeof createDiscoveryService>;