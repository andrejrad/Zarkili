import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  runStripeTaxCalculate,
  type StripeTaxCalculateDeps,
  type TaxCacheRepo,
} from "../src/stripeTaxCalculate";
import type {
  LocalTimestamp,
  StripeTaxApiClient,
  StripeTaxCalculationResponse,
  TaxCalculation,
  TaxQuote,
} from "../src/stripe/taxAdapter";

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

function ts(seconds: number): LocalTimestamp { return { seconds, nanoseconds: 0 }; }

function makeRepo(): TaxCacheRepo & { _store: Record<string, TaxCalculation> } {
  const store: Record<string, TaxCalculation> = {};
  return {
    _store: store,
    async get(tenantId, quoteId) {
      return store[`${tenantId ?? "platform"}:${quoteId}`] ?? null;
    },
    async save(tenantId, calc) {
      store[`${tenantId ?? "platform"}:${calc.quoteId}`] = calc;
    },
  };
}

function makeStripe(response: StripeTaxCalculationResponse): StripeTaxApiClient & { calls: number } {
  const stub = {
    calls: 0,
    async createCalculation(_params: Record<string, string>) {
      stub.calls += 1;
      return response;
    },
  };
  return stub;
}

function quote(): TaxQuote {
  return {
    quoteId: "q-1",
    context: "salon_payment",
    buyer: {
      type: "individual",
      vatId: null,
      address: { country: "US", region: "NY", city: "New York", postalCode: "10001" },
    },
    seller: {
      tenantId: "salon-1",
      vatId: null,
      address: { country: "US", region: "NY", city: "New York", postalCode: "10001" },
    },
    items: [
      { id: "line-1", productType: "service", amount: 10000, currency: "USD", taxCode: "txcd_20030000" },
    ],
  };
}

const STRIPE_RESPONSE: StripeTaxCalculationResponse = {
  id: "taxcalc_test_1",
  amount_total: 10885,
  tax_amount_exclusive: 885,
  currency: "usd",
  line_items: {
    data: [
      {
        reference: "line-1",
        amount: 10000,
        amount_tax: 885,
        tax_breakdown: [
          {
            amount: 885,
            tax_rate_details: { percentage_decimal: "8.875", country: "US", state: "NY" },
            jurisdiction: { display_name: "New York", country: "US", state: "NY" },
            taxability_reason: "standard_rated",
          },
        ],
      },
    ],
  },
};

function makeDeps(now: LocalTimestamp = ts(1000)): {
  repo: ReturnType<typeof makeRepo>;
  stripe: ReturnType<typeof makeStripe>;
  deps: StripeTaxCalculateDeps;
} {
  const repo = makeRepo();
  const stripe = makeStripe(STRIPE_RESPONSE);
  return {
    repo,
    stripe,
    deps: { repo, stripe, now: () => now },
  };
}

// ---------------------------------------------------------------------------
// runStripeTaxCalculate
// ---------------------------------------------------------------------------

describe("runStripeTaxCalculate", () => {
  it("calls Stripe and persists the calculation when no cache exists", async () => {
    const { deps, repo, stripe } = makeDeps();
    const result = await runStripeTaxCalculate(quote(), deps);
    expect(result.source).toBe("stripe");
    expect(stripe.calls).toBe(1);
    expect(result.calculation.stripeCalculationId).toBe("taxcalc_test_1");
    expect(repo._store["salon-1:q-1"]).toBeDefined();
  });

  it("returns the cached calculation when cacheExpiresAt is still in the future", async () => {
    const { deps, repo, stripe } = makeDeps(ts(500));
    // Pre-seed cache: expires at 500 + 900 = 1400.
    repo._store["salon-1:q-1"] = {
      quoteId: "q-1",
      context: "salon_payment",
      totalTax: 100,
      totalTaxable: 10000,
      currency: "USD",
      lines: [],
      stripeCalculationId: "taxcalc_pre_existing",
      calculatedAt: ts(500),
      cacheExpiresAt: ts(1400),
    };
    const result = await runStripeTaxCalculate(quote(), deps);
    expect(result.source).toBe("cache");
    expect(stripe.calls).toBe(0);
    expect(result.calculation.stripeCalculationId).toBe("taxcalc_pre_existing");
  });

  it("re-fetches from Stripe when the cache has expired", async () => {
    const { deps, repo, stripe } = makeDeps(ts(2000));
    // Pre-seeded entry expired at 1400.
    repo._store["salon-1:q-1"] = {
      quoteId: "q-1",
      context: "salon_payment",
      totalTax: 100,
      totalTaxable: 10000,
      currency: "USD",
      lines: [],
      stripeCalculationId: "taxcalc_pre_existing",
      calculatedAt: ts(500),
      cacheExpiresAt: ts(1400),
    };
    const result = await runStripeTaxCalculate(quote(), deps);
    expect(result.source).toBe("stripe");
    expect(stripe.calls).toBe(1);
    // Cache replaced by fresh call.
    expect(repo._store["salon-1:q-1"].stripeCalculationId).toBe("taxcalc_test_1");
  });

  it("stamps cacheExpiresAt = now + 900 seconds (DEFAULT_TAX_CACHE_TTL_SECONDS)", async () => {
    const { deps } = makeDeps(ts(1000));
    const result = await runStripeTaxCalculate(quote(), deps);
    expect(result.calculation.cacheExpiresAt.seconds).toBe(1000 + 900);
  });

  it("rejects an empty quoteId", async () => {
    const { deps } = makeDeps();
    await expect(
      runStripeTaxCalculate({ ...quote(), quoteId: "" }, deps),
    ).rejects.toThrow();
  });

  it("rejects an empty items list", async () => {
    const { deps } = makeDeps();
    await expect(
      runStripeTaxCalculate({ ...quote(), items: [] }, deps),
    ).rejects.toThrow();
  });

  it("uses platform/__platform__/taxCalculations bucket when seller.tenantId is null", async () => {
    const { deps, repo } = makeDeps();
    const platformQuote: TaxQuote = {
      ...quote(),
      seller: { ...quote().seller, tenantId: null },
    };
    await runStripeTaxCalculate(platformQuote, deps);
    expect(repo._store["platform:q-1"]).toBeDefined();
  });
});
