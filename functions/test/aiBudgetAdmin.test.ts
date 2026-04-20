import { beforeEach, describe, expect, it, vi } from "vitest";

type AiFeatureKey =
  | "content-creation"
  | "marketing-orchestration"
  | "service-recommendations"
  | "scheduling-optimization"
  | "retention-insights"
  | "support-triage"
  | "no-show-fraud"
  | "marketplace-personalization";

type AiBudgetConfig = {
  globalMonthlyCapUsd: number;
  warningThreshold: number;
  protectionThreshold: number;
  featureCaps: Record<AiFeatureKey, { monthlyCapUsd: number }>;
};

type ConfigSnapshot = {
  exists: boolean;
  data: () => Record<string, unknown>;
};

type TxSetCall = {
  ref: { path: string };
  data: Record<string, unknown>;
  options?: Record<string, unknown>;
};

type TestState = {
  docSnapshot: ConfigSnapshot;
  txnSnapshot: ConfigSnapshot;
  txSetCalls: TxSetCall[];
  auditLogId: string;
};

const testState: TestState = {
  docSnapshot: {
    exists: false,
    data: () => ({})
  },
  txnSnapshot: {
    exists: true,
    data: () => ({
      aiBudgetConfig: createValidConfig(1090)
    })
  },
  txSetCalls: [],
  auditLogId: "audit-log-1"
};

const docGetMock = vi.fn(async () => testState.docSnapshot);
const txnGetMock = vi.fn(async () => testState.txnSnapshot);
const txnSetMock = vi.fn((ref: { path: string }, data: Record<string, unknown>, options?: Record<string, unknown>) => {
  testState.txSetCalls.push({ ref, data, options });
});
const runTransactionMock = vi.fn(async (handler: (txn: { get: typeof txnGetMock; set: typeof txnSetMock }) => unknown) => {
  const txn = {
    get: txnGetMock,
    set: txnSetMock
  };
  return handler(txn);
});

const docMock = vi.fn((path: string) => ({
  path,
  get: docGetMock
}));

const collectionDocMock = vi.fn(() => ({
  id: testState.auditLogId,
  path: `platformAuditLogs/${testState.auditLogId}`
}));

const collectionMock = vi.fn((path: string) => ({
  path,
  doc: collectionDocMock
}));

const firestoreMock = {
  doc: docMock,
  runTransaction: runTransactionMock,
  collection: collectionMock
};

vi.mock("firebase-admin/app", () => ({
  getApps: () => [],
  initializeApp: vi.fn()
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => firestoreMock,
  FieldValue: {
    serverTimestamp: () => "SERVER_TIMESTAMP"
  }
}));

vi.mock("firebase-functions/v2/https", () => {
  class MockHttpsError extends Error {
    public code: string;

    public constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = "HttpsError";
    }
  }

  return {
    HttpsError: MockHttpsError,
    onCall: (handler: unknown) => handler
  };
});

const aiBudgetAdminModule = await import("../src/aiBudgetAdmin");

const getAiBudgetConfigAdmin = aiBudgetAdminModule.getAiBudgetConfigAdmin as (
  request: Record<string, unknown>
) => Promise<Record<string, unknown>>;

const updateAiBudgetConfigAdmin = aiBudgetAdminModule.updateAiBudgetConfigAdmin as (
  request: Record<string, unknown>
) => Promise<Record<string, unknown>>;

function createValidConfig(globalCap: number): AiBudgetConfig {
  return {
    globalMonthlyCapUsd: globalCap,
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
      "marketplace-personalization": { monthlyCapUsd: 90 }
    }
  };
}

function adminRequest(data: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    auth: {
      uid: "platform-admin-1",
      token: {
        role: "platform_admin"
      }
    },
    data
  };
}

describe("aiBudgetAdmin callable handlers", () => {
  beforeEach(() => {
    testState.docSnapshot = {
      exists: false,
      data: () => ({})
    };

    testState.txnSnapshot = {
      exists: true,
      data: () => ({
        aiBudgetConfig: createValidConfig(1090)
      })
    };

    testState.txSetCalls = [];
    testState.auditLogId = "audit-log-1";

    vi.clearAllMocks();
  });

  it("rejects unauthenticated get config requests", async () => {
    await expect(getAiBudgetConfigAdmin({ data: {} })).rejects.toMatchObject({
      code: "unauthenticated"
    });
  });

  it("rejects non-admin update requests", async () => {
    await expect(
      updateAiBudgetConfigAdmin({
        auth: {
          uid: "user-1",
          token: {
            role: "member"
          }
        },
        data: {
          globalMonthlyCapUsd: 1200
        }
      })
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("returns the default budget config when no platform config document exists", async () => {
    const result = await getAiBudgetConfigAdmin(adminRequest());
    const config = result.aiBudgetConfig as AiBudgetConfig;

    expect(config.globalMonthlyCapUsd).toBe(1090);
    expect(config.warningThreshold).toBe(0.7);
    expect(config.protectionThreshold).toBe(0.9);
  });

  it("rejects update payloads that do not contain any config fields", async () => {
    await expect(
      updateAiBudgetConfigAdmin(
        adminRequest({
          reason: "No-op update"
        })
      )
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("writes updated config and audit log in one transaction", async () => {
    const result = await updateAiBudgetConfigAdmin(
      adminRequest({
        globalMonthlyCapUsd: 1300,
        featureCaps: {
          "support-triage": {
            monthlyCapUsd: 150
          }
        },
        reason: "  quarter budget recalibration  "
      })
    );

    expect(result.auditLogId).toBe("audit-log-1");
    expect(runTransactionMock).toHaveBeenCalledTimes(1);
    expect(testState.txSetCalls).toHaveLength(2);

    const configWrite = testState.txSetCalls[0];
    const auditWrite = testState.txSetCalls[1];

    expect(configWrite.ref.path).toBe("platform/config");
    expect(configWrite.data.updatedBy).toBe("platform-admin-1");

    const writtenConfig = configWrite.data.aiBudgetConfig as AiBudgetConfig;
    expect(writtenConfig.globalMonthlyCapUsd).toBe(1300);
    expect(writtenConfig.featureCaps["support-triage"].monthlyCapUsd).toBe(150);

    expect(auditWrite.ref.path).toBe("platformAuditLogs/audit-log-1");
    expect(auditWrite.data.eventType).toBe("ai_budget_config_update");
    expect(auditWrite.data.actorUserId).toBe("platform-admin-1");
    expect(auditWrite.data.reason).toBe("quarter budget recalibration");
  });
});
