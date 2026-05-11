/**
 * W43 — Admin Booking Operations — domain model extensions.
 *
 * Extends the core Booking/BookingStatus types from ./model.ts with admin-specific
 * views and inputs for: calendar display, manual / force booking, block-time
 * management, no-show, admin cancellation, and admin reschedule.
 *
 * These types do NOT duplicate fields already present on Booking; they wrap or
 * augment the base type for admin-surface consumption only.
 */

import type { Timestamp } from "firebase/firestore";
import type { Booking, BookingLifecycleEvent, BookingStatus } from "./model";

// ---------------------------------------------------------------------------
// Re-export for convenience
// ---------------------------------------------------------------------------

export type { Booking, BookingStatus, BookingLifecycleEvent };

// ---------------------------------------------------------------------------
// Calendar view types
// ---------------------------------------------------------------------------

export type CalendarViewMode = "day" | "week" | "month";

/** A single booking entry projected for master-calendar rendering */
export type CalendarBookingEntry = {
  bookingId: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  date: string;         // YYYY-MM-DD
  startTime: string;    // HH:mm
  endTime: string;      // HH:mm
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  status: BookingStatus;
};

/** One staff member's column on a day-view calendar */
export type CalendarStaffColumn = {
  staffId: string;
  staffName: string;
  entries: CalendarBookingEntry[];
};

/** Full day view — all staff columns with their booking entries */
export type CalendarDayView = {
  date: string; // YYYY-MM-DD
  columns: CalendarStaffColumn[];
};

// ---------------------------------------------------------------------------
// Blocked time slot (hold)
// ---------------------------------------------------------------------------

export type BlockedSlot = {
  slotId: string;
  tenantId: string;
  locationId: string;
  staffId: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  reason: string;
  createdBy: string; // userId who created the block
  createdAt: Timestamp;
};

export type CreateBlockedSlotInput = Omit<BlockedSlot, "slotId" | "createdAt">;

// ---------------------------------------------------------------------------
// Manual booking (phone-in / walk-in)
// ---------------------------------------------------------------------------

export type ManualBookingChannel = "phone_in" | "walk_in";

export type ManualBookingInput = {
  channel: ManualBookingChannel;
  tenantId: string;
  locationId: string;
  staffId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string | null;
  date: string;
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  bufferMinutes: number;
  notes: string | null;
};

// ---------------------------------------------------------------------------
// Force-book (override / bypass conflict)
// ---------------------------------------------------------------------------

export type ForceBookInput = {
  tenantId: string;
  locationId: string;
  staffId: string;
  serviceId: string;
  customerUserId: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  bufferMinutes: number;
  overrideReason: string;  // required — surfaces in audit log
  overriddenBy: string;    // userId performing the override
};

// ---------------------------------------------------------------------------
// Admin booking detail view
// ---------------------------------------------------------------------------

export type AdminBookingDetailView = {
  booking: Booking;
  staffName: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  pastBookingsCount: number;
  totalSpendCents: number;
  lifecycleEvents: BookingLifecycleEvent[];
};

// ---------------------------------------------------------------------------
// No-show
// ---------------------------------------------------------------------------

export type NoShowInput = {
  bookingId: string;
  tenantId: string;
  policyNote: string | null;
  penaltyApplied: boolean;
  performedBy: string; // userId
};

// ---------------------------------------------------------------------------
// Admin cancellation with optional fee
// ---------------------------------------------------------------------------

export type AdminCancellationInput = {
  bookingId: string;
  tenantId: string;
  reason: string;
  feeCents: number;      // 0 = no fee
  feeCurrency: string;   // ISO 4217, e.g. "USD"
  performedBy: string;
};

// ---------------------------------------------------------------------------
// Admin reschedule (on behalf of client)
// ---------------------------------------------------------------------------

export type RescheduleAdminInput = {
  bookingId: string;
  tenantId: string;
  newDate: string;
  newStartMinutes: number;
  newEndMinutes: number;
  newStartTime: string;
  newEndTime: string;
  rescheduleReason: string | null;
  performedBy: string;
};

// ---------------------------------------------------------------------------
// Slot conflict resolution (UI)
// ---------------------------------------------------------------------------

export type SlotConflict = {
  conflictingBookingId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
};

export type ConflictResolutionStrategy =
  | "cancel_existing"
  | "reassign_staff"
  | "offer_next_slot";

export type ConflictResolutionOption = {
  strategy: ConflictResolutionStrategy;
  label: string;
  nextSlot?: { date: string; startTime: string; endTime: string };
};

// ---------------------------------------------------------------------------
// Generic service result wrapper (mirrors serviceCatalogService pattern)
// ---------------------------------------------------------------------------

export type BookingOpsResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };
