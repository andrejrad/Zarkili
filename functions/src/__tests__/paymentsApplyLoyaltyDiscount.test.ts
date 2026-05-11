/**
 * paymentsApplyLoyaltyDiscount.test.ts
 *
 * Unit tests for the handleApplyLoyaltyDiscount pure handler.
 * Uses an in-memory Firestore mock — no firebase-admin runtime required.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleApplyLoyaltyDiscount } from "../payments";

// ---------------------------------------------------------------------------
// Lightweight HttpsError stand-in (mirrors firebase-functions/v2/https shape)
// ---------------------------------------------------------------------------

// The real HttpsError is imported inside payments.ts. Our assertions simply
// check `.message` and duck-type on `.errorInfo.status` which the real class
// exposes as `.httpErrorCode.status`; we just check message strings instead.

// ---------------------------------------------------------------------------
// Firestore mock factory
// ---------------------------------------------------------------------------

type DocData = Record<string, unknown>;

// Captured operations for assertions
type SetOp = { ref: string; data: DocData };

function makeFirestoreMock() {
  const docs = new Map<string, DocData>();
  const setOps: SetOp[] = [];

  // Seed helper
  function __setDoc(path: string, data: DocData) {
    docs.set(path, data);
  }

  function docRef(path: string) {
    return {
      id: path.split("/").pop() ?? path,
      path,
      get: vi.fn(async () => ({
        exists: docs.has(path),
        data: () => docs.get(path),
      })),
    };
  }

  // Transaction mock: runs callback synchronously using a simple txn object
  async function runTransaction<T>(
    callback: (txn: {
      get: typeof _txnGet;
      set: typeof _txnSet;
    }) => Promise<T>,
  ): Promise<T> {
    function _txnGet(ref: { path: string }) {
      return Promise.resolve({
        exists: docs.has(ref.path),
        data: () => docs.get(ref.path),
      });
    }
    function _txnSet(ref: { path: string }, data: DocData) {
      docs.set(ref.path, data);
      setOps.push({ ref: ref.path, data });
    }
    return callback({ get: _txnGet, set: _txnSet });
  }

  // We need both _txnGet and _txnSet in scope but TypeScript would complain
  // about forward references, so name them before the callback:
  function _txnGet(ref: { path: string }) {
    return Promise.resolve({
      exists: docs.has(ref.path),
      data: () => docs.get(ref.path),
    });
  }
  function _txnSet(ref: { path: string }, data: DocData) {
    docs.set(ref.path, data);
    setOps.push({ ref: ref.path, data });
  }

  let autoIdCounter = 0;

  function collectionRef(colPath: string) {
    return {
      doc: () => {
        autoIdCounter += 1;
        const id = `auto-id-${autoIdCounter}`;
        const path = `${colPath}/${id}`;
        return { id, path };
      },
    };
  }

  const db = {
    doc: (path: string) => docRef(path),
    collection: (path: string) => collectionRef(path),
    runTransaction,
    // Inspection helpers
    __setDoc,
    __setOps: setOps,
    __docs: docs,
  };

  return db;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT = "tenant-1";
const USER = "user-42";
const BOOKING = "booking-abc";
const IDEMP_KEY = `booking_${BOOKING}_loyalty_v1`;

function makeInput(overrides: Partial<Parameters<typeof handleApplyLoyaltyDiscount>[2]> = {}) {
  return {
    tenantId: TENANT,
    userId: USER,
    bookingId: BOOKING,
    pointsToDebit: 100,
    idempotencyKey: IDEMP_KEY,
    ...overrides,
  };
}

function seedConfig(
  db: ReturnType<typeof makeFirestoreMock>,
  overrides: Record<string, unknown> = {},
) {
  db.__setDoc(`tenants/${TENANT}/loyaltyConfig/config`, {
    enabled: true,
    pointsPerCurrencyUnit: 2,
    ...overrides,
  });
}

function seedState(
  db: ReturnType<typeof makeFirestoreMock>,
  points: number,
  lifetimePoints = 500,
) {
  db.__setDoc(`tenants/${TENANT}/loyaltyStates/${USER}`, {
    userId: USER,
    tenantId: TENANT,
    points,
    lifetimePoints,
    currentTierId: "bronze",
    enrolledAt: { seconds: 0, nanoseconds: 0 },
    updatedAt: { seconds: 0, nanoseconds: 0 },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("handleApplyLoyaltyDiscount", () => {
  let db: ReturnType<typeof makeFirestoreMock>;

  beforeEach(() => {
    db = makeFirestoreMock();
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  it("throws permission-denied when callerUid !== userId", async () => {
    seedConfig(db);
    seedState(db, 200);
    await expect(
      handleApplyLoyaltyDiscount(
        db as never,
        "other-user",
        makeInput(),
      ),
    ).rejects.toThrow("You may only redeem your own loyalty points");
  });

  // ── Config guard ──────────────────────────────────────────────────────────

  it("throws failed-precondition when loyalty config is missing", async () => {
    seedState(db, 200);
    await expect(
      handleApplyLoyaltyDiscount(db as never, USER, makeInput()),
    ).rejects.toThrow("not configured");
  });

  it("throws failed-precondition when loyalty programme is disabled", async () => {
    seedConfig(db, { enabled: false });
    seedState(db, 200);
    await expect(
      handleApplyLoyaltyDiscount(db as never, USER, makeInput()),
    ).rejects.toThrow("disabled");
  });

  // ── Insufficient balance ──────────────────────────────────────────────────

  it("throws resource-exhausted when user has too few points", async () => {
    seedConfig(db);
    seedState(db, 50); // only 50 points; requesting 100
    await expect(
      handleApplyLoyaltyDiscount(db as never, USER, makeInput()),
    ).rejects.toThrow("Insufficient loyalty points");
  });

  it("throws resource-exhausted when user has no loyalty state document", async () => {
    seedConfig(db);
    // no seedState — user has 0 balance
    await expect(
      handleApplyLoyaltyDiscount(db as never, USER, makeInput()),
    ).rejects.toThrow("Insufficient loyalty points");
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it("debits points and returns discountMinor = pointsToDebit (1 pt = 1 minor unit)", async () => {
    seedConfig(db);
    seedState(db, 200);

    const result = await handleApplyLoyaltyDiscount(db as never, USER, makeInput());

    expect(result.pointsDebited).toBe(100);
    expect(result.discountMinor).toBe(100); // 100 points → 100 minor units
    expect(result.loyaltyTransactionId).toBeTruthy();
  });

  it("decrements the loyalty state balance correctly", async () => {
    seedConfig(db);
    seedState(db, 200);

    await handleApplyLoyaltyDiscount(db as never, USER, makeInput());

    const stateDoc = db.__docs.get(`tenants/${TENANT}/loyaltyStates/${USER}`);
    expect(stateDoc?.points).toBe(100); // 200 - 100 = 100
  });

  it("writes a loyalty transaction doc of type debit", async () => {
    seedConfig(db);
    seedState(db, 500);

    const result = await handleApplyLoyaltyDiscount(db as never, USER, makeInput());

    const txPath = `tenants/${TENANT}/loyaltyTransactions/${result.loyaltyTransactionId}`;
    const txDoc = db.__docs.get(txPath);
    expect(txDoc?.type).toBe("debit");
    expect(txDoc?.points).toBe(100);
    expect(txDoc?.reason).toBe("loyalty_discount");
    expect(txDoc?.referenceId).toBe(BOOKING);
    expect(txDoc?.idempotencyKey).toBe(IDEMP_KEY);
  });

  it("writes the idempotency marker with txId and discountMinor", async () => {
    seedConfig(db);
    seedState(db, 500);

    const result = await handleApplyLoyaltyDiscount(db as never, USER, makeInput());

    const idempPath = `tenants/${TENANT}/loyaltyIdempotency/${IDEMP_KEY}`;
    const idempDoc = db.__docs.get(idempPath);
    expect(idempDoc?.txId).toBe(result.loyaltyTransactionId);
    expect(idempDoc?.discountMinor).toBe(100);
    expect(idempDoc?.pointsDebited).toBe(100);
  });

  // ── Idempotency ───────────────────────────────────────────────────────────

  it("returns cached result without debiting again on duplicate call", async () => {
    seedConfig(db);
    seedState(db, 500);

    // First call
    const first = await handleApplyLoyaltyDiscount(db as never, USER, makeInput());

    // Capture state after first call
    const stateAfterFirst = db.__docs.get(`tenants/${TENANT}/loyaltyStates/${USER}`);
    const balanceAfterFirst = stateAfterFirst?.points as number;

    // Second call with same idempotency key
    const second = await handleApplyLoyaltyDiscount(db as never, USER, makeInput());

    // Should return the same result
    expect(second.loyaltyTransactionId).toBe(first.loyaltyTransactionId);
    expect(second.discountMinor).toBe(first.discountMinor);
    expect(second.pointsDebited).toBe(first.pointsDebited);

    // Balance must not have changed after second call
    const stateAfterSecond = db.__docs.get(`tenants/${TENANT}/loyaltyStates/${USER}`);
    expect(stateAfterSecond?.points).toBe(balanceAfterFirst);
  });

  // ── Edge: exact balance ───────────────────────────────────────────────────

  it("succeeds when user has exactly enough points", async () => {
    seedConfig(db);
    seedState(db, 100); // exactly 100

    const result = await handleApplyLoyaltyDiscount(
      db as never,
      USER,
      makeInput({ pointsToDebit: 100 }),
    );

    expect(result.pointsDebited).toBe(100);
    const stateDoc = db.__docs.get(`tenants/${TENANT}/loyaltyStates/${USER}`);
    expect(stateDoc?.points).toBe(0);
  });
});
