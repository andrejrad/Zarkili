import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// In-memory Firestore mock
// ---------------------------------------------------------------------------

type DocSnapshot = { exists: boolean; data: () => Record<string, unknown> };

const store: Record<string, Record<string, unknown>> = {};

function snapForPath(path: string): DocSnapshot {
  const data = store[path];
  return { exists: data !== undefined, data: () => (data ? { ...data } : {}) };
}

const docMock = vi.fn((path: string) => ({
  path,
  get: vi.fn(async () => snapForPath(path)),
  set: vi.fn(async (data: Record<string, unknown>, _opts?: unknown) => {
    store[path] = { ...(store[path] ?? {}), ...data };
  }),
}));

const firestoreMock = {
  doc: docMock,
};

vi.mock("firebase-admin/app", () => ({
  getApps: () => [],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => firestoreMock,
  FieldValue: { serverTimestamp: () => "SERVER_TIMESTAMP" },
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
    onCall: (handler: unknown) => handler,
  };
});

const mod = await import("../src/riskPolicyAdmin");
const getRiskPolicyAdmin = mod.getRiskPolicyAdmin as (
  request: Record<string, unknown>,
) => Promise<Record<string, unknown>>;
const updateRiskPolicyAdmin = mod.updateRiskPolicyAdmin as (
  request: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tenantAdminReq(tenantId: string, data: Record<string, unknown>) {
  return {
    auth: { uid: "admin-1", token: { role: "tenant_admin", tenantId } },
    data: { tenantId, ...data },
  };
}

function platformAdminReq(data: Record<string, unknown>) {
  return {
    auth: { uid: "platform-1", token: { role: "platform_admin" } },
    data,
  };
}

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getRiskPolicyAdmin
// ---------------------------------------------------------------------------

describe("getRiskPolicyAdmin", () => {
  it("returns the platform default when no override exists", async () => {
    const result = await getRiskPolicyAdmin(tenantAdminReq("salon-1", {}));
    expect(result).toMatchObject({
      tenantId: "salon-1",
      isDefault: true,
      riskPolicy: {
        depositThreshold: 0.4,
        prepaymentThreshold: 0.6,
        manualReviewThreshold: 0.8,
        blockThreshold: 0.95,
      },
    });
  });

  it("returns the stored policy when present", async () => {
    store["tenants/salon-1/riskPolicy/current"] = {
      depositThreshold: 0.3,
      prepaymentThreshold: 0.5,
      manualReviewThreshold: 0.7,
      blockThreshold: 0.9,
      updatedBy: "admin-1",
    };
    const result = await getRiskPolicyAdmin(tenantAdminReq("salon-1", {}));
    expect(result).toMatchObject({
      tenantId: "salon-1",
      isDefault: false,
      riskPolicy: {
        depositThreshold: 0.3,
        prepaymentThreshold: 0.5,
        manualReviewThreshold: 0.7,
        blockThreshold: 0.9,
      },
    });
  });

  it("falls back to default when stored doc is invalid", async () => {
    store["tenants/salon-1/riskPolicy/current"] = {
      depositThreshold: 0.9, // higher than block
      prepaymentThreshold: 0.6,
      manualReviewThreshold: 0.8,
      blockThreshold: 0.95,
    };
    const result = await getRiskPolicyAdmin(tenantAdminReq("salon-1", {}));
    expect(result.isDefault).toBe(true);
  });

  it("rejects unauthenticated requests", async () => {
    await expect(getRiskPolicyAdmin({ data: { tenantId: "salon-1" } })).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("rejects non-admin roles", async () => {
    await expect(
      getRiskPolicyAdmin({
        auth: { uid: "u", token: { role: "client" } },
        data: { tenantId: "salon-1" },
      }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects tenant_admin trying to read another tenant's policy", async () => {
    await expect(
      getRiskPolicyAdmin({
        auth: { uid: "u", token: { role: "tenant_admin", tenantId: "salon-1" } },
        data: { tenantId: "salon-2" },
      }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("allows platform_admin to read any tenant's policy", async () => {
    store["tenants/salon-X/riskPolicy/current"] = {
      depositThreshold: 0.3,
      prepaymentThreshold: 0.5,
      manualReviewThreshold: 0.7,
      blockThreshold: 0.9,
    };
    const result = await getRiskPolicyAdmin(platformAdminReq({ tenantId: "salon-X" }));
    expect(result.isDefault).toBe(false);
  });

  it("rejects missing tenantId", async () => {
    await expect(
      getRiskPolicyAdmin({ auth: { uid: "u", token: { role: "platform_admin" } }, data: {} }),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });
});

// ---------------------------------------------------------------------------
// updateRiskPolicyAdmin
// ---------------------------------------------------------------------------

describe("updateRiskPolicyAdmin", () => {
  it("writes a full policy patch and returns the merged result", async () => {
    const result = await updateRiskPolicyAdmin(
      tenantAdminReq("salon-1", {
        depositThreshold: 0.35,
        prepaymentThreshold: 0.55,
        manualReviewThreshold: 0.75,
        blockThreshold: 0.9,
      }),
    );
    expect(result.riskPolicy).toEqual({
      depositThreshold: 0.35,
      prepaymentThreshold: 0.55,
      manualReviewThreshold: 0.75,
      blockThreshold: 0.9,
    });
    expect(store["tenants/salon-1/riskPolicy/current"]).toMatchObject({
      depositThreshold: 0.35,
      blockThreshold: 0.9,
      updatedBy: "admin-1",
      updatedAt: "SERVER_TIMESTAMP",
    });
  });

  it("merges a partial patch with platform defaults on first write", async () => {
    const result = await updateRiskPolicyAdmin(
      tenantAdminReq("salon-1", { depositThreshold: 0.3 }),
    );
    expect(result.riskPolicy).toEqual({
      depositThreshold: 0.3,
      prepaymentThreshold: 0.6, // default
      manualReviewThreshold: 0.8, // default
      blockThreshold: 0.95, // default
    });
  });

  it("merges a partial patch with the existing stored policy", async () => {
    store["tenants/salon-1/riskPolicy/current"] = {
      depositThreshold: 0.3,
      prepaymentThreshold: 0.5,
      manualReviewThreshold: 0.7,
      blockThreshold: 0.9,
    };
    const result = await updateRiskPolicyAdmin(
      tenantAdminReq("salon-1", { blockThreshold: 0.92 }),
    );
    expect(result.riskPolicy).toEqual({
      depositThreshold: 0.3,
      prepaymentThreshold: 0.5,
      manualReviewThreshold: 0.7,
      blockThreshold: 0.92,
    });
  });

  it("rejects out-of-range threshold values", async () => {
    await expect(
      updateRiskPolicyAdmin(tenantAdminReq("salon-1", { depositThreshold: 1.2 })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
    expect(store["tenants/salon-1/riskPolicy/current"]).toBeUndefined();
  });

  it("rejects non-monotonic merged result", async () => {
    await expect(
      updateRiskPolicyAdmin(tenantAdminReq("salon-1", { prepaymentThreshold: 0.2 })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects empty update payload", async () => {
    await expect(updateRiskPolicyAdmin(tenantAdminReq("salon-1", {}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("rejects non-admin caller", async () => {
    await expect(
      updateRiskPolicyAdmin({
        auth: { uid: "u", token: { role: "client" } },
        data: { tenantId: "salon-1", depositThreshold: 0.3 },
      }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects tenant_admin updating another tenant", async () => {
    await expect(
      updateRiskPolicyAdmin({
        auth: { uid: "u", token: { role: "tenant_admin", tenantId: "salon-1" } },
        data: { tenantId: "salon-2", depositThreshold: 0.3 },
      }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("accepts an optional reason and rejects when over 500 chars", async () => {
    await updateRiskPolicyAdmin(
      tenantAdminReq("salon-1", { depositThreshold: 0.3, reason: "tightening for new market" }),
    );
    await expect(
      updateRiskPolicyAdmin(
        tenantAdminReq("salon-1", { depositThreshold: 0.31, reason: "x".repeat(501) }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });
});
