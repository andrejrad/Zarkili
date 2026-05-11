/**
 * W38 — Owner KPI service.
 *
 * Reads today's and this week's booking data from Firestore for the owner
 * home dashboard.  Revenue fields are null until the charge write path
 * (W23-DEBT-1) is wired.  Occupancy is null until per-location slot capacity
 * is available (W40).
 */
import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OwnerKpiAlert = {
  id: string;
  severity: "warning" | "error";
  message: string;
  occurredAtIso: string;
};

export type OwnerKpiSummary = {
  bookingsToday: number;
  bookingsThisWeek: number;
  /** null until W23-DEBT-1 charge write path lands */
  revenueEstimatedTodayUsd: number | null;
  /** null until W23-DEBT-1 charge write path lands */
  revenueEstimatedThisWeekUsd: number | null;
  /** null until W40 per-location slot capacity is wired */
  occupancyTodayPct: number | null;
  topStaff: Array<{ staffId: string; bookingsToday: number }>;
  alerts: OwnerKpiAlert[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toIsoDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekStartStr(): string {
  const today = new Date();
  const dow = today.getDay(); // 0 = Sunday
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  return toIsoDateStr(monday);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createOwnerKpiService(db: Firestore) {
  async function getKpiSummary(tenantId: string): Promise<OwnerKpiSummary> {
    const todayStr = toIsoDateStr(new Date());
    const weekStartStr = getWeekStartStr();

    // Query all bookings for this tenant in the current week (Mon–today).
    const q = query(
      collection(db, "bookings"),
      where("tenantId", "==", tenantId),
      where("date", ">=", weekStartStr),
      where("date", "<=", todayStr),
    );

    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((d) =>
      d.data() as { date: string; status: string; staffId: string },
    );

    const todayDocs = docs.filter((d) => d.date === todayStr);
    const bookingsToday = todayDocs.length;
    const bookingsThisWeek = docs.length;

    // Aggregate per-staff counts for today to surface the top performers.
    const staffCounts = new Map<string, number>();
    for (const d of todayDocs) {
      staffCounts.set(d.staffId, (staffCounts.get(d.staffId) ?? 0) + 1);
    }
    const topStaff = Array.from(staffCounts.entries())
      .map(([staffId, count]) => ({ staffId, bookingsToday: count }))
      .sort((a, b) => b.bookingsToday - a.bookingsToday)
      .slice(0, 3);

    return {
      bookingsToday,
      bookingsThisWeek,
      revenueEstimatedTodayUsd: null,
      revenueEstimatedThisWeekUsd: null,
      occupancyTodayPct: null,
      topStaff,
      alerts: [],
    };
  }

  return { getKpiSummary };
}

export type OwnerKpiService = ReturnType<typeof createOwnerKpiService>;
