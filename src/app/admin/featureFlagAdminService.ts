import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { FeatureFlag } from "./platformAdminTypes";

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

function assertPlatformAdmin(role: string): void {
  if (role !== "platform_admin") {
    throw new Error("FORBIDDEN: platform_admin role required for feature flag management");
  }
}

// ---------------------------------------------------------------------------
// Service factory  — closes KI-004
// ---------------------------------------------------------------------------

export function createFeatureFlagAdminService(db: Firestore) {
  /**
   * List all platform-level feature flags.
   */
  async function listPlatformFlags(actorRole: string): Promise<FeatureFlag[]> {
    assertPlatformAdmin(actorRole);
    const snap = await getDocs(
      query(
        collection(db, "featureFlags"),
        where("scope", "==", "platform"),
        orderBy("flagKey"),
        limit(200)
      )
    );
    return snap.docs.map((d) => ({ flagKey: d.id, ...(d.data() as Omit<FeatureFlag, "flagKey">) }));
  }

  /**
   * List tenant-scoped feature flags for a specific tenant (closes KI-004).
   */
  async function listTenantFlags(actorRole: string, tenantId: string): Promise<FeatureFlag[]> {
    assertPlatformAdmin(actorRole);
    const snap = await getDocs(
      query(
        collection(db, "featureFlags"),
        where("scope", "==", "tenant"),
        where("tenantId", "==", tenantId),
        orderBy("flagKey"),
        limit(200)
      )
    );
    return snap.docs.map((d) => ({ flagKey: d.id, ...(d.data() as Omit<FeatureFlag, "flagKey">) }));
  }

  /**
   * Enable or disable a feature flag for a tenant (closes KI-004).
   */
  async function setTenantFlag(
    actorRole: string,
    flagKey: string,
    tenantId: string,
    enabled: boolean,
    updatedBy: string
  ): Promise<void> {
    assertPlatformAdmin(actorRole);
    const ref = doc(db, "featureFlags", `${tenantId}__${flagKey}`);
    await updateDoc(ref, {
      flagKey,
      label: flagKey,
      scope: "tenant",
      tenantId,
      enabled,
      updatedAt: new Date().toISOString(),
      updatedBy,
    });
  }

  /**
   * Enable or disable a platform-level flag.
   */
  async function setPlatformFlag(
    actorRole: string,
    flagKey: string,
    enabled: boolean,
    updatedBy: string
  ): Promise<void> {
    assertPlatformAdmin(actorRole);
    await updateDoc(doc(db, "featureFlags", flagKey), {
      enabled,
      updatedAt: new Date().toISOString(),
      updatedBy,
      updatedAtServer: serverTimestamp(),
    });
  }

  return {
    listPlatformFlags,
    listTenantFlags,
    setTenantFlag,
    setPlatformFlag,
  };
}
