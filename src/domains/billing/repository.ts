/**
 * Billing repository
 *
 * Collection layout (all tenant-scoped):
 *   tenants/{tenantId}/billing/subscription                — singleton Subscription
 *   tenants/{tenantId}/billingWebhookIdempotency/{eventId} — applied Stripe event ids
 */

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

import type { Subscription } from "./model";

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const billingCol = (tenantId: string) => `tenants/${tenantId}/billing`;
const idempCol = (tenantId: string) => `tenants/${tenantId}/billingWebhookIdempotency`;
const SUBSCRIPTION_DOC = "subscription";

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export type WebhookIdempotencyRecord = {
  eventId: string;
  appliedAt: unknown;
};

export type BillingRepository = {
  getSubscription(tenantId: string): Promise<Subscription | null>;
  /**
   * Atomically write the subscription doc and the webhook-idempotency marker.
   * Used by `applyWebhookEvent` so we never persist a state change without
   * also recording the event id that produced it.
   */
  saveSubscriptionWithIdempotency(
    subscription: Subscription,
    eventId: string,
  ): Promise<void>;
  hasProcessedEvent(tenantId: string, eventId: string): Promise<boolean>;
  /**
   * Record that an event has been applied (without mutating the subscription).
   * Used for "no-op" events that pass idempotency but don't change state.
   */
  recordProcessedEvent(tenantId: string, eventId: string): Promise<void>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createBillingRepository(db: Firestore): BillingRepository {
  async function getSubscription(tenantId: string): Promise<Subscription | null> {
    const ref = doc(db, billingCol(tenantId), SUBSCRIPTION_DOC);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as Subscription;
  }

  async function saveSubscriptionWithIdempotency(
    subscription: Subscription,
    eventId: string,
  ): Promise<void> {
    const subRef = doc(db, billingCol(subscription.tenantId), SUBSCRIPTION_DOC);
    const idempRef = doc(db, idempCol(subscription.tenantId), eventId);
    const now = serverTimestamp();
    const batch = writeBatch(db);
    batch.set(subRef, { ...subscription, updatedAt: now });
    batch.set(idempRef, { eventId, appliedAt: now });
    await batch.commit();
  }

  async function hasProcessedEvent(tenantId: string, eventId: string): Promise<boolean> {
    const ref = doc(db, idempCol(tenantId), eventId);
    const snap = await getDoc(ref);
    return snap.exists();
  }

  async function recordProcessedEvent(tenantId: string, eventId: string): Promise<void> {
    const ref = doc(db, idempCol(tenantId), eventId);
    await setDoc(ref, { eventId, appliedAt: serverTimestamp() });
  }

  return {
    getSubscription,
    saveSubscriptionWithIdempotency,
    hasProcessedEvent,
    recordProcessedEvent,
  };
}
