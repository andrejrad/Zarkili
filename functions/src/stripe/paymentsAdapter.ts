/**
 * functions/src/stripe/paymentsAdapter.ts (W24-DEBT-2)
 *
 * Pure Stripe Payments API adapter using `fetch` — no Stripe SDK.
 * Follows the same pattern as taxAdapter.ts: typed port + real fetch impl.
 *
 * Operations:
 *   - createCustomer                  POST /v1/customers
 *   - attachPaymentMethod             POST /v1/payment_methods/{id}/attach
 *   - detachPaymentMethod             POST /v1/payment_methods/{id}/detach
 *   - createAndConfirmPaymentIntent   POST /v1/payment_intents (confirm=true)
 *   - createRefund                    POST /v1/refunds
 *
 * Stripe Connect additions:
 *   - createPaymentIntentManual       POST /v1/payment_intents (capture_method=manual)
 *   - createSetupIntent               POST /v1/setup_intents
 *   - capturePaymentIntent            POST /v1/payment_intents/{id}/capture
 *   - cancelPaymentIntent             POST /v1/payment_intents/{id}/cancel
 *   - createOffsessionPaymentIntent   POST /v1/payment_intents (confirm=true, off_session=true)
 *   - createConnectAccount            POST /v1/accounts (Express account onboarding)
 *   - createAccountLink               POST /v1/account_links
 *   - createLoginLink                 POST /v1/accounts/{id}/login_links
 *
 * All Connect operations accept an optional `stripeAccount` parameter that
 * adds the `Stripe-Account` header so the request is scoped to the connected
 * account. Without it, the request runs against the platform account.
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
  client_secret: string | null;
  last_payment_error?: {
    code?: string;
    decline_code?: string;
    message?: string;
  } | null;
};

export type StripeSetupIntentResponse = {
  id: string;
  status: string;
  client_secret: string | null;
  payment_method: string | null;
};

export type StripeCustomerResponse = {
  id: string;
};

export type StripeConnectAccountResponse = {
  id: string;
};

export type StripeAccountLinkResponse = {
  url: string;
  expires_at: number;
};

export type StripeLoginLinkResponse = {
  url: string;
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
  createCustomer(userId: string, email: string | null, options?: { stripeAccount?: string }): Promise<StripeCustomerResponse>;
  attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
    options?: { stripeAccount?: string },
  ): Promise<StripePaymentMethodResponse>;
  detachPaymentMethod(paymentMethodId: string, options?: { stripeAccount?: string }): Promise<void>;
  createAndConfirmPaymentIntent(params: {
    amountMinor: number;
    currency: string;
    customerId: string;
    paymentMethodId: string;
    idempotencyKey: string;
    metadata: Record<string, string>;
  }): Promise<StripePaymentIntentResponse>;
  /** Create a PaymentIntent with capture_method=manual for deposit/full flows. Returns client_secret. */
  createPaymentIntentManual(params: {
    amountMinor: number;
    currency: string;
    customerId: string;
    applicationFeeMinor: number;
    stripeAccount: string;
    idempotencyKey: string;
    metadata: Record<string, string>;
  }): Promise<StripePaymentIntentResponse>;
  /** Create a SetupIntent (card_on_file mode) on a connected account. Returns client_secret. */
  createSetupIntent(params: {
    customerId: string;
    stripeAccount: string;
    metadata: Record<string, string>;
  }): Promise<StripeSetupIntentResponse>;
  /** Retrieve a PaymentIntent from Stripe. */
  retrievePaymentIntent(intentId: string, stripeAccount: string): Promise<StripePaymentIntentResponse>;
  /** Retrieve a SetupIntent from Stripe. */
  retrieveSetupIntent(intentId: string, stripeAccount: string): Promise<StripeSetupIntentResponse>;
  /** Capture an authorized PaymentIntent. Pass amountToCapture for partial capture (minor units). */
  capturePaymentIntent(intentId: string, stripeAccount: string, amountToCapture?: number): Promise<StripePaymentIntentResponse>;
  /** Cancel a PaymentIntent (releases authorization hold). */
  cancelPaymentIntent(intentId: string, stripeAccount: string): Promise<StripePaymentIntentResponse>;
  /** Create and immediately confirm an off-session PaymentIntent (post-service charge). */
  createOffsessionPaymentIntent(params: {
    amountMinor: number;
    currency: string;
    customerId: string;
    paymentMethodId: string;
    applicationFeeMinor: number;
    stripeAccount: string;
    idempotencyKey: string;
    metadata: Record<string, string>;
  }): Promise<StripePaymentIntentResponse>;
  /**
   * Create an off-session manual-capture PaymentIntent for re-authorization.
   * Sets capture_method=manual + confirm=true + off_session=true.
   */
  createReauthorizationHold(params: {
    amountMinor: number;
    currency: string;
    customerId: string;
    paymentMethodId: string;
    applicationFeeMinor: number;
    stripeAccount: string;
    idempotencyKey: string;
    metadata: Record<string, string>;
  }): Promise<StripePaymentIntentResponse>;
  createRefund(
    paymentIntentId: string,
    amountMinor?: number,
    options?: { stripeAccount?: string; metadata?: Record<string, string> },
  ): Promise<StripeRefundResponse>;
  /** Create a Stripe Express Connect account for a salon. */
  createConnectAccount(params: { country: string }): Promise<StripeConnectAccountResponse>;
  /** Generate an Account Link for Express onboarding. */
  createAccountLink(params: {
    accountId: string;
    returnUrl: string;
    refreshUrl: string;
  }): Promise<StripeAccountLinkResponse>;
  /** Generate a login link for a connected account's Express dashboard. */
  createLoginLink(accountId: string): Promise<StripeLoginLinkResponse>;
  /** Create an ephemeral key for a Stripe customer on a connected account (for PaymentSheet). */
  createEphemeralKey(customerId: string, stripeAccount: string): Promise<{ secret: string }>;
  /** List saved payment methods for a Stripe customer on a connected account. */
  listPaymentMethods(customerId: string, stripeAccount: string): Promise<Array<{ id: string; type: string }>>;
};

// ---------------------------------------------------------------------------
// Internal HTTP helpers
// ---------------------------------------------------------------------------

async function stripeGet(
  path: string,
  apiKey: string,
  options?: { stripeAccount?: string },
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (options?.stripeAccount) {
    headers["Stripe-Account"] = options.stripeAccount;
  }
  const res = await fetch(`${STRIPE_BASE}${path}`, { method: "GET", headers });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = (data.error as { message?: string; code?: string } | undefined) ?? {};
    throw new Error(
      `Stripe error [${res.status}] ${err.code ?? "unknown"}: ${err.message ?? "no message"}`,
    );
  }
  return data;
}

async function stripePost(
  path: string,
  params: Record<string, string>,
  apiKey: string,
  options?: { idempotencyKey?: string; stripeAccount?: string; stripeVersion?: string },
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (options?.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }
  if (options?.stripeAccount) {
    headers["Stripe-Account"] = options.stripeAccount;
  }
  if (options?.stripeVersion) {
    headers["Stripe-Version"] = options.stripeVersion;
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
    async createCustomer(userId, email, options) {
      const params: Record<string, string> = { "metadata[userId]": userId };
      if (email) params.email = email;
      return (await stripePost("/customers", params, apiKey, {
        stripeAccount: options?.stripeAccount,
      })) as StripeCustomerResponse;
    },

    async attachPaymentMethod(paymentMethodId, customerId, options) {
      return (await stripePost(
        `/payment_methods/${paymentMethodId}/attach`,
        { customer: customerId },
        apiKey,
        { stripeAccount: options?.stripeAccount },
      )) as StripePaymentMethodResponse;
    },

    async detachPaymentMethod(paymentMethodId, options) {
      await stripePost(`/payment_methods/${paymentMethodId}/detach`, {}, apiKey, {
        stripeAccount: options?.stripeAccount,
      });
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
      return (await stripePost("/payment_intents", params, apiKey, {
        idempotencyKey,
      })) as StripePaymentIntentResponse;
    },

    async createPaymentIntentManual({
      amountMinor,
      currency,
      customerId,
      applicationFeeMinor,
      stripeAccount,
      idempotencyKey,
      metadata,
    }) {
      const params: Record<string, string> = {
        amount: String(amountMinor),
        currency: currency.toLowerCase(),
        customer: customerId,
        capture_method: "manual",
        setup_future_usage: "off_session",
        "automatic_payment_methods[enabled]": "true",
        application_fee_amount: String(applicationFeeMinor),
      };
      for (const [k, v] of Object.entries(metadata)) {
        params[`metadata[${k}]`] = v;
      }
      return (await stripePost("/payment_intents", params, apiKey, {
        idempotencyKey,
        stripeAccount,
      })) as StripePaymentIntentResponse;
    },

    async createSetupIntent({ customerId, stripeAccount, metadata }) {
      const params: Record<string, string> = {
        customer: customerId,
        usage: "off_session",
      };
      for (const [k, v] of Object.entries(metadata)) {
        params[`metadata[${k}]`] = v;
      }
      return (await stripePost("/setup_intents", params, apiKey, {
        stripeAccount,
      })) as StripeSetupIntentResponse;
    },

    async retrievePaymentIntent(intentId, stripeAccount) {
      return (await stripeGet(
        `/payment_intents/${intentId}`,
        apiKey,
        { stripeAccount },
      )) as StripePaymentIntentResponse;
    },

    async retrieveSetupIntent(intentId, stripeAccount) {
      return (await stripeGet(
        `/setup_intents/${intentId}`,
        apiKey,
        { stripeAccount },
      )) as StripeSetupIntentResponse;
    },

    async capturePaymentIntent(intentId, stripeAccount, amountToCapture) {
      const params: Record<string, string> = {};
      if (amountToCapture !== undefined) {
        params.amount_to_capture = String(amountToCapture);
      }
      return (await stripePost(
        `/payment_intents/${intentId}/capture`,
        params,
        apiKey,
        { stripeAccount },
      )) as StripePaymentIntentResponse;
    },

    async cancelPaymentIntent(intentId, stripeAccount) {
      return (await stripePost(
        `/payment_intents/${intentId}/cancel`,
        {},
        apiKey,
        { stripeAccount },
      )) as StripePaymentIntentResponse;
    },

    async createOffsessionPaymentIntent({
      amountMinor,
      currency,
      customerId,
      paymentMethodId,
      applicationFeeMinor,
      stripeAccount,
      idempotencyKey,
      metadata,
    }) {
      const params: Record<string, string> = {
        amount: String(amountMinor),
        currency: currency.toLowerCase(),
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: "true",
        off_session: "true",
        "automatic_payment_methods[enabled]": "false",
        "payment_method_types[]": "card",
        application_fee_amount: String(applicationFeeMinor),
      };
      for (const [k, v] of Object.entries(metadata)) {
        params[`metadata[${k}]`] = v;
      }
      return (await stripePost("/payment_intents", params, apiKey, {
        idempotencyKey,
        stripeAccount,
      })) as StripePaymentIntentResponse;
    },

    async createReauthorizationHold({
      amountMinor,
      currency,
      customerId,
      paymentMethodId,
      applicationFeeMinor,
      stripeAccount,
      idempotencyKey,
      metadata,
    }) {
      const params: Record<string, string> = {
        amount: String(amountMinor),
        currency: currency.toLowerCase(),
        customer: customerId,
        payment_method: paymentMethodId,
        capture_method: "manual",
        confirm: "true",
        off_session: "true",
        "automatic_payment_methods[enabled]": "false",
        "payment_method_types[]": "card",
        application_fee_amount: String(applicationFeeMinor),
      };
      for (const [k, v] of Object.entries(metadata)) {
        params[`metadata[${k}]`] = v;
      }
      return (await stripePost("/payment_intents", params, apiKey, {
        idempotencyKey,
        stripeAccount,
      })) as StripePaymentIntentResponse;
    },

    async createRefund(paymentIntentId, amountMinor, options) {
      const params: Record<string, string> = { payment_intent: paymentIntentId };
      if (amountMinor !== undefined) {
        params.amount = String(amountMinor);
      }
      if (options?.metadata) {
        for (const [k, v] of Object.entries(options.metadata)) {
          params[`metadata[${k}]`] = v;
        }
      }
      return (await stripePost("/refunds", params, apiKey, {
        stripeAccount: options?.stripeAccount,
      })) as StripeRefundResponse;
    },

    async createConnectAccount({ country }) {
      const params: Record<string, string> = {
        type: "express",
        country,
        "capabilities[card_payments][requested]": "true",
        "capabilities[transfers][requested]": "true",
      };
      return (await stripePost("/accounts", params, apiKey)) as StripeConnectAccountResponse;
    },

    async createAccountLink({ accountId, returnUrl, refreshUrl }) {
      const params: Record<string, string> = {
        account: accountId,
        return_url: returnUrl,
        refresh_url: refreshUrl,
        type: "account_onboarding",
      };
      return (await stripePost("/account_links", params, apiKey)) as StripeAccountLinkResponse;
    },

    async createLoginLink(accountId) {
      return (await stripePost(
        `/accounts/${accountId}/login_links`,
        {},
        apiKey,
      )) as StripeLoginLinkResponse;
    },

    async createEphemeralKey(customerId, stripeAccount) {
      const result = await stripePost(
        "/ephemeral_keys",
        { customer: customerId },
        apiKey,
        { stripeAccount, stripeVersion: "2024-06-20" },
      );
      return result as { secret: string };
    },

    async listPaymentMethods(customerId, stripeAccount) {
      const data = await stripeGet(
        `/payment_methods?customer=${encodeURIComponent(customerId)}&type=card`,
        apiKey,
        { stripeAccount },
      ) as { data?: Array<{ id: string; object: string }> };
      return (data.data ?? []).map((pm) => ({ id: pm.id, type: "card" }));
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
