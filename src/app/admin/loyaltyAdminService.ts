/**
 * W45 — loyaltyAdminService
 *
 * Factory for Loyalty admin surfaces: config editor, reward catalog,
 * manual point adjustment, program performance dashboard, tier migration,
 * activity catalog, and activity analytics.
 *
 * Pattern (mirrors clientCrmService / bookingOpsService):
 *   • Optional repo port injections.
 *   • Absent repo → { ok: false, message: "… not configured." }
 *   • Real Firestore adapters tracked as W45-DEBT-1.
 */

import type {
  ActivityAdminEntry,
  ActivityBuilderInput,
  ActivityStats,
  LoyaltyAdminResult,
  LoyaltyConfigInput,
  ManualPointAdjustmentInput,
  LoyaltyProgramStats,
  RewardCatalogEntry,
  RewardCatalogInput,
  TierMigrationInput,
  TierMigrationPreview,
} from "../../domains/loyalty/loyaltyAdminModel";

// ---------------------------------------------------------------------------
// Repository ports
// ---------------------------------------------------------------------------

export type LoyaltyConfigAdminRepository = {
  getConfig(tenantId: string): Promise<LoyaltyConfigInput | null>;
  saveConfig(input: LoyaltyConfigInput): Promise<void>;
};

export type RewardCatalogRepository = {
  listRewards(tenantId: string): Promise<RewardCatalogEntry[]>;
  saveReward(rewardId: string | null, tenantId: string, input: RewardCatalogInput): Promise<RewardCatalogEntry>;
  deleteReward(rewardId: string, tenantId: string): Promise<void>;
};

export type ManualAdjustmentRepository = {
  adjustPoints(input: ManualPointAdjustmentInput): Promise<void>;
};

export type ActivityAdminRepository = {
  listActivities(tenantId: string): Promise<ActivityAdminEntry[]>;
  saveActivity(tenantId: string, input: ActivityBuilderInput): Promise<ActivityAdminEntry>;
  getActivityStats(activityId: string, tenantId: string): Promise<ActivityStats>;
  previewTierMigration(tenantId: string): Promise<TierMigrationPreview>;
  runTierMigration(input: TierMigrationInput): Promise<void>;
  getPerformanceStats(tenantId: string): Promise<LoyaltyProgramStats>;
};

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

function fmtError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createLoyaltyAdminService(
  configRepo?: LoyaltyConfigAdminRepository,
  rewardRepo?: RewardCatalogRepository,
  adjustmentRepo?: ManualAdjustmentRepository,
  activityRepo?: ActivityAdminRepository,
) {
  // -------------------------------------------------------------------------
  // Loyalty config
  // -------------------------------------------------------------------------

  async function loadLoyaltyConfig(
    tenantId: string,
  ): Promise<LoyaltyAdminResult<LoyaltyConfigInput | null>> {
    if (!configRepo) {
      return { ok: false, message: "Loyalty config repository not configured." };
    }
    try {
      const data = await configRepo.getConfig(tenantId);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function saveLoyaltyConfig(
    input: LoyaltyConfigInput,
  ): Promise<LoyaltyAdminResult<void>> {
    if (!configRepo) {
      return { ok: false, message: "Loyalty config repository not configured." };
    }
    try {
      await configRepo.saveConfig(input);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Reward catalog
  // -------------------------------------------------------------------------

  async function listRewards(
    tenantId: string,
  ): Promise<LoyaltyAdminResult<RewardCatalogEntry[]>> {
    if (!rewardRepo) {
      return { ok: false, message: "Reward catalog repository not configured." };
    }
    try {
      const data = await rewardRepo.listRewards(tenantId);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function saveReward(
    rewardId: string | null,
    tenantId: string,
    input: RewardCatalogInput,
  ): Promise<LoyaltyAdminResult<RewardCatalogEntry>> {
    if (!rewardRepo) {
      return { ok: false, message: "Reward catalog repository not configured." };
    }
    try {
      const data = await rewardRepo.saveReward(rewardId, tenantId, input);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function deleteReward(
    rewardId: string,
    tenantId: string,
  ): Promise<LoyaltyAdminResult<void>> {
    if (!rewardRepo) {
      return { ok: false, message: "Reward catalog repository not configured." };
    }
    try {
      await rewardRepo.deleteReward(rewardId, tenantId);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Manual point adjustment
  // -------------------------------------------------------------------------

  async function adjustPoints(
    input: ManualPointAdjustmentInput,
  ): Promise<LoyaltyAdminResult<void>> {
    if (input.points <= 0) {
      return { ok: false, message: "Points must be greater than zero." };
    }
    if (!input.note.trim()) {
      return { ok: false, message: "Audit note is required." };
    }
    if (!adjustmentRepo) {
      return { ok: false, message: "Point adjustment repository not configured." };
    }
    try {
      await adjustmentRepo.adjustPoints(input);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Performance dashboard
  // -------------------------------------------------------------------------

  async function loadProgramStats(
    tenantId: string,
  ): Promise<LoyaltyAdminResult<LoyaltyProgramStats>> {
    if (!activityRepo) {
      return { ok: false, message: "Activity repository not configured." };
    }
    try {
      const data = await activityRepo.getPerformanceStats(tenantId);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Tier migration
  // -------------------------------------------------------------------------

  async function previewTierMigration(
    tenantId: string,
  ): Promise<LoyaltyAdminResult<TierMigrationPreview>> {
    if (!activityRepo) {
      return { ok: false, message: "Activity repository not configured." };
    }
    try {
      const data = await activityRepo.previewTierMigration(tenantId);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function runTierMigration(
    input: TierMigrationInput,
  ): Promise<LoyaltyAdminResult<void>> {
    if (!input.reason.trim()) {
      return { ok: false, message: "Migration reason is required." };
    }
    if (!activityRepo) {
      return { ok: false, message: "Activity repository not configured." };
    }
    try {
      await activityRepo.runTierMigration(input);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Activity admin
  // -------------------------------------------------------------------------

  async function listActivities(
    tenantId: string,
  ): Promise<LoyaltyAdminResult<ActivityAdminEntry[]>> {
    if (!activityRepo) {
      return { ok: false, message: "Activity repository not configured." };
    }
    try {
      const data = await activityRepo.listActivities(tenantId);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function saveActivity(
    tenantId: string,
    input: ActivityBuilderInput,
  ): Promise<LoyaltyAdminResult<ActivityAdminEntry>> {
    if (!activityRepo) {
      return { ok: false, message: "Activity repository not configured." };
    }
    try {
      const data = await activityRepo.saveActivity(tenantId, input);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function loadActivityStats(
    activityId: string,
    tenantId: string,
  ): Promise<LoyaltyAdminResult<ActivityStats>> {
    if (!activityRepo) {
      return { ok: false, message: "Activity repository not configured." };
    }
    try {
      const data = await activityRepo.getActivityStats(activityId, tenantId);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    loadLoyaltyConfig,
    saveLoyaltyConfig,
    listRewards,
    saveReward,
    deleteReward,
    adjustPoints,
    loadProgramStats,
    previewTierMigration,
    runTierMigration,
    listActivities,
    saveActivity,
    loadActivityStats,
  };
}

export type LoyaltyAdminService = ReturnType<typeof createLoyaltyAdminService>;
