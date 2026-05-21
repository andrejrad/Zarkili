/**
 * createBookingPaymentIntent.test.ts
 *
 * Unit tests for runCreateBookingPaymentIntent pure handler.
 * No Firebase Admin SDK runtime required — all deps are injected.
 *
 * Cases covered:
 *   - no_payment_required (paymentsEnabled: false)
 *   - chargesEnabled: false → throws failed-precondition
 *   - totalAmountMinor < 1 → throws invalid-argument
 *   - card_on_file: creates SetupIntent, writes payment record, returns setup_intent
 *   - deposit: creates PaymentIntent, returns payment_intent with correct authorized amount
 *   - full: PaymentIntent for 100%, returns payment_intent
 *   - idempotency replay (existing pending PI, not canceled) → returns existing secret
 *   - replacement of canceled PI → creates fresh one
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { runCreateBookingPaymentIntent } from "../appointmentPaymentsCallable.js";

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
        docs.set(path, { ...existing, ...data });
      }),
    };
  }

  function collectionRef(colPath: string) {
    const queryDocs = new Map<string, DocData[]>();

    function __seedQuery(docs: DocData[]) {
      queryDocs.set("default", docs);
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
  };
}

// ---------------------------------------------------------------------------
// Stripe mock factory
// ---------------------------------------------------------------------------

function makeStripeMock() {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_INPUT = {
  tenantId: "t1",
  bookingId: "bk1",
  totalAmountMinor: 10000,
  currency: "usd",
};

function seedBaseDb(
  db: ReturnType<typeof makeFirestoreMock>,
  settingsOverrides: Partial<DocData> = {},
  connectOverrides: Partial<DocData> = {},
) {
  // Booking belongs to user u1
  db.__setDoc("tenants/t1/bookings/bk1", { customerUserId: "u1", status: "confirmed", priceSnapshot: 0 });
  // Payment settings — deposit 30% as default
  db.__setDoc("tenants/t1/paymentSettings/config", {
    paymentsEnabled: true,
    paymentMode: "deposit",
    depositPercentage: 30,
    platformFeePercent: 0.02,
    currency: "usd",
    ...settingsOverrides,
  });
  // Connect account
  db.__setDoc("tenants/t1/connect/account", {
    stripeAccountId: "acct_1",
    chargesEnabled: true,
    ...connectOverrides,
  });
  // No existing tenant customer profile — will trigger createCustomer
}

const noEmail = async () => null;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("runCreateBookingPaymentIntent", () => {
  let db: ReturnType<typeof makeFirestoreMock>;
  let stripe: ReturnType<typeof makeStripeMock>;

  beforeEach(() => {
    db = makeFirestoreMock();
    stripe = makeStripeMock();
  });

  // ------------------------------------------------------------------
  it("throws invalid-argument when totalAmountMinor < 1", async () => {
    seedBaseDb(db);
    await expect(
      runCreateBookingPaymentIntent(db as never, stripe as never, noEmail, "u1", {
        ...BASE_INPUT,
        totalAmountMinor: 0,
      }),
    ).rejects.toMatchObject({ message: "totalAmountMinor must be ≥ 1." });
  });

  // ------------------------------------------------------------------
  it("returns no_payment_required when paymentsEnabled is false", async () => {
    seedBaseDb(db, { paymentsEnabled: false });
    const result = await runCreateBookingPaymentIntent(
      db as never, stripe as never, noEmail, "u1", BASE_INPUT,
    );
    expect(result).toEqual({ type: "no_payment_required" });
    expect(stripe.createPaymentIntentManual).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  it("throws failed-precondition when chargesEnabled is false", async () => {
    seedBaseDb(db, {}, { chargesEnabled: false });
    await expect(
      runCreateBookingPaymentIntent(db as never, stripe as never, noEmail, "u1", BASE_INPUT),
    ).rejects.toMatchObject({ message: expect.stringContaining("not set up to accept payments") });
  });

  // ------------------------------------------------------------------
  it("throws permission-denied when booking belongs to another user", async () => {
    seedBaseDb(db);
    // Overwrite booking with a different owner
    db.__setDoc("tenants/t1/bookings/bk1", { customerUserId: "u_other" });
    await expect(
      runCreateBookingPaymentIntent(db as never, stripe as never, noEmail, "u1", BASE_INPUT),
    ).rejects.toMatchObject({ message: "This booking does not belong to you." });
  });

  // ------------------------------------------------------------------
  it("card_on_file: creates SetupIntent, writes payment record, returns setup_intent", async () => {
    seedBaseDb(db, { paymentMode: "card_on_file" });
    const result = await runCreateBookingPaymentIntent(
      db as never, stripe as never, noEmail, "u1", BASE_INPUT,
    );
    expect(result.type).toBe("setup_intent");
    if (result.type === "setup_intent") {
      expect(result.clientSecret).toBe("si_new_secret");
      expect(result.customerId).toBe("cus_new");
      expect(result.ephemeralKeySecret).toBe("ek_secret");
    }
    // Payment record written to Firestore
    const record = db.__getDoc("tenants/t1/appointmentPayments/bk1");
    expect(record?.paymentMode).toBe("card_on_file");
    expect(record?.status).toBe("pending");
    expect(record?.stripeSetupIntentId).toBe("si_new");
  });

  // ------------------------------------------------------------------
  it("deposit: creates PaymentIntent for depositPercentage% of total", async () => {
    seedBaseDb(db, { paymentMode: "deposit", depositPercentage: 30 });
    const result = await runCreateBookingPaymentIntent(
      db as never, stripe as never, noEmail, "u1", BASE_INPUT,
    );
    expect(result.type).toBe("payment_intent");
    if (result.type === "payment_intent") {
      // 30% of 10000 = 3000
      expect(result.authorizedAmountMinor).toBe(3000);
      expect(result.paymentMode).toBe("deposit");
      expect(result.clientSecret).toBe("pi_new_secret");
    }
    expect(stripe.createPaymentIntentManual).toHaveBeenCalledWith(
      expect.objectContaining({ amountMinor: 3000, idempotencyKey: "create-pi-bk1" }),
    );
  });

  // ------------------------------------------------------------------
  it("full: creates PaymentIntent for 100% of total", async () => {
    seedBaseDb(db, { paymentMode: "full" });
    const result = await runCreateBookingPaymentIntent(
      db as never, stripe as never, noEmail, "u1", BASE_INPUT,
    );
    expect(result.type).toBe("payment_intent");
    if (result.type === "payment_intent") {
      expect(result.authorizedAmountMinor).toBe(10000);
      expect(result.paymentMode).toBe("full");
    }
    expect(stripe.createPaymentIntentManual).toHaveBeenCalledWith(
      expect.objectContaining({ amountMinor: 10000 }),
    );
  });

  // ------------------------------------------------------------------
  it("idempotency replay: returns existing PI secret when pending and not canceled", async () => {
    seedBaseDb(db, { paymentMode: "deposit", depositPercentage: 30 });
    // Pre-seed an existing pending payment record
    db.__setDoc("tenants/t1/appointmentPayments/bk1", {
      paymentMode: "deposit",
      status: "pending",
      stripePaymentIntentId: "pi_existing_hold",
      authorizedAmountMinor: 3000,
    });
    // Simulate tenant customer profile exists
    db.__setDoc("clients/u1/tenantPaymentProfiles/t1", {
      stripeCustomerId: "cus_existing",
      defaultPaymentMethodId: "pm_card",
    });

    const result = await runCreateBookingPaymentIntent(
      db as never, stripe as never, noEmail, "u1", BASE_INPUT,
    );
    expect(result.type).toBe("payment_intent");
    if (result.type === "payment_intent") {
      expect(result.clientSecret).toBe("pi_existing_secret");
    }
    // Must NOT create a new PI
    expect(stripe.createPaymentIntentManual).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  it("replacement: re-creates PI when existing one is canceled", async () => {
    seedBaseDb(db, { paymentMode: "deposit", depositPercentage: 30 });
    db.__setDoc("tenants/t1/appointmentPayments/bk1", {
      paymentMode: "deposit",
      status: "pending",
      stripePaymentIntentId: "pi_canceled",
      authorizedAmountMinor: 3000,
    });
    db.__setDoc("clients/u1/tenantPaymentProfiles/t1", {
      stripeCustomerId: "cus_existing",
      defaultPaymentMethodId: null,
    });
    // Stripe returns canceled status for the existing PI
    stripe.retrievePaymentIntent.mockResolvedValueOnce({
      id: "pi_canceled",
      status: "canceled",
      client_secret: null,
    });

    const result = await runCreateBookingPaymentIntent(
      db as never, stripe as never, noEmail, "u1", BASE_INPUT,
    );
    expect(result.type).toBe("payment_intent");
    // A fresh PI should have been created (idempotency key includes a timestamp suffix)
    expect(stripe.createPaymentIntentManual).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: expect.stringContaining("create-pi-bk1-r") }),
    );
  });

  // ------------------------------------------------------------------
  it("creates Stripe customer when no profile exists and passes email", async () => {
    seedBaseDb(db, { paymentMode: "full" });
    const getEmail = vi.fn(async (_uid: string) => "user@example.com");

    await runCreateBookingPaymentIntent(db as never, stripe as never, getEmail, "u1", BASE_INPUT);

    expect(stripe.createCustomer).toHaveBeenCalledWith("u1", "user@example.com", expect.anything());
    expect(getEmail).toHaveBeenCalledWith("u1");
  });
});
