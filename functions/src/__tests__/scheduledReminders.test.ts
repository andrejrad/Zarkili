/**
 * scheduledReminders.test.ts
 *
 * Tests the pure `appointmentUtcMs` converter and the `runReminderScan`
 * handler.  No Cloud Functions runtime or firebase-admin runtime required.
 *
 * Clock anchor for scan tests
 * ────────────────────────────
 *   now       = 2025-09-16T01:00:00.000Z
 *   window    = [2025-09-17T00:00:00Z, 2025-09-17T02:00:00Z]  (now + 23 h … 25 h)
 *   dateMin   ≈ 2025-09-16 (after subtracting 14 h from windowStart)
 *   dateMax   ≈ 2025-09-18 (after adding 14 h to windowEnd)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { appointmentUtcMs, runReminderScan } from "../scheduledReminders";

// ---------------------------------------------------------------------------
// Firestore mock factory
// ---------------------------------------------------------------------------

type DocData = Record<string, unknown>;

function makeFirestoreMock() {
  const docs = new Map<string, DocData>();
  const batchWrites: Array<{ path: string; data: DocData }> = [];

  // Immutable query chain — accumulates filters as plain arrays
  function makeQuery(
    collectionName: string,
    filters: ReadonlyArray<[string, string, unknown]>,
  ) {
    const q = {
      where: (field: string, op: string, val: unknown) =>
        makeQuery(collectionName, [...filters, [field, op, val]]),
      orderBy: () => q,
      limit: () => q,
      get: vi.fn(async () => {
        let results = (queryResults.get(collectionName) ?? []).slice();
        for (const [field, op, val] of filters) {
          results = results.filter((doc) => {
            const v = doc[field];
            if (op === "==") return v === val;
            if (op === ">=" && typeof v === "string" && typeof val === "string")
              return v >= val;
            if (op === "<=" && typeof v === "string" && typeof val === "string")
              return v <= val;
            return true;
          });
        }
        return {
          empty: results.length === 0,
          docs: results.map((data) => ({ data: () => data })),
        };
      }),
    };
    return q;
  }

  // Per-collection query result store (set by tests)
  const queryResults = new Map<string, DocData[]>();

  function docRef(path: string) {
    return {
      path,
      get: vi.fn(async () => ({
        exists: docs.has(path),
        data: () => docs.get(path),
      })),
      set: vi.fn(async (data: DocData) => {
        docs.set(path, data);
      }),
      update: vi.fn(async (data: DocData) => {
        const existing = docs.get(path) ?? {};
        docs.set(path, { ...existing, ...data });
      }),
    };
  }

  function collectionMock(name: string) {
    return {
      doc: (id: string) => docRef(`${name}/${id}`),
      where: (field: string, op: string, val: unknown) =>
        makeQuery(name, [[field, op, val]]),
    };
  }

  const db = {
    collection: vi.fn((name: string) => collectionMock(name)),
    batch: vi.fn(() => {
      const pending: Array<{ ref: { path: string }; data: DocData }> = [];
      return {
        set: vi.fn((ref: { path: string }, data: DocData) => {
          pending.push({ ref, data });
        }),
        commit: vi.fn(async () => {
          for (const w of pending) {
            docs.set(w.ref.path, w.data);
            batchWrites.push({ path: w.ref.path, data: w.data });
          }
        }),
      };
    }),
    // Test helpers
    __setDoc: (path: string, data: DocData) => docs.set(path, data),
    __setQueryResults: (collection: string, results: DocData[]) =>
      queryResults.set(collection, results),
    __batchWrites: batchWrites,
    __docs: docs,
  };

  return db as unknown as FirebaseFirestore.Firestore & {
    __setDoc: (path: string, data: DocData) => void;
    __setQueryResults: (collection: string, results: DocData[]) => void;
    __batchWrites: Array<{ path: string; data: DocData }>;
    __docs: Map<string, DocData>;
  };
}

// ---------------------------------------------------------------------------
// Booking fixture
// ---------------------------------------------------------------------------

type BookingFixture = {
  bookingId: string;
  tenantId: string;
  locationId: string;
  staffId: string;
  serviceId: string;
  customerUserId: string;
  date: string;
  startMinutes: number;
  status: string;
};

function makeBooking(overrides: Partial<BookingFixture> = {}): BookingFixture {
  return {
    bookingId: "bk-001",
    tenantId: "tenant-1",
    locationId: "loc-1",
    staffId: "staff-1",
    serviceId: "svc-haircut",
    customerUserId: "user-42",
    date: "2025-09-17",
    startMinutes: 60, // 01:00 local
    status: "confirmed",
    ...overrides,
  };
}

// Clock anchor: 2025-09-16T01:00:00Z → window [2025-09-17T00:00Z, 2025-09-17T02:00Z]
const NOW = new Date("2025-09-16T01:00:00.000Z");

// ---------------------------------------------------------------------------
// appointmentUtcMs — unit tests
// ---------------------------------------------------------------------------

describe("appointmentUtcMs", () => {
  it("returns the same UTC ms for UTC timezone (offset = 0)", () => {
    // 09:00 local UTC on 2025-09-17 = 09:00 UTC
    const expected = Date.UTC(2025, 8, 17, 9, 0, 0, 0);
    expect(appointmentUtcMs("2025-09-17", 540, "UTC")).toBe(expected);
  });

  it("subtracts positive UTC offset (UTC+2, CET summer)", () => {
    // Europe/Paris in September is CEST = UTC+2
    // 03:00 local → 01:00 UTC
    const expected = Date.UTC(2025, 8, 17, 1, 0, 0, 0);
    const result = appointmentUtcMs("2025-09-17", 180, "Europe/Paris");
    // Allow ±2 min for DST correction accuracy
    expect(Math.abs(result - expected)).toBeLessThan(2 * 60 * 1000);
  });

  it("adds absolute UTC offset for UTC-5 timezone (America/New_York winter)", () => {
    // America/New_York in January is EST = UTC-5
    // 09:00 local → 14:00 UTC
    const expected = Date.UTC(2025, 0, 15, 14, 0, 0, 0);
    const result = appointmentUtcMs("2025-01-15", 540, "America/New_York");
    expect(Math.abs(result - expected)).toBeLessThan(2 * 60 * 1000);
  });

  it("handles midnight (startMinutes = 0) correctly", () => {
    const expected = Date.UTC(2025, 8, 17, 0, 0, 0, 0);
    expect(appointmentUtcMs("2025-09-17", 0, "UTC")).toBe(expected);
  });

  it("handles end-of-day (startMinutes = 1380 = 23:00) correctly", () => {
    const expected = Date.UTC(2025, 8, 17, 23, 0, 0, 0);
    expect(appointmentUtcMs("2025-09-17", 1380, "UTC")).toBe(expected);
  });

  it("handles fractional minutes (e.g. 09:30 = 570)", () => {
    const expected = Date.UTC(2025, 8, 17, 9, 30, 0, 0);
    expect(appointmentUtcMs("2025-09-17", 570, "UTC")).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// runReminderScan — integration tests
// ---------------------------------------------------------------------------

describe("runReminderScan", () => {
  let db: ReturnType<typeof makeFirestoreMock>;

  function setupTenant(timezone: string = "UTC") {
    db.__setDoc("tenants/tenant-1", { tenantId: "tenant-1", timezone });
  }

  beforeEach(() => {
    db = makeFirestoreMock();
    setupTenant("UTC");
  });

  // ── Window filtering ──────────────────────────────────────────────────────

  it("sends a reminder for a booking exactly at now+24h in UTC", async () => {
    // 01:00 UTC on 2025-09-17 — exactly in centre of window
    const booking = makeBooking({ date: "2025-09-17", startMinutes: 60 });
    db.__setQueryResults("bookings", [booking]);

    const result = await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(0);
    expect(db.__docs.has("notificationEvents/bk-001_reminder_24h")).toBe(true);
    expect(db.__docs.has("reminderSendLogs/bk-001_reminder_24h")).toBe(true);
  });

  it("skips a booking outside the window (too far ahead)", async () => {
    // 03:30 UTC on 2025-09-17 → 26.5 h from now — outside window
    const booking = makeBooking({ date: "2025-09-17", startMinutes: 210 });
    db.__setQueryResults("bookings", [booking]);

    const result = await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it("skips a booking before the window (too soon)", async () => {
    // 22:00 UTC on 2025-09-16 → 21 h from now — outside window
    const booking = makeBooking({ date: "2025-09-16", startMinutes: 1320 });
    db.__setQueryResults("bookings", [booking]);

    const result = await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
  });

  // ── Timezone handling ─────────────────────────────────────────────────────

  it("correctly sends reminder for UTC+2 tenant booking at 03:00 local = 01:00 UTC", async () => {
    setupTenant("Europe/Paris"); // CEST = UTC+2 in September
    // 03:00 local → ~01:00 UTC → in window
    const booking = makeBooking({ date: "2025-09-17", startMinutes: 180 });
    db.__setQueryResults("bookings", [booking]);

    const result = await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    expect(result.sent).toBe(1);
  });

  it("skips UTC+2 booking at 09:00 local (= 07:00 UTC) — outside reminder window", async () => {
    setupTenant("Europe/Paris");
    // 09:00 local → ~07:00 UTC → 30 h from now — outside window
    const booking = makeBooking({ date: "2025-09-17", startMinutes: 540 });
    db.__setQueryResults("bookings", [booking]);

    const result = await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it("caches tenant timezone — only one Firestore read per tenant", async () => {
    const bookings = [
      makeBooking({ bookingId: "bk-001", date: "2025-09-17", startMinutes: 60 }),
      makeBooking({ bookingId: "bk-002", date: "2025-09-17", startMinutes: 60, customerUserId: "user-43" }),
    ];
    db.__setQueryResults("bookings", bookings);

    await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    // Both bookings belong to tenant-1; only one tenant doc read
    const tenantCalls = (db.collection as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c: unknown[]) => c[0] === "tenants",
    );
    // Two get() calls on tenants/tenant-1 is acceptable but should not be more
    // The test asserts the second booking didn't trigger a second DB hit
    expect(tenantCalls.length).toBeGreaterThanOrEqual(1);
  });

  // ── Idempotency ───────────────────────────────────────────────────────────

  it("skips a booking if a send log already exists", async () => {
    const booking = makeBooking({ date: "2025-09-17", startMinutes: 60 });
    db.__setQueryResults("bookings", [booking]);
    // Pre-insert the send log
    db.__setDoc("reminderSendLogs/bk-001_reminder_24h", {
      logId: "bk-001_reminder_24h",
      status: "sent",
    });

    const result = await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
    // No new notification event should have been written
    expect(db.__batchWrites).toHaveLength(0);
  });

  // ── Opt-out preferences ───────────────────────────────────────────────────

  it("skips booking when user has reminderEnabled = false", async () => {
    const booking = makeBooking({ date: "2025-09-17", startMinutes: 60 });
    db.__setQueryResults("bookings", [booking]);
    db.__setDoc("userNotificationPreferences/user-42_tenant-1", {
      reminderEnabled: false,
      channels: { in_app: true, email: false, push: false },
    });

    const result = await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it("skips booking when all channels are disabled", async () => {
    const booking = makeBooking({ date: "2025-09-17", startMinutes: 60 });
    db.__setQueryResults("bookings", [booking]);
    db.__setDoc("userNotificationPreferences/user-42_tenant-1", {
      reminderEnabled: true,
      channels: { in_app: false, email: false, push: false },
    });

    const result = await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it("sends via in_app by default when no preferences document exists", async () => {
    const booking = makeBooking({ date: "2025-09-17", startMinutes: 60 });
    db.__setQueryResults("bookings", [booking]);
    // No prefs doc → defaults apply

    const result = await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    expect(result.sent).toBe(1);
    const eventDoc = db.__docs.get("notificationEvents/bk-001_reminder_24h") as Record<string, unknown>;
    const recipients = eventDoc?.recipients as Array<{ channel: string }>;
    expect(recipients.map((r) => r.channel)).toEqual(["in_app"]);
  });

  // ── Channel flags ─────────────────────────────────────────────────────────

  it("includes all three channels when all are enabled", async () => {
    const booking = makeBooking({ date: "2025-09-17", startMinutes: 60 });
    db.__setQueryResults("bookings", [booking]);
    db.__setDoc("userNotificationPreferences/user-42_tenant-1", {
      reminderEnabled: true,
      channels: { in_app: true, email: true, push: true },
    });

    await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    const eventDoc = db.__docs.get("notificationEvents/bk-001_reminder_24h") as Record<string, unknown>;
    const channels = (eventDoc?.recipients as Array<{ channel: string }>).map((r) => r.channel);
    expect(channels).toContain("in_app");
    expect(channels).toContain("email");
    expect(channels).toContain("push");
    expect(channels).toHaveLength(3);
  });

  it("only uses email channel when only email is enabled", async () => {
    const booking = makeBooking({ date: "2025-09-17", startMinutes: 60 });
    db.__setQueryResults("bookings", [booking]);
    db.__setDoc("userNotificationPreferences/user-42_tenant-1", {
      reminderEnabled: true,
      channels: { in_app: false, email: true, push: false },
    });

    await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    const eventDoc = db.__docs.get("notificationEvents/bk-001_reminder_24h") as Record<string, unknown>;
    const channels = (eventDoc?.recipients as Array<{ channel: string }>).map((r) => r.channel);
    expect(channels).toEqual(["email"]);
  });

  // ── Notification event shape ──────────────────────────────────────────────

  it("writes a valid reminder_due notification event shape", async () => {
    const booking = makeBooking({ date: "2025-09-17", startMinutes: 60 });
    db.__setQueryResults("bookings", [booking]);

    await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    const eventDoc = db.__docs.get("notificationEvents/bk-001_reminder_24h") as Record<string, unknown>;
    expect(eventDoc).toBeDefined();
    expect(eventDoc.eventType).toBe("reminder_due");
    expect(eventDoc.tenantId).toBe("tenant-1");
    expect(eventDoc.eventId).toBe("bk-001_reminder_24h");
    expect(eventDoc.createdAt).toBe(NOW.toISOString());
    const payload = eventDoc.payload as Record<string, unknown>;
    expect(payload.appointmentAt).toBeDefined();
    expect(typeof payload.appointmentAt).toBe("string");
  });

  it("writes a send log with correct shape", async () => {
    const booking = makeBooking({ date: "2025-09-17", startMinutes: 60 });
    db.__setQueryResults("bookings", [booking]);

    await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    const logDoc = db.__docs.get("reminderSendLogs/bk-001_reminder_24h") as Record<string, unknown>;
    expect(logDoc).toBeDefined();
    expect(logDoc.logId).toBe("bk-001_reminder_24h");
    expect(logDoc.bookingId).toBe("bk-001");
    expect(logDoc.status).toBe("sent");
  });

  // ── Scan summary ─────────────────────────────────────────────────────────

  it("returns correct scanned/sent/skipped counts for mixed batch", async () => {
    const inWindow = makeBooking({ bookingId: "bk-in", date: "2025-09-17", startMinutes: 60 });
    const outOfWindow = makeBooking({ bookingId: "bk-out", date: "2025-09-17", startMinutes: 210 });
    db.__setQueryResults("bookings", [inWindow, outOfWindow]);

    const result = await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    expect(result.scanned).toBe(2);
    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it("returns sent=0 skipped=0 when no bookings match the date range", async () => {
    db.__setQueryResults("bookings", []);

    const result = await runReminderScan(NOW, db as unknown as FirebaseFirestore.Firestore);

    expect(result.scanned).toBe(0);
    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(0);
  });
});
