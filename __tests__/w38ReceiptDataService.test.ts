/**
 * w38ReceiptDataService.test.ts — W38-DEBT-3
 *
 * Unit tests for createReceiptDataService / getReceiptByBookingId.
 *
 * Covers:
 *   - Full happy path: charge found → receipt data assembled (8 fields)
 *   - No charge → NOT_FOUND result
 *   - Payment method missing → "Card on file" fallback
 *   - Location missing → "Salon" / empty address fallback
 *   - Service missing → "Service" name fallback
 *   - Zero tip → tip omitted from check (tipUsd === 0)
 *   - Zero tax → taxUsd === 0
 *   - Missing tenantId/bookingId/userId → ERROR result
 *   - Firestore error → ERROR result with message
 */

import { createReceiptDataService } from "../src/app/bookings/receiptDataService";

// ---------------------------------------------------------------------------
// Firestore mock (path-aware subcollection support)
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  // Flat store keyed by full Firestore path, e.g. "tenants/t1/charges/c1"
  const store: Record<string, Record<string, unknown>> = {};

  /**
   * Build a path key from variadic segments.
   * Matches the Firebase SDK signature variants:
   *   doc(db, "col", "id")
   *   doc(db, "col1", "id1", "col2", "id2")
   */
  function doc(_db: unknown, ...segments: string[]) {
    const key = segments.join("/");
    const id = segments[segments.length - 1];
    return { _key: key, id, path: key };
  }

  /**
   * collection(db, ...segments) → a query builder stub.
   */
  function collection(_db: unknown, ...segments: string[]) {
    return { _path: segments.join("/"), _wheres: [] as Array<{ field: string; op: string; value: unknown }> };
  }

  function where(field: string, op: string, value: unknown) {
    return { field, op, value };
  }

  function query(
    colRef: { _path: string; _wheres: Array<{ field: string; op: string; value: unknown }> },
    ...filters: Array<{ field: string; op: string; value: unknown }>
  ) {
    return { _path: colRef._path, _wheres: filters };
  }

  async function getDocs(q: { _path: string; _wheres: Array<{ field: string; op: string; value: unknown }> }) {
    const prefix = `${q._path}/`;
    const docs = Object.entries(store)
      .filter(([key]) => key.startsWith(prefix))
      .filter(([, data]) =>
        q._wheres.every(({ field, op, value }) => {
          if (op === "==") return (data as Record<string, unknown>)[field] === value;
          return true;
        }),
      )
      .map(([key, data]) => {
        const id = key.split("/").pop() ?? key;
        return { id, data: () => data };
      });
    return { empty: docs.length === 0, docs };
  }

  async function getDoc(ref: { _key: string; id: string }) {
    const data = store[ref._key];
    return {
      exists: () => data !== undefined,
      data: () => data ?? null,
      id: ref.id,
    };
  }

  /** Seed helper: write a document to the in-memory store. */
  function seed(path: string, data: Record<string, unknown>) {
    store[path] = data;
  }

  const db = {} as unknown;
  return { db, doc, collection, where, query, getDocs, getDoc, seed };
}

// ---------------------------------------------------------------------------
// Jest module mock wiring
// ---------------------------------------------------------------------------

let mock: ReturnType<typeof makeFirestoreMock>;

jest.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) =>
    mock.collection(...(args as [unknown, ...string[]])),
  doc: (...args: unknown[]) =>
    mock.doc(...(args as [unknown, ...string[]])),
  where: (...args: unknown[]) =>
    mock.where(...(args as [string, string, unknown])),
  query: (...args: unknown[]) =>
    mock.query(
      ...(args as [
        { _path: string; _wheres: Array<{ field: string; op: string; value: unknown }> },
        ...Array<{ field: string; op: string; value: unknown }>
      ])
    ),
  getDocs: (...args: unknown[]) =>
    mock.getDocs(
      ...(args as [{ _path: string; _wheres: Array<{ field: string; op: string; value: unknown }> }])
    ),
  getDoc: (...args: unknown[]) =>
    mock.getDoc(...(args as [{ _key: string; id: string }])),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT_ID = "tenant-abc";
const BOOKING_ID = "booking-123";
const USER_ID = "user-xyz";
const CHARGE_ID = "charge-001";
const SERVICE_ID = "svc-A";
const LOCATION_ID = "loc-A";
const PM_ID = "pm-stripe-1";

function seedHappyPath() {
  mock.seed(`tenants/${TENANT_ID}/charges/${CHARGE_ID}`, {
    chargeId: CHARGE_ID,
    tenantId: TENANT_ID,
    bookingId: BOOKING_ID,
    userId: USER_ID,
    paymentMethodId: PM_ID,
    status: "captured",
    amount: {
      subtotalMinor: 6500,
      discountMinor: 0,
      tipMinor: 1300,
      taxMinor: 520,
      totalMinor: 8320,
      currency: "usd",
    },
    createdAt: { seconds: 1745000000 },
  });

  mock.seed(`bookings/${BOOKING_ID}`, {
    serviceId: SERVICE_ID,
    locationId: LOCATION_ID,
    date: "2026-04-15",
    startTime: "14:30",
  });

  mock.seed(`brands/${TENANT_ID}/locations/${LOCATION_ID}/service_types/${SERVICE_ID}`, {
    name: "Haircut",
    price: 65,
  });

  mock.seed(`locations/${LOCATION_ID}`, {
    name: "Zarkili Main",
    address: { line1: "123 Main St", city: "San Francisco", postalCode: "94105" },
  });

  mock.seed(`clients/${USER_ID}/paymentMethods/${PM_ID}`, {
    brand: "visa",
    last4: "4242",
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mock = makeFirestoreMock();
});

describe("createReceiptDataService.getReceiptByBookingId", () => {
  it("returns full ReceiptData on happy path", async () => {
    seedHappyPath();
    const svc = createReceiptDataService(mock.db as never);
    const result = await svc.getReceiptByBookingId(TENANT_ID, BOOKING_ID, USER_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { data } = result;
    expect(data.chargeId).toBe(CHARGE_ID);
    expect(data.bookingId).toBe(BOOKING_ID);
    expect(data.salonName).toBe("Zarkili Main");
    expect(data.salonAddress).toBe("123 Main St, San Francisco, 94105");
    expect(data.serviceName).toBe("Haircut");
    expect(data.subtotalUsd).toBeCloseTo(65);
    expect(data.taxUsd).toBeCloseTo(5.2);
    expect(data.tipUsd).toBeCloseTo(13);
    expect(data.totalUsd).toBeCloseTo(83.2);
    expect(data.currency).toBe("usd");
    expect(data.paymentMethodLabel).toBe("Visa ending 4242");
  });

  it("returns NOT_FOUND when no charge exists for booking+user", async () => {
    const svc = createReceiptDataService(mock.db as never);
    const result = await svc.getReceiptByBookingId(TENANT_ID, BOOKING_ID, USER_ID);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NOT_FOUND");
  });

  it("returns 'Card on file' when payment method document is missing", async () => {
    seedHappyPath();
    // Remove the payment method doc
    const svc = createReceiptDataService(mock.db as never);
    // Seed a variant with a paymentMethodId that has no matching doc
    mock.seed(`tenants/${TENANT_ID}/charges/${CHARGE_ID}`, {
      chargeId: CHARGE_ID,
      tenantId: TENANT_ID,
      bookingId: BOOKING_ID,
      userId: USER_ID,
      paymentMethodId: "pm-unknown",
      status: "captured",
      amount: { subtotalMinor: 6500, discountMinor: 0, tipMinor: 0, taxMinor: 0, totalMinor: 6500, currency: "usd" },
      createdAt: { seconds: 1745000000 },
    });

    const result = await svc.getReceiptByBookingId(TENANT_ID, BOOKING_ID, USER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.paymentMethodLabel).toBe("Card on file");
  });

  it("falls back to 'Salon' / empty address when location doc is missing", async () => {
    seedHappyPath();
    // Overwrite booking to point to non-existent location
    mock.seed(`bookings/${BOOKING_ID}`, {
      serviceId: SERVICE_ID,
      locationId: "loc-missing",
      date: "2026-04-15",
      startTime: "14:30",
    });

    const svc = createReceiptDataService(mock.db as never);
    const result = await svc.getReceiptByBookingId(TENANT_ID, BOOKING_ID, USER_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.salonName).toBe("Salon");
    expect(result.data.salonAddress).toBe("");
  });

  it("falls back to 'Service' when service doc is missing", async () => {
    seedHappyPath();
    mock.seed(`bookings/${BOOKING_ID}`, {
      serviceId: "svc-unknown",
      locationId: LOCATION_ID,
      date: "2026-04-15",
      startTime: "14:30",
    });

    const svc = createReceiptDataService(mock.db as never);
    const result = await svc.getReceiptByBookingId(TENANT_ID, BOOKING_ID, USER_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.serviceName).toBe("Service");
  });

  it("tipUsd is 0 when charge has no tip", async () => {
    seedHappyPath();
    mock.seed(`tenants/${TENANT_ID}/charges/${CHARGE_ID}`, {
      chargeId: CHARGE_ID,
      tenantId: TENANT_ID,
      bookingId: BOOKING_ID,
      userId: USER_ID,
      paymentMethodId: PM_ID,
      status: "captured",
      amount: { subtotalMinor: 6500, discountMinor: 0, tipMinor: 0, taxMinor: 0, totalMinor: 6500, currency: "usd" },
      createdAt: { seconds: 1745000000 },
    });

    const svc = createReceiptDataService(mock.db as never);
    const result = await svc.getReceiptByBookingId(TENANT_ID, BOOKING_ID, USER_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.tipUsd).toBe(0);
    expect(result.data.taxUsd).toBe(0);
  });

  it("returns ERROR when required params are empty strings", async () => {
    const svc = createReceiptDataService(mock.db as never);
    const result = await svc.getReceiptByBookingId("", BOOKING_ID, USER_ID);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ERROR");
  });

  it("returns ERROR when Firestore throws", async () => {
    // Override getDocs to throw
    jest.spyOn(require("firebase/firestore"), "getDocs").mockRejectedValueOnce(
      new Error("Firestore unavailable"),
    );

    const svc = createReceiptDataService(mock.db as never);
    const result = await svc.getReceiptByBookingId(TENANT_ID, BOOKING_ID, USER_ID);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ERROR");
    expect(result.message).toContain("Firestore unavailable");
  });
});
