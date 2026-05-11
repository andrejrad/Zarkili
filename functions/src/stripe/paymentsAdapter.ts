/**
 * functions/src/stripe/paymentsAdapter.ts (W24-DEBT-2)
 *
 * Pure Stripe Payments API adapter using `fetch` — no Stripe SDK.
 * Follows the same pattern as taxAdapter.ts: typed port + real fetch impl.
 *
 * Operations:
 *   - createCustomer         POST /v1/customers
 *   - attachPaymentMethod    POST /v1/payment_methods/{id}/attach
 *   - detachPaymentMethod    POST /v1/payment_methods/{id}/detach
 *   - createAndConfirmPaymentIntent  POST /v1/payment_intents (confirm=true)
 */

const STRIPE_BASE = "https://api.stripe.com/v1";

// ---------------------------------------------------------------------------
// Response types (minimal Stripe surface we depend on)
// ---------------------------------------------------------------------------

export type StripeCardDetails = {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
};

export type StripeBillingDetails = {
  name: string | null;
};

export type StripePaymentMethodResponse = {
  id: string;
  type: string;
  card?: StripeCardDetails;
  billing_details?: StripeBillingDetails;
};

export type StripePaymentIntentResponse = {
  id: string;
  status: string;
  last_payment_error?: {
    code?: string;
    decline_code?: string;
    message?: string;
  } | null;
};

export type StripeCustomerResponse = {
  id: string;
};

export type StripeRefundResponse = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  reason: string | null;
};

// ---------------------------------------------------------------------------
// Port — injected in tests as a stub
// ---------------------------------------------------------------------------

export type StripePaymentsApiClient = {
  createCustomer(userId: string, email: string | null): Promise<StripeCustomerResponse>;
  attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<StripePaymentMethodResponse>;
  detachPaymentMethod(paymentMethodId: string): Promise<void>;
  createAndConfirmPaymentIntent(params: {
    amountMinor: number;
    currency: string;
    customerId: string;
    paymentMethodId: string;
    idempotencyKey: string;
    metadata: Record<string, string>;
  }): Promise<StripePaymentIntentResponse>;
  createRefund(
    paymentIntentId: string,
    amountMinor?: number,
  ): Promise<StripeRefundResponse>;
};

// ---------------------------------------------------------------------------
// Internal HTTP helpers
// ---------------------------------------------------------------------------

async function stripePost(
  path: string,
  params: Record<string, string>,
  apiKey: string,
  idempotencyKey?: string,
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    method: "POST",
    headers,
    body: new URLSearchParams(params).toString(),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = (data.error as { message?: string; code?: string } | undefined) ?? {};
    throw new Error(
      `Stripe error [${res.status}] ${err.code ?? "unknown"}: ${err.message ?? "no message"}`,
    );
  }
  return data;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createStripePaymentsApiClient(apiKey: string): StripePaymentsApiClient {
  return {
    async createCustomer(userId, email) {
      const params: Record<string, string> = { "metadata[userId]": userId };
      if (email) params.email = email;
      return (await stripePost("/customers", params, apiKey)) as StripeCustomerResponse;
    },

    async attachPaymentMethod(paymentMethodId, customerId) {
      return (await stripePost(
        `/payment_methods/${paymentMethodId}/attach`,
        { customer: customerId },
        apiKey,
      )) as StripePaymentMethodResponse;
    },

    async detachPaymentMethod(paymentMethodId) {
      await stripePost(`/payment_methods/${paymentMethodId}/detach`, {}, apiKey);
    },

    async createAndConfirmPaymentIntent({
      amountMinor,
      currency,
      customerId,
      paymentMethodId,
      idempotencyKey,
      metadata,
    }) {
      const params: Record<string, string> = {
        amount: String(amountMinor),
        currency: currency.toLowerCase(),
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: "true",
        "automatic_payment_methods[enabled]": "false",
      };
      for (const [k, v] of Object.entries(metadata)) {
        params[`metadata[${k}]`] = v;
      }
      return (await stripePost(
        "/payment_intents",
        params,
        apiKey,
        idempotencyKey,
      )) as StripePaymentIntentResponse;
    },

    async createRefund(paymentIntentId, amountMinor) {
      const params: Record<string, string> = { payment_intent: paymentIntentId };
      if (amountMinor !== undefined) {
        params.amount = String(amountMinor);
      }
      return (await stripePost("/refunds", params, apiKey)) as StripeRefundResponse;
    },
  };
}

// ---------------------------------------------------------------------------
// Brand normaliser (Stripe brand string → internal enum)
// ---------------------------------------------------------------------------

export function normaliseCardBrand(
  raw: string | undefined,
): "visa" | "mastercard" | "amex" | "discover" | "jcb" | "diners" | "unionpay" | "unknown" {
  switch ((raw ?? "").toLowerCase()) {
    case "visa":
      return "visa";
    case "mastercard":
      return "mastercard";
    case "amex":
    case "american_express":
      return "amex";
    case "discover":
      return "discover";
    case "jcb":
      return "jcb";
    case "diners":
    case "diners_club":
      return "diners";
    case "unionpay":
      return "unionpay";
    default:
      return "unknown";
  }
}
