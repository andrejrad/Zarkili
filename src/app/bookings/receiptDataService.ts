/**
 * receiptDataService.ts — W38-DEBT-3
 *
 * Orchestrates the multi-step Firestore read needed to build a ReceiptScreen's
 * props from a bookingId:
 *
 *   1. Query tenants/{tenantId}/charges where bookingId == x AND userId == x
 *   2. Get the booking doc (bookings/{bookingId}) for serviceId + locationId + date
 *   3. Get the service doc (services/{serviceId}) for name + price
 *   4. Get the location doc (locations/{locationId}) for salonName + address
 *   5. Get the payment method (clients/{userId}/paymentMethods/{paymentMethodId})
 *      for brand + last4
 *
 * Returns null if no charge exists yet (booking not yet paid).
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

export type ReceiptData = {
  chargeId: string;
  bookingId: string;
  /** Salon / location name shown at the top of the receipt. */
  salonName: string;
  /** One-line address string, e.g. "123 Main St, San Francisco, CA 94105". */
  salonAddress: string;
  /** ISO 8601 timestamp of when the charge was captured. */
  occurredAtIso: string;
  serviceName: string;
  /** In USD (not minor currency units). */
  subtotalUsd: number;
  taxUsd: number;
  tipUsd: number;
  totalUsd: number;
  currency: string;
  /** Human-readable label, e.g. "Visa ending 4242". */
  paymentMethodLabel: string;
};

export type GetReceiptResult =
  | { ok: true; data: ReceiptData }
  | { ok: false; code: "NOT_FOUND" | "ERROR"; message: string };

// ---------------------------------------------------------------------------
// Internal document shapes (only the fields we consume)
// ---------------------------------------------------------------------------

type ChargeDoc = {
  chargeId: string;
  tenantId: string;
  bookingId: string;
  userId: string;
  paymentMethodId: string;
  status: string;
  amount: {
    subtotalMinor: number;
    discountMinor: number;
    tipMinor: number;
    taxMinor: number;
    totalMinor: number;
    currency: string;
  };
  createdAt?: { toDate?: () => Date; seconds?: number } | null;
};

type BookingDoc = {
  serviceId: string;
  locationId: string;
  date: string;
  startTime: string;
};

type ServiceDoc = {
  name: string;
  price?: number;
};

type LocationDoc = {
  name: string;
  address?: {
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
};

type PaymentMethodDoc = {
  brand?: string;
  last4?: string;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createReceiptDataService(db: Firestore) {
  /**
   * Loads all data required to render a ReceiptScreen for a given booking.
   * Returns { ok: false, code: "NOT_FOUND" } if no charge exists yet.
   */
  async function getReceiptByBookingId(
    tenantId: string,
    bookingId: string,
    userId: string,
  ): Promise<GetReceiptResult> {
    if (!tenantId || !bookingId || !userId) {
      return { ok: false, code: "ERROR", message: "tenantId, bookingId, and userId are required" };
    }

    try {
      // 1. Find the charge for this booking+user combination.
      const chargesRef = collection(db, "tenants", tenantId, "charges");
      const chargesQuery = query(
        chargesRef,
        where("bookingId", "==", bookingId),
        where("userId", "==", userId),
      );
      const chargesSnap = await getDocs(chargesQuery);

      if (chargesSnap.empty) {
        return { ok: false, code: "NOT_FOUND", message: "No charge found for this booking." };
      }

      const chargeDoc = chargesSnap.docs[0].data() as ChargeDoc;
      const { amount, paymentMethodId } = chargeDoc;

      // Derive ISO timestamp from createdAt (Firestore Timestamp or epoch).
      let occurredAtIso: string;
      if (chargeDoc.createdAt && typeof chargeDoc.createdAt.toDate === "function") {
        occurredAtIso = chargeDoc.createdAt.toDate!().toISOString();
      } else if (chargeDoc.createdAt && chargeDoc.createdAt.seconds) {
        occurredAtIso = new Date(chargeDoc.createdAt.seconds * 1000).toISOString();
      } else {
        occurredAtIso = new Date().toISOString();
      }

      // 2. Get the booking doc for serviceId / locationId.
      const bookingSnap = await getDoc(doc(db, "bookings", bookingId));
      const booking: BookingDoc = bookingSnap.exists()
        ? (bookingSnap.data() as BookingDoc)
        : { serviceId: "", locationId: "", date: "", startTime: "" };

      // 3. Get the service name.
      let serviceName = "Service";
      if (booking.serviceId && booking.locationId) {
        const serviceSnap = await getDoc(
          doc(db, ...serviceTypeDocSegments(tenantId, booking.locationId, booking.serviceId)),
        );
        if (serviceSnap.exists()) {
          serviceName = (serviceSnap.data() as ServiceDoc).name ?? "Service";
        }
      }

      // 4. Get the location name + address.
      let salonName = "Salon";
      let salonAddress = "";
      if (booking.locationId) {
        const locationSnap = await getDoc(doc(db, "locations", booking.locationId));
        if (locationSnap.exists()) {
          const loc = locationSnap.data() as LocationDoc;
          salonName = loc.name ?? "Salon";
          if (loc.address) {
            const a = loc.address;
            const parts = [a.line1, a.city, a.postalCode].filter(Boolean);
            salonAddress = parts.join(", ");
          }
        }
      }

      // 5. Get the payment method label.
      let paymentMethodLabel = "Card on file";
      if (paymentMethodId) {
        const pmSnap = await getDoc(
          doc(db, "clients", userId, "paymentMethods", paymentMethodId),
        );
        if (pmSnap.exists()) {
          const pm = pmSnap.data() as PaymentMethodDoc;
          const brand = pm.brand
            ? pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)
            : "Card";
          paymentMethodLabel = pm.last4
            ? `${brand} ending ${pm.last4}`
            : brand;
        }
      }

      // 6. Compose receipt data (convert minor units → USD).
      const subtotalUsd = (amount.subtotalMinor ?? 0) / 100;
      const taxUsd = (amount.taxMinor ?? 0) / 100;
      const tipUsd = (amount.tipMinor ?? 0) / 100;
      const totalUsd = (amount.totalMinor ?? 0) / 100;

      const data: ReceiptData = {
        chargeId: chargeDoc.chargeId,
        bookingId,
        salonName,
        salonAddress,
        occurredAtIso,
        serviceName,
        subtotalUsd,
        taxUsd,
        tipUsd,
        totalUsd,
        currency: amount.currency ?? "usd",
        paymentMethodLabel,
      };

      return { ok: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load receipt.";
      return { ok: false, code: "ERROR", message };
    }
  }

  return { getReceiptByBookingId };
}

export type ReceiptDataService = ReturnType<typeof createReceiptDataService>;
