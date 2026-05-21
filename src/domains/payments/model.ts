/**
 * Payments domain — model
 *
 * Phase 2.3 W36-C scaffold. Types only — no Firestore reads/writes yet.
 *
 * Storage layout (planned):
 *   clients/{userId}/paymentMethods/{methodId}    — non-sensitive Stripe pm_* metadata
 *   tenants/{tenantId}/charges/{chargeId}         — booking charges
 *   tenants/{tenantId}/paymentsIdempotency/{key}  — idempotency records
 *
 * Sensitive data (full PAN, CVV, full card metadata) NEVER stored — Stripe
 * customer + payment method IDs only.
 */

import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Saved payment method (Stripe-backed)
// ---------------------------------------------------------------------------

export type PaymentMethodBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "jcb"
  | "diners"
  | "unionpay"
  | "unknown";

export type PaymentMethodType = "card" | "apple_pay" | "google_pay" | "bank_account";

export type SavedPaymentMethod = {
  /** Firestore document id (== Stripe pm_* id) */
  methodId: string;
  /** Owning customer (Firebase Auth uid) */
  userId: string;
  type: PaymentMethodType;
  brand: PaymentMethodBrand;
  /** Last 4 digits only — never store full PAN */
  last4: string;
  expMonth: number;
  expYear: number;
  /** True for the customer's default method. Exactly one default per user. */
  isDefault: boolean;
  /** Cardholder name as supplied by Stripe (may be null for wallets) */
  cardholderName: string | null;
  createdAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Charge
// ---------------------------------------------------------------------------

export type ChargeStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "disputed";

export type ChargeAmount = {
  /** Subtotal in minor units (cents) before discounts/tip/tax */
  subtotalMinor: number;
  /** Loyalty / promo discount in minor units (positive = discount applied) */
  discountMinor: number;
  /** Tip in minor units */
  tipMinor: number;
  /** Tax in minor units */
  taxMinor: number;
  /** Total = subtotal - discount + tip + tax */
  totalMinor: number;
  /** ISO 4217 currency code (e.g. "USD") */
  currency: string;
};

export type Charge = {
  chargeId: string;
  tenantId: string;
  bookingId: string;
  userId: string;
  /** Stripe pi_* id once an intent is created */
  stripePaymentIntentId: string | null;
  /** Stripe pm_* id used for the charge */
  paymentMethodId: string;
  amount: ChargeAmount;
  status: ChargeStatus;
  /** Optional loyalty redemption applied to this charge */
  loyaltyDiscount: LoyaltyDiscountApplied | null;
  /** Stripe failure code on `failed` status */
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Loyalty discount linkage
// ---------------------------------------------------------------------------

export type LoyaltyDiscountApplied = {
  /** Points debited from the customer's loyalty wallet */
  pointsDebited: number;
  /** Cash value of the discount in minor units */
  discountMinor: number;
  /** Loyalty transaction id — matches loyalty domain's debitPoints output */
  loyaltyTransactionId: string;
};

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export type AttachPaymentMethodInput = {
  userId: string;
  /** Stripe pm_* id from a SetupIntent confirmation */
  paymentMethodId: string;
  /** Make this method the default. Defaults to true if user has no methods yet. */
  makeDefault?: boolean;
};

export type DetachPaymentMethodInput = {
  userId: string;
  paymentMethodId: string;
};

export type ChargeBookingInput = {
  tenantId: string;
  bookingId: string;
  userId: string;
  paymentMethodId: string;
  amount: ChargeAmount;
  /** Idempotency key — typically `booking_{bookingId}_charge_v1` */
  idempotencyKey: string;
  loyaltyDiscount?: LoyaltyDiscountApplied;
};

export type ApplyLoyaltyDiscountInput = {
  tenantId: string;
  userId: string;
  bookingId: string;
  pointsToDebit: number;
  /** Idempotency key — typically `booking_{bookingId}_loyalty_v1` */
  idempotencyKey: string;
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type PaymentsErrorCode =
  | "PAYMENT_METHOD_NOT_FOUND"
  | "PAYMENT_METHOD_DETACH_FAILED"
  | "CHARGE_FAILED"
  | "INSUFFICIENT_LOYALTY_POINTS"
  | "INVALID_AMOUNT"
  | "IDEMPOTENCY_CONFLICT"
  | "STRIPE_ERROR"
  | "PAYMENT_NOT_REQUIRED"
  | "NOT_IMPLEMENTED";

export class PaymentsError extends Error {
  constructor(
    public readonly code: PaymentsErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PaymentsError";
  }
}

// ---------------------------------------------------------------------------
// Booking-level payments (Connect flow)
// ---------------------------------------------------------------------------

export type PaymentMode = "deposit" | "full" | "card_on_file";

export type AppointmentPaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "cancelled"
  | "refunded"
  | "paid_in_person"
  | "failed";

export type PaymentSettings = {
  paymentsEnabled: boolean;
  paymentMode: PaymentMode;
  depositPercentage: number;
  currency: string;
  platformFeePercent: number;
};

export type AppointmentPayment = {
  bookingId: string;
  tenantId: string;
  userId: string;
  paymentMode: PaymentMode;
  currency: string;
  totalAmountMinor: number;
  authorizedAmountMinor: number;
  capturedAmountMinor: number;
  tipAmountMinor: number;
  stripePaymentIntentId: string | null;
  stripeSetupIntentId: string | null;
  status: AppointmentPaymentStatus;
  stripeStatus: string | null;
  notes: string | null;
};

export type CreateBookingPaymentIntentInput = {
  tenantId: string;
  bookingId: string;
  /** Service total in minor units (cents) */
  totalAmountMinor: number;
  currency?: string;
};

export type CreateBookingPaymentIntentResult =
  | { type: "no_payment_required" }
  | {
      type: "payment_intent";
      clientSecret: string;
      ephemeralKeySecret: string;
      customerId: string;
      paymentMode: "deposit" | "full";
      authorizedAmountMinor: number;
    }
  | { type: "setup_intent"; clientSecret: string; ephemeralKeySecret: string; customerId: string };

export type CaptureBookingPaymentInput = {
  tenantId: string;
  bookingId: string;
  finalAmountMinor: number;
  tipAmountMinor?: number;
  paidInPerson?: boolean;
};

export type CancelBookingPaymentInput = {
  tenantId: string;
  bookingId: string;
};
