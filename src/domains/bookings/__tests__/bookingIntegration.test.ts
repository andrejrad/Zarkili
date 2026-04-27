/**
 * End-to-end integration test for the booking domain:
 *   pick staff → pick service → generate slots → reserve slot → verify occupancy → race collision
 *
 * Uses the real domain functions (generateSlots, hasConflict) and the real
 * repository implementation against an in-memory Firestore mock.
 */

import { Timestamp } from "firebase/firestore";

import { createBookingsRepository } from "../repository";
import { generateSlots } from "../slotEngine";
import { BookingError } from "../model";
import type { CreateBookingInput } from "../model";
import type { StaffScheduleTemplate } from "../../staff/staffSchedulesModel";

// ---------------------------------------------------------------------------
// In-memory Firestore mock (same as repository.test.ts)
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
    return { exists: () => data !== undefined, data: () => data ?? null, id: ref.id };
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

  const db = {} as unknown;
  return { db, store, doc, getDoc, setDoc, updateDoc, deleteDoc, runTransaction, collection, where, query, getDocs, serverTimestamp, arrayUnion };
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
// Test fixtures
// ---------------------------------------------------------------------------

// 2026-04-27 is a Monday
const TEST_DATE = "2026-04-27";
const DURATION = 60;
const BUFFER = 10;

function makeSchedule(): StaffScheduleTemplate {
  return {
    scheduleId: "sched-1",
    tenantId: "tenantA",
    staffId: "staffA",
    locationId: "locA",
    weekTemplate: {
      mon: [{ start: "09:00", end: "17:00" }],
    },
    exceptions: [],
    updatedAt: { seconds: 0, nanoseconds: 0 } as unknown as Timestamp,
  };
}

function makeInput(startMinutes: number): CreateBookingInput {
  return {
    tenantId: "tenantA",
    locationId: "locA",
    staffId: "staffA",
    serviceId: "svcA",
    customerUserId: "custA",
    date: TEST_DATE,
    startMinutes,
    endMinutes: startMinutes + DURATION,
    startTime: `${Math.floor(startMinutes / 60).toString().padStart(2, "0")}:${(startMinutes % 60).toString().padStart(2, "0")}`,
    endTime: `${Math.floor((startMinutes + DURATION) / 60).toString().padStart(2, "0")}:${((startMinutes + DURATION) % 60).toString().padStart(2, "0")}`,
    durationMinutes: DURATION,
    bufferMinutes: BUFFER,
    notes: null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Booking domain — end-to-end flow", () => {
  beforeEach(() => {
    mockFirestore = makeFirestoreMock();
  });

  it("full flow: generate slots → reserve one → reserved slot disappears from next generation", async () => {
    const repo = createBookingsRepository(mockFirestore.db as never);
    const schedule = makeSchedule();

    // Step 1: Generate initial slots — expect 7 slots (09:00-17:00, 60min, 10min buffer)
    const initialSlots = generateSlots({
      schedule,
      date: TEST_DATE,
      existingBookings: [],
      serviceDurationMinutes: DURATION,
      bufferMinutes: BUFFER,
    });
    expect(initialSlots).toHaveLength(7);
    const firstSlot = initialSlots[0]!;
    expect(firstSlot.startMinutes).toBe(540); // 09:00

    // Step 2: Reserve the first slot
    const booking = await repo.createBookingAtomically(makeInput(firstSlot.startMinutes));
    expect(booking.status).toBe("pending");

    // Step 3: Load existing bookings and regenerate slots
    const existingBookings = await repo.listBookingsByStaffAndDate("tenantA", "staffA", TEST_DATE);
    expect(existingBookings).toHaveLength(1);

    const updatedSlots = generateSlots({
      schedule,
      date: TEST_DATE,
      existingBookings: existingBookings.map((b) => ({
        startMinutes: b.startMinutes,
        endMinutes: b.endMinutes,
        bufferMinutes: b.bufferMinutes,
      })),
      serviceDurationMinutes: DURATION,
      bufferMinutes: BUFFER,
    });

    // The first slot at 09:00 should no longer appear
    const startTimes = updatedSlots.map((s) => s.startMinutes);
    expect(startTimes).not.toContain(540);
    // Next slot starts at 09:00 + 60 + 10 = 610 (10:10)
    expect(startTimes[0]).toBe(610);
  });

  it("race collision: booking same slot twice throws SLOT_UNAVAILABLE on second attempt", async () => {
    const repo = createBookingsRepository(mockFirestore.db as never);

    // First booking succeeds
    await repo.createBookingAtomically(makeInput(540));

    // Second booking for the same slot is blocked by the slot token
    await expect(repo.createBookingAtomically(makeInput(540))).rejects.toMatchObject({
      code: "SLOT_UNAVAILABLE",
    });
  });

  it("cancel booking releases slot token so the slot can be re-booked", async () => {
    const repo = createBookingsRepository(mockFirestore.db as never);

    // Book the slot
    const booking = await repo.createBookingAtomically(makeInput(540));
    const bookingId = booking.bookingId;

    // Confirm first (pending → confirmed)
    await repo.updateBookingStatus({ bookingId, tenantId: "tenantA", status: "confirmed" });

    // Cancel the confirmed booking → slot token should be deleted
    await repo.updateBookingStatus({ bookingId, tenantId: "tenantA", status: "cancelled" });

    const tokenKey = "bookingSlotTokens/tenantA_staffA_2026-04-27_540";
    expect(mockFirestore.store[tokenKey]).toBeUndefined();

    // Now a new booking for the same slot should succeed
    const rebooking = await repo.createBookingAtomically(makeInput(540));
    expect(rebooking.status).toBe("pending");
  });
});
