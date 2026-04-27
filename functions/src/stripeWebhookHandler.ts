/**
 * functions/src/stripeWebhookHandler.ts (W13-DEBT-1, W13-DEBT-4)
 *
 * onRequest Cloud Function that:
 *   1. Verifies the Stripe-Signature header (HMAC-SHA256, 300s replay window)
 *   2. Parses the event into our internal envelope
 *   3. Resolves tenantId via metadata or Firestore lookup
 *   4. Idempotency-checks the eventId
 *   5. Dispatches to the billing or connect dispatcher
 *   6. Atomically persists the new state + idempotency marker
 *
 * Secrets:
 *   - STRIPE_WEBHOOK_SECRET (required)
 *
 * Response codes:
 *   - 200 OK            — applied, duplicate, or ignored event type
 *   - 400 Bad Request   — malformed body / missing fields / parse error
 *   - 401 Unauthorized  — signature verification failed
 *   - 404 Not Found     — tenant could not be resolved
 *   - 500 Server Error  — unexpected failure (logged)
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest, type Request } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";

import {
  parseStripeEvent,
  StripeEventParseError,
  type TenantResolver,
} from "./stripe/parseEvent.js";
import { verifyStripeSignature } from "./stripe/verifySignature.js";
import {
  applySubscriptionEvent,
  BillingDispatchError,
} from "./stripe/billingDispatcher.js";
import {
  applyConnectEvent,
  ConnectDispatchError,
} from "./stripe/connectDispatcher.js";
import {
  createAdminBillingRepository,
  createAdminConnectRepository,
} from "./stripe/adminRepositories.js";

if (getApps().length === 0) {
  initializeApp();
}

const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

// ---------------------------------------------------------------------------
// Pure handler (testable)
// ---------------------------------------------------------------------------

export type HandlerDeps = {
  billing: ReturnType<typeof createAdminBillingRepository>;
  connect: ReturnType<typeof createAdminConnectRepository>;
  now: () => { seconds: number; nanoseconds: number };
};

export type HandlerResult =
  | { status: 200; body: { received: true; outcome: "applied" | "duplicate" | "ignored" } }
  | { status: 400; body: { error: string; code?: string } }
  | { status: 401; body: { error: string; reason: string } }
  | { status: 404; body: { error: string } }
  | { status: 500; body: { error: string } };

export async function handleStripeWebhook(input: {
  rawBody: string;
  signatureHeader: string | undefined;
  webhookSecret: string;
  nowSeconds: number;
  deps: HandlerDeps;
}): Promise<HandlerResult> {
  // 1. Signature
  const sig = verifyStripeSignature({
    rawBody: input.rawBody,
    header: input.signatureHeader,
    secret: input.webhookSecret,
    nowSeconds: input.nowSeconds,
  });
  if (!sig.ok) {
    return { status: 401, body: { error: "signature verification failed", reason: sig.reason } };
  }

  // 2. Parse JSON
  let raw: unknown;
  try {
    raw = JSON.parse(input.rawBody);
  } catch {
    return { status: 400, body: { error: "invalid JSON" } };
  }

  // 3. Tenant resolver
  const tenantResolver: TenantResolver = async (lookup) => {
    if (lookup.metadataTenantId) return lookup.metadataTenantId;
    if (lookup.stripeSubscriptionId) {
      const tid = await input.deps.billing.resolveTenantBySubscriptionId(
        lookup.stripeSubscriptionId,
      );
      if (tid) return tid;
    }
    if (lookup.stripeCustomerId) {
      const tid = await input.deps.billing.resolveTenantByCustomerId(
        lookup.stripeCustomerId,
      );
      if (tid) return tid;
    }
    if (lookup.stripeAccountId) {
      return input.deps.connect.resolveTenantByAccountId(lookup.stripeAccountId);
    }
    return null;
  };

  // 4. Parse event
  let parsed;
  try {
    parsed = await parseStripeEvent(raw, tenantResolver);
  } catch (err) {
    if (err instanceof StripeEventParseError) {
      const status = err.code === "TENANT_UNRESOLVED" ? 404 : 400;
      if (status === 404) return { status, body: { error: err.message } };
      return { status: 400, body: { error: err.message, code: err.code } };
    }
    throw err;
  }

  if (parsed.kind === "ignored") {
    return { status: 200, body: { received: true, outcome: "ignored" } };
  }

  const now = input.deps.now();

  // 5. Dispatch
  try {
    if (parsed.kind === "billing") {
      const tenantId = parsed.event.tenantId;
      if (await input.deps.billing.hasProcessedEvent(tenantId, parsed.event.id)) {
        return { status: 200, body: { received: true, outcome: "duplicate" } };
      }
      const current = await input.deps.billing.getSubscription(tenantId);
      const result = applySubscriptionEvent(current, parsed.event, now);
      if (result.outcome === "applied" && result.subscription) {
        await input.deps.billing.saveSubscriptionWithIdempotency(
          result.subscription,
          parsed.event.id,
        );
      } else {
        await input.deps.billing.recordProcessedEvent(tenantId, parsed.event.id);
      }
      return { status: 200, body: { received: true, outcome: "applied" } };
    }

    // connect
    const tenantId = parsed.event.tenantId;
    if (await input.deps.connect.hasProcessedEvent(tenantId, parsed.event.id)) {
      return { status: 200, body: { received: true, outcome: "duplicate" } };
    }
    const current = await input.deps.connect.getAccount(tenantId);
    const result = applyConnectEvent(current, parsed.event, now);
    if (result.outcome === "applied" && result.account) {
      await input.deps.connect.saveAccountWithIdempotency(
        result.account,
        parsed.event.id,
      );
    }
    return { status: 200, body: { received: true, outcome: "applied" } };
  } catch (err) {
    if (err instanceof BillingDispatchError || err instanceof ConnectDispatchError) {
      return { status: 400, body: { error: err.message, code: err.code } };
    }
    logger.error("stripeWebhookHandler unexpected error", { err });
    return { status: 500, body: { error: "internal error" } };
  }
}

// ---------------------------------------------------------------------------
// Cloud Function entrypoint
// ---------------------------------------------------------------------------

function rawBodyOf(req: Request): string {
  // firebase-functions v2 onRequest exposes req.rawBody for webhook use cases.
  const rb = (req as Request & { rawBody?: Buffer }).rawBody;
  if (rb) return rb.toString("utf8");
  if (typeof req.body === "string") return req.body;
  return JSON.stringify(req.body ?? {});
}

export const stripeWebhookHandler = onRequest(
  { secrets: [STRIPE_WEBHOOK_SECRET], region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const db = getFirestore();
    const result = await handleStripeWebhook({
      rawBody: rawBodyOf(req),
      signatureHeader: req.header("stripe-signature") ?? undefined,
      webhookSecret: STRIPE_WEBHOOK_SECRET.value(),
      nowSeconds: Math.floor(Date.now() / 1000),
      deps: {
        billing: createAdminBillingRepository(db),
        connect: createAdminConnectRepository(db),
        now: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }),
      },
    });
    res.status(result.status).json(result.body);
  },
);
