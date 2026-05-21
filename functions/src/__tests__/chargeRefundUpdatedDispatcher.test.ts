/**
 * chargeRefundUpdatedDispatcher.test.ts
 *
 * Unit tests for the charge.refund.updated branch in applyPaymentEvent (CRIT-B).
 * Covers: denied refund dispatching, idempotency, ignored non-failure updates.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { applyPaymentEvent, type AdminPaymentsRepository } from "../stripe/paymentsWebhookDispatcher.js";
import type { ParsedPaymentEvent } from "../stripe/parseEvent.js";

// ---------------------------------------------------------------------------
// Mock repository factory
// ---------------------------------------------------------------------------

function makeRepo(): AdminPaymentsRepository {
  return {
    hasProcessedEvent: vi.fn(async () => false),
    markPaymentMethodEventProcessed: vi.fn(async () => {}),
    hasProcessedTenantEvent: vi.fn(async () => false),
    upsertPaymentMethod: vi.fn(async () => {}),
    deletePaymentMethod: vi.fn(async () => {}),
    updateChargeByIntentId: vi.fn(async () => {}),
    writeRefund: vi.fn(async () => {}),
    updateAppointmentPaymentByIntentId: vi.fn(async () => {}),
    handleSetupIntentSucceeded: vi.fn(async () => {}),
  } as unknown as AdminPaymentsRepository;
}

// ---------------------------------------------------------------------------
// Event factory helpers
// ---------------------------------------------------------------------------

function makeRefundUpdatedEvent(
  overrides: Partial<NonNullable<ParsedPaymentEvent["chargeRefundDenied"]>> = {},
): ParsedPaymentEvent {
  return {
    id: "evt_refund_upd_001",
    type: "charge.refund.updated",
    chargeRefundDenied: {
      tenantId: "t1",
      stripeRefundId: "re_abc123",
      failureCode: "insufficient_funds",
      ...overrides,
    },
  };
}

/** A charge.refund.updated event for a non-failed update (e.g., status = "succeeded"). */
function makeRefundSucceededUpdateEvent(): ParsedPaymentEvent {
  return {
    id: "evt_refund_upd_002",
    type: "charge.refund.updated",
    // chargeRefundDenied is absent because refund didn't fail
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("applyPaymentEvent — charge.refund.updated", () => {
  let repo: AdminPaymentsRepository;

  beforeEach(() => {
    repo = makeRepo();
  });

  // ------------------------------------------------------------------
  it("calls writeRefund with 'denied' + failureCode when refund failed", async () => {
    const event = makeRefundUpdatedEvent({ failureCode: "insufficient_funds" });
    const result = await applyPaymentEvent(event, { payments: repo });

    expect(result.outcome).toBe("applied");
    expect(repo.writeRefund).toHaveBeenCalledOnce();
    expect(repo.writeRefund).toHaveBeenCalledWith(
      "t1",
      "re_abc123",
      "denied",
      "insufficient_funds",
      "evt_refund_upd_001",
    );
  });

  // ------------------------------------------------------------------
  it("passes null failureCode through when failure reason is absent", async () => {
    const event = makeRefundUpdatedEvent({ failureCode: null });
    const result = await applyPaymentEvent(event, { payments: repo });

    expect(result.outcome).toBe("applied");
    expect(repo.writeRefund).toHaveBeenCalledWith(
      "t1",
      "re_abc123",
      "denied",
      null,
      "evt_refund_upd_001",
    );
  });

  // ------------------------------------------------------------------
  it("returns 'ignored' when chargeRefundDenied payload is absent (non-failed update)", async () => {
    const event = makeRefundSucceededUpdateEvent();
    const result = await applyPaymentEvent(event, { payments: repo });

    expect(result.outcome).toBe("ignored");
    expect(repo.writeRefund).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  it("returns 'ignored' when tenantId is empty", async () => {
    const event = makeRefundUpdatedEvent({ tenantId: "" });
    const result = await applyPaymentEvent(event, { payments: repo });

    expect(result.outcome).toBe("ignored");
    expect(repo.writeRefund).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  it("returns 'ignored' when stripeRefundId is empty", async () => {
    const event = makeRefundUpdatedEvent({ stripeRefundId: "" });
    const result = await applyPaymentEvent(event, { payments: repo });

    expect(result.outcome).toBe("ignored");
    expect(repo.writeRefund).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  it("returns 'duplicate' when event has already been processed for that tenant", async () => {
    vi.mocked(repo.hasProcessedTenantEvent).mockResolvedValueOnce(true);
    const event = makeRefundUpdatedEvent();
    const result = await applyPaymentEvent(event, { payments: repo });

    expect(result.outcome).toBe("duplicate");
    expect(repo.writeRefund).not.toHaveBeenCalled();
  });
});
