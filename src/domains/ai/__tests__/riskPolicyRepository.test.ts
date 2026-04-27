import { describe, expect, it } from "@jest/globals";

import { DEFAULT_RISK_POLICY } from "../noShowFraudService";
import {
  createRiskPolicyRepository,
  mergeRiskPolicy,
  validateRiskPolicy,
  type StoredRiskPolicy,
} from "../riskPolicyRepository";

// ---------------------------------------------------------------------------
// In-memory Firestore mock (mirrors marketplace/__tests__/repository.test.ts)
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function doc(_db: unknown, path?: string, id?: string) {
    return { _key: `${path}/${id}`, id: id as string };
  }
  async function getDoc(ref: { _key: string; id: string }) {
    const data = store[ref._key];
    return { exists: () => data !== undefined, data: () => (data ? { ...data } : null), id: ref.id };
  }

  return { db: {} as unknown, store, doc, getDoc };
}

let mock = makeFirestoreMock();

jest.mock("firebase/firestore", () => ({
  doc:    (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc: (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
}));

beforeEach(() => { mock = makeFirestoreMock(); });

// ---------------------------------------------------------------------------
// validateRiskPolicy
// ---------------------------------------------------------------------------

describe("validateRiskPolicy", () => {
  it("accepts the platform default", () => {
    expect(validateRiskPolicy(DEFAULT_RISK_POLICY)).toEqual({ valid: true });
  });

  it("flags missing fields", () => {
    const r = validateRiskPolicy({ depositThreshold: 0.4 });
    expect(r).toMatchObject({ valid: false, reason: "missing_field" });
  });

  it("rejects out-of-range thresholds", () => {
    const r = validateRiskPolicy({
      depositThreshold: 1.2,
      prepaymentThreshold: 0.6,
      manualReviewThreshold: 0.8,
      blockThreshold: 0.95,
    });
    expect(r).toMatchObject({ valid: false, reason: "out_of_range", field: "depositThreshold" });
  });

  it("rejects negative thresholds", () => {
    const r = validateRiskPolicy({ ...DEFAULT_RISK_POLICY, prepaymentThreshold: -0.1 });
    expect(r).toMatchObject({ valid: false, reason: "out_of_range" });
  });

  it("rejects non-monotonic ordering", () => {
    const r = validateRiskPolicy({
      depositThreshold: 0.6,
      prepaymentThreshold: 0.5,
      manualReviewThreshold: 0.8,
      blockThreshold: 0.95,
    });
    expect(r).toMatchObject({ valid: false, reason: "non_monotonic" });
  });

  it("rejects equal adjacent thresholds (strict monotonicity)", () => {
    const r = validateRiskPolicy({
      depositThreshold: 0.5,
      prepaymentThreshold: 0.5,
      manualReviewThreshold: 0.8,
      blockThreshold: 0.95,
    });
    expect(r).toMatchObject({ valid: false, reason: "non_monotonic" });
  });

  it("rejects NaN and Infinity", () => {
    expect(
      validateRiskPolicy({ ...DEFAULT_RISK_POLICY, depositThreshold: Number.NaN }),
    ).toMatchObject({ valid: false, reason: "out_of_range" });
    expect(
      validateRiskPolicy({ ...DEFAULT_RISK_POLICY, blockThreshold: Number.POSITIVE_INFINITY }),
    ).toMatchObject({ valid: false, reason: "out_of_range" });
  });
});

// ---------------------------------------------------------------------------
// mergeRiskPolicy
// ---------------------------------------------------------------------------

describe("mergeRiskPolicy", () => {
  it("returns the default when no patch is provided", () => {
    expect(mergeRiskPolicy({})).toEqual(DEFAULT_RISK_POLICY);
  });

  it("applies a partial patch on top of the default", () => {
    expect(mergeRiskPolicy({ depositThreshold: 0.3 })).toEqual({
      ...DEFAULT_RISK_POLICY,
      depositThreshold: 0.3,
    });
  });

  it("throws INVALID_RISK_POLICY when the merged result is non-monotonic", () => {
    expect(() => mergeRiskPolicy({ prepaymentThreshold: 0.2 })).toThrow(/INVALID_RISK_POLICY/);
  });
});

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

describe("RiskPolicyRepository", () => {
  it("getPolicy returns null when no doc exists", async () => {
    const repo = createRiskPolicyRepository(mock.db as never);
    expect(await repo.getPolicy("salon-1")).toBeNull();
  });

  it("getPolicy reads tenants/{tid}/riskPolicy/current", async () => {
    const stored: StoredRiskPolicy = {
      depositThreshold: 0.35,
      prepaymentThreshold: 0.55,
      manualReviewThreshold: 0.75,
      blockThreshold: 0.9,
      updatedAt: 1_700_000_000_000,
      updatedBy: "admin-uid",
    };
    mock.store["tenants/salon-1/riskPolicy/current"] = stored as unknown as Record<string, unknown>;
    const repo = createRiskPolicyRepository(mock.db as never);
    expect(await repo.getPolicy("salon-1")).toMatchObject(stored);
  });

  it("rejects empty tenantId", async () => {
    const repo = createRiskPolicyRepository(mock.db as never);
    await expect(repo.getPolicy("")).rejects.toThrow(/INVALID_RISK_POLICY/);
  });

  it("resolvePolicy returns the platform default when no override exists", async () => {
    const repo = createRiskPolicyRepository(mock.db as never);
    expect(await repo.resolvePolicy("salon-1")).toEqual(DEFAULT_RISK_POLICY);
  });

  it("resolvePolicy returns the stored override when valid", async () => {
    mock.store["tenants/salon-1/riskPolicy/current"] = {
      depositThreshold: 0.35,
      prepaymentThreshold: 0.55,
      manualReviewThreshold: 0.75,
      blockThreshold: 0.9,
    };
    const repo = createRiskPolicyRepository(mock.db as never);
    expect(await repo.resolvePolicy("salon-1")).toEqual({
      depositThreshold: 0.35,
      prepaymentThreshold: 0.55,
      manualReviewThreshold: 0.75,
      blockThreshold: 0.9,
    });
  });

  it("resolvePolicy falls back to default when stored doc is invalid", async () => {
    mock.store["tenants/salon-1/riskPolicy/current"] = {
      depositThreshold: 0.9,
      prepaymentThreshold: 0.6,
      manualReviewThreshold: 0.8,
      blockThreshold: 0.95,
    };
    const repo = createRiskPolicyRepository(mock.db as never);
    expect(await repo.resolvePolicy("salon-1")).toEqual(DEFAULT_RISK_POLICY);
  });

  it("strips updatedAt/updatedBy when returning a runtime RiskPolicy from resolvePolicy", async () => {
    mock.store["tenants/salon-1/riskPolicy/current"] = {
      depositThreshold: 0.35,
      prepaymentThreshold: 0.55,
      manualReviewThreshold: 0.75,
      blockThreshold: 0.9,
      updatedAt: 1_700_000_000_000,
      updatedBy: "admin-uid",
    };
    const repo = createRiskPolicyRepository(mock.db as never);
    const policy = await repo.resolvePolicy("salon-1");
    expect(Object.keys(policy).sort()).toEqual([
      "blockThreshold",
      "depositThreshold",
      "manualReviewThreshold",
      "prepaymentThreshold",
    ]);
  });
});
