/**
 * W43 — bookingOpsService
 *
 * Factory for admin booking-operations surfaces: master calendar queries,
 * manual / force booking creation, block-time management, no-show marking,
 * admin cancellation with fee, and admin reschedule on behalf of a client.
 *
 * Pattern (mirrors serviceCatalogService):
 *   • All repository-backed methods accept optional port injections.
 *   • When a repo is absent the method returns { ok: false, message: "… not configured." }.
 *   • Real Firestore adapters ship in W43's Wed–Fri pass (W43-DEBT-1).
 *   • The mock harness used during Mon–Tue prototype gate is provided by
 *     the test caller via injected mock repos — it is not hardcoded here.
 */

import type { Booking } from "../../domains/bookings/model";
import type {
  AdminBookingDetailView,
  AdminCancellationInput,
  BlockedSlot,
  BookingOpsResult,
  CalendarBookingEntry,
  CalendarDayView,
  CalendarStaffColumn,
  ConflictResolutionOption,
  CreateBlockedSlotInput,
  ForceBookInput,
  ManualBookingInput,
  NoShowInput,
  RescheduleAdminInput,
  SlotConflict,
} from "../../domains/bookings/bookingOpsModel";

// ---------------------------------------------------------------------------
// Repository ports (minimal shapes — real adapters ship W43 Wed–Fri pass)
// ---------------------------------------------------------------------------

export type BookingOpsCalendarRepository = {
  listByLocationAndDate(
    tenantId: string,
    locationId: string,
    date: string,
  ): Promise<
    Array<{
      booking: Booking;
      staffName: string;
      serviceName: string;
      customerName: string;
    }>
  >;
};

export type BlockedSlotRepository = {
  createBlockedSlot(input: CreateBlockedSlotInput): Promise<BlockedSlot>;
  deleteBlockedSlot(slotId: string, tenantId: string): Promise<void>;
  listBlockedSlots(
    tenantId: string,
    locationId: string,
    date: string,
  ): Promise<BlockedSlot[]>;
};

export type ManualBookingRepository = {
  createManual(input: ManualBookingInput): Promise<Booking>;
  forceCreate(input: ForceBookInput): Promise<Booking>;
};

export type BookingDetailRepository = {
  getDetailView(
    bookingId: string,
    tenantId: string,
  ): Promise<AdminBookingDetailView | null>;
};

export type BookingWriteRepository = {
  markNoShow(input: NoShowInput): Promise<Booking>;
  adminCancel(input: AdminCancellationInput): Promise<Booking>;
  adminReschedule(input: RescheduleAdminInput): Promise<Booking>;
};

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

function fmtError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createBookingOpsService(
  calendarRepo?: BookingOpsCalendarRepository,
  blockedSlotRepo?: BlockedSlotRepository,
  manualBookingRepo?: ManualBookingRepository,
  detailRepo?: BookingDetailRepository,
  writeRepo?: BookingWriteRepository,
) {
  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /** Assemble a CalendarDayView from raw enriched rows */
  function buildDayView(
    date: string,
    rows: Array<{
      booking: Booking;
      staffName: string;
      serviceName: string;
      customerName: string;
    }>,
  ): CalendarDayView {
    const columnMap = new Map<string, CalendarStaffColumn>();
    for (const { booking: b, staffName, serviceName, customerName } of rows) {
      if (!columnMap.has(b.staffId)) {
        columnMap.set(b.staffId, { staffId: b.staffId, staffName, entries: [] });
      }
      const entry: CalendarBookingEntry = {
        bookingId: b.bookingId,
        staffId: b.staffId,
        staffName,
        serviceId: b.serviceId,
        serviceName,
        customerName,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        startMinutes: b.startMinutes,
        endMinutes: b.endMinutes,
        durationMinutes: b.durationMinutes,
        status: b.status,
      };
      columnMap.get(b.staffId)!.entries.push(entry);
    }
    return { date, columns: Array.from(columnMap.values()) };
  }

  // -------------------------------------------------------------------------
  // Calendar
  // -------------------------------------------------------------------------

  /** Load the master calendar for a given location on a given date. */
  async function loadCalendarDay(
    tenantId: string,
    locationId: string,
    date: string,
  ): Promise<BookingOpsResult<CalendarDayView>> {
    if (!calendarRepo) {
      return { ok: false, message: "Calendar repository not configured." };
    }
    try {
      const rows = await calendarRepo.listByLocationAndDate(tenantId, locationId, date);
      return { ok: true, data: buildDayView(date, rows) };
    } catch (e) {
      return { ok: false, message: fmtError(e) };
    }
  }

  // -------------------------------------------------------------------------
  // Blocked slots
  // -------------------------------------------------------------------------

  /** List all blocked slots for a location on a given date. */
  async function loadBlockedSlots(
    tenantId: string,
    locationId: string,
    date: string,
  ): Promise<BookingOpsResult<BlockedSlot[]>> {
    if (!blockedSlotRepo) {
      return { ok: false, message: "Blocked slot repository not configured." };
    }
    try {
      const slots = await blockedSlotRepo.listBlockedSlots(tenantId, locationId, date);
      return { ok: true, data: slots };
    } catch (e) {
      return { ok: false, message: fmtError(e) };
    }
  }

  /** Block a time slot (hold) for a staff member. */
  async function blockTimeSlot(
    input: CreateBlockedSlotInput,
  ): Promise<BookingOpsResult<BlockedSlot>> {
    if (!blockedSlotRepo) {
      return { ok: false, message: "Blocked slot repository not configured." };
    }
    if (!input.reason.trim()) {
      return { ok: false, message: "Block reason is required." };
    }
    if (!input.startTime.trim() || !input.endTime.trim()) {
      return { ok: false, message: "Start time and end time are required." };
    }
    try {
      const slot = await blockedSlotRepo.createBlockedSlot(input);
      return { ok: true, data: slot };
    } catch (e) {
      return { ok: false, message: fmtError(e) };
    }
  }

  /** Remove a previously created blocked slot. */
  async function unblockTimeSlot(
    slotId: string,
    tenantId: string,
  ): Promise<BookingOpsResult<void>> {
    if (!blockedSlotRepo) {
      return { ok: false, message: "Blocked slot repository not configured." };
    }
    try {
      await blockedSlotRepo.deleteBlockedSlot(slotId, tenantId);
      return { ok: true, data: undefined };
    } catch (e) {
      return { ok: false, message: fmtError(e) };
    }
  }

  // -------------------------------------------------------------------------
  // Manual / force booking creation
  // -------------------------------------------------------------------------

  /** Create a phone-in or walk-in booking on behalf of a customer. */
  async function createManualBooking(
    input: ManualBookingInput,
  ): Promise<BookingOpsResult<Booking>> {
    if (!manualBookingRepo) {
      return { ok: false, message: "Manual booking repository not configured." };
    }
    if (!input.customerName.trim()) {
      return { ok: false, message: "Customer name is required." };
    }
    if (!input.staffId.trim()) {
      return { ok: false, message: "Staff member is required." };
    }
    if (!input.serviceId.trim()) {
      return { ok: false, message: "Service is required." };
    }
    if (!input.date.trim()) {
      return { ok: false, message: "Date is required." };
    }
    try {
      const booking = await manualBookingRepo.createManual(input);
      return { ok: true, data: booking };
    } catch (e) {
      return { ok: false, message: fmtError(e) };
    }
  }

  /**
   * Force-create a booking overriding any slot conflicts.
   * Requires a non-empty override reason (surfaces in audit trail).
   */
  async function forceCreateBooking(
    input: ForceBookInput,
  ): Promise<BookingOpsResult<Booking>> {
    if (!manualBookingRepo) {
      return { ok: false, message: "Force booking repository not configured." };
    }
    if (!input.overrideReason.trim()) {
      return { ok: false, message: "Override reason is required for force-booking." };
    }
    if (!input.overriddenBy.trim()) {
      return { ok: false, message: "Authorising user ID is required for force-booking." };
    }
    try {
      const booking = await manualBookingRepo.forceCreate(input);
      return { ok: true, data: booking };
    } catch (e) {
      return { ok: false, message: fmtError(e) };
    }
  }

  // -------------------------------------------------------------------------
  // Booking detail
  // -------------------------------------------------------------------------

  /** Load the admin-enriched booking detail view (booking + customer + audit). */
  async function loadBookingDetail(
    bookingId: string,
    tenantId: string,
  ): Promise<BookingOpsResult<AdminBookingDetailView>> {
    if (!detailRepo) {
      return { ok: false, message: "Booking detail repository not configured." };
    }
    try {
      const view = await detailRepo.getDetailView(bookingId, tenantId);
      if (!view) return { ok: false, message: "Booking not found." };
      return { ok: true, data: view };
    } catch (e) {
      return { ok: false, message: fmtError(e) };
    }
  }

  // -------------------------------------------------------------------------
  // Status writes
  // -------------------------------------------------------------------------

  /** Mark a booking as no-show with optional policy note and penalty flag. */
  async function markNoShow(input: NoShowInput): Promise<BookingOpsResult<Booking>> {
    if (!writeRepo) {
      return { ok: false, message: "Booking write repository not configured." };
    }
    try {
      const booking = await writeRepo.markNoShow(input);
      return { ok: true, data: booking };
    } catch (e) {
      return { ok: false, message: fmtError(e) };
    }
  }

  /**
   * Admin-cancel a booking with a required reason and optional cancellation fee.
   * Validates reason is non-empty before calling the repo.
   */
  async function adminCancel(
    input: AdminCancellationInput,
  ): Promise<BookingOpsResult<Booking>> {
    if (!writeRepo) {
      return { ok: false, message: "Booking write repository not configured." };
    }
    if (!input.reason.trim()) {
      return { ok: false, message: "Cancellation reason is required." };
    }
    try {
      const booking = await writeRepo.adminCancel(input);
      return { ok: true, data: booking };
    } catch (e) {
      return { ok: false, message: fmtError(e) };
    }
  }

  /**
   * Admin-reschedule a booking on behalf of a client.
   * Validates new date/time fields before calling the repo.
   */
  async function adminReschedule(
    input: RescheduleAdminInput,
  ): Promise<BookingOpsResult<Booking>> {
    if (!writeRepo) {
      return { ok: false, message: "Booking write repository not configured." };
    }
    if (!input.newDate.trim()) {
      return { ok: false, message: "New date is required." };
    }
    if (!input.newStartTime.trim() || !input.newEndTime.trim()) {
      return { ok: false, message: "New start and end times are required." };
    }
    try {
      const booking = await writeRepo.adminReschedule(input);
      return { ok: true, data: booking };
    } catch (e) {
      return { ok: false, message: fmtError(e) };
    }
  }

  // -------------------------------------------------------------------------
  // Conflict resolution (pure — no repo call)
  // -------------------------------------------------------------------------

  /**
   * Build the ordered list of conflict-resolution options for a proposed drag
   * or reschedule where one or more existing bookings clash.
   *
   * Pure computation only — no repo call required.
   * nextAvailableDate / Start / End are optional hints from the slot-engine;
   * when provided an "offer next slot" option is appended.
   */
  function buildConflictResolutionOptions(
    conflicts: SlotConflict[],
    nextAvailableDate?: string,
    nextAvailableStart?: string,
    nextAvailableEnd?: string,
  ): ConflictResolutionOption[] {
    if (conflicts.length === 0) return [];
    const options: ConflictResolutionOption[] = [
      {
        strategy: "cancel_existing",
        label: `Cancel ${conflicts.length} conflicting booking${conflicts.length > 1 ? "s" : ""} and force-book`,
      },
      {
        strategy: "reassign_staff",
        label: "Reassign to another available staff member",
      },
    ];
    if (nextAvailableDate && nextAvailableStart && nextAvailableEnd) {
      options.push({
        strategy: "offer_next_slot",
        label: `Offer next available: ${nextAvailableDate} ${nextAvailableStart}–${nextAvailableEnd}`,
        nextSlot: {
          date: nextAvailableDate,
          startTime: nextAvailableStart,
          endTime: nextAvailableEnd,
        },
      });
    }
    return options;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    loadCalendarDay,
    loadBlockedSlots,
    blockTimeSlot,
    unblockTimeSlot,
    createManualBooking,
    forceCreateBooking,
    loadBookingDetail,
    markNoShow,
    adminCancel,
    adminReschedule,
    buildConflictResolutionOptions,
  };
}

export type BookingOpsService = ReturnType<typeof createBookingOpsService>;
