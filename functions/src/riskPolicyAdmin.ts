/**
 * functions/src/riskPolicyAdmin.ts (W20-DEBT-1)
 *
 * Tenant-scoped admin callable for the no-show / fraud `RiskPolicy`. Allows
 * `tenant_admin` of a tenant to (a) read the current policy and (b) update
 * deposit / prepayment / manual-review / block thresholds.
 *
 * Storage: `tenants/{tenantId}/riskPolicy/current` (single doc).
 *
 * Validation invariants (mirrored in `src/domains/ai/riskPolicyRepository.ts`
 * via `validateRiskPolicy` — but duplicated here so the Cloud Function has
 * no runtime dependency on the client-SDK domain code):
 *   - All four thresholds are finite numbers in [0,1].
 *   - Strict monotonic ordering: deposit < prepayment < manualReview < block.
 *
 * Reading falls back to platform defaults when no override exists.
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

// ---------------------------------------------------------------------------
// Defaults & validation
// ---------------------------------------------------------------------------

type RiskPolicy = {
  depositThreshold: number;
  prepaymentThreshold: number;
  manualReviewThreshold: number;
  blockThreshold: number;
};

const DEFAULT_RISK_POLICY: RiskPolicy = {
  depositThreshold: 0.4,
  prepaymentThreshold: 0.6,
  manualReviewThreshold: 0.8,
  blockThreshold: 0.95,
};

const POLICY_FIELDS = [
  "depositThreshold",
  "prepaymentThreshold",
  "manualReviewThreshold",
  "blockThreshold",
] as const;

function validateRiskPolicy(policy: RiskPolicy): void {
  for (const field of POLICY_FIELDS) {
    const value = policy[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
      throw new HttpsError(
        "invalid-argument",
        `${field} must be a finite number in [0,1]`,
      );
    }
  }
  if (
    !(
      policy.depositThreshold < policy.prepaymentThreshold &&
      policy.prepaymentThreshold < policy.manualReviewThreshold &&
      policy.manualReviewThreshold < policy.blockThreshold
    )
  ) {
    throw new HttpsError(
      "invalid-argument",
      "thresholds must be strictly increasing: deposit < prepayment < manualReview < block",
    );
  }
}

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

type AdminContext = { uid: string; tenantId: string };

function assertTenantAdmin(
  request: CallableRequest<unknown>,
  payloadTenantId: string,
): AdminContext {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError("unauthenticated", "Authentication is required");
  }
  const role = auth.token.role;
  if (role !== "tenant_admin" && role !== "platform_admin") {
    throw new HttpsError("permission-denied", "tenant_admin role is required");
  }
  // Platform admins may operate on any tenant; tenant_admins are scoped to
  // their own tenant via the custom claim `tenantId`.
  if (role === "tenant_admin") {
    const claimedTenant = auth.token.tenantId as string | undefined;
    if (!claimedTenant || claimedTenant !== payloadTenantId) {
      throw new HttpsError(
        "permission-denied",
        "tenant_admin may only update their own tenant's risk policy",
      );
    }
  }
  return { uid: auth.uid, tenantId: payloadTenantId };
}

// ---------------------------------------------------------------------------
// Payload parsing
// ---------------------------------------------------------------------------

type UpdatePayload = Partial<RiskPolicy> & { tenantId: string; reason?: string };
type GetPayload = { tenantId: string };

function parseTenantId(data: unknown): string {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Payload must be an object");
  }
  const tenantId = (data as { tenantId?: unknown }).tenantId;
  if (typeof tenantId !== "string" || tenantId.trim().length === 0) {
    throw new HttpsError("invalid-argument", "tenantId is required");
  }
  return tenantId.trim();
}

function parseUpdatePayload(data: unknown): UpdatePayload {
  const tenantId = parseTenantId(data);
  const obj = data as Record<string, unknown>;
  const out: UpdatePayload = { tenantId };

  for (const field of POLICY_FIELDS) {
    const v = obj[field];
    if (v !== undefined) {
      if (typeof v !== "number") {
        throw new HttpsError("invalid-argument", `${field} must be a number when provided`);
      }
      out[field] = v;
    }
  }

  const hasAny = POLICY_FIELDS.some((f) => out[f] !== undefined);
  if (!hasAny) {
    throw new HttpsError(
      "invalid-argument",
      "Update payload must include at least one threshold field",
    );
  }

  if (obj.reason !== undefined) {
    if (typeof obj.reason !== "string") {
      throw new HttpsError("invalid-argument", "reason must be a string when provided");
    }
    if (obj.reason.length > 500) {
      throw new HttpsError("invalid-argument", "reason must not exceed 500 characters");
    }
    out.reason = obj.reason;
  }

  return out;
}

function policyDocRef(tenantId: string) {
  return db.doc(`tenants/${tenantId}/riskPolicy/current`);
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const getRiskPolicyAdmin = onCall(async (request) => {
  const tenantId = parseTenantId(request.data);
  assertTenantAdmin(request, tenantId);

  const snap = await policyDocRef(tenantId).get();
  if (!snap.exists) {
    return { tenantId, riskPolicy: { ...DEFAULT_RISK_POLICY }, isDefault: true };
  }
  const data = snap.data() ?? {};
  const stored: RiskPolicy = {
    depositThreshold: Number(data.depositThreshold),
    prepaymentThreshold: Number(data.prepaymentThreshold),
    manualReviewThreshold: Number(data.manualReviewThreshold),
    blockThreshold: Number(data.blockThreshold),
  };
  // If the stored doc is somehow corrupt, surface the default rather than
  // returning thresholds the service would reject at runtime anyway.
  try {
    validateRiskPolicy(stored);
  } catch {
    return { tenantId, riskPolicy: { ...DEFAULT_RISK_POLICY }, isDefault: true };
  }
  return {
    tenantId,
    riskPolicy: stored,
    isDefault: false,
    updatedAt: data.updatedAt ?? null,
    updatedBy: data.updatedBy ?? null,
  };
});

export const updateRiskPolicyAdmin = onCall(async (request) => {
  const payload = parseUpdatePayload(request.data);
  const ctx = assertTenantAdmin(request, payload.tenantId);

  const ref = policyDocRef(payload.tenantId);
  const snap = await ref.get();
  const current: RiskPolicy = snap.exists
    ? {
        depositThreshold: Number((snap.data() ?? {}).depositThreshold ?? DEFAULT_RISK_POLICY.depositThreshold),
        prepaymentThreshold: Number((snap.data() ?? {}).prepaymentThreshold ?? DEFAULT_RISK_POLICY.prepaymentThreshold),
        manualReviewThreshold: Number((snap.data() ?? {}).manualReviewThreshold ?? DEFAULT_RISK_POLICY.manualReviewThreshold),
        blockThreshold: Number((snap.data() ?? {}).blockThreshold ?? DEFAULT_RISK_POLICY.blockThreshold),
      }
    : { ...DEFAULT_RISK_POLICY };

  const merged: RiskPolicy = {
    depositThreshold: payload.depositThreshold ?? current.depositThreshold,
    prepaymentThreshold: payload.prepaymentThreshold ?? current.prepaymentThreshold,
    manualReviewThreshold: payload.manualReviewThreshold ?? current.manualReviewThreshold,
    blockThreshold: payload.blockThreshold ?? current.blockThreshold,
  };
  validateRiskPolicy(merged);

  await ref.set(
    {
      ...merged,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: ctx.uid,
    },
    { merge: true },
  );

  return { tenantId: payload.tenantId, riskPolicy: merged };
});
