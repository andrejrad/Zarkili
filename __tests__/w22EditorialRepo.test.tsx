/**
 * w22EditorialRepo.test.tsx — W22-DEBT-3
 *
 * Tests for:
 *   1. sponsoredListingToFeedPost helper (editorialRepository.ts)
 *   2. createDiscoveryService — getActiveSponsoredPosts (service.ts)
 *   3. createDiscoveryService — getHomeFeedWithEditorial (service.ts)
 *   4. createFirestoreEditorialRepository structural surface check
 */

import type { EditorialCard, SponsoredListing } from "../src/domains/discovery/model";
import type { EditorialRepository } from "../src/domains/discovery/editorialRepository";
import {
  sponsoredListingToFeedPost,
  createFirestoreEditorialRepository,
} from "../src/domains/discovery/editorialRepository";
import { createDiscoveryService } from "../src/domains/discovery/service";
import type { DiscoveryRepository } from "../src/domains/discovery/repository";
import type { DiscoveryHomeFeed } from "../src/domains/discovery/model";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_LISTING: SponsoredListing = {
  listingId: "listing-abc",
  tenantId: "tenant-xyz",
  salonName: "Glam Studio",
  caption: "Spring collection now available",
  imageUrl: "https://example.com/image.jpg",
  createdAt: "2025-01-01T00:00:00.000Z",
  startsAt: "2025-06-01",
  endsAt: "2025-12-31",
  active: true,
};

const SAMPLE_CARD: EditorialCard = {
  cardId: "card-001",
  title: "Summer Trends",
  subtitle: "Hottest looks this season",
  imageUrl: "https://example.com/summer.jpg",
  deepLink: "zarkili://explore/summer",
  sortOrder: 1,
  expiresAt: "2025-09-30",
  active: true,
};

const EMPTY_HOME_FEED: DiscoveryHomeFeed = {
  categories: [],
  featuredSalons: [],
  recentBookings: [],
  recommendedSalons: [],
};

// ---------------------------------------------------------------------------
// Minimal DiscoveryRepository stub
// ---------------------------------------------------------------------------

function makeBaseRepo(): DiscoveryRepository {
  return {
    listCategories: async () => [],
    listFeaturedSalons: async () => [],
    listRecentBookings: async () => [],
    listRecommendedSalons: async () => [],
    searchSalons: async () => [],
    getServiceCards: async () => ({ services: [], nextCursor: null, total: 0, locationLabel: "" }),
  };
}

// ---------------------------------------------------------------------------
// sponsoredListingToFeedPost
// ---------------------------------------------------------------------------

describe("sponsoredListingToFeedPost", () => {
  it("prefixes id with 'sponsored-'", () => {
    const post = sponsoredListingToFeedPost(SAMPLE_LISTING);
    expect(post.id).toBe("sponsored-listing-abc");
  });

  it("maps salonId from tenantId", () => {
    const post = sponsoredListingToFeedPost(SAMPLE_LISTING);
    expect(post.salonId).toBe("tenant-xyz");
  });

  it("maps salonName and caption", () => {
    const post = sponsoredListingToFeedPost(SAMPLE_LISTING);
    expect(post.salonName).toBe("Glam Studio");
    expect(post.caption).toBe("Spring collection now available");
  });

  it("maps imageUrl", () => {
    const post = sponsoredListingToFeedPost(SAMPLE_LISTING);
    expect(post.imageUrl).toBe("https://example.com/image.jpg");
  });

  it("sets isSponsored to true", () => {
    const post = sponsoredListingToFeedPost(SAMPLE_LISTING);
    expect(post.isSponsored).toBe(true);
  });

  it("sets likeCount to 0", () => {
    const post = sponsoredListingToFeedPost(SAMPLE_LISTING);
    expect(post.likeCount).toBe(0);
  });

  it("works when imageUrl is absent", () => {
    const noImage = { ...SAMPLE_LISTING, imageUrl: undefined };
    const post = sponsoredListingToFeedPost(noImage);
    expect(post.imageUrl).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// createDiscoveryService — without editorial repo
// ---------------------------------------------------------------------------

describe("createDiscoveryService — without editorial repo", () => {
  const service = createDiscoveryService(makeBaseRepo());

  it("getActiveSponsoredPosts returns empty array", async () => {
    const posts = await service.getActiveSponsoredPosts("2025-07-01");
    expect(posts).toEqual([]);
  });

  it("getHomeFeedWithEditorial returns editorialCards = []", async () => {
    const feed = await service.getHomeFeedWithEditorial();
    expect(feed.editorialCards).toEqual([]);
  });

  it("getHomeFeed still works", async () => {
    const feed = await service.getHomeFeed();
    expect(feed).toMatchObject({ categories: [], featuredSalons: [], recentBookings: [] });
  });
});

// ---------------------------------------------------------------------------
// createDiscoveryService — with editorial repo
// ---------------------------------------------------------------------------

describe("createDiscoveryService — with editorial repo", () => {
  function makeEditorialRepo(
    cards: EditorialCard[] = [SAMPLE_CARD],
    listings: SponsoredListing[] = [SAMPLE_LISTING],
  ): EditorialRepository {
    return {
      listEditorialCards: async () => cards,
      listActiveSponsoredListings: async (_today) => listings,
    };
  }

  it("getActiveSponsoredPosts returns feed posts converted from listings", async () => {
    const service = createDiscoveryService(makeBaseRepo(), makeEditorialRepo());
    const posts = await service.getActiveSponsoredPosts("2025-07-01");
    expect(posts).toHaveLength(1);
    expect(posts[0].isSponsored).toBe(true);
    expect(posts[0].id).toBe("sponsored-listing-abc");
    expect(posts[0].salonName).toBe("Glam Studio");
  });

  it("getActiveSponsoredPosts returns [] when repo returns no listings", async () => {
    const service = createDiscoveryService(makeBaseRepo(), makeEditorialRepo([], []));
    const posts = await service.getActiveSponsoredPosts("2025-07-01");
    expect(posts).toEqual([]);
  });

  it("getHomeFeedWithEditorial includes editorial cards", async () => {
    const service = createDiscoveryService(makeBaseRepo(), makeEditorialRepo([SAMPLE_CARD]));
    const feed = await service.getHomeFeedWithEditorial();
    expect(feed.editorialCards).toHaveLength(1);
    expect(feed.editorialCards[0].cardId).toBe("card-001");
    expect(feed.editorialCards[0].title).toBe("Summer Trends");
  });

  it("getHomeFeedWithEditorial includes base feed data alongside editorial cards", async () => {
    const service = createDiscoveryService(makeBaseRepo(), makeEditorialRepo());
    const feed = await service.getHomeFeedWithEditorial();
    expect(feed).toMatchObject({
      categories: [],
      featuredSalons: [],
      recentBookings: [],
    });
    expect(feed.editorialCards).toBeDefined();
  });

  it("getActiveSponsoredPosts passes todayIso to editorial repo", async () => {
    let capturedDate = "";
    const repo: EditorialRepository = {
      listEditorialCards: async () => [],
      listActiveSponsoredListings: async (today) => {
        capturedDate = today;
        return [];
      },
    };
    const service = createDiscoveryService(makeBaseRepo(), repo);
    await service.getActiveSponsoredPosts("2025-12-25");
    expect(capturedDate).toBe("2025-12-25");
  });

  it("propagates rejection from editorial repo as-is", async () => {
    const failingRepo: EditorialRepository = {
      listEditorialCards: async () => [],
      listActiveSponsoredListings: async () => {
        throw new Error("network-failure");
      },
    };
    const service = createDiscoveryService(makeBaseRepo(), failingRepo);
    await expect(service.getActiveSponsoredPosts("2025-07-01")).rejects.toThrow("network-failure");
  });
});

// ---------------------------------------------------------------------------
// createFirestoreEditorialRepository — structural surface check
// (no Firestore dependency; verifies shape of the returned object)
// ---------------------------------------------------------------------------

describe("createFirestoreEditorialRepository — factory shape", () => {
  it("exposes listEditorialCards and listActiveSponsoredListings methods", () => {
    expect(typeof createFirestoreEditorialRepository).toBe("function");
    expect(typeof sponsoredListingToFeedPost).toBe("function");
  });

  it("returns an object with the expected interface surface", () => {
    // Pass a minimal mock so we can inspect the returned shape without Firestore
    const mockDb = {} as import("firebase/firestore").Firestore;
    const repo = createFirestoreEditorialRepository(mockDb);
    expect(typeof repo.listEditorialCards).toBe("function");
    expect(typeof repo.listActiveSponsoredListings).toBe("function");
  });
});
