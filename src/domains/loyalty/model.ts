import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Loyalty tier
// ---------------------------------------------------------------------------

export type LoyaltyTier = {
  tierId: string;
  name: string;
  minPoints: number;
  /** null = open-ended (highest tier) */
  maxPoints: number | null;
  benefits: string[];
};

// ---------------------------------------------------------------------------
// Redemption option
// ---------------------------------------------------------------------------

export type LoyaltyRedemptionOptionType = "discount" | "free_service" | "product";

export type LoyaltyRedemptionOption = {
  optionId: string;
  name: string;
  pointsCost: number;
  valueDescription: string;
  type: LoyaltyRedemptionOptionType;
};

// ---------------------------------------------------------------------------
// Tenant loyalty configuration (singleton per tenant)
// ---------------------------------------------------------------------------

export type TenantLoyaltyConfig = {
  tenantId: string;
  enabled: boolean;
  /** Points awarded per 1 unit of the tenant's currency */
  pointsPerCurrencyUnit: number;
  tiers: LoyaltyTier[];
  redemptionOptions: LoyaltyRedemptionOption[];
  /** null = points never expire */
  pointsExpiryDays: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Per-customer loyalty state
// ---------------------------------------------------------------------------

export type CustomerLoyaltyState = {
  userId: string;
  tenantId: string;
  /** Current spendable balance */
  points: number;
  /** Cumulative points ever earned (used for tier resolution) */
  lifetimePoints: number;
  /** null = programme disabled or customer below all tier thresholds */
  currentTierId: string | null;
  enrolledAt: Timestamp;
  updatedAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Transaction ledger
// ---------------------------------------------------------------------------

export type LoyaltyTransactionType = "credit" | "debit";

export type LoyaltyTransaction = {
  txId: string;
  userId: string;
  tenantId: string;
  type: LoyaltyTransactionType;
  /** Always a positive number; `type` indicates the direction */
  points: number;
  reason: string;
  referenceId: string;
  idempotencyKey: string;
  createdAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type LoyaltyErrorCode =
  | "INSUFFICIENT_POINTS"
  | "CONFIG_NOT_FOUND"
  | "DUPLICATE_TRANSACTION"
  | "INVALID_POINTS";

export class LoyaltyError extends Error {
  constructor(
    public readonly code: LoyaltyErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LoyaltyError";
  }
}

// ---------------------------------------------------------------------------
// Tier resolver
// ---------------------------------------------------------------------------

/**
 * Determine which tier a customer belongs to based on their lifetime points.
 * Returns null if tiers is empty or the customer is below all tier minimums.
 */
export function resolveCurrentTier(
  lifetimePoints: number,
  tiers: LoyaltyTier[],
): string | null {
  if (tiers.length === 0) return null;
  const sorted = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
  for (const tier of sorted) {
    if (lifetimePoints >= tier.minPoints) return tier.tierId;
  }
  return null;
}

/**
 * Calculate a 0–100 completion score based on how many steps are "completed".
 */
export function calculateCompletionScore(
  statuses: Record<string, "pending" | "in_progress" | "completed" | "skipped">,
  totalSteps: number,
): number {
  if (totalSteps === 0) return 0;
  const done = Object.values(statuses).filter((s) => s === "completed").length;
  return Math.round((done / totalSteps) * 100);
}
