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
  cursorSnapshots: Record<string, ConfigSnapshot>;
  txnSnapshot: ConfigSnapshot;
  txSetCalls: TxSetCall[];
  auditLogId: string;
  auditQueryDocs: Array<{ id: string; data: Record<string, unknown> }>;
  auditQueryCalls: Array<{ method: string; args: unknown[] }>;
};

const testState: TestState = {
  docSnapshot: {
    exists: false,
    data: () => ({})
  },
  cursorSnapshots: {},
  txnSnapshot: {
    exists: true,
    data: () => ({
      aiBudgetConfig: createValidConfig(1090)
    })
  },
  txSetCalls: [],
  auditLogId: "audit-log-1",
  auditQueryDocs: [],
  auditQueryCalls: []
};

const docGetByPathMock = vi.fn(async (path: string) => {
  if (path === "platform/config") {
    return testState.docSnapshot;
  }

  return (
    testState.cursorSnapshots[path] ?? {
      exists: false,
      data: () => ({})
    }
  );
});
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
  get: vi.fn(async () => docGetByPathMock(path))
}));

const collectionDocMock = vi.fn((id?: string) => {
  const resolvedId = id ?? testState.auditLogId;
  const path = `platformAuditLogs/${resolvedId}`;

  return {
    id: resolvedId,
    path,
    get: vi.fn(async () => {
      return (
        testState.cursorSnapshots[path] ?? {
          exists: false,
          data: () => ({})
        }
      );
    })
  };
});

function createAuditQueryMock() {
  const query = {
    where: vi.fn((field: string, op: string, value: unknown) => {
      testState.auditQueryCalls.push({
        method: "where",
        args: [field, op, value]
      });
      return query;
    }),
    orderBy: vi.fn((field: string, direction: string) => {
      testState.auditQueryCalls.push({
        method: "orderBy",
        args: [field, direction]
      });
      return query;
    }),
    limit: vi.fn((value: number) => {
      testState.auditQueryCalls.push({
        method: "limit",
        args: [value]
      });
      return query;
    }),
    startAfter: vi.fn((snapshot: unknown) => {
      testState.auditQueryCalls.push({
        method: "startAfter",
        args: [snapshot]
      });
      return query;
    }),
    get: vi.fn(async () => ({
      docs: testState.auditQueryDocs.map((doc) => ({
        id: doc.id,
        data: () => doc.data
      }))
    }))
  };

  return query;
}

const collectionMock = vi.fn((path: string) => {
  const auditQuery = createAuditQueryMock();

  return {
    path,
    doc: collectionDocMock,
    where: auditQuery.where,
    orderBy: auditQuery.orderBy,
    limit: auditQuery.limit,
    startAfter: auditQuery.startAfter,
    get: auditQuery.get
  };
});

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

const listAiBudgetAuditLogsAdmin = aiBudgetAdminModule.listAiBudgetAuditLogsAdmin as (
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
    testState.cursorSnapshots = {};

    testState.txnSnapshot = {
      exists: true,
      data: () => ({
        aiBudgetConfig: createValidConfig(1090)
      })
    };

    testState.txSetCalls = [];
    testState.auditLogId = "audit-log-1";
    testState.auditQueryDocs = [];
    testState.auditQueryCalls = [];

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

  it("rejects non-admin audit-log list requests", async () => {
    await expect(
      listAiBudgetAuditLogsAdmin({
        auth: {
          uid: "user-1",
          token: {
            role: "member"
          }
        },
        data: {}
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

  it("rejects update payloads with invalid feature monthly caps", async () => {
    await expect(
      updateAiBudgetConfigAdmin(
        adminRequest({
          featureCaps: {
            "support-triage": {
              monthlyCapUsd: 0
            }
          }
        })
      )
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects update payloads with overly long reason text", async () => {
    await expect(
      updateAiBudgetConfigAdmin(
        adminRequest({
          globalMonthlyCapUsd: 1250,
          reason: "x".repeat(501)
        })
      )
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects update payloads where protectionThreshold is not above warningThreshold", async () => {
    await expect(
      updateAiBudgetConfigAdmin(
        adminRequest({
          warningThreshold: 0.8,
          protectionThreshold: 0.8
        })
      )
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects audit-log list payloads with invalid limit", async () => {
    await expect(
      listAiBudgetAuditLogsAdmin(
        adminRequest({
          limit: 0
        })
      )
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects audit-log list payloads with invalid nextPageToken", async () => {
    await expect(
      listAiBudgetAuditLogsAdmin(
        adminRequest({
          nextPageToken: 123
        })
      )
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects audit-log list payloads when nextPageToken document does not exist", async () => {
    await expect(
      listAiBudgetAuditLogsAdmin(
        adminRequest({
          nextPageToken: "missing-token"
        })
      )
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("lists audit logs with filters and pagination", async () => {
    testState.auditQueryDocs = [
      {
        id: "log-1",
        data: {
          eventType: "ai_budget_config_update",
          actorUserId: "platform-admin-1",
          targetPath: "platform/config",
          reason: "manual adjustment",
          createdAt: "ts-1"
        }
      },
      {
        id: "log-2",
        data: {
          eventType: "ai_budget_config_update",
          actorUserId: "platform-admin-2",
          targetPath: "platform/config",
          reason: null,
          createdAt: "ts-2"
        }
      }
    ];

    const result = await listAiBudgetAuditLogsAdmin(
      adminRequest({
        limit: 10,
        eventType: "ai_budget_config_update",
        targetPath: "platform/config"
      })
    );

    expect(result.count).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.items).toHaveLength(2);
    expect(result.nextPageToken).toBeNull();
    expect(result.filters).toEqual({
      eventType: "ai_budget_config_update",
      targetPath: "platform/config"
    });

    expect(testState.auditQueryCalls).toEqual([
      {
        method: "orderBy",
        args: ["createdAt", "desc"]
      },
      {
        method: "where",
        args: ["eventType", "==", "ai_budget_config_update"]
      },
      {
        method: "where",
        args: ["targetPath", "==", "platform/config"]
      },
      {
        method: "limit",
        args: [10]
      }
    ]);
  });

  it("applies startAfter cursor when nextPageToken is provided", async () => {
    const cursorPath = "platformAuditLogs/log-1";
    const cursorSnapshot: ConfigSnapshot = {
      exists: true,
      data: () => ({
        createdAt: "ts-cursor"
      })
    };

    testState.cursorSnapshots[cursorPath] = cursorSnapshot;
    testState.auditQueryDocs = [
      {
        id: "log-2",
        data: {
          eventType: "ai_budget_config_update",
          actorUserId: "platform-admin-1",
          targetPath: "platform/config",
          reason: null,
          createdAt: "ts-2"
        }
      }
    ];

    const result = await listAiBudgetAuditLogsAdmin(
      adminRequest({
        limit: 1,
        nextPageToken: "log-1"
      })
    );

    expect(result.count).toBe(1);
    expect(result.nextPageToken).toBe("log-2");
    expect(testState.auditQueryCalls).toEqual([
      {
        method: "orderBy",
        args: ["createdAt", "desc"]
      },
      {
        method: "startAfter",
        args: [cursorSnapshot]
      },
      {
        method: "limit",
        args: [1]
      }
    ]);
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
