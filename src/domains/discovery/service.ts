import type { DiscoveryExploreFeed, DiscoveryHomeFeed } from "./model";
import type { DiscoveryRepository } from "./repository";

export function createDiscoveryService(repository: DiscoveryRepository) {
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

  return {
    getHomeFeed,
    getExploreFeed,
  };
}

export type DiscoveryService = ReturnType<typeof createDiscoveryService>;