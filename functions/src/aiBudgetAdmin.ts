import { getApps, initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  getFirestore,
  type DocumentData,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

const PLATFORM_CONFIG_PATH = "platform/config";
const PLATFORM_AUDIT_COLLECTION = "platformAuditLogs";

const AI_FEATURE_KEYS = [
  "content-creation",
  "marketing-orchestration",
  "service-recommendations",
  "scheduling-optimization",
  "retention-insights",
  "support-triage",
  "no-show-fraud",
  "marketplace-personalization",
] as const;

type AiFeatureKey = (typeof AI_FEATURE_KEYS)[number];

type AiFeatureBudgetConfig = {
  monthlyCapUsd: number;
};

type AiBudgetGuardConfig = {
  globalMonthlyCapUsd: number;
  warningThreshold: number;
  protectionThreshold: number;
  featureCaps: Record<AiFeatureKey, AiFeatureBudgetConfig>;
};

type UpdateAiBudgetConfigInput = {
  globalMonthlyCapUsd?: number;
  warningThreshold?: number;
  protectionThreshold?: number;
  featureCaps?: Partial<Record<AiFeatureKey, AiFeatureBudgetConfig>>;
  reason?: string;
};

type ListAiBudgetAuditLogsInput = {
  limit: number;
  eventType?: string;
  targetPath?: string;
  nextPageToken?: string;
};

const DEFAULT_AI_BUDGET_CONFIG: AiBudgetGuardConfig = {
  globalMonthlyCapUsd: 1090,
  warningThreshold: 0.7,
  protectionThreshold: 0.9,
  featureCaps: {
    "content-creation": { monthlyCapUsd: 120 },
    "marketing-orchestration": { monthlyCapUsd: 180 },
    "service-recommendations": { monthlyCapUsd: 140 },
    "scheduling-optimization": { monthlyCapUsd: 180 },
    "retention-insights": { monthlyCapUsd: 150 },
    "support-triage": { monthlyCapUsd: 120 },
    "no-show-fraud": { monthlyCapUsd: 110 },
    "marketplace-personalization": { monthlyCapUsd: 90 },
  },
};

function cloneDefaultAiBudgetConfig(): AiBudgetGuardConfig {
  return {
    ...DEFAULT_AI_BUDGET_CONFIG,
    featureCaps: {
      ...DEFAULT_AI_BUDGET_CONFIG.featureCaps,
    },
  };
}

function assertPlatformAdmin(request: CallableRequest<unknown>): { uid: string } {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError("unauthenticated", "Authentication is required");
  }

  if (auth.token.role !== "platform_admin") {
    throw new HttpsError("permission-denied", "Platform admin role is required");
  }

  return { uid: auth.uid };
}

function validateFeatureCaps(featureCaps: Record<AiFeatureKey, AiFeatureBudgetConfig>): void {
  for (const featureKey of AI_FEATURE_KEYS) {
    const cap = featureCaps[featureKey]?.monthlyCapUsd;
    if (typeof cap !== "number" || !Number.isFinite(cap) || cap <= 0) {
      throw new HttpsError("invalid-argument", `Invalid monthly cap for feature ${featureKey}`);
    }
  }
}

function validateBudgetConfig(config: AiBudgetGuardConfig): void {
  if (!Number.isFinite(config.globalMonthlyCapUsd) || config.globalMonthlyCapUsd <= 0) {
    throw new HttpsError("invalid-argument", "globalMonthlyCapUsd must be a positive number");
  }

  if (!Number.isFinite(config.warningThreshold) || config.warningThreshold < 0 || config.warningThreshold >= 1) {
    throw new HttpsError("invalid-argument", "warningThreshold must be within [0, 1)");
  }

  if (
    !Number.isFinite(config.protectionThreshold) ||
    config.protectionThreshold <= config.warningThreshold ||
    config.protectionThreshold > 1
  ) {
    throw new HttpsError(
      "invalid-argument",
      "protectionThreshold must be within (warningThreshold, 1]"
    );
  }

  validateFeatureCaps(config.featureCaps);
}

function mergeBudgetConfig(base: AiBudgetGuardConfig, patch: UpdateAiBudgetConfigInput): AiBudgetGuardConfig {
  const mergedFeatureCaps: Record<AiFeatureKey, AiFeatureBudgetConfig> = {
    ...base.featureCaps,
  };

  if (patch.featureCaps) {
    for (const featureKey of AI_FEATURE_KEYS) {
      const featurePatch = patch.featureCaps[featureKey];
      if (featurePatch) {
        mergedFeatureCaps[featureKey] = {
          ...mergedFeatureCaps[featureKey],
          ...featurePatch,
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

function normalizeFromDocument(configLike: unknown): AiBudgetGuardConfig {
  if (!configLike || typeof configLike !== "object") {
    return cloneDefaultAiBudgetConfig();
  }

  const patch = configLike as UpdateAiBudgetConfigInput;
  const merged = mergeBudgetConfig(cloneDefaultAiBudgetConfig(), patch);
  validateBudgetConfig(merged);
  return merged;
}

function parsePatch(data: unknown): UpdateAiBudgetConfigInput {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Payload must be an object");
  }

  const input = data as UpdateAiBudgetConfigInput;
  const hasConfigPatch =
    input.globalMonthlyCapUsd !== undefined ||
    input.warningThreshold !== undefined ||
    input.protectionThreshold !== undefined ||
    (input.featureCaps && Object.keys(input.featureCaps).length > 0);

  if (!hasConfigPatch) {
    throw new HttpsError("invalid-argument", "Update payload must include at least one config field");
  }

  if (input.reason !== undefined) {
    if (typeof input.reason !== "string") {
      throw new HttpsError("invalid-argument", "reason must be a string when provided");
    }

    if (input.reason.trim().length > 500) {
      throw new HttpsError("invalid-argument", "reason must not exceed 500 characters");
    }
  }

  return input;
}

function parseListAuditLogsInput(data: unknown): ListAiBudgetAuditLogsInput {
  if (data === undefined || data === null) {
    return { limit: 20 };
  }

  if (typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Payload must be an object");
  }

  const input = data as {
    limit?: unknown;
    eventType?: unknown;
    targetPath?: unknown;
    nextPageToken?: unknown;
  };

  const parsed: ListAiBudgetAuditLogsInput = {
    limit: 20,
  };

  if (input.limit !== undefined) {
    if (
      typeof input.limit !== "number" ||
      !Number.isInteger(input.limit) ||
      input.limit < 1 ||
      input.limit > 100
    ) {
      throw new HttpsError("invalid-argument", "limit must be an integer within [1, 100]");
    }
    parsed.limit = input.limit;
  }

  if (input.eventType !== undefined) {
    if (typeof input.eventType !== "string" || input.eventType.trim().length === 0) {
      throw new HttpsError("invalid-argument", "eventType must be a non-empty string when provided");
    }
    parsed.eventType = input.eventType.trim();
  }

  if (input.targetPath !== undefined) {
    if (typeof input.targetPath !== "string" || input.targetPath.trim().length === 0) {
      throw new HttpsError("invalid-argument", "targetPath must be a non-empty string when provided");
    }
    parsed.targetPath = input.targetPath.trim();
  }

  if (input.nextPageToken !== undefined) {
    if (typeof input.nextPageToken !== "string" || input.nextPageToken.trim().length === 0) {
      throw new HttpsError("invalid-argument", "nextPageToken must be a non-empty string when provided");
    }
    parsed.nextPageToken = input.nextPageToken.trim();
  }

  return parsed;
}

function getCurrentConfigFromTxn(txn: Transaction, firestore: Firestore) {
  const configRef = firestore.doc(PLATFORM_CONFIG_PATH);
  return txn.get(configRef).then((snapshot) => {
    if (!snapshot.exists) {
      return {
        configRef,
        currentConfig: cloneDefaultAiBudgetConfig(),
      };
    }

    const data = snapshot.data() as DocumentData;
    return {
      configRef,
      currentConfig: normalizeFromDocument(data.aiBudgetConfig),
    };
  });
}

export const getAiBudgetConfigAdmin = onCall(async (request) => {
  assertPlatformAdmin(request);

  const snapshot = await db.doc(PLATFORM_CONFIG_PATH).get();
  if (!snapshot.exists) {
    return {
      aiBudgetConfig: cloneDefaultAiBudgetConfig(),
    };
  }

  const data = snapshot.data() as DocumentData;
  return {
    aiBudgetConfig: normalizeFromDocument(data.aiBudgetConfig),
    updatedAt: data.updatedAt ?? null,
    updatedBy: data.updatedBy ?? null,
  };
});

export const updateAiBudgetConfigAdmin = onCall(async (request) => {
  const { uid } = assertPlatformAdmin(request);
  const patch = parsePatch(request.data);

  const result = await db.runTransaction(async (txn) => {
    const { configRef, currentConfig } = await getCurrentConfigFromTxn(txn, db);
    const nextConfig = mergeBudgetConfig(currentConfig, patch);
    validateBudgetConfig(nextConfig);

    const auditRef = db.collection(PLATFORM_AUDIT_COLLECTION).doc();
    const reason = patch.reason?.trim() || null;

    txn.set(
      configRef,
      {
        aiBudgetConfig: nextConfig,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true }
    );

    txn.set(auditRef, {
      eventType: "ai_budget_config_update",
      actorUserId: uid,
      targetPath: PLATFORM_CONFIG_PATH,
      before: currentConfig,
      after: nextConfig,
      patch: {
        globalMonthlyCapUsd: patch.globalMonthlyCapUsd ?? null,
        warningThreshold: patch.warningThreshold ?? null,
        protectionThreshold: patch.protectionThreshold ?? null,
        featureCaps: patch.featureCaps ?? null,
      },
      reason,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      aiBudgetConfig: nextConfig,
      auditLogId: auditRef.id,
    };
  });

  return result;
});

export const listAiBudgetAuditLogsAdmin = onCall(async (request) => {
  assertPlatformAdmin(request);
  const input = parseListAuditLogsInput(request.data);

  let query = db.collection(PLATFORM_AUDIT_COLLECTION).orderBy("createdAt", "desc");

  if (input.eventType) {
    query = query.where("eventType", "==", input.eventType);
  }

  if (input.targetPath) {
    query = query.where("targetPath", "==", input.targetPath);
  }

  if (input.nextPageToken) {
    const cursorRef = db.collection(PLATFORM_AUDIT_COLLECTION).doc(input.nextPageToken);
    const cursorSnapshot = await cursorRef.get();
    if (!cursorSnapshot.exists) {
      throw new HttpsError("invalid-argument", "nextPageToken does not reference an existing audit log");
    }
    query = query.startAfter(cursorSnapshot);
  }

  const snapshot = await query.limit(input.limit).get();

  const items = snapshot.docs.map((doc) => {
    const data = doc.data() as DocumentData;
    return {
      id: doc.id,
      eventType: data.eventType ?? null,
      actorUserId: data.actorUserId ?? null,
      targetPath: data.targetPath ?? null,
      reason: data.reason ?? null,
      createdAt: data.createdAt ?? null,
    };
  });

  return {
    items,
    count: items.length,
    limit: input.limit,
    nextPageToken: items.length === input.limit ? items[items.length - 1].id : null,
    filters: {
      eventType: input.eventType ?? null,
      targetPath: input.targetPath ?? null,
    },
  };
});
