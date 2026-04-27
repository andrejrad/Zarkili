/**
 * Campaigns repository
 *
 * Collections:
 *   tenants/{tenantId}/campaigns/{campaignId}
 *   tenants/{tenantId}/campaignSendLogs/{logId}
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
  type Firestore,
} from "firebase/firestore";

import {
  CampaignError,
  EMPTY_METRICS,
  isValidTransition,
  type Campaign,
  type CampaignSendLog,
  type CampaignStatus,
} from "./model";

// ---------------------------------------------------------------------------
// Repository type
// ---------------------------------------------------------------------------

export type CampaignRepository = {
  createCampaign(draft: Omit<Campaign, "campaignId" | "createdAt" | "updatedAt" | "metrics">): Promise<Campaign>;
  getCampaign(tenantId: string, campaignId: string): Promise<Campaign | null>;
  updateCampaignStatus(tenantId: string, campaignId: string, status: CampaignStatus): Promise<void>;
  getDueCampaigns(tenantId: string, nowIso: string): Promise<Campaign[]>;
  recordSendLog(log: Omit<CampaignSendLog, "logId" | "timestamp">): Promise<CampaignSendLog>;
  getCampaignSendLogs(tenantId: string, campaignId: string): Promise<CampaignSendLog[]>;
  /**
   * Marks a previously recorded send log as converted (e.g., after the recipient
   * completed a booking attributable to the campaign). Increments the parent
   * campaign's `converted` metric atomically with the log update.
   */
  markSendLogConverted(
    tenantId: string,
    logId: string,
    conversionRef: string,
  ): Promise<CampaignSendLog>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCampaignRepository(db: Firestore): CampaignRepository {
  function campaignCol(tenantId: string) {
    return collection(db, `tenants/${tenantId}/campaigns`);
  }

  function campaignRef(tenantId: string, campaignId: string) {
    return doc(db, `tenants/${tenantId}/campaigns`, campaignId);
  }

  function sendLogCol(tenantId: string) {
    return collection(db, `tenants/${tenantId}/campaignSendLogs`);
  }

  function sendLogRef(tenantId: string, logId: string) {
    return doc(db, `tenants/${tenantId}/campaignSendLogs`, logId);
  }

  async function createCampaign(
    draft: Omit<Campaign, "campaignId" | "createdAt" | "updatedAt" | "metrics">,
  ): Promise<Campaign> {
    if (!draft.tenantId) throw new CampaignError("TENANT_REQUIRED", "tenantId is required");

    const campaignId = `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const campaign: Campaign = {
      ...draft,
      campaignId,
      metrics: { ...EMPTY_METRICS },
      createdAt: serverTimestamp() as never,
      updatedAt: serverTimestamp() as never,
    };

    await setDoc(campaignRef(draft.tenantId, campaignId), campaign);
    return campaign;
  }

  async function getCampaign(tenantId: string, campaignId: string): Promise<Campaign | null> {
    const snap = await getDoc(campaignRef(tenantId, campaignId));
    if (!snap.exists()) return null;
    return snap.data() as Campaign;
  }

  async function updateCampaignStatus(
    tenantId: string,
    campaignId: string,
    newStatus: CampaignStatus,
  ): Promise<void> {
    const snap = await getDoc(campaignRef(tenantId, campaignId));
    if (!snap.exists()) throw new CampaignError("CAMPAIGN_NOT_FOUND", `Campaign ${campaignId} not found`);

    const current = snap.data() as Campaign;
    if (!isValidTransition(current.status, newStatus)) {
      throw new CampaignError(
        "INVALID_STATUS_TRANSITION",
        `Cannot transition from ${current.status} to ${newStatus}`,
      );
    }

    await updateDoc(campaignRef(tenantId, campaignId), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  }

  async function getDueCampaigns(tenantId: string, nowIso: string): Promise<Campaign[]> {
    if (!tenantId) throw new CampaignError("TENANT_REQUIRED", "tenantId is required");

    const q = query(
      campaignCol(tenantId),
      where("status", "==", "scheduled"),
      where("scheduledAt", "<=", nowIso),
      orderBy("scheduledAt"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Campaign);
  }

  async function recordSendLog(
    log: Omit<CampaignSendLog, "logId" | "timestamp">,
  ): Promise<CampaignSendLog> {
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const sendLog: CampaignSendLog = {
      ...log,
      logId,
      timestamp: serverTimestamp() as never,
    };
    await setDoc(sendLogRef(log.tenantId, logId), sendLog);
    return sendLog;
  }

  async function getCampaignSendLogs(
    tenantId: string,
    campaignId: string,
  ): Promise<CampaignSendLog[]> {
    const q = query(sendLogCol(tenantId), where("campaignId", "==", campaignId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as CampaignSendLog);
  }

  async function markSendLogConverted(
    tenantId: string,
    logId: string,
    conversionRef: string,
  ): Promise<CampaignSendLog> {
    if (!tenantId) throw new CampaignError("TENANT_REQUIRED", "tenantId is required");

    const ref = sendLogRef(tenantId, logId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new CampaignError("SEND_LOG_NOT_FOUND", `Send log ${logId} not found`);
    }
    const existing = snap.data() as CampaignSendLog;

    // Idempotent: if already converted, return existing without re-incrementing.
    if (existing.converted) {
      return existing;
    }

    const updates = {
      converted: true,
      conversionRef,
      convertedAt: serverTimestamp(),
    };
    await updateDoc(ref, updates);

    // Increment the parent campaign's `converted` metric.
    const campaignSnap = await getDoc(campaignRef(tenantId, existing.campaignId));
    if (campaignSnap.exists()) {
      const c = campaignSnap.data() as Campaign;
      const nextMetrics = {
        ...(c.metrics ?? EMPTY_METRICS),
        converted: (c.metrics?.converted ?? 0) + 1,
      };
      await updateDoc(campaignRef(tenantId, existing.campaignId), {
        metrics: nextMetrics,
        updatedAt: serverTimestamp(),
      });
    }

    return {
      ...existing,
      converted: true,
      conversionRef,
      convertedAt: updates.convertedAt as never,
    };
  }

  return {
    createCampaign,
    getCampaign,
    updateCampaignStatus,
    getDueCampaigns,
    recordSendLog,
    getCampaignSendLogs,
    markSendLogConverted,
  };
}
