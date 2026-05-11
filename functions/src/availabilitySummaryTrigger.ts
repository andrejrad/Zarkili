/**
 * availabilitySummaryTrigger.ts — W38-DEBT-1
 *
 * Cloud Function that maintains per-date booking-count summary documents so
 * the BookingDateTimeScreen calendar can show availability hints (dots) without
 * querying the full bookings collection on the client.
 *
 * Collection written:
 *   tenants/{tenantId}/availability/{YYYY-MM-DD}
 *   { bookedCount: number; updatedAt: Firestore.Timestamp }
 *
 * Design:
 *   • Triggered by any write to tenants/{tenantId}/bookings/{bookingId}.
 *   • Reads the booking's date field from the post-write snapshot (or pre-write
 *     if the document was deleted).
 *   • Counts all documents in tenants/{tenantId}/bookings with
 *     status == "confirmed" AND date == <target_date>.
 *   • Writes (merges) the count to the availability summary document.
 *
 * The client availability repository reads these docs and returns a
 * `slotCount` hint = max(0, ASSUMED_DAILY_CAPACITY - bookedCount).  The
 * constant `ASSUMED_DAILY_CAPACITY` is a generous upper-bound (20); once a
 * date fills up the slot engine returns [] anyway and the date is visually
 * disabled independently of this hint collection.
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

if (getApps().length === 0) {
  initializeApp();
}

const CONFIRMED_STATUSES = ["confirmed", "rescheduled"] as const;

// ---------------------------------------------------------------------------
// Pure business logic — unit-testable without Cloud Functions runtime
// ---------------------------------------------------------------------------

/**
 * Returns total confirmed bookings for a specific tenant + date.
 */
export async function countConfirmedBookings(
  db: FirebaseFirestore.Firestore,
  tenantId: string,
  date: string, // YYYY-MM-DD
): Promise<number> {
  const snap = await db
    .collection("tenants")
    .doc(tenantId)
    .collection("bookings")
    .where("date", "==", date)
    .where("status", "in", CONFIRMED_STATUSES)
    .get();
  return snap.size;
}

/**
 * Updates (or creates) the availability summary doc for tenantId + date.
 */
export async function writeAvailabilitySummary(
  db: FirebaseFirestore.Firestore,
  tenantId: string,
  date: string, // YYYY-MM-DD
): Promise<void> {
  const bookedCount = await countConfirmedBookings(db, tenantId, date);
  const ref = db
    .collection("tenants")
    .doc(tenantId)
    .collection("availability")
    .doc(date);
  await ref.set(
    {
      date,
      tenantId,
      bookedCount,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Extracts tenantId + date from the affected booking snapshot(s).
 * Returns null on any parse failure (trigger then no-ops safely).
 */
export function extractBookingDateInfo(
  before: FirebaseFirestore.DocumentData | undefined,
  after: FirebaseFirestore.DocumentData | undefined,
): { tenantId: string; date: string } | null {
  const data = after ?? before;
  if (!data) return null;
  const tenantId = typeof data.tenantId === "string" ? data.tenantId : null;
  const date = typeof data.date === "string" ? data.date : null;
  if (!tenantId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return { tenantId, date };
}

// ---------------------------------------------------------------------------
// Cloud Function export
// ---------------------------------------------------------------------------

export const updateAvailabilitySummary = onDocumentWritten(
  "tenants/{tenantId}/bookings/{bookingId}",
  async (event) => {
    const db = getFirestore();
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    const info = extractBookingDateInfo(before, after);
    if (!info) return;

    // If the booking date changed (reschedule), update BOTH the old and new date
    const dates = new Set<string>();
    dates.add(info.date);

    if (
      before &&
      typeof before.date === "string" &&
      before.date !== info.date
    ) {
      dates.add(before.date as string);
    }

    const tenantId = info.tenantId;
    // Handles edge case where tenantId changes (should not happen but be safe)
    const oldTenantId =
      before && typeof before.tenantId === "string" ? before.tenantId : tenantId;

    for (const date of dates) {
      const tid = date === info.date ? tenantId : oldTenantId;
      await writeAvailabilitySummary(db, tid, date);
    }
  },
);
