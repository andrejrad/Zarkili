import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Connect status surface
// ---------------------------------------------------------------------------
//
//   not_started          — account record exists but no Stripe account linked
//   pending_verification — Stripe account created; details/docs outstanding
//   active               — charges + payouts enabled
//   restricted           — Stripe disabled charges or payouts (recoverable)
//

export type ConnectStatus =
  | "not_started"
  | "pending_verification"
  | "active"
  | "restricted";

export const CONNECT_STATUSES: readonly ConnectStatus[] = [
  "not_started",
  "pending_verification",
  "active",
  "restricted",
] as const;

// ---------------------------------------------------------------------------
// Account type and tax forms
// ---------------------------------------------------------------------------
//
// US default is "express" per US_PRIMARY_MARKET_ADDENDUM.md. EU salons use
// Stripe defaults for their region; recorded but not coerced here.
//

export type ConnectAccountType = "express" | "standard";

export type TaxFormType = "w9" | "w8ben";

// ---------------------------------------------------------------------------
// Connect account record (singleton per tenant)
// ---------------------------------------------------------------------------

export type ConnectAccount = {
  tenantId: string;
  /** Stripe Connect account id (acct_…). null until onboarding starts. */
  stripeAccountId: string | null;
  accountType: ConnectAccountType;
  /** ISO 3166-1 alpha-2 country (e.g. "US", "FR"). */
  country: string;
  status: ConnectStatus;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  /**
   * Tax form on file. US persons must submit W-9; foreign owners W-8BEN.
   * null = none on file (required before active for US salons).
   */
  taxFormType: TaxFormType | null;
  taxFormCapturedAt: Timestamp | null;
  /**
   * 1099-K eligibility flag for US salons. True once gross >= $20k AND
   * 200 transactions in calendar year (current US §6050W threshold).
   */
  eligible1099K: boolean;
  lastPayoutFailureAt: Timestamp | null;
  lastPayoutFailureReason: string | null;
  /**
   * Stripe `requirements.currently_due` codes that put the account in
   * pending_verification or restricted. Empty when active.
   */
  restrictionReasons: string[];
  /** Last applied Stripe webhook event id (for audit). */
  lastEventId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Webhook event surface
// ---------------------------------------------------------------------------

export type StripeConnectEventType =
  | "account.updated"
  | "payout.failed"
  | "payout.paid";

export type StripeAccountPayload = {
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  /** Stripe `requirements.currently_due` array. */
  requirementsCurrentlyDue: string[];
  /** Stripe `requirements.disabled_reason` (when charges disabled). */
  disabledReason: string | null;
};

export type StripePayoutPayload = {
  stripeAccountId: string;
  payoutId: string;
  failureCode: string | null;
  failureMessage: string | null;
};

export type StripeConnectEvent = {
  /** Stripe event id (evt_…). Used as idempotency key. */
  id: string;
  type: StripeConnectEventType;
  tenantId: string;
  account?: StripeAccountPayload;
  payout?: StripePayoutPayload;
};

// ---------------------------------------------------------------------------
// Status derivation
// ---------------------------------------------------------------------------

/**
 * Derive the canonical ConnectStatus from a Stripe account snapshot.
 *
 * Precedence:
 *   - charges OR payouts disabled AND details_submitted          → restricted
 *   - charges + payouts enabled AND no requirements currently_due → active
 *   - otherwise                                                  → pending_verification
 */
export function deriveConnectStatusFromAccount(account: StripeAccountPayload): ConnectStatus {
  const noOutstanding = account.requirementsCurrentlyDue.length === 0;
  if (account.chargesEnabled && account.payoutsEnabled && noOutstanding) {
    return "active";
  }
  if (account.detailsSubmitted && (!account.chargesEnabled || !account.payoutsEnabled)) {
    return "restricted";
  }
  return "pending_verification";
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------
//
// Allowed transitions:
//   not_started          → pending_verification, restricted
//   pending_verification → pending_verification, active, restricted
//   active               → active, restricted
//   restricted           → restricted, pending_verification, active
//

const ALLOWED_TRANSITIONS: Record<ConnectStatus, readonly ConnectStatus[]> = {
  not_started: ["not_started", "pending_verification", "restricted"],
  pending_verification: ["pending_verification", "active", "restricted"],
  active: ["active", "restricted"],
  restricted: ["restricted", "pending_verification", "active"],
};

export function isValidConnectTransition(from: ConnectStatus, to: ConnectStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type ConnectErrorCode =
  | "INVALID_TRANSITION"
  | "MISSING_PAYLOAD"
  | "TENANT_MISMATCH"
  | "ACCOUNT_NOT_FOUND"
  | "TAX_FORM_REQUIRED";

export class ConnectError extends Error {
  constructor(
    public readonly code: ConnectErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ConnectError";
  }
}
