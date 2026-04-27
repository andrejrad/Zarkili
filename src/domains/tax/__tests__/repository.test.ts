import type { Timestamp } from "firebase/firestore";

import type { TaxCalculation } from "../model";
import { createTaxRepository } from "../repository";

// ---------------------------------------------------------------------------
// Slim Firestore mock (singleton doc reads/writes)
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function doc(_db: unknown, colPath: string, docId: string) {
    return { _key: `${colPath}/${docId}`, id: docId };
  }
  async function getDoc(ref: { _key: string; id: string }) {
    const data = store[ref._key];
    return {
      exists: () => data !== undefined,
      data: () => (data ? { ...data } : null),
      id: ref.id,
    };
  }
  async function setDoc(ref: { _key: string }, data: Record<string, unknown>) {
    store[ref._key] = { ...data };
  }
  return { db: {} as unknown, store, doc, getDoc, setDoc };
}

let mock = makeFirestoreMock();

jest.mock("firebase/firestore", () => ({
  Timestamp: { now: () => ({ seconds: 9_999, nanoseconds: 0 }) },
  doc: (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc: (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc: (...args: unknown[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
}));

beforeEach(() => {
  mock = makeFirestoreMock();
});

function ts(seconds: number): Timestamp {
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}

function sampleCalc(quoteId = "q1"): TaxCalculation {
  return {
    quoteId,
    context: "salon_payment",
    totalTax: 450,
    totalTaxable: 10_000,
    currency: "usd",
    lines: [
      {
        itemId: "li_1",
        taxableAmount: 10_000,
        taxAmount: 450,
        rate: 0.045,
        jurisdiction: "NYC local sales tax surcharge",
        reason: "nyc_surcharge",
      },
    ],
    stripeCalculationId: null,
    calculatedAt: ts(1_000),
    cacheExpiresAt: ts(1_900),
  };
}

describe("TaxRepository", () => {
  it("returns null for unknown quote", async () => {
    const repo = createTaxRepository(mock.db as never);
    expect(await repo.getCachedCalculation("tenant_a", "missing")).toBeNull();
  });

  it("persists tenant-scoped calculation under tenants/{tenantId}/taxCalculations", async () => {
    const repo = createTaxRepository(mock.db as never);
    await repo.saveCalculation("tenant_a", sampleCalc());
    expect(Object.keys(mock.store)).toEqual(["tenants/tenant_a/taxCalculations/q1"]);
    const got = await repo.getCachedCalculation("tenant_a", "q1");
    expect(got?.totalTax).toBe(450);
  });

  it("persists platform calculation when tenantId is null", async () => {
    const repo = createTaxRepository(mock.db as never);
    await repo.saveCalculation(null, sampleCalc("plat1"));
    expect(Object.keys(mock.store)[0]).toContain("platform/__platform__/taxCalculations/plat1");
  });

  it("isolates calculations across tenants", async () => {
    const repo = createTaxRepository(mock.db as never);
    await repo.saveCalculation("tenant_a", sampleCalc("shared"));
    expect(await repo.getCachedCalculation("tenant_b", "shared")).toBeNull();
  });
});
