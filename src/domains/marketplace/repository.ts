/**
 * Marketplace repository
 *
 * Collections:
 *   tenants/{tenantId}/marketplaceProfile/{tenantId}  (single doc)
 *   tenants/{tenantId}/marketplacePosts/{postId}
 *   tenants/{tenantId}/marketplaceSettings/{tenantId} (single doc)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  where,
  type Firestore,
} from "firebase/firestore";

import {
  MarketplaceError,
  filterVisibleProfiles,
  type MarketplacePost,
  type MarketplaceSettings,
  type SalonPublicProfile,
  type VisibilityMode,
} from "./model";

// ---------------------------------------------------------------------------
// Repository type
// ---------------------------------------------------------------------------

export type MarketplaceRepository = {
  // Profile
  upsertProfile(profile: Omit<SalonPublicProfile, "updatedAt">): Promise<SalonPublicProfile>;
  getProfile(tenantId: string): Promise<SalonPublicProfile | null>;

  // Posts
  createPost(post: Omit<MarketplacePost, "postId" | "createdAt" | "updatedAt">): Promise<MarketplacePost>;
  getPost(tenantId: string, postId: string): Promise<MarketplacePost | null>;
  updatePost(tenantId: string, postId: string, updates: Partial<Pick<MarketplacePost, "title" | "description" | "imageUrls" | "serviceTags" | "styleTags" | "bookThisLookServiceId" | "isPublished">>): Promise<void>;
  getPublishedPosts(tenantId: string): Promise<MarketplacePost[]>;

  // Settings
  upsertSettings(settings: Omit<MarketplaceSettings, "updatedAt">): Promise<MarketplaceSettings>;
  getSettings(tenantId: string): Promise<MarketplaceSettings | null>;

  // Discovery
  getVisibleProfiles(tenantContext: string | null): Promise<SalonPublicProfile[]>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMarketplaceRepository(db: Firestore): MarketplaceRepository {
  function profileRef(tenantId: string) {
    return doc(db, `tenants/${tenantId}/marketplaceProfile`, tenantId);
  }

  function postCol(tenantId: string) {
    return collection(db, `tenants/${tenantId}/marketplacePosts`);
  }

  function postRef(tenantId: string, postId: string) {
    return doc(db, `tenants/${tenantId}/marketplacePosts`, postId);
  }

  function settingsRef(tenantId: string) {
    return doc(db, `tenants/${tenantId}/marketplaceSettings`, tenantId);
  }

  // We store all settings in a single top-level collection for the discovery query
  function globalSettingsCol() {
    return collection(db, "marketplaceSettingsIndex");
  }

  function globalSettingsRef(tenantId: string) {
    return doc(db, "marketplaceSettingsIndex", tenantId);
  }

  async function upsertProfile(
    profile: Omit<SalonPublicProfile, "updatedAt">,
  ): Promise<SalonPublicProfile> {
    if (!profile.tenantId) throw new MarketplaceError("TENANT_REQUIRED", "tenantId is required");

    const full: SalonPublicProfile = { ...profile, updatedAt: serverTimestamp() as never };
    await setDoc(profileRef(profile.tenantId), full, { merge: true });
    return full;
  }

  async function getProfile(tenantId: string): Promise<SalonPublicProfile | null> {
    const snap = await getDoc(profileRef(tenantId));
    if (!snap.exists()) return null;
    return snap.data() as SalonPublicProfile;
  }

  async function createPost(
    post: Omit<MarketplacePost, "postId" | "createdAt" | "updatedAt">,
  ): Promise<MarketplacePost> {
    if (!post.tenantId) throw new MarketplaceError("TENANT_REQUIRED", "tenantId is required");

    const postId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const full: MarketplacePost = {
      ...post,
      postId,
      createdAt: serverTimestamp() as never,
      updatedAt: serverTimestamp() as never,
    };
    await setDoc(postRef(post.tenantId, postId), full);
    return full;
  }

  async function getPost(tenantId: string, postId: string): Promise<MarketplacePost | null> {
    const snap = await getDoc(postRef(tenantId, postId));
    if (!snap.exists()) return null;
    return snap.data() as MarketplacePost;
  }

  async function updatePost(
    tenantId: string,
    postId: string,
    updates: Partial<Pick<MarketplacePost, "title" | "description" | "imageUrls" | "serviceTags" | "styleTags" | "bookThisLookServiceId" | "isPublished">>,
  ): Promise<void> {
    const snap = await getDoc(postRef(tenantId, postId));
    if (!snap.exists()) throw new MarketplaceError("POST_NOT_FOUND", `Post ${postId} not found`);

    await setDoc(
      postRef(tenantId, postId),
      { ...(snap.data() as MarketplacePost), ...updates, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  async function getPublishedPosts(tenantId: string): Promise<MarketplacePost[]> {
    const q = query(postCol(tenantId), where("isPublished", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as MarketplacePost);
  }

  async function upsertSettings(
    settings: Omit<MarketplaceSettings, "updatedAt">,
  ): Promise<MarketplaceSettings> {
    if (!settings.tenantId) throw new MarketplaceError("TENANT_REQUIRED", "tenantId is required");

    const full: MarketplaceSettings = { ...settings, updatedAt: serverTimestamp() as never };
    // Persist in both tenant sub-collection and global index for discovery
    await setDoc(settingsRef(settings.tenantId), full, { merge: true });
    await setDoc(globalSettingsRef(settings.tenantId), full, { merge: true });
    return full;
  }

  async function getSettings(tenantId: string): Promise<MarketplaceSettings | null> {
    const snap = await getDoc(settingsRef(tenantId));
    if (!snap.exists()) return null;
    return snap.data() as MarketplaceSettings;
  }

  async function getVisibleProfiles(tenantContext: string | null): Promise<SalonPublicProfile[]> {
    // Fetch all opted-in, full_profile settings from the global index
    const q = query(
      globalSettingsCol(),
      where("optedIn", "==", true),
      where("visibilityMode", "==", "full_profile" as VisibilityMode),
    );
    const settingsSnap = await getDocs(q);
    const settingsWithIds = settingsSnap.docs.map((d) => ({
      tenantId: d.id,
      settings: d.data() as MarketplaceSettings,
    }));

    // Apply anti-client-theft guard
    const visible = filterVisibleProfiles(settingsWithIds, tenantContext);

    // Fetch corresponding profiles
    const profiles = await Promise.all(
      visible.map(({ tenantId }) => getProfile(tenantId)),
    );

    return profiles.filter((p): p is SalonPublicProfile => p !== null);
  }

  return {
    upsertProfile,
    getProfile,
    createPost,
    getPost,
    updatePost,
    getPublishedPosts,
    upsertSettings,
    getSettings,
    getVisibleProfiles,
  };
}
