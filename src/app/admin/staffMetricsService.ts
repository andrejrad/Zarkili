/**
 * W46 — staffMetricsService (clears W41-DEBT-3)
 *
 * Factory for per-staff performance metrics.  The service queries a
 * materialized `staffMetrics/{tenantId}/staff/{staffId}` document that is
 * kept up to date by a background aggregation job.  When the materialized
 * doc is absent the service falls back to a sparse on-demand count against
 * the bookings collection.
 *
 * Pattern mirrors all other admin service factories:
 *   • Optional repo port injections.
 *   • Absent repo → { ok: false, message: "… not configured." }
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

import type { StaffPerformanceSummary } from "./StaffPerformanceScreen";

// ---------------------------------------------------------------------------
// Repository ports
// ---------------------------------------------------------------------------

export type StaffMetricsRepository = {
  getSummary(
    staffId: string,
    tenantId: string,
    periodDays: number,
  ): Promise<StaffPerformanceSummary | null>;
};

export type BookingHistoryRepository = {
  countByStatus(
    staffId: string,
    tenantId: string,
    fromDate: string,
    toDate: string,
  ): Promise<{
    completed: number;
    cancelled: number;
    noShow: number;
    avgRating: number | null;
    revenueEstimatedCents: number | null;
  }>;
};

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

function fmtError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "An unexpected error occurred.";
}

type StaffMetricsResult<T> = { ok: true; data: T } | { ok: false; message: string };

// ---------------------------------------------------------------------------
// Firestore adapter factories (can be used directly in production)
// ---------------------------------------------------------------------------

export function createStaffMetricsFirestoreAdapter(db: Firestore): StaffMetricsRepository {
  return {
    async getSummary(staffId, tenantId, _periodDays) {
      const snap = await getDoc(
        doc(db, "staffMetrics", tenantId, "staff", staffId),
      );
      if (!snap.exists()) return null;
      return snap.data() as StaffPerformanceSummary;
    },
  };
}

export function createBookingHistoryFirestoreAdapter(db: Firestore): BookingHistoryRepository {
  return {
    async countByStatus(staffId, tenantId, fromDate, toDate) {
      const q = query(
        collection(db, "tenants", tenantId, "bookings"),
        where("staffId", "==", staffId),
        where("date", ">=", fromDate),
        where("date", "<=", toDate),
      );
      const snap = await getDocs(q);
      let completed = 0;
      let cancelled = 0;
      let noShow = 0;
      let totalRevenue = 0;

      for (const d of snap.docs) {
        const b = d.data() as { status: string; priceCents?: number };
        if (b.status === "completed") {
          completed++;
          totalRevenue += b.priceCents ?? 0;
        } else if (b.status === "cancelled") {
          cancelled++;
        } else if (b.status === "no_show") {
          noShow++;
        }
      }

      return {
        completed,
        cancelled,
        noShow,
        avgRating: null,   // ratings stored separately; P2 enrichment
        revenueEstimatedCents: totalRevenue > 0 ? totalRevenue : null,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

export function createStaffMetricsService(
  metricsRepo?: StaffMetricsRepository,
  bookingHistoryRepo?: BookingHistoryRepository,
) {
  function periodDates(days: number): { fromDate: string; toDate: string } {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      fromDate: from.toISOString().split("T")[0]!,
      toDate: to.toISOString().split("T")[0]!,
    };
  }

  async function loadStaffMetrics(
    staffId: string,
    tenantId: string,
    periodDays = 30,
  ): Promise<StaffMetricsResult<StaffPerformanceSummary>> {
    if (!metricsRepo && !bookingHistoryRepo) {
      return { ok: false, message: "Staff metrics repository not configured." };
    }

    try {
      // Prefer the materialized summary doc — much cheaper query.
      if (metricsRepo) {
        const cached = await metricsRepo.getSummary(staffId, tenantId, periodDays);
        if (cached) return { ok: true, data: cached };
      }

      // Fall back to on-demand booking history count.
      if (bookingHistoryRepo) {
        const { fromDate, toDate } = periodDates(periodDays);
        const counts = await bookingHistoryRepo.countByStatus(
          staffId,
          tenantId,
          fromDate,
          toDate,
        );
        return {
          ok: true,
          data: {
            bookingsCompleted: counts.completed,
            bookingsCancelled: counts.cancelled,
            bookingsNoShow: counts.noShow,
            averageRating: counts.avgRating,
            revenueEstimatedCents: counts.revenueEstimatedCents,
          },
        };
      }

      return { ok: false, message: "Staff metrics repository not configured." };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  return { loadStaffMetrics };
}

export type StaffMetricsService = ReturnType<typeof createStaffMetricsService>;
