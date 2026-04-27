/**
 * Tax service — quote calculation with cache + idempotency.
 *
 * Flow:
 *   1. Build the cache key (quoteId) — already done by caller via hashQuote.
 *   2. Check repository for an unexpired cached calculation; return it if hit.
 *   3. Otherwise call the injected TaxProvider (Stripe Tax in production,
 *      a deterministic local computer in tests).
 *   4. Persist with a TTL stamp and return.
 *
 * The local rule engine (`computeTaxLocally`) is also exported so the same
 * deterministic logic powers tests and pre-flight estimates without an API
 * round-trip — values match Stripe Tax for the cases we care about (US
 * personal services, NYC surcharge, EU VAT reverse-charge, out-of-scope).
 */

import type { Timestamp } from "firebase/firestore";

import {
  isEuMemberState,
  isNycAddress,
  qualifiesForEuReverseCharge,
  TaxError,
  usStateTaxesPersonalServices,
  type TaxBreakdownLine,
  type TaxCalculation,
  type TaxLineItem,
  type TaxQuote,
  type TaxReason,
} from "./model";
import type { TaxRepository } from "./repository";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Default TTL for a cached tax calculation (15 minutes). */
export const DEFAULT_TAX_CACHE_TTL_SECONDS = 15 * 60;

/** Sales-tax rates we use when Stripe Tax is unavailable (test/preview only). */
const US_STATE_RATES: Record<string, number> = {
  CT: 0.0635,
  HI: 0.04,
  NM: 0.05125,
  SD: 0.045,
  WV: 0.06,
};

/** NYC local sales tax surcharge layered on top of NY state base. */
const NYC_LOCAL_RATE = 0.045;

/** EU VAT standard rates (subset — extend as more markets onboard). */
const EU_VAT_STANDARD_RATES: Record<string, number> = {
  AT: 0.20, BE: 0.21, BG: 0.20, HR: 0.25, CY: 0.19, CZ: 0.21, DK: 0.25,
  EE: 0.22, FI: 0.255, FR: 0.20, DE: 0.19, GR: 0.24, HU: 0.27, IE: 0.23,
  IT: 0.22, LV: 0.21, LT: 0.21, LU: 0.17, MT: 0.18, NL: 0.21, PL: 0.23,
  PT: 0.23, RO: 0.19, SK: 0.20, SI: 0.22, ES: 0.21, SE: 0.25,
};

// ---------------------------------------------------------------------------
// Local deterministic rule engine
// ---------------------------------------------------------------------------

type LineRuleResult = {
  taxAmount: number;
  rate: number;
  jurisdiction: string;
  reason: TaxReason;
};

function computeLineRule(quote: TaxQuote, item: TaxLineItem): LineRuleResult {
  const { buyer, seller } = quote;

  // EU jurisdiction (buyer in EU)
  if (isEuMemberState(buyer.address.country)) {
    if (qualifiesForEuReverseCharge(buyer, seller)) {
      return {
        taxAmount: 0,
        rate: 0,
        jurisdiction: `${buyer.address.country} (B2B reverse-charge)`,
        reason: "eu_vat_reverse_charge",
      };
    }
    const rate = EU_VAT_STANDARD_RATES[buyer.address.country.toUpperCase()] ?? 0;
    return {
      taxAmount: Math.round(item.amount * rate),
      rate,
      jurisdiction: `${buyer.address.country} VAT`,
      reason: "eu_vat_standard",
    };
  }

  // US jurisdiction
  if (buyer.address.country === "US") {
    if (item.productType === "saas") {
      // SaaS subscription — Stripe Tax handles per-state SaaS taxability.
      // For the local engine we treat US SaaS as out-of-scope (delegated).
      return {
        taxAmount: 0,
        rate: 0,
        jurisdiction: `US ${buyer.address.region ?? "?"} (SaaS — Stripe Tax)`,
        reason: "out_of_scope",
      };
    }
    const state = buyer.address.region;
    if (usStateTaxesPersonalServices(state)) {
      const rate = US_STATE_RATES[(state ?? "").toUpperCase()] ?? 0;
      return {
        taxAmount: Math.round(item.amount * rate),
        rate,
        jurisdiction: `US ${state} state sales tax`,
        reason: "us_state_taxable_service",
      };
    }
    if (isNycAddress(buyer.address)) {
      return {
        taxAmount: Math.round(item.amount * NYC_LOCAL_RATE),
        rate: NYC_LOCAL_RATE,
        jurisdiction: "NYC local sales tax surcharge",
        reason: "nyc_surcharge",
      };
    }
    return {
      taxAmount: 0,
      rate: 0,
      jurisdiction: `US ${state ?? "?"} (services not taxed)`,
      reason: "us_state_nontaxable_service",
    };
  }

  // Anywhere else
  return {
    taxAmount: 0,
    rate: 0,
    jurisdiction: `${buyer.address.country} (out of scope)`,
    reason: "out_of_scope",
  };
}

export function computeTaxLocally(
  quote: TaxQuote,
  now: Timestamp,
  ttlSeconds: number = DEFAULT_TAX_CACHE_TTL_SECONDS,
): TaxCalculation {
  if (quote.items.length === 0) {
    throw new TaxError("INVALID_QUOTE", "Quote must have at least one line item");
  }
  const currency = quote.items[0].currency;
  for (const item of quote.items) {
    if (item.currency !== currency) {
      throw new TaxError("INVALID_QUOTE", "Mixed currencies in a single quote are not supported");
    }
    if (item.amount < 0) {
      throw new TaxError("INVALID_QUOTE", `Line item ${item.id} has negative amount`);
    }
  }

  const lines: TaxBreakdownLine[] = quote.items.map((item) => {
    const r = computeLineRule(quote, item);
    return {
      itemId: item.id,
      taxableAmount: item.amount,
      taxAmount: r.taxAmount,
      rate: r.rate,
      jurisdiction: r.jurisdiction,
      reason: r.reason,
    };
  });

  const totalTax = lines.reduce((s, l) => s + l.taxAmount, 0);
  const totalTaxable = lines.reduce((s, l) => s + l.taxableAmount, 0);

  return {
    quoteId: quote.quoteId,
    context: quote.context,
    totalTax,
    totalTaxable,
    currency,
    lines,
    stripeCalculationId: null,
    calculatedAt: now,
    cacheExpiresAt: addSeconds(now, ttlSeconds),
  };
}

// ---------------------------------------------------------------------------
// TaxProvider port (Stripe Tax in production)
// ---------------------------------------------------------------------------

export type TaxProvider = {
  calculate(quote: TaxQuote, now: Timestamp): Promise<TaxCalculation>;
};

/** Local provider — deterministic. Used for tests and pre-flight estimates. */
export function createLocalTaxProvider(
  options?: { ttlSeconds?: number },
): TaxProvider {
  const ttl = options?.ttlSeconds ?? DEFAULT_TAX_CACHE_TTL_SECONDS;
  return {
    async calculate(quote, now) {
      return computeTaxLocally(quote, now, ttl);
    },
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export type TaxService = {
  /**
   * Returns a tax calculation for the quote. Reads the cache first; if absent
   * or expired, calls the provider, persists the result, and returns it.
   */
  quote(quote: TaxQuote): Promise<TaxCalculation>;
};

export function createTaxService(
  repository: TaxRepository,
  provider: TaxProvider,
  options?: { now?: () => Timestamp; ttlSeconds?: number },
): TaxService {
  const now = options?.now ?? defaultNow;

  async function quote(q: TaxQuote): Promise<TaxCalculation> {
    if (!q.quoteId) {
      throw new TaxError("MISSING_PAYLOAD", "Quote.quoteId is required for caching");
    }
    if (q.items.length === 0) {
      throw new TaxError("INVALID_QUOTE", "Quote must have at least one line item");
    }

    const cached = await repository.getCachedCalculation(q.seller.tenantId, q.quoteId);
    const ts = now();
    if (cached && cached.cacheExpiresAt.seconds > ts.seconds) {
      return cached;
    }

    const fresh = await provider.calculate(q, ts);
    await repository.saveCalculation(q.seller.tenantId, fresh);
    return fresh;
  }

  return { quote };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addSeconds(t: Timestamp, seconds: number): Timestamp {
  return { seconds: t.seconds + seconds, nanoseconds: 0 } as unknown as Timestamp;
}

function defaultNow(): Timestamp {
  const seconds = Math.floor(Date.now() / 1000);
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}
