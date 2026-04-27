/**
 * functions/src/stripeTaxCalculate.ts (W18-DEBT-1)
 *
 * Tenant-scoped onCall callable that wraps `POST /v1/tax/calculations`.
 *
 * Flow:
 *   1. RBAC gate (tenant_admin or platform_admin only).
 *   2. Cache lookup at `tenants/{tid}/taxCalculations/{quoteId}` — return if
 *      `cacheExpiresAt > now`. (Same TTL semantics as `createLocalTaxProvider`.)
 *   3. Map the TaxQuote → Stripe form params, call the API client, map response.
 *   4. Persist with TTL stamp and return.
 *
 * Pure handler `runStripeTaxCalculate` accepts injected ports for tests:
 *   - `repo` — admin-SDK Firestore adapter (read/write the cache doc)
 *   - `stripe` — `StripeTaxApiClient` port
 *   - `now` — clock factory
 *
 * Secrets:
 *   - STRIPE_API_KEY (required)
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";

import {
  buildStripeTaxRequestParams,
  createStripeTaxApiClient,
  DEFAULT_TAX_CACHE_TTL_SECONDS,
  mapStripeTaxResponseToCalculation,
  type LocalTimestamp,
  type StripeTaxApiClient,
  type TaxCalculation,
  type TaxQuote,
} from "./stripe/taxAdapter.js";

if (getApps().length === 0) {
  initializeApp();
}

const STRIPE_API_KEY = defineSecret("STRIPE_API_KEY");

const PLATFORM_TENANT = "__platform__";

// ---------------------------------------------------------------------------
// Cache repository (admin SDK)
// ---------------------------------------------------------------------------

export type TaxCacheRepo = {
  get(tenantId: string | null, quoteId: string): Promise<TaxCalculation | null>;
  save(tenantId: string | null, calc: TaxCalculation): Promise<void>;
};

function cachePath(tenantId: string | null): string {
  return tenantId
    ? `tenants/${tenantId}/taxCalculations`
    : `platform/${PLATFORM_TENANT}/taxCalculations`;
}

export function createAdminTaxCacheRepo(db: Firestore): TaxCacheRepo {
  return {
    async get(tenantId, quoteId) {
      const ref = db.doc(`${cachePath(tenantId)}/${quoteId}`);
      const snap = await ref.get();
      if (!snap.exists) return null;
      return snap.data() as TaxCalculation;
    },
    async save(tenantId, calc) {
      const ref = db.doc(`${cachePath(tenantId)}/${calc.quoteId}`);
      await ref.set(calc);
    },
  };
}

// ---------------------------------------------------------------------------
// Pure handler
// ---------------------------------------------------------------------------

export type StripeTaxCalculateDeps = {
  repo: TaxCacheRepo;
  stripe: StripeTaxApiClient;
  now: () => LocalTimestamp;
  ttlSeconds?: number;
};

export type StripeTaxCalculateResult = {
  calculation: TaxCalculation;
  source: "cache" | "stripe";
};

export async function runStripeTaxCalculate(
  quote: TaxQuote,
  deps: StripeTaxCalculateDeps,
): Promise<StripeTaxCalculateResult> {
  if (!quote.quoteId || !quote.quoteId.trim()) {
    throw new HttpsError("invalid-argument", "quote.quoteId is required");
  }
  if (!quote.items || quote.items.length === 0) {
    throw new HttpsError("invalid-argument", "quote must contain at least one line item");
  }

  const cached = await deps.repo.get(quote.seller.tenantId, quote.quoteId);
  const ts = deps.now();
  if (cached && cached.cacheExpiresAt.seconds > ts.seconds) {
    return { calculation: cached, source: "cache" };
  }

  const formParams = buildStripeTaxRequestParams(quote);
  const response = await deps.stripe.createCalculation(formParams);
  const fresh = mapStripeTaxResponseToCalculation(
    quote,
    response,
    ts,
    deps.ttlSeconds ?? DEFAULT_TAX_CACHE_TTL_SECONDS,
  );
  await deps.repo.save(quote.seller.tenantId, fresh);
  return { calculation: fresh, source: "stripe" };
}

// ---------------------------------------------------------------------------
// RBAC + payload parsing
// ---------------------------------------------------------------------------

function assertCallerCanQuote(
  request: CallableRequest<unknown>,
  quote: TaxQuote,
): void {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError("unauthenticated", "Authentication is required");
  }
  const role = auth.token.role;
  if (role !== "tenant_admin" && role !== "platform_admin") {
    throw new HttpsError(
      "permission-denied",
      "tenant_admin or platform_admin role is required",
    );
  }
  // Platform-tenant quotes (tenantId=null, e.g. SaaS subscription invoices)
  // are restricted to platform_admin.
  if (quote.seller.tenantId === null && role !== "platform_admin") {
    throw new HttpsError(
      "permission-denied",
      "platform_admin role is required for platform-scoped tax quotes",
    );
  }
  // tenant_admin must match the seller tenant.
  if (role === "tenant_admin" && quote.seller.tenantId !== null) {
    const claimedTenant = auth.token.tenantId as string | undefined;
    if (!claimedTenant || claimedTenant !== quote.seller.tenantId) {
      throw new HttpsError(
        "permission-denied",
        "tenant_admin may only request tax quotes for their own tenant",
      );
    }
  }
}

function parseTaxQuotePayload(data: unknown): TaxQuote {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Payload must be a TaxQuote object");
  }
  const obj = data as { quote?: unknown };
  const quote = obj.quote;
  if (!quote || typeof quote !== "object") {
    throw new HttpsError("invalid-argument", "Payload must include a `quote` field");
  }
  const q = quote as Partial<TaxQuote>;
  if (!q.quoteId || typeof q.quoteId !== "string") {
    throw new HttpsError("invalid-argument", "quote.quoteId is required");
  }
  if (!q.context || (q.context !== "saas_subscription" && q.context !== "salon_payment")) {
    throw new HttpsError("invalid-argument", "quote.context must be saas_subscription or salon_payment");
  }
  if (!q.buyer || !q.seller || !Array.isArray(q.items) || q.items.length === 0) {
    throw new HttpsError("invalid-argument", "quote.buyer, quote.seller, and a non-empty quote.items[] are required");
  }
  return quote as TaxQuote;
}

// ---------------------------------------------------------------------------
// onCall handler
// ---------------------------------------------------------------------------

function defaultNow(): LocalTimestamp {
  return { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
}

export const stripeTaxCalculate = onCall(
  { secrets: [STRIPE_API_KEY] },
  async (request) => {
    const quote = parseTaxQuotePayload(request.data);
    assertCallerCanQuote(request, quote);

    const apiKey = STRIPE_API_KEY.value();
    const result = await runStripeTaxCalculate(quote, {
      repo: createAdminTaxCacheRepo(getFirestore()),
      stripe: createStripeTaxApiClient(apiKey),
      now: defaultNow,
    });
    return result;
  },
);
