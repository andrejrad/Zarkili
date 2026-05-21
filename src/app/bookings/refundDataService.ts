/**
 * refundDataService.ts — W38-DEBT-4
 *
 * Orchestrates the multi-step Firestore read needed to build a RefundStatusScreen's
 * props from a bookingId:
 *
 *   1. Query tenants/{tenantId}/refunds where bookingId == x AND userId == x
 *   2. Get the booking doc (bookings/{bookingId}) for serviceId + locationId + date + startTime
 *   3. Get the service doc (services/{serviceId}) for name
 *   4. Get the location doc (locations/{locationId}) for salonName
 *
 * Returns NOT_FOUND if no refund has been requested for this booking yet.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";

import { serviceTypeDocSegments } from "../../domains/services/paths";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RefundData = {
  refundId: string;
  status: "pending" | "issued" | "denied";
  /** Total refund amount in USD (converted from minor units). */
  amountUsd: number;
  salonName: string;
  serviceName: string;
  /** ISO 8601 timestamp of the booking start. */
  startsAtIso: string;
  /** ISO 8601 timestamp when the refund was requested. */
  requestedAtIso: string;
  /** ISO 8601 timestamp when the refund was processed (issued or denied). */
  processedAtIso?: string;
  /** Stripe failure code if the refund was denied. */
  failureCode?: string;
};

export type GetRefundResult =
  | { ok: true; data: RefundData }
  | { ok: false; code: "NOT_FOUND" | "ERROR"; message: string };

// ---------------------------------------------------------------------------
// Internal document shapes
// ---------------------------------------------------------------------------

type RefundDoc = {
  refundId: string;
  bookingId: string;
  userId: string;
  amountMinor: number;
  currency: string;
  status: "pending" | "issued" | "denied";
  requestedAt?: { toDate?: () => Date; seconds?: number } | null;
  processedAt?: { toDate?: () => Date; seconds?: number } | null;
  failureCode?: string | null;
};

type BookingDoc = {
  serviceId: string;
  locationId: string;
  date: string;
  startTime: string;
};

type ServiceDoc = { name?: string };
type LocationDoc = { name?: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toIso(ts: { toDate?: () => Date; seconds?: number } | null | undefined): string | undefined {
  if (!ts) return undefined;
  if (typeof ts.toDate === "function") return ts.toDate!().toISOString();
  if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000).toISOString();
  return undefined;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createRefundDataService(db: Firestore) {
  /**
   * Loads refund + related booking data for a RefundStatusScreen.
   * Returns { ok: false, code: "NOT_FOUND" } if no refund exists yet.
   */
  async function getRefundByBookingId(
    tenantId: string,
    bookingId: string,
    userId: string,
  ): Promise<GetRefundResult> {
    if (!tenantId || !bookingId || !userId) {
      return { ok: false, code: "ERROR", message: "tenantId, bookingId, and userId are required" };
    }

    try {
      // 1. Find the refund doc for this booking+user.
      const refundsRef = collection(db, "tenants", tenantId, "refunds");
      const refundsQuery = query(
        refundsRef,
        where("bookingId", "==", bookingId),
        where("userId", "==", userId),
      );
      const refundsSnap = await getDocs(refundsQuery);

      if (refundsSnap.empty) {
        return { ok: false, code: "NOT_FOUND", message: "No refund found for this booking." };
      }

      const refundDoc = refundsSnap.docs[0].data() as RefundDoc;

      // 2. Booking doc for serviceId / locationId / date / startTime.
      const bookingSnap = await getDoc(doc(db, "bookings", bookingId));
      const booking: BookingDoc = bookingSnap.exists()
        ? (bookingSnap.data() as BookingDoc)
        : { serviceId: "", locationId: "", date: "", startTime: "" };

      // 3. Service name.
      let serviceName = "Service";
      if (booking.serviceId && booking.locationId) {
        const serviceSnap = await getDoc(
          doc(db, ...serviceTypeDocSegments(tenantId, booking.locationId, booking.serviceId)),
        );
        if (serviceSnap.exists()) {
          serviceName = (serviceSnap.data() as ServiceDoc).name ?? "Service";
        }
      }

      // 4. Location / salon name.
      let salonName = "Salon";
      if (booking.locationId) {
        const locationSnap = await getDoc(doc(db, "locations", booking.locationId));
        if (locationSnap.exists()) {
          salonName = (locationSnap.data() as LocationDoc).name ?? "Salon";
        }
      }

      // Build ISO timestamp for booking starts-at.
      const startsAtIso =
        booking.date && booking.startTime
          ? `${booking.date}T${booking.startTime}:00Z`
          : new Date().toISOString();

      const requestedAtIso = toIso(refundDoc.requestedAt) ?? new Date().toISOString();
      const processedAtIso = toIso(refundDoc.processedAt);

      const data: RefundData = {
        refundId: refundDoc.refundId,
        status: refundDoc.status,
        amountUsd: (refundDoc.amountMinor ?? 0) / 100,
        salonName,
        serviceName,
        startsAtIso,
        requestedAtIso,
        processedAtIso,
        failureCode: refundDoc.failureCode ?? undefined,
      };

      return { ok: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load refund.";
      return { ok: false, code: "ERROR", message };
    }
  }

  return { getRefundByBookingId };
}

export type RefundDataService = ReturnType<typeof createRefundDataService>;
