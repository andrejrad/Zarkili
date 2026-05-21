/**
 * functions/src/payments.ts (W24-DEBT-2)
 *
 * Consumer-facing Stripe payment HTTPS callables:
 *
 *   paymentsAttachMethod    — attach a Stripe pm_* to the caller's account
 *   paymentsDetachMethod    — detach a Stripe pm_* from the caller's account
 *   paymentsChargeBooking   — create + confirm a PaymentIntent for a booking
 *
 * Security model:
 *   - All three callables require an authenticated Firebase user.
 *   - paymentsAttachMethod / paymentsDetachMethod gate on uid === input.userId.
 *   - paymentsChargeBooking gates on uid === input.userId.
 *   - Stripe secret key is stored as a Cloud Secret, never sent to clients.
 *
 * Stripe Customer per consumer:
 *   - Stored at clients/{userId} as { stripeCustomerId: "cus_..." }.
 *   - Created on first attach if absent.
 *
 * Collection writes:
 *   clients/{userId}                             — { stripeCustomerId }
 *   clients/{userId}/paymentMethods/{methodId}   — SavedPaymentMethod metadata
 *   tenants/{tenantId}/charges/{chargeId}        — Charge record
 *   tenants/{tenantId}/paymentsIdempotency/{key} — idempotency record
 *
 * Secrets:
 *   STRIPE_API_KEY (required) — same secret used by stripeTaxCalculate
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import {
  createStripePaymentsApiClient,
  normaliseCardBrand,
  type StripePaymentsApiClient,
} from "./stripe/paymentsAdapter.js";

if (getApps().length === 0) {
  initializeApp();
}

const STRIPE_API_KEY = defineSecret("STRIPE_API_KEY");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowTs(): Timestamp {
  return Timestamp.now();
}

/** Get or lazily create the Stripe Customer ID for a Firebase user. */
async function resolveStripeCustomerId(
  userId: string,
  stripe: StripePaymentsApiClient,
): Promise<string> {
  const db = getFirestore();
  const clientRef = db.doc(`clients/${userId}`);
  const snap = await clientRef.get();
  const existing = snap.exists ? (snap.data()?.stripeCustomerId as string | undefined) : undefined;
  if (existing) return existing;

  // Fetch email from Firebase Auth to attach to the Stripe customer
  let email: string | null = null;
  try {
    const userRecord = await getAuth().getUser(userId);
    email = userRecord.email ?? null;
  } catch {
    // proceed without email — non-fatal
  }

  const customer = await stripe.createCustomer(userId, email);
  await clientRef.set({ stripeCustomerId: customer.id }, { merge: true });
  return customer.id;
}

// ---------------------------------------------------------------------------
// paymentsAttachMethod
// ---------------------------------------------------------------------------

type AttachMethodInput = {
  userId: string;
  paymentMethodId: string;
  makeDefault?: boolean;
};

export const paymentsAttachMethod = onCall(
  { secrets: [STRIPE_API_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication is required");
    }

    const input = request.data as AttachMethodInput;
    if (!input?.userId || typeof input.userId !== "string") {
      throw new HttpsError("invalid-argument", "userId is required");
    }
    if (!input?.paymentMethodId || typeof input.paymentMethodId !== "string") {
      throw new HttpsError("invalid-argument", "paymentMethodId is required");
    }
    if (request.auth.uid !== input.userId) {
      throw new HttpsError("permission-denied", "You may only attach payment methods to your own account");
    }

    const stripe = createStripePaymentsApiClient(STRIPE_API_KEY.value());
    const db = getFirestore();
    const userId = input.userId;
    const paymentMethodId = input.paymentMethodId;

    // 1. Resolve / create Stripe Customer for this user
    const stripeCustomerId = await resolveStripeCustomerId(userId, stripe);

    // 2. Attach pm_* to the Stripe customer
    const pm = await stripe.attachPaymentMethod(paymentMethodId, stripeCustomerId);

    // 3. Determine isDefault: true if user has no existing methods or caller requested it
    const methodsCol = db.collection(`clients/${userId}/paymentMethods`);
    const existingSnap = await methodsCol.limit(1).get();
    const isFirstMethod = existingSnap.empty;
    const makeDefault = Boolean(input.makeDefault ?? isFirstMethod);

    // 4. If setting as default, clear existing default
    if (makeDefault && !isFirstMethod) {
      const defaultSnap = await methodsCol.where("isDefault", "==", true).get();
      const batch = db.batch();
      defaultSnap.docs.forEach((d) => batch.update(d.ref, { isDefault: false }));
      await batch.commit();
    }

    // 5. Write payment method metadata to Firestore
    const brand = normaliseCardBrand(pm.card?.brand);
    const methodDoc = {
      methodId: pm.id,
      userId,
      type: (pm.type ?? "card") as "card" | "apple_pay" | "google_pay" | "bank_account",
      brand,
      last4: pm.card?.last4 ?? "",
      expMonth: pm.card?.exp_month ?? 0,
      expYear: pm.card?.exp_year ?? 0,
      isDefault: makeDefault,
      cardholderName: pm.billing_details?.name ?? null,
      createdAt: nowTs(),
    };
    await db.doc(`clients/${userId}/paymentMethods/${pm.id}`).set(methodDoc);

    return methodDoc;
  },
);

// ---------------------------------------------------------------------------
// paymentsDetachMethod
// ---------------------------------------------------------------------------

type DetachMethodInput = {
  userId: string;
  paymentMethodId: string;
};

export const paymentsDetachMethod = onCall(
  { secrets: [STRIPE_API_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication is required");
    }

    const input = request.data as DetachMethodInput;
    if (!input?.userId || typeof input.userId !== "string") {
      throw new HttpsError("invalid-argument", "userId is required");
    }
    if (!input?.paymentMethodId || typeof input.paymentMethodId !== "string") {
      throw new HttpsError("invalid-argument", "paymentMethodId is required");
    }
    if (request.auth.uid !== input.userId) {
      throw new HttpsError("permission-denied", "You may only remove payment methods from your own account");
    }

    const stripe = createStripePaymentsApiClient(STRIPE_API_KEY.value());
    const db = getFirestore();
    const { userId, paymentMethodId } = input;

    // 1. Detach from Stripe (non-fatal if already detached)
    try {
      await stripe.detachPaymentMethod(paymentMethodId);
    } catch {
      // If the pm is already detached or not found, still remove the local doc
    }

    // 2. Delete Firestore doc
    const methodRef = db.doc(`clients/${userId}/paymentMethods/${paymentMethodId}`);
    const snap = await methodRef.get();
    const wasDefault = snap.exists && Boolean(snap.data()?.isDefault);
    await methodRef.delete();

    // 3. If this was the default, promote the next most-recent method
    if (wasDefault) {
      const remaining = await db
        .collection(`clients/${userId}/paymentMethods`)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      if (!remaining.empty) {
        await remaining.docs[0].ref.update({ isDefault: true });
      }
    }

    return { detached: true };
  },
);

// ---------------------------------------------------------------------------
// paymentsChargeBooking
// ---------------------------------------------------------------------------

type ChargeAmountInput = {
  subtotalMinor: number;
  discountMinor: number;
  tipMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: string;
};

type ChargeBookingInput = {
  tenantId: string;
  bookingId: string;
  userId: string;
  paymentMethodId: string;
  amount: ChargeAmountInput;
  idempotencyKey: string;
  loyaltyDiscount?: {
    pointsDebited: number;
    discountMinor: number;
    loyaltyTransactionId: string;
  } | null;
};

export const paymentsChargeBooking = onCall(
  { secrets: [STRIPE_API_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication is required");
    }

    const input = request.data as ChargeBookingInput;
    if (!input?.tenantId || !input?.bookingId || !input?.userId || !input?.paymentMethodId) {
      throw new HttpsError("invalid-argument", "tenantId, bookingId, userId, and paymentMethodId are required");
    }
    if (!input?.idempotencyKey || typeof input.idempotencyKey !== "string") {
      throw new HttpsError("invalid-argument", "idempotencyKey is required");
    }
    if (!input?.amount || typeof input.amount.totalMinor !== "number") {
      throw new HttpsError("invalid-argument", "amount.totalMinor is required");
    }
    if (input.amount.totalMinor < 0) {
      throw new HttpsError("invalid-argument", "amount.totalMinor must be non-negative");
    }
    if (request.auth.uid !== input.userId) {
      throw new HttpsError("permission-denied", "You may only charge bookings for your own account");
    }

    const stripe = createStripePaymentsApiClient(STRIPE_API_KEY.value());
    const db = getFirestore();
    const { tenantId, bookingId, userId, paymentMethodId, amount, idempotencyKey, loyaltyDiscount } = input;

    // 1. Idempotency check
    const idempRef = db.doc(`tenants/${tenantId}/paymentsIdempotency/${idempotencyKey}`);
    const idempSnap = await idempRef.get();
    if (idempSnap.exists) {
      // Already charged — return existing charge
      const chargeId = idempSnap.data()?.chargeId as string;
      if (chargeId) {
        const chargeSnap = await db.doc(`tenants/${tenantId}/charges/${chargeId}`).get();
        if (chargeSnap.exists) {
          return chargeSnap.data();
        }
      }
    }

    // 2. Validate amount
    if (!amount.currency || typeof amount.currency !== "string") {
      throw new HttpsError("invalid-argument", "amount.currency is required");
    }

    // 3. Resolve Stripe Customer
    const stripeCustomerId = await resolveStripeCustomerId(userId, stripe);

    // 4. Create + confirm PaymentIntent
    let stripePaymentIntentId: string | null = null;
    let chargeStatus: "captured" | "failed" = "captured";
    let failureCode: string | null = null;
    let failureMessage: string | null = null;

    if (amount.totalMinor > 0) {
      try {
        const pi = await stripe.createAndConfirmPaymentIntent({
          amountMinor: amount.totalMinor,
          currency: amount.currency,
          customerId: stripeCustomerId,
          paymentMethodId,
          idempotencyKey,
          metadata: {
            tenantId,
            bookingId,
            userId,
          },
        });
        stripePaymentIntentId = pi.id;
        if (pi.status === "succeeded") {
          chargeStatus = "captured";
        } else {
          chargeStatus = "failed";
          failureCode = pi.last_payment_error?.code ?? pi.last_payment_error?.decline_code ?? null;
          failureMessage = pi.last_payment_error?.message ?? "Payment failed";
        }
      } catch (err) {
        // Stripe API error — surface as charge failure, not 500
        const msg = err instanceof Error ? err.message : "Payment processing error";
        chargeStatus = "failed";
        failureMessage = msg;
      }
    }
    // totalMinor === 0 means fully covered by loyalty discount; no PI needed

    // 5. Write Charge doc + idempotency record atomically
    const chargeId = db.collection(`tenants/${tenantId}/charges`).doc().id;
    const chargeDoc = {
      chargeId,
      tenantId,
      bookingId,
      userId,
      stripePaymentIntentId,
      paymentMethodId,
      amount: {
        subtotalMinor: amount.subtotalMinor,
        discountMinor: amount.discountMinor,
        tipMinor: amount.tipMinor,
        taxMinor: amount.taxMinor,
        totalMinor: amount.totalMinor,
        currency: amount.currency,
      },
      status: chargeStatus,
      loyaltyDiscount: loyaltyDiscount ?? null,
      failureCode,
      failureMessage,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    batch.set(db.doc(`tenants/${tenantId}/charges/${chargeId}`), chargeDoc);
    batch.set(idempRef, {
      chargeId,
      idempotencyKey,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    if (chargeStatus === "failed") {
      throw new HttpsError("aborted", failureMessage ?? "Payment failed");
    }

    return { ...chargeDoc, createdAt: nowTs(), updatedAt: nowTs() };
  },
);

// ---------------------------------------------------------------------------
// paymentsApplyLoyaltyDiscount
// ---------------------------------------------------------------------------
//
// Atomically debits loyalty points from the customer's wallet and returns the
// equivalent cash discount in minor units.
//
// Conversion rate: 1 loyalty point = 1 minor currency unit (e.g. 1 US cent).
// Tenants control how generously points are earned via `pointsPerCurrencyUnit`
// in their loyalty config; the redemption rate is fixed at 1 pt → 1 minor unit
// so the return-on-spend equals (1 / pointsPerCurrencyUnit * 100)%.
//
// Collection paths mirror the loyalty domain (src/domains/loyalty/repository.ts):
//   tenants/{tenantId}/loyaltyConfig/config        — TenantLoyaltyConfig singleton
//   user_brand_loyalty/{userId}_{brandId}          — CustomerLoyaltyState (v3 §3.10)
//   tenants/{tenantId}/loyaltyTransactions/{txId}   — LoyaltyTransaction ledger
//   tenants/{tenantId}/loyaltyIdempotency/{key}     — idempotency markers
//
// Per v3 §2, tenantId === brandId. Docs are also written with `brandId` and
// `pointsBalance` field aliases so the spec-shaped discovery reader can pick
// them up directly.

// Path helpers
const loyaltyConfigDocPath = (tenantId: string) =>
  `tenants/${tenantId}/loyaltyConfig/config`;
const loyaltyStateDocPath = (tenantId: string, userId: string) =>
  `user_brand_loyalty/${userId}_${tenantId}`;
const loyaltyTxColPath = (tenantId: string) =>
  `tenants/${tenantId}/loyaltyTransactions`;
const loyaltyIdempDocPath = (tenantId: string, key: string) =>
  `tenants/${tenantId}/loyaltyIdempotency/${key}`;

type ApplyDiscountInput = {
  tenantId: string;
  userId: string;
  bookingId: string;
  pointsToDebit: number;
  idempotencyKey: string;
};

type LoyaltyDiscountResult = {
  pointsDebited: number;
  discountMinor: number;
  loyaltyTransactionId: string;
};

/**
 * Pure handler — accept injected db for unit-testability.
 * Returns LoyaltyDiscountResult or throws HttpsError.
 */
export async function handleApplyLoyaltyDiscount(
  db: ReturnType<typeof getFirestore>,
  callerUid: string,
  input: ApplyDiscountInput,
): Promise<LoyaltyDiscountResult> {
  const { tenantId, userId, bookingId, pointsToDebit, idempotencyKey } = input;

  // 1. Caller must own the points being redeemed
  if (callerUid !== userId) {
    throw new HttpsError("permission-denied", "You may only redeem your own loyalty points");
  }

  // 2. Read loyalty config — programme must exist and be enabled
  const configSnap = await db.doc(loyaltyConfigDocPath(tenantId)).get();
  if (!configSnap.exists) {
    throw new HttpsError(
      "failed-precondition",
      "Loyalty programme is not configured for this tenant",
    );
  }
  const configData = configSnap.data() as { enabled?: boolean };
  if (!configData?.enabled) {
    throw new HttpsError("failed-precondition", "Loyalty programme is disabled for this tenant");
  }

  // 3. Idempotency check — return cached result if already applied
  const idempRef = db.doc(loyaltyIdempDocPath(tenantId, idempotencyKey));
  const idempSnap = await idempRef.get();
  if (idempSnap.exists) {
    const cached = idempSnap.data() as {
      txId: string;
      discountMinor: number;
      pointsDebited: number;
    };
    return {
      pointsDebited: cached.pointsDebited,
      discountMinor: cached.discountMinor,
      loyaltyTransactionId: cached.txId,
    };
  }

  // 4. Verify the booking belongs to this user
  const bookingSnap = await db.doc(`tenants/${tenantId}/appointmentPayments/${bookingId}`).get();
  if (!bookingSnap.exists) {
    throw new HttpsError("not-found", "Booking not found");
  }
  const bookingData = bookingSnap.data() as { userId?: string };
  if (bookingData.userId !== callerUid) {
    throw new HttpsError("permission-denied", "Booking does not belong to this user");
  }

  // 5. Conversion: 1 point = 1 minor currency unit (e.g. 1 cent)
  const discountMinor = pointsToDebit;

  // 6. Transactionally debit points — prevents double-spend under concurrency
  const txRef = db.collection(loyaltyTxColPath(tenantId)).doc();
  const txId = txRef.id;

  try {
    await db.runTransaction(async (txn) => {
      const stateRef = db.doc(loyaltyStateDocPath(tenantId, userId));
      const stateSnap = await txn.get(stateRef);

      const currentPoints: number = stateSnap.exists
        ? ((stateSnap.data()?.points as number | undefined) ?? 0)
        : 0;

      if (currentPoints < pointsToDebit) {
        throw new HttpsError(
          "resource-exhausted",
          `Insufficient loyalty points: balance ${currentPoints}, requested ${pointsToDebit}`,
        );
      }

      const now = FieldValue.serverTimestamp();
      const existingData = stateSnap.exists ? stateSnap.data() : undefined;

      txn.set(stateRef, {
        userId,
        tenantId,
        brandId: tenantId,
        points: currentPoints - pointsToDebit,
        pointsBalance: currentPoints - pointsToDebit,
        lifetimePoints: (existingData?.lifetimePoints as number | undefined) ?? 0,
        currentTierId: (existingData?.currentTierId as string | null | undefined) ?? null,
        enrolledAt: existingData?.enrolledAt ?? now,
        updatedAt: now,
      });

      txn.set(txRef, {
        txId,
        userId,
        tenantId,
        type: "debit",
        points: pointsToDebit,
        reason: "loyalty_discount",
        referenceId: bookingId,
        idempotencyKey,
        createdAt: now,
      });

      txn.set(idempRef, {
        txId,
        pointsDebited: pointsToDebit,
        discountMinor,
        idempotencyKey,
        createdAt: now,
      });
    });
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    throw new HttpsError(
      "internal",
      err instanceof Error ? err.message : "Failed to debit loyalty points",
    );
  }

  return { pointsDebited: pointsToDebit, discountMinor, loyaltyTransactionId: txId };
}

export const paymentsApplyLoyaltyDiscount = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication is required");
    }

    const input = request.data as ApplyDiscountInput;
    if (!input?.tenantId || typeof input.tenantId !== "string") {
      throw new HttpsError("invalid-argument", "tenantId is required");
    }
    if (!input?.userId || typeof input.userId !== "string") {
      throw new HttpsError("invalid-argument", "userId is required");
    }
    if (!input?.bookingId || typeof input.bookingId !== "string") {
      throw new HttpsError("invalid-argument", "bookingId is required");
    }
    if (typeof input?.pointsToDebit !== "number" || input.pointsToDebit <= 0) {
      throw new HttpsError("invalid-argument", "pointsToDebit must be a positive number");
    }
    if (!input?.idempotencyKey || typeof input.idempotencyKey !== "string") {
      throw new HttpsError("invalid-argument", "idempotencyKey is required");
    }

    return handleApplyLoyaltyDiscount(getFirestore(), request.auth.uid, input);
  },
);

// ---------------------------------------------------------------------------
// paymentsRefundBooking  (W38-DEBT-4)
// ---------------------------------------------------------------------------
//
// Issues a full Stripe refund for a previously charged booking.
// Writes a pending refund doc to tenants/{tenantId}/refunds/{stripeRefundId}.
// The charge.refunded webhook then updates the doc to status "issued".
//
// Security: caller must own the booking (uid === userId).
// Idempotent: if a refund already exists for the booking, returns existing id.

type RefundBookingInput = {
  tenantId: string;
  bookingId: string;
  userId: string;
};

export const paymentsRefundBooking = onCall(
  { secrets: [STRIPE_API_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication is required");
    }

    const input = request.data as RefundBookingInput;
    if (!input?.tenantId || typeof input.tenantId !== "string") {
      throw new HttpsError("invalid-argument", "tenantId is required");
    }
    if (!input?.bookingId || typeof input.bookingId !== "string") {
      throw new HttpsError("invalid-argument", "bookingId is required");
    }
    if (!input?.userId || typeof input.userId !== "string") {
      throw new HttpsError("invalid-argument", "userId is required");
    }
    if (request.auth.uid !== input.userId) {
      throw new HttpsError("permission-denied", "You may only refund your own bookings");
    }

    const { tenantId, bookingId, userId } = input;
    const db = getFirestore();

    // Idempotency: return existing refund if one already exists for this booking.
    const existingSnap = await db
      .collection(`tenants/${tenantId}/refunds`)
      .where("bookingId", "==", bookingId)
      .where("userId", "==", userId)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0].data();
      return { refundId: existing.refundId as string };
    }

    // Find the charge for this booking.
    const chargesSnap = await db
      .collection(`tenants/${tenantId}/charges`)
      .where("bookingId", "==", bookingId)
      .where("userId", "==", userId)
      .limit(1)
      .get();
    if (chargesSnap.empty) {
      throw new HttpsError("not-found", "No charge found for this booking");
    }

    const chargeData = chargesSnap.docs[0].data() as {
      chargeId: string;
      stripePaymentIntentId: string | null;
      amount: { totalMinor: number };
    };

    if (!chargeData.stripePaymentIntentId) {
      throw new HttpsError(
        "failed-precondition",
        "Booking has no Stripe PaymentIntent — cannot issue refund",
      );
    }

    // Issue refund via Stripe.
    const stripe = createStripePaymentsApiClient(STRIPE_API_KEY.value());
    const refund = await stripe.createRefund(
      chargeData.stripePaymentIntentId,
      undefined,
      { metadata: { tenantId, bookingId } },
    );

    // Write pending refund doc.  The charge.refunded webhook will flip status → "issued".
    const refundDoc = {
      refundId: refund.id,
      tenantId,
      bookingId,
      userId,
      chargeId: chargeData.chargeId,
      stripePaymentIntentId: chargeData.stripePaymentIntentId,
      stripeRefundId: refund.id,
      amountMinor: refund.amount,
      currency: refund.currency,
      reason: refund.reason,
      status: "pending" as const,
      requestedAt: FieldValue.serverTimestamp(),
      processedAt: null,
      failureCode: null,
      failureMessage: null,
    };

    await db.doc(`tenants/${tenantId}/refunds/${refund.id}`).set(refundDoc);

    return { refundId: refund.id };
  },
);

// ---------------------------------------------------------------------------
// updateLoyaltyOnBookingComplete  (Phase 2.5)
// ---------------------------------------------------------------------------
//
// Triggered by any update to bookings/{bookingId}.
// When status transitions TO "completed", credits loyalty points to the
// customer's wallet and updates the per-location breakdown on the loyalty state.
//
// Points formula: floor((priceSnapshot / 100) * pointsPerCurrencyUnit)
//   where priceSnapshot is in minor units (pence/cents) and
//   pointsPerCurrencyUnit is the tenant-configured earning rate.
//
// Idempotency key: loyalty_earn_{bookingId}  (in loyaltyIdempotency collection)

export const updateLoyaltyOnBookingComplete = onDocumentUpdated(
  "bookings/{bookingId}",
  async (event) => {
    const before = event.data?.before?.data() as Record<string, unknown> | undefined;
    const after = event.data?.after?.data() as Record<string, unknown> | undefined;

    // Only react to transitions into "completed".
    if (after?.status !== "completed" || before?.status === "completed") return;

    const tenantId = after.tenantId as string | undefined;
    const customerUserId = after.customerUserId as string | undefined;
    const locationId = after.locationId as string | undefined;
    const bookingId = after.bookingId as string | undefined;
    const priceSnapshot = after.priceSnapshot as number | undefined;

    if (!tenantId || !customerUserId || !locationId || !bookingId) {
      logger.warn("updateLoyaltyOnBookingComplete: missing required booking fields", {
        bookingId: event.params.bookingId,
      });
      return;
    }

    const db = getFirestore();

    // Idempotency: skip if points were already awarded for this booking.
    const idempKey = `loyalty_earn_${bookingId}`;
    const idempRef = db.doc(loyaltyIdempDocPath(tenantId, idempKey));
    const idempSnap = await idempRef.get();
    if (idempSnap.exists) return;

    // Read loyalty config — silently skip if programme is absent or disabled.
    const configSnap = await db.doc(loyaltyConfigDocPath(tenantId)).get();
    if (!configSnap.exists) return;
    const configData = configSnap.data() as {
      enabled?: boolean;
      pointsPerCurrencyUnit?: number;
    };
    if (!configData?.enabled) return;

    const pointsPerCurrencyUnit = configData.pointsPerCurrencyUnit ?? 0;
    if (pointsPerCurrencyUnit <= 0) return;

    // Compute earned points: floor(appointmentValue_in_major_unit × pointsPerCurrencyUnit).
    const appointmentValue = (typeof priceSnapshot === "number" ? priceSnapshot : 0) / 100;
    const earnedPoints = Math.floor(appointmentValue * pointsPerCurrencyUnit);
    if (earnedPoints <= 0) return;

    const txRef = db.collection(loyaltyTxColPath(tenantId)).doc();
    const txId = txRef.id;

    try {
      await db.runTransaction(async (txn) => {
        const stateRef = db.doc(loyaltyStateDocPath(tenantId, customerUserId));
        const stateSnap = await txn.get(stateRef);

        const now = FieldValue.serverTimestamp();
        const existing = stateSnap.exists ? stateSnap.data() : undefined;

        const currentPoints = (existing?.points as number | undefined) ?? 0;
        const currentLifetime = (existing?.lifetimePoints as number | undefined) ?? 0;

        // Merge location breakdown — preserve existing location entries.
        const existingBreakdown =
          (existing?.locationBreakdown as Record<string, unknown> | undefined) ?? {};
        const existingEntry = (existingBreakdown[locationId] as
          | { visits?: number; pointsEarned?: number }
          | undefined) ?? {};

        const updatedBreakdown = {
          ...existingBreakdown,
          [locationId]: {
            visits: ((existingEntry.visits as number | undefined) ?? 0) + 1,
            pointsEarned:
              ((existingEntry.pointsEarned as number | undefined) ?? 0) + earnedPoints,
            lastVisitAt: now,
          },
        };

        txn.set(stateRef, {
          userId: customerUserId,
          tenantId,
          brandId: tenantId,
          points: currentPoints + earnedPoints,
          pointsBalance: currentPoints + earnedPoints,
          lifetimePoints: currentLifetime + earnedPoints,
          currentTierId: (existing?.currentTierId as string | null | undefined) ?? null,
          locationBreakdown: updatedBreakdown,
          enrolledAt: existing?.enrolledAt ?? now,
          updatedAt: now,
        });

        txn.set(txRef, {
          txId,
          userId: customerUserId,
          tenantId,
          type: "credit",
          points: earnedPoints,
          reason: "completed_appointment",
          referenceId: bookingId,
          idempotencyKey: idempKey,
          createdAt: now,
        });

        txn.set(idempRef, {
          txId,
          earnedPoints,
          idempotencyKey: idempKey,
          createdAt: now,
        });
      });
    } catch (err) {
      logger.error("updateLoyaltyOnBookingComplete: transaction failed", {
        bookingId,
        tenantId,
        customerUserId,
        err,
      });
      throw err;
    }

    logger.info("updateLoyaltyOnBookingComplete: credited points", {
      bookingId,
      userId: customerUserId,
      tenantId,
      earnedPoints,
    });
  },
);
