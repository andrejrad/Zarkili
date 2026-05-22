import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

import type {
  MarketplacePost,
  CreateMarketplacePostInput,
  UpdateMarketplacePostInput,
  PostPerformanceMetrics,
  PostBookingRow,
  PostComplianceCheckResult,
  AntiTheftSignal,
  AntiTheftKpi,
} from "./marketplaceAdminTypes";

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

const FORBIDDEN_ROLES: string[] = ["technician", "client"];

function assertAllowed(role: string): void {
  if (FORBIDDEN_ROLES.includes(role)) {
    throw new Error("FORBIDDEN: insufficient role");
  }
}

function assertTenantId(tenantId: string | undefined): asserts tenantId is string {
  if (!tenantId || tenantId.trim().length === 0) {
    throw new Error("TENANT_REQUIRED");
  }
}

// ---------------------------------------------------------------------------
// Compliance checker (pure, no I/O)
// ---------------------------------------------------------------------------

export function checkPostCompliance(
  post: Partial<CreateMarketplacePostInput>
): PostComplianceCheckResult {
  const titleOk = Boolean(post.title && post.title.length <= 80 && post.title.length > 0);
  const priceSet = typeof post.priceUsd === "number" && post.priceUsd > 0;
  const hasPhoto = Boolean(post.mediaUrls && post.mediaUrls.length > 0);
  const descriptionOk = Boolean(post.description && post.description.length >= 100);
  const categorySelected = Boolean(post.category && post.category.trim().length > 0);

  return {
    titleOk,
    priceSet,
    hasPhoto,
    descriptionOk,
    categorySelected,
    allPassing: titleOk && priceSet && hasPhoto && descriptionOk && categorySelected,
  };
}

// ---------------------------------------------------------------------------
// Marketplace post CRUD — tenants/{tenantId}/marketplacePosts
// ---------------------------------------------------------------------------

export function createMarketplaceAdminService(db: Firestore) {
  async function listMarketplacePosts(
    tenantId: string,
    actorRole: string
  ): Promise<MarketplacePost[]> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const colRef = collection(db, "tenants", tenantId, "marketplacePosts");
    const snap = await getDocs(query(colRef, orderBy("updatedAt", "desc"), limit(200)));
    return snap.docs.map((d) => ({ postId: d.id, ...d.data() } as MarketplacePost));
  }

  async function getMarketplacePost(
    tenantId: string,
    actorRole: string,
    postId: string
  ): Promise<MarketplacePost | null> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "marketplacePosts", postId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { postId: snap.id, ...snap.data() } as MarketplacePost;
  }

  async function createMarketplacePost(
    tenantId: string,
    actorRole: string,
    input: CreateMarketplacePostInput
  ): Promise<MarketplacePost> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const now = new Date().toISOString();
    const compliance = checkPostCompliance(input);
    const status = compliance.allPassing ? "draft" : "compliance_blocked";

    const colRef = collection(db, "tenants", tenantId, "marketplacePosts");
    const docRef = await addDoc(colRef, {
      tenantId,
      ...input,
      status,
      createdAt: now,
      updatedAt: now,
    });
    return {
      postId: docRef.id,
      tenantId,
      ...input,
      status,
      createdAt: now,
      updatedAt: now,
    };
  }

  async function updateMarketplacePost(
    tenantId: string,
    actorRole: string,
    postId: string,
    input: UpdateMarketplacePostInput
  ): Promise<void> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "marketplacePosts", postId);
    await updateDoc(ref, { ...input, updatedAt: new Date().toISOString() });
  }

  async function publishMarketplacePost(
    tenantId: string,
    actorRole: string,
    postId: string
  ): Promise<void> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "marketplacePosts", postId);
    await updateDoc(ref, { status: "published", updatedAt: new Date().toISOString() });
  }

  async function deleteMarketplacePost(
    tenantId: string,
    actorRole: string,
    postId: string
  ): Promise<void> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "marketplacePosts", postId);
    await deleteDoc(ref);
  }

  // ---------------------------------------------------------------------------
  // Per-post performance — tenants/{tenantId}/postPerformance/{postId}
  // ---------------------------------------------------------------------------

  async function getPostPerformance(
    tenantId: string,
    actorRole: string,
    postId: string
  ): Promise<PostPerformanceMetrics | null> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "postPerformance", postId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { postId, tenantId, ...snap.data() } as PostPerformanceMetrics;
  }

  async function getPostBookings(
    tenantId: string,
    actorRole: string,
    postId: string
  ): Promise<PostBookingRow[]> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const colRef = collection(db, "tenants", tenantId, "bookings");
    const snap = await getDocs(
      query(colRef, where("marketplacePostId", "==", postId), orderBy("startTime", "desc"), limit(100))
    );
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        bookingId: d.id,
        date: data.startTime as string,
        serviceDate: data.startTime as string,
        clientName: data.clientName as string ?? "",
        serviceName: data.serviceName as string ?? "",
        amountUsd: (data.priceUsd as number) ?? 0,
        revenueUsd: (data.priceUsd as number) ?? 0,
        rating: (data.rating as number | null) ?? null,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Anti-theft signals — tenants/{tenantId}/antiTheftSignals
  // ---------------------------------------------------------------------------

  async function getAntiTheftKpi(
    tenantId: string,
    actorRole: string
  ): Promise<AntiTheftKpi> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const colRef = collection(db, "tenants", tenantId, "antiTheftSignals");
    const [suspiciousSnap, confirmedSnap] = await Promise.all([
      getDocs(query(colRef, where("status", "==", "suspicious"), limit(500))),
      getDocs(query(colRef, where("status", "==", "confirmed"), limit(500))),
    ]);

    const atRiskStaff = new Set<string>();
    suspiciousSnap.docs.forEach((d) => {
      const staffId = d.data().staffId as string;
      if (staffId) atRiskStaff.add(staffId);
    });

    return {
      signalCount: suspiciousSnap.size,
      confirmedCount: confirmedSnap.size,
      atRiskStaffCount: atRiskStaff.size,
    };
  }

  async function listAntiTheftSignals(
    tenantId: string,
    actorRole: string
  ): Promise<AntiTheftSignal[]> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const colRef = collection(db, "tenants", tenantId, "antiTheftSignals");
    const snap = await getDocs(query(colRef, orderBy("detectedAt", "desc"), limit(200)));
    return snap.docs.map((d) => ({ signalId: d.id, ...d.data() } as AntiTheftSignal));
  }

  async function investigateAntiTheftSignal(
    tenantId: string,
    actorRole: string,
    signalId: string,
    investigatedBy: string
  ): Promise<void> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "antiTheftSignals", signalId);
    await updateDoc(ref, {
      status: "confirmed",
      investigatedAt: new Date().toISOString(),
      investigatedBy,
    });
  }

  async function escalateAntiTheftSignal(
    tenantId: string,
    actorRole: string,
    signalId: string
  ): Promise<void> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "antiTheftSignals", signalId);
    await updateDoc(ref, { escalatedAt: new Date().toISOString() });
  }

  async function dismissAntiTheftSignal(
    tenantId: string,
    actorRole: string,
    signalId: string
  ): Promise<void> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "antiTheftSignals", signalId);
    await updateDoc(ref, { status: "dismissed" });
  }

  return {
    listMarketplacePosts,
    getMarketplacePost,
    createMarketplacePost,
    updateMarketplacePost,
    publishMarketplacePost,
    deleteMarketplacePost,
    getPostPerformance,
    getPostBookings,
    getAntiTheftKpi,
    listAntiTheftSignals,
    investigateAntiTheftSignal,
    escalateAntiTheftSignal,
    dismissAntiTheftSignal,
  };
}

export type MarketplaceAdminService = ReturnType<typeof createMarketplaceAdminService>;
