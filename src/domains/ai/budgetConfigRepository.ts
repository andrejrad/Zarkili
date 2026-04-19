import { doc, getDoc, serverTimestamp, setDoc, type Firestore } from "firebase/firestore";

import {
  aiFeatureKeys,
  defaultAiBudgetGuardConfig,
  type AiBudgetGuardConfig,
  type AiFeatureBudgetConfig,
  type AiFeatureKey,
} from "../../shared/ai";

const PLATFORM_COLLECTION = "platform";
const PLATFORM_CONFIG_DOC = "config";
const AI_BUDGET_CONFIG_FIELD = "aiBudgetConfig";

export type UpdateAiBudgetConfigInput = {
  globalMonthlyCapUsd?: number;
  warningThreshold?: number;
  protectionThreshold?: number;
  featureCaps?: Partial<Record<AiFeatureKey, AiFeatureBudgetConfig>>;
};

function cloneDefaultConfig(): AiBudgetGuardConfig {
  return {
    ...defaultAiBudgetGuardConfig,
    featureCaps: {
      ...defaultAiBudgetGuardConfig.featureCaps,
    },
  };
}

function validateFeatureCaps(featureCaps: Record<AiFeatureKey, AiFeatureBudgetConfig>): void {
  for (const featureKey of aiFeatureKeys) {
    const cap = featureCaps[featureKey]?.monthlyCapUsd;
    if (typeof cap !== "number" || !Number.isFinite(cap) || cap <= 0) {
      throw new Error(`Invalid monthly cap for feature ${featureKey}`);
    }
  }
}

function validateBudgetConfig(config: AiBudgetGuardConfig): void {
  if (!Number.isFinite(config.globalMonthlyCapUsd) || config.globalMonthlyCapUsd <= 0) {
    throw new Error("globalMonthlyCapUsd must be a positive number");
  }

  if (!Number.isFinite(config.warningThreshold) || config.warningThreshold < 0 || config.warningThreshold >= 1) {
    throw new Error("warningThreshold must be within [0, 1)");
  }

  if (
    !Number.isFinite(config.protectionThreshold) ||
    config.protectionThreshold <= config.warningThreshold ||
    config.protectionThreshold > 1
  ) {
    throw new Error("protectionThreshold must be within (warningThreshold, 1]");
  }

  validateFeatureCaps(config.featureCaps);
}

function mergeBudgetConfig(base: AiBudgetGuardConfig, patch: UpdateAiBudgetConfigInput): AiBudgetGuardConfig {
  const mergedFeatureCaps: Record<AiFeatureKey, AiFeatureBudgetConfig> = {
    ...base.featureCaps,
  };

  if (patch.featureCaps) {
    for (const featureKey of aiFeatureKeys) {
      const override = patch.featureCaps[featureKey];
      if (override) {
        mergedFeatureCaps[featureKey] = {
          ...mergedFeatureCaps[featureKey],
          ...override,
        };
      }
    }
  }

  return {
    globalMonthlyCapUsd: patch.globalMonthlyCapUsd ?? base.globalMonthlyCapUsd,
    warningThreshold: patch.warningThreshold ?? base.warningThreshold,
    protectionThreshold: patch.protectionThreshold ?? base.protectionThreshold,
    featureCaps: mergedFeatureCaps,
  };
}

function isEmptyPatch(input: UpdateAiBudgetConfigInput): boolean {
  if (input.globalMonthlyCapUsd !== undefined) {
    return false;
  }

  if (input.warningThreshold !== undefined) {
    return false;
  }

  if (input.protectionThreshold !== undefined) {
    return false;
  }

  if (input.featureCaps && Object.keys(input.featureCaps).length > 0) {
    return false;
  }

  return true;
}

export function createAiBudgetConfigRepository(db: Firestore) {
  const ref = doc(db, PLATFORM_COLLECTION, PLATFORM_CONFIG_DOC);

  async function getBudgetConfig(): Promise<AiBudgetGuardConfig> {
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      return cloneDefaultConfig();
    }

    const data = snapshot.data() as Partial<Record<typeof AI_BUDGET_CONFIG_FIELD, AiBudgetGuardConfig>>;
    if (!data[AI_BUDGET_CONFIG_FIELD]) {
      return cloneDefaultConfig();
    }

    const merged = mergeBudgetConfig(cloneDefaultConfig(), data[AI_BUDGET_CONFIG_FIELD]);
    validateBudgetConfig(merged);
    return merged;
  }

  async function updateBudgetConfig(input: UpdateAiBudgetConfigInput): Promise<AiBudgetGuardConfig> {
    if (isEmptyPatch(input)) {
      throw new Error("Update payload must not be empty");
    }

    const current = await getBudgetConfig();
    const next = mergeBudgetConfig(current, input);
    validateBudgetConfig(next);

    await setDoc(
      ref,
      {
        [AI_BUDGET_CONFIG_FIELD]: next,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return next;
  }

  return {
    getBudgetConfig,
    updateBudgetConfig,
  };
}

export type AiBudgetConfigRepository = ReturnType<typeof createAiBudgetConfigRepository>;
