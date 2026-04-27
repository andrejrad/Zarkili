/**
 * functions/src/stripe/verifySignature.ts (W13-DEBT-1)
 *
 * Stripe webhook signature verification (HMAC-SHA256).
 *
 * Stripe sends a header of the form:
 *   Stripe-Signature: t=1700000000,v1=<hex>,v1=<hex>,v0=<hex>
 *
 * Verification algorithm (per Stripe docs):
 *   signed_payload = `${t}.${rawBody}`
 *   expected = HMAC_SHA256(signing_secret, signed_payload).hex
 *   accept iff any v1 value matches `expected` (constant-time compare)
 *   AND |now - t| <= tolerance (default 300s) — protects against replay
 *
 * No external Stripe SDK dependency; we use Node's `crypto.createHmac`.
 *
 * Pure function `verifyStripeSignature` accepts an injected `nowSeconds` so
 * tests can pin time deterministically.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export type SignatureVerifyOk = {
  ok: true;
  timestamp: number;
};

export type SignatureVerifyFail = {
  ok: false;
  reason:
    | "MALFORMED_HEADER"
    | "MISSING_TIMESTAMP"
    | "MISSING_SIGNATURE"
    | "TIMESTAMP_OUT_OF_TOLERANCE"
    | "SIGNATURE_MISMATCH";
};

export type SignatureVerifyResult = SignatureVerifyOk | SignatureVerifyFail;

const DEFAULT_TOLERANCE_SECONDS = 300;

/** Parse a `Stripe-Signature` header value into its `t` and `v1` parts. */
export function parseStripeSignatureHeader(
  header: string | undefined | null,
): { timestamp: number; v1: string[] } | null {
  if (!header || typeof header !== "string") return null;
  const parts = header.split(",").map((p) => p.trim()).filter(Boolean);
  let timestamp: number | null = null;
  const v1: string[] = [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (!key || !value) continue;
    if (key === "t") {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) timestamp = Math.floor(n);
    } else if (key === "v1") {
      v1.push(value);
    }
  }
  if (timestamp === null) return null;
  return { timestamp, v1 };
}

/**
 * Compute the HMAC-SHA256 hex digest of `${timestamp}.${rawBody}`
 * with the given secret. Exported for tests.
 */
export function computeExpectedSignature(
  rawBody: string,
  timestamp: number,
  secret: string,
): string {
  const signedPayload = `${timestamp}.${rawBody}`;
  return createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
}

/**
 * Verify a Stripe webhook signature.
 *
 * @param rawBody         The exact request body as a string. MUST be the raw
 *                        text Stripe signed — re-stringifying parsed JSON will
 *                        not match.
 * @param header          The `Stripe-Signature` header value.
 * @param secret          The webhook signing secret (whsec_…).
 * @param nowSeconds      Current time (seconds since epoch). Injectable for tests.
 * @param toleranceSeconds Maximum allowed |now - t|. Default 300s (Stripe default).
 */
export function verifyStripeSignature(opts: {
  rawBody: string;
  header: string | undefined | null;
  secret: string;
  nowSeconds: number;
  toleranceSeconds?: number;
}): SignatureVerifyResult {
  const tolerance = opts.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  const parsed = parseStripeSignatureHeader(opts.header);
  if (!parsed) return { ok: false, reason: "MALFORMED_HEADER" };
  if (parsed.v1.length === 0) return { ok: false, reason: "MISSING_SIGNATURE" };

  const skew = Math.abs(opts.nowSeconds - parsed.timestamp);
  if (skew > tolerance) return { ok: false, reason: "TIMESTAMP_OUT_OF_TOLERANCE" };

  const expected = computeExpectedSignature(opts.rawBody, parsed.timestamp, opts.secret);
  const expectedBuf = Buffer.from(expected, "utf8");

  for (const candidate of parsed.v1) {
    if (candidate.length !== expected.length) continue;
    const candidateBuf = Buffer.from(candidate, "utf8");
    if (timingSafeEqual(candidateBuf, expectedBuf)) {
      return { ok: true, timestamp: parsed.timestamp };
    }
  }
  return { ok: false, reason: "SIGNATURE_MISMATCH" };
}
