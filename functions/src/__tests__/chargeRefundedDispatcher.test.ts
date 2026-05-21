/**
 * chargeRefundedDispatcher.test.ts — W38-DEBT-4
 *
 * Unit tests for the charge.refunded branch in applyPaymentEvent.
 * Covers the dispatcher + writeRefund interaction.
 *
 * Also covers BUG-3 fix: updateChargeByIntentId must NOT throw when no charge
 * doc exists (appointment PIs fire payment_intent.succeeded on connected-account
 * webhook which shares the platform handler — no charges/ doc exists for them).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { applyPaymentEvent, createAdminPaymentsRepository, type AdminPaymentsRepository } from "../stripe/paymentsWebhookDispatcher.js";
import type { ParsedPaymentEvent } from "../stripe/parseEvent.js";

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
    markPaymentMethodEventProcessed: vi.fn(async () => {}) as AdminPaymentsRepository["markPaymentMethodEventProcessed"],
    hasProcessedTenantEvent: vi.fn(async () => false) as AdminPaymentsRepository["hasProcessedTenantEvent"],
    upsertPaymentMethod: vi.fn(async () => {}) as AdminPaymentsRepository["upsertPaymentMethod"],
    deletePaymentMethod: vi.fn(async () => {}) as AdminPaymentsRepository["deletePaymentMethod"],
    updateChargeByIntentId: vi.fn(async () => {}) as AdminPaymentsRepository["updateChargeByIntentId"],
    writeRefund: vi.fn(async () => {}) as AdminPaymentsRepository["writeRefund"],
    updateAppointmentPaymentByIntentId: vi.fn(async () => {}) as AdminPaymentsRepository["updateAppointmentPaymentByIntentId"],
    handleSetupIntentSucceeded: vi.fn(async () => {}) as AdminPaymentsRepository["handleSetupIntentSucceeded"],
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
    expect(repo.writeRefund).toHaveBeenCalledWith("t1", "re_abc123", "issued", null, "evt_refund_001");
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

  it("returns 'duplicate' when tenant event already processed", async () => {
    vi.mocked(repo.hasProcessedTenantEvent).mockResolvedValueOnce(true);
    const event = makeChargeRefundedEvent();
    const result = await applyPaymentEvent(event, { payments: repo });

    expect(result.outcome).toBe("duplicate");
    expect(repo.writeRefund).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// BUG-3 fix: updateChargeByIntentId must not throw when charge doc is absent
// (appointment PIs don't have charges/ docs; platform webhook receives their
// payment_intent.succeeded events from connected accounts)
// ---------------------------------------------------------------------------

describe("createAdminPaymentsRepository — updateChargeByIntentId with missing charge doc (BUG-3 fix)", () => {
  function makeFakeDb() {
    const docs = new Map<string, Record<string, unknown>>();
    const sets: Array<{ path: string; data: Record<string, unknown> }> = [];

    function docRef(path: string) {
      return {
        get: vi.fn(async () => ({ exists: docs.has(path), data: () => docs.get(path) })),
        set: vi.fn(async (data: Record<string, unknown>) => {
          docs.set(path, data);
          sets.push({ path, data });
        }),
        update: vi.fn(async (data: Record<string, unknown>) => {
          docs.set(path, { ...(docs.get(path) ?? {}), ...data });
        }),
        ref: { update: vi.fn() },
      };
    }

    // batch mock
    const batchOps: Array<{ op: string; path: string; data: Record<string, unknown> }> = [];
    const batch = {
      update: vi.fn((ref: { path?: string }, data: Record<string, unknown>) => {
        batchOps.push({ op: "update", path: ref?.path ?? "", data });
      }),
      set: vi.fn((ref: { path?: string }, data: Record<string, unknown>) => {
        batchOps.push({ op: "set", path: ref?.path ?? "", data });
      }),
      commit: vi.fn(async () => undefined),
    };

    return {
      doc: vi.fn((path: string) => ({ ...docRef(path), path })),
      collection: vi.fn((colPath: string) => ({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        // Return empty snapshot by default (no charge doc)
        get: vi.fn(async () => ({
          empty: true,
          docs: [],
        })),
      })),
      batch: vi.fn(() => batch),
      _sets: sets,
      _batchOps: batchOps,
    };
  }

  it("writes idempotency record and returns without throwing when no charge doc exists", async () => {
    const db = makeFakeDb();
    const repo = createAdminPaymentsRepository(db as never);

    // Should not throw even though charges/ collection is empty
    await expect(
      repo.updateChargeByIntentId("t1", "pi_appointment_123", "captured", null, null, "evt_pi_succeeded_001"),
    ).resolves.toBeUndefined();

    // Idempotency record must be written
    const idempCall = db._sets.find((s) => s.path.includes("paymentsWebhookIdempotency"));
    expect(idempCall).toBeDefined();
    expect(idempCall?.path).toContain("evt_pi_succeeded_001");
  });
});

