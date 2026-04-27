import type { Timestamp } from "firebase/firestore";

import {
  isEuMemberState,
  isNycAddress,
  qualifiesForEuReverseCharge,
  TaxError,
  usStateTaxesPersonalServices,
  type TaxBuyer,
  type TaxQuote,
  type TaxSeller,
} from "../model";
import type { TaxRepository } from "../repository";
import {
  computeTaxLocally,
  createLocalTaxProvider,
  createTaxService,
  DEFAULT_TAX_CACHE_TTL_SECONDS,
} from "../taxService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ts(seconds: number): Timestamp {
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}

function makeBuyer(over: Partial<TaxBuyer> = {}): TaxBuyer {
  return {
    type: "individual",
    vatId: null,
    address: { country: "US", region: "CA", city: "San Francisco", postalCode: "94110" },
    ...over,
  };
}

function makeSeller(over: Partial<TaxSeller> = {}): TaxSeller {
  return {
    tenantId: "tenant_a",
    address: { country: "US", region: "CA", city: "San Francisco", postalCode: "94110" },
    vatId: null,
    ...over,
  };
}

function makeQuote(over: Partial<TaxQuote> = {}): TaxQuote {
  return {
    quoteId: "q_1",
    context: "salon_payment",
    buyer: makeBuyer(),
    seller: makeSeller(),
    items: [
      { id: "li_1", productType: "service", amount: 10_000, currency: "usd", taxCode: "txcd_20030000" },
    ],
    ...over,
  };
}

// ---------------------------------------------------------------------------
// Pure rule helpers
// ---------------------------------------------------------------------------

describe("usStateTaxesPersonalServices", () => {
  test.each(["CT", "HI", "NM", "SD", "WV"])("returns true for %s", (s) => {
    expect(usStateTaxesPersonalServices(s)).toBe(true);
  });

  test.each(["CA", "NY", "TX", "FL", null])("returns false for %s", (s) => {
    expect(usStateTaxesPersonalServices(s)).toBe(false);
  });
});

describe("isNycAddress", () => {
  it("matches NYC addresses (case/whitespace insensitive)", () => {
    expect(isNycAddress({ country: "US", region: "NY", city: "New York", postalCode: "10001" })).toBe(true);
    expect(isNycAddress({ country: "US", region: "NY", city: " new york ", postalCode: "10001" })).toBe(true);
  });
  it("rejects non-NYC NY addresses", () => {
    expect(isNycAddress({ country: "US", region: "NY", city: "Albany", postalCode: "12203" })).toBe(false);
  });
  it("rejects non-US addresses", () => {
    expect(isNycAddress({ country: "DE", region: null, city: "New York", postalCode: null })).toBe(false);
  });
});

describe("isEuMemberState", () => {
  test.each(["DE", "FR", "IT", "ES", "NL"])("returns true for %s", (c) => {
    expect(isEuMemberState(c)).toBe(true);
  });
  test.each(["US", "GB", "CH", "NO", null])("returns false for %s", (c) => {
    expect(isEuMemberState(c)).toBe(false);
  });
});

describe("qualifiesForEuReverseCharge", () => {
  it("returns true for cross-border B2B with VAT id", () => {
    const buyer = makeBuyer({
      type: "business",
      vatId: "DE123456789",
      address: { country: "DE", region: null, city: "Berlin", postalCode: "10115" },
    });
    const seller = makeSeller({
      address: { country: "FR", region: null, city: "Paris", postalCode: "75001" },
      vatId: "FR987654321",
    });
    expect(qualifiesForEuReverseCharge(buyer, seller)).toBe(true);
  });

  it("returns false for individuals", () => {
    const buyer = makeBuyer({
      type: "individual",
      vatId: "DE123456789",
      address: { country: "DE", region: null, city: "Berlin", postalCode: null },
    });
    const seller = makeSeller({
      address: { country: "FR", region: null, city: "Paris", postalCode: null },
    });
    expect(qualifiesForEuReverseCharge(buyer, seller)).toBe(false);
  });

  it("returns false for missing VAT id", () => {
    const buyer = makeBuyer({
      type: "business",
      vatId: "",
      address: { country: "DE", region: null, city: "Berlin", postalCode: null },
    });
    expect(qualifiesForEuReverseCharge(buyer, makeSeller({ address: { country: "FR", region: null, city: "Paris", postalCode: null } }))).toBe(false);
  });

  it("returns false for domestic EU sale (no reverse-charge)", () => {
    const buyer = makeBuyer({
      type: "business",
      vatId: "DE111111111",
      address: { country: "DE", region: null, city: "Berlin", postalCode: null },
    });
    const seller = makeSeller({
      address: { country: "DE", region: null, city: "Munich", postalCode: null },
    });
    expect(qualifiesForEuReverseCharge(buyer, seller)).toBe(false);
  });

  it("returns false when buyer outside EU", () => {
    const buyer = makeBuyer({
      type: "business",
      vatId: "GB123456789",
      address: { country: "GB", region: null, city: "London", postalCode: null },
    });
    expect(qualifiesForEuReverseCharge(buyer, makeSeller({ address: { country: "FR", region: null, city: "Paris", postalCode: null } }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeTaxLocally — US scenarios
// ---------------------------------------------------------------------------

describe("computeTaxLocally — US states", () => {
  test.each([
    ["CT", 0.0635],
    ["HI", 0.04],
    ["NM", 0.05125],
    ["SD", 0.045],
    ["WV", 0.06],
  ])("US state %s charges sales tax on personal services at %s", (state, expectedRate) => {
    const quote = makeQuote({
      buyer: makeBuyer({ address: { country: "US", region: state, city: "X", postalCode: "00000" } }),
    });
    const calc = computeTaxLocally(quote, ts(1_000));
    expect(calc.lines).toHaveLength(1);
    const [line] = calc.lines;
    expect(line.reason).toBe("us_state_taxable_service");
    expect(line.rate).toBeCloseTo(expectedRate, 5);
    expect(line.taxAmount).toBe(Math.round(10_000 * expectedRate));
    expect(calc.totalTax).toBe(line.taxAmount);
  });

  it("non-taxing US state produces zero tax with audit reason", () => {
    const quote = makeQuote({
      buyer: makeBuyer({ address: { country: "US", region: "CA", city: "LA", postalCode: "90001" } }),
    });
    const calc = computeTaxLocally(quote, ts(1_000));
    expect(calc.totalTax).toBe(0);
    expect(calc.lines[0].reason).toBe("us_state_nontaxable_service");
    expect(calc.lines[0].jurisdiction).toContain("CA");
  });

  it("NYC charges the local 4.5% surcharge on services", () => {
    const quote = makeQuote({
      buyer: makeBuyer({ address: { country: "US", region: "NY", city: "New York", postalCode: "10001" } }),
    });
    const calc = computeTaxLocally(quote, ts(1_000));
    expect(calc.lines[0].reason).toBe("nyc_surcharge");
    expect(calc.lines[0].rate).toBeCloseTo(0.045, 5);
    expect(calc.totalTax).toBe(450);
  });

  it("NY State outside NYC is non-taxable for services", () => {
    const quote = makeQuote({
      buyer: makeBuyer({ address: { country: "US", region: "NY", city: "Albany", postalCode: "12203" } }),
    });
    const calc = computeTaxLocally(quote, ts(1_000));
    expect(calc.totalTax).toBe(0);
    expect(calc.lines[0].reason).toBe("us_state_nontaxable_service");
  });

  it("US SaaS is delegated to Stripe Tax (out of scope locally)", () => {
    const quote = makeQuote({
      context: "saas_subscription",
      items: [{ id: "saas", productType: "saas", amount: 9_900, currency: "usd", taxCode: "txcd_10103001" }],
      buyer: makeBuyer({ address: { country: "US", region: "WA", city: "Seattle", postalCode: "98101" } }),
    });
    const calc = computeTaxLocally(quote, ts(1_000));
    expect(calc.totalTax).toBe(0);
    expect(calc.lines[0].reason).toBe("out_of_scope");
    expect(calc.lines[0].jurisdiction).toContain("SaaS");
  });
});

// ---------------------------------------------------------------------------
// computeTaxLocally — EU scenarios
// ---------------------------------------------------------------------------

describe("computeTaxLocally — EU VAT", () => {
  it("applies German VAT on B2C cross-border sale", () => {
    const quote = makeQuote({
      items: [{ id: "li_1", productType: "service", amount: 10_000, currency: "eur", taxCode: "txcd_20030000" }],
      buyer: makeBuyer({
        type: "individual",
        vatId: null,
        address: { country: "DE", region: null, city: "Berlin", postalCode: "10115" },
      }),
      seller: makeSeller({
        address: { country: "FR", region: null, city: "Paris", postalCode: "75001" },
        vatId: "FR987654321",
      }),
    });
    const calc = computeTaxLocally(quote, ts(1_000));
    expect(calc.lines[0].reason).toBe("eu_vat_standard");
    expect(calc.lines[0].rate).toBeCloseTo(0.19, 5);
    expect(calc.totalTax).toBe(1_900);
  });

  it("applies reverse-charge for B2B between EU member states", () => {
    const quote = makeQuote({
      items: [{ id: "li_1", productType: "service", amount: 10_000, currency: "eur", taxCode: "txcd_20030000" }],
      buyer: makeBuyer({
        type: "business",
        vatId: "DE123456789",
        address: { country: "DE", region: null, city: "Berlin", postalCode: "10115" },
      }),
      seller: makeSeller({
        address: { country: "FR", region: null, city: "Paris", postalCode: "75001" },
        vatId: "FR987654321",
      }),
    });
    const calc = computeTaxLocally(quote, ts(1_000));
    expect(calc.totalTax).toBe(0);
    expect(calc.lines[0].reason).toBe("eu_vat_reverse_charge");
  });
});

// ---------------------------------------------------------------------------
// computeTaxLocally — guards
// ---------------------------------------------------------------------------

describe("computeTaxLocally — guards", () => {
  it("rejects empty item list", () => {
    expect(() => computeTaxLocally(makeQuote({ items: [] }), ts(1))).toThrow(TaxError);
  });
  it("rejects mixed currencies", () => {
    expect(() =>
      computeTaxLocally(
        makeQuote({
          items: [
            { id: "a", productType: "service", amount: 100, currency: "usd", taxCode: "x" },
            { id: "b", productType: "service", amount: 100, currency: "eur", taxCode: "x" },
          ],
        }),
        ts(1),
      ),
    ).toThrow(/Mixed currencies/);
  });
  it("rejects negative amounts", () => {
    expect(() =>
      computeTaxLocally(
        makeQuote({
          items: [{ id: "a", productType: "service", amount: -1, currency: "usd", taxCode: "x" }],
        }),
        ts(1),
      ),
    ).toThrow(/negative amount/);
  });
  it("stamps cacheExpiresAt at TTL after now", () => {
    const calc = computeTaxLocally(makeQuote(), ts(1_000), 600);
    expect(calc.cacheExpiresAt.seconds).toBe(1_600);
  });
});

// ---------------------------------------------------------------------------
// TaxService — cache + idempotency
// ---------------------------------------------------------------------------

function makeRepoMock() {
  const store = new Map<string, import("../model").TaxCalculation>();
  const repo: TaxRepository = {
    async getCachedCalculation(tenantId: string | null, quoteId: string) {
      const key = `${tenantId ?? "__platform__"}/${quoteId}`;
      return store.get(key) ?? null;
    },
    async saveCalculation(tenantId: string | null, calc: import("../model").TaxCalculation) {
      const key = `${tenantId ?? "__platform__"}/${calc.quoteId}`;
      store.set(key, calc);
    },
  };
  return { repo, store };
}

describe("TaxService", () => {
  it("returns provider result on first call and caches it", async () => {
    const { repo } = makeRepoMock();
    const provider = createLocalTaxProvider();
    let now = ts(1_000);
    const svc = createTaxService(repo, provider, { now: () => now });
    const calc1 = await svc.quote(makeQuote());
    expect(calc1.totalTax).toBe(0); // CA non-taxable
    expect(calc1.calculatedAt.seconds).toBe(1_000);

    // Second call — within TTL — must return cache (provider not invoked).
    let providerCalls = 0;
    const provider2 = {
      async calculate() {
        providerCalls += 1;
        return calc1;
      },
    };
    now = ts(1_500);
    const svc2 = createTaxService(repo, provider2, { now: () => now });
    const calc2 = await svc2.quote(makeQuote());
    expect(calc2.calculatedAt.seconds).toBe(1_000);
    expect(providerCalls).toBe(0);
  });

  it("calls provider again after cache expiry", async () => {
    const { repo } = makeRepoMock();
    const provider = createLocalTaxProvider();
    let now = ts(1_000);
    const svc = createTaxService(repo, provider, { now: () => now });
    await svc.quote(makeQuote());

    now = ts(1_000 + DEFAULT_TAX_CACHE_TTL_SECONDS + 1);
    const calc = await svc.quote(makeQuote());
    expect(calc.calculatedAt.seconds).toBe(now.seconds);
  });

  it("rejects empty quoteId", async () => {
    const { repo } = makeRepoMock();
    const svc = createTaxService(repo, createLocalTaxProvider());
    await expect(svc.quote(makeQuote({ quoteId: "" }))).rejects.toThrow(TaxError);
  });
});
