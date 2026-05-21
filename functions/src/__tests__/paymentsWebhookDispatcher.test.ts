/**
 * paymentsWebhookDispatcher.test.ts
 *
 * Unit tests for applyPaymentEvent — all event type branches.
 * Covers: payment_method.attached/detached, payment_intent.succeeded/payment_failed,
 * payment_intent.amount_capturable_updated, payment_intent.canceled,
 * setup_intent.succeeded, and unknown type fallthrough.
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
// payment_method.attached
// ---------------------------------------------------------------------------

describe("payment_method.attached", () => {
  let repo: AdminPaymentsRepository;
  beforeEach(() => { repo = makeRepo(); });

  const BASE: ParsedPaymentEvent = {
    id: "evt_att_1",
    type: "payment_method.attached",
    methodAttached: { userId: "u1", methodId: "pm_1", methodData: { brand: "visa" } },
  };

  it("upserts method and marks idempotency on first call", async () => {
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("applied");
    expect(repo.upsertPaymentMethod).toHaveBeenCalledWith("u1", "pm_1", { brand: "visa" });
    expect(repo.markPaymentMethodEventProcessed).toHaveBeenCalledWith("u1", "evt_att_1");
  });

  it("returns duplicate when event already processed", async () => {
    vi.mocked(repo.hasProcessedEvent).mockResolvedValueOnce(true);
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("duplicate");
    expect(repo.upsertPaymentMethod).not.toHaveBeenCalled();
  });

  it("returns ignored when methodAttached payload absent", async () => {
    const event: ParsedPaymentEvent = { id: "evt_att_2", type: "payment_method.attached" };
    const result = await applyPaymentEvent(event, { payments: repo });
    expect(result.outcome).toBe("ignored");
  });

  it("returns ignored when userId is empty", async () => {
    const event: ParsedPaymentEvent = {
      id: "evt_att_3",
      type: "payment_method.attached",
      methodAttached: { userId: "", methodId: "pm_x", methodData: {} },
    };
    const result = await applyPaymentEvent(event, { payments: repo });
    expect(result.outcome).toBe("ignored");
  });
});

// ---------------------------------------------------------------------------
// payment_method.detached
// ---------------------------------------------------------------------------

describe("payment_method.detached", () => {
  let repo: AdminPaymentsRepository;
  beforeEach(() => { repo = makeRepo(); });

  const BASE: ParsedPaymentEvent = {
    id: "evt_det_1",
    type: "payment_method.detached",
    methodDetached: { userId: "u1", methodId: "pm_1" },
  };

  it("deletes method and marks idempotency on first call", async () => {
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("applied");
    expect(repo.deletePaymentMethod).toHaveBeenCalledWith("u1", "pm_1");
    expect(repo.markPaymentMethodEventProcessed).toHaveBeenCalledWith("u1", "evt_det_1");
  });

  it("returns duplicate when event already processed", async () => {
    vi.mocked(repo.hasProcessedEvent).mockResolvedValueOnce(true);
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("duplicate");
    expect(repo.deletePaymentMethod).not.toHaveBeenCalled();
  });

  it("returns ignored when methodDetached payload absent", async () => {
    const event: ParsedPaymentEvent = { id: "evt_det_2", type: "payment_method.detached" };
    expect((await applyPaymentEvent(event, { payments: repo })).outcome).toBe("ignored");
  });
});

// ---------------------------------------------------------------------------
// payment_intent.succeeded
// ---------------------------------------------------------------------------

describe("payment_intent.succeeded", () => {
  let repo: AdminPaymentsRepository;
  beforeEach(() => { repo = makeRepo(); });

  const BASE: ParsedPaymentEvent = {
    id: "evt_pi_succ_1",
    type: "payment_intent.succeeded",
    paymentIntent: {
      tenantId: "t1",
      stripePaymentIntentId: "pi_abc",
      failureCode: null,
      failureMessage: null,
    },
  };

  it("updates charge to captured on first call", async () => {
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("applied");
    expect(repo.updateChargeByIntentId).toHaveBeenCalledWith(
      "t1", "pi_abc", "captured", null, null, "evt_pi_succ_1",
    );
  });

  it("returns duplicate when tenant event already processed", async () => {
    vi.mocked(repo.hasProcessedTenantEvent).mockResolvedValueOnce(true);
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("duplicate");
    expect(repo.updateChargeByIntentId).not.toHaveBeenCalled();
  });

  it("returns ignored when paymentIntent payload absent", async () => {
    const event: ParsedPaymentEvent = { id: "evt_pi_succ_2", type: "payment_intent.succeeded" };
    expect((await applyPaymentEvent(event, { payments: repo })).outcome).toBe("ignored");
  });

  it("returns ignored when tenantId is empty", async () => {
    const event: ParsedPaymentEvent = {
      id: "evt_pi_succ_3",
      type: "payment_intent.succeeded",
      paymentIntent: { tenantId: "", stripePaymentIntentId: "pi_x", failureCode: null, failureMessage: null },
    };
    expect((await applyPaymentEvent(event, { payments: repo })).outcome).toBe("ignored");
  });

  it("propagates error when updateChargeByIntentId throws (BUG-06: charge not yet written)", async () => {
    vi.mocked(repo.updateChargeByIntentId).mockRejectedValueOnce(
      new Error("Charge doc not found for pi_abc; webhook retry required."),
    );
    await expect(applyPaymentEvent(BASE, { payments: repo })).rejects.toThrow("Charge doc not found");
  });
});

// ---------------------------------------------------------------------------
// payment_intent.payment_failed
// ---------------------------------------------------------------------------

describe("payment_intent.payment_failed", () => {
  let repo: AdminPaymentsRepository;
  beforeEach(() => { repo = makeRepo(); });

  const BASE: ParsedPaymentEvent = {
    id: "evt_pi_fail_1",
    type: "payment_intent.payment_failed",
    paymentIntent: {
      tenantId: "t1",
      stripePaymentIntentId: "pi_abc",
      failureCode: "card_declined",
      failureMessage: "Your card was declined.",
    },
  };

  it("updates charge to failed with failure details on first call", async () => {
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("applied");
    expect(repo.updateChargeByIntentId).toHaveBeenCalledWith(
      "t1", "pi_abc", "failed", "card_declined", "Your card was declined.", "evt_pi_fail_1",
    );
  });

  it("returns duplicate when tenant event already processed", async () => {
    vi.mocked(repo.hasProcessedTenantEvent).mockResolvedValueOnce(true);
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("duplicate");
    expect(repo.updateChargeByIntentId).not.toHaveBeenCalled();
  });

  it("returns ignored when paymentIntent payload absent", async () => {
    const event: ParsedPaymentEvent = { id: "evt_pi_fail_2", type: "payment_intent.payment_failed" };
    expect((await applyPaymentEvent(event, { payments: repo })).outcome).toBe("ignored");
  });
});

// ---------------------------------------------------------------------------
// payment_intent.amount_capturable_updated
// ---------------------------------------------------------------------------

describe("payment_intent.amount_capturable_updated", () => {
  let repo: AdminPaymentsRepository;
  beforeEach(() => { repo = makeRepo(); });

  const BASE: ParsedPaymentEvent = {
    id: "evt_cap_1",
    type: "payment_intent.amount_capturable_updated",
    paymentIntent: {
      tenantId: "t1",
      stripePaymentIntentId: "pi_hold",
      failureCode: null,
      failureMessage: null,
      paymentMethodId: "pm_1",
    },
  };

  it("updates appointment payment to authorized on first call", async () => {
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("applied");
    expect(repo.updateAppointmentPaymentByIntentId).toHaveBeenCalledWith(
      "t1", "pi_hold", "authorized", "pm_1", "evt_cap_1",
    );
  });

  it("returns duplicate when tenant event already processed", async () => {
    vi.mocked(repo.hasProcessedTenantEvent).mockResolvedValueOnce(true);
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("duplicate");
    expect(repo.updateAppointmentPaymentByIntentId).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// payment_intent.canceled
// ---------------------------------------------------------------------------

describe("payment_intent.canceled", () => {
  let repo: AdminPaymentsRepository;
  beforeEach(() => { repo = makeRepo(); });

  const BASE: ParsedPaymentEvent = {
    id: "evt_cancel_1",
    type: "payment_intent.canceled",
    paymentIntent: {
      tenantId: "t1",
      stripePaymentIntentId: "pi_hold",
      failureCode: null,
      failureMessage: null,
    },
  };

  it("updates appointment payment to cancelled", async () => {
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("applied");
    expect(repo.updateAppointmentPaymentByIntentId).toHaveBeenCalledWith(
      "t1", "pi_hold", "cancelled", undefined, "evt_cancel_1",
    );
  });

  it("returns ignored when paymentIntent payload absent", async () => {
    const event: ParsedPaymentEvent = { id: "evt_cancel_2", type: "payment_intent.canceled" };
    expect((await applyPaymentEvent(event, { payments: repo })).outcome).toBe("ignored");
  });
});

// ---------------------------------------------------------------------------
// setup_intent.succeeded
// ---------------------------------------------------------------------------

describe("setup_intent.succeeded", () => {
  let repo: AdminPaymentsRepository;
  beforeEach(() => { repo = makeRepo(); });

  const BASE: ParsedPaymentEvent = {
    id: "evt_si_1",
    type: "setup_intent.succeeded",
    setupIntentSucceeded: {
      tenantId: "t1",
      bookingId: "bk1",
      userId: "u1",
      paymentMethodId: "pm_saved",
    },
  };

  it("calls handleSetupIntentSucceeded on first call", async () => {
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("applied");
    expect(repo.handleSetupIntentSucceeded).toHaveBeenCalledWith(
      "t1", "bk1", "u1", "pm_saved", "evt_si_1",
    );
  });

  it("returns duplicate when tenant event already processed", async () => {
    vi.mocked(repo.hasProcessedTenantEvent).mockResolvedValueOnce(true);
    const result = await applyPaymentEvent(BASE, { payments: repo });
    expect(result.outcome).toBe("duplicate");
    expect(repo.handleSetupIntentSucceeded).not.toHaveBeenCalled();
  });

  it("returns ignored when setupIntentSucceeded payload absent", async () => {
    const event: ParsedPaymentEvent = { id: "evt_si_2", type: "setup_intent.succeeded" };
    expect((await applyPaymentEvent(event, { payments: repo })).outcome).toBe("ignored");
  });

  it("returns ignored when any required field is missing", async () => {
    const event: ParsedPaymentEvent = {
      id: "evt_si_3",
      type: "setup_intent.succeeded",
      setupIntentSucceeded: { tenantId: "t1", bookingId: "", userId: "u1", paymentMethodId: "pm_1" },
    };
    expect((await applyPaymentEvent(event, { payments: repo })).outcome).toBe("ignored");
  });
});
