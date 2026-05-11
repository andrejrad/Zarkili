/**
 * consumerLoyaltyService.ts — W37 consumer-side loyalty + activities wiring.
 *
 * Wraps LoyaltyRepository and ActivityRepository to return data shaped for
 * the consumer UI types defined in loyaltyHelpers.ts.
 */

import type { LoyaltyRepository } from "../../domains/loyalty/repository";
import type { ActivityRepository } from "../../domains/activities/repository";
import type {
  Activity as UiActivity,
  ActivityStatus as UiActivityStatus,
  EarnAction,
  HistoryEntry,
  Reward,
  RewardFilterTab,
  ReferralStats,
} from "./loyaltyHelpers";
import { DEFAULT_EARN_ACTIONS } from "./loyaltyHelpers";

// ---------------------------------------------------------------------------
// Service type
// ---------------------------------------------------------------------------

export type ConsumerLoyaltyData = {
  points: number;
  tier: string;
  historyEntries: HistoryEntry[];
  earnActions: readonly EarnAction[];
  rewards: Reward[];
  referralCode: string;
  referralStats: ReferralStats;
};

export type ConsumerLoyaltyService = {
  /** Load all loyalty dashboard data for a consumer in a single call. */
  getLoyaltyData(userId: string, tenantId: string): Promise<ConsumerLoyaltyData>;

  /** Load activities (challenges) for a consumer in a tenant. */
  getActivities(userId: string, tenantId: string): Promise<UiActivity[]>;

  /**
   * Record progress on an activity (e.g. claim reward).
   * Does not throw on failure — best-effort.
   */
  recordActivityProgress(userId: string, tenantId: string, activityId: string): Promise<void>;
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapRedemptionTypeToUi(
  type: "discount" | "free_service" | "product",
): RewardFilterTab {
  if (type === "free_service") return "Free";
  if (type === "discount") return "Discount";
  return "Partner";
}

function mapUiActivityStatus(
  domainStatus: "draft" | "active" | "inactive" | "expired",
  progress: number,
  targetValue: number,
  completed: boolean,
): UiActivityStatus {
  if (completed) return "completed";
  if (domainStatus === "inactive" || domainStatus === "expired") return "expired";
  if (domainStatus === "draft") return "not_started";
  // active
  if (progress >= targetValue) return "ready_to_claim";
  if (progress > 0) return "in_progress";
  return "not_started";
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createConsumerLoyaltyService(
  loyaltyRepo: LoyaltyRepository,
  activityRepo: ActivityRepository,
): ConsumerLoyaltyService {
  async function getLoyaltyData(userId: string, tenantId: string): Promise<ConsumerLoyaltyData> {
    const [state, transactions, config] = await Promise.all([
      loyaltyRepo.getCustomerLoyaltyState(userId, tenantId),
      loyaltyRepo.listTransactions(userId, tenantId, 50),
      loyaltyRepo.getLoyaltyConfig(tenantId),
    ]);

    const points = state?.points ?? 0;

    // Derive tier label from tierId via config
    let tierLabel = "Bronze";
    if (state?.currentTierId && config?.tiers) {
      const found = config.tiers.find((t) => t.tierId === state.currentTierId);
      if (found) tierLabel = found.name;
    }

    const historyEntries: HistoryEntry[] = transactions.map((tx) => ({
      id: tx.txId,
      date:
        tx.createdAt && typeof (tx.createdAt as { toDate?: () => Date }).toDate === "function"
          ? (tx.createdAt as { toDate: () => Date }).toDate().toISOString()
          : new Date().toISOString(),
      description: tx.reason,
      delta: tx.type === "credit" ? tx.points : -tx.points,
    }));

    const rewards: Reward[] = (config?.redemptionOptions ?? []).map((opt) => ({
      id: opt.optionId,
      title: opt.name,
      points: opt.pointsCost,
      type: mapRedemptionTypeToUi(opt.type),
    }));

    return {
      points,
      tier: tierLabel,
      historyEntries,
      earnActions: DEFAULT_EARN_ACTIONS,
      rewards,
      // Referral: no database backend yet — return empty static values for W37.
      referralCode: "",
      referralStats: { invited: 0, joined: 0, earned: 0 },
    };
  }

  async function getActivities(userId: string, tenantId: string): Promise<UiActivity[]> {
    const domainActivities = await activityRepo.listActivities(tenantId);
    const active = domainActivities.filter(
      (a) => a.status === "active" || a.status === "draft",
    );

    const results = await Promise.all(
      active.map(async (a) => {
        let progress = 0;
        let completed = false;
        try {
          const participation = await activityRepo.getParticipation(
            tenantId,
            a.activityId,
            userId,
          );
          if (participation) {
            progress = participation.progress;
            completed = participation.completed;
          }
        } catch {
          // No participation record — treat as 0 progress.
        }

        const targetValue = a.rule.targetValue;
        const uiStatus = mapUiActivityStatus(a.status, progress, targetValue, completed);
        const pointsReward = a.reward.type === "points" ? a.reward.value : 0;
        const stepsCompleted = Math.min(progress, targetValue);

        const endDateIso = `${a.endDate}T23:59:59Z`;

        const uiActivity: UiActivity = {
          id: a.activityId,
          title: a.name,
          steps: [
            {
              id: `${a.activityId}_step`,
              label: a.reward.description,
              completed: progress >= targetValue,
            },
          ],
          pointsReward,
          bonusPoints: 0,
          currentSteps: stepsCompleted,
          totalSteps: targetValue,
          status: uiStatus,
          expiresAt: endDateIso,
          expiryLabel: a.endDate.replace(/-/g, "/"),
        };
        return uiActivity;
      }),
    );

    return results;
  }

  async function recordActivityProgress(
    userId: string,
    tenantId: string,
    activityId: string,
  ): Promise<void> {
    try {
      await activityRepo.recordParticipation(tenantId, activityId, userId, 1);
    } catch {
      // Non-fatal — best-effort claim.
    }
  }

  return { getLoyaltyData, getActivities, recordActivityProgress };
}
