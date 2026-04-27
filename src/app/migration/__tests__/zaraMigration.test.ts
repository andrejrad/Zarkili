/**
 * zaraMigration.test.ts — Task 12.1
 *
 * Tests: idempotency, counts, field accuracy, error handling per step.
 */

import type { Firestore } from "firebase/firestore";
import { runZaraMigration } from "../zaraMigration";
import type { ZaraMigrationInput } from "../zaraMigration";

// ---------------------------------------------------------------------------
// Factory for test input
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<ZaraMigrationInput> = {}): ZaraMigrationInput {
  return {
    runId: "run-001",
    tenant: {
      tenantId: "tenant-zara",
      name: "Zara Salon",
      slug: "zara-salon",
      ownerUserId: "owner-1",
      country: "HR",
      timezone: "Europe/Zagreb",
      defaultLanguage: "hr",
      defaultCurrency: "EUR",
      plan: "professional",
      branding: {
        logoUrl: null,
        primary: "#E3A9A0",
        secondary: "#F2EDDD",
        accent: "#D4A96A",
        fontHeading: "Playfair Display",
        fontBody: "Inter",
        radius: 10,
      },
      settings: {
        bookingLeadHours: 2,
        bookingMaxDays: 60,
        cancellationWindowHours: 24,
        allowGuestBooking: false,
        requireDeposit: false,
      },
    },
    location: {
      locationId: "loc-zara-hq",
      name: "Zara HQ",
      code: "ZARA-HQ",
      timezone: "Europe/Zagreb",
      phone: "+385991234567",
      email: "hello@zara.hr",
      address: { line1: "Ilica 10", city: "Zagreb", country: "HR", postalCode: "10000" },
      operatingHours: { mon: [{ start: "09:00", end: "18:00" }] },
    },
    users: [
      { userId: "user-owner", displayName: "Ana", email: "ana@zara.hr", role: "tenant_owner" },
      { userId: "user-staff1", displayName: "Maja", email: "maja@zara.hr", role: "technician" },
      { userId: "user-client1", displayName: "Petra", email: "petra@gmail.com", role: "client" },
    ],
    bookings: [
      {
        bookingId: "bk-001",
        staffId: "user-staff1",
        serviceId: "svc-1",
        customerUserId: "user-client1",
        date: "2025-12-01",
        startMinutes: 540,
        endMinutes: 600,
        startTime: "09:00",
        endTime: "10:00",
        durationMinutes: 60,
        bufferMinutes: 0,
        status: "completed",
        notes: null,
      },
    ],
    loyaltyBalances: [
      { userId: "user-client1", points: 120, lifetimePoints: 250 },
    ],
    loyaltyTransactions: [
      {
        legacyTxId: "ltx-001",
        userId: "user-client1",
        type: "credit",
        points: 120,
        reason: "booking_completed",
        referenceId: "bk-001",
        createdAtIso: "2025-12-01T10:00:00Z",
      },
    ],
    placeholderStaffId: "staff-placeholder",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// The real test approaches: we test the pure logic paths using our own
// in-memory store via jest.mock at module level.
// ---------------------------------------------------------------------------

jest.mock("firebase/firestore", () => {
  const store = new Map<string, Record<string, unknown>>();
  (global as unknown as { __firestoreStore: Map<string, Record<string, unknown>> }).__firestoreStore = store;

  return {
    doc: jest.fn((_db: unknown, ...segs: string[]) => ({ _path: segs.join("/") })),
    getDoc: jest.fn(async (ref: { _path: string }) => {
      const data = store.get(ref._path);
      return { exists: () => data !== undefined, data: () => data, id: ref._path.split("/").pop() };
    }),
    setDoc: jest.fn(async (ref: { _path: string }, data: Record<string, unknown>, opts?: { merge?: boolean }) => {
      if (opts?.merge) {
        store.set(ref._path, { ...(store.get(ref._path) ?? {}), ...data });
      } else {
        store.set(ref._path, { ...data });
      }
    }),
    updateDoc: jest.fn(async (ref: { _path: string }, data: Record<string, unknown>) => {
      store.set(ref._path, { ...(store.get(ref._path) ?? {}), ...data });
    }),
    writeBatch: jest.fn(() => {
      const ops: { path: string; data: Record<string, unknown>; merge?: boolean }[] = [];
      return {
        set: jest.fn((ref: { _path: string }, data: Record<string, unknown>, opts?: { merge?: boolean }) => {
          ops.push({ path: ref._path, data, merge: opts?.merge });
        }),
        commit: jest.fn(async () => {
          for (const op of ops) {
            if (op.merge) {
              store.set(op.path, { ...(store.get(op.path) ?? {}), ...op.data });
            } else {
              store.set(op.path, { ...op.data });
            }
          }
          ops.length = 0;
        }),
      };
    }),
    getDocs: jest.fn(async () => ({ empty: true, docs: [] })),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    serverTimestamp: jest.fn(() => ({ _type: "serverTimestamp" })),
  };
});

function getStore(): Map<string, Record<string, unknown>> {
  return (global as unknown as { __firestoreStore: Map<string, Record<string, unknown>> }).__firestoreStore;
}

beforeEach(() => {
  getStore().clear();
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("runZaraMigration — tenant + location", () => {
  it("creates tenant record on first run", async () => {
    const result = await runZaraMigration({} as Firestore, makeInput());
    expect(result.tenant.created).toBe(true);
    expect(getStore().has("tenants/tenant-zara")).toBe(true);
  });

  it("skips tenant if already exists", async () => {
    getStore().set("tenants/tenant-zara", { tenantId: "tenant-zara" });
    const result = await runZaraMigration({} as Firestore, makeInput());
    expect(result.tenant.created).toBe(false);
  });

  it("creates location record on first run", async () => {
    const result = await runZaraMigration({} as Firestore, makeInput());
    expect(result.location.created).toBe(true);
    expect(getStore().has("locations/loc-zara-hq")).toBe(true);
  });

  it("skips location if already exists", async () => {
    getStore().set("locations/loc-zara-hq", { locationId: "loc-zara-hq" });
    const result = await runZaraMigration({} as Firestore, makeInput());
    expect(result.location.created).toBe(false);
  });

  it("stamps tenant with migrationRunId", async () => {
    await runZaraMigration({} as Firestore, makeInput());
    const tenant = getStore().get("tenants/tenant-zara");
    expect(tenant?.migrationRunId).toBe("run-001");
  });
});

describe("runZaraMigration — users", () => {
  it("creates all users on first run", async () => {
    const result = await runZaraMigration({} as Firestore, makeInput());
    expect(result.users.created).toBe(3);
    expect(result.users.skipped).toBe(0);
  });

  it("skips users that already have a membership doc", async () => {
    getStore().set("tenantUsers/tenant-zara_user-owner", { membershipId: "tenant-zara_user-owner" });
    const result = await runZaraMigration({} as Firestore, makeInput());
    expect(result.users.skipped).toBe(1);
    expect(result.users.created).toBe(2);
  });

  it("records mismatch for user with missing role", async () => {
    const input = makeInput();
    input.users = [{ userId: "bad-user", displayName: "X", email: null, role: "" as never }];
    const result = await runZaraMigration({} as Firestore, input);
    expect(result.users.mismatches).toHaveLength(1);
    expect(result.users.mismatches[0].userId).toBe("bad-user");
  });

  it("sets status=partial when there are mismatches", async () => {
    const input = makeInput();
    input.users = [{ userId: "bad", displayName: "X", email: null, role: "" as never }];
    const result = await runZaraMigration({} as Firestore, input);
    expect(result.overallStatus).toBe("partial");
  });
});

describe("runZaraMigration — bookings", () => {
  it("backfills bookings with tenantId and locationId", async () => {
    const result = await runZaraMigration({} as Firestore, makeInput());
    expect(result.bookings.backfilled).toBe(1);
    const booking = getStore().get("bookings/bk-001");
    expect(booking?.tenantId).toBe("tenant-zara");
    expect(booking?.locationId).toBe("loc-zara-hq");
  });

  it("skips bookings already tagged with the correct tenantId", async () => {
    getStore().set("bookings/bk-001", { tenantId: "tenant-zara" });
    const result = await runZaraMigration({} as Firestore, makeInput());
    expect(result.bookings.skipped).toBe(1);
    expect(result.bookings.backfilled).toBe(0);
  });

  it("uses placeholderStaffId when booking has no staffId", async () => {
    const input = makeInput();
    input.bookings[0].staffId = null;
    await runZaraMigration({} as Firestore, input);
    const booking = getStore().get("bookings/bk-001");
    expect(booking?.staffId).toBe("staff-placeholder");
  });

  it("stamps booking with migrationRunId", async () => {
    await runZaraMigration({} as Firestore, makeInput());
    const booking = getStore().get("bookings/bk-001");
    expect(booking?.migrationRunId).toBe("run-001");
  });
});

describe("runZaraMigration — loyalty", () => {
  it("writes loyalty balance for each user", async () => {
    const result = await runZaraMigration({} as Firestore, makeInput());
    expect(result.loyalty.balancesWritten).toBe(1);
    const state = getStore().get("tenants/tenant-zara/loyaltyStates/user-client1");
    expect(state?.points).toBe(120);
    expect(state?.lifetimePoints).toBe(250);
  });

  it("writes loyalty transaction with idempotency record", async () => {
    const result = await runZaraMigration({} as Firestore, makeInput());
    expect(result.loyalty.transactionsWritten).toBe(1);
    expect(getStore().has("tenants/tenant-zara/loyaltyTransactions/migrated_ltx-001")).toBe(true);
    expect(getStore().has("tenants/tenant-zara/loyaltyIdempotency/migrate_ltx-001")).toBe(true);
  });

  it("skips loyalty transaction if idempotency record already exists", async () => {
    getStore().set("tenants/tenant-zara/loyaltyIdempotency/migrate_ltx-001", { txId: "migrated_ltx-001" });
    const result = await runZaraMigration({} as Firestore, makeInput());
    expect(result.loyalty.transactionsSkipped).toBe(1);
    expect(result.loyalty.transactionsWritten).toBe(0);
  });
});

describe("runZaraMigration — summary", () => {
  it("returns success when no errors or mismatches", async () => {
    const result = await runZaraMigration({} as Firestore, makeInput());
    expect(result.overallStatus).toBe("success");
    expect(result.runId).toBe("run-001");
    expect(result.completedAt).toBeTruthy();
  });

  it("is fully idempotent on re-run", async () => {
    await runZaraMigration({} as Firestore, makeInput());
    const result2 = await runZaraMigration({} as Firestore, makeInput());
    // Second run creates nothing
    expect(result2.tenant.created).toBe(false);
    expect(result2.location.created).toBe(false);
    expect(result2.users.skipped).toBe(3);
    expect(result2.bookings.skipped).toBe(1);
    // Loyalty tx skipped due to idempotency
    expect(result2.loyalty.transactionsSkipped).toBe(1);
    expect(result2.overallStatus).toBe("success");
  });
});
