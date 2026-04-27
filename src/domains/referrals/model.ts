import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Referral code
// ---------------------------------------------------------------------------

export type ReferralCode = {
  /** Firestore document ID (same as `code`) */
  codeId: string;
  tenantId: string;
  /** User ID of the referrer */
  userId: string;
  /** Short human-readable code, e.g. "ABC123" */
  code: string;
  usageCount: number;
  createdAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Referral record
// ---------------------------------------------------------------------------

export type ReferralStatus = "pending" | "rewarded" | "voided";

export type ReferralRecord = {
  recordId: string;
  tenantId: string;
  referrerId: string;
  refereeId: string;
  code: string;
  status: ReferralStatus;
  createdAt: Timestamp;
  rewardedAt: Timestamp | null;
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type ReferralErrorCode =
  | "SELF_REFERRAL"
  | "ALREADY_REFERRED"
  | "ALREADY_REWARDED"
  | "CODE_NOT_FOUND";

export class ReferralError extends Error {
  constructor(
    public readonly code: ReferralErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ReferralError";
  }
}

// ---------------------------------------------------------------------------
// Code generation helper
// ---------------------------------------------------------------------------

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generate a pseudo-random referral code of the given length.
 * Defaults to 6 characters. Uses only unambiguous alphanumerics (no 0/O/1/I).
 */
export function generateCode(length = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return result;
}
