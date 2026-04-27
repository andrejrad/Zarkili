/**
 * stripe/verifySignature.test.ts (W13-DEBT-1)
 *
 * Validates Stripe webhook signature verification end-to-end:
 * header parsing, replay-window enforcement, and HMAC equality.
 */

import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";

import {
  computeExpectedSignature,
  parseStripeSignatureHeader,
  verifyStripeSignature,
} from "../../src/stripe/verifySignature";

const SECRET = "whsec_test_super_secret";
const RAW_BODY = '{"id":"evt_1","type":"customer.subscription.updated"}';

function signedHeader(timestamp: number, body: string, secret = SECRET): string {
  const sig = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`, "utf8")
    .digest("hex");
  return `t=${timestamp},v1=${sig}`;
}

describe("parseStripeSignatureHeader", () => {
  it("parses a well-formed header with one v1", () => {
    const out = parseStripeSignatureHeader("t=1700000000,v1=abc123");
    expect(out).toEqual({ timestamp: 1700000000, v1: ["abc123"] });
  });

  it("collects multiple v1 values (key rotation)", () => {
    const out = parseStripeSignatureHeader("t=1700000000,v1=aaa,v1=bbb,v0=ccc");
    expect(out?.v1).toEqual(["aaa", "bbb"]);
  });

  it("returns null for missing/empty header", () => {
    expect(parseStripeSignatureHeader(undefined)).toBeNull();
    expect(parseStripeSignatureHeader(null)).toBeNull();
    expect(parseStripeSignatureHeader("")).toBeNull();
  });

  it("returns null when timestamp is absent", () => {
    expect(parseStripeSignatureHeader("v1=abc")).toBeNull();
  });
});

describe("computeExpectedSignature", () => {
  it("matches an externally computed HMAC-SHA256 hex digest", () => {
    const out = computeExpectedSignature(RAW_BODY, 1700000000, SECRET);
    const reference = createHmac("sha256", SECRET)
      .update(`1700000000.${RAW_BODY}`, "utf8")
      .digest("hex");
    expect(out).toBe(reference);
  });
});

describe("verifyStripeSignature", () => {
  const t = 1700000000;

  it("accepts a correctly signed payload within tolerance", () => {
    const result = verifyStripeSignature({
      rawBody: RAW_BODY,
      header: signedHeader(t, RAW_BODY),
      secret: SECRET,
      nowSeconds: t + 10,
    });
    expect(result.ok).toBe(true);
  });

  it("accepts when one v1 of several matches (key rotation)", () => {
    const realSig = createHmac("sha256", SECRET)
      .update(`${t}.${RAW_BODY}`, "utf8")
      .digest("hex");
    const header = `t=${t},v1=deadbeef,v1=${realSig}`;
    const result = verifyStripeSignature({
      rawBody: RAW_BODY,
      header,
      secret: SECRET,
      nowSeconds: t,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects on malformed header", () => {
    const result = verifyStripeSignature({
      rawBody: RAW_BODY,
      header: "not a header",
      secret: SECRET,
      nowSeconds: t,
    });
    expect(result).toEqual({ ok: false, reason: "MALFORMED_HEADER" });
  });

  it("rejects when the header has no v1 entry", () => {
    const result = verifyStripeSignature({
      rawBody: RAW_BODY,
      header: `t=${t},v0=abc`,
      secret: SECRET,
      nowSeconds: t,
    });
    expect(result).toEqual({ ok: false, reason: "MISSING_SIGNATURE" });
  });

  it("rejects when timestamp is outside the tolerance window (replay)", () => {
    const result = verifyStripeSignature({
      rawBody: RAW_BODY,
      header: signedHeader(t, RAW_BODY),
      secret: SECRET,
      nowSeconds: t + 600, // 10 minutes ahead, default tolerance is 300s
    });
    expect(result).toEqual({ ok: false, reason: "TIMESTAMP_OUT_OF_TOLERANCE" });
  });

  it("rejects when the body has been tampered with", () => {
    const result = verifyStripeSignature({
      rawBody: '{"tampered":true}',
      header: signedHeader(t, RAW_BODY),
      secret: SECRET,
      nowSeconds: t,
    });
    expect(result).toEqual({ ok: false, reason: "SIGNATURE_MISMATCH" });
  });

  it("rejects when signed with a different secret", () => {
    const result = verifyStripeSignature({
      rawBody: RAW_BODY,
      header: signedHeader(t, RAW_BODY, "whsec_wrong"),
      secret: SECRET,
      nowSeconds: t,
    });
    expect(result).toEqual({ ok: false, reason: "SIGNATURE_MISMATCH" });
  });

  it("respects a custom tolerance", () => {
    const result = verifyStripeSignature({
      rawBody: RAW_BODY,
      header: signedHeader(t, RAW_BODY),
      secret: SECRET,
      nowSeconds: t + 60,
      toleranceSeconds: 30,
    });
    expect(result).toEqual({ ok: false, reason: "TIMESTAMP_OUT_OF_TOLERANCE" });
  });
});
