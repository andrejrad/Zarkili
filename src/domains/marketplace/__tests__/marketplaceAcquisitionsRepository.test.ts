import {
  createMarketplaceAcquisitionsRepository,
  persistMarketplaceAcquisition,
} from "../marketplaceAcquisitionsRepository";
import type { MarketplaceAttribution } from "../model";

// ---------------------------------------------------------------------------
// In-memory Firestore mock (mirrors marketplace/__tests__/repository.test.ts)
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function doc(_db: unknown, path?: string, id?: string) {
    return { _key: `${path}/${id}`, id: id as string };
  }
  async function getDoc(ref: { _key: string; id: string }) {
    const data = store[ref._key];
    return { exists: () => data !== undefined, data: () => (data ? { ...data } : null), id: ref.id };
  }
  async function setDoc(ref: { _key: string }, data: Record<string, unknown>) {
    store[ref._key] = { ...data };
  }
  function collection(_db: unknown, path: string) { return { _path: path }; }
  function query(colRef: { _path: string }) { return { _path: colRef._path }; }
  async function getDocs(q: { _path: string }) {
    const prefix = q._path + "/";
    const matches = Object.entries(store)
      .filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes("/"))
      .map(([key, data]) => ({ key, data }));
    return {
      docs: matches.map(({ key, data }) => ({
        data: () => ({ ...data }),
        id: key.split("/").pop()!,
        exists: () => true,
      })),
    };
  }

  return { db: {} as unknown, store, doc, getDoc, setDoc, collection, query, getDocs };
}

let mock = makeFirestoreMock();

jest.mock("firebase/firestore", () => ({
  doc:        (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc:     (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc:     (...args: unknown[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
  collection: (...args: unknown[]) => mock.collection(...(args as Parameters<typeof mock.collection>)),
  query:      (...args: unknown[]) => mock.query(...(args as Parameters<typeof mock.query>)),
  getDocs:    (...args: unknown[]) => mock.getDocs(...(args as Parameters<typeof mock.getDocs>)),
}));

beforeEach(() => { mock = makeFirestoreMock(); });

function makeRepo() { return createMarketplaceAcquisitionsRepository(mock.db as never); }

const ATTRIBUTION: MarketplaceAttribution = {
  tenantId: "salon-1",
  customerUserId: "cust-9",
  sourcePostId: "post-7",
  sourceTenantId: "salon-1",
  capturedAt: 1_700_000_000_000,
};

// ---------------------------------------------------------------------------
// saveAcquisition
// ---------------------------------------------------------------------------

describe("MarketplaceAcquisitionsRepository.saveAcquisition", () => {
  it("writes the attribution to tenants/{tid}/marketplaceAcquisitions/{bookingId}", async () => {
    const repo = makeRepo();
    await repo.saveAcquisition("booking-1", ATTRIBUTION);
    const stored = mock.store["tenants/salon-1/marketplaceAcquisitions/booking-1"];
    expect(stored).toBeDefined();
    expect(stored).toMatchObject({
      bookingId: "booking-1",
      tenantId: "salon-1",
      customerUserId: "cust-9",
      sourcePostId: "post-7",
      sourceTenantId: "salon-1",
      capturedAt: 1_700_000_000_000,
    });
  });

  it("is idempotent — second write with same bookingId overwrites in place", async () => {
    const repo = makeRepo();
    await repo.saveAcquisition("booking-1", ATTRIBUTION);
    await repo.saveAcquisition("booking-1", { ...ATTRIBUTION, capturedAt: 2_000_000_000_000 });
    expect(Object.keys(mock.store).length).toBe(1);
    expect(mock.store["tenants/salon-1/marketplaceAcquisitions/booking-1"]?.capturedAt).toBe(2_000_000_000_000);
  });

  it("throws INVALID_ATTRIBUTION when bookingId is empty", async () => {
    const repo = makeRepo();
    await expect(repo.saveAcquisition("", ATTRIBUTION)).rejects.toThrow(/INVALID_ATTRIBUTION/);
    await expect(repo.saveAcquisition("   ", ATTRIBUTION)).rejects.toThrow(/INVALID_ATTRIBUTION/);
  });

  it("throws INVALID_ATTRIBUTION when tenantId is empty", async () => {
    const repo = makeRepo();
    await expect(
      repo.saveAcquisition("booking-1", { ...ATTRIBUTION, tenantId: "" }),
    ).rejects.toThrow(/INVALID_ATTRIBUTION/);
  });
});

// ---------------------------------------------------------------------------
// getAcquisition / listAcquisitions
// ---------------------------------------------------------------------------

describe("MarketplaceAcquisitionsRepository.getAcquisition", () => {
  it("returns null for a missing record", async () => {
    const repo = makeRepo();
    expect(await repo.getAcquisition("salon-1", "missing-booking")).toBeNull();
  });

  it("round-trips the attribution payload", async () => {
    const repo = makeRepo();
    await repo.saveAcquisition("booking-1", ATTRIBUTION);
    const got = await repo.getAcquisition("salon-1", "booking-1");
    expect(got).toMatchObject(ATTRIBUTION);
  });

  it("scopes lookups to the requested tenant", async () => {
    const repo = makeRepo();
    await repo.saveAcquisition("booking-1", ATTRIBUTION);
    expect(await repo.getAcquisition("salon-2", "booking-1")).toBeNull();
  });
});

describe("MarketplaceAcquisitionsRepository.listAcquisitions", () => {
  it("returns all acquisitions for a tenant and excludes other tenants", async () => {
    const repo = makeRepo();
    await repo.saveAcquisition("booking-1", ATTRIBUTION);
    await repo.saveAcquisition("booking-2", { ...ATTRIBUTION, customerUserId: "cust-10" });
    await repo.saveAcquisition("booking-3", {
      ...ATTRIBUTION,
      tenantId: "salon-2",
      customerUserId: "cust-11",
    });

    const list = await repo.listAcquisitions("salon-1");
    expect(list).toHaveLength(2);
    expect(list.map((a) => a.customerUserId).sort()).toEqual(["cust-10", "cust-9"]);
  });
});

// ---------------------------------------------------------------------------
// persistMarketplaceAcquisition (booking pipeline helper)
// ---------------------------------------------------------------------------

describe("persistMarketplaceAcquisition", () => {
  it("builds attribution via attributeAcquisition then saves it", async () => {
    const repo = makeRepo();
    const result = await persistMarketplaceAcquisition(repo, {
      tenantId: "salon-1",
      customerUserId: "cust-9",
      bookingId: "booking-42",
      sourcePostId: "post-7",
      capturedAt: 1_700_000_000_000,
    });

    expect(result).toMatchObject({
      tenantId: "salon-1",
      customerUserId: "cust-9",
      sourcePostId: "post-7",
      sourceTenantId: "salon-1", // defaults to tenantId
      capturedAt: 1_700_000_000_000,
    });
    expect(mock.store["tenants/salon-1/marketplaceAcquisitions/booking-42"]).toBeDefined();
  });

  it("preserves an explicit sourceTenantId different from the booking salon", async () => {
    const repo = makeRepo();
    const result = await persistMarketplaceAcquisition(repo, {
      tenantId: "salon-1",
      customerUserId: "cust-9",
      bookingId: "booking-42",
      sourceTenantId: "salon-99",
      capturedAt: 1_700_000_000_000,
    });
    expect(result.sourceTenantId).toBe("salon-99");
  });

  it("propagates INVALID_ATTRIBUTION from attributeAcquisition", async () => {
    const repo = makeRepo();
    await expect(
      persistMarketplaceAcquisition(repo, {
        tenantId: "",
        customerUserId: "cust-9",
        bookingId: "booking-42",
      }),
    ).rejects.toThrow(/INVALID_ATTRIBUTION/);
  });

  it("propagates INVALID_ATTRIBUTION when bookingId is missing", async () => {
    const repo = makeRepo();
    await expect(
      persistMarketplaceAcquisition(repo, {
        tenantId: "salon-1",
        customerUserId: "cust-9",
        bookingId: "",
      }),
    ).rejects.toThrow(/INVALID_ATTRIBUTION/);
  });
});
