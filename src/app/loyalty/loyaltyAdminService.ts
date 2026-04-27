/**
 * loyaltyAdminService.ts
 *
 * Orchestrates admin-side loyalty operations:
 *   listCustomerLoyaltyOverview — summarise all customers' loyalty state
 *   adjustPoints               — manually credit or debit a customer's points
 *   redeemPointsForCustomer    — apply a redemption option to a customer
 */

import type { LoyaltyRepository } from "../../domains/loyalty/repository";
import type {
  CustomerLoyaltyState,
  LoyaltyTransaction,
  TenantLoyaltyConfig,
} from "../../domains/loyalty/model";
import { LoyaltyError } from "../../domains/loyalty/model";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CustomerLoyaltySummary = {
  userId: string;
  displayName: string;
  points: number;
  lifetimePoints: number;
  currentTierId: string | null;
};

export type AdjustPointsInput = {
  tenantId: string;
  userId: string;
  delta: number; // positive = credit, negative = debit
  reason: string;
  adminId: string;
};

export type AdjustResult =
  | { ok: true; transaction: LoyaltyTransaction }
  | { ok: false; code: string; message: string };

export type RedeemResult =
  | { ok: true; transaction: LoyaltyTransaction }
  | { ok: false; code: string; message: string };

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createLoyaltyAdminService(loyaltyRepository: LoyaltyRepository) {
  /**
   * Return loyalty summaries for a list of customer IDs within a tenant.
   * Customers with no loyalty state are included with 0 points.
   */
  async function listCustomerLoyaltyOverview(
    tenantId: string,
    customerIds: string[],
    displayNameMap: Record<string, string> = {},
  ): Promise<CustomerLoyaltySummary[]> {
    const summaries = await Promise.all(
      customerIds.map(async (userId) => {
        const state = await loyaltyRepository.getCustomerLoyaltyState(userId, tenantId);
        return {
          userId,
          displayName: displayNameMap[userId] ?? userId,
          points: state?.points ?? 0,
          lifetimePoints: state?.lifetimePoints ?? 0,
          currentTierId: state?.currentTierId ?? null,
        };
      }),
    );
    return summaries.sort((a, b) => b.points - a.points);
  }

  /**
   * Manually adjust a customer's points (admin credit or debit).
   */
  async function adjustPoints(input: AdjustPointsInput): Promise<AdjustResult> {
    if (input.delta === 0) {
      return { ok: false, code: "INVALID_POINTS", message: "Delta cannot be zero" };
    }

    const idempotencyKey = `admin_${input.tenantId}_${input.userId}_${input.adminId}_${Date.now()}`;
    const reason = `Admin adjustment: ${input.reason}`;

    try {
      let transaction: LoyaltyTransaction;
      if (input.delta > 0) {
        transaction = await loyaltyRepository.creditPoints(
          input.userId,
          input.tenantId,
          input.delta,
          reason,
          `admin_${input.adminId}`,
          idempotencyKey,
        );
      } else {
        transaction = await loyaltyRepository.debitPoints(
          input.userId,
          input.tenantId,
          Math.abs(input.delta),
          reason,
          `admin_${input.adminId}`,
          idempotencyKey,
        );
      }
      return { ok: true, transaction };
    } catch (err) {
      if (err instanceof LoyaltyError) {
        return { ok: false, code: err.code, message: err.message };
      }
      return { ok: false, code: "ERROR", message: "An unexpected error occurred" };
    }
  }

  /**
   * Redeem a loyalty option for a customer, deducting the required points.
   */
  async function redeemPointsForCustomer(
    tenantId: string,
    userId: string,
    config: TenantLoyaltyConfig,
    optionId: string,
  ): Promise<RedeemResult> {
    const option = config.redemptionOptions.find((o) => o.optionId === optionId);
    if (!option) {
      return { ok: false, code: "OPTION_NOT_FOUND", message: `Redemption option ${optionId} not found` };
    }

    const idempotencyKey = `redeem_${tenantId}_${userId}_${optionId}_${Date.now()}`;

    try {
      const transaction = await loyaltyRepository.debitPoints(
        userId,
        tenantId,
        option.pointsCost,
        `Redeemed: ${option.name}`,
        optionId,
        idempotencyKey,
      );
      return { ok: true, transaction };
    } catch (err) {
      if (err instanceof LoyaltyError) {
        return { ok: false, code: err.code, message: err.message };
      }
      return { ok: false, code: "ERROR", message: "An unexpected error occurred" };
    }
  }

  /**
   * Return the top-N customers by current point balance for the admin overview.
   */
  async function getTopCustomers(
    tenantId: string,
    customerIds: string[],
    topN = 10,
    displayNameMap: Record<string, string> = {},
  ): Promise<CustomerLoyaltySummary[]> {
    const all = await listCustomerLoyaltyOverview(tenantId, customerIds, displayNameMap);
    return all.slice(0, topN);
  }

  return {
    listCustomerLoyaltyOverview,
    adjustPoints,
    redeemPointsForCustomer,
    getTopCustomers,
  };
}
