/**
 * adminBookingQueueService.ts
 *
 * Orchestrates the admin booking queue:
 *
 *   • loadQueue     — list bookings for a given queue tab, with optional filters
 *   • confirmBooking — confirm a pending booking
 *   • rejectBooking  — reject a pending booking (requires reason)
 *   • cancelBooking  — cancel any open booking (requires reason)
 *
 * All write actions execute as "location_manager" actor role, the most common
 * role for day-to-day admin operations.  Callers may override via actorRole.
 */

import type { Booking, BookingActorRole, BookingStatus } from "../../domains/bookings/model";
import type { BookingsRepository } from "../../domains/bookings/repository";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Three tabs shown in the admin queue.
 *
 * - pending              → new bookings awaiting acceptance
 * - reschedule_pending   → client-requested reschedules awaiting decision
 * - exceptions           → reschedule_rejected that still need resolution
 */
export type AdminBookingQueueTab = "pending" | "reschedule_pending" | "exceptions";

export type AdminBookingQueueFilters = {
  locationId?: string;
  date?: string;
};

export type AdminQueueResult =
  | { ok: true; bookings: Booking[] }
  | { ok: false; message: string };

export type AdminActionResult =
  | { ok: true }
  | { ok: false; message: string };

// ---------------------------------------------------------------------------
// Status mapping for each tab
// ---------------------------------------------------------------------------

const TAB_STATUSES: Record<AdminBookingQueueTab, BookingStatus[]> = {
  pending: ["pending"],
  reschedule_pending: ["reschedule_pending"],
  exceptions: ["reschedule_rejected"],
};

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    const lower = err.message.toLowerCase();
    if (lower.includes("not found")) return "Booking not found.";
    if (lower.includes("stale_write")) return "This booking was updated by someone else. Please refresh.";
    if (lower.includes("scope_mismatch")) return "You do not have permission to modify this booking.";
    return err.message;
  }
  return "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createAdminBookingQueueService(bookingsRepository: BookingsRepository) {
  /**
   * Loads the booking queue for the given tab, applying optional location and
   * date filters.  Bookings are sorted by date ascending, then by startMinutes
   * ascending so the earliest appointments appear at the top.
   */
  async function loadQueue(
    tenantId: string,
    tab: AdminBookingQueueTab,
    filters: AdminBookingQueueFilters = {},
  ): Promise<AdminQueueResult> {
    try {
      const statuses = TAB_STATUSES[tab];
      const bookings = await bookingsRepository.listBookingsByStatus(tenantId, statuses, {
        locationId: filters.locationId,
        date: filters.date,
      });

      const sorted = bookings.slice().sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return a.startMinutes - b.startMinutes;
      });

      return { ok: true, bookings: sorted };
    } catch (err) {
      return { ok: false, message: errorMessage(err) };
    }
  }

  async function confirmBooking(
    bookingId: string,
    tenantId: string,
    actorRole: BookingActorRole = "location_manager",
  ): Promise<AdminActionResult> {
    try {
      await bookingsRepository.confirmBooking(bookingId, tenantId, actorRole);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: errorMessage(err) };
    }
  }

  async function rejectBooking(
    bookingId: string,
    tenantId: string,
    reason: string,
    actorRole: BookingActorRole = "location_manager",
  ): Promise<AdminActionResult> {
    try {
      await bookingsRepository.rejectBooking(bookingId, tenantId, actorRole, reason);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: errorMessage(err) };
    }
  }

  async function cancelBooking(
    bookingId: string,
    tenantId: string,
    reason: string,
    actorRole: BookingActorRole = "location_manager",
  ): Promise<AdminActionResult> {
    try {
      await bookingsRepository.cancelBooking(bookingId, tenantId, actorRole, reason);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: errorMessage(err) };
    }
  }

  return {
    loadQueue,
    confirmBooking,
    rejectBooking,
    cancelBooking,
  };
}

export type AdminBookingQueueService = ReturnType<typeof createAdminBookingQueueService>;
