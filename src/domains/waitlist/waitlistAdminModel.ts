/**
 * W46 — waitlistAdminModel
 *
 * Domain types for the admin waitlist surfaces: waitlist list with priority,
 * convert-to-booking flow, and waitlist policy configuration.
 *
 * The consumer-facing waitlist types (join, position) live in
 * src/domains/waitlist/repository.ts.
 */

// ---------------------------------------------------------------------------
// Waitlist entry (admin view)
// ---------------------------------------------------------------------------

export type WaitlistAdminStatus =
  | "waiting"
  | "notified"
  | "booked"
  | "expired"
  | "cancelled";

export type WaitlistTimePreferenceAdmin =
  | "morning"
  | "afternoon"
  | "evening"
  | "anytime";

export type WaitlistAdminEntry = {
  waitlistId: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  serviceId: string;
  serviceName: string;
  staffId: string | null;
  staffName: string | null;
  locationId: string;
  preferredDateFrom: string; // YYYY-MM-DD
  preferredDateTo: string;   // YYYY-MM-DD
  preferredTime: WaitlistTimePreferenceAdmin;
  priority: number; // 1 = highest
  status: WaitlistAdminStatus;
  joinedAt: string; // ISO datetime
  expiresAt: string | null;
  notifiedAt: string | null;
  notifyPush: boolean;
  notifySms: boolean;
};

// ---------------------------------------------------------------------------
// Convert waitlist entry to a booking
// ---------------------------------------------------------------------------

export type ConvertToBookingInput = {
  waitlistId: string;
  tenantId: string;
  staffId: string;
  locationId: string;
  serviceId: string;
  date: string;   // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  notes: string;
  convertedBy: string;
};

export type ConvertToBookingResult = {
  bookingId: string;
  waitlistId: string;
};

// ---------------------------------------------------------------------------
// Waitlist policies
// ---------------------------------------------------------------------------

export type WaitlistPolicy = {
  tenantId: string;
  maxWaitDays: number;
  autoCancelAfterDays: number;
  notifyOnOpenSlot: boolean;
  notifyLeadHours: number;
  requireConfirmation: boolean;
  allowMultipleEntries: boolean;
  maxEntriesPerClient: number;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export type WaitlistAdminFilter = "all" | "waiting" | "notified" | "booked" | "expired" | "cancelled";

// ---------------------------------------------------------------------------
// Generic result wrapper
// ---------------------------------------------------------------------------

export type WaitlistAdminResult<T> = { ok: true; data: T } | { ok: false; message: string };
