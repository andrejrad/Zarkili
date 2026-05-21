/**
 * functions/src/paymentSettingsCallable.ts
 *
 * Tenant payment settings CRUD — callable Cloud Functions:
 *
 *   getPaymentSettings    — read settings for a tenant (any authenticated user with tenant access)
 *   updatePaymentSettings — write settings (tenant owner/admin only, validated server-side)
 *
 * Firestore path: tenants/{tenantId}/paymentSettings/config
 *
 * Secrets: STRIPE_API_KEY (not used here — settings are pure Firestore)
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import {
  createAdminPaymentSettingsRepository,
  createAdminAppointmentPaymentsRepository,
  type TenantPaymentSettings,
  type PaymentMode,
} from "./stripe/adminRepositories.js";

if (getApps().length === 0) {
  initializeApp();
}

// ---------------------------------------------------------------------------
// Security helper
// ---------------------------------------------------------------------------

async function assertTenantAdmin(uid: string, tenantId: string): Promise<void> {
  const db = getFirestore();
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
    throw new HttpsError("permission-denied", "Only tenant owners/admins may update payment settings.");
  }
}

// ---------------------------------------------------------------------------
// getPaymentSettings
// ---------------------------------------------------------------------------

export const getPaymentSettings = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const input = request.data as { tenantId?: string };
    if (!input.tenantId) {
      throw new HttpsError("invalid-argument", "tenantId required.");
    }

    const repo = createAdminPaymentSettingsRepository(getFirestore());
    const settings = await repo.getPaymentSettings(input.tenantId);

    // Return defaults if no doc yet
    if (!settings) {
      const defaults: TenantPaymentSettings = {
        tenantId: input.tenantId,
        paymentsEnabled: false,
        paymentMode: "full",
        depositPercentage: 30,
        currency: "usd",
        platformFeePercent: 0.02,
        cancellationPolicy: false,
        cancellationHours: 24,
        cancellationCharge: "deposit",
        cancellationAmountMinor: 0,
      };
      return defaults;
    }

    return settings;
  },
);

// ---------------------------------------------------------------------------
// updatePaymentSettings
// ---------------------------------------------------------------------------

type UpdatePaymentSettingsInput = {
  tenantId: string;
  paymentsEnabled?: boolean;
  paymentMode?: PaymentMode;
  depositPercentage?: number;
  currency?: string;
  platformFeePercent?: number;
  cancellationPolicy?: boolean;
  cancellationHours?: number;
  cancellationCharge?: "deposit" | "custom";
  cancellationAmountMinor?: number;
};

export const updatePaymentSettings = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const input = request.data as UpdatePaymentSettingsInput;
    if (!input.tenantId) {
      throw new HttpsError("invalid-argument", "tenantId required.");
    }

    await assertTenantAdmin(request.auth.uid, input.tenantId);

    // Validate deposit_percentage
    if (
      input.paymentMode === "deposit" &&
      (input.depositPercentage === undefined ||
        input.depositPercentage < 1 ||
        input.depositPercentage > 100)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "depositPercentage must be between 1 and 100 when paymentMode is 'deposit'.",
      );
    }

    const repo = createAdminPaymentSettingsRepository(getFirestore());
    const existing = (await repo.getPaymentSettings(input.tenantId)) ?? {
      tenantId: input.tenantId,
      paymentsEnabled: false,
      paymentMode: "full" as PaymentMode,
      depositPercentage: 30,
      currency: "usd",
      platformFeePercent: 0.02,
      cancellationPolicy: false,
      cancellationHours: 24,
      cancellationCharge: "deposit" as const,
      cancellationAmountMinor: 0,
    };

    const updated: TenantPaymentSettings = {
      ...existing,
      ...(input.paymentsEnabled !== undefined && { paymentsEnabled: input.paymentsEnabled }),
      ...(input.paymentMode !== undefined && { paymentMode: input.paymentMode }),
      ...(input.depositPercentage !== undefined && { depositPercentage: input.depositPercentage }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.platformFeePercent !== undefined && { platformFeePercent: input.platformFeePercent }),
      ...(input.cancellationPolicy !== undefined && { cancellationPolicy: input.cancellationPolicy }),
      ...(input.cancellationHours !== undefined && { cancellationHours: input.cancellationHours }),
      ...(input.cancellationCharge !== undefined && { cancellationCharge: input.cancellationCharge }),
      ...(input.cancellationAmountMinor !== undefined && { cancellationAmountMinor: input.cancellationAmountMinor }),
    };

    await repo.savePaymentSettings(updated);
    return updated;
  },
);

// ---------------------------------------------------------------------------
// getPaymentSummary
// ---------------------------------------------------------------------------

export const getPaymentSummary = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const input = request.data as { tenantId?: string; bookingId?: string };
    if (!input.tenantId) throw new HttpsError("invalid-argument", "tenantId required.");
    if (!input.bookingId) throw new HttpsError("invalid-argument", "bookingId required.");

    await assertTenantAdmin(request.auth.uid, input.tenantId);

    const db = getFirestore();
    const repo = createAdminAppointmentPaymentsRepository(db);
    const payment = await repo.getAppointmentPayment(input.tenantId, input.bookingId);

    if (!payment) {
      throw new HttpsError("not-found", "No payment record found for this booking.");
    }

    return payment;
  },
);
