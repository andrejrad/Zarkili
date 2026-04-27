import { createBookingsRepository } from "../repository";
import { BookingError, assertValidStatusTransition } from "../model";
import type { CreateBookingInput } from "../model";

// ---------------------------------------------------------------------------
// Extended Firestore mock with runTransaction + deleteDoc
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  const serverTimestamp = () => ({ _type: "serverTimestamp" });

  function resolveTimestamps(data: Record<string, unknown>): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      resolved[k] =
        v && typeof v === "object" && "_type" in v ? { seconds: 0, nanoseconds: 0 } : v;
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

  async function setDoc(ref: { key: string }, data: Record<string, unknown>) {
    store[ref.key] = resolveTimestamps(data);
  }

  function arrayUnion(...elements: unknown[]) {
    return { _type: "arrayUnion", elements };
  }

  function isArrayUnion(v: unknown): v is { _type: "arrayUnion"; elements: unknown[] } {
    return typeof v === "object" && v !== null && "_type" in v && (v as Record<string, unknown>)._type === "arrayUnion";
  }

  async function updateDoc(ref: { key: string }, patch: Record<string, unknown>) {
    if (!store[ref.key]) throw new Error(`Document ${ref.key} does not exist`);
    const existing = store[ref.key];
    const merged: Record<string, unknown> = { ...existing };
    for (const [k, v] of Object.entries(patch)) {
      if (isArrayUnion(v)) {
        const current = Array.isArray(existing[k]) ? (existing[k] as unknown[]) : [];
        merged[k] = [...current, ...v.elements];
      } else {
        merged[k] =
          v && typeof v === "object" && "_type" in v ? { seconds: 0, nanoseconds: 0 } : v;
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
      get: (ref: TxRef) => Promise<{ exists: () => boolean; data: () => Record<string, unknown> | null; id: string }>;
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
        pendingWrites.push({ type: "set", key: ref.key, data: resolveTimestamps(data) });
      },
      delete: (ref: TxRef) => {
        pendingWrites.push({ type: "delete", key: ref.key });
      },
    };

    // If fn throws, pendingWrites are discarded (transaction aborted)
    await fn(tx);

    // Apply writes only on success
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

  const db = {} as unknown;
  return {
    db,
    store,
    doc,
    getDoc,
    setDoc,
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

let mockFirestore: ReturnType<typeof makeFirestoreMock>;

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) =>
    mockFirestore.doc(...(args as [unknown, string, string])),
  getDoc: (...args: unknown[]) =>
    mockFirestore.getDoc(...(args as [{ key: string; id: string }])),
  setDoc: (...args: unknown[]) =>
    mockFirestore.setDoc(...(args as [{ key: string }, Record<string, unknown>])),
  updateDoc: (...args: unknown[]) =>
    mockFirestore.updateDoc(...(args as [{ key: string }, Record<string, unknown>])),
  deleteDoc: (...args: unknown[]) =>
    mockFirestore.deleteDoc(...(args as [{ key: string }])),
  runTransaction: (...args: unknown[]) =>
    mockFirestore.runTransaction(args[0], args[1] as Parameters<typeof mockFirestore.runTransaction>[1]),
  collection: (...args: unknown[]) =>
    mockFirestore.collection(...(args as [unknown, string])),
  where: (...args: unknown[]) =>
    mockFirestore.where(...(args as [string, string, unknown])),
  query: (...args: unknown[]) =>
    mockFirestore.query(
      ...(args as [{ _col: string }, ...Array<{ field: string; op: string; value: unknown }>]),
    ),
  getDocs: (...args: unknown[]) =>
    mockFirestore.getDocs(
      ...(args as [{ col: string; filters: Array<{ field: string; op: string; value: unknown }> }]),
    ),
  serverTimestamp: () => mockFirestore.serverTimestamp(),
  arrayUnion: (...args: unknown[]) => mockFirestore.arrayUnion(...args),
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

// ---------------------------------------------------------------------------
// Model — assertValidStatusTransition
// ---------------------------------------------------------------------------

describe("assertValidStatusTransition", () => {
  it("allows pending → confirmed", () => {
    expect(() => assertValidStatusTransition("pending", "confirmed")).not.toThrow();
  });

  it("allows pending → cancelled", () => {
    expect(() => assertValidStatusTransition("pending", "cancelled")).not.toThrow();
  });

  it("throws for pending → no_show", () => {
    expect(() => assertValidStatusTransition("pending", "no_show")).toThrow(BookingError);
  });

  it("throws for cancelled → confirmed (terminal state)", () => {
    expect(() => assertValidStatusTransition("cancelled", "confirmed")).toThrow(BookingError);
  });

  it("allows confirmed → completed", () => {
    expect(() => assertValidStatusTransition("confirmed", "completed")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

describe("createBookingsRepository", () => {
  beforeEach(() => {
    mockFirestore = makeFirestoreMock();
  });

  // --- createBookingAtomically ---

  describe("createBookingAtomically", () => {
    it("creates booking and slot token atomically", async () => {
      const repo = createBookingsRepository(mockFirestore.db as never);
      const input = makeBookingInput();
      const booking = await repo.createBookingAtomically(input);

      expect(booking.tenantId).toBe("tenantA");
      expect(booking.status).toBe("pending");
      expect(booking.startMinutes).toBe(540);

      // Slot token should be written
      const tokenKey = `bookingSlotTokens/tenantA_staffA_2026-04-27_540`;
      expect(mockFirestore.store[tokenKey]).toBeDefined();
      expect(mockFirestore.store[tokenKey]?.staffId).toBe("staffA");
    });

    it("throws SLOT_UNAVAILABLE when slot token already exists", async () => {
      const repo = createBookingsRepository(mockFirestore.db as never);
      // Pre-seed the slot token to simulate a prior booking
      mockFirestore.store["bookingSlotTokens/tenantA_staffA_2026-04-27_540"] = {
        bookingId: "prior-booking",
        tenantId: "tenantA",
        staffId: "staffA",
        date: "2026-04-27",
        startMinutes: 540,
      };

      const input = makeBookingInput();
      await expect(repo.createBookingAtomically(input)).rejects.toThrow(BookingError);
      await expect(repo.createBookingAtomically(input)).rejects.toMatchObject({
        code: "SLOT_UNAVAILABLE",
      });
    });

    it("does not write booking when slot is unavailable", async () => {
      const repo = createBookingsRepository(mockFirestore.db as never);
      mockFirestore.store["bookingSlotTokens/tenantA_staffA_2026-04-27_540"] = {
        bookingId: "prior",
      };

      try {
        await repo.createBookingAtomically(makeBookingInput());
      } catch {
        // expected
      }

      const bookingKeys = Object.keys(mockFirestore.store).filter((k) =>
        k.startsWith("bookings/"),
      );
      expect(bookingKeys).toHaveLength(0);
    });
  });

  // --- getBookingById ---

  describe("getBookingById", () => {
    it("returns null when booking does not exist", async () => {
      const repo = createBookingsRepository(mockFirestore.db as never);
      const result = await repo.getBookingById("missing", "tenantA");
      expect(result).toBeNull();
    });

    it("returns null for cross-tenant access attempt", async () => {
      const repo = createBookingsRepository(mockFirestore.db as never);
      await repo.createBookingAtomically(makeBookingInput());
      // retrieve any bookingId from store
      const bookingKey = Object.keys(mockFirestore.store).find((k) =>
        k.startsWith("bookings/"),
      );
      const bookingId = bookingKey?.split("/")[1] ?? "";

      const result = await repo.getBookingById(bookingId, "tenantB");
      expect(result).toBeNull();
    });

    it("returns booking for correct tenant", async () => {
      const repo = createBookingsRepository(mockFirestore.db as never);
      await repo.createBookingAtomically(makeBookingInput());
      const bookingKey = Object.keys(mockFirestore.store).find((k) =>
        k.startsWith("bookings/"),
      );
      const bookingId = bookingKey?.split("/")[1] ?? "";

      const result = await repo.getBookingById(bookingId, "tenantA");
      expect(result).not.toBeNull();
      expect(result?.status).toBe("pending");
    });
  });

  // --- listBookingsByStaffAndDate ---

  describe("listBookingsByStaffAndDate", () => {
    it("returns non-cancelled bookings for the staff+date", async () => {
      const repo = createBookingsRepository(mockFirestore.db as never);
      await repo.createBookingAtomically(makeBookingInput({ startMinutes: 540, endMinutes: 600 }));

      const results = await repo.listBookingsByStaffAndDate(
        "tenantA",
        "staffA",
        "2026-04-27",
      );
      expect(results).toHaveLength(1);
      expect(results[0]?.status).toBe("pending");
    });

    it("excludes cancelled bookings", async () => {
      const repo = createBookingsRepository(mockFirestore.db as never);
      await repo.createBookingAtomically(makeBookingInput());
      // Manually mark the booking as cancelled in the store
      const bookingKey = Object.keys(mockFirestore.store).find((k) =>
        k.startsWith("bookings/"),
      );
      if (bookingKey) {
        mockFirestore.store[bookingKey] = {
          ...mockFirestore.store[bookingKey],
          status: "cancelled",
        };
      }

      const results = await repo.listBookingsByStaffAndDate(
        "tenantA",
        "staffA",
        "2026-04-27",
      );
      expect(results).toHaveLength(0);
    });
  });

  // --- updateBookingStatus ---

  describe("updateBookingStatus", () => {
    it("transitions pending → confirmed", async () => {
      const repo = createBookingsRepository(mockFirestore.db as never);
      await repo.createBookingAtomically(makeBookingInput());
      const bookingKey = Object.keys(mockFirestore.store).find((k) =>
        k.startsWith("bookings/"),
      );
      const bookingId = bookingKey?.split("/")[1] ?? "";

      await repo.updateBookingStatus({ bookingId, tenantId: "tenantA", status: "confirmed" });

      const updated = mockFirestore.store[bookingKey!];
      expect(updated?.status).toBe("confirmed");
    });

    it("throws INVALID_STATUS_TRANSITION for invalid transition", async () => {
      const repo = createBookingsRepository(mockFirestore.db as never);
      await repo.createBookingAtomically(makeBookingInput());
      const bookingKey = Object.keys(mockFirestore.store).find((k) =>
        k.startsWith("bookings/"),
      );
      const bookingId = bookingKey?.split("/")[1] ?? "";

      await expect(
        repo.updateBookingStatus({ bookingId, tenantId: "tenantA", status: "no_show" }),
      ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
    });

    it("throws BOOKING_NOT_FOUND for non-existent booking", async () => {
      const repo = createBookingsRepository(mockFirestore.db as never);
      await expect(
        repo.updateBookingStatus({ bookingId: "ghost", tenantId: "tenantA", status: "confirmed" }),
      ).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND" });
    });

    it("deletes slot token when booking is cancelled", async () => {
      const repo = createBookingsRepository(mockFirestore.db as never);
      await repo.createBookingAtomically(makeBookingInput());
      const bookingKey = Object.keys(mockFirestore.store).find((k) =>
        k.startsWith("bookings/"),
      );
      const bookingId = bookingKey?.split("/")[1] ?? "";

      await repo.updateBookingStatus({ bookingId, tenantId: "tenantA", status: "cancelled" });

      const tokenKey = `bookingSlotTokens/tenantA_staffA_2026-04-27_540`;
      expect(mockFirestore.store[tokenKey]).toBeUndefined();
    });
  });
});
