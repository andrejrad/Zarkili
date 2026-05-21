/**
 * functions/src/stripeConnectCallable.ts
 *
 * Stripe Connect onboarding for salon (tenant) accounts:
 *
 *   stripeConnectOnboard       — Create Express account + return onboarding URL
 *   stripeConnectDashboardLink — Return Express dashboard login link
 *
 * Connect account doc: tenants/{tenantId}/connect/account
 *
 * Secrets: STRIPE_API_KEY
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

import { createStripePaymentsApiClient } from "./stripe/paymentsAdapter.js";
import { createAdminConnectRepository } from "./stripe/adminRepositories.js";

if (getApps().length === 0) {
  initializeApp();
}

const STRIPE_API_KEY = defineSecret("STRIPE_API_KEY");

// ---------------------------------------------------------------------------
// Security helper
// ---------------------------------------------------------------------------

async function assertTenantOwner(uid: string, tenantId: string): Promise<void> {
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
    throw new HttpsError("permission-denied", "Only tenant owners/admins may manage Stripe Connect.");
  }
}

// ---------------------------------------------------------------------------
// stripeConnectOnboard
// ---------------------------------------------------------------------------

export const stripeConnectOnboard = onCall(
  {
    region: "us-central1",
    secrets: [STRIPE_API_KEY],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const input = request.data as {
      tenantId?: string;
      country?: string;
      returnUrl?: string;
      refreshUrl?: string;
    };

    if (!input.tenantId) throw new HttpsError("invalid-argument", "tenantId required.");
    if (!input.returnUrl) throw new HttpsError("invalid-argument", "returnUrl required.");
    if (!input.refreshUrl) throw new HttpsError("invalid-argument", "refreshUrl required.");

    await assertTenantOwner(request.auth.uid, input.tenantId);

    const stripe = createStripePaymentsApiClient(STRIPE_API_KEY.value());
    const db = getFirestore();
    const connectRepo = createAdminConnectRepository(db);

    // If account already exists, just return a fresh onboarding link
    const existing = await connectRepo.getAccount(input.tenantId);
    let stripeAccountId = existing?.stripeAccountId ?? null;

    if (!stripeAccountId) {
      const account = await stripe.createConnectAccount({
        country: input.country ?? "US",
      });
      stripeAccountId = account.id;

      // Write stub connect/account doc so webhook dispatcher can resolve tenant
      await db.doc(`tenants/${input.tenantId}/connect/account`).set(
        {
          tenantId: input.tenantId,
          stripeAccountId,
          accountType: "express",
          country: input.country ?? "US",
          status: "pending_verification",
          payoutsEnabled: false,
          chargesEnabled: false,
          detailsSubmitted: false,
          taxFormType: null,
          taxFormCapturedAt: null,
          eligible1099K: false,
          lastPayoutFailureAt: null,
          lastPayoutFailureReason: null,
          restrictionReasons: [],
          lastEventId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      );
    }

    const accountLink = await stripe.createAccountLink({
      accountId: stripeAccountId,
      returnUrl: input.returnUrl,
      refreshUrl: input.refreshUrl,
    });

    return {
      stripeAccountId,
      onboardingUrl: accountLink.url,
    };
  },
);

// ---------------------------------------------------------------------------
// stripeConnectDashboardLink
// ---------------------------------------------------------------------------

export const stripeConnectDashboardLink = onCall(
  {
    region: "us-central1",
    secrets: [STRIPE_API_KEY],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const input = request.data as { tenantId?: string };
    if (!input.tenantId) throw new HttpsError("invalid-argument", "tenantId required.");

    await assertTenantOwner(request.auth.uid, input.tenantId);

    const db = getFirestore();
    const connectRepo = createAdminConnectRepository(db);
    const account = await connectRepo.getAccount(input.tenantId);

    if (!account?.stripeAccountId) {
      throw new HttpsError("not-found", "No Stripe Connect account found for this tenant.");
    }

    const stripe = createStripePaymentsApiClient(STRIPE_API_KEY.value());
    const loginLink = await stripe.createLoginLink(account.stripeAccountId);

    return { dashboardUrl: loginLink.url };
  },
);
