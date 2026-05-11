/**
 * paymentsHelpers.ts — Pure helpers for the W24 Batch D payments + tipping flow.
 *
 * No React, no I/O. All amounts in USD; tax handling matches Stripe Tax
 * jurisdictional labels (e.g. "WA Sales Tax 10.25%"). Tip presets are %-of-subtotal.
 */

export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners"
  | "jcb"
  | "unionpay"
  | "unknown";

export type SavedPaymentMethod = {
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: number; // 1..12
  expYear: number; // 4-digit
  isDefault?: boolean;
  /** Cardholder name as captured at add-card time (D.2). */
  holderName?: string;
};

export type ApplePayMethod = {
  type: "apple-pay";
  /** System-managed; no last4. */
};

export type PaymentSelection =
  | { type: "card"; cardId: string }
  | ApplePayMethod
  | { type: "none" };

/** Normalize a free-form Stripe brand string to our CardBrand union. */
export function normalizeCardBrand(brand: string | undefined | null): CardBrand {
  if (!brand) return "unknown";
  const b = brand.toLowerCase().replace(/[\s_-]+/g, "");
  if (b === "visa") return "visa";
  if (b === "mastercard" || b === "mc") return "mastercard";
  if (b === "amex" || b === "americanexpress") return "amex";
  if (b === "discover") return "discover";
  if (b === "diners" || b === "dinersclub") return "diners";
  if (b === "jcb") return "jcb";
  if (b === "unionpay" || b === "cup") return "unionpay";
  return "unknown";
}

const BRAND_LABELS: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
  unknown: "Card",
};

export function formatBrandLabel(brand: CardBrand): string {
  return BRAND_LABELS[brand];
}

/** "•••• 4242" */
export function formatLast4(last4: string): string {
  const trimmed = (last4 ?? "").replace(/\D/g, "").slice(-4);
  return `•••• ${trimmed}`;
}

/** "Visa •••• 4242" */
export function formatCardLabel(method: { brand: CardBrand; last4: string }): string {
  return `${formatBrandLabel(method.brand)} ${formatLast4(method.last4)}`;
}

/** "Expires 12/28" — 2-digit month, 2-digit year. */
export function formatCardExpiry(expMonth: number, expYear: number): string {
  const mm = String(expMonth).padStart(2, "0");
  const yy = String(expYear).slice(-2).padStart(2, "0");
  return `Expires ${mm}/${yy}`;
}

/** True if the card has expired relative to a reference date. */
export function isCardExpired(
  expMonth: number,
  expYear: number,
  referenceDate: Date = new Date(),
): boolean {
  if (expMonth < 1 || expMonth > 12) return true;
  const refY = referenceDate.getFullYear();
  const refM = referenceDate.getMonth() + 1; // 1..12
  if (expYear < refY) return true;
  if (expYear > refY) return false;
  return expMonth < refM;
}

// ---------------------------------------------------------------------------
// Currency input parsing + formatting
// ---------------------------------------------------------------------------

/** Round to 2 decimal places, half-away-from-zero. Used everywhere money is summed. */
export function roundCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

/**
 * Parse a free-form currency string ("$12.34", "12,345.67", "1234") to a number.
 * Returns NaN on garbage. Trailing decimals beyond 2 are truncated.
 */
export function parseCurrencyInput(input: string): number {
  if (typeof input !== "string") return NaN;
  const cleaned = input.replace(/[^\d.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return NaN;
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return NaN;
  return Math.trunc(num * 100) / 100;
}

/**
 * "$1,234.50" — US-locale currency formatter with thousands separator.
 * Negative amounts render as "-$1,234.50".
 */
export function formatUsd(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(roundCents(amount));
  const whole = Math.floor(abs);
  const cents = Math.round((abs - whole) * 100);
  return `${sign}$${whole.toLocaleString("en-US")}.${String(cents).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Tipping
// ---------------------------------------------------------------------------

export type TipPresetKind = "percent" | "fixed" | "none";

export type TipPreset = {
  id: string;
  /** Display label, e.g. "20%" or "Custom" or "No tip". */
  label: string;
  kind: TipPresetKind;
  /** When kind === "percent": a fraction (0.20 = 20%). When "fixed": USD. Ignored for "none". */
  value?: number;
};

/** Default Batch D tip presets per spec D.3: 15 / 18 / 20 / 25 / Custom / No tip. */
export const DEFAULT_TIP_PRESETS: readonly TipPreset[] = [
  { id: "p15", label: "15%", kind: "percent", value: 0.15 },
  { id: "p18", label: "18%", kind: "percent", value: 0.18 },
  { id: "p20", label: "20%", kind: "percent", value: 0.20 },
  { id: "p25", label: "25%", kind: "percent", value: 0.25 },
  { id: "custom", label: "Custom", kind: "fixed" },
  { id: "none", label: "No tip", kind: "none" },
] as const;

/**
 * Resolve a tip amount given a selected preset + subtotal + optional custom amount.
 * For "percent": returns subtotal * value, rounded to cents.
 * For "fixed": returns customAmount ?? value ?? 0, clamped to >= 0.
 * For "none": returns 0.
 * Unknown / missing preset returns 0.
 */
export function tipAmountFromPreset(input: {
  preset: TipPreset | undefined;
  subtotal: number;
  customAmount?: number;
}): number {
  const p = input.preset;
  if (!p) return 0;
  if (p.kind === "none") return 0;
  if (p.kind === "percent") {
    const v = p.value ?? 0;
    return Math.max(0, roundCents(input.subtotal * v));
  }
  // fixed
  const raw = input.customAmount ?? p.value ?? 0;
  return Math.max(0, roundCents(raw));
}

// ---------------------------------------------------------------------------
// Order total (subtotal + tax + tip)
// ---------------------------------------------------------------------------

export type OrderTotalLines = {
  subtotal: number;
  taxRate: number;
  tax: number;
  tip: number;
  total: number;
};

/** Compute order totals. Tax is taxRate * subtotal, rounded to cents. */
export function computeOrderTotal(input: {
  subtotal: number;
  taxRate?: number;
  tip?: number;
}): OrderTotalLines {
  const subtotal = roundCents(Math.max(0, input.subtotal));
  const taxRate = input.taxRate ?? 0;
  const tax = roundCents(subtotal * taxRate);
  const tip = roundCents(Math.max(0, input.tip ?? 0));
  const total = roundCents(subtotal + tax + tip);
  return { subtotal, taxRate, tax, tip, total };
}

// ---------------------------------------------------------------------------
// Stripe Tax jurisdiction label
// ---------------------------------------------------------------------------

/**
 * "WA Sales Tax 10.25%" — formats a Stripe Tax jurisdiction line for receipts.
 * percentRate is a fraction (0.1025 = 10.25%). When jurisdictionCode is missing,
 * returns just "Sales Tax".
 */
export function formatTaxLabel(input: {
  jurisdictionCode?: string;
  percentRate?: number;
  jurisdictionType?: "state" | "county" | "city" | "country";
}): string {
  const pct =
    input.percentRate !== undefined && Number.isFinite(input.percentRate)
      ? `${formatPercent(input.percentRate)} `
      : "";
  const code = input.jurisdictionCode ? input.jurisdictionCode.toUpperCase() : "";
  if (!code) return `${pct}Sales Tax`.trim();
  return `${code} Sales Tax ${pct}`.trim();
}

/** "10.25%" — 2 decimal max, trims trailing zeros after decimal. */
export function formatPercent(rate: number): string {
  if (!Number.isFinite(rate)) return "0%";
  const pct = roundCents(rate * 100);
  if (Number.isInteger(pct)) return `${pct}%`;
  return `${pct.toFixed(2).replace(/0$/, "")}%`;
}
