/**
 * Risk-policy persistence layer (W20-DEBT-1).
 *
 * Each tenant may override the platform-default `RiskPolicy` thresholds.
 * Storage path: `tenants/{tenantId}/riskPolicy/current` (single doc).
 *
 * The repository is the read side for the no-show/fraud service. The write
 * side (admin callable that enforces RBAC + monotonicity) lives in
 * `functions/src/riskPolicyAdmin.ts` and writes via the admin SDK.
 *
 * Pure-validation helpers (`validateRiskPolicy`, `mergeRiskPolicy`) are
 * exported here so they can be reused by the admin callable, by tests,
 * and by any preview UI that wants to lint a draft before sending.
 */

import {
  doc,
  getDoc,
  type Firestore,
} from "firebase/firestore";

import {
  DEFAULT_RISK_POLICY,
  type RiskPolicy,
} from "./noShowFraudService";

// ---------------------------------------------------------------------------
// Pure validation helpers
// ---------------------------------------------------------------------------

export type RiskPolicyValidationError =
  | "out_of_range"
  | "non_monotonic"
  | "missing_field";

export type RiskPolicyValidationResult =
  | { valid: true }
  | { valid: false; reason: RiskPolicyValidationError; field?: keyof RiskPolicy };

const POLICY_FIELDS: ReadonlyArray<keyof RiskPolicy> = [
  "depositThreshold",
  "prepaymentThreshold",
  "manualReviewThreshold",
  "blockThreshold",
];

/**
 * Validates that all four thresholds are numbers in [0,1] and strictly
 * monotonically increasing: deposit < prepayment < manualReview < block.
 *
 * Strict monotonicity prevents ambiguous resolution (`<=` boundary cases
 * would let one band consume another).
 */
export function validateRiskPolicy(policy: Partial<RiskPolicy>): RiskPolicyValidationResult {
  for (const field of POLICY_FIELDS) {
    const value = policy[field];
    if (value === undefined || value === null) {
      return { valid: false, reason: "missing_field", field };
    }
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
      return { valid: false, reason: "out_of_range", field };
    }
  }

  const p = policy as RiskPolicy;
  if (
    !(
      p.depositThreshold < p.prepaymentThreshold &&
      p.prepaymentThreshold < p.manualReviewThreshold &&
      p.manualReviewThreshold < p.blockThreshold
    )
  ) {
    return { valid: false, reason: "non_monotonic" };
  }

  return { valid: true };
}

/**
 * Returns a fully-resolved `RiskPolicy`, applying any provided patch on top
 * of `DEFAULT_RISK_POLICY`. Throws when the merged result fails validation.
 */
export function mergeRiskPolicy(patch: Partial<RiskPolicy>): RiskPolicy {
  const merged: RiskPolicy = { ...DEFAULT_RISK_POLICY, ...patch };
  const result = validateRiskPolicy(merged);
  if (!result.valid) {
    const detail =
      result.reason === "non_monotonic"
        ? "thresholds must be strictly increasing: deposit < prepayment < manualReview < block"
        : `${result.reason}${result.field ? ` (${result.field})` : ""}`;
    throw new Error(`INVALID_RISK_POLICY: ${detail}`);
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Repository (client-SDK read side)
// ---------------------------------------------------------------------------

export type StoredRiskPolicy = RiskPolicy & {
  /** Wall-clock millis of the last admin write. */
  updatedAt?: number;
  /** UID of the platform-admin/tenant-admin that wrote this revision. */
  updatedBy?: string;
};

export type RiskPolicyRepository = {
  /**
   * Returns the per-tenant policy if one has been written, else `null`.
   * The caller is responsible for falling back to `DEFAULT_RISK_POLICY`.
   */
  getPolicy(tenantId: string): Promise<StoredRiskPolicy | null>;

  /**
   * Resolves a `RiskPolicy` for the tenant — never returns null. Falls back
   * to `DEFAULT_RISK_POLICY` when no override exists. This is the typical
   * shape consumed by the no-show/fraud service.
   */
  resolvePolicy(tenantId: string): Promise<RiskPolicy>;
};

const POLICY_DOC_ID = "current";

function policyDocPath(tenantId: string): string {
  return `tenants/${tenantId}/riskPolicy`;
}

export function createRiskPolicyRepository(db: Firestore): RiskPolicyRepository {
  async function getPolicy(tenantId: string): Promise<StoredRiskPolicy | null> {
    if (!tenantId || !tenantId.trim()) {
      throw new Error("INVALID_RISK_POLICY: tenantId is required");
    }
    const ref = doc(db, policyDocPath(tenantId), POLICY_DOC_ID);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as StoredRiskPolicy;
  }

  async function resolvePolicy(tenantId: string): Promise<RiskPolicy> {
    const stored = await getPolicy(tenantId);
    if (!stored) return { ...DEFAULT_RISK_POLICY };
    const result = validateRiskPolicy(stored);
    // If a stored policy somehow violates invariants (e.g. legacy data),
    // fall back to defaults rather than producing nonsense recommendations.
    if (!result.valid) return { ...DEFAULT_RISK_POLICY };
    return {
      depositThreshold: stored.depositThreshold,
      prepaymentThreshold: stored.prepaymentThreshold,
      manualReviewThreshold: stored.manualReviewThreshold,
      blockThreshold: stored.blockThreshold,
    };
  }

  return { getPolicy, resolvePolicy };
}
