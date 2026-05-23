/**
 * W46 — loyaltyAdminAdapters (clears W45-DEBT-1 loyalty half)
 *
 * Real Firestore implementations for loyalty repository ports declared in
 * loyaltyAdminService.ts.
 *
 * Firestore path conventions:
 *   tenants/{tenantId}/loyaltyConfig/default
 *   tenants/{tenantId}/rewards/{rewardId}
 *   tenants/{tenantId}/pointAdjustments/{adjId}
 *   tenants/{tenantId}/activities/{activityId}
 *   tenants/{tenantId}/loyaltyStats/summary
 *   tenants/{tenantId}/tierMigrations/{migrationId}
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

import type {
  ActivityAdminEntry,
  ActivityBuilderInput,
  ActivityStats,
  LoyaltyConfigInput,
  LoyaltyProgramStats,
  ManualPointAdjustmentInput,
  RewardCatalogEntry,
  RewardCatalogInput,
  TierMigrationInput,
  TierMigrationPreview,
} from "../../domains/loyalty/loyaltyAdminModel";

import type {
  ActivityAdminRepository,
  LoyaltyConfigAdminRepository,
  ManualAdjustmentRepository,
  RewardCatalogRepository,
} from "./loyaltyAdminService";

// ---------------------------------------------------------------------------
// LoyaltyConfigAdminRepository
// ---------------------------------------------------------------------------

export function createLoyaltyConfigAdapter(
  db: Firestore,
): LoyaltyConfigAdminRepository {
  return {
    async getConfig(tenantId: string): Promise<LoyaltyConfigInput | null> {
      const snap = await getDoc(doc(db, "tenants", tenantId, "loyaltyConfig", "default"));
      if (!snap.exists()) return null;
      return snap.data() as LoyaltyConfigInput;
    },

    async saveConfig(input: LoyaltyConfigInput): Promise<void> {
      await setDoc(
        doc(db, "tenants", input.tenantId, "loyaltyConfig", "default"),
        { ...input, updatedAt: serverTimestamp() },
        { merge: true },
      );
    },
  };
}

// ---------------------------------------------------------------------------
// RewardCatalogRepository
// ---------------------------------------------------------------------------

export function createRewardCatalogAdapter(db: Firestore): RewardCatalogRepository {
  return {
    async listRewards(tenantId: string): Promise<RewardCatalogEntry[]> {
      const snap = await getDocs(collection(db, "tenants", tenantId, "rewards"));
      return snap.docs.map((d) => d.data() as RewardCatalogEntry);
    },

    async saveReward(
      rewardId: string | null,
      tenantId: string,
      input: RewardCatalogInput,
    ): Promise<RewardCatalogEntry> {
      const ref = rewardId
        ? doc(db, "tenants", tenantId, "rewards", rewardId)
        : doc(collection(db, "tenants", tenantId, "rewards"));
      const id = ref.id;
      const data = { ...input, rewardId: id, tenantId, updatedAt: serverTimestamp() };
      await setDoc(ref, data, { merge: true });
      const snap = await getDoc(ref);
      return snap.data() as RewardCatalogEntry;
    },

    async deleteReward(rewardId: string, tenantId: string): Promise<void> {
      await deleteDoc(doc(db, "tenants", tenantId, "rewards", rewardId));
    },
  };
}

// ---------------------------------------------------------------------------
// ManualAdjustmentRepository
// ---------------------------------------------------------------------------

export function createManualAdjustmentAdapter(db: Firestore): ManualAdjustmentRepository {
  return {
    async adjustPoints(input: ManualPointAdjustmentInput): Promise<void> {
      const ref = doc(collection(db, "tenants", input.tenantId, "pointAdjustments"));
      await setDoc(ref, {
        adjustmentId: ref.id,
        ...input,
        createdAt: serverTimestamp(),
      });
    },
  };
}

// ---------------------------------------------------------------------------
// ActivityAdminRepository
// ---------------------------------------------------------------------------

export function createActivityAdminAdapter(db: Firestore): ActivityAdminRepository {
  return {
    async listActivities(tenantId: string): Promise<ActivityAdminEntry[]> {
      const snap = await getDocs(collection(db, "tenants", tenantId, "activities"));
      return snap.docs.map((d) => d.data() as ActivityAdminEntry);
    },

    async saveActivity(
      tenantId: string,
      input: ActivityBuilderInput,
    ): Promise<ActivityAdminEntry> {
      const ref = doc(collection(db, "tenants", tenantId, "activities"));
      const activityId = ref.id;
      const data = {
        ...input,
        activityId,
        tenantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, data);
      const snap = await getDoc(ref);
      return snap.data() as ActivityAdminEntry;
    },

    async getActivityStats(
      activityId: string,
      tenantId: string,
    ): Promise<ActivityStats> {
      const snap = await getDoc(
        doc(db, "tenants", tenantId, "activityStats", activityId),
      );
      if (snap.exists()) return snap.data() as ActivityStats;
      return { activityId, activityName: "", totalParticipants: 0, completedCount: 0, completionRate: 0, rewardsIssued: 0, dailyProgress: [] };
    },

    async previewTierMigration(tenantId: string): Promise<TierMigrationPreview> {
      const snap = await getDoc(doc(db, "tenants", tenantId, "loyaltyStats", "summary"));
      if (snap.exists()) {
        const d = snap.data() as LoyaltyProgramStats;
        return {
          customersAffected: d.activeThisMonth ?? 0,
          upgrades: 0,
          downgrades: 0,
          unchanged: 0,
        };
      }
      return { customersAffected: 0, upgrades: 0, downgrades: 0, unchanged: 0 };
    },

    async runTierMigration(input: TierMigrationInput): Promise<void> {
      const ref = doc(collection(db, "tenants", input.tenantId, "tierMigrations"));
      await setDoc(ref, {
        migrationId: ref.id,
        ...input,
        status: "running",
        startedAt: serverTimestamp(),
      });
    },

    async getPerformanceStats(tenantId: string): Promise<LoyaltyProgramStats> {
      const snap = await getDoc(doc(db, "tenants", tenantId, "loyaltyStats", "summary"));
      if (snap.exists()) return snap.data() as LoyaltyProgramStats;
      return {
        totalEnrolled: 0,
        activeThisMonth: 0,
        totalPointsIssued: 0,
        totalPointsRedeemed: 0,
        averageBalance: 0,
        tierDistribution: [],
        recentTransactions: [],
      };
    },
  };
}
