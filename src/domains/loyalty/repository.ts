/**
 * Loyalty repository
 *
 * Collection layout (post NEW-DEBT-B path migration):
 *   tenants/{tenantId}/loyaltyConfig/config      — singleton TenantLoyaltyConfig
 *   user_brand_loyalty/{userId}_{brandId}        — CustomerLoyaltyState (v3 §3.10)
 *   tenants/{tenantId}/loyaltyTransactions/{txId} — LoyaltyTransaction ledger
 *   tenants/{tenantId}/loyaltyIdempotency/{key}  — idempotency records
 *
 * Per v3, `tenantId === brandId`. The composite doc-ID encodes the brand as the
 * second segment. Documents are also written with `brandId` (= tenantId) and
 * `pointsBalance` (= points) field aliases so the spec-shaped discovery reader
 * (src/domains/discovery/repository.ts) can read the badge balance directly.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as firestoreLimit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

import {
  LoyaltyError,
  resolveCurrentTier,
  type CustomerLoyaltyState,
  type LoyaltyTransaction,
  type LoyaltyTransactionType,
  type TenantLoyaltyConfig,
} from "./model";

// ---------------------------------------------------------------------------
// Collection helpers
// ---------------------------------------------------------------------------

const configCol = (tenantId: string) => `tenants/${tenantId}/loyaltyConfig`;
const txCol = (tenantId: string) => `tenants/${tenantId}/loyaltyTransactions`;
const idempCol = (tenantId: string) => `tenants/${tenantId}/loyaltyIdempotency`;

const STATES_COL = "user_brand_loyalty";

/**
 * v3 §3.10: state docs live at the top-level `user_brand_loyalty` collection,
 * keyed by `{userId}_{brandId}`.
 */
const stateDocId = (tenantId: string, userId: string) =>
  `${userId}_${tenantId}`;

// ---------------------------------------------------------------------------
// Repository type
// ---------------------------------------------------------------------------

export type LoyaltyRepository = {
  getLoyaltyConfig(tenantId: string): Promise<TenantLoyaltyConfig | null>;
  saveLoyaltyConfig(config: TenantLoyaltyConfig): Promise<void>;
  getCustomerLoyaltyState(userId: string, tenantId: string): Promise<CustomerLoyaltyState | null>;
  creditPoints(
    userId: string,
    tenantId: string,
    points: number,
    reason: string,
    referenceId: string,
    idempotencyKey: string,
  ): Promise<LoyaltyTransaction>;
  debitPoints(
    userId: string,
    tenantId: string,
    points: number,
    reason: string,
    referenceId: string,
    idempotencyKey: string,
  ): Promise<LoyaltyTransaction>;
  getBalance(userId: string, tenantId: string): Promise<number>;
  listTransactions(
    userId: string,
    tenantId: string,
    pageLimit?: number,
  ): Promise<LoyaltyTransaction[]>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createLoyaltyRepository(db: Firestore): LoyaltyRepository {
  async function getLoyaltyConfig(tenantId: string): Promise<TenantLoyaltyConfig | null> {
    const ref = doc(db, configCol(tenantId), "config");
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as TenantLoyaltyConfig;
  }

  async function saveLoyaltyConfig(config: TenantLoyaltyConfig): Promise<void> {
    const ref = doc(db, configCol(config.tenantId), "config");
    await setDoc(ref, { ...config, updatedAt: serverTimestamp() });
  }

  async function getCustomerLoyaltyState(
    userId: string,
    tenantId: string,
  ): Promise<CustomerLoyaltyState | null> {
    const ref = doc(db, STATES_COL, stateDocId(tenantId, userId));
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as CustomerLoyaltyState;
  }

  async function applyPointsDelta(
    userId: string,
    tenantId: string,
    points: number,
    type: LoyaltyTransactionType,
    reason: string,
    referenceId: string,
    idempotencyKey: string,
  ): Promise<LoyaltyTransaction> {
    if (points <= 0) {
      throw new LoyaltyError("INVALID_POINTS", "Points must be a positive number");
    }

    // Idempotency check — return existing result if already applied
    const idempRef = doc(db, idempCol(tenantId), idempotencyKey);
    const idempSnap = await getDoc(idempRef);
    if (idempSnap.exists()) {
      const existingTxId = (idempSnap.data() as { txId: string }).txId;
      const txRef = doc(db, txCol(tenantId), existingTxId);
      const txSnap = await getDoc(txRef);
      return txSnap.data() as LoyaltyTransaction;
    }

    // Read current state
    const stateRef = doc(db, STATES_COL, stateDocId(tenantId, userId));
    const stateSnap = await getDoc(stateRef);

    let currentPoints = 0;
    let lifetimePoints = 0;
    let enrolledAt: unknown = null;

    if (stateSnap.exists()) {
      const state = stateSnap.data() as CustomerLoyaltyState;
      currentPoints = state.points;
      lifetimePoints = state.lifetimePoints;
      enrolledAt = state.enrolledAt;
    }

    if (type === "debit" && currentPoints < points) {
      throw new LoyaltyError(
        "INSUFFICIENT_POINTS",
        `User ${userId} has only ${currentPoints} points; cannot deduct ${points}`,
      );
    }

    // Compute new balances
    const newPoints = type === "credit" ? currentPoints + points : currentPoints - points;
    const newLifetimePoints = type === "credit" ? lifetimePoints + points : lifetimePoints;

    const config = await getLoyaltyConfig(tenantId);
    const tiers = config?.tiers ?? [];
    const newTierId = resolveCurrentTier(newLifetimePoints, tiers);

    const now = serverTimestamp();
    const txRef = doc(collection(db, txCol(tenantId)));
    const txId = txRef.id;

    const newState: Record<string, unknown> = {
      userId,
      tenantId,
      // v3 alias: brandId mirrors tenantId on the new top-level collection.
      brandId: tenantId,
      points: newPoints,
      // v3 spec field name used by consumer discovery reader.
      pointsBalance: newPoints,
      lifetimePoints: newLifetimePoints,
      currentTierId: newTierId,
      enrolledAt: enrolledAt ?? now,
      updatedAt: now,
    };

    const txData: Record<string, unknown> = {
      txId,
      userId,
      tenantId,
      type,
      points,
      reason,
      referenceId,
      idempotencyKey,
      createdAt: now,
    };

    const batch = writeBatch(db);
    batch.set(stateRef, newState);
    batch.set(txRef, txData);
    batch.set(idempRef, { txId, createdAt: now });
    await batch.commit();

    const txSnap = await getDoc(txRef);
    return txSnap.data() as LoyaltyTransaction;
  }

  async function creditPoints(
    userId: string,
    tenantId: string,
    points: number,
    reason: string,
    referenceId: string,
    idempotencyKey: string,
  ): Promise<LoyaltyTransaction> {
    return applyPointsDelta(userId, tenantId, points, "credit", reason, referenceId, idempotencyKey);
  }

  async function debitPoints(
    userId: string,
    tenantId: string,
    points: number,
    reason: string,
    referenceId: string,
    idempotencyKey: string,
  ): Promise<LoyaltyTransaction> {
    return applyPointsDelta(userId, tenantId, points, "debit", reason, referenceId, idempotencyKey);
  }

  async function getBalance(userId: string, tenantId: string): Promise<number> {
    const state = await getCustomerLoyaltyState(userId, tenantId);
    return state?.points ?? 0;
  }

  async function listTransactions(
    userId: string,
    tenantId: string,
    pageLimit = 50,
  ): Promise<LoyaltyTransaction[]> {
    // orderBy("createdAt") is intentionally omitted — combining where(userId)
    // + orderBy requires a composite index that may not be deployed.
    // Sort in memory instead (same pattern as other booking queries).
    const q = query(
      collection(db, txCol(tenantId)),
      where("userId", "==", userId),
      firestoreLimit(pageLimit),
    );
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => d.data() as LoyaltyTransaction);
    rows.sort((a, b) => {
      const aMs = typeof (a.createdAt as { toMillis?: () => number }).toMillis === "function"
        ? (a.createdAt as { toMillis: () => number }).toMillis() : 0;
      const bMs = typeof (b.createdAt as { toMillis?: () => number }).toMillis === "function"
        ? (b.createdAt as { toMillis: () => number }).toMillis() : 0;
      return bMs - aMs;
    });
    return rows;
  }

  return {
    getLoyaltyConfig,
    saveLoyaltyConfig,
    getCustomerLoyaltyState,
    creditPoints,
    debitPoints,
    getBalance,
    listTransactions,
  };
}
