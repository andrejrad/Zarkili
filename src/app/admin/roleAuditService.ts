/**
 * W41-DEBT-4 — roleAuditService
 *
 * Write and list role-change audit entries per staff member.
 * Firestore path: `tenants/{tenantId}/staff/{staffId}/roleAudit/{entryId}`
 *
 * Pattern mirrors all other admin service factories.
 */
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { Firestore, Timestamp } from "firebase/firestore";

import type { StaffRole } from "../../domains/staff/model";

import type { StaffRoleAuditEntry } from "./StaffRoleScreen";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuditResult<T> = { ok: true; data: T } | { ok: false; message: string };

export type WriteRoleAuditInput = {
  fromRole: StaffRole;
  toRole: StaffRole;
  changedBy: string;
  reason?: string;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createRoleAuditService(db?: Firestore) {
  async function writeRoleAudit(
    staffId: string,
    tenantId: string,
    input: WriteRoleAuditInput,
  ): Promise<AuditResult<void>> {
    if (!db) return { ok: false, message: "Role audit service not configured." };
    try {
      const ref = doc(collection(db, "tenants", tenantId, "staff", staffId, "roleAudit"));
      await setDoc(ref, {
        id: ref.id,
        staffId,
        tenantId,
        fromRole: input.fromRole,
        toRole: input.toRole,
        changedBy: input.changedBy,
        reason: input.reason ?? null,
        changedAt: serverTimestamp(),
      });
      return { ok: true, data: undefined };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Unable to write role audit entry.",
      };
    }
  }

  async function listRoleAudit(
    staffId: string,
    tenantId: string,
  ): Promise<AuditResult<StaffRoleAuditEntry[]>> {
    if (!db) return { ok: false, message: "Role audit service not configured." };
    try {
      const col = collection(db, "tenants", tenantId, "staff", staffId, "roleAudit");
      const q = query(col, orderBy("changedAt", "desc"));
      const snap = await getDocs(q);
      const entries: StaffRoleAuditEntry[] = snap.docs.map((d) => {
        const data = d.data();
        const ts = data["changedAt"] as Timestamp | null;
        return {
          id: d.id,
          changedBy: (data["changedBy"] as string) ?? "",
          fromRole: (data["fromRole"] as StaffRole) ?? "technician",
          toRole: (data["toRole"] as StaffRole) ?? "technician",
          changedAt: ts ? ts.toDate().toISOString() : new Date().toISOString(),
          reason: (data["reason"] as string | null) ?? null,
        };
      });
      return { ok: true, data: entries };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Unable to load role audit trail.",
      };
    }
  }

  return { writeRoleAudit, listRoleAudit };
}

export type RoleAuditService = ReturnType<typeof createRoleAuditService>;
