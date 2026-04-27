/**
 * functions/src/stripe/adminRepositories.ts (W13-DEBT-1)
 *
 * Admin-SDK Firestore adapters for the Stripe webhook handler.
 *
 * Collection layout (mirror of src/domains/* repositories):
 *   tenants/{tid}/billing/subscription
 *   tenants/{tid}/billingWebhookIdempotency/{eventId}
 *   tenants/{tid}/connect/account
 *   tenants/{tid}/connectWebhookIdempotency/{eventId}
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

import type { Subscription } from "./billingDispatcher.js";
import type { ConnectAccount } from "./connectDispatcher.js";

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export type AdminBillingRepository = {
  hasProcessedEvent(tenantId: string, eventId: string): Promise<boolean>;
  getSubscription(tenantId: string): Promise<Subscription | null>;
  saveSubscriptionWithIdempotency(
    subscription: Subscription,
    eventId: string,
  ): Promise<void>;
  recordProcessedEvent(tenantId: string, eventId: string): Promise<void>;
  resolveTenantBySubscriptionId(stripeSubscriptionId: string): Promise<string | null>;
  resolveTenantByCustomerId(stripeCustomerId: string): Promise<string | null>;
};

export function createAdminBillingRepository(db: Firestore): AdminBillingRepository {
  const subDoc = (tid: string) => db.doc(`tenants/${tid}/billing/subscription`);
  const idempDoc = (tid: string, eid: string) =>
    db.doc(`tenants/${tid}/billingWebhookIdempotency/${eid}`);

  return {
    async hasProcessedEvent(tenantId, eventId) {
      const snap = await idempDoc(tenantId, eventId).get();
      return snap.exists;
    },
    async getSubscription(tenantId) {
      const snap = await subDoc(tenantId).get();
      return snap.exists ? (snap.data() as Subscription) : null;
    },
    async saveSubscriptionWithIdempotency(subscription, eventId) {
      const batch = db.batch();
      batch.set(subDoc(subscription.tenantId), {
        ...subscription,
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.set(idempDoc(subscription.tenantId, eventId), {
        eventId,
        appliedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
    },
    async recordProcessedEvent(tenantId, eventId) {
      await idempDoc(tenantId, eventId).set({
        eventId,
        appliedAt: FieldValue.serverTimestamp(),
      });
    },
    async resolveTenantBySubscriptionId(stripeSubscriptionId) {
      const snap = await db
        .collectionGroup("billing")
        .where("stripeSubscriptionId", "==", stripeSubscriptionId)
        .limit(1)
        .get();
      if (snap.empty) return null;
      return (snap.docs[0]!.data() as Subscription).tenantId ?? null;
    },
    async resolveTenantByCustomerId(stripeCustomerId) {
      const snap = await db
        .collectionGroup("billing")
        .where("stripeCustomerId", "==", stripeCustomerId)
        .limit(1)
        .get();
      if (snap.empty) return null;
      return (snap.docs[0]!.data() as Subscription).tenantId ?? null;
    },
  };
}

// ---------------------------------------------------------------------------
// Connect
// ---------------------------------------------------------------------------

export type AdminConnectRepository = {
  hasProcessedEvent(tenantId: string, eventId: string): Promise<boolean>;
  getAccount(tenantId: string): Promise<ConnectAccount | null>;
  saveAccountWithIdempotency(
    account: ConnectAccount,
    eventId: string,
  ): Promise<void>;
  resolveTenantByAccountId(stripeAccountId: string): Promise<string | null>;
};

export function createAdminConnectRepository(db: Firestore): AdminConnectRepository {
  const accountDoc = (tid: string) => db.doc(`tenants/${tid}/connect/account`);
  const idempDoc = (tid: string, eid: string) =>
    db.doc(`tenants/${tid}/connectWebhookIdempotency/${eid}`);

  return {
    async hasProcessedEvent(tenantId, eventId) {
      const snap = await idempDoc(tenantId, eventId).get();
      return snap.exists;
    },
    async getAccount(tenantId) {
      const snap = await accountDoc(tenantId).get();
      return snap.exists ? (snap.data() as ConnectAccount) : null;
    },
    async saveAccountWithIdempotency(account, eventId) {
      const batch = db.batch();
      batch.set(accountDoc(account.tenantId), {
        ...account,
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.set(idempDoc(account.tenantId, eventId), {
        eventId,
        appliedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
    },
    async resolveTenantByAccountId(stripeAccountId) {
      const snap = await db
        .collectionGroup("connect")
        .where("stripeAccountId", "==", stripeAccountId)
        .limit(1)
        .get();
      if (snap.empty) return null;
      return (snap.docs[0]!.data() as ConnectAccount).tenantId ?? null;
    },
  };
}

// Re-export for convenience.
export type { Transaction };
