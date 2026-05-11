/**
 * w38RefundDataService.test.tsx
 *
 * W38-DEBT-4 — client-side refund data service tests.
 *
 * Covers:
 *   createRefundDataService / getRefundByBookingId  (9 tests)
 */

import { createRefundDataService } from "../src/app/bookings/refundDataService";

// ---------------------------------------------------------------------------
// Firebase/firestore mock
// ---------------------------------------------------------------------------

// We mock the entire firebase/firestore module so no Firebase app initialisation
// is needed during Jest.

type DocData = Record<string, unknown>;

interface MockDb {
  __setDoc: (path: string, data: DocData) => void;
  __setQueryResults: (colPath: string, docs: DocData[]) => void;
}

// Intercept calls that the service makes:
//   getDocs(query(collection(db, ...)))   → __queryResults
//   getDoc(doc(db, ...))                  → __docs

let __docs: Map<string, DocData>;
let __queryResults: Map<string, DocData[]>;

function resetMocks() {
  __docs = new Map();
  __queryResults = new Map();
}

// Reference objects (just carry a path)
function makeDocRef(path: string) {
  return { path };
}

function makeCollectionRef(path: string) {
  return { path };
}

// query() builds a query object that carries the collection path so we can
// look it up in __queryResults when getDocs is called.
let lastQueryPath = "";
jest.mock("firebase/firestore", () => ({
  collection: (_db: unknown, ...segments: string[]) => {
    const path = segments.join("/");
    lastQueryPath = path;
    return makeCollectionRef(path);
  },
  doc: (_db: unknown, ...segments: string[]) => makeDocRef(segments.join("/")),
  query: (colRef: { path: string }, ..._constraints: unknown[]) => {
    return { __colPath: colRef.path };
  },
  where: () => ({}),
  getDocs: async (q: { __colPath: string }) => {
    const results = __queryResults.get(q.__colPath) ?? [];
    return {
      empty: results.length === 0,
      docs: results.map((data) => ({ data: () => data })),
    };
  },
  getDoc: async (ref: { path: string }) => {
    const data = __docs.get(ref.path);
    return {
      exists: () => data !== undefined,
      data: () => data,
    };
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFakeDb(): MockDb {
  return {
    __setDoc(path, data) {
      __docs.set(path, data);
    },
    __setQueryResults(colPath, docs) {
      __queryResults.set(colPath, docs);
    },
  };
}

function fakeTimestamp(isoString: string) {
  const d = new Date(isoString);
  return { toDate: () => d };
}

const TENANT = "t1";
const BOOKING = "b1";
const USER = "u1";
const SERVICE_ID = "svc1";
const LOCATION_ID = "loc1";

function seedHappyPath(db: MockDb) {
  db.__setQueryResults(`tenants/${TENANT}/refunds`, [
    {
      refundId: "re_abc",
      bookingId: BOOKING,
      userId: USER,
      amountMinor: 4500,
      currency: "usd",
      status: "pending",
      requestedAt: fakeTimestamp("2025-06-01T10:00:00Z"),
      processedAt: null,
      failureCode: null,
    } as Record<string, unknown>,
  ]);
  db.__setDoc(`bookings/${BOOKING}`, {
    serviceId: SERVICE_ID,
    locationId: LOCATION_ID,
    date: "2025-06-10",
    startTime: "14:00",
  });
  db.__setDoc(`services/${SERVICE_ID}`, { name: "Haircut" });
  db.__setDoc(`locations/${LOCATION_ID}`, { name: "Downtown Salon" });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createRefundDataService / getRefundByBookingId", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("returns RefundData when refund + all docs exist", async () => {
    const db = makeFakeDb();
    seedHappyPath(db);
    const svc = createRefundDataService(db as unknown as Parameters<typeof createRefundDataService>[0]);
    const result = await svc.getRefundByBookingId(TENANT, BOOKING, USER);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data;
    expect(data.refundId).toBe("re_abc");
    expect(data.status).toBe("pending");
    expect(data.amountUsd).toBeCloseTo(45.0);
    expect(data.salonName).toBe("Downtown Salon");
    expect(data.serviceName).toBe("Haircut");
    expect(data.startsAtIso).toBe("2025-06-10T14:00:00Z");
    expect(data.requestedAtIso).toBe("2025-06-01T10:00:00.000Z");
    expect(data.processedAtIso).toBeUndefined();
    expect(data.failureCode).toBeUndefined();
  });

  it("returns NOT_FOUND when no refund exists for the booking", async () => {
    const db = makeFakeDb();
    // No query results seeded — refunds collection returns empty
    db.__setQueryResults(`tenants/${TENANT}/refunds`, []);
    const svc = createRefundDataService(db as unknown as Parameters<typeof createRefundDataService>[0]);
    const result = await svc.getRefundByBookingId(TENANT, BOOKING, USER);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NOT_FOUND");
  });

  it("falls back to 'Service' and 'Salon' when booking doc is missing", async () => {
    const db = makeFakeDb();
    db.__setQueryResults(`tenants/${TENANT}/refunds`, [
      {
        refundId: "re_xyz",
        bookingId: BOOKING,
        userId: USER,
        amountMinor: 2000,
        currency: "usd",
        status: "pending",
        requestedAt: fakeTimestamp("2025-04-01T09:00:00Z"),
        processedAt: null,
        failureCode: null,
      } as Record<string, unknown>,
    ]);
    // Do NOT seed the booking doc → service falls back
    const svc = createRefundDataService(db as unknown as Parameters<typeof createRefundDataService>[0]);
    const result = await svc.getRefundByBookingId(TENANT, BOOKING, USER);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.serviceName).toBe("Service");
    expect(result.data.salonName).toBe("Salon");
  });

  it("populates processedAtIso when status is 'issued'", async () => {
    const db = makeFakeDb();
    db.__setQueryResults(`tenants/${TENANT}/refunds`, [
      {
        refundId: "re_issued",
        bookingId: BOOKING,
        userId: USER,
        amountMinor: 3000,
        currency: "usd",
        status: "issued",
        requestedAt: fakeTimestamp("2025-05-01T08:00:00Z"),
        processedAt: fakeTimestamp("2025-05-02T12:00:00Z"),
        failureCode: null,
      } as Record<string, unknown>,
    ]);
    db.__setDoc(`bookings/${BOOKING}`, { serviceId: "", locationId: "", date: "", startTime: "" });

    const svc = createRefundDataService(db as unknown as Parameters<typeof createRefundDataService>[0]);
    const result = await svc.getRefundByBookingId(TENANT, BOOKING, USER);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("issued");
    expect(result.data.processedAtIso).toBe("2025-05-02T12:00:00.000Z");
  });

  it("populates failureCode when status is 'denied'", async () => {
    const db = makeFakeDb();
    db.__setQueryResults(`tenants/${TENANT}/refunds`, [
      {
        refundId: "re_denied",
        bookingId: BOOKING,
        userId: USER,
        amountMinor: 5000,
        currency: "usd",
        status: "denied",
        requestedAt: fakeTimestamp("2025-03-10T07:00:00Z"),
        processedAt: fakeTimestamp("2025-03-11T09:00:00Z"),
        failureCode: "expired_or_canceled_card",
      } as Record<string, unknown>,
    ]);
    db.__setDoc(`bookings/${BOOKING}`, { serviceId: "", locationId: "", date: "", startTime: "" });

    const svc = createRefundDataService(db as unknown as Parameters<typeof createRefundDataService>[0]);
    const result = await svc.getRefundByBookingId(TENANT, BOOKING, USER);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("denied");
    expect(result.data.failureCode).toBe("expired_or_canceled_card");
  });

  it("returns ERROR when tenantId is missing", async () => {
    const db = makeFakeDb();
    const svc = createRefundDataService(db as unknown as Parameters<typeof createRefundDataService>[0]);
    const result = await svc.getRefundByBookingId("", BOOKING, USER);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ERROR");
  });

  it("returns ERROR when bookingId is missing", async () => {
    const db = makeFakeDb();
    const svc = createRefundDataService(db as unknown as Parameters<typeof createRefundDataService>[0]);
    const result = await svc.getRefundByBookingId(TENANT, "", USER);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ERROR");
  });

  it("returns ERROR when Firestore throws", async () => {
    const db = makeFakeDb();
    // Seed query results with a getter that throws
    __queryResults.set(`tenants/${TENANT}/refunds`, (() => {
      throw new Error("network error");
    }) as unknown as DocData[]);

    const svc = createRefundDataService(db as unknown as Parameters<typeof createRefundDataService>[0]);
    const result = await svc.getRefundByBookingId(TENANT, BOOKING, USER);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ERROR");
  });

  it("toIso via seconds fallback: handles epoch-second timestamp objects", async () => {
    const db = makeFakeDb();
    // Provide a timestamp with only .seconds (no .toDate)
    const epochSeconds = Math.floor(new Date("2025-07-04T00:00:00Z").getTime() / 1000);
    db.__setQueryResults(`tenants/${TENANT}/refunds`, [
      {
        refundId: "re_epoch",
        bookingId: BOOKING,
        userId: USER,
        amountMinor: 1000,
        currency: "usd",
        status: "pending",
        requestedAt: { seconds: epochSeconds },
        processedAt: null,
        failureCode: null,
      } as Record<string, unknown>,
    ]);
    db.__setDoc(`bookings/${BOOKING}`, { serviceId: "", locationId: "", date: "", startTime: "" });

    const svc = createRefundDataService(db as unknown as Parameters<typeof createRefundDataService>[0]);
    const result = await svc.getRefundByBookingId(TENANT, BOOKING, USER);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.requestedAtIso).toBe(new Date(epochSeconds * 1000).toISOString());
  });
});
