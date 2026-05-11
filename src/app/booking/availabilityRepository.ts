/**
 * availabilityRepository.ts — W38-DEBT-1
 *
 * Client-side Firestore repository reading per-date availability summary docs
 * written by the `updateAvailabilitySummary` Cloud Function trigger.
 *
 * Collection read:
 *   tenants/{tenantId}/availability/{YYYY-MM-DD}
 *   { bookedCount: number; updatedAt: Timestamp }
 *
 * The `slotCount` exposed to the UI is an optimistic hint:
 *   max(0, ASSUMED_DAILY_CAPACITY - bookedCount)
 *
 * where ASSUMED_DAILY_CAPACITY = 16 (a conservative upper bound for a typical
 * salon day with 2 staff working 8-hour shifts at 30-min slots).  When a day
 * is truly full the existing `loadSlots` call returns [] anyway and the
 * CalendarGrid shows that date as disabled.
 */

import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";

/** Reasonable upper-bound: 2 staff × 8 h × 1 slot/30 min = 32; halved for safety */
const ASSUMED_DAILY_CAPACITY = 16;

export type AvailabilityHint = {
  /** Remaining-slot estimate to show on the calendar (never negative) */
  slotCount: number;
};

/**
 * Returns a Record<YYYY-MM-DD, AvailabilityHint> for every date in the given
 * calendar month that has an availability summary document.
 *
 * Dates absent from Firestore are not included; the CalendarGrid treats
 * missing entries as "unknown/unset" (no dot, selectable).
 */
export async function loadMonthAvailability(
  db: Firestore,
  tenantId: string,
  /** Any date within the desired month — only year+month are used */
  month: Date,
): Promise<Record<string, AvailabilityHint>> {
  // Build date range strings for the whole month
  const year = month.getFullYear();
  const mon = month.getMonth(); // 0-based
  const firstDay = `${year}-${String(mon + 1).padStart(2, "0")}-01`;
  // Last day of month — set day=0 of next month
  const last = new Date(year, mon + 1, 0);
  const lastDay = `${year}-${String(mon + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;

  const col = collection(db, "tenants", tenantId, "availability");
  const snap = await getDocs(
    query(
      col,
      where("date", ">=", firstDay),
      where("date", "<=", lastDay),
    ),
  );

  const result: Record<string, AvailabilityHint> = {};
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as Record<string, unknown>;
    const bookedCount = typeof data.bookedCount === "number" ? data.bookedCount : 0;
    result[docSnap.id] = {
      slotCount: Math.max(0, ASSUMED_DAILY_CAPACITY - bookedCount),
    };
  }
  return result;
}

/**
 * Hook-friendly factory: creates a stable repository object bound to `db`.
 */
export function createAvailabilityRepository(db: Firestore) {
  return {
    loadMonthAvailability: (tenantId: string, month: Date) =>
      loadMonthAvailability(db, tenantId, month),
  };
}

export type AvailabilityRepository = ReturnType<typeof createAvailabilityRepository>;
