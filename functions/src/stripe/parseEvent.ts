/**
 * functions/src/stripe/parseEvent.ts (W13-DEBT-1, W13-DEBT-4)
 *
 * Pure mappers from raw Stripe webhook payloads → domain event envelopes:
 *   - parseSubscriptionEvent → StripeWebhookEvent  (billing domain)
 *   - parseConnectEvent      → StripeConnectEvent  (connect domain)
 *
 * Why mirror domain types here:
 *   The functions/ package compiles against the admin SDK; it does not import
 *   from src/. We restate the minimal envelope shapes here as structural
 *   types so the dispatcher in `stripeWebhookHandler` can hand the parsed
 *   event to the domain service without a cross-package import.
 *
 * Tenant resolution:
 *   The parser does *not* resolve tenantId on its own. The caller passes a
 *   `resolveTenantId` function that maps `(stripeCustomerId | stripeAccountId)
 *   → tenantId`. This keeps the parser deterministic and pure; only the
 *   composition layer in `stripeWebhookHandler` performs Firestore lookups.
 *
 * `cancelAtPeriodEnd=true` (W13-DEBT-4):
 *   Surfaced verbatim from `customer.subscription.updated` payloads. The
 *   domain service then carries the flag through to the Subscription record
 *   so the UI can show "cancels at <currentPeriodEnd>". When the period ends,
 *   Stripe sends `customer.subscription.deleted` and the existing service
 *   transitions the record to `cancelled` — no extra parser logic required.
 */

// ---------------------------------------------------------------------------
// Local Timestamp + envelope shapes (kept structural to avoid cross-imports)
// ---------------------------------------------------------------------------

type LocalTimestamp = { seconds: number; nanoseconds: number };

type ParsedSubscriptionPayload = {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  planId: "starter" | "professional" | "enterprise";
  interval: "monthly" | "annual";
  stripeStatus: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: LocalTimestamp;
  currentPeriodEnd: LocalTimestamp;
  trialEndsAt: LocalTimestamp | null;
};

export type ParsedSubscriptionEvent = {
  id: string;
  type:
    | "customer.subscription.created"
    | "customer.subscription.updated"
    | "customer.subscription.deleted"
    | "customer.subscription.trial_will_end"
    | "invoice.payment_failed"
    | "invoice.payment_succeeded";
  tenantId: string;
  subscription?: ParsedSubscriptionPayload;
  invoice?: {
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    invoiceStatus: string;
  };
};

type ParsedAccountPayload = {
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsCurrentlyDue: string[];
  disabledReason: string | null;
};

type ParsedPayoutPayload = {
  stripeAccountId: string;
  payoutId: string;
  failureCode: string | null;
  failureMessage: string | null;
};

export type ParsedConnectEvent = {
  id: string;
  type: "account.updated" | "payout.failed" | "payout.paid";
  tenantId: string;
  account?: ParsedAccountPayload;
  payout?: ParsedPayoutPayload;
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type ParseErrorCode =
  | "UNSUPPORTED_TYPE"
  | "MISSING_FIELD"
  | "TENANT_UNRESOLVED"
  | "INVALID_PLAN"
  | "INVALID_INTERVAL";

export class StripeEventParseError extends Error {
  constructor(
    public readonly code: ParseErrorCode,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "StripeEventParseError";
  }
}

// ---------------------------------------------------------------------------
// Tenant resolver port
// ---------------------------------------------------------------------------

/**
 * Resolves tenantId from one of the Stripe identifiers carried by the event
 * (in priority order: subscription/customer for billing, account for connect).
 * The caller may inspect `event.data.object.metadata.tenantId` first and fall
 * back to a Firestore lookup.
 */
export type TenantResolver = (lookup: {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeAccountId?: string;
  metadataTenantId?: string;
}) => Promise<string | null>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SUPPORTED_BILLING_TYPES: ReadonlySet<string> = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.trial_will_end",
  "invoice.payment_failed",
  "invoice.payment_succeeded",
]);

const SUPPORTED_CONNECT_TYPES: ReadonlySet<string> = new Set([
  "account.updated",
  "payout.failed",
  "payout.paid",
]);

const PLAN_MAP: Record<string, "starter" | "professional" | "enterprise"> = {
  starter: "starter",
  professional: "professional",
  pro: "professional",
  enterprise: "enterprise",
};

const INTERVAL_MAP: Record<string, "monthly" | "annual"> = {
  month: "monthly",
  monthly: "monthly",
  year: "annual",
  annual: "annual",
  yearly: "annual",
};

function toTimestamp(unixSeconds: number | null | undefined): LocalTimestamp | null {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds)) return null;
  return { seconds: Math.floor(unixSeconds), nanoseconds: 0 };
}

function requireTimestamp(unixSeconds: unknown, field: string): LocalTimestamp {
  const ts = toTimestamp(unixSeconds as number);
  if (!ts) {
    throw new StripeEventParseError("MISSING_FIELD", `${field} is required`);
  }
  return ts;
}

function pickPlanId(metadata: Record<string, unknown> | undefined): "starter" | "professional" | "enterprise" {
  const raw = (metadata?.planId ?? metadata?.plan ?? "").toString().trim().toLowerCase();
  if (!raw) {
    throw new StripeEventParseError(
      "INVALID_PLAN",
      "Subscription metadata.planId is required (starter|professional|enterprise)",
    );
  }
  const mapped = PLAN_MAP[raw];
  if (!mapped) {
    throw new StripeEventParseError("INVALID_PLAN", `Unrecognised planId "${raw}"`);
  }
  return mapped;
}

function pickInterval(rawInterval: unknown): "monthly" | "annual" {
  const raw = (rawInterval ?? "").toString().trim().toLowerCase();
  if (!raw) {
    throw new StripeEventParseError(
      "INVALID_INTERVAL",
      "Subscription items[0].plan.interval is required",
    );
  }
  const mapped = INTERVAL_MAP[raw];
  if (!mapped) {
    throw new StripeEventParseError("INVALID_INTERVAL", `Unrecognised interval "${raw}"`);
  }
  return mapped;
}

// ---------------------------------------------------------------------------
// Top-level dispatch
// ---------------------------------------------------------------------------

export type ParsedEvent =
  | { kind: "billing"; event: ParsedSubscriptionEvent }
  | { kind: "connect"; event: ParsedConnectEvent }
  | { kind: "ignored"; type: string; reason: string };

/**
 * Parse an arbitrary Stripe webhook payload into our internal event surface.
 * Returns `{ kind: "ignored" }` for event types we don't subscribe to so the
 * webhook can ack them with 200 OK without raising.
 */
export async function parseStripeEvent(
  raw: unknown,
  resolveTenantId: TenantResolver,
): Promise<ParsedEvent> {
  if (!raw || typeof raw !== "object") {
    throw new StripeEventParseError("MISSING_FIELD", "Event payload must be an object");
  }
  const event = raw as Record<string, unknown>;
  const type = typeof event.type === "string" ? event.type : "";
  const id = typeof event.id === "string" ? event.id : "";
  if (!id) {
    throw new StripeEventParseError("MISSING_FIELD", "Event.id is required");
  }
  if (!type) {
    throw new StripeEventParseError("MISSING_FIELD", "Event.type is required");
  }

  if (SUPPORTED_BILLING_TYPES.has(type)) {
    return { kind: "billing", event: await parseSubscriptionEvent(event, id, type, resolveTenantId) };
  }
  if (SUPPORTED_CONNECT_TYPES.has(type)) {
    return { kind: "connect", event: await parseConnectEvent(event, id, type, resolveTenantId) };
  }
  return { kind: "ignored", type, reason: "unsupported event type" };
}

// ---------------------------------------------------------------------------
// Subscription / billing parser
// ---------------------------------------------------------------------------

async function parseSubscriptionEvent(
  event: Record<string, unknown>,
  id: string,
  type: string,
  resolveTenantId: TenantResolver,
): Promise<ParsedSubscriptionEvent> {
  const data = (event.data ?? {}) as { object?: Record<string, unknown> };
  const obj = data.object ?? {};
  const isInvoice = type.startsWith("invoice.");

  let stripeCustomerId = "";
  let stripeSubscriptionId = "";
  let metadataTenantId: string | undefined;
  let payload: ParsedSubscriptionPayload | undefined;
  let invoice: ParsedSubscriptionEvent["invoice"];

  if (isInvoice) {
    stripeCustomerId = (obj.customer as string) ?? "";
    stripeSubscriptionId = (obj.subscription as string) ?? "";
    invoice = {
      stripeSubscriptionId,
      stripeCustomerId,
      invoiceStatus: (obj.status as string) ?? "",
    };
    metadataTenantId = ((obj.metadata as Record<string, unknown>) ?? {}).tenantId as string | undefined;
  } else {
    stripeSubscriptionId = (obj.id as string) ?? "";
    stripeCustomerId = (obj.customer as string) ?? "";
    const metadata = (obj.metadata as Record<string, unknown>) ?? {};
    metadataTenantId = metadata.tenantId as string | undefined;
    const items = ((obj.items as Record<string, unknown>) ?? {}).data as Array<Record<string, unknown>> | undefined;
    const firstItem = items?.[0] ?? {};
    const plan = (firstItem.plan as Record<string, unknown>) ?? {};
    payload = {
      stripeSubscriptionId,
      stripeCustomerId,
      planId: pickPlanId(metadata),
      interval: pickInterval(plan.interval),
      stripeStatus: (obj.status as string) ?? "",
      cancelAtPeriodEnd: Boolean(obj.cancel_at_period_end),
      currentPeriodStart: requireTimestamp(obj.current_period_start, "current_period_start"),
      currentPeriodEnd: requireTimestamp(obj.current_period_end, "current_period_end"),
      trialEndsAt: toTimestamp(obj.trial_end as number | null | undefined),
    };
  }

  const tenantId = await resolveTenantId({
    stripeCustomerId: stripeCustomerId || undefined,
    stripeSubscriptionId: stripeSubscriptionId || undefined,
    metadataTenantId,
  });
  if (!tenantId) {
    throw new StripeEventParseError(
      "TENANT_UNRESOLVED",
      `Could not resolve tenantId for ${type} (customer=${stripeCustomerId || "?"}, subscription=${stripeSubscriptionId || "?"})`,
    );
  }

  return {
    id,
    type: type as ParsedSubscriptionEvent["type"],
    tenantId,
    subscription: payload,
    invoice,
  };
}

// ---------------------------------------------------------------------------
// Connect parser
// ---------------------------------------------------------------------------

async function parseConnectEvent(
  event: Record<string, unknown>,
  id: string,
  type: string,
  resolveTenantId: TenantResolver,
): Promise<ParsedConnectEvent> {
  const data = (event.data ?? {}) as { object?: Record<string, unknown> };
  const obj = data.object ?? {};
  const account = (event.account as string) ?? (obj.id as string) ?? "";

  if (type === "account.updated") {
    const requirements = ((obj.requirements as Record<string, unknown>) ?? {}) as {
      currently_due?: string[];
      disabled_reason?: string | null;
    };
    const tenantId = await resolveTenantId({
      stripeAccountId: account || undefined,
      metadataTenantId: ((obj.metadata as Record<string, unknown>) ?? {}).tenantId as string | undefined,
    });
    if (!tenantId) {
      throw new StripeEventParseError(
        "TENANT_UNRESOLVED",
        `Could not resolve tenantId for account.updated (account=${account || "?"})`,
      );
    }
    return {
      id,
      type: "account.updated",
      tenantId,
      account: {
        stripeAccountId: account,
        chargesEnabled: Boolean(obj.charges_enabled),
        payoutsEnabled: Boolean(obj.payouts_enabled),
        detailsSubmitted: Boolean(obj.details_submitted),
        requirementsCurrentlyDue: Array.isArray(requirements.currently_due)
          ? [...requirements.currently_due]
          : [],
        disabledReason: requirements.disabled_reason ?? null,
      },
    };
  }

  // payout.failed | payout.paid
  const tenantId = await resolveTenantId({ stripeAccountId: account || undefined });
  if (!tenantId) {
    throw new StripeEventParseError(
      "TENANT_UNRESOLVED",
      `Could not resolve tenantId for ${type} (account=${account || "?"})`,
    );
  }
  return {
    id,
    type: type as "payout.failed" | "payout.paid",
    tenantId,
    payout: {
      stripeAccountId: account,
      payoutId: (obj.id as string) ?? "",
      failureCode: (obj.failure_code as string) ?? null,
      failureMessage: (obj.failure_message as string) ?? null,
    },
  };
}
