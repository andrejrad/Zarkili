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

// ---------------------------------------------------------------------------
// Payment Settings
// ---------------------------------------------------------------------------

export type PaymentMode = "deposit" | "full" | "card_on_file";

export type TenantPaymentSettings = {
  tenantId: string;
  paymentsEnabled: boolean;
  paymentMode: PaymentMode;
  depositPercentage: number;   // 1–100; relevant when paymentMode=deposit
  currency: string;            // e.g. "usd"
  platformFeePercent: number;  // e.g. 0.02
  cancellationPolicy: boolean;
  cancellationHours: number;
  cancellationCharge: "deposit" | "custom";
  cancellationAmountMinor: number; // cents; relevant when cancellationCharge=custom
};

export type AdminPaymentSettingsRepository = {
  getPaymentSettings(tenantId: string): Promise<TenantPaymentSettings | null>;
  savePaymentSettings(settings: TenantPaymentSettings): Promise<void>;
};

export function createAdminPaymentSettingsRepository(db: Firestore): AdminPaymentSettingsRepository {
  const settingsDoc = (tid: string) => db.doc(`tenants/${tid}/paymentSettings/config`);

  return {
    async getPaymentSettings(tenantId) {
      const snap = await settingsDoc(tenantId).get();
      return snap.exists ? (snap.data() as TenantPaymentSettings) : null;
    },
    async savePaymentSettings(settings) {
      await settingsDoc(settings.tenantId).set(
        { ...settings, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Appointment Payments
// ---------------------------------------------------------------------------

export type AppointmentPaymentStatus =
  | "pending"
  | "authorized"
  | "capture_in_progress"
  | "captured"
  | "cancelled"
  | "refunded"
  | "paid_in_person"
  | "failed";

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
  /** Payment method used to authorize the hold (saved for re-authorization). */
  stripePaymentMethodId: string | null;
  status: AppointmentPaymentStatus;
  stripeStatus: string | null;
  notes: string | null;
  /** Server timestamp set when status transitions to "authorized". Used to detect 7-day expiry. */
  authorizedAt: ReturnType<typeof FieldValue.serverTimestamp> | null;
};

export type AdminAppointmentPaymentsRepository = {
  getAppointmentPayment(tenantId: string, bookingId: string): Promise<AppointmentPayment | null>;
  createAppointmentPayment(payment: AppointmentPayment): Promise<void>;
  updateAppointmentPayment(
    tenantId: string,
    bookingId: string,
    update: Partial<AppointmentPayment>,
  ): Promise<void>;
  updateByPaymentIntentId(
    tenantId: string,
    stripePaymentIntentId: string,
    update: Partial<AppointmentPayment>,
  ): Promise<void>;
};

export function createAdminAppointmentPaymentsRepository(db: Firestore): AdminAppointmentPaymentsRepository {
  const paymentDoc = (tid: string, bookingId: string) =>
    db.doc(`tenants/${tid}/appointmentPayments/${bookingId}`);

  return {
    async getAppointmentPayment(tenantId, bookingId) {
      const snap = await paymentDoc(tenantId, bookingId).get();
      return snap.exists ? (snap.data() as AppointmentPayment) : null;
    },
    async createAppointmentPayment(payment) {
      await paymentDoc(payment.tenantId, payment.bookingId).set({
        ...payment,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    },
    async updateAppointmentPayment(tenantId, bookingId, update) {
      await paymentDoc(tenantId, bookingId).update({
        ...update,
        updatedAt: FieldValue.serverTimestamp(),
      });
    },
    async updateByPaymentIntentId(tenantId, stripePaymentIntentId, update) {
      const snap = await db
        .collection(`tenants/${tenantId}/appointmentPayments`)
        .where("stripePaymentIntentId", "==", stripePaymentIntentId)
        .limit(1)
        .get();
      if (snap.empty) return;
      await snap.docs[0].ref.update({
        ...update,
        updatedAt: FieldValue.serverTimestamp(),
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Per-tenant Stripe customer profiles
// ---------------------------------------------------------------------------

export type TenantCustomerProfile = {
  tenantId: string;
  userId: string;
  stripeCustomerId: string;
  defaultPaymentMethodId: string | null;
};

export type AdminTenantCustomerRepository = {
  getTenantCustomerProfile(userId: string, tenantId: string): Promise<TenantCustomerProfile | null>;
  saveTenantCustomerProfile(profile: TenantCustomerProfile): Promise<void>;
  updateDefaultPaymentMethod(userId: string, tenantId: string, methodId: string): Promise<void>;
};

export function createAdminTenantCustomerRepository(db: Firestore): AdminTenantCustomerRepository {
  const profileDoc = (uid: string, tid: string) =>
    db.doc(`clients/${uid}/tenantPaymentProfiles/${tid}`);

  return {
    async getTenantCustomerProfile(userId, tenantId) {
      const snap = await profileDoc(userId, tenantId).get();
      return snap.exists ? (snap.data() as TenantCustomerProfile) : null;
    },
    async saveTenantCustomerProfile(profile) {
      await profileDoc(profile.userId, profile.tenantId).set(
        { ...profile, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    },
    async updateDefaultPaymentMethod(userId, tenantId, methodId) {
      await profileDoc(userId, tenantId).update({
        defaultPaymentMethodId: methodId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    },
  };
}
