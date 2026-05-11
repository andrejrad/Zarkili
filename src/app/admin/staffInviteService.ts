/**
 * W41-DEBT-1 — staffInviteService
 *
 * Writes a pending staff invite to `tenants/{tenantId}/pendingStaff/{inviteId}`.
 * A Cloud Function trigger (email/SMS dispatch) will listen to creates on this
 * collection — that trigger is a backend infrastructure concern outside this
 * service scope.
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
  updateDoc,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import type { StaffRole } from "../../domains/staff/model";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SendInviteInput = {
  tenantId: string;
  email: string;
  role: StaffRole;
  locationId: string;
  invitedBy: string;
};

export type PendingStaffInvite = {
  inviteId: string;
  tenantId: string;
  email: string;
  role: StaffRole;
  locationId: string;
  status: "pending" | "accepted" | "cancelled";
  invitedBy: string;
  createdAt: string;
};

type InviteResult<T> = { ok: true; data: T } | { ok: false; message: string };

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createStaffInviteService(db?: Firestore) {
  async function sendInvite(
    input: SendInviteInput,
  ): Promise<InviteResult<{ inviteId: string }>> {
    if (!db) return { ok: false, message: "Staff invite service not configured." };
    if (!input.email.trim()) return { ok: false, message: "Email address is required." };
    if (!input.tenantId) return { ok: false, message: "Tenant context missing." };
    if (!input.locationId.trim()) return { ok: false, message: "Location ID is required." };

    try {
      const ref = doc(collection(db, "tenants", input.tenantId, "pendingStaff"));
      await setDoc(ref, {
        inviteId: ref.id,
        tenantId: input.tenantId,
        email: input.email.trim().toLowerCase(),
        role: input.role,
        locationId: input.locationId.trim(),
        status: "pending",
        invitedBy: input.invitedBy,
        createdAt: serverTimestamp(),
      });
      return { ok: true, data: { inviteId: ref.id } };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Unable to send invitation.",
      };
    }
  }

  async function listPendingInvites(
    tenantId: string,
  ): Promise<InviteResult<PendingStaffInvite[]>> {
    if (!db) return { ok: false, message: "Staff invite service not configured." };
    try {
      const q = query(
        collection(db, "tenants", tenantId, "pendingStaff"),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      const invites: PendingStaffInvite[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          inviteId: d.id,
          tenantId: data["tenantId"] ?? tenantId,
          email: data["email"] ?? "",
          role: (data["role"] ?? "technician") as StaffRole,
          locationId: data["locationId"] ?? "",
          status: (data["status"] ?? "pending") as PendingStaffInvite["status"],
          invitedBy: data["invitedBy"] ?? "",
          createdAt: data["createdAt"]?.toDate?.()?.toISOString?.() ?? "",
        };
      });
      return { ok: true, data: invites };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Unable to load invitations.",
      };
    }
  }

  async function cancelInvite(
    inviteId: string,
    tenantId: string,
  ): Promise<InviteResult<void>> {
    if (!db) return { ok: false, message: "Staff invite service not configured." };
    try {
      const ref = doc(db, "tenants", tenantId, "pendingStaff", inviteId);
      await updateDoc(ref, { status: "cancelled" });
      return { ok: true, data: undefined };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Unable to cancel invitation.",
      };
    }
  }

  return { sendInvite, listPendingInvites, cancelInvite };
}

export type StaffInviteService = ReturnType<typeof createStaffInviteService>;
