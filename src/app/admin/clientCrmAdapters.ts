/**
 * W46 — clientCrmAdapters (clears W44-DEBT-1)
 *
 * Real Firestore implementations for every repository port declared in
 * clientCrmService.ts.
 *
 * Firestore path conventions:
 *   tenants/{tenantId}/clients/{clientId}
 *   tenants/{tenantId}/gdprRequests/{requestId}
 *   tenants/{tenantId}/segments/{segmentId}
 *   global: users/{userId}
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
  ClientDetailAdmin,
  ClientFilter,
  ClientListEntry,
  ClientSavedView,
  GdprExportFormat,
  GdprExportInput,
  GdprExportRequest,
  GdprExportType,
  MergeInput,
  SavedSegment,
  SegmentBuilderInput,
  SegmentFilter,
  SegmentPreview,
  TargetedMessageInput,
  TargetedMessageResult,
  BlockClientInput,
  DeleteClientInput,
  UnblockClientInput,
} from "../../domains/clients/clientCrmModel";

import type {
  CampaignSendRepository,
  ClientDetailRepository,
  ClientListRepository,
  ClientWriteRepository,
  GdprRepository,
  SegmentBuilderRepository,
} from "./clientCrmService";

// ---------------------------------------------------------------------------
// ClientListRepository
// ---------------------------------------------------------------------------

export function createClientListAdapter(db: Firestore): ClientListRepository {
  return {
    async list(
      tenantId: string,
      filter: ClientFilter,
      savedView: ClientSavedView | null,
      search: string,
    ): Promise<ClientListEntry[]> {
      const ref = collection(db, "tenants", tenantId, "clients");
      let q = query(ref);

      if (filter === "blocked") {
        q = query(ref, where("status", "==", "blocked"));
      } else if (filter === "active") {
        q = query(ref, where("status", "==", "active"));
      } else if (filter === "vip") {
        q = query(ref, where("isVip", "==", true));
      }

      const snap = await getDocs(q);
      let results = snap.docs.map((d) => d.data() as ClientListEntry);

      // Client-side search filter (Firestore full-text is not available)
      if (search.trim()) {
        const lower = search.trim().toLowerCase();
        results = results.filter(
          (c) =>
            c.name.toLowerCase().includes(lower) ||
            (c.email ?? "").toLowerCase().includes(lower) ||
            (c.phone ?? "").includes(lower),
        );
      }

      // Saved-view ordering
      if (savedView === "noShowRisk") {
        results = results.filter((c) => c.totalBookings > 0);
      } else if (savedView === "churned") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        const cutoffStr = cutoff.toISOString().split("T")[0];
        results = results.filter(
          (c) => c.lastVisitDate !== null && c.lastVisitDate < cutoffStr!,
        );
      }

      return results;
    },
  };
}

// ---------------------------------------------------------------------------
// ClientDetailRepository
// ---------------------------------------------------------------------------

export function createClientDetailAdapter(db: Firestore): ClientDetailRepository {
  return {
    async getDetail(clientId: string, tenantId: string): Promise<ClientDetailAdmin | null> {
      const snap = await getDoc(doc(db, "tenants", tenantId, "clients", clientId));
      if (!snap.exists()) return null;
      return snap.data() as ClientDetailAdmin;
    },
  };
}

// ---------------------------------------------------------------------------
// ClientWriteRepository
// ---------------------------------------------------------------------------

export function createClientWriteAdapter(db: Firestore): ClientWriteRepository {
  return {
    async mergeClients(input: MergeInput): Promise<{ mergedClientId: string }> {
      // Mark primary as merge winner; delete secondary.
      const primaryRef = doc(db, "tenants", input.tenantId, "clients", input.primaryClientId);
      const secondaryRef = doc(db, "tenants", input.tenantId, "clients", input.duplicateClientId);
      await updateDoc(primaryRef, {
        mergedFromClientId: input.duplicateClientId,
        mergeReason: input.reason,
        updatedAt: serverTimestamp(),
      });
      await deleteDoc(secondaryRef);
      return { mergedClientId: input.primaryClientId };
    },

    async blockClient(input: BlockClientInput): Promise<void> {
      const ref = doc(db, "tenants", input.tenantId, "clients", input.clientId);
      await updateDoc(ref, {
        status: "blocked",
        blockReason: input.reason,
        blockDurationDays: input.durationDays ?? null,
        blockedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },

    async unblockClient(input: UnblockClientInput): Promise<void> {
      const ref = doc(db, "tenants", input.tenantId, "clients", input.clientId);
      await updateDoc(ref, {
        status: "active",
        blockReason: null,
        blockDurationDays: null,
        blockedAt: null,
        unblockedBy: input.performedBy,
        updatedAt: serverTimestamp(),
      });
    },

    async deleteClient(input: DeleteClientInput): Promise<void> {
      const ref = doc(db, "tenants", input.tenantId, "clients", input.clientId);
      await updateDoc(ref, {
        status: "deleted",
        deletionReason: input.reason,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
  };
}

// ---------------------------------------------------------------------------
// GdprRepository
// ---------------------------------------------------------------------------

export function createGdprAdapter(db: Firestore): GdprRepository {
  return {
    async requestExport(input: GdprExportInput): Promise<GdprExportRequest> {
      const ref = doc(collection(db, "tenants", input.tenantId, "gdprRequests"));
      const requestId = ref.id;
      const now = serverTimestamp();
      const data = {
        requestId,
        tenantId: input.tenantId,
        clientId: input.clientId,
        exportType: input.exportType,
        format: input.format as GdprExportFormat,
        status: "pending" as const,
        requestedBy: input.requestedBy,
        requestedAt: now,
        completedAt: null,
        downloadUrl: null,
        expiresAt: null,
      };
      await setDoc(ref, data);
      const snap = await getDoc(ref);
      return snap.data() as GdprExportRequest;
    },

    async listPreviousRequests(clientId: string, tenantId: string): Promise<GdprExportRequest[]> {
      const q = query(
        collection(db, "tenants", tenantId, "gdprRequests"),
        where("clientId", "==", clientId),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as GdprExportRequest);
    },
  };
}

// ---------------------------------------------------------------------------
// SegmentBuilderRepository
// ---------------------------------------------------------------------------

export function createSegmentBuilderAdapter(db: Firestore): SegmentBuilderRepository {
  return {
    async previewSegment(
      tenantId: string,
      filters: SegmentFilter[],
    ): Promise<SegmentPreview> {
      // Simple client-side filter against the clients collection.
      const snap = await getDocs(collection(db, "tenants", tenantId, "clients"));
      let count = snap.size;

      for (const f of filters) {
        if (f.field === "location" && f.value) {
          count = snap.docs.filter((d) => d.data().locationId === f.value).length;
        }
      }
      return {
        estimatedCount: count,
        sampleClientIds: snap.docs.slice(0, 3).map((d) => d.id),
      };
    },

    async saveSegment(input: SegmentBuilderInput): Promise<SavedSegment> {
      const ref = doc(collection(db, "tenants", input.tenantId, "segments"));
      const segmentId = ref.id;
      const now = serverTimestamp();
      const data = {
        segmentId,
        tenantId: input.tenantId,
        name: input.name,
        filters: input.filters,
        estimatedCount: 0,
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(ref, data);
      const snap = await getDoc(ref);
      return snap.data() as SavedSegment;
    },
  };
}

// ---------------------------------------------------------------------------
// CampaignSendRepository (targeted message dispatch)
// ---------------------------------------------------------------------------

export function createCampaignSendAdapter(db: Firestore): CampaignSendRepository {
  return {
    async sendToSegment(input: TargetedMessageInput): Promise<TargetedMessageResult> {
      const ref = doc(collection(db, "tenants", input.tenantId, "campaignSends"));
      const sendId = ref.id;
      const now = serverTimestamp();
      await setDoc(ref, {
        sendId,
        tenantId: input.tenantId,
        segmentId: input.segmentId,
        channel: input.channel,
        subject: input.subject ?? null,
        body: input.body,
        scheduledAt: input.scheduledAt ?? null,
        sentAt: input.scheduledAt ? null : now,
        status: input.scheduledAt ? "scheduled" : "sending",
        recipientCount: 0,
        sentBy: input.sentBy,
        createdAt: now,
      });
      return {
        messageId: sendId,
        recipientCount: 0,
        scheduledAt: input.scheduledAt ?? null,
      };
    },
  };
}
