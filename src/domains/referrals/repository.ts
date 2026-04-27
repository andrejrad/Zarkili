/**
 * Referral repository
 *
 * Collection layout:
 *   referralCodes/{code}                           — ReferralCode (top-level, keyed by code)
 *   tenants/{tenantId}/referralRecords/{recordId}  — ReferralRecord
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import {
  ReferralError,
  generateCode,
  type ReferralCode,
  type ReferralRecord,
  type ReferralStatus,
} from "./model";

// ---------------------------------------------------------------------------
// Collection helpers
// ---------------------------------------------------------------------------

const CODES_COL = "referralCodes";
const recordsCol = (tenantId: string) => `tenants/${tenantId}/referralRecords`;

// ---------------------------------------------------------------------------
// Repository type
// ---------------------------------------------------------------------------

export type ReferralsRepository = {
  /**
   * Get or create a referral code for the given user+tenant pair.
   * Idempotent — returns existing code if one already exists.
   */
  generateReferralCode(userId: string, tenantId: string): Promise<ReferralCode>;

  /** Look up a code document by the code string. Returns null if not found. */
  getReferralCode(code: string): Promise<ReferralCode | null>;

  /** Return the referral code owned by a specific user within a tenant. */
  getReferralCodeForUser(userId: string, tenantId: string): Promise<ReferralCode | null>;

  /**
   * Record a referral relationship.
   * Throws ReferralError("SELF_REFERRAL") if referrerId === refereeId.
   * Throws ReferralError("ALREADY_REFERRED") if the referee already has a
   *   non-voided referral record in this tenant.
   */
  createReferralRecord(
    tenantId: string,
    referrerId: string,
    refereeId: string,
    code: string,
  ): Promise<ReferralRecord>;

  /**
   * Mark a referral record as "rewarded".
   * Throws ReferralError("CODE_NOT_FOUND") if the record does not exist.
   * Throws ReferralError("ALREADY_REWARDED") if already in "rewarded" state.
   */
  rewardReferral(recordId: string, tenantId: string): Promise<void>;

  /** Return all pending records for a given referee (usually 0 or 1). */
  getPendingReferralForReferee(userId: string, tenantId: string): Promise<ReferralRecord | null>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createReferralsRepository(db: Firestore): ReferralsRepository {
  async function generateReferralCode(userId: string, tenantId: string): Promise<ReferralCode> {
    // Check if user already has a code for this tenant
    const existing = await getReferralCodeForUser(userId, tenantId);
    if (existing) return existing;

    // Generate a unique code (retry on collision — very rare)
    let code = generateCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const snap = await getDoc(doc(db, CODES_COL, code));
      if (!snap.exists()) break;
      code = generateCode();
    }

    const ref = doc(db, CODES_COL, code);
    const payload: Omit<ReferralCode, "createdAt"> & { createdAt: unknown } = {
      codeId: code,
      tenantId,
      userId,
      code,
      usageCount: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    const snap = await getDoc(ref);
    return snap.data() as ReferralCode;
  }

  async function getReferralCode(code: string): Promise<ReferralCode | null> {
    const snap = await getDoc(doc(db, CODES_COL, code));
    if (!snap.exists()) return null;
    return snap.data() as ReferralCode;
  }

  async function getReferralCodeForUser(userId: string, tenantId: string): Promise<ReferralCode | null> {
    const q = query(
      collection(db, CODES_COL),
      where("userId", "==", userId),
      where("tenantId", "==", tenantId),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0]!.data() as ReferralCode;
  }

  async function createReferralRecord(
    tenantId: string,
    referrerId: string,
    refereeId: string,
    code: string,
  ): Promise<ReferralRecord> {
    if (referrerId === refereeId) {
      throw new ReferralError("SELF_REFERRAL", "A user cannot refer themselves");
    }

    // Check for existing active referral for this referee in this tenant
    const existing = await getPendingReferralForReferee(refereeId, tenantId);
    if (existing) {
      throw new ReferralError(
        "ALREADY_REFERRED",
        `User ${refereeId} has already been referred in tenant ${tenantId}`,
      );
    }

    const recordRef = doc(collection(db, recordsCol(tenantId)));
    const recordId = recordRef.id;
    const now = serverTimestamp();

    const payload: Record<string, unknown> = {
      recordId,
      tenantId,
      referrerId,
      refereeId,
      code,
      status: "pending" as ReferralStatus,
      createdAt: now,
      rewardedAt: null,
    };

    await setDoc(recordRef, payload);

    // Increment usage count on the code
    const codeRef = doc(db, CODES_COL, code);
    const codeSnap = await getDoc(codeRef);
    if (codeSnap.exists()) {
      const current = (codeSnap.data() as ReferralCode).usageCount ?? 0;
      await updateDoc(codeRef, { usageCount: current + 1 });
    }

    const snap = await getDoc(recordRef);
    return snap.data() as ReferralRecord;
  }

  async function rewardReferral(recordId: string, tenantId: string): Promise<void> {
    const ref = doc(db, recordsCol(tenantId), recordId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new ReferralError("CODE_NOT_FOUND", `Referral record ${recordId} not found`);
    }
    const record = snap.data() as ReferralRecord;
    if (record.status === "rewarded") {
      throw new ReferralError("ALREADY_REWARDED", `Referral record ${recordId} already rewarded`);
    }
    await updateDoc(ref, { status: "rewarded", rewardedAt: serverTimestamp() });
  }

  async function getPendingReferralForReferee(userId: string, tenantId: string): Promise<ReferralRecord | null> {
    const q = query(
      collection(db, recordsCol(tenantId)),
      where("refereeId", "==", userId),
      where("status", "==", "pending"),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0]!.data() as ReferralRecord;
  }

  return {
    generateReferralCode,
    getReferralCode,
    getReferralCodeForUser,
    createReferralRecord,
    rewardReferral,
    getPendingReferralForReferee,
  };
}
