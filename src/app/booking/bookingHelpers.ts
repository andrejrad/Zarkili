/**
 * bookingHelpers.ts — Pure helpers for the W23 booking flow.
 *
 * No React, no I/O. Locked to US 12-hour time + MM/DD/YYYY date conventions
 * per design-handoff/specs/screen-booking-{date,time}-picker.json.
 */

export type BookingStep =
  | "service"
  | "staff"
  | "date"
  | "time"
  | "review"
  | "policies"
  | "payment"
  | "confirmation";

export const BOOKING_STEPS: readonly BookingStep[] = [
  "service",
  "staff",
  "date",
  "time",
  "review",
  "policies",
  "payment",
  "confirmation",
] as const;

export type TimeSegment = "morning" | "afternoon" | "evening";

export const TIME_SEGMENT_LABELS: Record<TimeSegment, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export type BookingService = {
  id: string;
  name: string;
  durationMinutes: number;
  priceUsd: number;
  category?: string;
  description?: string;
};

export type BookingAddOn = {
  id: string;
  name: string;
  priceUsd: number;
};

export type BookingStaffOption = {
  id: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
  nextAvailableLabel?: string;
  /** Optional pre-fetched preview slots in 12h format. */
  previewSlots?: string[];
  onLeaveLabel?: string;
  photoUrl?: string | null;
};

export type BookingPriceBreakdown = {
  subtotal: number;
  taxRate: number;
  tax: number;
  tip: number;
  /** Loyalty / promo discount in USD (positive value = reduction). Optional, defaults to 0. */
  loyaltyDiscount?: number;
  total: number;
};

const DAY_NAMES_LONG = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
] as const;
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** "Wednesday, March 12" */
export function formatLongDateLabel(date: Date): string {
  return `${DAY_NAMES_LONG[date.getDay()]}, ${MONTH_NAMES_LONG[date.getMonth()]} ${date.getDate()}`;
}

/** "Wed, Mar 12" */
export function formatShortDateLabel(date: Date): string {
  return `${DAY_NAMES_SHORT[date.getDay()]}, ${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getDate()}`;
}

/** "03/12/2026" — US MM/DD/YYYY */
export function formatUsDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${m}/${d}/${date.getFullYear()}`;
}

/** Convert minutes-since-midnight (0..1439) to 12h "h:mm AM/PM". */
export function formatTimeOfDay(totalMinutes: number): string {
  const safe = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(safe / 60);
  const minutes = safe % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** Categorize a 12h time string into morning / afternoon / evening. */
export function categorizeTimeSlot(time: string): TimeSegment {
  const minutes = parseTimeOfDay(time);
  if (minutes < 12 * 60) return "morning";
  if (minutes < 17 * 60) return "afternoon";
  return "evening";
}

/** Parse 12h "9:00 AM" into minutes since midnight. Returns NaN on bad input. */
export function parseTimeOfDay(time: string): number {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!match) return NaN;
  let h = parseInt(match[1] ?? "0", 10);
  const m = parseInt(match[2] ?? "0", 10);
  const period = (match[3] ?? "AM").toUpperCase();
  if (h === 12) h = 0;
  if (period === "PM") h += 12;
  return h * 60 + m;
}

/** Group a list of 12h time strings by morning/afternoon/evening segment. */
export function groupTimeSlotsBySegment(
  slots: readonly string[],
): Record<TimeSegment, string[]> {
  const out: Record<TimeSegment, string[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const slot of slots) {
    const seg = categorizeTimeSlot(slot);
    if (!Number.isNaN(parseTimeOfDay(slot))) out[seg].push(slot);
  }
  return out;
}

/** Compute USD totals for a booking review. Tax rounded to cents. */
export function computeBookingTotal(input: {
  services: readonly { priceUsd: number }[];
  addOns?: readonly { priceUsd: number }[];
  taxRate?: number;
  tip?: number;
}): BookingPriceBreakdown {
  const subtotal =
    input.services.reduce((s, x) => s + x.priceUsd, 0) +
    (input.addOns ?? []).reduce((s, x) => s + x.priceUsd, 0);
  const taxRate = input.taxRate ?? 0;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const tip = input.tip ?? 0;
  const total = Math.round((subtotal + tax + tip) * 100) / 100;
  return { subtotal, taxRate, tax, tip, total };
}

/** "$108.00" — US currency formatter, no thousands separator below 1k for simplicity. */
export function formatUsd(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const whole = Math.floor(abs);
  const cents = Math.round((abs - whole) * 100);
  return `${sign}$${whole.toLocaleString("en-US")}.${String(cents).padStart(2, "0")}`;
}

/** Format raw 10-digit US phone "5551234567" → "(555) 123-4567". Pass-through if not 10 digits. */
export function formatPhoneUs(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 10) return input;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Minute-stride generator for slot grids. From/To inclusive ends. */
export function generateTimeSlots(
  startMinutes: number,
  endMinutes: number,
  stepMinutes: number,
): string[] {
  if (stepMinutes <= 0 || endMinutes < startMinutes) return [];
  const out: string[] = [];
  for (let m = startMinutes; m <= endMinutes; m += stepMinutes) {
    out.push(formatTimeOfDay(m));
  }
  return out;
}

export type BookingStatus =
  | "confirmed"
  | "pending"
  | "cancelled"
  | "completed"
  | "noShow"
  | "waitlisted";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
  noShow: "No-show",
  waitlisted: "Waitlisted",
};

/** Compute refund preview for a cancellation: refund = total − fee. */
export function computeCancellationRefund(input: {
  total: number;
  fee: number;
}): { refund: number; fee: number } {
  const fee = Math.max(0, input.fee);
  const refund = Math.max(0, Math.round((input.total - fee) * 100) / 100);
  return { refund, fee };
}
