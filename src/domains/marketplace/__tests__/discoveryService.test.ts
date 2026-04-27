import {
  encodeFeedCursor,
  decodeFeedCursor,
  getFeedPage,
  searchProfiles,
  assembleProfileView,
  buildBookThisLookDeepLink,
  type FeedItem,
} from "../discoveryService";
import type {
  MarketplacePost,
  MarketplaceSettings,
  SalonPublicProfile,
} from "../model";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const ts = { _type: "serverTimestamp" } as const;

function makePost(overrides: Partial<MarketplacePost> & { postId: string; tenantId: string }): MarketplacePost {
  return {
    postId: overrides.postId,
    tenantId: overrides.tenantId,
    title: overrides.title ?? "Untitled",
    description: overrides.description ?? "",
    imageUrls: overrides.imageUrls ?? [],
    serviceTags: overrides.serviceTags ?? [],
    styleTags: overrides.styleTags ?? [],
    bookThisLookServiceId: overrides.bookThisLookServiceId,
    isPublished: overrides.isPublished ?? true,
    createdAt: ts,
    updatedAt: ts,
  };
}

function makeProfile(overrides: Partial<SalonPublicProfile> & { tenantId: string }): SalonPublicProfile {
  return {
    tenantId: overrides.tenantId,
    name: overrides.name ?? `Salon ${overrides.tenantId}`,
    tagline: overrides.tagline ?? "",
    bio: overrides.bio ?? "",
    serviceTags: overrides.serviceTags ?? [],
    styleTags: overrides.styleTags ?? [],
    city: overrides.city,
    countryCode: overrides.countryCode,
    updatedAt: ts,
  };
}

function makeSettings(tenantId: string, overrides: Partial<MarketplaceSettings> = {}): MarketplaceSettings {
  return {
    tenantId,
    visibilityMode: overrides.visibilityMode ?? "full_profile",
    optedIn: overrides.optedIn ?? true,
    updatedAt: ts,
  };
}

// ---------------------------------------------------------------------------
// Cursor encoding
// ---------------------------------------------------------------------------

describe("feed cursor encoding", () => {
  it("round-trips a (millis, postId) pair", () => {
    const cursor = encodeFeedCursor(1700000000000, "post-42");
    expect(decodeFeedCursor(cursor)).toEqual({
      createdAtMillis: 1700000000000,
      postId: "post-42",
    });
  });

  it("returns null for malformed input", () => {
    expect(decodeFeedCursor(null)).toBeNull();
    expect(decodeFeedCursor("")).toBeNull();
    expect(decodeFeedCursor("nope")).toBeNull();
    expect(decodeFeedCursor("123:")).toBeNull();
    expect(decodeFeedCursor(":post-1")).toBeNull();
    expect(decodeFeedCursor("abc:post-1")).toBeNull();
  });

  it("preserves colons inside the postId", () => {
    const cursor = encodeFeedCursor(1, "post:with:colons");
    expect(decodeFeedCursor(cursor)).toEqual({
      createdAtMillis: 1,
      postId: "post:with:colons",
    });
  });
});

// ---------------------------------------------------------------------------
// getFeedPage
// ---------------------------------------------------------------------------

describe("getFeedPage", () => {
  const items: FeedItem[] = [
    { post: makePost({ postId: "p1", tenantId: "salon-A" }), createdAtMillis: 100 },
    { post: makePost({ postId: "p2", tenantId: "salon-B" }), createdAtMillis: 200 },
    { post: makePost({ postId: "p3", tenantId: "salon-A" }), createdAtMillis: 300 },
    { post: makePost({ postId: "p4", tenantId: "salon-C" }), createdAtMillis: 400 },
  ];

  it("returns posts ordered by createdAt DESC", () => {
    const page = getFeedPage({ candidates: items, limit: 10, tenantContext: null });
    expect(page.items.map((p) => p.postId)).toEqual(["p4", "p3", "p2", "p1"]);
    expect(page.nextCursor).toBeNull();
  });

  it("paginates with nextCursor when more results remain", () => {
    const first = getFeedPage({ candidates: items, limit: 2, tenantContext: null });
    expect(first.items.map((p) => p.postId)).toEqual(["p4", "p3"]);
    expect(first.nextCursor).not.toBeNull();

    const second = getFeedPage({
      candidates: items,
      limit: 2,
      tenantContext: null,
      cursor: first.nextCursor,
    });
    expect(second.items.map((p) => p.postId)).toEqual(["p2", "p1"]);
    expect(second.nextCursor).toBeNull();
  });

  it("suppresses competitor posts when tenantContext is set", () => {
    const page = getFeedPage({ candidates: items, limit: 10, tenantContext: "salon-A" });
    expect(page.items.map((p) => p.postId)).toEqual(["p3", "p1"]);
  });

  it("excludes unpublished posts", () => {
    const candidates: FeedItem[] = [
      { post: makePost({ postId: "p1", tenantId: "salon-A" }), createdAtMillis: 100 },
      {
        post: makePost({ postId: "p-draft", tenantId: "salon-A", isPublished: false }),
        createdAtMillis: 999,
      },
    ];
    const page = getFeedPage({ candidates, limit: 10, tenantContext: null });
    expect(page.items.map((p) => p.postId)).toEqual(["p1"]);
  });

  it("returns empty page when limit <= 0", () => {
    const page = getFeedPage({ candidates: items, limit: 0, tenantContext: null });
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it("treats malformed cursor as start-from-top", () => {
    const page = getFeedPage({
      candidates: items,
      limit: 10,
      tenantContext: null,
      cursor: "garbage",
    });
    expect(page.items).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// searchProfiles
// ---------------------------------------------------------------------------

describe("searchProfiles", () => {
  const candidates = [
    {
      profile: makeProfile({
        tenantId: "salon-A",
        name: "Vivid Studio",
        city: "Zagreb",
        serviceTags: ["color", "balayage"],
        styleTags: ["bold"],
      }),
      settings: makeSettings("salon-A"),
    },
    {
      profile: makeProfile({
        tenantId: "salon-B",
        name: "Quiet Cuts",
        city: "Split",
        serviceTags: ["cut"],
        styleTags: ["minimal"],
      }),
      settings: makeSettings("salon-B"),
    },
    {
      profile: makeProfile({
        tenantId: "salon-C",
        name: "Hidden",
        city: "Zagreb",
        serviceTags: ["color"],
        styleTags: ["bold"],
      }),
      settings: makeSettings("salon-C", { visibilityMode: "hidden_search_direct_link" }),
    },
    {
      profile: makeProfile({ tenantId: "salon-D", name: "Opted Out", city: "Zagreb" }),
      settings: makeSettings("salon-D", { optedIn: false }),
    },
  ];

  it("filters by city", () => {
    const out = searchProfiles({
      candidates,
      filters: { city: "Zagreb" },
      tenantContext: null,
    });
    expect(out.map((p) => p.tenantId)).toEqual(["salon-A"]);
  });

  it("filters by serviceTag (case-insensitive)", () => {
    const out = searchProfiles({
      candidates,
      filters: { serviceTag: "BALAYAGE" },
      tenantContext: null,
    });
    expect(out.map((p) => p.tenantId)).toEqual(["salon-A"]);
  });

  it("filters by styleTag", () => {
    const out = searchProfiles({
      candidates,
      filters: { styleTag: "minimal" },
      tenantContext: null,
    });
    expect(out.map((p) => p.tenantId)).toEqual(["salon-B"]);
  });

  it("filters by free-text query against name/tagline/bio", () => {
    const out = searchProfiles({
      candidates,
      filters: { text: "vivid" },
      tenantContext: null,
    });
    expect(out.map((p) => p.tenantId)).toEqual(["salon-A"]);
  });

  it("excludes hidden_search_direct_link and opted-out tenants", () => {
    const out = searchProfiles({ candidates, filters: {}, tenantContext: null });
    expect(out.map((p) => p.tenantId).sort()).toEqual(["salon-A", "salon-B"]);
  });

  it("excludes the customer's own salon when tenantContext is set", () => {
    const out = searchProfiles({ candidates, filters: {}, tenantContext: "salon-A" });
    expect(out.map((p) => p.tenantId)).toEqual(["salon-B"]);
  });
});

// ---------------------------------------------------------------------------
// assembleProfileView
// ---------------------------------------------------------------------------

describe("assembleProfileView", () => {
  it("returns posts owned by the profile, newest first", () => {
    const profile = makeProfile({ tenantId: "salon-A" });
    const posts: FeedItem[] = [
      { post: makePost({ postId: "p1", tenantId: "salon-A" }), createdAtMillis: 100 },
      { post: makePost({ postId: "p2", tenantId: "salon-A" }), createdAtMillis: 300 },
      { post: makePost({ postId: "p3", tenantId: "salon-B" }), createdAtMillis: 200 },
    ];
    const view = assembleProfileView({ profile, posts });
    expect(view.profile.tenantId).toBe("salon-A");
    expect(view.posts.map((p) => p.postId)).toEqual(["p2", "p1"]);
  });

  it("respects postLimit", () => {
    const profile = makeProfile({ tenantId: "salon-A" });
    const posts: FeedItem[] = Array.from({ length: 20 }, (_, i) => ({
      post: makePost({ postId: `p${i}`, tenantId: "salon-A" }),
      createdAtMillis: i,
    }));
    const view = assembleProfileView({ profile, posts, postLimit: 3 });
    expect(view.posts).toHaveLength(3);
    expect(view.posts[0].postId).toBe("p19");
  });

  it("excludes unpublished posts", () => {
    const profile = makeProfile({ tenantId: "salon-A" });
    const posts: FeedItem[] = [
      { post: makePost({ postId: "p1", tenantId: "salon-A" }), createdAtMillis: 100 },
      {
        post: makePost({ postId: "p-draft", tenantId: "salon-A", isPublished: false }),
        createdAtMillis: 200,
      },
    ];
    const view = assembleProfileView({ profile, posts });
    expect(view.posts.map((p) => p.postId)).toEqual(["p1"]);
  });
});

// ---------------------------------------------------------------------------
// buildBookThisLookDeepLink
// ---------------------------------------------------------------------------

describe("buildBookThisLookDeepLink", () => {
  it("includes salon and sourcePostId", () => {
    const link = buildBookThisLookDeepLink(
      makePost({ postId: "post-9", tenantId: "salon-A" }),
    );
    expect(link.path).toBe("/book");
    expect(link.params.salon).toBe("salon-A");
    expect(link.params.sourcePostId).toBe("post-9");
    expect(link.params.service).toBeUndefined();
  });

  it("includes service when bookThisLookServiceId is present", () => {
    const link = buildBookThisLookDeepLink(
      makePost({
        postId: "post-9",
        tenantId: "salon-A",
        bookThisLookServiceId: "svc-balayage",
      }),
    );
    expect(link.params.service).toBe("svc-balayage");
    expect(link.params.sourcePostId).toBe("post-9");
  });
});
