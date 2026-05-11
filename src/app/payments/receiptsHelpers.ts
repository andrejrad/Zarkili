/**
 * receiptsHelpers.ts — Pure helpers for Batch D receipts + booking history.
 *
 * No React, no I/O. US date/time conventions throughout.
 */

import { roundCents, formatUsd } from "./paymentsHelpers";
import type { CardBrand } from "./paymentsHelpers";
import { formatBrandLabel, formatLast4 } from "./paymentsHelpers";

export type ReceiptLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  /** Optional second-line modifier description ("Add: aromatherapy"). */
  modifier?: string;
};

export type ReceiptTotals = {
  subtotal: number;
  taxLines: readonly ReceiptTaxLine[];
  taxTotal: number;
  tip: number;
  grandTotal: number;
};

export type ReceiptTaxLine = {
  /** Pre-formatted line label, e.g. "WA Sales Tax 10.25%". */
  label: string;
  amount: number;
};

/** Sum a single line item: quantity * unitPriceUsd, rounded to cents. */
export function lineItemSubtotal(item: ReceiptLineItem): number {
  const qty = Math.max(0, Math.floor(item.quantity));
  return roundCents(qty * item.unitPriceUsd);
}

/** Compute subtotal + grand total for a receipt. Tax lines are passed in pre-computed (Stripe Tax). */
export function computeReceiptTotals(input: {
  items: readonly ReceiptLineItem[];
  taxLines?: readonly ReceiptTaxLine[];
  tip?: number;
}): ReceiptTotals {
  const subtotal = roundCents(
    input.items.reduce((s, x) => s + lineItemSubtotal(x), 0),
  );
  const taxLines = input.taxLines ?? [];
  const taxTotal = roundCents(taxLines.reduce((s, t) => s + Math.max(0, t.amount), 0));
  const tip = roundCents(Math.max(0, input.tip ?? 0));
  const grandTotal = roundCents(subtotal + taxTotal + tip);
  return { subtotal, taxLines, taxTotal, tip, grandTotal };
}

/** "Visa •••• 4242" — used on receipt payment-method line. */
export function formatPaymentMethodLine(input: {
  brand: CardBrand;
  last4: string;
}): string {
  return `${formatBrandLabel(input.brand)} ${formatLast4(input.last4)}`;
}

/** "Apple Pay" — for receipts paid via Apple Pay (no last4). */
export const APPLE_PAY_PAYMENT_LINE = "Apple Pay";

// ---------------------------------------------------------------------------
// Booking history filters
// ---------------------------------------------------------------------------

export type BookingHistoryTab = "upcoming" | "past" | "cancelled";

export const BOOKING_HISTORY_TABS: readonly BookingHistoryTab[] = [
  "upcoming",
  "past",
  "cancelled",
] as const;

export const BOOKING_HISTORY_TAB_LABELS: Record<BookingHistoryTab, string> = {
  upcoming: "Upcoming",
  past: "Past",
  cancelled: "Cancelled",
};

export type BookingHistoryStatus =
  | "confirmed"
  | "completed"
  | "cancelled"
  | "noShow"
  | "pending";

export type BookingHistoryRecord = {
  id: string;
  salonId: string;
  salonName: string;
  serviceName: string;
  /** ISO 8601 start datetime (UTC or local — caller's responsibility). */
  startsAtIso: string;
  status: BookingHistoryStatus;
  totalUsd: number;
};

export type BookingHistoryFilters = {
  salonIds?: readonly string[];
  /** ISO date inclusive lower bound (YYYY-MM-DD). */
  fromDate?: string;
  /** ISO date inclusive upper bound. */
  toDate?: string;
  status?: readonly BookingHistoryStatus[];
  minPriceUsd?: number;
  maxPriceUsd?: number;
};

/** Filter a booking-history list by tab + filters. Pure: returns a new array. */
export function filterBookingHistory(
  records: readonly BookingHistoryRecord[],
  tab: BookingHistoryTab,
  filters: BookingHistoryFilters = {},
  now: Date = new Date(),
): BookingHistoryRecord[] {
  return records.filter((r) => {
    const start = new Date(r.startsAtIso);
    if (tab === "upcoming") {
      if (r.status === "cancelled" || r.status === "noShow") return false;
      if (start.getTime() < now.getTime()) return false;
    } else if (tab === "past") {
      if (r.status === "cancelled" || r.status === "noShow") return false;
      if (start.getTime() >= now.getTime() && r.status !== "completed") return false;
    } else if (tab === "cancelled") {
      if (r.status !== "cancelled" && r.status !== "noShow") return false;
    }
    if (filters.salonIds && filters.salonIds.length > 0 && !filters.salonIds.includes(r.salonId)) {
      return false;
    }
    if (filters.status && filters.status.length > 0 && !filters.status.includes(r.status)) {
      return false;
    }
    if (filters.fromDate) {
      const iso = r.startsAtIso.slice(0, 10);
      if (iso < filters.fromDate) return false;
    }
    if (filters.toDate) {
      const iso = r.startsAtIso.slice(0, 10);
      if (iso > filters.toDate) return false;
    }
    if (filters.minPriceUsd !== undefined && r.totalUsd < filters.minPriceUsd) return false;
    if (filters.maxPriceUsd !== undefined && r.totalUsd > filters.maxPriceUsd) return false;
    return true;
  });
}

/** Count active filter dimensions (used to render filter-button badge). */
export function countActiveBookingFilters(filters: BookingHistoryFilters): number {
  let n = 0;
  if (filters.salonIds && filters.salonIds.length > 0) n++;
  if (filters.fromDate || filters.toDate) n++;
  if (filters.status && filters.status.length > 0) n++;
  if (filters.minPriceUsd !== undefined || filters.maxPriceUsd !== undefined) n++;
  return n;
}

// ---------------------------------------------------------------------------
// Refund / dispute
// ---------------------------------------------------------------------------

export type RefundStatus = "pending" | "issued" | "denied";

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  pending: "Pending",
  issued: "Issued",
  denied: "Denied",
};

export type RefundTimelineStep = {
  id: string;
  label: string;
  /** ISO 8601 date. */
  occurredAtIso?: string;
  /** True if this is the latest reached step. */
  current?: boolean;
};

/** Default timeline scaffold: Requested → Approved → Issued. */
export function buildRefundTimeline(input: {
  requestedAtIso: string;
  approvedAtIso?: string;
  issuedAtIso?: string;
  deniedAtIso?: string;
}): RefundTimelineStep[] {
  if (input.deniedAtIso) {
    return [
      { id: "requested", label: "Requested", occurredAtIso: input.requestedAtIso },
      { id: "denied", label: "Denied", occurredAtIso: input.deniedAtIso, current: true },
    ];
  }
  return [
    { id: "requested", label: "Requested", occurredAtIso: input.requestedAtIso, current: !input.approvedAtIso },
    {
      id: "approved",
      label: "Approved",
      occurredAtIso: input.approvedAtIso,
      current: Boolean(input.approvedAtIso) && !input.issuedAtIso,
    },
    {
      id: "issued",
      label: "Issued",
      occurredAtIso: input.issuedAtIso,
      current: Boolean(input.issuedAtIso),
    },
  ];
}

/** "$45.00 refunded" — for the refund amount block on D.6. */
export function formatRefundAmountLabel(amount: number): string {
  return `${formatUsd(Math.max(0, amount))} refunded`;
}
