/**
 * W46 — campaignAdminAdapters (clears W45-DEBT-1 campaign half)
 *
 * Real Firestore implementations for campaign repository ports declared in
 * campaignAdminService.ts.
 *
 * Firestore path conventions:
 *   tenants/{tenantId}/campaigns/{campaignId}
 *   tenants/{tenantId}/transactionalOverrides/{overrideId}
 *   tenants/{tenantId}/promoCodes/{codeId}
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import type {
  CampaignBuilderInput,
  CampaignListEntry,
  CampaignPerformanceDetail,
  PromoCode,
  PromoCodeCreateInput,
  PromoCodeStatus,
  TransactionalTemplateOverride,
} from "../../domains/campaigns/campaignAdminModel";
import type {
  CampaignListAdminRepository,
  CampaignWriteRepository,
  PromoCodeRepository,
  TransactionalTemplateRepository,
} from "./campaignAdminService";

// ---------------------------------------------------------------------------
// CampaignListAdminRepository
// ---------------------------------------------------------------------------

export function createCampaignListAdapter(
  db: Firestore,
): CampaignListAdminRepository {
  return {
    async list(tenantId: string, status?: string): Promise<CampaignListEntry[]> {
      const ref = collection(db, "tenants", tenantId, "campaigns");
      const q = status ? query(ref, where("status", "==", status)) : query(ref);
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as CampaignListEntry);
    },

    async getDetail(
      campaignId: string,
      tenantId: string,
    ): Promise<CampaignPerformanceDetail | null> {
      const snap = await getDoc(doc(db, "tenants", tenantId, "campaigns", campaignId));
      if (!snap.exists()) return null;
      return snap.data() as CampaignPerformanceDetail;
    },
  };
}

// ---------------------------------------------------------------------------
// CampaignWriteRepository
// ---------------------------------------------------------------------------

export function createCampaignWriteAdapter(db: Firestore): CampaignWriteRepository {
  return {
    async create(input: CampaignBuilderInput): Promise<{ campaignId: string }> {
      const ref = doc(collection(db, "tenants", input.tenantId, "campaigns"));
      const campaignId = ref.id;
      await setDoc(ref, {
        ...input,
        campaignId,
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { campaignId };
    },

    async updateStatus(
      campaignId: string,
      tenantId: string,
      status: "scheduled" | "paused" | "cancelled",
    ): Promise<void> {
      await updateDoc(doc(db, "tenants", tenantId, "campaigns", campaignId), {
        status,
        updatedAt: serverTimestamp(),
      });
    },
  };
}

// ---------------------------------------------------------------------------
// TransactionalTemplateRepository
// ---------------------------------------------------------------------------

export function createTransactionalTemplateAdapter(
  db: Firestore,
): TransactionalTemplateRepository {
  return {
    async listOverrides(tenantId: string): Promise<TransactionalTemplateOverride[]> {
      const snap = await getDocs(
        collection(db, "tenants", tenantId, "transactionalOverrides"),
      );
      return snap.docs.map((d) => d.data() as TransactionalTemplateOverride);
    },

    async saveOverride(
      overrideId: string | null,
      input: Omit<TransactionalTemplateOverride, "overrideId">,
    ): Promise<TransactionalTemplateOverride> {
      const ref = overrideId
        ? doc(db, "tenants", input.tenantId, "transactionalOverrides", overrideId)
        : doc(collection(db, "tenants", input.tenantId, "transactionalOverrides"));
      const id = ref.id;
      const data = { ...input, overrideId: id, updatedAt: serverTimestamp() };
      await setDoc(ref, data, { merge: true });
      const snap = await getDoc(ref);
      return snap.data() as TransactionalTemplateOverride;
    },

    async deleteOverride(overrideId: string, tenantId: string): Promise<void> {
      await deleteDoc(
        doc(db, "tenants", tenantId, "transactionalOverrides", overrideId),
      );
    },
  };
}

// ---------------------------------------------------------------------------
// PromoCodeRepository
// ---------------------------------------------------------------------------

export function createPromoCodeAdapter(db: Firestore): PromoCodeRepository {
  return {
    async list(tenantId: string, status?: PromoCodeStatus): Promise<PromoCode[]> {
      const ref = collection(db, "tenants", tenantId, "promoCodes");
      const q = status ? query(ref, where("status", "==", status)) : query(ref);
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as PromoCode);
    },

    async create(input: PromoCodeCreateInput): Promise<PromoCode> {
      const ref = doc(collection(db, "tenants", input.tenantId, "promoCodes"));
      const codeId = ref.id;
      const data = {
        ...input,
        codeId,
        status: "active" as PromoCodeStatus,
        usedCount: 0,
        createdAt: serverTimestamp(),
      };
      await setDoc(ref, data);
      const snap = await getDoc(ref);
      return snap.data() as PromoCode;
    },

    async updateStatus(
      codeId: string,
      tenantId: string,
      status: PromoCodeStatus,
    ): Promise<void> {
      await updateDoc(doc(db, "tenants", tenantId, "promoCodes", codeId), {
        status,
        updatedAt: serverTimestamp(),
      });
    },
  };
}
