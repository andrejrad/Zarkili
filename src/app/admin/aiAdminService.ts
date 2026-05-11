import {
  collection,
  doc,
  getDocs,
  getDoc,
  getCountFromServer,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  type Firestore,
} from "firebase/firestore";
import type { AiFeatureKey } from "../../shared/ai";
import type {
  AiFeatureToggleConfig,
  AiSuggestion,
  AiSuggestionFilter,
  AiSuggestionQueueSummary,
  AiUsageKpi,
  AiUsageByFeature,
  AiSafetyIncident,
  AiAuditLogEntry,
  AiAuditFilter,
} from "./aiAdminTypes";

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

export type AiAdminActorRole =
  | "tenant_owner"
  | "platform_admin";

const FORBIDDEN_ROLES: string[] = ["technician", "client"];

function assertAllowed(role: string): void {
  if (FORBIDDEN_ROLES.includes(role)) {
    throw new Error("FORBIDDEN: insufficient role for AI admin operations");
  }
}

function assertTenantId(tenantId: string | undefined): asserts tenantId is string {
  if (!tenantId || tenantId.trim().length === 0) {
    throw new Error("TENANT_REQUIRED");
  }
}

// ---------------------------------------------------------------------------
// Toggle config — stored at tenants/{tenantId}/aiConfig/toggles
// ---------------------------------------------------------------------------

export function createAiAdminService(db: Firestore) {
  async function getAiToggles(
    tenantId: string,
    actorRole: string
  ): Promise<AiFeatureToggleConfig[]> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "aiConfig", "toggles");
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return [];
    }
    const data = snap.data() as Record<string, boolean>;
    return Object.entries(data).map(([featureKey, enabled]) => ({
      featureKey: featureKey as AiFeatureKey,
      enabled,
      planRequired: null,
    }));
  }

  async function updateAiToggles(
    tenantId: string,
    actorRole: string,
    toggles: Pick<AiFeatureToggleConfig, "featureKey" | "enabled">[]
  ): Promise<void> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "aiConfig", "toggles");
    const patch: Record<string, boolean> = {};
    for (const t of toggles) {
      patch[t.featureKey] = t.enabled;
    }
    await setDoc(ref, patch, { merge: true });
  }

  // ---------------------------------------------------------------------------
  // Suggestion review queue — tenants/{tenantId}/aiSuggestions
  // ---------------------------------------------------------------------------

  async function listAiSuggestions(
    tenantId: string,
    actorRole: string,
    filter: AiSuggestionFilter = {}
  ): Promise<AiSuggestion[]> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const colRef = collection(db, "tenants", tenantId, "aiSuggestions");
    const constraints = [orderBy("generatedAt", "desc"), limit(200)];
    if (filter.kind) {
      constraints.unshift(where("kind", "==", filter.kind));
    }
    if (filter.status) {
      constraints.unshift(where("status", "==", filter.status));
    }
    const snap = await getDocs(query(colRef, ...constraints));
    let results = snap.docs.map((d) => ({ suggestionId: d.id, ...d.data() } as AiSuggestion));
    if (filter.search) {
      const lower = filter.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.outputPreview.toLowerCase().includes(lower) ||
          s.inputSummary.toLowerCase().includes(lower)
      );
    }
    return results;
  }

  async function getAiSuggestionQueueSummary(
    tenantId: string,
    actorRole: string
  ): Promise<AiSuggestionQueueSummary> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);
    const todayMidnightISO = todayMidnight.toISOString();

    const colRef = collection(db, "tenants", tenantId, "aiSuggestions");
    const [pendingSnap, approvedSnap, rejectedSnap] = await Promise.all([
      getDocs(query(colRef, where("status", "==", "pending"), limit(500))),
      getCountFromServer(
        query(colRef, where("status", "==", "approved"), where("reviewedAt", ">=", todayMidnightISO))
      ),
      getCountFromServer(
        query(colRef, where("status", "==", "rejected"), where("reviewedAt", ">=", todayMidnightISO))
      ),
    ]);
    return {
      pendingCount: pendingSnap.size,
      approvedToday: approvedSnap.data().count,
      rejectedToday: rejectedSnap.data().count,
    };
  }

  async function approveAiSuggestion(
    tenantId: string,
    actorRole: string,
    suggestionId: string,
    reviewNote?: string
  ): Promise<void> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "aiSuggestions", suggestionId);
    await updateDoc(ref, {
      status: "approved",
      reviewedAt: new Date().toISOString(),
      reviewNote: reviewNote ?? null,
    });
  }

  async function rejectAiSuggestion(
    tenantId: string,
    actorRole: string,
    suggestionId: string,
    reviewNote?: string
  ): Promise<void> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "aiSuggestions", suggestionId);
    await updateDoc(ref, {
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewNote: reviewNote ?? null,
    });
  }

  // ---------------------------------------------------------------------------
  // Usage analytics — tenants/{tenantId}/aiUsage/current
  // ---------------------------------------------------------------------------

  async function getAiUsageKpi(
    tenantId: string,
    actorRole: string
  ): Promise<AiUsageKpi> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const ref = doc(db, "tenants", tenantId, "aiUsage", "current");
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { totalTokens: 0, totalCostUsd: 0, avgLatencyMs: 0, incidentCount: 0, blockCount: 0 };
    }
    return snap.data() as AiUsageKpi;
  }

  async function getAiUsageByFeature(
    tenantId: string,
    actorRole: string
  ): Promise<AiUsageByFeature[]> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const colRef = collection(db, "tenants", tenantId, "aiUsage", "current", "byFeature");
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ featureKey: d.id as AiFeatureKey, ...d.data() } as AiUsageByFeature));
  }

  async function listAiSafetyIncidents(
    tenantId: string,
    actorRole: string
  ): Promise<AiSafetyIncident[]> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const colRef = collection(db, "tenants", tenantId, "aiSafetyIncidents");
    const snap = await getDocs(query(colRef, orderBy("createdAt", "desc"), limit(100)));
    return snap.docs.map((d) => ({ incidentId: d.id, ...d.data() } as AiSafetyIncident));
  }

  // ---------------------------------------------------------------------------
  // AI audit log — tenants/{tenantId}/aiAuditLog
  // ---------------------------------------------------------------------------

  async function listAiAuditLog(
    tenantId: string,
    actorRole: string,
    filter: AiAuditFilter = {}
  ): Promise<AiAuditLogEntry[]> {
    assertTenantId(tenantId);
    assertAllowed(actorRole);

    const colRef = collection(db, "tenants", tenantId, "aiAuditLog");
    const constraints = [orderBy("createdAt", "desc"), limit(200)];
    if (filter.featureKey) {
      constraints.unshift(where("featureKey", "==", filter.featureKey));
    }
    if (filter.decision) {
      constraints.unshift(where("decision", "==", filter.decision));
    }
    const snap = await getDocs(query(colRef, ...constraints));
    let results = snap.docs.map((d) => ({ entryId: d.id, ...d.data() } as AiAuditLogEntry));
    if (filter.search) {
      const lower = filter.search.toLowerCase();
      results = results.filter(
        (e) =>
          e.outputSnippet.toLowerCase().includes(lower) ||
          e.actorDisplay.toLowerCase().includes(lower)
      );
    }
    if (filter.dateStart) {
      results = results.filter((e) => e.createdAt >= filter.dateStart!);
    }
    if (filter.dateEnd) {
      results = results.filter((e) => e.createdAt <= filter.dateEnd!);
    }
    return results;
  }

  return {
    getAiToggles,
    updateAiToggles,
    listAiSuggestions,
    getAiSuggestionQueueSummary,
    approveAiSuggestion,
    rejectAiSuggestion,
    getAiUsageKpi,
    getAiUsageByFeature,
    listAiSafetyIncidents,
    listAiAuditLog,
  };
}

export type AiAdminService = ReturnType<typeof createAiAdminService>;
