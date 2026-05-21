/**
 * functions/src/appointmentPaymentsCallable.ts
 *
 * Server-side payment orchestration for per-booking payments:
 *
 *   createBookingPaymentIntent  — Server creates intent; client confirms with Stripe SDK
 *   captureBookingPayment       — Post-service: capture hold or charge card-on-file
 *   cancelBookingPayment        — Cancel hold; optionally keep deposit as cancellation fee
 *
 * Payment modes (read from tenants/{tenantId}/paymentSettings/config):
 *   deposit     — Authorize depositPercentage% now (manual capture), charge remainder post-service
 *   full        — Authorize 100% now (manual capture), capture post-service
 *   card_on_file — SetupIntent only; charge full amount off-session post-service
 *
 * Firestore paths written:
 *   tenants/{tenantId}/appointmentPayments/{bookingId}
 *   clients/{userId}/tenantPaymentProfiles/{tenantId}
 *
 * Secrets: STRIPE_API_KEY
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

import { createStripePaymentsApiClient } from "./stripe/paymentsAdapter.js";
import {
  createAdminPaymentSettingsRepository,
  createAdminAppointmentPaymentsRepository,
  createAdminTenantCustomerRepository,
  createAdminConnectRepository,
  type AppointmentPayment,
} from "./stripe/adminRepositories.js";

if (getApps().length === 0) {
  initializeApp();
}

const STRIPE_API_KEY = defineSecret("STRIPE_API_KEY");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Throws permission-denied if uid is not an owner or admin of the tenant. */
async function assertTenantAdmin(db: Firestore, uid: string, tenantId: string): Promise<void> {
  const tenantSnap = await db.doc(`tenants/${tenantId}`).get();
  if (!tenantSnap.exists) {
    throw new HttpsError("not-found", "Tenant not found.");
  }
  const data = tenantSnap.data() as Record<string, unknown>;
  const isOwner = data.ownerUid === uid;
  const staffSnap = await db
    .collection(`tenants/${tenantId}/staff`)
    .where("userId", "==", uid)
    .where("role", "in", ["owner", "admin"])
    .limit(1)
    .get();
  const isAdmin = !staffSnap.empty;
  if (!isOwner && !isAdmin) {
    throw new HttpsError("permission-denied", "Only tenant owners/admins may perform this action.");
  }
}

/**
 * Get or lazily create a per-tenant Stripe Customer on the connected account.
 * Stored at clients/{userId}/tenantPaymentProfiles/{tenantId}.
 */
async function resolveOrCreateTenantCustomer(
  db: Firestore,
  getEmail: (uid: string) => Promise<string | null>,
  userId: string,
  tenantId: string,
  stripeAccountId: string,
  stripe: ReturnType<typeof createStripePaymentsApiClient>,
): Promise<{ stripeCustomerId: string; defaultPaymentMethodId: string | null }> {
  const tenantCustomerRepo = createAdminTenantCustomerRepository(db);

  const existing = await tenantCustomerRepo.getTenantCustomerProfile(userId, tenantId);
  if (existing) {
    return {
      stripeCustomerId: existing.stripeCustomerId,
      defaultPaymentMethodId: existing.defaultPaymentMethodId,
    };
  }

  const email = await getEmail(userId);

  const customer = await stripe.createCustomer(userId, email, {
    stripeAccount: stripeAccountId,
  });

  await tenantCustomerRepo.saveTenantCustomerProfile({
    tenantId,
    userId,
    stripeCustomerId: customer.id,
    defaultPaymentMethodId: null,
  });

  return { stripeCustomerId: customer.id, defaultPaymentMethodId: null };
}

// ---------------------------------------------------------------------------
// createBookingPaymentIntent
// ---------------------------------------------------------------------------

type CreateBookingPaymentIntentInput = {
  tenantId: string;
  bookingId: string;
  /** Service total in minor units (cents). Passed by client; validated ≥ 1. */
  totalAmountMinor: number;
  currency?: string;
};

type CreateBookingPaymentIntentResult =
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

export const createBookingPaymentIntent = onCall(
  {
    region: "us-central1",
    secrets: [STRIPE_API_KEY],
  },
  async (request): Promise<CreateBookingPaymentIntentResult> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    const uid = request.auth.uid;
    const input = request.data as CreateBookingPaymentIntentInput;
    const db = getFirestore();
    const stripe = createStripePaymentsApiClient(STRIPE_API_KEY.value());
    const getEmail = async (userId: string) => {
      try {
        return (await getAuth().getUser(userId)).email ?? null;
      } catch {
        return null;
      }
    };
    return runCreateBookingPaymentIntent(db, stripe, getEmail, uid, input);
  },
);

/** Pure handler — injectable for unit tests. */
export async function runCreateBookingPaymentIntent(
  db: Firestore,
  stripe: ReturnType<typeof createStripePaymentsApiClient>,
  getEmail: (uid: string) => Promise<string | null>,
  uid: string,
  input: CreateBookingPaymentIntentInput,
): Promise<CreateBookingPaymentIntentResult> {
  if (!input.tenantId) throw new HttpsError("invalid-argument", "tenantId required.");
  if (!input.bookingId) throw new HttpsError("invalid-argument", "bookingId required.");
  if (!input.totalAmountMinor || input.totalAmountMinor < 1) {
    throw new HttpsError("invalid-argument", "totalAmountMinor must be ≥ 1.");
  }

  // Verify the booking belongs to this user
  const bookingSnap = await db.doc(`tenants/${input.tenantId}/bookings/${input.bookingId}`).get();
  if (!bookingSnap.exists) {
    throw new HttpsError("not-found", "Booking not found.");
  }
  const bookingData = bookingSnap.data() as Record<string, unknown>;
  if (bookingData.customerUserId !== uid) {
    throw new HttpsError("permission-denied", "This booking does not belong to you.");
  }

  // MED-H: Reject payment intent creation for bookings that are no longer active.
  const PAYABLE_STATUSES = [
    "pending", "confirmed", "reschedule_pending", "reschedule_rejected", "rescheduled",
  ];
  const bookingStatus = (bookingData.status as string) ?? "";
  if (!PAYABLE_STATUSES.includes(bookingStatus)) {
    throw new HttpsError(
      "failed-precondition",
      `Booking is no longer active (status: "${bookingStatus}").`,
    );
  }

  // CRIT-A: Server-side price validation — guard against client tampering.
  // priceSnapshot is in major currency units (e.g. dollars); convert to minor units for comparison.
  const baseMinorExpected = Math.round(((bookingData.priceSnapshot as number) ?? 0) * 100);
  const addonsMinorExpected = ((bookingData.addonsSnapshot as Array<{ price: number }>) ?? [])
    .reduce((sum, a) => sum + Math.round(a.price * 100), 0);
  const totalMinorExpected = baseMinorExpected + addonsMinorExpected;
  if (totalMinorExpected > 0 && Math.abs(input.totalAmountMinor - totalMinorExpected) > totalMinorExpected * 0.1) {
    throw new HttpsError(
      "invalid-argument",
      `totalAmountMinor ${input.totalAmountMinor} is not within 10% of the booked service price ${totalMinorExpected}.`,
    );
  }

  // Read payment settings
  const settingsRepo = createAdminPaymentSettingsRepository(db);
  const settings = await settingsRepo.getPaymentSettings(input.tenantId);

  if (!settings?.paymentsEnabled) {
    return { type: "no_payment_required" };
  }

  // Read Connect account for stripeAccountId
  const connectRepo = createAdminConnectRepository(db);
  const connectAccount = await connectRepo.getAccount(input.tenantId);
  if (!connectAccount?.stripeAccountId || !connectAccount.chargesEnabled) {
    throw new HttpsError(
      "failed-precondition",
      "This salon is not set up to accept payments yet.",
    );
  }

  const stripeAccountId = connectAccount.stripeAccountId;
  const currency = (input.currency ?? settings.currency ?? "usd").toLowerCase();

  // Get or create per-tenant Stripe customer
  const { stripeCustomerId } = await resolveOrCreateTenantCustomer(
    db,
    getEmail,
    uid,
    input.tenantId,
    stripeAccountId,
    stripe,
  );

  const apRepo = createAdminAppointmentPaymentsRepository(db);

  // Idempotency: if a pending payment record already exists, retrieve the existing
  // intent from Stripe and return its client_secret — no second intent is created.
  let isReplacement = false;
  const existing = await apRepo.getAppointmentPayment(input.tenantId, input.bookingId);
  if (existing && existing.status === "pending") {
    if (existing.paymentMode === "card_on_file" && existing.stripeSetupIntentId) {
      const si = await stripe.retrieveSetupIntent(existing.stripeSetupIntentId, stripeAccountId);
      if (si.status !== "canceled" && si.client_secret) {
        const ek = await stripe.createEphemeralKey(stripeCustomerId, stripeAccountId);
        return {
          type: "setup_intent",
          clientSecret: si.client_secret,
          ephemeralKeySecret: ek.secret,
          customerId: stripeCustomerId,
        };
      }
      // SI was canceled — fall through to create a fresh one
      isReplacement = true;
    } else if (
      (existing.paymentMode === "deposit" || existing.paymentMode === "full") &&
      existing.stripePaymentIntentId
    ) {
      const pi = await stripe.retrievePaymentIntent(
        existing.stripePaymentIntentId,
        stripeAccountId,
      );
      if (pi.status !== "canceled" && pi.client_secret) {
        const ek = await stripe.createEphemeralKey(stripeCustomerId, stripeAccountId);
        return {
          type: "payment_intent",
          clientSecret: pi.client_secret,
          ephemeralKeySecret: ek.secret,
          customerId: stripeCustomerId,
          paymentMode: existing.paymentMode as "deposit" | "full",
          authorizedAmountMinor: existing.authorizedAmountMinor,
        };
      }
      // PI was canceled — fall through to create a fresh one
      isReplacement = true;
    }
  }

  // ---------------------------------------------------------------------------
  // card_on_file: SetupIntent — no charge at booking time
  // ---------------------------------------------------------------------------
  if (settings.paymentMode === "card_on_file") {
    const setupIntent = await stripe.createSetupIntent({
      customerId: stripeCustomerId,
      stripeAccount: stripeAccountId,
      metadata: {
        bookingId: input.bookingId,
        tenantId: input.tenantId,
        userId: uid,
      },
    });

    const paymentRecord: AppointmentPayment = {
      bookingId: input.bookingId,
      tenantId: input.tenantId,
      userId: uid,
      paymentMode: "card_on_file",
      currency,
      totalAmountMinor: input.totalAmountMinor,
      authorizedAmountMinor: 0,
      capturedAmountMinor: 0,
      tipAmountMinor: 0,
      stripePaymentIntentId: null,
      stripeSetupIntentId: setupIntent.id,
      stripePaymentMethodId: null,
      status: "pending",
      stripeStatus: setupIntent.status,
      notes: null,
      authorizedAt: null,
    };
    if (isReplacement) {
      await apRepo.updateAppointmentPayment(input.tenantId, input.bookingId, {
        stripeSetupIntentId: setupIntent.id,
        stripeStatus: setupIntent.status,
        status: "pending",
      });
    } else {
      await apRepo.createAppointmentPayment(paymentRecord);
    }

    if (!setupIntent.client_secret) {
      throw new HttpsError("internal", "Stripe SetupIntent missing client_secret.");
    }
    const ephemeralKeyCof = await stripe.createEphemeralKey(stripeCustomerId, stripeAccountId);
    return {
      type: "setup_intent",
      clientSecret: setupIntent.client_secret,
      ephemeralKeySecret: ephemeralKeyCof.secret,
      customerId: stripeCustomerId,
    };
  }

  // ---------------------------------------------------------------------------
  // deposit / full: PaymentIntent with capture_method=manual
  // ---------------------------------------------------------------------------
  const authorizedAmountMinor =
    settings.paymentMode === "deposit"
      ? Math.max(1, Math.round(input.totalAmountMinor * (settings.depositPercentage / 100)))
      : input.totalAmountMinor;

  const platformFeeMinor = Math.round(
    authorizedAmountMinor * (settings.platformFeePercent ?? 0.02),
  );

  const paymentIntent = await stripe.createPaymentIntentManual({
    amountMinor: authorizedAmountMinor,
    currency,
    customerId: stripeCustomerId,
    applicationFeeMinor: platformFeeMinor,
    stripeAccount: stripeAccountId,
    // Use a fresh idempotency key when replacing a canceled PI so Stripe does not
    // return the cached canceled intent (idempotency window is 24 hours).
    idempotencyKey: isReplacement
      ? `create-pi-${input.bookingId}-r${Date.now()}`
      : `create-pi-${input.bookingId}`,
    metadata: {
      bookingId: input.bookingId,
      tenantId: input.tenantId,
      userId: uid,
      paymentMode: settings.paymentMode,
    },
  });

  const paymentRecord: AppointmentPayment = {
    bookingId: input.bookingId,
    tenantId: input.tenantId,
    userId: uid,
    paymentMode: settings.paymentMode,
    currency,
    totalAmountMinor: input.totalAmountMinor,
    authorizedAmountMinor,
    capturedAmountMinor: 0,
    tipAmountMinor: 0,
    stripePaymentIntentId: paymentIntent.id,
    stripeSetupIntentId: null,
    stripePaymentMethodId: null,
    status: "pending",
    stripeStatus: paymentIntent.status,
    notes: null,
    authorizedAt: null,
  };
  if (isReplacement) {
    await apRepo.updateAppointmentPayment(input.tenantId, input.bookingId, {
      stripePaymentIntentId: paymentIntent.id,
      stripeStatus: paymentIntent.status,
      authorizedAmountMinor,
      status: "pending",
    });
  } else {
    await apRepo.createAppointmentPayment(paymentRecord);
  }

  if (!paymentIntent.client_secret) {
    throw new HttpsError("internal", "Stripe PaymentIntent missing client_secret.");
  }

  const ephemeralKey = await stripe.createEphemeralKey(stripeCustomerId, stripeAccountId);
  return {
    type: "payment_intent",
    clientSecret: paymentIntent.client_secret,
    ephemeralKeySecret: ephemeralKey.secret,
    customerId: stripeCustomerId,
    paymentMode: settings.paymentMode,
    authorizedAmountMinor,
  };
}

// ---------------------------------------------------------------------------
// captureBookingPayment
// ---------------------------------------------------------------------------

type CaptureBookingPaymentInput = {
  tenantId: string;
  bookingId: string;
  /** Total to charge including tip, in minor units (cents). */
  finalAmountMinor: number;
  tipAmountMinor?: number;
  paidInPerson?: boolean;
};

/** Pure handler for unit testing. The onCall wrapper below adds auth + input validation. */
export async function runCaptureBookingPayment(
  db: Firestore,
  stripe: ReturnType<typeof createStripePaymentsApiClient>,
  uid: string,
  input: CaptureBookingPaymentInput,
): Promise<{ status: string }> {
  await assertTenantAdmin(db, uid, input.tenantId);

  const apRepo = createAdminAppointmentPaymentsRepository(db);
    const payment = await apRepo.getAppointmentPayment(input.tenantId, input.bookingId);
    if (!payment) {
      throw new HttpsError("not-found", "Appointment payment record not found.");
    }

    // Early-exit for already-terminal statuses to prevent double-capture.
    if (["captured", "paid_in_person", "cancelled", "failed"].includes(payment.status)) {
      return { status: payment.status };
    }

    // HIGH-D: Ensure the payment has been authorized before attempting capture.
    // capture_in_progress is allowed here (retry after partial failure).
    if (!input.paidInPerson && payment.status !== "authorized" && payment.status !== "capture_in_progress") {
      throw new HttpsError(
        "failed-precondition",
        `Payment cannot be captured in status "${payment.status}" — must be "authorized".`,
      );
    }

    // HIGH-E: Sanity ceiling — no more than 2× the original total (generous tip allowance).
    if (input.finalAmountMinor > payment.totalAmountMinor * 2) {
      throw new HttpsError(
        "invalid-argument",
        `finalAmountMinor ${input.finalAmountMinor} exceeds 2× the booking total ${payment.totalAmountMinor}.`,
      );
    }

    const settingsRepo = createAdminPaymentSettingsRepository(db);
    const settings = await settingsRepo.getPaymentSettings(input.tenantId);
    const connectRepo = createAdminConnectRepository(db);
    const connectAccount = await connectRepo.getAccount(input.tenantId);
    const stripeAccountId = connectAccount?.stripeAccountId ?? "";

    const tipMinor = input.tipAmountMinor ?? 0;

    // --- Paid in person ---
    if (input.paidInPerson) {
      if (payment.stripePaymentIntentId && stripeAccountId) {
        try {
          await stripe.cancelPaymentIntent(payment.stripePaymentIntentId, stripeAccountId);
        } catch (err) {
          logger.warn("captureBookingPayment: could not cancel PI for paid-in-person", {
            bookingId: input.bookingId,
            err,
          });
        }
      }
      await apRepo.updateAppointmentPayment(input.tenantId, input.bookingId, {
        status: "paid_in_person",
        capturedAmountMinor: input.finalAmountMinor,
        tipAmountMinor: tipMinor,
        notes: "Paid in person",
      });
      return { status: "paid_in_person" };
    }

    const currency = payment.currency;
    const platformFeePercent = settings?.platformFeePercent ?? 0.02;

    // --- card_on_file: create off-session PI ---
    if (payment.paymentMode === "card_on_file") {
      const tenantCustomerRepo = createAdminTenantCustomerRepository(db);
      const profile = await tenantCustomerRepo.getTenantCustomerProfile(
        payment.userId,
        input.tenantId,
      );

      // MED-G: If the setup_intent.succeeded webhook hasn't arrived yet, the Firestore
      // profile may be missing defaultPaymentMethodId. Fall back to querying Stripe directly.
      let resolvedPaymentMethodId = profile?.defaultPaymentMethodId ?? null;
      if (!profile?.stripeCustomerId) {
        throw new HttpsError(
          "failed-precondition",
          "No saved payment method found for this customer.",
        );
      }
      if (!resolvedPaymentMethodId) {
        const methods = await stripe.listPaymentMethods(profile.stripeCustomerId, stripeAccountId);
        if (methods.length === 0) {
          throw new HttpsError(
            "failed-precondition",
            "No saved payment method found for this customer.",
          );
        }
        resolvedPaymentMethodId = methods[0].id;
      }

      const feeMinor = Math.round(input.finalAmountMinor * platformFeePercent);
      const newIntent = await stripe.createOffsessionPaymentIntent({
        amountMinor: input.finalAmountMinor,
        currency,
        customerId: profile.stripeCustomerId,
        paymentMethodId: resolvedPaymentMethodId,
        applicationFeeMinor: feeMinor,
        stripeAccount: stripeAccountId,
        idempotencyKey: `capture-cof-${input.bookingId}`,
        metadata: {
          bookingId: input.bookingId,
          tenantId: input.tenantId,
          type: "post_service_capture",
        },
      });

      const isCharged = newIntent.status === "succeeded";
      await apRepo.updateAppointmentPayment(input.tenantId, input.bookingId, {
        stripePaymentIntentId: newIntent.id,
        capturedAmountMinor: isCharged ? input.finalAmountMinor : 0,
        tipAmountMinor: isCharged ? tipMinor : 0,
        status: isCharged ? "captured" : "failed",
        stripeStatus: newIntent.status,
      });
      if (!isCharged) {
        throw new HttpsError(
          "aborted",
          `Card charge declined (${newIntent.status}). Please update the customer's payment method and retry.`,
        );
      }
      return { status: newIntent.status };
    }

    // --- deposit / full: capture the existing authorized PI ---
    if (!payment.stripePaymentIntentId) {
      throw new HttpsError("failed-precondition", "No PaymentIntent on record — cannot capture.");
    }

    const remainderMinor = input.finalAmountMinor - payment.authorizedAmountMinor;

    if (remainderMinor <= 0) {
      // Partial (or exact) capture: charge only finalAmountMinor from the hold.
      // Stripe releases the uncaptured portion automatically.
      await stripe.capturePaymentIntent(
        payment.stripePaymentIntentId,
        stripeAccountId,
        input.finalAmountMinor,
      );
    } else {
      // Final amount exceeds the hold — verify a payment method is available BEFORE
      // capturing, so the admin sees a clear error rather than a silent partial charge.
      const tenantCustomerRepo = createAdminTenantCustomerRepository(db);
      const profile = await tenantCustomerRepo.getTenantCustomerProfile(
        payment.userId,
        input.tenantId,
      );
      // defaultPaymentMethodId is only written for card_on_file (setup_intent.succeeded).
      // For deposit/full mode, fall back to stripePaymentMethodId saved on the appointment
      // record by the payment_intent.amount_capturable_updated webhook.
      const paymentMethodId = profile?.defaultPaymentMethodId ?? payment.stripePaymentMethodId;
      if (!profile?.stripeCustomerId || !paymentMethodId) {
        throw new HttpsError(
          "failed-precondition",
          `No saved payment method found to charge the remainder of ${remainderMinor} ${currency}. Reduce the final amount to match the authorized hold, or ask the customer to add a card.`,
        );
      }

      // Capture full authorized amount, then charge the remainder off-session.
      // HIGH-C: Write capture_in_progress BEFORE the first Stripe call so that if this
      // function crashes between the two Stripe calls, a retry can detect the partial
      // state and skip straight to the remainder charge (idempotency key is stable).
      if (payment.status !== "capture_in_progress") {
        await apRepo.updateAppointmentPayment(input.tenantId, input.bookingId, {
          status: "capture_in_progress",
        });
        await stripe.capturePaymentIntent(payment.stripePaymentIntentId, stripeAccountId);
      }

      const feeMinor = Math.round(remainderMinor * platformFeePercent);
      const remainderIntent = await stripe.createOffsessionPaymentIntent({
        amountMinor: remainderMinor,
        currency,
        customerId: profile.stripeCustomerId,
        paymentMethodId,
        applicationFeeMinor: feeMinor,
        stripeAccount: stripeAccountId,
        idempotencyKey: `remainder-${input.bookingId}`,
        metadata: {
          bookingId: input.bookingId,
          tenantId: input.tenantId,
          type: "remainder_capture",
        },
      });

      if (remainderIntent.status !== "succeeded") {
        // Hold already captured; remainder not collected. Status stays
        // "capture_in_progress" so the admin can retry with the same
        // idempotency key until the remainder succeeds.
        throw new HttpsError(
          "aborted",
          `Remainder charge declined (${remainderIntent.status}). The authorized hold has been captured. Retry to re-attempt the remainder charge.`,
        );
      }
    }

    await apRepo.updateAppointmentPayment(input.tenantId, input.bookingId, {
      capturedAmountMinor: input.finalAmountMinor,
      tipAmountMinor: tipMinor,
      status: "captured",
      stripeStatus: "succeeded",
    });

    return { status: "captured" };
}

export const captureBookingPayment = onCall(
  { region: "us-central1", secrets: [STRIPE_API_KEY] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    const input = request.data as CaptureBookingPaymentInput;
    if (!input.tenantId) throw new HttpsError("invalid-argument", "tenantId required.");
    if (!input.bookingId) throw new HttpsError("invalid-argument", "bookingId required.");
    if (!input.finalAmountMinor || input.finalAmountMinor < 1) {
      throw new HttpsError("invalid-argument", "finalAmountMinor must be ≥ 1.");
    }
    return runCaptureBookingPayment(
      getFirestore(),
      createStripePaymentsApiClient(STRIPE_API_KEY.value()),
      request.auth.uid,
      input,
    );
  },
);

// ---------------------------------------------------------------------------
// UTC conversion helper for cancellation policy window check
// (Same algorithm as scheduledReminders.ts:appointmentUtcMs — inlined to avoid
// a cross-module import from a scheduled function.)
// ---------------------------------------------------------------------------

function appointmentUtcMs(date: string, startMinutes: number, timezone: string): number {
  const hours = Math.floor(startMinutes / 60);
  const mins = startMinutes % 60;
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  const naiveUtcMs = Date.UTC(y, mo - 1, d, hours, mins, 0, 0);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(naiveUtcMs));
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0");
  const localAtNaiveMs = Date.UTC(
    get("year"), get("month") - 1, get("day"), get("hour"), get("minute"),
  );
  return naiveUtcMs - (localAtNaiveMs - naiveUtcMs);
}

// ---------------------------------------------------------------------------
// cancelBookingPayment
// ---------------------------------------------------------------------------

type CancelBookingPaymentInput = {
  tenantId: string;
  bookingId: string;
};

/** Pure handler for unit testing. The onCall wrapper below adds auth + input validation. */
export async function runCancelBookingPayment(
  db: Firestore,
  stripe: ReturnType<typeof createStripePaymentsApiClient>,
  uid: string,
  input: CancelBookingPaymentInput,
): Promise<{ status: string }> {
  const apRepo = createAdminAppointmentPaymentsRepository(db);
  const payment = await apRepo.getAppointmentPayment(input.tenantId, input.bookingId);
  if (!payment) {
    return { status: "no_payment" };
  }

  if (["captured", "paid_in_person", "cancelled", "capture_in_progress", "refunded", "failed"].includes(payment.status)) {
    return { status: payment.status };
  }

  // Authorization: caller must be the booking's own customer or a tenant admin
  if (uid !== payment.userId) {
    await assertTenantAdmin(db, uid, input.tenantId);
  }

    // Load settings + connect account (needed for all paths below)
    const settingsRepo = createAdminPaymentSettingsRepository(db);
    const settings = await settingsRepo.getPaymentSettings(input.tenantId);
    const connectRepo = createAdminConnectRepository(db);
    const connectAccount = await connectRepo.getAccount(input.tenantId);
    const stripeAccountId = connectAccount?.stripeAccountId ?? "";
    const platformFeePercent = settings?.platformFeePercent ?? 0.02;

    // ---------------------------------------------------------------------------
    // Evaluate cancellation policy: does a fee apply to this cancellation?
    // A fee applies when:
    //   1. cancellationPolicy is enabled in settings
    //   2. The payment has been authorized (card is on hold / saved)
    //   3. The appointment is in the future but within cancellationHours
    // ---------------------------------------------------------------------------
    let feeApplies = false;
    if (settings?.cancellationPolicy && payment.status === "authorized") {
      const [bookingSnap, tenantSnap] = await Promise.all([
        db.doc(`tenants/${input.tenantId}/bookings/${input.bookingId}`).get(),
        db.doc(`tenants/${input.tenantId}`).get(),
      ]);
      if (bookingSnap.exists) {
        const booking = bookingSnap.data() as { date: string; startMinutes: number };
        const timezone = (tenantSnap.data() as { timezone?: string })?.timezone ?? "UTC";
        const apptMs = appointmentUtcMs(booking.date, booking.startMinutes, timezone);
        const hoursUntil = (apptMs - Date.now()) / 3_600_000;
        // Apply fee only when appointment is still in the future and within the window
        feeApplies = hoursUntil >= 0 && hoursUntil <= settings.cancellationHours;
      }
    }

    // ---------------------------------------------------------------------------
    // card_on_file path: no authorized hold on Stripe, but a custom fee can still
    // be charged off-session against the saved payment method.
    // ---------------------------------------------------------------------------
    if (payment.paymentMode === "card_on_file" || !payment.stripePaymentIntentId) {
      if (
        feeApplies &&
        settings?.cancellationCharge === "custom" &&
        (settings.cancellationAmountMinor ?? 0) > 0
      ) {
        const tenantCustomerRepo = createAdminTenantCustomerRepository(db);
        const profile = await tenantCustomerRepo.getTenantCustomerProfile(
          payment.userId,
          input.tenantId,
        );
        if (profile?.stripeCustomerId && profile.defaultPaymentMethodId) {
          const feeMinor = Math.round(settings.cancellationAmountMinor * platformFeePercent);
          try {
            await stripe.createOffsessionPaymentIntent({
              amountMinor: settings.cancellationAmountMinor,
              currency: payment.currency,
              customerId: profile.stripeCustomerId,
              paymentMethodId: profile.defaultPaymentMethodId,
              applicationFeeMinor: feeMinor,
              stripeAccount: stripeAccountId,
              idempotencyKey: `cancel-fee-${input.bookingId}`,
              metadata: {
                bookingId: input.bookingId,
                tenantId: input.tenantId,
                type: "cancellation_fee",
              },
            });
          } catch (err) {
            logger.error("cancelBookingPayment: custom fee charge failed", {
              bookingId: input.bookingId,
              err,
            });
          }
        } else {
          logger.warn("cancelBookingPayment: no saved PM for custom fee (card_on_file)", {
            bookingId: input.bookingId,
          });
        }
      }
      await apRepo.updateAppointmentPayment(input.tenantId, input.bookingId, {
        status: "cancelled",
        notes: feeApplies && settings?.cancellationAmountMinor
          ? "Cancellation fee charged"
          : null,
      });
      return { status: "cancelled" };
    }

    // ---------------------------------------------------------------------------
    // deposit / full path: an authorized PaymentIntent hold exists on Stripe.
    // ---------------------------------------------------------------------------
    if (feeApplies) {
      // --- deposit: capture the deposit hold as the cancellation fee ---
      if (
        settings?.cancellationCharge === "deposit" &&
        payment.paymentMode === "deposit" &&
        payment.authorizedAmountMinor > 0
      ) {
        await stripe.capturePaymentIntent(payment.stripePaymentIntentId, stripeAccountId);
        await apRepo.updateAppointmentPayment(input.tenantId, input.bookingId, {
          capturedAmountMinor: payment.authorizedAmountMinor,
          status: "captured",
          stripeStatus: "succeeded",
          notes: "Cancellation fee — deposit retained",
        });
        return { status: "deposit_captured" };
      }

      // --- custom: release the hold, then charge the configured flat fee off-session ---
      if (
        settings?.cancellationCharge === "custom" &&
        (settings.cancellationAmountMinor ?? 0) > 0
      ) {
        // Cancel the hold first (may already be expired — ignore errors)
        try {
          await stripe.cancelPaymentIntent(payment.stripePaymentIntentId, stripeAccountId);
        } catch (err) {
          logger.warn("cancelBookingPayment: could not cancel PI before custom fee", {
            bookingId: input.bookingId,
            err,
          });
        }

        // Resolve payment method — prefer the PM saved at authorization time
        const tenantCustomerRepo = createAdminTenantCustomerRepository(db);
        const profile = await tenantCustomerRepo.getTenantCustomerProfile(
          payment.userId,
          input.tenantId,
        );
        const paymentMethodId =
          payment.stripePaymentMethodId ?? profile?.defaultPaymentMethodId ?? null;

        if (profile?.stripeCustomerId && paymentMethodId) {
          const feeMinor = Math.round(settings.cancellationAmountMinor * platformFeePercent);
          try {
            await stripe.createOffsessionPaymentIntent({
              amountMinor: settings.cancellationAmountMinor,
              currency: payment.currency,
              customerId: profile.stripeCustomerId,
              paymentMethodId,
              applicationFeeMinor: feeMinor,
              stripeAccount: stripeAccountId,
              idempotencyKey: `cancel-fee-${input.bookingId}`,
              metadata: {
                bookingId: input.bookingId,
                tenantId: input.tenantId,
                type: "cancellation_fee",
              },
            });
          } catch (err) {
            logger.error("cancelBookingPayment: custom fee charge failed", {
              bookingId: input.bookingId,
              err,
            });
          }
        } else {
          logger.warn("cancelBookingPayment: no saved PM for custom fee", {
            bookingId: input.bookingId,
          });
        }

        await apRepo.updateAppointmentPayment(input.tenantId, input.bookingId, {
          status: "cancelled",
          stripeStatus: "canceled",
          notes: "Cancellation fee — custom fee charged",
        });
        return { status: "cancelled" };
      }
    }

    // No fee applies (outside policy window, policy disabled, or no applicable charge type).
    // Release the authorization hold.
    await stripe.cancelPaymentIntent(payment.stripePaymentIntentId, stripeAccountId);
    await apRepo.updateAppointmentPayment(input.tenantId, input.bookingId, {
      status: "cancelled",
      stripeStatus: "canceled",
    });
    return { status: "cancelled" };
}

export const cancelBookingPayment = onCall(
  { region: "us-central1", secrets: [STRIPE_API_KEY] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    const input = request.data as CancelBookingPaymentInput;
    if (!input.tenantId) throw new HttpsError("invalid-argument", "tenantId required.");
    if (!input.bookingId) throw new HttpsError("invalid-argument", "bookingId required.");
    return runCancelBookingPayment(
      getFirestore(),
      createStripePaymentsApiClient(STRIPE_API_KEY.value()),
      request.auth.uid,
      input,
    );
  },
);
