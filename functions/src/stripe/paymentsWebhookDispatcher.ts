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
  ): Promise<void>;
};

export function createAdminPaymentsRepository(db: Firestore): AdminPaymentsRepository {
  return {
    async hasProcessedEvent(scopeId, eventId) {
      const ref = db.doc(`clients/${scopeId}/paymentsWebhookIdempotency/${eventId}`);
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
      if (snap.empty) return; // Charge not yet written or wrong tenant; skip silently

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

    async writeRefund(tenantId, stripeRefundId, status, failureCode) {
      await db.doc(`tenants/${tenantId}/refunds/${stripeRefundId}`).set(
        {
          status,
          failureCode: failureCode ?? null,
          processedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
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
      return { outcome: "applied" };
    }

    case "payment_method.detached": {
      const d = event.methodDetached;
      if (!d || !d.userId) return { outcome: "ignored" };
      if (await deps.payments.hasProcessedEvent(d.userId, event.id)) {
        return { outcome: "duplicate" };
      }
      await deps.payments.deletePaymentMethod(d.userId, d.methodId);
      return { outcome: "applied" };
    }

    case "payment_intent.succeeded": {
      const d = event.paymentIntent;
      if (!d || !d.tenantId) return { outcome: "ignored" };
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
      await deps.payments.writeRefund(d.tenantId, d.stripeRefundId, "issued", null);
      return { outcome: "applied" };
    }

    default:
      return { outcome: "ignored" };
  }
}
