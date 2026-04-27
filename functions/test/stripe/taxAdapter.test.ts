import { describe, expect, it } from "vitest";

import {
  buildStripeTaxRequestParams,
  mapStripeTaxResponseToCalculation,
  type LocalTimestamp,
  type StripeTaxCalculationResponse,
  type TaxQuote,
} from "../../src/stripe/taxAdapter";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ts(seconds: number): LocalTimestamp { return { seconds, nanoseconds: 0 }; }

const SELLER_NY = {
  tenantId: "salon-1",
  vatId: null,
  address: { country: "US", region: "NY", city: "New York", postalCode: "10001" },
};

const SELLER_DE = {
  tenantId: "salon-1",
  vatId: "DE123456789",
  address: { country: "DE", region: null, city: "Berlin", postalCode: "10115" },
};

function quoteUS(): TaxQuote {
  return {
    quoteId: "quote-us-1",
    context: "salon_payment",
    buyer: {
      type: "individual",
      vatId: null,
      address: { country: "US", region: "NY", city: "New York", postalCode: "10001" },
    },
    seller: SELLER_NY,
    items: [
      { id: "line-1", productType: "service", amount: 10000, currency: "USD", taxCode: "txcd_20030000" },
    ],
  };
}

function quoteB2BReverseCharge(): TaxQuote {
  return {
    quoteId: "quote-eu-rev-1",
    context: "saas_subscription",
    buyer: {
      type: "business",
      vatId: "FRAB123456789",
      address: { country: "FR", region: null, city: "Paris", postalCode: "75001" },
    },
    seller: SELLER_DE,
    items: [
      { id: "sub-1", productType: "saas", amount: 5000, currency: "EUR", taxCode: "txcd_10103000" },
    ],
  };
}

// ---------------------------------------------------------------------------
// buildStripeTaxRequestParams
// ---------------------------------------------------------------------------

describe("buildStripeTaxRequestParams", () => {
  it("emits country+region+city+postal_code under customer_details[address]", () => {
    const params = buildStripeTaxRequestParams(quoteUS());
    expect(params).toMatchObject({
      currency: "usd",
      "customer_details[address][country]": "US",
      "customer_details[address][state]": "NY",
      "customer_details[address][city]": "New York",
      "customer_details[address][postal_code]": "10001",
      "customer_details[address_source]": "billing",
      "line_items[0][amount]": "10000",
      "line_items[0][reference]": "line-1",
      "line_items[0][tax_code]": "txcd_20030000",
    });
  });

  it("emits an EU VAT tax_id only for business buyers with a vatId", () => {
    const params = buildStripeTaxRequestParams(quoteB2BReverseCharge());
    expect(params["customer_details[tax_ids][0][type]"]).toBe("eu_vat");
    expect(params["customer_details[tax_ids][0][value]"]).toBe("FRAB123456789");
  });

  it("omits tax_ids for individual buyers", () => {
    const params = buildStripeTaxRequestParams(quoteUS());
    expect(params["customer_details[tax_ids][0][type]"]).toBeUndefined();
  });

  it("expands multiple line items", () => {
    const q = quoteUS();
    const multi: TaxQuote = {
      ...q,
      items: [
        ...q.items,
        { id: "line-2", productType: "service", amount: 3000, currency: "USD", taxCode: "txcd_20030000" },
      ],
    };
    const params = buildStripeTaxRequestParams(multi);
    expect(params["line_items[0][reference]"]).toBe("line-1");
    expect(params["line_items[1][reference]"]).toBe("line-2");
    expect(params["line_items[1][amount]"]).toBe("3000");
  });

  it("rejects mixed currencies", () => {
    const q = quoteUS();
    const bad: TaxQuote = {
      ...q,
      items: [
        ...q.items,
        { id: "line-2", productType: "service", amount: 3000, currency: "EUR", taxCode: "txcd_20030000" },
      ],
    };
    expect(() => buildStripeTaxRequestParams(bad)).toThrow(/INVALID_QUOTE/);
  });

  it("rejects negative amounts", () => {
    const q = quoteUS();
    const bad: TaxQuote = {
      ...q,
      items: [{ ...q.items[0], amount: -1 }],
    };
    expect(() => buildStripeTaxRequestParams(bad)).toThrow(/INVALID_QUOTE/);
  });

  it("rejects empty item list", () => {
    const q = quoteUS();
    expect(() => buildStripeTaxRequestParams({ ...q, items: [] })).toThrow(/INVALID_QUOTE/);
  });
});

// ---------------------------------------------------------------------------
// mapStripeTaxResponseToCalculation
// ---------------------------------------------------------------------------

function stripeResponseUS(): StripeTaxCalculationResponse {
  return {
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
}

describe("mapStripeTaxResponseToCalculation", () => {
  it("populates totals, lines, and stripeCalculationId from the response", () => {
    const calc = mapStripeTaxResponseToCalculation(quoteUS(), stripeResponseUS(), ts(1000));
    expect(calc).toMatchObject({
      quoteId: "quote-us-1",
      stripeCalculationId: "taxcalc_test_1",
      currency: "USD",
      totalTax: 885,
      totalTaxable: 10000,
    });
    expect(calc.lines).toHaveLength(1);
    expect(calc.lines[0]).toMatchObject({
      itemId: "line-1",
      taxAmount: 885,
      jurisdiction: "New York",
      reason: "us_state_taxable_service",
    });
    expect(calc.lines[0].rate).toBeCloseTo(0.08875);
  });

  it("stamps calculatedAt = now and cacheExpiresAt = now + 900s by default", () => {
    const calc = mapStripeTaxResponseToCalculation(quoteUS(), stripeResponseUS(), ts(1000));
    expect(calc.calculatedAt.seconds).toBe(1000);
    expect(calc.cacheExpiresAt.seconds).toBe(1000 + 900);
  });

  it("respects an explicit ttlSeconds override", () => {
    const calc = mapStripeTaxResponseToCalculation(quoteUS(), stripeResponseUS(), ts(1000), 60);
    expect(calc.cacheExpiresAt.seconds).toBe(1000 + 60);
  });

  it("maps reverse_charge to eu_vat_reverse_charge with 0 tax", () => {
    const response: StripeTaxCalculationResponse = {
      id: "taxcalc_test_2",
      amount_total: 5000,
      tax_amount_exclusive: 0,
      currency: "eur",
      line_items: {
        data: [
          {
            reference: "sub-1",
            amount: 5000,
            amount_tax: 0,
            tax_breakdown: [
              {
                amount: 0,
                tax_rate_details: { percentage_decimal: "0", country: "FR" },
                jurisdiction: { display_name: "France (B2B reverse charge)", country: "FR" },
                taxability_reason: "reverse_charge",
              },
            ],
          },
        ],
      },
    };
    const calc = mapStripeTaxResponseToCalculation(quoteB2BReverseCharge(), response, ts(2000));
    expect(calc.totalTax).toBe(0);
    expect(calc.lines[0].reason).toBe("eu_vat_reverse_charge");
  });

  it("falls back to out_of_scope when taxability_reason is unknown", () => {
    const response: StripeTaxCalculationResponse = {
      id: "taxcalc_test_3",
      amount_total: 10000,
      tax_amount_exclusive: 0,
      currency: "usd",
      line_items: {
        data: [
          {
            reference: "line-1",
            amount: 10000,
            amount_tax: 0,
            tax_breakdown: [
              {
                amount: 0,
                taxability_reason: "something_new_from_stripe",
              },
            ],
          },
        ],
      },
    };
    const calc = mapStripeTaxResponseToCalculation(quoteUS(), response, ts(1000));
    expect(calc.lines[0].reason).toBe("out_of_scope");
  });

  it("handles missing line_items gracefully (zero tax across the board)", () => {
    const response: StripeTaxCalculationResponse = {
      id: "taxcalc_test_4",
      amount_total: 10000,
      tax_amount_exclusive: 0,
      currency: "usd",
    };
    const calc = mapStripeTaxResponseToCalculation(quoteUS(), response, ts(1000));
    expect(calc.totalTax).toBe(0);
    expect(calc.lines).toHaveLength(1);
    expect(calc.lines[0].taxAmount).toBe(0);
    expect(calc.lines[0].reason).toBe("out_of_scope");
  });
});
