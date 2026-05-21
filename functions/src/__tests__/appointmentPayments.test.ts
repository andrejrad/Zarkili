/**
 * appointmentPayments.test.ts
 *
 * Unit tests for runCaptureBookingPayment and runCancelBookingPayment pure
 * handlers.  No Cloud Functions runtime or firebase-admin runtime required.
 *
 * Key paths tested:
 *   captureBookingPayment:
 *     - paid_in_person: cancels hold, writes paid_in_person
 *     - card_on_file + succeeded: writes captured
 *     - card_on_file + declined: throws + writes failed         (Bug #2 fix)
 *     - deposit + exact capture (finalAmount ≤ authorized)
 *     - deposit + remainder but no payment method → throws BEFORE capture  (Bug #1 fix)
 *     - deposit + remainder with payment method → captures + charges remainder
 *
 *   cancelBookingPayment:
 *     - no payment record → returns no_payment
 *     - already terminal status → returns current status
 *     - customer cancels own booking outside policy window → cancels PI
 *     - admin cancels within window, deposit charge → captures deposit
 *     - admin cancels within window, custom fee → cancels PI + off-session charge
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  runCaptureBookingPayment,
  runCancelBookingPayment,
} from "../appointmentPaymentsCallable.js";

// ---------------------------------------------------------------------------
// Mock firebase-functions logger so logger.warn/error don't throw in test env
// ---------------------------------------------------------------------------

vi.mock("firebase-functions", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DocData = Record<string, unknown>;

// ---------------------------------------------------------------------------
// In-memory Firestore mock
// ---------------------------------------------------------------------------

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
      update: vi.fn(async (data: DocData) => {
        const existing = docs.get(path) ?? {};
        const merged = { ...existing, ...data };
        docs.set(path, merged);
        updates.push({ path, data });
      }),
    };
  }

  function collectionRef(colPath: string) {
    const queryResults = new Map<string, DocData[]>();

    function __seedQuery(qualifier: string, results: DocData[]) {
      queryResults.set(qualifier, results);
    }

    const q = {
      where: (_f: string, _op: string, _v: unknown) => q,
      limit: (_n: number) => q,
      get: vi.fn(async () => ({
        empty: (queryResults.get("default") ?? []).length === 0,
        docs: (queryResults.get("default") ?? []).map((d) => ({ data: () => d })),
      })),
      __seedQuery,
    };

    return { ...q, doc: (id: string) => docRef(`${colPath}/${id}`) };
  }

  const db = {
    doc: (path: string) => docRef(path),
    collection: (path: string) => collectionRef(path),
    __setDoc: (path: string, data: DocData) => docs.set(path, data),
    __getDoc: (path: string) => docs.get(path),
    __updates: updates,
  };

  return db;
}

// ---------------------------------------------------------------------------
// Stripe client mock factory
// ---------------------------------------------------------------------------

function makeStripeMock() {
  return {
    capturePaymentIntent: vi.fn(async () => ({ id: "pi_captured", status: "succeeded" })),
    cancelPaymentIntent: vi.fn(async () => ({ id: "pi_canceled", status: "canceled" })),
    createOffsessionPaymentIntent: vi.fn(async () => ({
      id: "pi_offsession",
      status: "succeeded",
    })),
    createPaymentIntentManual: vi.fn(async () => ({
      id: "pi_new",
      status: "requires_confirmation",
      client_secret: "pi_new_secret",
    })),
    retrievePaymentIntent: vi.fn(async () => ({
      id: "pi_existing",
      status: "requires_capture",
      client_secret: "pi_existing_secret",
    })),
    retrieveSetupIntent: vi.fn(async () => ({
      id: "si_existing",
      status: "succeeded",
      client_secret: null,
    })),
    createSetupIntent: vi.fn(async () => ({
      id: "si_new",
      status: "requires_confirmation",
      client_secret: "si_new_secret",
    })),
    createCustomer: vi.fn(async () => ({ id: "cus_new" })),
    createEphemeralKey: vi.fn(async () => ({ secret: "ek_secret" })),
  };
}

// ---------------------------------------------------------------------------
// Repo data factory helpers
// ---------------------------------------------------------------------------

const BASE_PAYMENT: DocData = {
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
  authorizedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

const CAPTURE_INPUT = {
  tenantId: "t1",
  bookingId: "bk1",
  finalAmountMinor: 3000,
};

// ---------------------------------------------------------------------------
// Seeding helpers — build a consistent Firestore mock state for each group
// ---------------------------------------------------------------------------

function seedCaptureDb(
  db: ReturnType<typeof makeFirestoreMock>,
  paymentOverrides: Partial<DocData> = {},
  profileOverrides: Partial<DocData> | null = { stripeCustomerId: "cus_1", defaultPaymentMethodId: "pm_card" },
) {
  // Tenant doc (owner)
  db.__setDoc("tenants/t1", { ownerUid: "admin1" });
  // Staff collection returns empty by default (owner check is sufficient)
  // Payment record
  db.__setDoc("tenants/t1/appointmentPayments/bk1", { ...BASE_PAYMENT, ...paymentOverrides });
  // Payment settings
  db.__setDoc("tenants/t1/paymentSettings/config", {
    paymentsEnabled: true,
    paymentMode: "deposit",
    depositPercentage: 30,
    platformFeePercent: 0.02,
    cancellationPolicy: false,
  });
  // Connect account
  db.__setDoc("tenants/t1/connect/account", {
    stripeAccountId: "acct_1",
    chargesEnabled: true,
  });
  // Tenant customer profile
  if (profileOverrides !== null) {
    db.__setDoc("clients/u1/tenantPaymentProfiles/t1", profileOverrides);
  }
}

// ---------------------------------------------------------------------------
// Tests: runCaptureBookingPayment
// ---------------------------------------------------------------------------

describe("runCaptureBookingPayment", () => {
  let db: ReturnType<typeof makeFirestoreMock>;
  let stripe: ReturnType<typeof makeStripeMock>;

  beforeEach(() => {
    db = makeFirestoreMock();
    stripe = makeStripeMock();
  });

  it("throws not-found when no payment record exists", async () => {
    db.__setDoc("tenants/t1", { ownerUid: "admin1" });
    db.__setDoc("tenants/t1/paymentSettings/config", { paymentsEnabled: true, paymentMode: "deposit" });
    db.__setDoc("tenants/t1/connectAccount/main", { stripeAccountId: "acct_1", chargesEnabled: true });

    await expect(
      runCaptureBookingPayment(db as never, stripe as never, "admin1", CAPTURE_INPUT),
    ).rejects.toMatchObject({ message: "Appointment payment record not found." });
  });

  it("paid_in_person: cancels PI and writes paid_in_person status", async () => {
    seedCaptureDb(db);
    const input = { ...CAPTURE_INPUT, finalAmountMinor: 5000, paidInPerson: true };

    const result = await runCaptureBookingPayment(db as never, stripe as never, "admin1", input);

    expect(result.status).toBe("paid_in_person");
    expect(stripe.cancelPaymentIntent).toHaveBeenCalledWith("pi_hold", "acct_1");
    const record = db.__getDoc("tenants/t1/appointmentPayments/bk1");
    expect(record?.status).toBe("paid_in_person");
    expect(record?.capturedAmountMinor).toBe(5000);
  });

  it("card_on_file + succeeded: writes captured status", async () => {
    seedCaptureDb(db, {
      paymentMode: "card_on_file",
      stripePaymentIntentId: null,
      status: "authorized",
    });
    stripe.createOffsessionPaymentIntent.mockResolvedValueOnce({
      id: "pi_cof",
      status: "succeeded",
    });

    const result = await runCaptureBookingPayment(db as never, stripe as never, "admin1", {
      ...CAPTURE_INPUT,
      finalAmountMinor: 10000,
      tipAmountMinor: 500,
    });

    expect(result.status).toBe("succeeded");
    const record = db.__getDoc("tenants/t1/appointmentPayments/bk1");
    expect(record?.status).toBe("captured");
    expect(record?.capturedAmountMinor).toBe(10000);
    expect(record?.tipAmountMinor).toBe(500);
  });

  it("card_on_file + declined: throws and writes failed status (Bug #2 fix)", async () => {
    seedCaptureDb(db, {
      paymentMode: "card_on_file",
      stripePaymentIntentId: null,
      status: "authorized",
    });
    stripe.createOffsessionPaymentIntent.mockResolvedValueOnce({
      id: "pi_declined",
      status: "requires_payment_method",
    });

    await expect(
      runCaptureBookingPayment(db as never, stripe as never, "admin1", {
        ...CAPTURE_INPUT,
        finalAmountMinor: 10000,
      }),
    ).rejects.toMatchObject({ message: expect.stringContaining("declined") });

    const record = db.__getDoc("tenants/t1/appointmentPayments/bk1");
    expect(record?.status).toBe("failed");
    expect(record?.capturedAmountMinor).toBe(0);
  });

  it("deposit: exact capture (finalAmount === authorizedAmount) calls capturePaymentIntent", async () => {
    seedCaptureDb(db);

    const result = await runCaptureBookingPayment(db as never, stripe as never, "admin1", {
      ...CAPTURE_INPUT,
      finalAmountMinor: 3000, // equals authorizedAmountMinor
    });

    expect(result.status).toBe("captured");
    expect(stripe.capturePaymentIntent).toHaveBeenCalledWith("pi_hold", "acct_1", 3000);
    expect(stripe.createOffsessionPaymentIntent).not.toHaveBeenCalled();
    const record = db.__getDoc("tenants/t1/appointmentPayments/bk1");
    expect(record?.status).toBe("captured");
  });

  it("deposit + remainder but no payment method: throws BEFORE capturing (Bug #1 fix)", async () => {
    // No profile on file
    seedCaptureDb(db, {}, null);

    await expect(
      runCaptureBookingPayment(db as never, stripe as never, "admin1", {
        ...CAPTURE_INPUT,
        finalAmountMinor: 12000, // exceeds authorizedAmountMinor: 3000
      }),
    ).rejects.toMatchObject({ message: expect.stringContaining("No saved payment method") });

    // The hold must NOT have been captured
    expect(stripe.capturePaymentIntent).not.toHaveBeenCalled();
  });

  it("deposit + remainder with payment method: captures hold then charges remainder", async () => {
    seedCaptureDb(db, {}, { stripeCustomerId: "cus_1", defaultPaymentMethodId: null });
    // defaultPaymentMethodId is null but stripePaymentMethodId is on the payment record
    // (set by the webhook at authorization time)

    const result = await runCaptureBookingPayment(db as never, stripe as never, "admin1", {
      ...CAPTURE_INPUT,
      finalAmountMinor: 12000, // 9000 remainder over the 3000 hold
      tipAmountMinor: 0,
    });

    expect(result.status).toBe("captured");
    expect(stripe.capturePaymentIntent).toHaveBeenCalledWith("pi_hold", "acct_1");
    expect(stripe.createOffsessionPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ amountMinor: 9000, idempotencyKey: "remainder-bk1" }),
    );
    const record = db.__getDoc("tenants/t1/appointmentPayments/bk1");
    expect(record?.status).toBe("captured");
    expect(record?.capturedAmountMinor).toBe(12000);
  });

  it("deposit + remainder declined: throws after hold capture, status stays capture_in_progress (BUG-1 fix)", async () => {
    seedCaptureDb(db, {}, { stripeCustomerId: "cus_1", defaultPaymentMethodId: null });
    // Simulate Stripe returning a non-succeeded status for the remainder charge
    stripe.createOffsessionPaymentIntent.mockResolvedValueOnce({
      id: "pi_remainder_declined",
      status: "requires_payment_method",
      client_secret: null,
    });

    await expect(
      runCaptureBookingPayment(db as never, stripe as never, "admin1", {
        ...CAPTURE_INPUT,
        finalAmountMinor: 12000,
        tipAmountMinor: 0,
      }),
    ).rejects.toMatchObject({ message: expect.stringContaining("Remainder charge declined") });

    // Hold was captured; booking must NOT be marked "captured"
    const record = db.__getDoc("tenants/t1/appointmentPayments/bk1");
    expect(record?.status).not.toBe("captured");
    expect(stripe.capturePaymentIntent).toHaveBeenCalledWith("pi_hold", "acct_1");
  });

  it("double-capture guard: returns existing status without calling Stripe (BUG-03 fix)", async () => {
    for (const terminalStatus of ["captured", "paid_in_person", "cancelled", "failed"] as const) {
      db = makeFirestoreMock();
      stripe = makeStripeMock();
      seedCaptureDb(db, { status: terminalStatus });

      const result = await runCaptureBookingPayment(db as never, stripe as never, "admin1", {
        ...CAPTURE_INPUT,
        finalAmountMinor: 3000,
      });

      expect(result.status).toBe(terminalStatus);
      expect(stripe.capturePaymentIntent).not.toHaveBeenCalled();
      expect(stripe.createOffsessionPaymentIntent).not.toHaveBeenCalled();
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: runCancelBookingPayment
// ---------------------------------------------------------------------------

const CANCEL_INPUT = { tenantId: "t1", bookingId: "bk1" };

function seedCancelDb(
  db: ReturnType<typeof makeFirestoreMock>,
  paymentOverrides: Partial<DocData> = {},
  settingsOverrides: Partial<DocData> = {},
  bookingDate?: string,
) {
  db.__setDoc("tenants/t1", { ownerUid: "admin1", timezone: "UTC" });
  db.__setDoc("tenants/t1/appointmentPayments/bk1", { ...BASE_PAYMENT, ...paymentOverrides });
  db.__setDoc("tenants/t1/paymentSettings/config", {
    paymentsEnabled: true,
    paymentMode: "deposit",
    platformFeePercent: 0.02,
    cancellationPolicy: true,
    cancellationHours: 24,
    cancellationCharge: "deposit",
    cancellationAmountMinor: 0,
    ...settingsOverrides,
  });
  db.__setDoc("tenants/t1/connect/account", { stripeAccountId: "acct_1", chargesEnabled: true });
  db.__setDoc("clients/u1/tenantPaymentProfiles/t1", { stripeCustomerId: "cus_1", defaultPaymentMethodId: "pm_card" });

  // Booking doc: appointment 2 hours from now (inside 24h window)
  const soon = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const date = bookingDate ?? soon.toISOString().split("T")[0];
  const startMinutes = soon.getUTCHours() * 60 + soon.getUTCMinutes();
  db.__setDoc(`tenants/t1/bookings/bk1`, { date, startMinutes, customerUserId: "u1" });
}

describe("runCancelBookingPayment", () => {
  let db: ReturnType<typeof makeFirestoreMock>;
  let stripe: ReturnType<typeof makeStripeMock>;

  beforeEach(() => {
    db = makeFirestoreMock();
    stripe = makeStripeMock();
  });

  it("returns no_payment when record does not exist", async () => {
    db.__setDoc("tenants/t1", { ownerUid: "admin1" });

    const result = await runCancelBookingPayment(db as never, stripe as never, "admin1", CANCEL_INPUT);
    expect(result.status).toBe("no_payment");
  });

  it("returns current status when already in terminal state", async () => {
    db.__setDoc("tenants/t1", { ownerUid: "admin1" });
    db.__setDoc("tenants/t1/appointmentPayments/bk1", { ...BASE_PAYMENT, status: "captured" });

    const result = await runCancelBookingPayment(db as never, stripe as never, "admin1", CANCEL_INPUT);
    expect(result.status).toBe("captured");
    expect(stripe.cancelPaymentIntent).not.toHaveBeenCalled();
  });

  it("cancel terminal guard covers capture_in_progress, refunded, failed (BUG-2 fix)", async () => {
    for (const blockedStatus of ["capture_in_progress", "refunded", "failed"] as const) {
      db = makeFirestoreMock();
      stripe = makeStripeMock();
      db.__setDoc("tenants/t1", { ownerUid: "admin1" });
      db.__setDoc("tenants/t1/appointmentPayments/bk1", { ...BASE_PAYMENT, status: blockedStatus });

      const result = await runCancelBookingPayment(db as never, stripe as never, "admin1", CANCEL_INPUT);

      expect(result.status).toBe(blockedStatus);
      expect(stripe.cancelPaymentIntent).not.toHaveBeenCalled();
      expect(stripe.capturePaymentIntent).not.toHaveBeenCalled();
    }
  });

  it("customer cancels own booking outside policy window: cancels PI, no fee", async () => {
    // Appointment is 48 hours from now — outside 24h cancellation window
    const future = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const date = future.toISOString().split("T")[0];
    const startMinutes = future.getUTCHours() * 60 + future.getUTCMinutes();
    seedCancelDb(db, { status: "authorized" });
    db.__setDoc("tenants/t1/bookings/bk1", { date, startMinutes, customerUserId: "u1" });

    const result = await runCancelBookingPayment(db as never, stripe as never, "u1", CANCEL_INPUT);

    expect(result.status).toBe("cancelled");
    expect(stripe.cancelPaymentIntent).toHaveBeenCalledWith("pi_hold", "acct_1");
    expect(stripe.capturePaymentIntent).not.toHaveBeenCalled();
    expect(stripe.createOffsessionPaymentIntent).not.toHaveBeenCalled();
  });

  it("admin cancels within window, deposit charge: captures deposit hold", async () => {
    seedCancelDb(db, { status: "authorized" }, { cancellationCharge: "deposit" });

    const result = await runCancelBookingPayment(db as never, stripe as never, "admin1", CANCEL_INPUT);

    expect(result.status).toBe("deposit_captured");
    expect(stripe.capturePaymentIntent).toHaveBeenCalledWith("pi_hold", "acct_1");
    expect(stripe.cancelPaymentIntent).not.toHaveBeenCalled();
    const record = db.__getDoc("tenants/t1/appointmentPayments/bk1");
    expect(record?.status).toBe("captured");
    expect(record?.notes).toMatch(/deposit retained/i);
  });

  it("admin cancels within window, custom fee: cancels PI and charges off-session", async () => {
    seedCancelDb(db, { status: "authorized" }, {
      cancellationCharge: "custom",
      cancellationAmountMinor: 2000,
    });

    const result = await runCancelBookingPayment(db as never, stripe as never, "admin1", CANCEL_INPUT);

    expect(result.status).toBe("cancelled");
    expect(stripe.cancelPaymentIntent).toHaveBeenCalledWith("pi_hold", "acct_1");
    expect(stripe.createOffsessionPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        amountMinor: 2000,
        idempotencyKey: "cancel-fee-bk1",
      }),
    );
  });

  it("permission-denied if non-owner/non-admin tries to cancel another user's booking", async () => {
    seedCancelDb(db, { status: "authorized", userId: "u1" });

    await expect(
      runCancelBookingPayment(db as never, stripe as never, "stranger_uid", CANCEL_INPUT),
    ).rejects.toMatchObject({ message: expect.stringContaining("owners/admins") });
  });
});
