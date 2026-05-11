/**
 * auditLogRepository.ts — W47
 *
 * Read/write for the tenant-scoped operator audit log.
 * Every significant admin mutation writes an entry here via writeAdminAuditLog().
 * The OperatorAuditLogScreen reads from this collection.
 *
 * Firestore path: tenants/{tenantId}/adminAuditLogs/{logId}
 *
 * Document shape:
 *   id, tenantId, actorUserId, actorRole, action, targetType, targetId?,
 *   summary, createdAt
 */

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Firestore,
} from "firebase/firestore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminAuditAction =
  | "booking.created"
  | "booking.cancelled"
  | "booking.rescheduled"
  | "booking.force_created"
  | "booking.no_show_marked"
  | "staff.invited"
  | "staff.role_changed"
  | "staff.deactivated"
  | "client.merged"
  | "client.blocked"
  | "client.deleted"
  | "client.gdpr_exported"
  | "review.reply_sent"
  | "review.flagged"
  | "review.hidden"
  | "waitlist.converted_to_booking"
  | "waitlist.cancelled"
  | "catalog.service_created"
  | "catalog.service_updated"
  | "catalog.service_deleted"
  | "campaign.sent"
  | "subscription.plan_changed"
  | "subscription.cancelled"
  | "payout.initiated"
  | string; // open extension point

export type AdminAuditLogEntry = {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorRole: string;
  action: AdminAuditAction;
  /** "booking" | "staff" | "client" | ... */
  targetType: string;
  /** The ID of the affected record (may be undefined for list-level actions) */
  targetId?: string;
  /** Short human-readable description, e.g. "Replied to review r-123" */
  summary: string;
  /** ISO string from server timestamp */
  createdAt: string;
};

export type AdminAuditLogFilter = {
  /** If provided, filter to entries by this actor */
  actorUserId?: string;
  /** If provided, filter to entries of this action type */
  action?: AdminAuditAction;
  /** Max number of results (default 100) */
  pageSize?: number;
};

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------

export type AuditLogRepository = {
  listAuditLog(tenantId: string, filter?: AdminAuditLogFilter): Promise<AdminAuditLogEntry[]>;
  writeAdminAuditLog(entry: Omit<AdminAuditLogEntry, "id" | "createdAt">): Promise<void>;
};

// ---------------------------------------------------------------------------
// Firestore adapter
// ---------------------------------------------------------------------------

const COLLECTION = "adminAuditLogs";
const DEFAULT_PAGE_SIZE = 100;

function toEntry(id: string, data: Record<string, unknown>): AdminAuditLogEntry {
  return {
    id,
    tenantId: String(data.tenantId ?? ""),
    actorUserId: String(data.actorUserId ?? ""),
    actorRole: String(data.actorRole ?? ""),
    action: String(data.action ?? "") as AdminAuditAction,
    targetType: String(data.targetType ?? ""),
    targetId: typeof data.targetId === "string" ? data.targetId : undefined,
    summary: String(data.summary ?? ""),
    createdAt:
      data.createdAt && typeof (data.createdAt as { toDate?: unknown }).toDate === "function"
        ? (data.createdAt as { toDate(): Date }).toDate().toISOString()
        : String(data.createdAt ?? ""),
  };
}

export function createAuditLogRepository(db: Firestore): AuditLogRepository {
  return {
    async listAuditLog(tenantId, filter = {}) {
      const col = collection(db, "tenants", tenantId, COLLECTION);
      const constraints: Parameters<typeof query>[1][] = [
        orderBy("createdAt", "desc"),
        limit(filter.pageSize ?? DEFAULT_PAGE_SIZE),
      ];
      if (filter.actorUserId) {
        constraints.unshift(where("actorUserId", "==", filter.actorUserId));
      }
      if (filter.action) {
        constraints.unshift(where("action", "==", filter.action));
      }
      const snap = await getDocs(query(col, ...constraints));
      return snap.docs.map((d) =>
        toEntry(d.id, d.data() as Record<string, unknown>),
      );
    },

    async writeAdminAuditLog(entry) {
      const col = collection(db, "tenants", entry.tenantId, COLLECTION);
      await addDoc(col, {
        ...entry,
        createdAt: serverTimestamp(),
      });
    },
  };
}
