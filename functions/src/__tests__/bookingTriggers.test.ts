/**
 * bookingTriggers.test.ts
 *
 * Tests the pure `handleBookingWrite` handler using an in-memory Firestore mock.
 * No Cloud Functions runtime, no firebase-admin runtime required.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleBookingWrite, type TriggerBooking } from "../bookingTriggers";

// ---------------------------------------------------------------------------
// Firestore mock
// ---------------------------------------------------------------------------

type DocData = Record<string, unknown>;

function makeFirestoreMock() {
  const docs = new Map<string, DocData>();
  const writtenDocs: Array<{ path: string; data: DocData }> = [];
  const updatedDocs: Array<{ path: string; data: DocData }> = [];

  function docRef(path: string) {
    return {
      get: vi.fn(async () => ({
        exists: docs.has(path),
        data: () => docs.get(path),
      })),
      set: vi.fn(async (data: DocData) => {
        docs.set(path, data);
        writtenDocs.push({ path, data });
      }),
      update: vi.fn(async (data: DocData) => {
        const existing = docs.get(path) ?? {};
        docs.set(path, { ...existing, ...data });
        updatedDocs.push({ path, data });
      }),
    };
  }

  // Simple query mock: returns an array of pre-configured results per collection
  const queryResults = new Map<string, DocData[]>();

  function collectionRef(name: string) {
    const chain: Array<(docs: DocData[]) => DocData[]> = [];

    const q = {
      where: (_field: string, _op: string, _val: unknown) => {
        chain.push((d) =>
          d.filter((doc) => {
            // Minimal where support for tests
            if (_op === "==" && doc[_field] !== _val) return false;
            if (_op === ">=" && typeof doc[_field] === "string" && typeof _val === "string") {
              return doc[_field] >= _val;
            }
            return true;
          }),
        );
        return q;
      },
      orderBy: (_field: string, _dir?: string) => q,
      limit: (_n: number) => q,
      get: vi.fn(async () => {
        let results = queryResults.get(name) ?? [];
        for (const fn of chain) {
          results = fn(results);
        }
        return {
          empty: results.length === 0,
          docs: results.map((data) => ({ data: () => data })),
        };
      }),
    };
    return q;
  }

  const db = {
    collection: vi.fn((name: string) => {
      const col = {
        doc: (id: string) => docRef(`${name}/${id}`),
        // chained query methods
        where: (_f: string, _op: string, _v: unknown) => {
          const q = collectionRef(name);
          return q.where(_f, _op, _v);
        },
      };
      return col;
    }),
    // Convenience helpers for test configuration
    __setDoc: (path: string, data: DocData) => docs.set(path, data),
    __setQueryResults: (collection: string, results: DocData[]) =>
      queryResults.set(collection, results),
    __writtenDocs: writtenDocs,
    __updatedDocs: updatedDocs,
    __docs: docs,
  };

  return db as unknown as FirebaseFirestore.Firestore & {
    __setDoc: (path: string, data: DocData) => void;
    __setQueryResults: (collection: string, results: DocData[]) => void;
    __writtenDocs: Array<{ path: string; data: DocData }>;
    __updatedDocs: Array<{ path: string; data: DocData }>;
    __docs: Map<string, DocData>;
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBooking(overrides: Partial<TriggerBooking> = {}): TriggerBooking {
  return {
    bookingId: "booking-abc",
    tenantId: "tenant-1",
    locationId: "loc-1",
    staffId: "staff-1",
    serviceId: "svc-haircut",
    customerUserId: "user-42",
    date: "2099-10-15",
    startMinutes: 540,
    status: "pending",
    version: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test setup helper
// ---------------------------------------------------------------------------

function setupDb(db: ReturnType<typeof makeFirestoreMock>) {
  // Pre-create the service document
  db.__setDoc("services/svc-haircut", { name: "Haircut", tenantId: "tenant-1" });
  // Pre-create the userTenantAccess document
  db.__setDoc("userTenantAccess/user-42_tenant-1", {
    userId: "user-42",
    tenantId: "tenant-1",
    nextAppointmentAt: null,
    nextAppointmentServiceName: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("handleBookingWrite", () => {
  let db: ReturnType<typeof makeFirestoreMock>;

  beforeEach(() => {
    db = makeFirestoreMock();
    setupDb(db);
  });

  // ── No-op cases ───────────────────────────────────────────────────────────

  it("does nothing when status has not changed", async () => {
    const booking = makeBooking({ status: "pending", version: 1 });
    await handleBookingWrite(booking, booking, db as unknown as FirebaseFirestore.Firestore);
    expect(db.__writtenDocs).toHaveLength(0);
    expect(db.__updatedDocs).toHaveLength(0);
  });

  it("is idempotent — skips processing when marker already exists", async () => {
    const before = makeBooking({ status: "pending", version: 1 });
    const after = makeBooking({ status: "confirmed", version: 2 });
    const eventId = "booking-abc_confirmed_v2";
    // Pre-insert the idempotency marker
    db.__setDoc(`processedBookingEvents/${eventId}`, { eventId });

    await handleBookingWrite(before, after, db as unknown as FirebaseFirestore.Firestore);

    // Nothing else should have been written
    const written = db.__writtenDocs.map((w) => w.path);
    expect(written.filter((p) => p !== `processedBookingEvents/${eventId}`)).toHaveLength(0);
  });

  // ── confirmed transition ──────────────────────────────────────────────────

  it("sets nextAppointmentAt on userTenantAccess when booking is confirmed", async () => {
    const before = makeBooking({ status: "pending", version: 1 });
    const after = makeBooking({ status: "confirmed", version: 2 });

    await handleBookingWrite(before, after, db as unknown as FirebaseFirestore.Firestore);

    const access = db.__docs.get("userTenantAccess/user-42_tenant-1");
    expect(access).toBeDefined();
    expect(access?.nextAppointmentServiceName).toBe("Haircut");
    expect(access?.nextAppointmentAt).toBeDefined();
  });

  it("writes a notification event for booking_confirmed", async () => {
    const before = makeBooking({ status: "pending", version: 1 });
    const after = makeBooking({ status: "confirmed", version: 2 });

    await handleBookingWrite(before, after, db as unknown as FirebaseFirestore.Firestore);

    const eventDoc = db.__docs.get("notificationEvents/booking-abc_confirmed_v2");
    expect(eventDoc).toBeDefined();
    expect(eventDoc?.eventType).toBe("booking_confirmed");
    expect(eventDoc?.tenantId).toBe("tenant-1");
  });

  it("writes an idempotency marker for confirmed transition", async () => {
    const before = makeBooking({ status: "pending", version: 1 });
    const after = makeBooking({ status: "confirmed", version: 2 });

    await handleBookingWrite(before, after, db as unknown as FirebaseFirestore.Firestore);

    const marker = db.__docs.get("processedBookingEvents/booking-abc_confirmed_v2");
    expect(marker).toBeDefined();
    expect(marker?.eventId).toBe("booking-abc_confirmed_v2");
  });

  // ── rescheduled transition ────────────────────────────────────────────────

  it("includes previousDate + previousStartMinutes in rescheduled event payload", async () => {
    const before = makeBooking({
      status: "reschedule_pending",
      date: "2099-10-10",
      startMinutes: 600,
      version: 2,
    });
    const after = makeBooking({
      status: "rescheduled",
      date: "2099-10-15",
      startMinutes: 540,
      version: 3,
    });

    await handleBookingWrite(before, after, db as unknown as FirebaseFirestore.Firestore);

    const eventDoc = db.__docs.get("notificationEvents/booking-abc_rescheduled_v3");
    expect(eventDoc?.eventType).toBe("booking_rescheduled");
    const payload = eventDoc?.payload as Record<string, unknown>;
    expect(payload?.previousDate).toBe("2099-10-10");
    expect(payload?.previousStartMinutes).toBe(600);
  });

  // ── terminal transition: cancelled ───────────────────────────────────────

  it("clears nextAppointmentAt when booking is cancelled and no future bookings exist", async () => {
    // No future bookings in the query
    db.__setQueryResults("bookings", []);

    const before = makeBooking({ status: "confirmed", version: 2 });
    const after = makeBooking({ status: "cancelled", version: 3 });

    await handleBookingWrite(before, after, db as unknown as FirebaseFirestore.Firestore);

    const access = db.__docs.get("userTenantAccess/user-42_tenant-1");
    expect(access?.nextAppointmentAt).toBeNull();
    expect(access?.nextAppointmentServiceName).toBeNull();
  });

  it("sets nextAppointmentAt to next booking when cancelled but another exists", async () => {
    db.__setDoc("services/svc-manicure", { name: "Manicure", tenantId: "tenant-1" });
    db.__setQueryResults("bookings", [
      makeBooking({
        bookingId: "booking-next",
        serviceId: "svc-manicure",
        status: "confirmed",
        date: "2099-11-01",
        startMinutes: 480,
      }),
    ]);

    const before = makeBooking({ status: "confirmed", version: 2 });
    const after = makeBooking({ status: "cancelled", version: 3 });

    await handleBookingWrite(before, after, db as unknown as FirebaseFirestore.Firestore);

    const access = db.__docs.get("userTenantAccess/user-42_tenant-1");
    expect(access?.nextAppointmentServiceName).toBe("Manicure");
    expect(access?.nextAppointmentAt).toBeDefined();
  });

  it("writes a notification event for booking_cancelled", async () => {
    db.__setQueryResults("bookings", []);

    const before = makeBooking({ status: "confirmed", version: 2 });
    const after = makeBooking({ status: "cancelled", version: 3, notes: "Client request" });

    await handleBookingWrite(before, after, db as unknown as FirebaseFirestore.Firestore);

    const eventDoc = db.__docs.get("notificationEvents/booking-abc_cancelled_v3");
    expect(eventDoc?.eventType).toBe("booking_cancelled");
    const payload = eventDoc?.payload as Record<string, unknown>;
    expect(payload?.reason).toBe("Client request");
  });

  // ── terminal transition: rejected ─────────────────────────────────────────

  it("writes a notification event for booking_rejected", async () => {
    db.__setQueryResults("bookings", []);

    const before = makeBooking({ status: "pending", version: 1 });
    const after = makeBooking({ status: "rejected", version: 2 });

    await handleBookingWrite(before, after, db as unknown as FirebaseFirestore.Firestore);

    const eventDoc = db.__docs.get("notificationEvents/booking-abc_rejected_v2");
    expect(eventDoc?.eventType).toBe("booking_rejected");
  });

  // ── terminal transition: completed / no_show (no notification event) ─────

  it("clears nextAppointmentAt on completed without writing a notification event", async () => {
    db.__setQueryResults("bookings", []);

    const before = makeBooking({ status: "confirmed", version: 2 });
    const after = makeBooking({ status: "completed", version: 3 });

    await handleBookingWrite(before, after, db as unknown as FirebaseFirestore.Firestore);

    const access = db.__docs.get("userTenantAccess/user-42_tenant-1");
    expect(access?.nextAppointmentAt).toBeNull();
    // No notification event for 'completed'
    expect(db.__docs.has("notificationEvents/booking-abc_completed_v3")).toBe(false);
  });

  it("clears nextAppointmentAt on no_show without writing a notification event", async () => {
    db.__setQueryResults("bookings", []);

    const before = makeBooking({ status: "confirmed", version: 2 });
    const after = makeBooking({ status: "no_show", version: 3 });

    await handleBookingWrite(before, after, db as unknown as FirebaseFirestore.Firestore);

    const access = db.__docs.get("userTenantAccess/user-42_tenant-1");
    expect(access?.nextAppointmentAt).toBeNull();
    expect(db.__docs.has("notificationEvents/booking-abc_no_show_v3")).toBe(false);
  });

  // ── service name lookup ───────────────────────────────────────────────────

  it("falls back to serviceId when service document does not exist", async () => {
    const before = makeBooking({ status: "pending", version: 1 });
    const after = makeBooking({
      status: "confirmed",
      version: 2,
      serviceId: "svc-unknown-xyz",
    });

    await handleBookingWrite(before, after, db as unknown as FirebaseFirestore.Firestore);

    const access = db.__docs.get("userTenantAccess/user-42_tenant-1");
    expect(access?.nextAppointmentServiceName).toBe("svc-unknown-xyz");
  });
});
