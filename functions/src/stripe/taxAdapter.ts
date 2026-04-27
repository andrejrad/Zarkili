/**
 * functions/src/stripe/taxAdapter.ts (W18-DEBT-1)
 *
 * Pure mappers and a typed port for the Stripe Tax API call. The handler
 * (`stripeTaxCalculate.ts`) composes these with admin-SDK persistence.
 *
 * No `stripe` SDK dependency — we hit `https://api.stripe.com/v1/tax/calculations`
 * directly via `fetch` and form-encoded params, mirroring the existing
 * "no Stripe SDK in functions/" pattern from W18 webhook handler.
 */

// ---------------------------------------------------------------------------
// Internal types — duplicated from src/domains/tax/model.ts to keep functions/
// independent of the client-SDK domain code at compile time.
// ---------------------------------------------------------------------------

export type LocalTimestamp = { seconds: number; nanoseconds: number };

export type TaxAddress = {
  country: string;
  region: string | null;
  city: string | null;
  postalCode: string | null;
};

export type TaxBuyer = {
  type: "individual" | "business";
  vatId: string | null;
  address: TaxAddress;
};

export type TaxSeller = {
  tenantId: string | null;
  address: TaxAddress;
  vatId: string | null;
};

export type TaxLineItem = {
  id: string;
  productType: "service" | "saas";
  amount: number;
  currency: string;
  taxCode: string;
};

export type TaxQuote = {
  quoteId: string;
  context: "saas_subscription" | "salon_payment";
  buyer: TaxBuyer;
  seller: TaxSeller;
  items: ReadonlyArray<TaxLineItem>;
};

export type TaxBreakdownLine = {
  itemId: string;
  taxableAmount: number;
  taxAmount: number;
  rate: number;
  jurisdiction: string;
  reason:
    | "us_state_taxable_service"
    | "us_state_nontaxable_service"
    | "nyc_surcharge"
    | "eu_vat_standard"
    | "eu_vat_reverse_charge"
    | "out_of_scope";
};

export type TaxCalculation = {
  quoteId: string;
  context: TaxQuote["context"];
  totalTax: number;
  totalTaxable: number;
  currency: string;
  lines: ReadonlyArray<TaxBreakdownLine>;
  stripeCalculationId: string | null;
  calculatedAt: LocalTimestamp;
  cacheExpiresAt: LocalTimestamp;
};

// ---------------------------------------------------------------------------
// Port — anything that can call Stripe Tax. Real impl uses `fetch`; tests
// inject a stub.
// ---------------------------------------------------------------------------

export type StripeTaxApiClient = {
  /**
   * POST /v1/tax/calculations
   * Returns Stripe's raw response object (subset that we consume).
   */
  createCalculation(formParams: Record<string, string>): Promise<StripeTaxCalculationResponse>;
};

/** Minimal subset of the Stripe Tax response shape we depend on. */
export type StripeTaxCalculationResponse = {
  id: string;
  amount_total: number;
  tax_amount_exclusive: number;
  currency: string;
  line_items?: {
    data?: Array<{
      reference?: string;
      amount?: number;
      amount_tax?: number;
      tax_breakdown?: Array<{
        amount?: number;
        tax_rate_details?: {
          percentage_decimal?: string;
          country?: string;
          state?: string | null;
        };
        jurisdiction?: {
          display_name?: string;
          country?: string;
          state?: string | null;
        };
        sourcing?: string;
        taxability_reason?: string;
      }>;
    }>;
  };
};

// ---------------------------------------------------------------------------
// Pure: TaxQuote → Stripe form params
// ---------------------------------------------------------------------------

/**
 * Builds the URL-encoded form parameters for `POST /v1/tax/calculations`.
 *
 * Stripe expects nested keys via bracket notation (e.g. `customer_details[address][country]`).
 * We expand each line item under `line_items[N][...]`.
 */
export function buildStripeTaxRequestParams(quote: TaxQuote): Record<string, string> {
  if (quote.items.length === 0) {
    throw new Error("INVALID_QUOTE: at least one line item is required");
  }
  const currency = quote.items[0].currency;
  for (const item of quote.items) {
    if (item.currency !== currency) {
      throw new Error("INVALID_QUOTE: mixed currencies are not supported");
    }
    if (item.amount < 0) {
      throw new Error(`INVALID_QUOTE: line item ${item.id} has negative amount`);
    }
  }

  const params: Record<string, string> = {
    currency: currency.toLowerCase(),
    "customer_details[address][country]": quote.buyer.address.country,
    "customer_details[address_source]": "billing",
  };
  if (quote.buyer.address.region) {
    params["customer_details[address][state]"] = quote.buyer.address.region;
  }
  if (quote.buyer.address.city) {
    params["customer_details[address][city]"] = quote.buyer.address.city;
  }
  if (quote.buyer.address.postalCode) {
    params["customer_details[address][postal_code]"] = quote.buyer.address.postalCode;
  }
  if (quote.buyer.type === "business" && quote.buyer.vatId) {
    params["customer_details[tax_ids][0][type]"] = "eu_vat";
    params["customer_details[tax_ids][0][value]"] = quote.buyer.vatId;
  }

  quote.items.forEach((item, idx) => {
    params[`line_items[${idx}][amount]`] = String(item.amount);
    params[`line_items[${idx}][reference]`] = item.id;
    params[`line_items[${idx}][tax_code]`] = item.taxCode;
  });

  return params;
}

// ---------------------------------------------------------------------------
// Pure: Stripe response → TaxCalculation
// ---------------------------------------------------------------------------

const DEFAULT_TAX_CACHE_TTL_SECONDS = 15 * 60;

function addSeconds(t: LocalTimestamp, seconds: number): LocalTimestamp {
  return { seconds: t.seconds + seconds, nanoseconds: 0 };
}

function mapTaxabilityReason(raw: string | undefined): TaxBreakdownLine["reason"] {
  switch (raw) {
    case "standard_rated":
    case "taxable_basis_reduced":
      return "us_state_taxable_service";
    case "reverse_charge":
      return "eu_vat_reverse_charge";
    case "not_collecting":
    case "not_subject_to_tax":
    case "not_supported":
    case "product_exempt":
    case "product_exempt_holiday":
    case "customer_exempt":
    case "excluded_territory":
    case "jurisdiction_unsupported":
    case "vat_exempt":
      return "out_of_scope";
    default:
      return "out_of_scope";
  }
}

/**
 * Maps a Stripe Tax calculation response into the `TaxCalculation` shape that
 * the rest of the platform consumes. Mirrors the local-provider output so
 * downstream consumers (receipts, invoices) are unaware of the source.
 */
export function mapStripeTaxResponseToCalculation(
  quote: TaxQuote,
  response: StripeTaxCalculationResponse,
  now: LocalTimestamp,
  ttlSeconds: number = DEFAULT_TAX_CACHE_TTL_SECONDS,
): TaxCalculation {
  const lines: TaxBreakdownLine[] = [];

  const responseLines = response.line_items?.data ?? [];
  for (const item of quote.items) {
    const match = responseLines.find((l) => l.reference === item.id);
    const breakdown = match?.tax_breakdown?.[0];
    const taxAmount = match?.amount_tax ?? 0;
    const rate = breakdown?.tax_rate_details?.percentage_decimal
      ? Number(breakdown.tax_rate_details.percentage_decimal) / 100
      : item.amount > 0
        ? Math.round((taxAmount / item.amount) * 1_000_000) / 1_000_000
        : 0;
    const jurisdiction =
      (breakdown?.jurisdiction?.display_name ??
        [
          breakdown?.tax_rate_details?.country,
          breakdown?.tax_rate_details?.state,
        ]
          .filter(Boolean)
          .join(" ")) ||
      "out of scope";
    lines.push({
      itemId: item.id,
      taxableAmount: match?.amount ?? item.amount,
      taxAmount,
      rate,
      jurisdiction,
      reason: mapTaxabilityReason(breakdown?.taxability_reason),
    });
  }

  const totalTax = lines.reduce((s, l) => s + l.taxAmount, 0);
  const totalTaxable = lines.reduce((s, l) => s + l.taxableAmount, 0);

  return {
    quoteId: quote.quoteId,
    context: quote.context,
    totalTax,
    totalTaxable,
    currency: response.currency?.toUpperCase() ?? quote.items[0].currency,
    lines,
    stripeCalculationId: response.id,
    calculatedAt: now,
    cacheExpiresAt: addSeconds(now, ttlSeconds),
  };
}

// ---------------------------------------------------------------------------
// Real adapter — uses native fetch (Node 20+).
// ---------------------------------------------------------------------------

/**
 * Production adapter. Uses HTTP Basic auth (Stripe convention: API key is the
 * username, password empty). Retries are not implemented here — the caller's
 * idempotency cache makes the call effectively retry-once-on-cache-miss.
 */
export function createStripeTaxApiClient(apiKey: string): StripeTaxApiClient {
  if (!apiKey) {
    throw new Error("STRIPE_API_KEY is required");
  }
  const auth = `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
  return {
    async createCalculation(formParams) {
      const body = new URLSearchParams(formParams).toString();
      const response = await fetch("https://api.stripe.com/v1/tax/calculations", {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/x-www-form-urlencoded",
          "Stripe-Version": "2024-06-20",
        },
        body,
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `STRIPE_TAX_API_FAILED: ${response.status} ${response.statusText} :: ${errorBody}`,
        );
      }
      return (await response.json()) as StripeTaxCalculationResponse;
    },
  };
}

export { DEFAULT_TAX_CACHE_TTL_SECONDS };
