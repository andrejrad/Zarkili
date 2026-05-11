import { createPaymentsRepository } from "../repository";
import { type SavedPaymentMethod } from "../model";

// ---------------------------------------------------------------------------
// Firestore mock — minimal surface for read methods.
// ---------------------------------------------------------------------------

const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: (_db: unknown, path: string) => ({ _type: "col", _path: path }),
  doc: (_db: unknown, colPath: string, id: string) => ({
    _type: "doc",
    _path: `${colPath}/${id}`,
    id,
  }),
  query: (col: unknown, ..._clauses: unknown[]) => col,
  orderBy: (field: string, dir = "asc") => ({ _orderBy: field, _dir: dir }),
  getDocs: (q: unknown) => mockGetDocs(q),
  getDoc: (ref: unknown) => mockGetDoc(ref),
}));

// `db` and `functions` are opaque to the factory in tests — globalThis mocks
// intercept firebase/functions (httpsCallable) via jest.setup.ts.
const db = {} as never;
const functions = {} as never;

function timestamp(seconds = 1700000000) {
  return { seconds, nanoseconds: 0 } as never;
}

function buildMethod(overrides: Partial<SavedPaymentMethod> = {}): SavedPaymentMethod {
  return {
    methodId: "pm_test_1",
    userId: "user-1",
    type: "card",
    brand: "visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2030,
    isDefault: true,
    cardholderName: "Ada Lovelace",
    createdAt: timestamp(),
    ...overrides,
  };
}

beforeEach(() => {
  mockGetDocs.mockReset();
  mockGetDoc.mockReset();
});

describe("createPaymentsRepository — scaffold", () => {
  it("exposes the full factory surface", () => {
    const repo = createPaymentsRepository(db, functions);
    expect(typeof repo.getSavedPaymentMethods).toBe("function");
    expect(typeof repo.getPaymentMethod).toBe("function");
    expect(typeof repo.attachPaymentMethod).toBe("function");
    expect(typeof repo.detachPaymentMethod).toBe("function");
    expect(typeof repo.chargeBooking).toBe("function");
    expect(typeof repo.getCharge).toBe("function");
    expect(typeof repo.applyLoyaltyDiscount).toBe("function");
  });

  describe("getSavedPaymentMethods", () => {
    it("returns the user's saved methods, ordered by createdAt desc", async () => {
      const a = buildMethod({ methodId: "pm_a", createdAt: timestamp(1700000000) });
      const b = buildMethod({ methodId: "pm_b", createdAt: timestamp(1700001000) });
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { data: () => b },
          { data: () => a },
        ],
      });

      const repo = createPaymentsRepository(db, functions);
      const methods = await repo.getSavedPaymentMethods("user-1");

      expect(methods).toHaveLength(2);
      expect(methods[0]?.methodId).toBe("pm_b");
      expect(methods[1]?.methodId).toBe("pm_a");
    });

    it("returns an empty array when the user has no methods", async () => {
      mockGetDocs.mockResolvedValueOnce({ docs: [] });
      const repo = createPaymentsRepository(db, functions);
      const methods = await repo.getSavedPaymentMethods("user-1");
      expect(methods).toEqual([]);
    });
  });

  describe("getPaymentMethod", () => {
    it("returns the method when it exists", async () => {
      const m = buildMethod();
      mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => m });
      const repo = createPaymentsRepository(db, functions);
      const result = await repo.getPaymentMethod("user-1", "pm_test_1");
      expect(result?.methodId).toBe("pm_test_1");
    });

    it("returns null when the method is missing", async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false, data: () => null });
      const repo = createPaymentsRepository(db, functions);
      const result = await repo.getPaymentMethod("user-1", "pm_missing");
      expect(result).toBeNull();
    });
  });

  describe("getCharge", () => {
    it("returns null when the charge does not exist", async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false, data: () => null });
      const repo = createPaymentsRepository(db, functions);
      const result = await repo.getCharge("tenant-1", "charge-missing");
      expect(result).toBeNull();
    });
  });

  describe("write methods (W24-DEBT-2: Cloud Function callables)", () => {
    it("attachPaymentMethod delegates to paymentsAttachMethod callable", async () => {
      const repo = createPaymentsRepository(db, functions);
      // jest.setup.ts mocks httpsCallable to return { data: {} }
      const result = await repo.attachPaymentMethod({ userId: "user-1", paymentMethodId: "pm_x" });
      expect(result).toBeDefined();
    });

    it("detachPaymentMethod delegates to paymentsDetachMethod callable", async () => {
      const repo = createPaymentsRepository(db, functions);
      await expect(
        repo.detachPaymentMethod({ userId: "user-1", paymentMethodId: "pm_x" }),
      ).resolves.toBeUndefined();
    });

    it("chargeBooking delegates to paymentsChargeBooking callable", async () => {
      const repo = createPaymentsRepository(db, functions);
      const result = await repo.chargeBooking({
        tenantId: "tenant-1",
        bookingId: "booking-1",
        userId: "user-1",
        paymentMethodId: "pm_x",
        amount: {
          subtotalMinor: 5000,
          discountMinor: 0,
          tipMinor: 0,
          taxMinor: 0,
          totalMinor: 5000,
          currency: "USD",
        },
        idempotencyKey: "booking_booking-1_charge_v1",
      });
      expect(result).toBeDefined();
    });

    it("applyLoyaltyDiscount delegates to paymentsApplyLoyaltyDiscount callable", async () => {
      const repo = createPaymentsRepository(db, functions);
      const result = await repo.applyLoyaltyDiscount({
        tenantId: "tenant-1",
        userId: "user-1",
        bookingId: "booking-1",
        pointsToDebit: 100,
        idempotencyKey: "booking_booking-1_loyalty_v1",
      });
      expect(result).toBeDefined();
    });
  });
});
