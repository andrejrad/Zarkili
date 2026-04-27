/**
 * repository.write.test.ts
 *
 * Covers the write path of BookingsRepository:
 *   - updateBookingStatus (optimistic locking, audit trail, scope check)
 *   - Named convenience methods: confirmBooking, rejectBooking, cancelBooking,
 *     markCompleted, markNoShow
 *   - Cross-tenant scope mismatch (BOOKING_SCOPE_MISMATCH)
 *   - Stale-write rejection (STALE_WRITE)
 *   - Unauthorized transition (UNAUTHORIZED_TRANSITION)
 *   - Slot-token cleanup on cancel/reschedule
 */

import { createBookingsRepository } from "../repository";
import { BookingError } from "../model";
import type { Booking, BookingActorRole, CreateBookingInput } from "../model";

// ---------------------------------------------------------------------------
// Firestore mock — extends base mock with arrayUnion support
// ---------------------------------------------------------------------------

type ArrayUnionSentinel = { _type: "arrayUnion"; elements: unknown[] };
function isArrayUnion(v: unknown): v is ArrayUnionSentinel {
  return (
    typeof v === "object" &&
    v !== null &&
    "_type" in v &&
    (v as Record<string, unknown>)._type === "arrayUnion"
  );
}

function makeWriteFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  const serverTimestamp = () => ({ _type: "serverTimestamp" });

  function resolveTimestamps(data: Record<string, unknown>): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      resolved[k] =
        v && typeof v === "object" && "_type" in v &&
        (v as Record<string, unknown>)._type === "serverTimestamp"
          ? { seconds: 0, nanoseconds: 0 }
          : v;
    }
    return resolved;
  }

  function doc(_db: unknown, collectionPath: string, id: string) {
    const key = `${collectionPath}/${id}`;
    return { key, id, path: key };
  }

  async function getDoc(ref: { key: string; id: string }) {
    const data = store[ref.key];
    return {
      exists: () => data !== undefined,
      data: () => data ?? null,
      id: ref.id,
    };
  }

  async function updateDoc(ref: { key: string }, patch: Record<string, unknown>) {
    if (!store[ref.key]) throw new Error(`Document ${ref.key} does not exist`);
    const existing = store[ref.key];
    const merged: Record<string, unknown> = { ...existing };
    for (const [k, v] of Object.entries(patch)) {
      if (isArrayUnion(v)) {
        const current = Array.isArray(existing[k]) ? (existing[k] as unknown[]) : [];
        // Resolve timestamps within each element
        const newItems = v.elements.map((el) => {
          if (typeof el === "object" && el !== null) {
            return resolveTimestamps(el as Record<string, unknown>);
          }
          return el;
        });
        merged[k] = [...current, ...newItems];
      } else {
        merged[k] =
          v && typeof v === "object" && "_type" in v &&
          (v as Record<string, unknown>)._type === "serverTimestamp"
            ? { seconds: 0, nanoseconds: 0 }
            : v;
      }
    }
    store[ref.key] = merged;
  }

  async function deleteDoc(ref: { key: string }) {
    delete store[ref.key];
  }

  type TxRef = { key: string; id: string };
  type PendingWrite =
    | { type: "set"; key: string; data: Record<string, unknown> }
    | { type: "delete"; key: string };

  async function runTransaction(
    _db: unknown,
    fn: (tx: {
      get: (ref: TxRef) => Promise<{
        exists: () => boolean;
        data: () => Record<string, unknown> | null;
        id: string;
      }>;
      set: (ref: TxRef, data: Record<string, unknown>) => void;
      delete: (ref: TxRef) => void;
    }) => Promise<void>,
  ) {
    const pendingWrites: PendingWrite[] = [];
    const tx = {
      get: async (ref: TxRef) => {
        const data = store[ref.key];
        return { exists: () => data !== undefined, data: () => data ?? null, id: ref.id };
      },
      set: (ref: TxRef, data: Record<string, unknown>) => {
        pendingWrites.push({ type: "set", key: ref.key, data });
      },
      delete: (ref: TxRef) => {
        pendingWrites.push({ type: "delete", key: ref.key });
      },
    };
    await fn(tx);
    for (const w of pendingWrites) {
      if (w.type === "set") {
        store[w.key] = w.data;
      } else {
        delete store[w.key];
      }
    }
  }

  function collection(_db: unknown, col: string) {
    return { _col: col };
  }

  function where(field: string, op: string, value: unknown) {
    return { field, op, value };
  }

  function query(
    colRef: { _col: string },
    ...filters: Array<{ field: string; op: string; value: unknown }>
  ) {
    return { col: colRef._col, filters };
  }

  async function getDocs(q: {
    col: string;
    filters: Array<{ field: string; op: string; value: unknown }>;
  }) {
    const docs = Object.entries(store)
      .filter(([key]) => key.startsWith(`${q.col}/`))
      .filter(([, data]) =>
        q.filters.every(({ field, op, value }) => {
          if (op === "==") return (data as Record<string, unknown>)[field] === value;
          return true;
        }),
      )
      .map(([key, data]) => ({ id: key.split("/")[1], data: () => data }));
    return { empty: docs.length === 0, docs };
  }

  function arrayUnion(...elements: unknown[]): ArrayUnionSentinel {
    return { _type: "arrayUnion", elements };
  }

  const db = {} as unknown;
  return {
    db,
    store,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    runTransaction,
    collection,
    where,
    query,
    getDocs,
    serverTimestamp,
    arrayUnion,
  };
}

let mock: ReturnType<typeof makeWriteFirestoreMock>;

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mock.doc(...(args as [unknown, string, string])),
  getDoc: (...args: unknown[]) => mock.getDoc(...(args as [{ key: string; id: string }])),
  updateDoc: (...args: unknown[]) =>
    mock.updateDoc(...(args as [{ key: string }, Record<string, unknown>])),
  deleteDoc: (...args: unknown[]) => mock.deleteDoc(...(args as [{ key: string }])),
  runTransaction: (...args: unknown[]) =>
    mock.runTransaction(
      args[0],
      args[1] as Parameters<typeof mock.runTransaction>[1],
    ),
  collection: (...args: unknown[]) => mock.collection(...(args as [unknown, string])),
  where: (...args: unknown[]) => mock.where(...(args as [string, string, unknown])),
  query: (...args: unknown[]) =>
    mock.query(
      ...(args as [
        { _col: string },
        ...Array<{ field: string; op: string; value: unknown }>,
      ]),
    ),
  getDocs: (...args: unknown[]) =>
    mock.getDocs(
      ...(args as [
        { col: string; filters: Array<{ field: string; op: string; value: unknown }> },
      ]),
    ),
  serverTimestamp: () => mock.serverTimestamp(),
  arrayUnion: (...args: unknown[]) => mock.arrayUnion(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBookingInput(overrides: Partial<CreateBookingInput> = {}): CreateBookingInput {
  return {
    tenantId: "tenantA",
    locationId: "locA",
    staffId: "staffA",
    serviceId: "svcA",
    customerUserId: "custA",
    date: "2026-04-27",
    startMinutes: 540,
    endMinutes: 600,
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    bufferMinutes: 10,
    notes: null,
    ...overrides,
  };
}

/** Seeds a pending booking directly into the store and returns its id. */
function seedPendingBooking(
  id: string,
  overrides: Partial<Booking> = {},
): string {
  mock.store[`bookings/${id}`] = {
    bookingId: id,
    tenantId: "tenantA",
    locationId: "locA",
    staffId: "staffA",
    serviceId: "svcA",
    customerUserId: "custA",
    date: "2026-04-27",
    startMinutes: 540,
    endMinutes: 600,
    status: "pending",
    version: 0,
    lifecycleEvents: [],
    createdAt: { seconds: 0, nanoseconds: 0 },
    updatedAt: { seconds: 0, nanoseconds: 0 },
    ...overrides,
  };
  return id;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BookingsRepository — write operations", () => {
  beforeEach(() => {
    mock = makeWriteFirestoreMock();
  });

  // =========================================================================
  // createBookingAtomically — version + lifecycleEvents initialisation
  // =========================================================================

  describe("createBookingAtomically initialises version and lifecycle fields", () => {
    it("sets version to 0 on creation", async () => {
      const repo = createBookingsRepository(mock.db as never);
      const booking = await repo.createBookingAtomically(makeBookingInput());
      expect(booking.version).toBe(0);
    });

    it("sets lifecycleEvents to empty array on creation", async () => {
      const repo = createBookingsRepository(mock.db as never);
      const booking = await repo.createBookingAtomically(makeBookingInput());
      expect(booking.lifecycleEvents).toEqual([]);
    });
  });

  // =========================================================================
  // updateBookingStatus — optimistic locking
  // =========================================================================

  describe("updateBookingStatus — optimistic locking (STALE_WRITE)", () => {
    it("throws STALE_WRITE when expectedVersion does not match stored version", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1", { version: 3 });

      await expect(
        repo.updateBookingStatus({
          bookingId: "b1",
          tenantId: "tenantA",
          status: "confirmed",
          actor: "tenant_admin",
          expectedVersion: 2, // stale — stored is 3
        }),
      ).rejects.toThrow(BookingError);

      await expect(
        repo.updateBookingStatus({
          bookingId: "b1",
          tenantId: "tenantA",
          status: "confirmed",
          actor: "tenant_admin",
          expectedVersion: 2,
        }),
      ).rejects.toMatchObject({ code: "STALE_WRITE" });
    });

    it("succeeds when expectedVersion matches stored version", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1", { version: 0 });

      await expect(
        repo.updateBookingStatus({
          bookingId: "b1",
          tenantId: "tenantA",
          status: "confirmed",
          actor: "tenant_admin",
          expectedVersion: 0,
        }),
      ).resolves.toBeUndefined();
    });

    it("succeeds without expectedVersion (lock not checked)", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1", { version: 5 });

      await expect(
        repo.updateBookingStatus({
          bookingId: "b1",
          tenantId: "tenantA",
          status: "confirmed",
          actor: "tenant_admin",
          // no expectedVersion
        }),
      ).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // updateBookingStatus — version increment
  // =========================================================================

  describe("updateBookingStatus — version increment", () => {
    it("increments version by 1 on each successful transition", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1", { version: 0 });

      await repo.updateBookingStatus({
        bookingId: "b1",
        tenantId: "tenantA",
        status: "confirmed",
        actor: "tenant_admin",
      });

      const updated = mock.store["bookings/b1"] as Booking;
      expect(updated.version).toBe(1);
    });

    it("accumulates version across multiple transitions", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1", { version: 0 });

      await repo.updateBookingStatus({
        bookingId: "b1",
        tenantId: "tenantA",
        status: "confirmed",
        actor: "tenant_admin",
      });
      // update stored status so next transition is valid
      (mock.store["bookings/b1"] as Record<string, unknown>).status = "confirmed";

      await repo.updateBookingStatus({
        bookingId: "b1",
        tenantId: "tenantA",
        status: "completed",
        actor: "tenant_admin",
      });

      const updated = mock.store["bookings/b1"] as Booking;
      expect(updated.version).toBe(2);
    });
  });

  // =========================================================================
  // updateBookingStatus — audit trail
  // =========================================================================

  describe("updateBookingStatus — lifecycle event audit trail", () => {
    it("appends a lifecycle event with correct fields on status change", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await repo.updateBookingStatus({
        bookingId: "b1",
        tenantId: "tenantA",
        status: "confirmed",
        actor: "tenant_admin",
        reason: "looks good",
      });

      const events = (mock.store["bookings/b1"] as Booking).lifecycleEvents;
      expect(events).toHaveLength(1);
      expect(events[0].status).toBe("confirmed");
      expect(events[0].actor).toBe("tenant_admin");
      expect(events[0].reason).toBe("looks good");
    });

    it("defaults reason to null when not provided", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await repo.updateBookingStatus({
        bookingId: "b1",
        tenantId: "tenantA",
        status: "confirmed",
        actor: "tenant_admin",
      });

      const events = (mock.store["bookings/b1"] as Booking).lifecycleEvents;
      expect(events[0].reason).toBeNull();
    });

    it("defaults actor to 'system' when actor is not provided", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await repo.updateBookingStatus({
        bookingId: "b1",
        tenantId: "tenantA",
        status: "confirmed",
        // no actor — falls back to "system"
      });

      const events = (mock.store["bookings/b1"] as Booking).lifecycleEvents;
      expect(events[0].actor).toBe("system");
    });

    it("accumulates multiple lifecycle events in order", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await repo.updateBookingStatus({
        bookingId: "b1",
        tenantId: "tenantA",
        status: "confirmed",
        actor: "tenant_admin",
      });
      (mock.store["bookings/b1"] as Record<string, unknown>).status = "confirmed";

      await repo.updateBookingStatus({
        bookingId: "b1",
        tenantId: "tenantA",
        status: "completed",
        actor: "technician",
      });

      const events = (mock.store["bookings/b1"] as Booking).lifecycleEvents;
      expect(events).toHaveLength(2);
      expect(events[0].status).toBe("confirmed");
      expect(events[1].status).toBe("completed");
    });
  });

  // =========================================================================
  // updateBookingStatus — scope check
  // =========================================================================

  describe("updateBookingStatus — cross-tenant guard", () => {
    it("throws BOOKING_NOT_FOUND (not scope mismatch) from generic updateBookingStatus on wrong tenant", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1", { tenantId: "tenantA" });

      await expect(
        repo.updateBookingStatus({
          bookingId: "b1",
          tenantId: "tenantB", // wrong tenant
          status: "confirmed",
          actor: "tenant_admin",
        }),
      ).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND" });
    });
  });

  // =========================================================================
  // updateBookingStatus — UNAUTHORIZED_TRANSITION
  // =========================================================================

  describe("updateBookingStatus — unauthorized actor", () => {
    it("throws UNAUTHORIZED_TRANSITION when actor lacks permission for the transition", async () => {
      const repo = createBookingsRepository(mock.db as never);
      // "client" cannot confirm a booking
      seedPendingBooking("b1");

      await expect(
        repo.updateBookingStatus({
          bookingId: "b1",
          tenantId: "tenantA",
          status: "confirmed",
          actor: "client" as BookingActorRole,
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED_TRANSITION" });
    });
  });

  // =========================================================================
  // updateBookingStatus — slot token cleanup
  // =========================================================================

  describe("updateBookingStatus — slot token cleanup", () => {
    it("removes slot token when booking is cancelled", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1", { tenantId: "tenantA", staffId: "staffA", date: "2026-04-27", startMinutes: 540 });
      // seed a slot token so deleteDoc has something to remove
      mock.store["bookingSlotTokens/tenantA_staffA_2026-04-27_540"] = { bookingId: "b1" };

      await repo.updateBookingStatus({
        bookingId: "b1",
        tenantId: "tenantA",
        status: "cancelled",
        actor: "client",
        reason: "changed mind",
      });

      expect(mock.store["bookingSlotTokens/tenantA_staffA_2026-04-27_540"]).toBeUndefined();
    });

    it("does NOT remove slot token when booking is confirmed", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");
      mock.store["bookingSlotTokens/tenantA_staffA_2026-04-27_540"] = { bookingId: "b1" };

      await repo.updateBookingStatus({
        bookingId: "b1",
        tenantId: "tenantA",
        status: "confirmed",
        actor: "tenant_admin",
      });

      expect(mock.store["bookingSlotTokens/tenantA_staffA_2026-04-27_540"]).toBeDefined();
    });
  });

  // =========================================================================
  // confirmBooking
  // =========================================================================

  describe("confirmBooking", () => {
    it("transitions booking to confirmed", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await repo.confirmBooking("b1", "tenantA", "tenant_admin");

      expect((mock.store["bookings/b1"] as Booking).status).toBe("confirmed");
    });

    it("writes audit event with actor = tenant_admin", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await repo.confirmBooking("b1", "tenantA", "tenant_admin", "auto-confirm");

      const events = (mock.store["bookings/b1"] as Booking).lifecycleEvents;
      expect(events[0].actor).toBe("tenant_admin");
      expect(events[0].reason).toBe("auto-confirm");
    });

    it("throws BOOKING_SCOPE_MISMATCH when booking belongs to different tenant", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1", { tenantId: "tenantA" });

      await expect(
        repo.confirmBooking("b1", "tenantB", "tenant_admin"),
      ).rejects.toMatchObject({ code: "BOOKING_SCOPE_MISMATCH" });
    });

    it("throws BOOKING_NOT_FOUND for unknown booking", async () => {
      const repo = createBookingsRepository(mock.db as never);

      await expect(
        repo.confirmBooking("unknown", "tenantA", "tenant_admin"),
      ).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND" });
    });
  });

  // =========================================================================
  // rejectBooking
  // =========================================================================

  describe("rejectBooking", () => {
    it("transitions booking to rejected", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await repo.rejectBooking("b1", "tenantA", "tenant_admin", "fully booked");

      expect((mock.store["bookings/b1"] as Booking).status).toBe("rejected");
    });

    it("throws when reason is empty string", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await expect(
        repo.rejectBooking("b1", "tenantA", "tenant_admin", ""),
      ).rejects.toThrow("reason is required");
    });

    it("throws when reason is whitespace only", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await expect(
        repo.rejectBooking("b1", "tenantA", "tenant_admin", "   "),
      ).rejects.toThrow("reason is required");
    });

    it("throws BOOKING_SCOPE_MISMATCH on wrong tenant", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await expect(
        repo.rejectBooking("b1", "tenantB", "tenant_admin", "reason"),
      ).rejects.toMatchObject({ code: "BOOKING_SCOPE_MISMATCH" });
    });
  });

  // =========================================================================
  // cancelBooking
  // =========================================================================

  describe("cancelBooking", () => {
    it("transitions booking to cancelled", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await repo.cancelBooking("b1", "tenantA", "client", "rescheduling");

      expect((mock.store["bookings/b1"] as Booking).status).toBe("cancelled");
    });

    it("releases slot token on cancel", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");
      mock.store["bookingSlotTokens/tenantA_staffA_2026-04-27_540"] = { bookingId: "b1" };

      await repo.cancelBooking("b1", "tenantA", "client", "changed mind");

      expect(mock.store["bookingSlotTokens/tenantA_staffA_2026-04-27_540"]).toBeUndefined();
    });

    it("throws when reason is empty", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await expect(
        repo.cancelBooking("b1", "tenantA", "client", ""),
      ).rejects.toThrow("reason is required");
    });

    it("throws BOOKING_SCOPE_MISMATCH on wrong tenant", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1");

      await expect(
        repo.cancelBooking("b1", "tenantB", "client", "oops"),
      ).rejects.toMatchObject({ code: "BOOKING_SCOPE_MISMATCH" });
    });
  });

  // =========================================================================
  // markCompleted
  // =========================================================================

  describe("markCompleted", () => {
    it("transitions confirmed booking to completed", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1", { status: "confirmed" });

      await repo.markCompleted("b1", "tenantA", "technician");

      expect((mock.store["bookings/b1"] as Booking).status).toBe("completed");
    });

    it("throws BOOKING_SCOPE_MISMATCH on wrong tenant", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1", { status: "confirmed" });

      await expect(
        repo.markCompleted("b1", "tenantB", "technician"),
      ).rejects.toMatchObject({ code: "BOOKING_SCOPE_MISMATCH" });
    });
  });

  // =========================================================================
  // markNoShow
  // =========================================================================

  describe("markNoShow", () => {
    it("transitions confirmed booking to no_show", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1", { status: "confirmed" });

      await repo.markNoShow("b1", "tenantA", "tenant_admin");

      expect((mock.store["bookings/b1"] as Booking).status).toBe("no_show");
    });

    it("throws BOOKING_SCOPE_MISMATCH on wrong tenant", async () => {
      const repo = createBookingsRepository(mock.db as never);
      seedPendingBooking("b1", { status: "confirmed" });

      await expect(
        repo.markNoShow("b1", "tenantB", "tenant_admin"),
      ).rejects.toMatchObject({ code: "BOOKING_SCOPE_MISMATCH" });
    });
  });
});
