/**
 * waitlistAdminRepository.ts — W46-DEBT-3
 *
 * Firestore adapters for the admin waitlist surfaces.
 *
 * Collection layout:
 *   tenants/{tenantId}/waitlistEntries/{waitlistId}   — WaitlistAdminEntry docs
 *   tenants/{tenantId}/bookings/{bookingId}            — Booking docs (write only here)
 *   tenants/{tenantId}/waitlistPolicy                  — singleton doc (id = "policy")
 *
 * WaitlistAdminRepository  — list, get, notify, cancel waitlist entries
 * WaitlistBookingRepository — convert waitlist entry to a booking
 * WaitlistPolicyRepository  — read / write waitlist policy config
 */

import {
  collection,
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
  ConvertToBookingInput,
  ConvertToBookingResult,
  WaitlistAdminEntry,
  WaitlistAdminFilter,
  WaitlistAdminStatus,
  WaitlistPolicy,
  WaitlistTimePreferenceAdmin,
} from "../../domains/waitlist/waitlistAdminModel";
import type {
  WaitlistAdminRepository,
  WaitlistBookingRepository,
  WaitlistPolicyRepository,
} from "./waitlistAdminService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WAITLIST_SUBCOL = "waitlistEntries";
const BOOKINGS_SUBCOL = "bookings";
const POLICY_SUBCOL = "waitlistPolicy";
const POLICY_DOC_ID = "policy";

function waitlistCol(db: Firestore, tenantId: string) {
  return collection(db, "tenants", tenantId, WAITLIST_SUBCOL);
}

function waitlistRef(db: Firestore, tenantId: string, waitlistId: string) {
  return doc(db, "tenants", tenantId, WAITLIST_SUBCOL, waitlistId);
}

function policyRef(db: Firestore, tenantId: string) {
  return doc(db, "tenants", tenantId, POLICY_SUBCOL, POLICY_DOC_ID);
}

function toIso(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (typeof (ts as { toDate?: unknown }).toDate === "function") {
    return (ts as { toDate(): Date }).toDate().toISOString();
  }
  return String(ts);
}

function toIsoOrNull(ts: unknown): string | null {
  if (!ts) return null;
  if (typeof (ts as { toDate?: unknown }).toDate === "function") {
    return (ts as { toDate(): Date }).toDate().toISOString();
  }
  return String(ts);
}

function docToEntry(id: string, data: Record<string, unknown>): WaitlistAdminEntry {
  return {
    waitlistId: id,
    tenantId: String(data.tenantId ?? ""),
    clientId: String(data.clientId ?? ""),
    clientName: String(data.clientName ?? ""),
    clientPhone: typeof data.clientPhone === "string" ? data.clientPhone : null,
    serviceId: String(data.serviceId ?? ""),
    serviceName: String(data.serviceName ?? ""),
    staffId: typeof data.staffId === "string" ? data.staffId : null,
    staffName: typeof data.staffName === "string" ? data.staffName : null,
    locationId: String(data.locationId ?? ""),
    preferredDateFrom: String(data.preferredDateFrom ?? ""),
    preferredDateTo: String(data.preferredDateTo ?? ""),
    preferredTime: (data.preferredTime as WaitlistTimePreferenceAdmin) ?? "anytime",
    priority: typeof data.priority === "number" ? data.priority : 999,
    status: (data.status as WaitlistAdminStatus) ?? "waiting",
    joinedAt: toIso(data.joinedAt),
    expiresAt: toIsoOrNull(data.expiresAt),
    notifiedAt: toIsoOrNull(data.notifiedAt),
    notifyPush: Boolean(data.notifyPush),
    notifySms: Boolean(data.notifySms),
  };
}

// ---------------------------------------------------------------------------
// WaitlistAdminRepository — Firestore adapter
// ---------------------------------------------------------------------------

export function createFirestoreWaitlistAdminRepository(
  db: Firestore
): WaitlistAdminRepository {
  return {
    async list(tenantId: string, filter: WaitlistAdminFilter) {
      const col = waitlistCol(db, tenantId);
      const constraints: Parameters<typeof query>[1][] =
        filter && filter !== "all"
          ? [where("status", "==", filter), orderBy("priority", "asc")]
          : [orderBy("priority", "asc")];
      const snap = await getDocs(query(col, ...constraints));
      return snap.docs.map((d) =>
        docToEntry(d.id, d.data() as Record<string, unknown>)
      );
    },

    async getEntry(waitlistId: string, tenantId: string) {
      const snap = await getDoc(waitlistRef(db, tenantId, waitlistId));
      if (!snap.exists()) return null;
      return docToEntry(snap.id, snap.data() as Record<string, unknown>);
    },

    async notifyEntry(waitlistId: string, tenantId: string) {
      const ref = waitlistRef(db, tenantId, waitlistId);
      await updateDoc(ref, {
        status: "notified",
        notifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(ref);
      return docToEntry(snap.id, snap.data() as Record<string, unknown>);
    },

    async cancelEntry(waitlistId: string, tenantId: string, cancelledBy: string) {
      await updateDoc(waitlistRef(db, tenantId, waitlistId), {
        status: "cancelled",
        cancelledBy,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
  };
}

// ---------------------------------------------------------------------------
// WaitlistBookingRepository — Firestore adapter
// ---------------------------------------------------------------------------

export function createFirestoreWaitlistBookingRepository(
  db: Firestore
): WaitlistBookingRepository {
  return {
    async convertToBooking(input: ConvertToBookingInput): Promise<ConvertToBookingResult> {
      const bookingRef = doc(collection(db, "tenants", input.tenantId, BOOKINGS_SUBCOL));
      const bookingId = bookingRef.id;

      // Write the booking document
      await setDoc(bookingRef, {
        bookingId,
        tenantId: input.tenantId,
        staffId: input.staffId,
        locationId: input.locationId,
        serviceId: input.serviceId,
        date: input.date,
        startTime: input.startTime,
        durationMinutes: input.durationMinutes,
        notes: input.notes,
        convertedFromWaitlist: true,
        waitlistId: input.waitlistId,
        createdBy: input.convertedBy,
        createdAt: serverTimestamp(),
        status: "confirmed",
      });

      // Update waitlist entry status to booked
      await updateDoc(waitlistRef(db, input.tenantId, input.waitlistId), {
        status: "booked",
        bookingId,
        convertedBy: input.convertedBy,
        convertedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { bookingId, waitlistId: input.waitlistId };
    },
  };
}

// ---------------------------------------------------------------------------
// WaitlistPolicyRepository — Firestore adapter
// ---------------------------------------------------------------------------

export function createFirestoreWaitlistPolicyRepository(
  db: Firestore
): WaitlistPolicyRepository {
  return {
    async getPolicy(tenantId: string) {
      const snap = await getDoc(policyRef(db, tenantId));
      if (!snap.exists()) return null;
      const data = snap.data() as Record<string, unknown>;
      return {
        tenantId,
        maxWaitDays: typeof data.maxWaitDays === "number" ? data.maxWaitDays : 30,
        autoCancelAfterDays:
          typeof data.autoCancelAfterDays === "number" ? data.autoCancelAfterDays : 7,
        notifyOnOpenSlot: Boolean(data.notifyOnOpenSlot),
        notifyLeadHours: typeof data.notifyLeadHours === "number" ? data.notifyLeadHours : 24,
        requireConfirmation: Boolean(data.requireConfirmation),
        allowMultipleEntries: Boolean(data.allowMultipleEntries),
        maxEntriesPerClient:
          typeof data.maxEntriesPerClient === "number" ? data.maxEntriesPerClient : 1,
        updatedAt: toIso(data.updatedAt),
      } satisfies WaitlistPolicy;
    },

    async savePolicy(policy: WaitlistPolicy) {
      await setDoc(
        policyRef(db, policy.tenantId),
        { ...policy, updatedAt: serverTimestamp() },
        { merge: true }
      );
    },
  };
}
