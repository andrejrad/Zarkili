/**
 * chargeRefundedDispatcher.test.ts — W38-DEBT-4
 *
 * Unit tests for the charge.refunded branch in applyPaymentEvent.
 * Covers the dispatcher + writeRefund interaction.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { applyPaymentEvent, type AdminPaymentsRepository } from "../../stripe/paymentsWebhookDispatcher.js";
import type { ParsedPaymentEvent } from "../../stripe/parseEvent.js";

// ---------------------------------------------------------------------------
// Mock repository
// ---------------------------------------------------------------------------

function makeRepo(): AdminPaymentsRepository & { calls: Record<string, unknown[][]> } {
  const calls: Record<string, unknown[][]> = {
    writeRefund: [],
    hasProcessedEvent: [],
    upsertPaymentMethod: [],
    deletePaymentMethod: [],
    updateChargeByIntentId: [],
  };

  return {
    calls,
    hasProcessedEvent: vi.fn(async () => false) as AdminPaymentsRepository["hasProcessedEvent"],
    upsertPaymentMethod: vi.fn(async () => {}) as AdminPaymentsRepository["upsertPaymentMethod"],
    deletePaymentMethod: vi.fn(async () => {}) as AdminPaymentsRepository["deletePaymentMethod"],
    updateChargeByIntentId: vi.fn(async () => {}) as AdminPaymentsRepository["updateChargeByIntentId"],
    writeRefund: vi.fn(async () => {}) as AdminPaymentsRepository["writeRefund"],
  };
}

function makeChargeRefundedEvent(overrides: Partial<NonNullable<ParsedPaymentEvent["chargeRefunded"]>> = {}): ParsedPaymentEvent {
  return {
    id: "evt_refund_001",
    type: "charge.refunded",
    chargeRefunded: {
      tenantId: "t1",
      stripeRefundId: "re_abc123",
      amountMinor: 5000,
      ...overrides,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("applyPaymentEvent — charge.refunded", () => {
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
  });

  it("calls writeRefund with tenantId, stripeRefundId, 'issued', null on happy path", async () => {
    const event = makeChargeRefundedEvent();
    const result = await applyPaymentEvent(event, { payments: repo });

    expect(result.outcome).toBe("applied");
    expect(repo.writeRefund).toHaveBeenCalledOnce();
    expect(repo.writeRefund).toHaveBeenCalledWith("t1", "re_abc123", "issued", null);
  });

  it("returns 'ignored' when chargeRefunded payload is missing", async () => {
    const event: ParsedPaymentEvent = {
      id: "evt_002",
      type: "charge.refunded",
      // chargeRefunded omitted
    };
    const result = await applyPaymentEvent(event, { payments: repo });

    expect(result.outcome).toBe("ignored");
    expect(repo.writeRefund).not.toHaveBeenCalled();
  });

  it("returns 'ignored' when tenantId is empty", async () => {
    const event = makeChargeRefundedEvent({ tenantId: "" });
    const result = await applyPaymentEvent(event, { payments: repo });

    expect(result.outcome).toBe("ignored");
    expect(repo.writeRefund).not.toHaveBeenCalled();
  });

  it("returns 'ignored' when stripeRefundId is empty", async () => {
    const event = makeChargeRefundedEvent({ stripeRefundId: "" });
    const result = await applyPaymentEvent(event, { payments: repo });

    expect(result.outcome).toBe("ignored");
    expect(repo.writeRefund).not.toHaveBeenCalled();
  });

  it("does NOT consult hasProcessedEvent (refunds are idempotent via merge)", async () => {
    const event = makeChargeRefundedEvent();
    await applyPaymentEvent(event, { payments: repo });

    expect(repo.hasProcessedEvent).not.toHaveBeenCalled();
  });
});
