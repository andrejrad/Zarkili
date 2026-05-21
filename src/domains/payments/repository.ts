/**
 * Payments repository — W36-C scaffold, wired by W37.5.
 *
 * Read operations (getSavedPaymentMethods, getPaymentMethod, getCharge) hit
 * Firestore directly from the client SDK.
 *
 * Write operations (attach, detach, charge, applyLoyaltyDiscount) go through
 * Cloud Functions so the Stripe secret key never reaches the client.  The
 * callable names must match the exports in functions/src/payments.ts.
 *
 * Collection layout:
 *   clients/{userId}/paymentMethods/{methodId}      — SavedPaymentMethod
 *   tenants/{tenantId}/charges/{chargeId}           — Charge
 *   tenants/{tenantId}/paymentsIdempotency/{key}    — { chargeId | txId }
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  type Firestore,
} from "firebase/firestore";
import { httpsCallable, type Functions } from "firebase/functions";

import {
  PaymentsError,
  type ApplyLoyaltyDiscountInput,
  type AttachPaymentMethodInput,
  type Charge,
  type ChargeBookingInput,
  type DetachPaymentMethodInput,
  type LoyaltyDiscountApplied,
  type SavedPaymentMethod,
  type PaymentSettings,
  type CaptureBookingPaymentInput,
  type CancelBookingPaymentInput,
  type CreateBookingPaymentIntentInput,
  type CreateBookingPaymentIntentResult,
} from "./model";

// ---------------------------------------------------------------------------
// Collection helpers
// ---------------------------------------------------------------------------

const paymentMethodsCol = (userId: string) => `clients/${userId}/paymentMethods`;
const chargesCol = (tenantId: string) => `tenants/${tenantId}/charges`;

// ---------------------------------------------------------------------------
// Repository type
// ---------------------------------------------------------------------------

export type PaymentsRepository = {
  getSavedPaymentMethods(userId: string): Promise<SavedPaymentMethod[]>;
  getPaymentMethod(userId: string, methodId: string): Promise<SavedPaymentMethod | null>;
  attachPaymentMethod(input: AttachPaymentMethodInput): Promise<SavedPaymentMethod>;
  detachPaymentMethod(input: DetachPaymentMethodInput): Promise<void>;
  chargeBooking(input: ChargeBookingInput): Promise<Charge>;
  getCharge(tenantId: string, chargeId: string): Promise<Charge | null>;
  applyLoyaltyDiscount(input: ApplyLoyaltyDiscountInput): Promise<LoyaltyDiscountApplied>;
  // Connect payment flow
  getPaymentSettings(tenantId: string): Promise<PaymentSettings | null>;
  createBookingPaymentIntent(input: CreateBookingPaymentIntentInput): Promise<CreateBookingPaymentIntentResult>;
  captureBookingPayment(input: CaptureBookingPaymentInput): Promise<{ status: string }>;
  cancelBookingPayment(input: CancelBookingPaymentInput): Promise<{ status: string }>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPaymentsRepository(db: Firestore, functions: Functions): PaymentsRepository {
  async function getSavedPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
    const q = query(collection(db, paymentMethodsCol(userId)), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SavedPaymentMethod);
  }

  async function getPaymentMethod(
    userId: string,
    methodId: string,
  ): Promise<SavedPaymentMethod | null> {
    const ref = doc(db, paymentMethodsCol(userId), methodId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as SavedPaymentMethod;
  }

  async function attachPaymentMethod(
    input: AttachPaymentMethodInput,
  ): Promise<SavedPaymentMethod> {
    try {
      const fn = httpsCallable<AttachPaymentMethodInput, SavedPaymentMethod>(
        functions,
        "paymentsAttachMethod",
      );
      const result = await fn(input);
      return result.data;
    } catch (err) {
      throw new PaymentsError(
        "STRIPE_ERROR",
        err instanceof Error ? err.message : "attachPaymentMethod failed",
      );
    }
  }

  async function detachPaymentMethod(input: DetachPaymentMethodInput): Promise<void> {
    try {
      const fn = httpsCallable<DetachPaymentMethodInput, { detached: boolean }>(
        functions,
        "paymentsDetachMethod",
      );
      await fn(input);
    } catch (err) {
      throw new PaymentsError(
        "PAYMENT_METHOD_DETACH_FAILED",
        err instanceof Error ? err.message : "detachPaymentMethod failed",
      );
    }
  }

  async function chargeBooking(input: ChargeBookingInput): Promise<Charge> {
    try {
      const fn = httpsCallable<ChargeBookingInput, Charge>(
        functions,
        "paymentsChargeBooking",
      );
      const result = await fn(input);
      return result.data;
    } catch (err) {
      throw new PaymentsError(
        "CHARGE_FAILED",
        err instanceof Error ? err.message : "chargeBooking failed",
      );
    }
  }

  async function getCharge(tenantId: string, chargeId: string): Promise<Charge | null> {
    const ref = doc(db, chargesCol(tenantId), chargeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as Charge;
  }

  async function applyLoyaltyDiscount(
    input: ApplyLoyaltyDiscountInput,
  ): Promise<LoyaltyDiscountApplied> {
    try {
      const fn = httpsCallable<ApplyLoyaltyDiscountInput, LoyaltyDiscountApplied>(
        functions,
        "paymentsApplyLoyaltyDiscount",
      );
      const result = await fn(input);
      return result.data;
    } catch (err) {
      throw new PaymentsError(
        "INSUFFICIENT_LOYALTY_POINTS",
        err instanceof Error ? err.message : "applyLoyaltyDiscount failed",
      );
    }
  }

  return {
    getSavedPaymentMethods,
    getPaymentMethod,
    attachPaymentMethod,
    detachPaymentMethod,
    chargeBooking,
    getCharge,
    applyLoyaltyDiscount,

    async getPaymentSettings(tenantId) {
      try {
        const fn = httpsCallable<{ tenantId: string }, PaymentSettings>(
          functions,
          "getPaymentSettings",
        );
        const result = await fn({ tenantId });
        return result.data;
      } catch {
        return null;
      }
    },

    async createBookingPaymentIntent(input) {
      try {
        const fn = httpsCallable<CreateBookingPaymentIntentInput, CreateBookingPaymentIntentResult>(
          functions,
          "createBookingPaymentIntent",
        );
        const result = await fn(input);
        return result.data;
      } catch (err) {
        throw new PaymentsError(
          "STRIPE_ERROR",
          err instanceof Error ? err.message : "createBookingPaymentIntent failed",
        );
      }
    },

    async captureBookingPayment(input) {
      try {
        const fn = httpsCallable<CaptureBookingPaymentInput, { status: string }>(
          functions,
          "captureBookingPayment",
        );
        const result = await fn(input);
        return result.data;
      } catch (err) {
        throw new PaymentsError(
          "CHARGE_FAILED",
          err instanceof Error ? err.message : "captureBookingPayment failed",
        );
      }
    },

    async cancelBookingPayment(input) {
      try {
        const fn = httpsCallable<CancelBookingPaymentInput, { status: string }>(
          functions,
          "cancelBookingPayment",
        );
        const result = await fn(input);
        return result.data;
      } catch (err) {
        throw new PaymentsError(
          "STRIPE_ERROR",
          err instanceof Error ? err.message : "cancelBookingPayment failed",
        );
      }
    },
  };
}
