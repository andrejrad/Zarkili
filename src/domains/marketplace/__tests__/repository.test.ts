import { createMarketplaceRepository } from "../repository";
import {
  isCompetitorRecommendationAllowed,
  filterVisibleProfiles,
} from "../model";
import type { MarketplaceSettings, SalonPublicProfile, MarketplacePost } from "../model";

// ---------------------------------------------------------------------------
// In-memory Firestore mock
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function resolveValue(v: unknown): unknown {
    if (v !== null && typeof v === "object" && "_type" in (v as Record<string, unknown>)) {
      return { seconds: 1000, nanoseconds: 0 };
    }
    return v;
  }

  function doc(_db: unknown, path?: string, id?: string) {
    return { _key: `${path}/${id}`, id: id as string };
  }

  async function getDoc(ref: { _key: string; id: string }) {
    const data = store[ref._key];
    return { exists: () => data !== undefined, data: () => (data ? { ...data } : null), id: ref.id };
  }

  async function setDoc(ref: { _key: string }, data: Record<string, unknown>, _opts?: unknown) {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) resolved[k] = resolveValue(v);
    store[ref._key] = resolved;
  }

  function collection(_db: unknown, path: string) {
    return { _path: path };
  }

  type WhereClause = { _field: string; _op: string; _value: unknown };
  function where(field: string, op: string, value: unknown): WhereClause {
    return { _field: field, _op: op, _value: value };
  }

  type QueryRef = { _path: string; _wheres: WhereClause[] };
  function query(colRef: { _path: string }, ...clauses: unknown[]): QueryRef {
    const wheres = clauses.filter((c) => "_field" in (c as object)) as WhereClause[];
    return { _path: colRef._path, _wheres: wheres };
  }

  function applyWhere(data: Record<string, unknown>, clause: WhereClause): boolean {
    const val = data[clause._field];
    if (clause._op === "==") return val === clause._value;
    return false;
  }

  async function getDocs(q: QueryRef) {
    const prefix = q._path + "/";
    const matches = Object.entries(store)
      .filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes("/"))
      .map(([key, data]) => ({ key, data }))
      .filter(({ data }) => q._wheres.every((w) => applyWhere(data, w)));

    return {
      docs: matches.map(({ key, data }) => ({
        data: () => ({ ...data }),
        id: key.split("/").pop()!,
        exists: () => true,
      })),
    };
  }

  function serverTimestamp() { return { _type: "serverTimestamp" }; }

  return { db: {} as unknown, doc, getDoc, setDoc, collection, where, query, getDocs, serverTimestamp };
}

let mock = makeFirestoreMock();

jest.mock("firebase/firestore", () => ({
  doc:             (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc:          (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc:          (...args: unknown[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
  collection:      (...args: unknown[]) => mock.collection(...(args as Parameters<typeof mock.collection>)),
  where:           (...args: unknown[]) => mock.where(...(args as Parameters<typeof mock.where>)),
  query:           (...args: unknown[]) => mock.query(...(args as Parameters<typeof mock.query>)),
  getDocs:         (...args: unknown[]) => mock.getDocs(...(args as Parameters<typeof mock.getDocs>)),
  serverTimestamp: () => mock.serverTimestamp(),
}));

beforeEach(() => { mock = makeFirestoreMock(); });

function makeRepo() { return createMarketplaceRepository(mock.db as never); }

const PROFILE_INPUT: Omit<SalonPublicProfile, "updatedAt"> = {
  tenantId: "salon-1",
  name: "Glow Studio",
  tagline: "Your confidence, amplified.",
  bio: "Award-winning hair and beauty salon.",
  serviceTags: ["hair", "colour"],
  styleTags: ["editorial", "natural"],
  city: "London",
  countryCode: "GB",
};

const SETTINGS_FULL: Omit<MarketplaceSettings, "updatedAt"> = {
  tenantId: "salon-1",
  visibilityMode: "full_profile",
  optedIn: true,
};

const POST_INPUT: Omit<MarketplacePost, "postId" | "createdAt" | "updatedAt"> = {
  tenantId: "salon-1",
  title: "Summer Blonde",
  description: "Light ribbons of honey blonde.",
  imageUrls: ["https://example.com/img1.jpg"],
  serviceTags: ["colour"],
  styleTags: ["natural"],
  isPublished: true,
};

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

describe("isCompetitorRecommendationAllowed", () => {
  it("returns true when no tenant context",         () => expect(isCompetitorRecommendationAllowed(null)).toBe(true));
  it("returns false when tenant context is set",    () => expect(isCompetitorRecommendationAllowed("salon-1")).toBe(false));
});

describe("filterVisibleProfiles", () => {
  const makeEntry = (tenantId: string, visibility: MarketplaceSettings["visibilityMode"], optedIn = true) => ({
    tenantId,
    settings: { tenantId, visibilityMode: visibility, optedIn, updatedAt: {} as never },
  });

  it("includes full_profile opted-in salons",          () => {
    const result = filterVisibleProfiles([makeEntry("s1", "full_profile")], null);
    expect(result.map((r) => r.tenantId)).toContain("s1");
  });

  it("excludes posts_only salons from search",         () => {
    const result = filterVisibleProfiles([makeEntry("s1", "posts_only")], null);
    expect(result).toHaveLength(0);
  });

  it("excludes hidden_search_direct_link salons",      () => {
    const result = filterVisibleProfiles([makeEntry("s1", "hidden_search_direct_link")], null);
    expect(result).toHaveLength(0);
  });

  it("excludes opted-out salons",                      () => {
    const result = filterVisibleProfiles([makeEntry("s1", "full_profile", false)], null);
    expect(result).toHaveLength(0);
  });

  it("excludes context tenant (anti-client-theft)",    () => {
    const result = filterVisibleProfiles([makeEntry("s1", "full_profile"), makeEntry("s2", "full_profile")], "s1");
    expect(result.map((r) => r.tenantId)).not.toContain("s1");
    expect(result.map((r) => r.tenantId)).toContain("s2");
  });
});

// ---------------------------------------------------------------------------
// Profile CRUD
// ---------------------------------------------------------------------------

describe("MarketplaceRepository — profile", () => {
  it("upsertProfile stores and getProfile retrieves", async () => {
    const repo = makeRepo();
    await repo.upsertProfile(PROFILE_INPUT);
    const p = await repo.getProfile("salon-1");
    expect(p?.name).toBe("Glow Studio");
  });

  it("getProfile returns null for unknown tenant", async () => {
    expect(await makeRepo().getProfile("unknown")).toBeNull();
  });

  it("upsertProfile updates existing profile", async () => {
    const repo = makeRepo();
    await repo.upsertProfile(PROFILE_INPUT);
    await repo.upsertProfile({ ...PROFILE_INPUT, tagline: "Updated tagline" });
    const p = await repo.getProfile("salon-1");
    expect(p?.tagline).toBe("Updated tagline");
  });

  it("throws TENANT_REQUIRED for empty tenantId", async () => {
    await expect(makeRepo().upsertProfile({ ...PROFILE_INPUT, tenantId: "" })).rejects.toThrow("TENANT_REQUIRED");
  });
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

describe("MarketplaceRepository — settings", () => {
  it("upsertSettings stores and getSettings retrieves", async () => {
    const repo = makeRepo();
    await repo.upsertSettings(SETTINGS_FULL);
    const s = await repo.getSettings("salon-1");
    expect(s?.visibilityMode).toBe("full_profile");
    expect(s?.optedIn).toBe(true);
  });

  it("getSettings returns null for unknown tenant", async () => {
    expect(await makeRepo().getSettings("unknown")).toBeNull();
  });

  it("upsertSettings updates visibility mode", async () => {
    const repo = makeRepo();
    await repo.upsertSettings(SETTINGS_FULL);
    await repo.upsertSettings({ ...SETTINGS_FULL, visibilityMode: "posts_only" });
    const s = await repo.getSettings("salon-1");
    expect(s?.visibilityMode).toBe("posts_only");
  });

  it("throws TENANT_REQUIRED for empty tenantId", async () => {
    await expect(makeRepo().upsertSettings({ ...SETTINGS_FULL, tenantId: "" })).rejects.toThrow("TENANT_REQUIRED");
  });
});

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

describe("MarketplaceRepository — posts", () => {
  it("createPost returns post with id", async () => {
    const post = await makeRepo().createPost(POST_INPUT);
    expect(post.postId).toBeTruthy();
    expect(post.title).toBe("Summer Blonde");
  });

  it("getPost retrieves created post", async () => {
    const repo = makeRepo();
    const post = await repo.createPost(POST_INPUT);
    const fetched = await repo.getPost("salon-1", post.postId);
    expect(fetched?.postId).toBe(post.postId);
  });

  it("getPost returns null for unknown id", async () => {
    expect(await makeRepo().getPost("salon-1", "nonexistent")).toBeNull();
  });

  it("updatePost changes isPublished", async () => {
    const repo = makeRepo();
    const post = await repo.createPost(POST_INPUT);
    await repo.updatePost("salon-1", post.postId, { isPublished: false });
    const fetched = await repo.getPost("salon-1", post.postId);
    expect(fetched?.isPublished).toBe(false);
  });

  it("updatePost throws POST_NOT_FOUND for unknown id", async () => {
    await expect(makeRepo().updatePost("salon-1", "bad-id", { title: "X" })).rejects.toThrow("POST_NOT_FOUND");
  });

  it("getPublishedPosts returns only published posts", async () => {
    const repo = makeRepo();
    await repo.createPost(POST_INPUT);
    await repo.createPost({ ...POST_INPUT, isPublished: false, title: "Draft" });
    const published = await repo.getPublishedPosts("salon-1");
    expect(published.every((p) => p.isPublished)).toBe(true);
  });

  it("throws TENANT_REQUIRED for empty tenantId", async () => {
    await expect(makeRepo().createPost({ ...POST_INPUT, tenantId: "" })).rejects.toThrow("TENANT_REQUIRED");
  });
});

// ---------------------------------------------------------------------------
// getVisibleProfiles — anti-client-theft + visibility modes
// ---------------------------------------------------------------------------

describe("MarketplaceRepository — getVisibleProfiles", () => {
  async function setupTwoSalons() {
    const repo = makeRepo();
    await repo.upsertProfile(PROFILE_INPUT);
    await repo.upsertSettings(SETTINGS_FULL);
    await repo.upsertProfile({ ...PROFILE_INPUT, tenantId: "salon-2", name: "Salon Two" });
    await repo.upsertSettings({ tenantId: "salon-2", visibilityMode: "full_profile", optedIn: true });
    return repo;
  }

  it("returns all full_profile opted-in salons when no context", async () => {
    const repo = await setupTwoSalons();
    const profiles = await repo.getVisibleProfiles(null);
    expect(profiles.map((p) => p.tenantId)).toContain("salon-1");
    expect(profiles.map((p) => p.tenantId)).toContain("salon-2");
  });

  it("suppresses context tenant in discovery (anti-client-theft)", async () => {
    const repo = await setupTwoSalons();
    const profiles = await repo.getVisibleProfiles("salon-1");
    expect(profiles.map((p) => p.tenantId)).not.toContain("salon-1");
    expect(profiles.map((p) => p.tenantId)).toContain("salon-2");
  });

  it("excludes salons with posts_only visibility", async () => {
    const repo = makeRepo();
    await repo.upsertProfile(PROFILE_INPUT);
    await repo.upsertSettings({ ...SETTINGS_FULL, visibilityMode: "posts_only" });
    const profiles = await repo.getVisibleProfiles(null);
    expect(profiles).toHaveLength(0);
  });

  it("excludes opted-out salons", async () => {
    const repo = makeRepo();
    await repo.upsertProfile(PROFILE_INPUT);
    await repo.upsertSettings({ ...SETTINGS_FULL, optedIn: false });
    const profiles = await repo.getVisibleProfiles(null);
    expect(profiles).toHaveLength(0);
  });

  it("returns empty when no salons registered", async () => {
    const profiles = await makeRepo().getVisibleProfiles(null);
    expect(profiles).toHaveLength(0);
  });
});
