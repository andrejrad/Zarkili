/**
 * availabilitySummaryTrigger.test.ts — W38-DEBT-1
 *
 * Unit tests for the pure-business-logic exports of availabilitySummaryTrigger.
 * All Firestore calls are replaced by a minimal in-memory stub so no emulator
 * is required.
 */

import { describe, it, expect, beforeEach } from "vitest";

import {
  countConfirmedBookings,
  extractBookingDateInfo,
  writeAvailabilitySummary,
} from "../src/availabilitySummaryTrigger";

// ---------------------------------------------------------------------------
// In-memory Firestore stub
// ---------------------------------------------------------------------------

type BookingDoc = {
  tenantId: string;
  date: string;
  status: string;
};

type AvailabilityDoc = {
  date: string;
  tenantId: string;
  bookedCount: number;
  updatedAt: unknown;
};

interface StubStore {
  bookings: Map<string, BookingDoc>;
  availability: Map<string, AvailabilityDoc>;
}

function makeFirestoreStub(initialBookings: Array<{ id: string } & BookingDoc>) {
  const store: StubStore = {
    bookings: new Map(initialBookings.map((b) => [b.id, b])),
    availability: new Map(),
  };

  function makeQuery(docs: BookingDoc[]) {
    return {
      where: (field: string, op: string, value: unknown) => {
        let filtered = docs;
        filtered = filtered.filter((d) => {
          const v = d[field as keyof BookingDoc];
          if (op === "==") return v === value;
          if (op === "in") return (value as unknown[]).includes(v);
          return true;
        });
        return makeQuery(filtered);
      },
      get: async () => ({
        size: filtered.length,
        docs: filtered.map((d) => ({ data: () => d })),
      }),
    };

    // closure over `filtered` per call — rebind so inner reference is correct
    function filtered() { return docs; } // unused, pattern below is self-contained
  }

  // Simpler: flat query builder carrying a mutable filter list
  function collection(name: string) {
    return {
      _name: name,
      _filters: [] as Array<{ field: string; op: string; value: unknown }>,
      where(field: string, op: string, value: unknown) {
        this._filters.push({ field, op, value });
        return this;
      },
      async get() {
        if (name === "bookings") {
          let docs = Array.from(store.bookings.values());
          for (const f of this._filters) {
            docs = docs.filter((d) => {
              const v = d[f.field as keyof BookingDoc];
              if (f.op === "==") return v === f.value;
              if (f.op === "in") return (f.value as unknown[]).includes(v);
              return true;
            });
          }
          return { size: docs.length, docs: docs.map((d) => ({ data: () => d })) };
        }
        return { size: 0, docs: [] };
      },
    };
  }

  // Tenant → subcollection path simulation
  function doc(tenantId: string) {
    return {
      collection: (subName: string) => {
        if (subName === "bookings") {
          return {
            _filters: [] as Array<{ field: string; op: string; value: unknown }>,
            where(field: string, op: string, value: unknown) {
              this._filters.push({ field, op, value });
              return this;
            },
            async get() {
              let docs = Array.from(store.bookings.values()).filter(
                (b) => b.tenantId === tenantId,
              );
              for (const f of this._filters) {
                docs = docs.filter((d) => {
                  const v = d[f.field as keyof BookingDoc];
                  if (f.op === "==") return v === f.value;
                  if (f.op === "in") return (f.value as unknown[]).includes(v);
                  return true;
                });
              }
              return { size: docs.length, docs: docs.map((d) => ({ data: () => d })) };
            },
          };
        }
        if (subName === "availability") {
          return {
            doc: (dateId: string) => ({
              set: async (data: AvailabilityDoc, _opts: unknown) => {
                store.availability.set(`${tenantId}/${dateId}`, { ...data });
              },
            }),
          };
        }
        throw new Error(`Unknown subcollection: ${subName}`);
      },
    };
  }

  const db = {
    collection: (_name: string) => collection(_name),
    collection_tenant_path: (tenantId: string) => doc(tenantId),
  };

  // Override: the real adapter calls db.collection("tenants").doc(tid).collection("bookings")
  // We model this by making "tenants" return objects with .doc().
  const adapatedDb = {
    collection: (name: string) => {
      if (name === "tenants") {
        return {
          doc: (tenantId: string) => doc(tenantId),
        };
      }
      return collection(name);
    },
  } as unknown as FirebaseFirestore.Firestore;

  return { db: adapatedDb, store };
}

// ---------------------------------------------------------------------------
// extractBookingDateInfo — pure, no async
// ---------------------------------------------------------------------------

describe("extractBookingDateInfo", () => {
  it("returns info from after-doc (create/update)", () => {
    const result = extractBookingDateInfo(
      undefined,
      { tenantId: "salon-1", date: "2025-07-01", status: "confirmed" },
    );
    expect(result).toEqual({ tenantId: "salon-1", date: "2025-07-01" });
  });

  it("falls back to before-doc (delete)", () => {
    const result = extractBookingDateInfo(
      { tenantId: "salon-2", date: "2025-07-02", status: "confirmed" },
      undefined,
    );
    expect(result).toEqual({ tenantId: "salon-2", date: "2025-07-02" });
  });

  it("returns null when both before and after are undefined", () => {
    expect(extractBookingDateInfo(undefined, undefined)).toBeNull();
  });

  it("returns null when tenantId is missing", () => {
    expect(extractBookingDateInfo(undefined, { date: "2025-07-01", status: "confirmed" })).toBeNull();
  });

  it("returns null when date format is invalid", () => {
    expect(
      extractBookingDateInfo(undefined, { tenantId: "t1", date: "01-07-2025", status: "confirmed" }),
    ).toBeNull();
  });

  it("returns null when date is missing altogether", () => {
    expect(extractBookingDateInfo(undefined, { tenantId: "t1", status: "confirmed" })).toBeNull();
  });

  it("prefers after over before when both present", () => {
    const result = extractBookingDateInfo(
      { tenantId: "old", date: "2025-06-30", status: "confirmed" },
      { tenantId: "new", date: "2025-07-01", status: "confirmed" },
    );
    expect(result).toEqual({ tenantId: "new", date: "2025-07-01" });
  });
});

// ---------------------------------------------------------------------------
// countConfirmedBookings
// ---------------------------------------------------------------------------

describe("countConfirmedBookings", () => {
  let store: ReturnType<typeof makeFirestoreStub>;

  beforeEach(() => {
    store = makeFirestoreStub([
      { id: "b1", tenantId: "t1", date: "2025-07-10", status: "confirmed" },
      { id: "b2", tenantId: "t1", date: "2025-07-10", status: "confirmed" },
      { id: "b3", tenantId: "t1", date: "2025-07-10", status: "cancelled" },
      { id: "b4", tenantId: "t1", date: "2025-07-10", status: "rescheduled" },
      { id: "b5", tenantId: "t1", date: "2025-07-11", status: "confirmed" },
      { id: "b6", tenantId: "t2", date: "2025-07-10", status: "confirmed" },
    ]);
  });

  it("counts only confirmed+rescheduled for the target date and tenant", async () => {
    const count = await countConfirmedBookings(store.db, "t1", "2025-07-10");
    // b1 (confirmed) + b2 (confirmed) + b4 (rescheduled) = 3
    expect(count).toBe(3);
  });

  it("excludes other tenants", async () => {
    const count = await countConfirmedBookings(store.db, "t2", "2025-07-10");
    expect(count).toBe(1);
  });

  it("excludes other dates", async () => {
    const count = await countConfirmedBookings(store.db, "t1", "2025-07-11");
    expect(count).toBe(1);
  });

  it("returns 0 when no bookings exist for the date", async () => {
    const count = await countConfirmedBookings(store.db, "t1", "2025-12-31");
    expect(count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// writeAvailabilitySummary
// ---------------------------------------------------------------------------

describe("writeAvailabilitySummary", () => {
  let store: ReturnType<typeof makeFirestoreStub>;

  beforeEach(() => {
    store = makeFirestoreStub([
      { id: "b1", tenantId: "t1", date: "2025-08-01", status: "confirmed" },
      { id: "b2", tenantId: "t1", date: "2025-08-01", status: "confirmed" },
    ]);
  });

  it("writes the correct bookedCount to the availability doc", async () => {
    await writeAvailabilitySummary(store.db, "t1", "2025-08-01");
    const saved = store.store.availability.get("t1/2025-08-01");
    expect(saved).toBeDefined();
    expect(saved?.bookedCount).toBe(2);
    expect(saved?.tenantId).toBe("t1");
    expect(saved?.date).toBe("2025-08-01");
  });

  it("writes 0 when no confirmed bookings exist", async () => {
    await writeAvailabilitySummary(store.db, "t1", "2025-09-15");
    const saved = store.store.availability.get("t1/2025-09-15");
    expect(saved?.bookedCount).toBe(0);
  });

  it("overwrites an existing summary with fresh count", async () => {
    // Pre-seed a stale value
    store.store.availability.set("t1/2025-08-01", {
      date: "2025-08-01",
      tenantId: "t1",
      bookedCount: 99,
      updatedAt: null,
    });
    await writeAvailabilitySummary(store.db, "t1", "2025-08-01");
    const saved = store.store.availability.get("t1/2025-08-01");
    expect(saved?.bookedCount).toBe(2);
  });
});
