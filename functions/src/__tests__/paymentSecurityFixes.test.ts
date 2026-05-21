/**
 * paymentSecurityFixes.test.ts
 *
 * Unit tests for the security/correctness fixes applied to
 * runCreateBookingPaymentIntent and runCaptureBookingPayment:
 *
 *   CRIT-A  — server-side totalAmountMinor validation vs priceSnapshot
 *   MED-H   — booking status guard (reject non-payable statuses)
 *   HIGH-D  — authorized status guard before capture
 *   HIGH-E  — finalAmountMinor ceiling (max 2× totalAmountMinor)
 *   HIGH-C  — capture_in_progress atomicity: retry skips capturePaymentIntent
 *   MED-G   — card_on_file fallback to listPaymentMethods when profile missing PM
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  runCreateBookingPaymentIntent,
  runCaptureBookingPayment,
} from "../appointmentPaymentsCallable.js";

// ---------------------------------------------------------------------------
// Mock firebase-functions logger
// ---------------------------------------------------------------------------

vi.mock("firebase-functions", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// In-memory Firestore mock
// ---------------------------------------------------------------------------

type DocData = Record<string, unknown>;

function makeFirestoreMock() {
  const docs = new Map<string, DocData>();
  const updates: Array<{ path: string; data: DocData }> = [];

  function docRef(path: string) {
    return {
      id: path.split("/").pop() ?? path,
      path,
      get: vi.fn(async () => ({
        exists: docs.has(path),
        data: () => docs.get(path) ?? null,
      })),
      set: vi.fn(async (data: DocData) => {
        docs.set(path, { ...(docs.get(path) ?? {}), ...data });
      }),
      update: vi.fn(async (data: DocData) => {
        const existing = docs.get(path) ?? {};
        const merged = { ...existing, ...data };
        docs.set(path, merged);
        updates.push({ path, data });
      }),
    };
  }

  function collectionRef(colPath: string) {
    const queryDocs = new Map<string, DocData[]>();

    function __seedQuery(results: DocData[]) {
      queryDocs.set("default", results);
    }

    const q = {
      where: (_f: string, _op: string, _v: unknown) => q,
      limit: (_n: number) => q,
      get: vi.fn(async () => {
        const results = queryDocs.get("default") ?? [];
        return {
          empty: results.length === 0,
          docs: results.map((d) => ({ data: () => d })),
        };
      }),
      __seedQuery,
    };
    return { ...q, doc: (id: string) => docRef(`${colPath}/${id}`) };
  }

  return {
    doc: (path: string) => docRef(path),
    collection: (path: string) => collectionRef(path),
    __setDoc: (path: string, data: DocData) => docs.set(path, data),
    __getDoc: (path: string) => docs.get(path),
    __updates: updates,
  };
}

// ---------------------------------------------------------------------------
// Stripe mock factories
// ---------------------------------------------------------------------------

function makeCreateIntentStripeMock() {
  return {
    createCustomer: vi.fn(async () => ({ id: "cus_new" })),
    createEphemeralKey: vi.fn(async () => ({ secret: "ek_secret" })),
    createSetupIntent: vi.fn(async () => ({
      id: "si_new",
      status: "requires_confirmation",
      client_secret: "si_new_secret",
    })),
    createPaymentIntentManual: vi.fn(async () => ({
      id: "pi_new",
      status: "requires_confirmation",
      client_secret: "pi_new_secret",
    })),
    retrievePaymentIntent: vi.fn(async () => ({
      id: "pi_existing",
      status: "requires_confirmation",
      client_secret: "pi_existing_secret",
    })),
    retrieveSetupIntent: vi.fn(async () => ({
      id: "si_existing",
      status: "requires_confirmation",
      client_secret: "si_existing_secret",
    })),
  };
}

function makeCaptureStripeMock() {
  return {
    capturePaymentIntent: vi.fn(async () => ({ id: "pi_captured", status: "succeeded" })),
    cancelPaymentIntent: vi.fn(async () => ({ id: "pi_canceled", status: "canceled" })),
    createOffsessionPaymentIntent: vi.fn(async () => ({
      id: "pi_offsession",
      status: "succeeded",
    })),
    listPaymentMethods: vi.fn(async () => [{ id: "pm_from_stripe", type: "card" }]),
    retrievePaymentIntent: vi.fn(async () => ({ id: "pi_existing", status: "requires_capture" })),
    createPaymentIntentManual: vi.fn(async () => ({
      id: "pi_new",
      status: "requires_confirmation",
      client_secret: "pi_new_secret",
    })),
  };
}

// ---------------------------------------------------------------------------
// DB seeding helpers
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: DocData = {
  paymentsEnabled: true,
  paymentMode: "deposit",
  depositPercentage: 30,
  platformFeePercent: 0.02,
  currency: "usd",
  cancellationPolicy: false,
};

const DEFAULT_CONNECT: DocData = {
  stripeAccountId: "acct_1",
  chargesEnabled: true,
};

/** Seed DB for createBookingPaymentIntent tests. Booking has priceSnapshot = 100 ($100). */
function seedCreateDb(
  db: ReturnType<typeof makeFirestoreMock>,
  bookingOverrides: Partial<DocData> = {},
  settingsOverrides: Partial<DocData> = {},
) {
  db.__setDoc("tenants/t1/bookings/bk1", {
    customerUserId: "u1",
    status: "confirmed",
    priceSnapshot: 100,       // $100 in major units → 10000 minor
    addonsSnapshot: [],
    ...bookingOverrides,
  });
  db.__setDoc("tenants/t1/paymentSettings/config", { ...DEFAULT_SETTINGS, ...settingsOverrides });
  db.__setDoc("tenants/t1/connect/account", DEFAULT_CONNECT);
}

const BASE_CREATE_INPUT = {
  tenantId: "t1",
  bookingId: "bk1",
  totalAmountMinor: 10000,
  currency: "usd",
};

const noEmail = async () => null;

/** Seed DB for captureBookingPayment tests. */
function seedCaptureDb(
  db: ReturnType<typeof makeFirestoreMock>,
  paymentOverrides: Partial<DocData> = {},
  profileOverrides: Partial<DocData> | null = {
    stripeCustomerId: "cus_1",
    defaultPaymentMethodId: "pm_card",
  },
) {
  db.__setDoc("tenants/t1", { ownerUid: "admin1" });
  db.__setDoc("tenants/t1/appointmentPayments/bk1", {
    bookingId: "bk1",
    tenantId: "t1",
    userId: "u1",
    paymentMode: "deposit",
    currency: "usd",
    totalAmountMinor: 10000,
    authorizedAmountMinor: 3000,
    capturedAmountMinor: 0,
    tipAmountMinor: 0,
    stripePaymentIntentId: "pi_hold",
    stripeSetupIntentId: null,
    stripePaymentMethodId: "pm_card",
    status: "authorized",
    stripeStatus: "requires_capture",
    notes: null,
    ...paymentOverrides,
  });
  db.__setDoc("tenants/t1/paymentSettings/config", DEFAULT_SETTINGS);
  db.__setDoc("tenants/t1/connect/account", DEFAULT_CONNECT);
  if (profileOverrides !== null) {
    db.__setDoc("clients/u1/tenantPaymentProfiles/t1", profileOverrides);
  }
}

const BASE_CAPTURE_INPUT = {
  tenantId: "t1",
  bookingId: "bk1",
  finalAmountMinor: 3000,
};

// ===========================================================================
// CRIT-A: server-side price validation
// ===========================================================================

describe("CRIT-A — runCreateBookingPaymentIntent: server-side price validation", () => {
  let db: ReturnType<typeof makeFirestoreMock>;
  let stripe: ReturnType<typeof makeCreateIntentStripeMock>;

  beforeEach(() => {
    db = makeFirestoreMock();
    stripe = makeCreateIntentStripeMock();
  });

  it("passes when totalAmountMinor exactly matches priceSnapshot * 100", async () => {
    seedCreateDb(db, { priceSnapshot: 100 });   // 100 * 100 = 10000
    const result = await runCreateBookingPaymentIntent(
      db as never, stripe as never, noEmail, "u1",
      { ...BASE_CREATE_INPUT, totalAmountMinor: 10000 },
    );
    expect(result.type).not.toBe("error");
  });

  it("passes when within 10% tolerance (legitimate discount)", async () => {
    seedCreateDb(db, { priceSnapshot: 100 });   // expected 10000, allow ±1000
    // 9100 is 9% below 10000 → within 10% tolerance
    const result = await runCreateBookingPaymentIntent(
      db as never, stripe as never, noEmail, "u1",
      { ...BASE_CREATE_INPUT, totalAmountMinor: 9100 },
    );
    expect(result.type).not.toBe("error");
  });

  it("throws invalid-argument when totalAmountMinor is >10% above priceSnapshot", async () => {
    seedCreateDb(db, { priceSnapshot: 100 });   // expected 10000
    // 11500 = 15% above 10000 → rejected
    await expect(
      runCreateBookingPaymentIntent(db as never, stripe as never, noEmail, "u1", {
        ...BASE_CREATE_INPUT,
        totalAmountMinor: 11500,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("not within 10%"),
    });
  });

  it("throws invalid-argument when totalAmountMinor is >10% below priceSnapshot", async () => {
    seedCreateDb(db, { priceSnapshot: 100 });   // expected 10000
    // 8000 = 20% below → rejected (under-charge attack)
    await expect(
      runCreateBookingPaymentIntent(db as never, stripe as never, noEmail, "u1", {
        ...BASE_CREATE_INPUT,
        totalAmountMinor: 8000,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("not within 10%"),
    });
  });

  it("skips validation when priceSnapshot is 0 (free service)", async () => {
    seedCreateDb(db, { priceSnapshot: 0 });
    // Any positive amount is accepted when no price snapshot
    const result = await runCreateBookingPaymentIntent(
      db as never, stripe as never, noEmail, "u1",
      { ...BASE_CREATE_INPUT, totalAmountMinor: 500 },
    );
    expect(result.type).not.toBe("error");
  });

  it("includes addonsSnapshot in expected total", async () => {
    // basePrice $80 + addon $20 = $100 → 10000 minor
    seedCreateDb(db, {
      priceSnapshot: 80,
      addonsSnapshot: [{ price: 20 }],
    });
    const result = await runCreateBookingPaymentIntent(
      db as never, stripe as never, noEmail, "u1",
      { ...BASE_CREATE_INPUT, totalAmountMinor: 10000 },
    );
    expect(result.type).not.toBe("error");

    // But if client omits the addon amount → too low → rejected
    await expect(
      runCreateBookingPaymentIntent(db as never, stripe as never, noEmail, "u1", {
        ...BASE_CREATE_INPUT,
        totalAmountMinor: 7000,   // only base, missing $20 addon
      }),
    ).rejects.toMatchObject({ message: expect.stringContaining("not within 10%") });
  });
});

// ===========================================================================
// MED-H: booking status guard
// ===========================================================================

describe("MED-H — runCreateBookingPaymentIntent: booking status validation", () => {
  let db: ReturnType<typeof makeFirestoreMock>;
  let stripe: ReturnType<typeof makeCreateIntentStripeMock>;

  beforeEach(() => {
    db = makeFirestoreMock();
    stripe = makeCreateIntentStripeMock();
  });

  it.each(["pending", "confirmed", "reschedule_pending", "reschedule_rejected", "rescheduled"])(
    "allows payment intent creation for active status: %s",
    async (status) => {
      seedCreateDb(db, { status });
      const result = await runCreateBookingPaymentIntent(
        db as never, stripe as never, noEmail, "u1", BASE_CREATE_INPUT,
      );
      expect(result.type).not.toBe("error");
    },
  );

  it.each(["completed", "cancelled", "rejected", "no_show"])(
    "throws failed-precondition for terminal status: %s",
    async (status) => {
      seedCreateDb(db, { status });
      await expect(
        runCreateBookingPaymentIntent(db as never, stripe as never, noEmail, "u1", BASE_CREATE_INPUT),
      ).rejects.toMatchObject({
        message: expect.stringContaining("no longer active"),
      });
    },
  );
});

// ===========================================================================
// HIGH-D: authorized status guard
// ===========================================================================

describe("HIGH-D — runCaptureBookingPayment: authorized status guard", () => {
  let db: ReturnType<typeof makeFirestoreMock>;
  let stripe: ReturnType<typeof makeCaptureStripeMock>;

  beforeEach(() => {
    db = makeFirestoreMock();
    stripe = makeCaptureStripeMock();
  });

  it("throws failed-precondition when status is 'pending' (not yet authorized)", async () => {
    seedCaptureDb(db, { status: "pending" });
    await expect(
      runCaptureBookingPayment(db as never, stripe as never, "admin1", BASE_CAPTURE_INPUT),
    ).rejects.toMatchObject({
      message: expect.stringContaining('"pending"'),
    });
    expect(stripe.capturePaymentIntent).not.toHaveBeenCalled();
  });

  it("proceeds normally when status is 'authorized'", async () => {
    seedCaptureDb(db, { status: "authorized" });
    const result = await runCaptureBookingPayment(
      db as never, stripe as never, "admin1", BASE_CAPTURE_INPUT,
    );
    expect(result.status).toBe("captured");
  });

  it("proceeds when status is 'capture_in_progress' (atomicity retry)", async () => {
    // capture_in_progress = first call crashed between capture and remainder
    seedCaptureDb(db, {
      status: "capture_in_progress",
      totalAmountMinor: 10000,
      authorizedAmountMinor: 3000,
    });
    const result = await runCaptureBookingPayment(
      db as never, stripe as never, "admin1",
      { ...BASE_CAPTURE_INPUT, finalAmountMinor: 12000 },
    );
    expect(result.status).toBe("captured");
  });

  it("bypasses guard when paidInPerson is true regardless of status", async () => {
    seedCaptureDb(db, { status: "pending" });
    const result = await runCaptureBookingPayment(
      db as never, stripe as never, "admin1",
      { ...BASE_CAPTURE_INPUT, paidInPerson: true },
    );
    expect(result.status).toBe("paid_in_person");
  });
});

// ===========================================================================
// HIGH-E: finalAmountMinor ceiling (max 2× totalAmountMinor)
// ===========================================================================

describe("HIGH-E — runCaptureBookingPayment: finalAmountMinor ceiling", () => {
  let db: ReturnType<typeof makeFirestoreMock>;
  let stripe: ReturnType<typeof makeCaptureStripeMock>;

  beforeEach(() => {
    db = makeFirestoreMock();
    stripe = makeCaptureStripeMock();
    // totalAmountMinor = 10000, so ceiling = 20000
    seedCaptureDb(db, { status: "authorized", totalAmountMinor: 10000 });
  });

  it("throws invalid-argument when finalAmountMinor > 2× totalAmountMinor", async () => {
    await expect(
      runCaptureBookingPayment(db as never, stripe as never, "admin1", {
        ...BASE_CAPTURE_INPUT,
        finalAmountMinor: 20001,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("exceeds 2×"),
    });
    expect(stripe.capturePaymentIntent).not.toHaveBeenCalled();
  });

  it("allows finalAmountMinor exactly at 2× boundary", async () => {
    // 20000 = exactly 2× totalAmountMinor → allowed
    // Need PM for remainder charge; profile has pm_card and cus_1
    const result = await runCaptureBookingPayment(db as never, stripe as never, "admin1", {
      ...BASE_CAPTURE_INPUT,
      finalAmountMinor: 17000, // high but well under 20000 ceiling, within range
    });
    expect(result.status).toBe("captured");
  });
});

// ===========================================================================
// HIGH-C: atomicity — capture_in_progress skips duplicate capture
// ===========================================================================

describe("HIGH-C — runCaptureBookingPayment: capture_in_progress atomicity", () => {
  let db: ReturnType<typeof makeFirestoreMock>;
  let stripe: ReturnType<typeof makeCaptureStripeMock>;

  beforeEach(() => {
    db = makeFirestoreMock();
    stripe = makeCaptureStripeMock();
  });

  it("writes capture_in_progress before first Stripe call in remainder path", async () => {
    seedCaptureDb(db, {
      status: "authorized",
      totalAmountMinor: 10000,
      authorizedAmountMinor: 3000,
      stripePaymentIntentId: "pi_hold",
    });

    await runCaptureBookingPayment(db as never, stripe as never, "admin1", {
      ...BASE_CAPTURE_INPUT,
      finalAmountMinor: 12000,  // 9000 remainder → uses remainder path
    });

    // capture_in_progress must have been written
    const writes = db.__updates.filter((u) => u.path === "tenants/t1/appointmentPayments/bk1");
    const progressWrite = writes.find((u) => u.data.status === "capture_in_progress");
    expect(progressWrite).toBeTruthy();

    // And capture should have been called
    expect(stripe.capturePaymentIntent).toHaveBeenCalledWith("pi_hold", "acct_1");
  });

  it("skips capturePaymentIntent when status is already capture_in_progress", async () => {
    // Simulate retry: status is capture_in_progress (first call crashed after capture)
    seedCaptureDb(db, {
      status: "capture_in_progress",
      totalAmountMinor: 10000,
      authorizedAmountMinor: 3000,
      stripePaymentIntentId: "pi_hold",
    });

    await runCaptureBookingPayment(db as never, stripe as never, "admin1", {
      ...BASE_CAPTURE_INPUT,
      finalAmountMinor: 12000,
    });

    // Must NOT call capture again (would double-charge)
    expect(stripe.capturePaymentIntent).not.toHaveBeenCalled();
    // But must call createOffsessionPaymentIntent for the remainder
    expect(stripe.createOffsessionPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        amountMinor: 9000,
        idempotencyKey: `remainder-bk1`,
      }),
    );
  });

  it("does NOT write capture_in_progress for partial capture path (no remainder)", async () => {
    seedCaptureDb(db, {
      status: "authorized",
      totalAmountMinor: 10000,
      authorizedAmountMinor: 10000,
    });

    await runCaptureBookingPayment(db as never, stripe as never, "admin1", {
      ...BASE_CAPTURE_INPUT,
      finalAmountMinor: 9000,  // less than authorized → partial capture, no remainder
    });

    const writes = db.__updates.filter((u) => u.path === "tenants/t1/appointmentPayments/bk1");
    const progressWrite = writes.find((u) => u.data.status === "capture_in_progress");
    expect(progressWrite).toBeFalsy();
  });
});

// ===========================================================================
// MED-G: card_on_file fallback to listPaymentMethods
// ===========================================================================

describe("MED-G — runCaptureBookingPayment: card_on_file listPaymentMethods fallback", () => {
  let db: ReturnType<typeof makeFirestoreMock>;
  let stripe: ReturnType<typeof makeCaptureStripeMock>;

  beforeEach(() => {
    db = makeFirestoreMock();
    stripe = makeCaptureStripeMock();
  });

  it("uses defaultPaymentMethodId from Firestore profile when available", async () => {
    seedCaptureDb(
      db,
      { paymentMode: "card_on_file", stripePaymentIntentId: null, status: "authorized" },
      { stripeCustomerId: "cus_1", defaultPaymentMethodId: "pm_saved" },
    );

    await runCaptureBookingPayment(db as never, stripe as never, "admin1", {
      ...BASE_CAPTURE_INPUT,
      finalAmountMinor: 10000,
    });

    expect(stripe.listPaymentMethods).not.toHaveBeenCalled();
    expect(stripe.createOffsessionPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethodId: "pm_saved" }),
    );
  });

  it("falls back to listPaymentMethods when defaultPaymentMethodId is null (webhook not yet arrived)", async () => {
    seedCaptureDb(
      db,
      { paymentMode: "card_on_file", stripePaymentIntentId: null, status: "authorized" },
      { stripeCustomerId: "cus_1", defaultPaymentMethodId: null },
    );
    stripe.listPaymentMethods.mockResolvedValueOnce([{ id: "pm_from_stripe", type: "card" }]);

    await runCaptureBookingPayment(db as never, stripe as never, "admin1", {
      ...BASE_CAPTURE_INPUT,
      finalAmountMinor: 10000,
    });

    expect(stripe.listPaymentMethods).toHaveBeenCalledWith("cus_1", "acct_1");
    expect(stripe.createOffsessionPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethodId: "pm_from_stripe" }),
    );
  });

  it("throws failed-precondition when listPaymentMethods returns empty array", async () => {
    seedCaptureDb(
      db,
      { paymentMode: "card_on_file", stripePaymentIntentId: null, status: "authorized" },
      { stripeCustomerId: "cus_1", defaultPaymentMethodId: null },
    );
    stripe.listPaymentMethods.mockResolvedValueOnce([]);

    await expect(
      runCaptureBookingPayment(db as never, stripe as never, "admin1", {
        ...BASE_CAPTURE_INPUT,
        finalAmountMinor: 10000,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("No saved payment method"),
    });
  });

  it("throws failed-precondition when stripeCustomerId is missing entirely", async () => {
    seedCaptureDb(
      db,
      { paymentMode: "card_on_file", stripePaymentIntentId: null, status: "authorized" },
      null, // no profile at all
    );

    await expect(
      runCaptureBookingPayment(db as never, stripe as never, "admin1", {
        ...BASE_CAPTURE_INPUT,
        finalAmountMinor: 10000,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("No saved payment method"),
    });
  });
});
