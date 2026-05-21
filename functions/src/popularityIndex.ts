/**
 * functions/src/popularityIndex.ts (W20-DEBT-4)
 *
 * Nightly scheduled Cloud Function that computes a per-service popularity
 * score for each tenant, based on completed bookings in the last 30 days.
 *
 * Output collection:
 *   tenants/{tenantId}/popularityIndex/{serviceId}
 *   { serviceId, bookedCount, score, updatedAt }
 *
 * Score is normalised to [0, 1] where 1.0 = the most-booked service.
 *
 * Bookings are queried from:
 *   tenants/{tenantId}/bookings
 *   where status == "completed" AND createdAt >= windowStart (ISO string)
 *
 * Schedule: daily at 02:00 UTC.
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";

if (getApps().length === 0) {
  initializeApp();
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const POPULARITY_WINDOW_DAYS = 30;

// ---------------------------------------------------------------------------
// Pure business logic — unit-testable without Cloud Functions runtime
// ---------------------------------------------------------------------------

/**
 * Returns the start of the lookback window as a Date.
 */
export function getWindowStart(now: Date, windowDays: number = POPULARITY_WINDOW_DAYS): Date {
  return new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
}

/**
 * Counts completed bookings grouped by serviceId.
 * Bookings without a string serviceId are ignored.
 */
export function countBookingsByService(
  bookings: Array<{ serviceId?: unknown }>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const b of bookings) {
    if (typeof b.serviceId === "string" && b.serviceId.length > 0) {
      counts[b.serviceId] = (counts[b.serviceId] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * Normalises raw counts to [0, 1] relative to the maximum.
 * Returns an empty object when counts is empty.
 */
export function normalizeScores(
  counts: Record<string, number>,
): Record<string, number> {
  const values = Object.values(counts);
  if (values.length === 0) return {};
  const max = Math.max(...values);
  if (max === 0) return Object.fromEntries(Object.keys(counts).map((k) => [k, 0]));
  return Object.fromEntries(
    Object.entries(counts).map(([sid, count]) => [sid, count / max]),
  );
}

/**
 * Fetches recent completed bookings for one tenant, writes the per-tenant
 * popularity index docs, and also writes `popularityScore` to the
 * `brands/{tenantId}/locations/{locationId}/service_types/{serviceId}` document
 * using the full 3-factor formula:
 *   bookingCount_normalised × 0.6 + normalised_rating × 0.3 + recency_factor × 0.1
 * No-ops when there are no qualifying bookings.
 */
export async function computeTenantPopularity(
  db: FirebaseFirestore.Firestore,
  tenantId: string,
  windowStart: Date,
  now: Date = new Date(),
): Promise<void> {
  const snap = await db
    .collection("tenants")
    .doc(tenantId)
    .collection("bookings")
    .where("status", "==", "completed")
    .where("createdAt", ">=", windowStart.toISOString())
    .get();

  const bookings = snap.docs.map((d) => d.data() as { serviceId?: string; date?: string; locationId?: string });
  const counts = countBookingsByService(bookings);

  if (Object.keys(counts).length === 0) return;

  const scores = normalizeScores(counts);

  // Track last booking date and locationId per service for the recency factor
  // and v3 hierarchical path resolution.
  const lastBookingDate: Record<string, string> = {};
  const serviceLocationMap: Record<string, string> = {};
  for (const b of bookings) {
    if (typeof b.serviceId === "string") {
      if (typeof b.date === "string" && b.date > (lastBookingDate[b.serviceId] ?? "")) {
        lastBookingDate[b.serviceId] = b.date;
      }
      if (typeof b.locationId === "string" && b.locationId.length > 0 && !serviceLocationMap[b.serviceId]) {
        serviceLocationMap[b.serviceId] = b.locationId;
      }
    }
  }

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const todayStr = now.toISOString().slice(0, 10);
  const todayMs = new Date(todayStr).getTime();

  await Promise.all(
    Object.entries(counts).map(async ([serviceId, bookedCount]) => {
      const normalizedBooking = scores[serviceId] ?? 0;
      const locationId = serviceLocationMap[serviceId];

      // Fetch service doc for rating component (v3 hierarchical path).
      const svcRef = locationId
        ? db
            .collection("brands").doc(tenantId)
            .collection("locations").doc(locationId)
            .collection("service_types").doc(serviceId)
        : undefined;
      const svcSnap = svcRef ? await svcRef.get() : undefined;
      const svcData = svcSnap?.exists
        ? (svcSnap.data() as Record<string, unknown>)
        : undefined;
      const svcRating =
        (svcData?.serviceAverageRating as number | null | undefined) ??
        (svcData?.locationAverageRating as number | null | undefined) ??
        null;
      const normalizedRating = svcRating !== null ? svcRating / 5 : 0;

      // Recency factor: 1.0 = booked today, 0.0 = last booking ≥ 30 days ago.
      const lastDate = lastBookingDate[serviceId];
      let recencyFactor = 0;
      if (lastDate) {
        const daysSince = Math.min(
          30,
          Math.max(0, (todayMs - new Date(lastDate).getTime()) / MS_PER_DAY),
        );
        recencyFactor = 1 - daysSince / 30;
      }

      const popularityScore = Math.min(
        1,
        normalizedBooking * 0.6 + normalizedRating * 0.3 + recencyFactor * 0.1,
      );

      // Write per-tenant index (existing behaviour — score is booking-normalised only).
      await db
        .collection("tenants")
        .doc(tenantId)
        .collection("popularityIndex")
        .doc(serviceId)
        .set(
          {
            serviceId,
            bookedCount,
            score: normalizedBooking,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      // Write full popularity score to the service_types doc.
      if (svcRef) {
        await svcRef
          .update({
            popularityScore,
            updatedAt: FieldValue.serverTimestamp(),
          })
          .catch((err: unknown) => {
            // Non-fatal: service doc may have been deleted since the booking was created.
            logger.warn("computeTenantPopularity: skipping missing service doc", {
              serviceId,
              err,
            });
          });
      }
    }),
  );
}

export type PopularityJobResult = { processed: string[] };

/**
 * Core handler — iterates all tenants and runs the popularity computation.
 */
export async function runPopularityIndexJob(
  db: FirebaseFirestore.Firestore,
  now: Date = new Date(),
): Promise<PopularityJobResult> {
  const windowStart = getWindowStart(now);
  const tenantsSnap = await db.collection("tenants").get();

  await Promise.all(
    tenantsSnap.docs.map((tenantDoc) =>
      computeTenantPopularity(db, tenantDoc.id, windowStart, now),
    ),
  );

  return { processed: tenantsSnap.docs.map((d) => d.id) };
}

// ---------------------------------------------------------------------------
// Scheduled Cloud Function
// ---------------------------------------------------------------------------

export const computePopularityIndex = onSchedule("0 2 * * *", async () => {
  const db = getFirestore();
  const { processed } = await runPopularityIndexJob(db);
  logger.info("Popularity index job complete", { tenantCount: processed.length });
});
