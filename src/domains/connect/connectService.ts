/**
 * Connect service — onboarding + webhook event application + state-machine enforcement.
 *
 * Responsibilities:
 *   1. Onboard a tenant Connect account (initial record + Stripe acct id link).
 *   2. Idempotently apply account.updated and payout.failed events.
 *   3. Derive ConnectStatus from Stripe account snapshot fields.
 *   4. Reject illegal status transitions before persisting.
 *   5. Track payout failure history (timestamp + reason) for admin visibility.
 *
 * All Firestore I/O is delegated to ConnectRepository.
 */

import type { Timestamp } from "firebase/firestore";

import {
  ConnectError,
  deriveConnectStatusFromAccount,
  isValidConnectTransition,
  type ConnectAccount,
  type ConnectAccountType,
  type ConnectStatus,
  type StripeConnectEvent,
  type TaxFormType,
} from "./model";
import type { ConnectRepository } from "./repository";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type ApplyConnectOutcome = "applied" | "duplicate" | "ignored";

export type ApplyConnectEventResult = {
  outcome: ApplyConnectOutcome;
  account: ConnectAccount | null;
  fromStatus: ConnectStatus | null;
  toStatus: ConnectStatus | null;
};

export type OnboardAccountInput = {
  tenantId: string;
  country: string;
  /** Defaults to "express" for US per US_PRIMARY_MARKET_ADDENDUM. */
  accountType?: ConnectAccountType;
  /** Stripe acct_… created by Cloud Function before this is called. */
  stripeAccountId: string;
  /**
   * Tax form captured at onboarding. Required for US salons:
   * w9 for US persons, w8ben for foreign owners. null permitted only for
   * non-US salons until country-specific rules are added.
   */
  taxFormType: TaxFormType | null;
};

// ---------------------------------------------------------------------------
// Service surface
// ---------------------------------------------------------------------------

export type ConnectService = {
  onboardAccount(input: OnboardAccountInput): Promise<ConnectAccount>;
  applyAccountEvent(event: StripeConnectEvent): Promise<ApplyConnectEventResult>;
  getAccount(tenantId: string): Promise<ConnectAccount | null>;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function buildInitialAccount(
  input: OnboardAccountInput,
  now: Timestamp,
): ConnectAccount {
  // US salons require a tax form on file before reaching active. We accept
  // pending_verification at onboarding regardless; service re-derives on
  // each account.updated event.
  if (input.country === "US" && input.taxFormType === null) {
    throw new ConnectError(
      "TAX_FORM_REQUIRED",
      "US salons must submit W-9 (US persons) or W-8BEN (foreign owners) at onboarding",
    );
  }

  return {
    tenantId: input.tenantId,
    stripeAccountId: input.stripeAccountId,
    accountType: input.accountType ?? (input.country === "US" ? "express" : "express"),
    country: input.country,
    status: "pending_verification",
    payoutsEnabled: false,
    chargesEnabled: false,
    detailsSubmitted: false,
    taxFormType: input.taxFormType,
    taxFormCapturedAt: input.taxFormType ? now : null,
    eligible1099K: false,
    lastPayoutFailureAt: null,
    lastPayoutFailureReason: null,
    restrictionReasons: [],
    lastEventId: null,
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createConnectService(
  repository: ConnectRepository,
  options?: { now?: () => Timestamp },
): ConnectService {
  const now = options?.now ?? defaultNow;

  async function onboardAccount(input: OnboardAccountInput): Promise<ConnectAccount> {
    const account = buildInitialAccount(input, now());
    await repository.saveAccount(account);
    return account;
  }

  async function applyAccountEvent(
    event: StripeConnectEvent,
  ): Promise<ApplyConnectEventResult> {
    if (!event.id) {
      throw new ConnectError("MISSING_PAYLOAD", "Webhook event id is required");
    }
    if (!event.tenantId) {
      throw new ConnectError("MISSING_PAYLOAD", "Webhook event tenantId is required");
    }

    if (await repository.hasProcessedEvent(event.tenantId, event.id)) {
      const existing = await repository.getAccount(event.tenantId);
      return {
        outcome: "duplicate",
        account: existing,
        fromStatus: existing?.status ?? null,
        toStatus: existing?.status ?? null,
      };
    }

    const existing = await repository.getAccount(event.tenantId);
    if (!existing) {
      throw new ConnectError(
        "ACCOUNT_NOT_FOUND",
        `No connect account exists for tenant ${event.tenantId}; call onboardAccount first`,
      );
    }
    if (existing.tenantId !== event.tenantId) {
      throw new ConnectError(
        "TENANT_MISMATCH",
        `Connect account tenantId ${existing.tenantId} does not match event tenantId ${event.tenantId}`,
      );
    }

    const ts = now();

    switch (event.type) {
      case "account.updated": {
        if (!event.account) {
          throw new ConnectError("MISSING_PAYLOAD", "account.updated requires account payload");
        }
        const targetStatus = deriveConnectStatusFromAccount(event.account);
        if (!isValidConnectTransition(existing.status, targetStatus)) {
          throw new ConnectError(
            "INVALID_TRANSITION",
            `Illegal connect transition: ${existing.status} → ${targetStatus}`,
          );
        }
        const next: ConnectAccount = {
          ...existing,
          stripeAccountId: event.account.stripeAccountId,
          chargesEnabled: event.account.chargesEnabled,
          payoutsEnabled: event.account.payoutsEnabled,
          detailsSubmitted: event.account.detailsSubmitted,
          status: targetStatus,
          restrictionReasons:
            targetStatus === "restricted"
              ? dedupeReasons([
                  ...event.account.requirementsCurrentlyDue,
                  ...(event.account.disabledReason ? [event.account.disabledReason] : []),
                ])
              : event.account.requirementsCurrentlyDue.length > 0
                ? dedupeReasons(event.account.requirementsCurrentlyDue)
                : [],
          lastEventId: event.id,
          updatedAt: ts,
        };
        await repository.saveAccountWithIdempotency(next, event.id);
        return {
          outcome: "applied",
          account: next,
          fromStatus: existing.status,
          toStatus: targetStatus,
        };
      }

      case "payout.failed": {
        if (!event.payout) {
          throw new ConnectError("MISSING_PAYLOAD", "payout.failed requires payout payload");
        }
        const next: ConnectAccount = {
          ...existing,
          lastPayoutFailureAt: ts,
          lastPayoutFailureReason:
            event.payout.failureMessage ?? event.payout.failureCode ?? "unknown",
          lastEventId: event.id,
          updatedAt: ts,
        };
        await repository.saveAccountWithIdempotency(next, event.id);
        return {
          outcome: "applied",
          account: next,
          fromStatus: existing.status,
          toStatus: existing.status,
        };
      }

      case "payout.paid": {
        // Informational — record idempotency, no state change.
        await repository.recordProcessedEvent(event.tenantId, event.id);
        return {
          outcome: "ignored",
          account: existing,
          fromStatus: existing.status,
          toStatus: existing.status,
        };
      }

      default:
        await repository.recordProcessedEvent(event.tenantId, event.id);
        return {
          outcome: "ignored",
          account: existing,
          fromStatus: existing.status,
          toStatus: existing.status,
        };
    }
  }

  function getAccount(tenantId: string): Promise<ConnectAccount | null> {
    return repository.getAccount(tenantId);
  }

  return { onboardAccount, applyAccountEvent, getAccount };
}

function dedupeReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter((r) => r.length > 0)));
}

function defaultNow(): Timestamp {
  const seconds = Math.floor(Date.now() / 1000);
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}
