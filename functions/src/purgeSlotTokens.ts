/**
 * purgeSlotTokens.ts (KI-002)
 *
 * Daily scheduled Cloud Function that deletes booking slot tokens whose
 * reserved slot date has fully passed. Slot tokens act as Firestore-side
 * concurrency guards for booking creation; once the slot has happened, the
 * token is no longer needed and would otherwise accumulate indefinitely.
 *
 * Collection scanned : `bookingSlotTokens`
 * Token doc shape    : { tenantId, staffId, date: "YYYY-MM-DD", startMinutes, ... }
 * Cutoff             : tokens whose `date` < (today UTC − GRACE_DAYS) are deleted.
 *
 * The grace period covers tokens for late-running appointments and clock skew
 * across regions. Any reasonable value > 0 is safe; we use 1 day.
 *
 * Pure handler `runSlotTokenPurge(now, db)` accepts an injected `now` and
 * Firestore instance for unit testing without mocking the system clock.
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

if (getApps().length === 0) {
  initializeApp();
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLOT_TOKENS_COLLECTION = "bookingSlotTokens";
/** Days a slot token survives past its slot date before being purged. */
const GRACE_DAYS = 1;
/** Firestore commit limit per batch (max 500 writes). We stay below that. */
const BATCH_SIZE = 400;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns YYYY-MM-DD for the cutoff: tokens with `date < cutoffDate` are deleted.
 * Computed in UTC so it matches the canonical date string used by the bookings
 * domain (which always normalises to UTC date).
 */
export function computeCutoffDate(now: Date, graceDays = GRACE_DAYS): string {
  const cutoff = new Date(now.getTime());
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - graceDays);
  const yyyy = cutoff.getUTCFullYear();
  const mm = String(cutoff.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(cutoff.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// Pure handler
// ---------------------------------------------------------------------------

export type PurgeResult = {
  scanned: number;
  deleted: number;
  cutoff: string;
};

/**
 * Scans `bookingSlotTokens` for tokens whose `date` is strictly less than the
 * cutoff (today UTC − GRACE_DAYS) and deletes them in batches.
 */
export async function runSlotTokenPurge(
  now: Date,
  db: Firestore,
): Promise<PurgeResult> {
  const cutoff = computeCutoffDate(now);

  const snap = await db
    .collection(SLOT_TOKENS_COLLECTION)
    .where("date", "<", cutoff)
    .get();

  if (snap.empty) {
    return { scanned: 0, deleted: 0, cutoff };
  }

  let deleted = 0;
  let batch = db.batch();
  let inBatch = 0;

  for (const docSnap of snap.docs) {
    batch.delete(docSnap.ref);
    inBatch++;
    if (inBatch >= BATCH_SIZE) {
      await batch.commit();
      deleted += inBatch;
      batch = db.batch();
      inBatch = 0;
    }
  }
  if (inBatch > 0) {
    await batch.commit();
    deleted += inBatch;
  }

  return { scanned: snap.size, deleted, cutoff };
}

// ---------------------------------------------------------------------------
// Cloud Function export — runs daily at 02:30 UTC (after dailyBookingReminders)
// ---------------------------------------------------------------------------

export const purgeExpiredSlotTokens = onSchedule(
  { schedule: "30 2 * * *", timeZone: "UTC" },
  async () => {
    const db = getFirestore();
    const result = await runSlotTokenPurge(new Date(), db);
    console.info("[purgeExpiredSlotTokens] purge complete", result);
  },
);
