/**
 * functions/src/reauthorizeExpiredHolds.ts
 *
 * Daily scheduled Cloud Function that re-authorizes payment holds expiring
 * within 24 hours.
 *
 * Background: Stripe payment holds (PaymentIntents with capture_method=manual)
 * expire after 7 days. For bookings scheduled far in advance the hold must be
 * re-created before it lapses to avoid a failed capture at service time.
 *
 * Strategy:
 *   1. Query all appointmentPayments where:
 *        status == "authorized"
 *        paymentMode in ["deposit", "full"]
 *        authorizedAt < now - 6 days  (i.e. expiry in ≤24 h)
 *   2. For each record:
 *        a. Cancel the existing PaymentIntent on Stripe.
 *        b. Create a new off-session manual-capture PaymentIntent for the same
 *           amount using the saved stripePaymentMethodId.
 *        c. Update the Firestore record with the new PI id and reset authorizedAt.
 *
 * Firestore composite index required:
 *   Collection : appointmentPayments (collectionGroup)
 *   Fields     : status ASC, paymentMode ASC, authorizedAt ASC
 *
 * Secrets: STRIPE_API_KEY
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp, type Query, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";

import { createStripePaymentsApiClient } from "./stripe/paymentsAdapter.js";
import {
  createAdminConnectRepository,
  createAdminPaymentSettingsRepository,
  createAdminTenantCustomerRepository,
  TenantPaymentSettings,
} from "./stripe/adminRepositories.js";

if (getApps().length === 0) {
  initializeApp();
}

const STRIPE_API_KEY = defineSecret("STRIPE_API_KEY");

/** Holds are expired when authorized > 6 days ago (Stripe allows 7 days). */
const REAUTH_THRESHOLD_MS = 6 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Testable handler
// ---------------------------------------------------------------------------

export async function runReauthorizeExpiredHolds(now: Date): Promise<void> {
  const db = getFirestore();
  const stripe = createStripePaymentsApiClient(STRIPE_API_KEY.value());
  const connectRepo = createAdminConnectRepository(db);
  const customerRepo = createAdminTenantCustomerRepository(db);
  const settingsRepo = createAdminPaymentSettingsRepository(db);
  const settingsCache = new Map<string, TenantPaymentSettings | null>();

  const thresholdDate = new Date(now.getTime() - REAUTH_THRESHOLD_MS);
  const thresholdTs = Timestamp.fromDate(thresholdDate);

  // collectionGroup query — requires composite index; paginated to handle > 100 records
  const baseQuery = db
    .collectionGroup("appointmentPayments")
    .where("status", "==", "authorized")
    .where("paymentMode", "in", ["deposit", "full"])
    .where("authorizedAt", "<=", thresholdTs)
    .orderBy("authorizedAt", "asc")
    .limit(100);

  let lastDoc: QueryDocumentSnapshot | null = null;
  let totalProcessed = 0;

  while (true) {
    const q: Query = lastDoc ? baseQuery.startAfter(lastDoc) : baseQuery;
    const snap = await q.get();

    if (snap.empty) {
      if (totalProcessed === 0) {
        logger.info("reauthorizeExpiredHolds: no expiring holds found");
      }
      break;
    }

    logger.info(`reauthorizeExpiredHolds: processing batch of ${snap.size} expiring hold(s)`);

    for (const doc of snap.docs) {
    const payment = doc.data() as {
      bookingId: string;
      tenantId: string;
      userId: string;
      currency: string;
      authorizedAmountMinor: number;
      stripePaymentIntentId: string | null;
      stripePaymentMethodId: string | null;
    };

    const { bookingId, tenantId, userId, currency, authorizedAmountMinor } = payment;

    try {
      // Load tenant Stripe account
      const connectAccount = await connectRepo.getAccount(tenantId);
      if (!connectAccount?.stripeAccountId || !connectAccount.chargesEnabled) {
        logger.warn("reauthorizeExpiredHolds: tenant not connected, skipping", { bookingId, tenantId });
        continue;
      }
      const stripeAccountId = connectAccount.stripeAccountId;

      // Load payment settings (cached per tenant)
      if (!settingsCache.has(tenantId)) {
        settingsCache.set(tenantId, await settingsRepo.getPaymentSettings(tenantId));
      }
      const settings = settingsCache.get(tenantId) ?? null;
      const platformFeeMinor = Math.round(
        authorizedAmountMinor * (settings?.platformFeePercent ?? 0.02),
      );

      // Load customer profile with saved payment method
      const profile = await customerRepo.getTenantCustomerProfile(userId, tenantId);
      const paymentMethodId = payment.stripePaymentMethodId ?? profile?.defaultPaymentMethodId;
      if (!profile?.stripeCustomerId || !paymentMethodId) {
        logger.warn("reauthorizeExpiredHolds: no saved payment method, skipping", { bookingId, tenantId });
        continue;
      }

      // Cancel the old hold (ignore errors — it may already be expired)
      if (payment.stripePaymentIntentId) {
        try {
          await stripe.cancelPaymentIntent(payment.stripePaymentIntentId, stripeAccountId);
        } catch (err) {
          logger.warn("reauthorizeExpiredHolds: cancelPaymentIntent failed — verifying PI status before proceeding", {
            bookingId, err,
          });
          // HIGH-F: Verify the old PI is truly inactive before creating a new hold to
          // prevent a double-hold if cancel failed for a transient reason.
          try {
            const existingPi = await stripe.retrievePaymentIntent(payment.stripePaymentIntentId, stripeAccountId);
            const safeStatuses = ["canceled", "requires_payment_method", "requires_confirmation"];
            if (!safeStatuses.includes(existingPi.status as string)) {
              logger.error("reauthorizeExpiredHolds: old PI still active, skipping to prevent double-hold", {
                bookingId, tenantId, piStatus: existingPi.status,
              });
              continue;
            }
          } catch (fetchErr) {
            logger.error("reauthorizeExpiredHolds: could not verify PI status, skipping", { bookingId, fetchErr });
            continue;
          }
        }
      }

      // Create new manual-capture PaymentIntent off-session (re-authorization hold)
      const newIntent = await stripe.createReauthorizationHold({
        amountMinor: authorizedAmountMinor,
        currency,
        customerId: profile.stripeCustomerId,
        paymentMethodId,
        applicationFeeMinor: platformFeeMinor,
        stripeAccount: stripeAccountId,
        idempotencyKey: `reauth-${bookingId}-${now.toISOString().slice(0, 10)}`,
        metadata: {
          bookingId,
          tenantId,
          userId,
          type: "reauthorization",
        },
      });

      // Update Firestore record
      await doc.ref.update({
        stripePaymentIntentId: newIntent.id,
        stripePaymentMethodId: paymentMethodId,
        authorizedAt: FieldValue.serverTimestamp(),
        stripeStatus: newIntent.status,
        notes: `Re-authorized ${now.toISOString().slice(0, 10)}`,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info("reauthorizeExpiredHolds: re-authorized hold", {
        bookingId,
        tenantId,
        newIntentId: newIntent.id,
      });
      totalProcessed++;
    } catch (err) {
      logger.error("reauthorizeExpiredHolds: failed to re-authorize", { bookingId, tenantId, err });
    }
  }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < 100) break;
  }

  if (totalProcessed > 0) {
    logger.info(`reauthorizeExpiredHolds: completed, processed ${totalProcessed} hold(s)`);
  }
}

// ---------------------------------------------------------------------------
// Scheduled trigger — runs daily at 03:00 UTC
// ---------------------------------------------------------------------------

export const reauthorizeExpiredHolds = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "UTC",
    region: "us-central1",
    secrets: [STRIPE_API_KEY],
  },
  async () => {
    await runReauthorizeExpiredHolds(new Date());
  },
);
