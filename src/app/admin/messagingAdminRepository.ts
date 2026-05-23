/**
 * messagingAdminRepository.ts — W46-DEBT-2
 *
 * Firestore adapters for the admin messaging surfaces.
 *
 * Collection layout:
 *   tenants/{tenantId}/threads/{threadId}           — AdminThread docs
 *   tenants/{tenantId}/blockedClients/{clientId}     — block records
 *   tenants/{tenantId}/reportedClients/{clientId}    — report records
 *   tenants/{tenantId}/cannedReplies/{cannedId}      — CannedReply docs
 *   tenants/{tenantId}/autoReplyConfig               — singleton doc (id = "config")
 *
 * AdminThreadRepository  — thread inbox + archive operations
 * CannedReplyRepository  — canned replies + auto-reply config
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import type {
  AdminThread,
  AutoReplyConfig,
  AutoReplyDay,
  BlockFromInboxInput,
  CannedReply,
  CannedReplyInput,
  MessageArchiveFilter,
  ReportFromInboxInput,
  ThreadArchiveInput,
  ThreadAssignInput,
  ThreadResolveInput,
} from "../../domains/messaging/messagingAdminModel";

import type {
  AdminThreadRepository,
  CannedReplyRepository,
} from "./messagingAdminService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const THREADS_SUBCOL = "threads";
const CANNED_SUBCOL = "cannedReplies";
const BLOCKED_SUBCOL = "blockedClients";
const REPORTED_SUBCOL = "reportedClients";
const AUTO_REPLY_SUBCOL = "autoReplyConfig";
const AUTO_REPLY_DOC_ID = "config";

function threadsCol(db: Firestore, tenantId: string) {
  return collection(db, "tenants", tenantId, THREADS_SUBCOL);
}

function threadRef(db: Firestore, tenantId: string, threadId: string) {
  return doc(db, "tenants", tenantId, THREADS_SUBCOL, threadId);
}

function cannedCol(db: Firestore, tenantId: string) {
  return collection(db, "tenants", tenantId, CANNED_SUBCOL);
}

function cannedRef(db: Firestore, tenantId: string, cannedId: string) {
  return doc(db, "tenants", tenantId, CANNED_SUBCOL, cannedId);
}

function autoReplyRef(db: Firestore, tenantId: string) {
  return doc(db, "tenants", tenantId, AUTO_REPLY_SUBCOL, AUTO_REPLY_DOC_ID);
}

function toIso(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (typeof (ts as { toDate?: unknown }).toDate === "function") {
    return (ts as { toDate(): Date }).toDate().toISOString();
  }
  return String(ts);
}

function docToThread(id: string, data: Record<string, unknown>): AdminThread {
  return {
    threadId: id,
    tenantId: String(data.tenantId ?? ""),
    clientId: String(data.clientId ?? ""),
    clientName: String(data.clientName ?? ""),
    assignedStaffId: typeof data.assignedStaffId === "string" ? data.assignedStaffId : null,
    assignedStaffName: typeof data.assignedStaffName === "string" ? data.assignedStaffName : null,
    subject: typeof data.subject === "string" ? data.subject : null,
    lastMessage: String(data.lastMessage ?? ""),
    lastMessageAt: toIso(data.lastMessageAt),
    unreadCount: typeof data.unreadCount === "number" ? data.unreadCount : 0,
    messageCount: typeof data.messageCount === "number" ? data.messageCount : 0,
    status: (data.status as AdminThread["status"]) ?? "open",
    isAutoReplied: Boolean(data.isAutoReplied),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
  };
}

function docToCanned(id: string, data: Record<string, unknown>): CannedReply {
  return {
    cannedId: id,
    tenantId: String(data.tenantId ?? ""),
    title: String(data.title ?? ""),
    body: String(data.body ?? ""),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    createdBy: String(data.createdBy ?? ""),
    createdAt: toIso(data.createdAt),
  };
}

const DEFAULT_AUTO_REPLY_CONFIG = (tenantId: string): AutoReplyConfig => ({
  tenantId,
  enabled: false,
  outsideHoursMessage: "",
  useCustomMessage: false,
  openHour: 9,
  closeHour: 18,
  enabledDays: ["mon", "tue", "wed", "thu", "fri"] as AutoReplyDay[],
  updatedAt: new Date().toISOString(),
});

// ---------------------------------------------------------------------------
// AdminThreadRepository — Firestore adapter
// ---------------------------------------------------------------------------

export function createFirestoreAdminThreadRepository(db: Firestore): AdminThreadRepository {
  return {
    async listThreads(tenantId, status) {
      const col = threadsCol(db, tenantId);
      const constraints =
        status && status !== "all"
          ? [where("status", "==", status), orderBy("lastMessageAt", "desc")]
          : [orderBy("lastMessageAt", "desc")];
      const snap = await getDocs(query(col, ...constraints));
      return snap.docs.map((d) => docToThread(d.id, d.data() as Record<string, unknown>));
    },

    async getThread(threadId, tenantId) {
      const snap = await getDoc(threadRef(db, tenantId, threadId));
      if (!snap.exists()) return null;
      return docToThread(snap.id, snap.data() as Record<string, unknown>);
    },

    async assignThread(input: ThreadAssignInput) {
      const ref = threadRef(db, input.tenantId, input.threadId);
      await updateDoc(ref, {
        assignedStaffId: input.staffId,
        assignedStaffName: input.staffName,
        status: "assigned",
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(ref);
      return docToThread(snap.id, snap.data() as Record<string, unknown>);
    },

    async resolveThread(input: ThreadResolveInput) {
      const ref = threadRef(db, input.tenantId, input.threadId);
      await updateDoc(ref, {
        status: "resolved",
        resolvedBy: input.resolvedBy,
        resolvedNote: input.note,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(ref);
      return docToThread(snap.id, snap.data() as Record<string, unknown>);
    },

    async archiveThread(input: ThreadArchiveInput) {
      const ref = threadRef(db, input.tenantId, input.threadId);
      await updateDoc(ref, {
        status: "archived",
        archivedBy: input.archivedBy,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(ref);
      return docToThread(snap.id, snap.data() as Record<string, unknown>);
    },

    async blockFromInbox(input: BlockFromInboxInput) {
      const ref = doc(db, "tenants", input.tenantId, BLOCKED_SUBCOL, input.clientId);
      await setDoc(ref, {
        clientId: input.clientId,
        threadId: input.threadId,
        reason: input.reason,
        blockedBy: input.blockedBy,
        blockedAt: serverTimestamp(),
      }, { merge: true });
    },

    async reportFromInbox(input: ReportFromInboxInput) {
      const ref = doc(db, "tenants", input.tenantId, REPORTED_SUBCOL, input.clientId);
      await setDoc(ref, {
        clientId: input.clientId,
        threadId: input.threadId,
        reason: input.reason,
        reportedBy: input.reportedBy,
        reportedAt: serverTimestamp(),
      }, { merge: true });
    },

    async searchArchive(tenantId, filter: MessageArchiveFilter) {
      const col = threadsCol(db, tenantId);
      // Build constraints from available filter fields — Firestore can only
      // equality-filter; full-text search falls back to client-side filtering
      // after fetching the recent window.
      const constraints: Parameters<typeof query>[1][] = [orderBy("lastMessageAt", "desc")];
      if (filter.status) constraints.push(where("status", "==", filter.status));
      if (filter.staffId) constraints.push(where("assignedStaffId", "==", filter.staffId));
      if (filter.clientId) constraints.push(where("clientId", "==", filter.clientId));

      const snap = await getDocs(query(col, ...constraints));
      let results = snap.docs.map((d) => docToThread(d.id, d.data() as Record<string, unknown>));

      // Client-side text search for subject / lastMessage (no full-text index)
      if (filter.searchText) {
        const needle = filter.searchText.toLowerCase();
        results = results.filter(
          (t) =>
            t.lastMessage.toLowerCase().includes(needle) ||
            (t.subject ?? "").toLowerCase().includes(needle) ||
            t.clientName.toLowerCase().includes(needle)
        );
      }
      if (filter.dateFrom) {
        results = results.filter((t) => t.lastMessageAt >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        results = results.filter((t) => t.lastMessageAt <= filter.dateTo!);
      }

      return results;
    },
  };
}

// ---------------------------------------------------------------------------
// CannedReplyRepository — Firestore adapter
// ---------------------------------------------------------------------------

export function createFirestoreCannedReplyRepository(db: Firestore): CannedReplyRepository {
  return {
    async listCannedReplies(tenantId) {
      const snap = await getDocs(query(cannedCol(db, tenantId), orderBy("title", "asc")));
      return snap.docs.map((d) => docToCanned(d.id, d.data() as Record<string, unknown>));
    },

    async saveCannedReply(input: CannedReplyInput) {
      const newRef = doc(cannedCol(db, input.tenantId));
      const data = {
        ...input,
        cannedId: newRef.id,
        createdAt: serverTimestamp(),
      };
      await setDoc(newRef, data);
      return {
        ...input,
        cannedId: newRef.id,
        createdAt: new Date().toISOString(),
      };
    },

    async deleteCannedReply(cannedId, tenantId) {
      await deleteDoc(cannedRef(db, tenantId, cannedId));
    },

    async getAutoReplyConfig(tenantId) {
      const snap = await getDoc(autoReplyRef(db, tenantId));
      if (!snap.exists()) return null;
      const data = snap.data() as Record<string, unknown>;
      return {
        tenantId,
        enabled: Boolean(data.enabled),
        outsideHoursMessage: String(data.outsideHoursMessage ?? ""),
        useCustomMessage: Boolean(data.useCustomMessage),
        openHour: typeof data.openHour === "number" ? data.openHour : 9,
        closeHour: typeof data.closeHour === "number" ? data.closeHour : 18,
        enabledDays: Array.isArray(data.enabledDays) ? (data.enabledDays as AutoReplyDay[]) : [],
        updatedAt: toIso(data.updatedAt),
      } satisfies AutoReplyConfig;
    },

    async saveAutoReplyConfig(config: AutoReplyConfig) {
      await setDoc(
        autoReplyRef(db, config.tenantId),
        { ...config, updatedAt: serverTimestamp() },
        { merge: true }
      );
    },
  };
}

// Exported to allow runtime.ts to create default config without a round-trip
export { DEFAULT_AUTO_REPLY_CONFIG };
