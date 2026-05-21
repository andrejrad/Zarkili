/**
 * functions/src/stripe/paymentsWebhookDispatcher.ts (W24-DEBT-2)
 *
 * Handles payment_method.* and payment_intent.* Stripe webhook events.
 * Keeps Firestore paymentMethods + charges docs in sync with async Stripe
 * state changes.
 */

import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

import type { ParsedPaymentEvent } from "./parseEvent.js";

// ---------------------------------------------------------------------------
// Admin repository
// ---------------------------------------------------------------------------

export type AdminPaymentsRepository = {
  hasProcessedEvent(scopeId: string, eventId: string): Promise<boolean>;
  markPaymentMethodEventProcessed(userId: string, eventId: string): Promise<void>;
  hasProcessedTenantEvent(tenantId: string, eventId: string): Promise<boolean>;
  upsertPaymentMethod(
    userId: string,
    methodId: string,
    data: Record<string, unknown>,
  ): Promise<void>;
  deletePaymentMethod(userId: string, methodId: string): Promise<void>;
  updateChargeByIntentId(
    tenantId: string,
    stripePaymentIntentId: string,
    status: "captured" | "failed",
    failureCode: string | null,
    failureMessage: string | null,
    eventId: string,
  ): Promise<void>;
  writeRefund(
    tenantId: string,
    stripeRefundId: string,
    status: "issued" | "denied",
    failureCode: string | null,
    eventId: string,
  ): Promise<void>;
  updateAppointmentPaymentByIntentId(
    tenantId: string,
    stripePaymentIntentId: string,
    status: "authorized" | "cancelled",
    paymentMethodId: string | undefined,
    eventId: string,
  ): Promise<void>;
  handleSetupIntentSucceeded(
    tenantId: string,
    bookingId: string,
    userId: string,
    paymentMethodId: string,
    eventId: string,
  ): Promise<void>;
};

export function createAdminPaymentsRepository(db: Firestore): AdminPaymentsRepository {
  return {
    async hasProcessedEvent(scopeId, eventId) {
      const ref = db.doc(`clients/${scopeId}/paymentsWebhookIdempotency/${eventId}`);
      return (await ref.get()).exists;
    },

    async markPaymentMethodEventProcessed(userId, eventId) {
      await db.doc(`clients/${userId}/paymentsWebhookIdempotency/${eventId}`).set({
        eventId,
        appliedAt: FieldValue.serverTimestamp(),
      });
    },

    async hasProcessedTenantEvent(tenantId, eventId) {
      const ref = db.doc(`tenants/${tenantId}/paymentsWebhookIdempotency/${eventId}`);
      return (await ref.get()).exists;
    },

    async upsertPaymentMethod(userId, methodId, data) {
      await db
        .doc(`clients/${userId}/paymentMethods/${methodId}`)
        .set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    },

    async deletePaymentMethod(userId, methodId) {
      await db.doc(`clients/${userId}/paymentMethods/${methodId}`).delete();
    },

    async updateChargeByIntentId(tenantId, stripePaymentIntentId, status, failureCode, failureMessage, eventId) {
      const snap = await db
        .collection(`tenants/${tenantId}/charges`)
        .where("stripePaymentIntentId", "==", stripePaymentIntentId)
        .limit(1)
        .get();
      if (snap.empty) {
        // The PI may belong to an appointment payment (deposit/full mode) rather than
        // a standard platform charge. In that case the status is already managed by
        // the captureBookingPayment callable directly. Write the idempotency record
        // so duplicate events are deduplicated and return cleanly — do NOT throw,
        // which would cause Stripe to retry the webhook indefinitely.
        await db.doc(`tenants/${tenantId}/paymentsWebhookIdempotency/${eventId}`).set({
          eventId,
          appliedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      const chargeRef = snap.docs[0].ref;
      const batch = db.batch();
      batch.update(chargeRef, {
        status,
        failureCode: failureCode ?? null,
        failureMessage: failureMessage ?? null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      // Idempotency record scoped to the tenant
      batch.set(db.doc(`tenants/${tenantId}/paymentsWebhookIdempotency/${eventId}`), {
        eventId,
        appliedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
    },

    async writeRefund(tenantId, stripeRefundId, status, failureCode, eventId) {
      const batch = db.batch();
      batch.set(
        db.doc(`tenants/${tenantId}/refunds/${stripeRefundId}`),
        {
          status,
          failureCode: failureCode ?? null,
          processedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      batch.set(db.doc(`tenants/${tenantId}/paymentsWebhookIdempotency/${eventId}`), {
        eventId,
        appliedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
    },

    async updateAppointmentPaymentByIntentId(tenantId, stripePaymentIntentId, status, paymentMethodId, eventId) {
      const snap = await db
        .collection(`tenants/${tenantId}/appointmentPayments`)
        .where("stripePaymentIntentId", "==", stripePaymentIntentId)
        .limit(1)
        .get();
      if (snap.empty) return;
      const batch = db.batch();
      batch.update(snap.docs[0].ref, {
        status,
        ...(status === "authorized" && {
          authorizedAt: FieldValue.serverTimestamp(),
          ...(paymentMethodId ? { stripePaymentMethodId: paymentMethodId } : {}),
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.set(db.doc(`tenants/${tenantId}/paymentsWebhookIdempotency/${eventId}`), {
        eventId,
        appliedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
    },

    async handleSetupIntentSucceeded(tenantId, bookingId, userId, paymentMethodId, eventId) {
      const batch = db.batch();
      // Save default payment method on the tenant customer profile
      batch.set(
        db.doc(`clients/${userId}/tenantPaymentProfiles/${tenantId}`),
        { defaultPaymentMethodId: paymentMethodId, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
      // Update appointment payment status to authorized
      batch.update(
        db.doc(`tenants/${tenantId}/appointmentPayments/${bookingId}`),
        {
          status: "authorized",
          stripeStatus: "succeeded",
          authorizedAt: FieldValue.serverTimestamp(),
          stripePaymentMethodId: paymentMethodId,
          updatedAt: FieldValue.serverTimestamp(),
        },
      );
      // Idempotency record
      batch.set(db.doc(`tenants/${tenantId}/paymentsWebhookIdempotency/${eventId}`), {
        eventId,
        appliedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
    },
  };
}

// ---------------------------------------------------------------------------
// Pure dispatcher
// ---------------------------------------------------------------------------

export async function applyPaymentEvent(
  event: ParsedPaymentEvent,
  deps: { payments: AdminPaymentsRepository },
): Promise<{ outcome: "applied" | "duplicate" | "ignored" }> {
  switch (event.type) {
    case "payment_method.attached": {
      const d = event.methodAttached;
      if (!d || !d.userId) return { outcome: "ignored" };
      if (await deps.payments.hasProcessedEvent(d.userId, event.id)) {
        return { outcome: "duplicate" };
      }
      await deps.payments.upsertPaymentMethod(d.userId, d.methodId, d.methodData);
      await deps.payments.markPaymentMethodEventProcessed(d.userId, event.id);
      return { outcome: "applied" };
    }

    case "payment_method.detached": {
      const d = event.methodDetached;
      if (!d || !d.userId) return { outcome: "ignored" };
      if (await deps.payments.hasProcessedEvent(d.userId, event.id)) {
        return { outcome: "duplicate" };
      }
      await deps.payments.deletePaymentMethod(d.userId, d.methodId);
      await deps.payments.markPaymentMethodEventProcessed(d.userId, event.id);
      return { outcome: "applied" };
    }

    case "payment_intent.succeeded": {
      const d = event.paymentIntent;
      if (!d || !d.tenantId) return { outcome: "ignored" };
      if (await deps.payments.hasProcessedTenantEvent(d.tenantId, event.id)) {
        return { outcome: "duplicate" };
      }
      await deps.payments.updateChargeByIntentId(
        d.tenantId,
        d.stripePaymentIntentId,
        "captured",
        null,
        null,
        event.id,
      );
      return { outcome: "applied" };
    }

    case "payment_intent.payment_failed": {
      const d = event.paymentIntent;
      if (!d || !d.tenantId) return { outcome: "ignored" };
      if (await deps.payments.hasProcessedTenantEvent(d.tenantId, event.id)) {
        return { outcome: "duplicate" };
      }
      await deps.payments.updateChargeByIntentId(
        d.tenantId,
        d.stripePaymentIntentId,
        "failed",
        d.failureCode,
        d.failureMessage,
        event.id,
      );
      return { outcome: "applied" };
    }

    case "charge.refunded": {
      const d = event.chargeRefunded;
      if (!d || !d.tenantId || !d.stripeRefundId) return { outcome: "ignored" };
      if (await deps.payments.hasProcessedTenantEvent(d.tenantId, event.id)) {
        return { outcome: "duplicate" };
      }
      await deps.payments.writeRefund(d.tenantId, d.stripeRefundId, "issued", null, event.id);
      return { outcome: "applied" };
    }

    case "charge.refund.updated": {
      const d = event.chargeRefundDenied;
      if (!d || !d.tenantId || !d.stripeRefundId) return { outcome: "ignored" };
      if (await deps.payments.hasProcessedTenantEvent(d.tenantId, event.id)) {
        return { outcome: "duplicate" };
      }
      await deps.payments.writeRefund(d.tenantId, d.stripeRefundId, "denied", d.failureCode, event.id);
      return { outcome: "applied" };
    }

    case "payment_intent.amount_capturable_updated": {
      const d = event.paymentIntent;
      if (!d || !d.tenantId) return { outcome: "ignored" };
      if (await deps.payments.hasProcessedTenantEvent(d.tenantId, event.id)) {
        return { outcome: "duplicate" };
      }
      await deps.payments.updateAppointmentPaymentByIntentId(
        d.tenantId,
        d.stripePaymentIntentId,
        "authorized",
        d.paymentMethodId,
        event.id,
      );
      return { outcome: "applied" };
    }

    case "payment_intent.canceled": {
      const d = event.paymentIntent;
      if (!d || !d.tenantId) return { outcome: "ignored" };
      await deps.payments.updateAppointmentPaymentByIntentId(
        d.tenantId,
        d.stripePaymentIntentId,
        "cancelled",
        undefined,
        event.id,
      );
      return { outcome: "applied" };
    }

    case "setup_intent.succeeded": {
      const d = event.setupIntentSucceeded;
      if (!d || !d.tenantId || !d.bookingId || !d.userId || !d.paymentMethodId) {
        return { outcome: "ignored" };
      }
      if (await deps.payments.hasProcessedTenantEvent(d.tenantId, event.id)) {
        return { outcome: "duplicate" };
      }
      await deps.payments.handleSetupIntentSucceeded(
        d.tenantId,
        d.bookingId,
        d.userId,
        d.paymentMethodId,
        event.id,
      );
      return { outcome: "applied" };
    }

    default:
      return { outcome: "ignored" };
  }
}
