/**
 * W45 — Loyalty Admin domain model
 *
 * Admin-facing types that extend the base loyalty model for the
 * Loyalty Config, Reward Catalog, Point Adjustment, Performance Dashboard,
 * Tier Migration, and Activity Admin surfaces.
 */

// ---------------------------------------------------------------------------
// Shared result wrapper
// ---------------------------------------------------------------------------

export type LoyaltyAdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

// ---------------------------------------------------------------------------
// Loyalty config editor
// ---------------------------------------------------------------------------

export type LoyaltyTierInput = {
  /** Stable client-side id; use existing tierId or "new-{uuid}" */
  tierId: string;
  name: string;
  minPoints: number;
  /** null = open-ended (highest tier) */
  maxPoints: number | null;
  benefits: string[];
};

export type LoyaltyRedemptionOptionInput = {
  optionId: string;
  name: string;
  pointsCost: number;
  valueDescription: string;
  type: "discount" | "free_service" | "product";
};

export type LoyaltyConfigInput = {
  tenantId: string;
  enabled: boolean;
  pointsPerCurrencyUnit: number;
  tiers: LoyaltyTierInput[];
  redemptionOptions: LoyaltyRedemptionOptionInput[];
  /** null = points never expire */
  pointsExpiryDays: number | null;
};

// ---------------------------------------------------------------------------
// Reward catalog
// ---------------------------------------------------------------------------

export type RewardCatalogEntry = {
  rewardId: string;
  tenantId: string;
  name: string;
  pointsCost: number;
  type: "discount" | "free_service" | "product";
  description: string;
  imageUrl?: string;
  active: boolean;
};

export type RewardCatalogInput = Omit<RewardCatalogEntry, "rewardId" | "tenantId">;

// ---------------------------------------------------------------------------
// Manual point adjustment
// ---------------------------------------------------------------------------

export type PointAdjustmentDirection = "credit" | "debit";

export type PointAdjustmentReason =
  | "goodwill"
  | "correction"
  | "event_bonus"
  | "promotion"
  | "other";

export type ManualPointAdjustmentInput = {
  tenantId: string;
  clientId: string;
  clientName: string;
  direction: PointAdjustmentDirection;
  /** Must be > 0 */
  points: number;
  reason: PointAdjustmentReason;
  /** Required audit note */
  note: string;
  performedBy: string;
};

// ---------------------------------------------------------------------------
// Loyalty performance dashboard
// ---------------------------------------------------------------------------

export type LoyaltyActivitySummary = {
  txId: string;
  clientId: string;
  clientName: string;
  direction: "credit" | "debit";
  points: number;
  reason: string;
  date: string;
};

export type TierDistributionEntry = {
  tierId: string;
  tierName: string;
  count: number;
};

export type LoyaltyProgramStats = {
  totalEnrolled: number;
  activeThisMonth: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  averageBalance: number;
  tierDistribution: TierDistributionEntry[];
  recentTransactions: LoyaltyActivitySummary[];
};

// ---------------------------------------------------------------------------
// Tier migration
// ---------------------------------------------------------------------------

export type TierMigrationPreview = {
  customersAffected: number;
  upgrades: number;
  downgrades: number;
  unchanged: number;
};

export type TierMigrationInput = {
  tenantId: string;
  /** Required audit reason */
  reason: string;
  performedBy: string;
};

// ---------------------------------------------------------------------------
// Activity admin
// ---------------------------------------------------------------------------

export type ActivityAdminEntry = {
  activityId: string;
  name: string;
  type: "visit_streak" | "spend_goal" | "referral" | "custom";
  status: "draft" | "active" | "inactive" | "expired";
  startDate: string;
  endDate: string;
  participantCount: number;
  completionCount: number;
};

export type DailyActivityProgress = {
  date: string;
  newParticipants: number;
  completions: number;
};

export type ActivityStats = {
  activityId: string;
  activityName: string;
  totalParticipants: number;
  completedCount: number;
  completionRate: number;
  rewardsIssued: number;
  dailyProgress: DailyActivityProgress[];
};

export type ActivityBuilderInput = {
  tenantId: string;
  name: string;
  type: "visit_streak" | "spend_goal" | "referral" | "custom";
  startDate: string;
  endDate: string;
  ruleTargetValue: number;
  ruleWindowDays: number | null;
  rewardType: "discount_percent" | "discount_fixed" | "free_service" | "points";
  rewardValue: number;
  rewardDescription: string;
  createdBy: string;
};
