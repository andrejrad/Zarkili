/**
 * Payout service — admin payout history, pending balance, and schedule management.
 *
 * Payout records are synced from Stripe by Cloud Functions on
 * payout.created / payout.paid / payout.failed / payout.canceled events
 * and stored under:
 *   tenants/{tenantId}/payouts/{payoutId}
 *
 * The payout schedule is stored on the Connect account record and updated
 * via `connectService.setPayoutSchedule`.
 */

import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export type PayoutStatus =
  | "pending"
  | "in_transit"
  | "paid"
  | "failed"
  | "canceled";

export type Payout = {
  payoutId: string;
  tenantId: string;
  stripePayoutId: string;
  status: PayoutStatus;
  /** Amount in cents. */
  amountCents: number;
  currency: string;
  /** Estimated arrival date (date string YYYY-MM-DD). */
  arrivalDate: string;
  /** Failure message from Stripe. null unless status === 'failed'. */
  failureMessage: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type PayoutScheduleInterval = "daily" | "weekly" | "monthly" | "manual";

export type PayoutSchedule = {
  interval: PayoutScheduleInterval;
  /** Day of week anchor for weekly payouts (1=Mon … 7=Sun). null for other intervals. */
  weeklyAnchorDay: number | null;
  /** Day of month anchor (1–28) for monthly payouts. null for other intervals. */
  monthlyAnchorDay: number | null;
  /**
   * Minimum delay in business days before funds become available for payout.
   * Stripe default is 2 for US express accounts.
   */
  delayDays: number;
};

export type PendingBalance = {
  /** Amount in cents available immediately. */
  availableCents: number;
  /** Amount in cents pending (not yet available). */
  pendingCents: number;
  currency: string;
};

// ---------------------------------------------------------------------------
// Service surface
// ---------------------------------------------------------------------------

export type PayoutService = {
  listPayouts(tenantId: string, limit?: number): Promise<Payout[]>;
  getPendingBalance(tenantId: string): Promise<PendingBalance | null>;
  getPayoutSchedule(tenantId: string): Promise<PayoutSchedule | null>;
  setPayoutSchedule(tenantId: string, schedule: PayoutSchedule): Promise<void>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPayoutService(): PayoutService {
  async function listPayouts(tenantId: string, _limit = 20): Promise<Payout[]> {
    // Phase 3 W39: wired to real Firestore via Cloud Function sync.
    // Cloud Function: `onStripePayoutWebhook`.
    void tenantId;
    return [];
  }

  async function getPendingBalance(tenantId: string): Promise<PendingBalance | null> {
    // Fetched from Stripe Balance API via a secure Cloud Function call.
    // Real wiring: calls `getStripeBalance` Cloud Function which reads
    // the Connect account's balance and returns it.
    void tenantId;
    return null;
  }

  async function getPayoutSchedule(tenantId: string): Promise<PayoutSchedule | null> {
    void tenantId;
    return null;
  }

  async function setPayoutSchedule(tenantId: string, schedule: PayoutSchedule): Promise<void> {
    // Calls `setStripePayoutSchedule` Cloud Function.
    void tenantId;
    void schedule;
  }

  return { listPayouts, getPendingBalance, getPayoutSchedule, setPayoutSchedule };
}
