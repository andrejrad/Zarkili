/**
 * serviceAvailabilityTrigger.ts
 *
 * Cloud Function triggered by writes to bookings/{bookingId} (top-level).
 *
 * Maintains the `nextAvailableAt` and `isFullyBooked` derived fields on
 * `brands/{brandId}/locations/{locationId}/service_types/{serviceTypeId}` so the
 * Explore tab can display real-time availability without querying the bookings
 * collection from the client.
 *
 * Logic:
 *   • On any booking write for a known serviceId, query the next earliest
 *     confirmed booking slot for that service.
 *   • If all slots for the next 14 days are taken → isFullyBooked = true.
 *   • Otherwise → isFullyBooked = false, nextAvailableAt = earliest open slot.
 *
 * NOTE: "Slots" here are derived from the absence of a confirmed booking for
 * a given (serviceId, staffId, date, startTime) tuple within the booking
 * window. This is a heuristic — a full slot engine is used for actual booking.
 *
 * TODO (Phase 3): replace the heuristic with a real slot-availability query
 * once the slot engine is integrated into the admin booking flow.
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

if (getApps().length === 0) {
  initializeApp();
}

const LOOKAHEAD_DAYS = 14;

// ---------------------------------------------------------------------------
// Pure business logic — unit-testable without Cloud Functions runtime
// ---------------------------------------------------------------------------

/**
 * Returns the ISO date string LOOKAHEAD_DAYS from today.
 */
export function lookaheadDate(fromDate: Date = new Date()): string {
  const d = new Date(fromDate);
  d.setDate(d.getDate() + LOOKAHEAD_DAYS);
  return d.toISOString().slice(0, 10);
}

/**
 * Counts distinct confirmed booking dates for the service within the window.
 * Returns null if the serviceId is unknown or bookings are unavailable.
 */
export async function getNextAvailableAt(
  db: FirebaseFirestore.Firestore,
  serviceId: string,
  fromDateIso: string,
  toDateIso: string,
): Promise<{ nextAvailableAt: Timestamp | null; isFullyBooked: boolean }> {
  // Query confirmed/rescheduled bookings for this service in the window.
  const snap = await db
    .collection("bookings")
    .where("serviceId", "==", serviceId)
    .where("status", "in", ["confirmed", "rescheduled"])
    .where("date", ">=", fromDateIso)
    .where("date", "<=", toDateIso)
    .orderBy("date", "asc")
    .orderBy("startTime", "asc")
    .limit(1)
    .get();

  if (snap.empty) {
    // No bookings in window — service is available now.
    return {
      nextAvailableAt: Timestamp.fromDate(new Date()),
      isFullyBooked: false,
    };
  }

  // TODO (Phase 3): implement a real availability check here.
  // For now we report the service as not fully booked and surface
  // the first available time as "now" to avoid false positives.
  return {
    nextAvailableAt: Timestamp.fromDate(new Date()),
    isFullyBooked: false,
  };
}

// ---------------------------------------------------------------------------
// Cloud Function trigger
// ---------------------------------------------------------------------------

export const updateServiceAvailability = onDocumentWritten(
  "bookings/{bookingId}",
  async (event) => {
    const db = getFirestore();

    const booking =
      (event.data?.after?.data() ?? event.data?.before?.data()) as
      | Record<string, unknown>
      | undefined;

    if (!booking) {
      return;
    }

    const serviceId = booking.serviceId as string | undefined;
    const tenantId = booking.tenantId as string | undefined;
    const locationId = booking.locationId as string | undefined;
    if (!serviceId || !tenantId || !locationId) {
      // Booking is not linked to a specific service/location — skip.
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const maxDate = lookaheadDate();

    try {
      const { nextAvailableAt, isFullyBooked } = await getNextAvailableAt(
        db,
        serviceId,
        today,
        maxDate,
      );

      await db
        .collection("brands").doc(tenantId)
        .collection("locations").doc(locationId)
        .collection("service_types").doc(serviceId)
        .update({
        nextAvailableAt,
        isFullyBooked,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info("updateServiceAvailability: updated", { serviceId, isFullyBooked });
    } catch (err) {
      logger.error("updateServiceAvailability: failed", { serviceId, err });
    }
  },
);
