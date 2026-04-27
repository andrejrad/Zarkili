/**
 * functions/src/stripe/connectDispatcher.ts (W13-DEBT-1)
 *
 * Pure mapper: (current ConnectAccount | null, ParsedConnectEvent) → next ConnectAccount.
 * Mirrors the relevant rules from `src/domains/connect/connectService.ts`.
 */

import type { ParsedConnectEvent } from "./parseEvent.js";

type LocalTimestamp = { seconds: number; nanoseconds: number };

export type ConnectStatus =
  | "not_started"
  | "pending_verification"
  | "active"
  | "restricted";

export type ConnectAccount = {
  tenantId: string;
  stripeAccountId: string | null;
  accountType: "express" | "standard";
  country: string;
  status: ConnectStatus;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  taxFormType: "w9" | "w8ben" | null;
  taxFormCapturedAt: LocalTimestamp | null;
  eligible1099K: boolean;
  lastPayoutFailureAt: LocalTimestamp | null;
  lastPayoutFailureReason: string | null;
  restrictionReasons: string[];
  lastEventId: string | null;
  createdAt: LocalTimestamp;
  updatedAt: LocalTimestamp;
};

export class ConnectDispatchError extends Error {
  constructor(
    public readonly code:
      | "ACCOUNT_NOT_FOUND"
      | "MISSING_PAYLOAD"
      | "ACCOUNT_MISMATCH",
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "ConnectDispatchError";
  }
}

/**
 * Derive the canonical status from a Stripe account snapshot.
 * Precedence: charges+payouts enabled & no requirements → active;
 *             requirements present → restricted;
 *             otherwise pending_verification.
 */
function deriveStatus(input: {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsCurrentlyDue: string[];
}): ConnectStatus {
  if (
    input.chargesEnabled &&
    input.payoutsEnabled &&
    input.detailsSubmitted &&
    input.requirementsCurrentlyDue.length === 0
  ) {
    return "active";
  }
  if (input.requirementsCurrentlyDue.length > 0) {
    return "restricted";
  }
  return "pending_verification";
}

export type ConnectDispatchResult = {
  outcome: "applied" | "ignored";
  account: ConnectAccount | null;
};

export function applyConnectEvent(
  current: ConnectAccount | null,
  event: ParsedConnectEvent,
  now: LocalTimestamp,
): ConnectDispatchResult {
  if (!current) {
    throw new ConnectDispatchError(
      "ACCOUNT_NOT_FOUND",
      `no connect account on file for tenant ${event.tenantId}`,
    );
  }

  if (event.type === "account.updated") {
    if (!event.account) {
      throw new ConnectDispatchError("MISSING_PAYLOAD", "account payload required");
    }
    if (
      current.stripeAccountId &&
      current.stripeAccountId !== event.account.stripeAccountId
    ) {
      throw new ConnectDispatchError(
        "ACCOUNT_MISMATCH",
        `event account ${event.account.stripeAccountId} ≠ current ${current.stripeAccountId}`,
      );
    }
    const next: ConnectAccount = {
      ...current,
      stripeAccountId: event.account.stripeAccountId,
      chargesEnabled: event.account.chargesEnabled,
      payoutsEnabled: event.account.payoutsEnabled,
      detailsSubmitted: event.account.detailsSubmitted,
      restrictionReasons: [...event.account.requirementsCurrentlyDue],
      status: deriveStatus(event.account),
      lastEventId: event.id,
      updatedAt: now,
    };
    return { outcome: "applied", account: next };
  }

  if (event.type === "payout.failed") {
    if (!event.payout) {
      throw new ConnectDispatchError("MISSING_PAYLOAD", "payout payload required");
    }
    const next: ConnectAccount = {
      ...current,
      lastPayoutFailureAt: now,
      lastPayoutFailureReason:
        event.payout.failureMessage ?? event.payout.failureCode ?? "unknown",
      lastEventId: event.id,
      updatedAt: now,
    };
    return { outcome: "applied", account: next };
  }

  // payout.paid → clear failure state.
  const next: ConnectAccount = {
    ...current,
    lastPayoutFailureAt: null,
    lastPayoutFailureReason: null,
    lastEventId: event.id,
    updatedAt: now,
  };
  return { outcome: "applied", account: next };
}
