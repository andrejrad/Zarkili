/**
 * Loyalty repository
 *
 * Collection layout (all tenant-scoped):
 *   tenants/{tenantId}/loyaltyConfig/config      — singleton TenantLoyaltyConfig
 *   tenants/{tenantId}/loyaltyStates/{userId}    — CustomerLoyaltyState
 *   tenants/{tenantId}/loyaltyTransactions/{txId} — LoyaltyTransaction
 *   tenants/{tenantId}/loyaltyIdempotency/{key}  — idempotency records
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as firestoreLimit,
  orderBy,
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
const statesCol = (tenantId: string) => `tenants/${tenantId}/loyaltyStates`;
const txCol = (tenantId: string) => `tenants/${tenantId}/loyaltyTransactions`;
const idempCol = (tenantId: string) => `tenants/${tenantId}/loyaltyIdempotency`;

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
    const ref = doc(db, statesCol(tenantId), userId);
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
    const stateRef = doc(db, statesCol(tenantId), userId);
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
      points: newPoints,
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
    const q = query(
      collection(db, txCol(tenantId)),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      firestoreLimit(pageLimit),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LoyaltyTransaction);
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
