/**
 * Stripe Tax — domain model (Task 14.0)
 *
 * Per US_PRIMARY_MARKET_ADDENDUM.md: a single Stripe Tax integration handles
 * both US state sales-tax (incl. NYC surcharge) and EU VAT (incl. B2B
 * reverse-charge). The domain layer defines:
 *   - TaxQuote: idempotent quote envelope for a calculation request
 *   - TaxCalculation: the result with breakdown surfaced on receipts/invoices
 *   - Jurisdictional rule helpers (US + EU)
 *
 * The actual Stripe Tax API call lives in the Cloud Function tax provider
 * (Week 14 backend). The domain consumes a `TaxProvider` port so we can
 * unit-test deterministically.
 */

import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Quote context
// ---------------------------------------------------------------------------

export type TaxContext = "saas_subscription" | "salon_payment";

export type TaxBuyerType = "individual" | "business";

export type TaxAddress = {
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** US state code (CA, NY, …) or EU subdivision; null for countries w/o regions. */
  region: string | null;
  city: string | null;
  postalCode: string | null;
};

export type TaxBuyer = {
  type: TaxBuyerType;
  /** EU VAT id (e.g. "DE123456789") — required for B2B reverse-charge. */
  vatId: string | null;
  address: TaxAddress;
};

export type TaxSeller = {
  /** Tenant id (null for platform SaaS). */
  tenantId: string | null;
  address: TaxAddress;
  /** EU VAT id of the seller (null if not VAT-registered). */
  vatId: string | null;
};

export type TaxLineItem = {
  id: string;
  /** "service" for salon services; "saas" for the platform subscription. */
  productType: "service" | "saas";
  amount: number; // minor units (cents)
  currency: string; // ISO 4217
  /** Stripe Tax product code (e.g. txcd_20030000 for personal services). */
  taxCode: string;
};

// ---------------------------------------------------------------------------
// Quote envelope (idempotency key)
// ---------------------------------------------------------------------------

export type TaxQuote = {
  /**
   * Stable hash that identifies the quote (sha256 over {context, buyer, seller, items}).
   * Used as the cache + idempotency key so retries return the same result.
   */
  quoteId: string;
  context: TaxContext;
  buyer: TaxBuyer;
  seller: TaxSeller;
  items: readonly TaxLineItem[];
};

// ---------------------------------------------------------------------------
// Calculation result
// ---------------------------------------------------------------------------

export type TaxBreakdownLine = {
  itemId: string;
  taxableAmount: number;
  taxAmount: number;
  rate: number; // 0 - 1
  jurisdiction: string; // human readable, e.g. "NY State + NYC surcharge"
  reason: TaxReason;
};

export type TaxReason =
  | "us_state_taxable_service"
  | "us_state_nontaxable_service"
  | "nyc_surcharge"
  | "eu_vat_standard"
  | "eu_vat_reverse_charge"
  | "out_of_scope";

export type TaxCalculation = {
  quoteId: string;
  context: TaxContext;
  /** Total tax across all items, minor units. */
  totalTax: number;
  /** Total taxable base across all items, minor units. */
  totalTaxable: number;
  currency: string;
  lines: readonly TaxBreakdownLine[];
  /** Stripe Tax calculation id (returned by API; null if computed locally for tests). */
  stripeCalculationId: string | null;
  calculatedAt: Timestamp;
  /** When this cache entry expires; quoting again before this returns the cached value. */
  cacheExpiresAt: Timestamp;
};

// ---------------------------------------------------------------------------
// US state taxability rules for personal services
// ---------------------------------------------------------------------------
// Source: US_PRIMARY_MARKET_ADDENDUM.md — only a small set of US states
// tax personal services. NYC adds a 4.5% local surcharge on top of NY State
// (which itself does not generally tax services state-wide, but NYC does).

const US_STATES_TAXING_PERSONAL_SERVICES: ReadonlySet<string> = new Set([
  "CT",
  "HI",
  "NM",
  "SD",
  "WV",
]);

export function usStateTaxesPersonalServices(state: string | null): boolean {
  if (!state) return false;
  return US_STATES_TAXING_PERSONAL_SERVICES.has(state.toUpperCase());
}

export function isNycAddress(address: TaxAddress): boolean {
  if (address.country !== "US" || address.region !== "NY") return false;
  if (!address.city) return false;
  return address.city.trim().toLowerCase() === "new york";
}

// ---------------------------------------------------------------------------
// EU VAT — reverse-charge eligibility
// ---------------------------------------------------------------------------
// B2B sales between two EU member states where the buyer has a valid VAT id
// trigger the reverse-charge rule (seller charges 0%, buyer self-accounts).

const EU_MEMBER_STATES: ReadonlySet<string> = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
]);

export function isEuMemberState(country: string | null): boolean {
  if (!country) return false;
  return EU_MEMBER_STATES.has(country.toUpperCase());
}

export function qualifiesForEuReverseCharge(
  buyer: TaxBuyer,
  seller: TaxSeller,
): boolean {
  if (buyer.type !== "business") return false;
  if (!buyer.vatId || buyer.vatId.trim() === "") return false;
  if (!isEuMemberState(buyer.address.country)) return false;
  if (!isEuMemberState(seller.address.country)) return false;
  if (buyer.address.country.toUpperCase() === seller.address.country.toUpperCase()) {
    // Domestic sale — reverse-charge does not apply.
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type TaxErrorCode =
  | "MISSING_PAYLOAD"
  | "INVALID_QUOTE"
  | "PROVIDER_FAILED"
  | "PHI_DETECTED";

export class TaxError extends Error {
  constructor(
    public readonly code: TaxErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TaxError";
  }
}
