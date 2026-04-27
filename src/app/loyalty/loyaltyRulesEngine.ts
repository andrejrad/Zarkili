/**
 * loyaltyRulesEngine.ts
 *
 * Applies earning rules and calls the loyalty repository to credit/debit points.
 *
 * Rules:
 *   COMPLETED_APPOINTMENT — points proportional to appointment value
 *   REBOOK_BONUS          — bonus points when customer rebooks within N days
 *   REFERRAL_REWARD       — points for referrer when refereed user completes first booking
 *   SOCIAL_SHARE_REWARD   — points for sharing, capped at maxPerMonth per calendar month
 *
 * Idempotency: each rule application derives a unique key from
 *   `${tenantId}_${userId}_${ruleType}_${referenceId}` — safe to call multiple times.
 */

import type { LoyaltyRepository } from "../../domains/loyalty/repository";
import type { LoyaltyTransaction } from "../../domains/loyalty/model";

// ---------------------------------------------------------------------------
// Rule configurations
// ---------------------------------------------------------------------------

export type CompletedAppointmentRule = {
  /** Points per currency unit of appointment value (e.g. 1 point per $1) */
  pointsPerCurrencyUnit: number;
};

export type RebookBonusRule = {
  bonusPoints: number;
  /** Rebook counts if the new booking is within this many days of the previous */
  windowDays: number;
};

export type ReferralRewardRule = {
  referrerPoints: number;
  refereePoints: number;
};

export type SocialShareRewardRule = {
  points: number;
  /** Max number of social share rewards per calendar month */
  maxPerMonth: number;
};

export type EarningRulesConfig = {
  completedAppointment?: CompletedAppointmentRule;
  rebookBonus?: RebookBonusRule;
  referralReward?: ReferralRewardRule;
  socialShareReward?: SocialShareRewardRule;
};

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export type CompletedAppointmentInput = {
  tenantId: string;
  userId: string;
  bookingId: string;
  /** Monetary value of the appointment used to calculate point reward */
  appointmentValue: number;
};

export type RebookBonusInput = {
  tenantId: string;
  userId: string;
  bookingId: string;
  /** ISO date of the previous booking ("YYYY-MM-DD") */
  previousBookingDate: string;
  /** ISO date of the new booking ("YYYY-MM-DD") */
  newBookingDate: string;
};

export type ReferralRewardInput = {
  tenantId: string;
  referrerId: string;
  refereeId: string;
  /** The booking ID that triggered the referral reward */
  triggerBookingId: string;
};

export type SocialShareRewardInput = {
  tenantId: string;
  userId: string;
  shareEventId: string;
  /** Calendar month key "YYYY-MM" used for monthly cap enforcement */
  month: string;
};

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export type RuleResult =
  | { applied: true; transaction: LoyaltyTransaction }
  | { applied: false; reason: string };

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createLoyaltyRulesEngine(
  loyaltyRepository: LoyaltyRepository,
  defaultConfig: EarningRulesConfig = {},
) {
  /**
   * Credit points for a completed appointment.
   * Points = floor(appointmentValue * pointsPerCurrencyUnit).
   * Min 1 point unless value rounds to 0.
   */
  async function applyCompletedAppointment(
    input: CompletedAppointmentInput,
    ruleConfig?: CompletedAppointmentRule,
  ): Promise<RuleResult> {
    const cfg = ruleConfig ?? defaultConfig.completedAppointment;
    if (!cfg) return { applied: false, reason: "Rule not configured" };

    const points = Math.floor(input.appointmentValue * cfg.pointsPerCurrencyUnit);
    if (points <= 0) return { applied: false, reason: "Appointment value too low to earn points" };

    const idempotencyKey = `${input.tenantId}_${input.userId}_COMPLETED_APPOINTMENT_${input.bookingId}`;
    const transaction = await loyaltyRepository.creditPoints(
      input.userId,
      input.tenantId,
      points,
      "Completed appointment",
      input.bookingId,
      idempotencyKey,
    );
    return { applied: true, transaction };
  }

  /**
   * Credit bonus points when a customer rebooks within the configured window.
   */
  async function applyRebookBonus(
    input: RebookBonusInput,
    ruleConfig?: RebookBonusRule,
  ): Promise<RuleResult> {
    const cfg = ruleConfig ?? defaultConfig.rebookBonus;
    if (!cfg) return { applied: false, reason: "Rule not configured" };

    const prevMs = new Date(input.previousBookingDate).getTime();
    const newMs = new Date(input.newBookingDate).getTime();
    const diffDays = (newMs - prevMs) / (1000 * 60 * 60 * 24);

    if (diffDays < 0 || diffDays > cfg.windowDays) {
      return {
        applied: false,
        reason: `Rebook is ${Math.round(diffDays)} days after previous booking; window is ${cfg.windowDays} days`,
      };
    }

    const idempotencyKey = `${input.tenantId}_${input.userId}_REBOOK_BONUS_${input.bookingId}`;
    const transaction = await loyaltyRepository.creditPoints(
      input.userId,
      input.tenantId,
      cfg.bonusPoints,
      "Rebook bonus",
      input.bookingId,
      idempotencyKey,
    );
    return { applied: true, transaction };
  }

  /**
   * Credit referral reward points to both referrer and referee.
   * Returns results for both parties.
   */
  async function applyReferralReward(
    input: ReferralRewardInput,
    ruleConfig?: ReferralRewardRule,
  ): Promise<{ referrer: RuleResult; referee: RuleResult }> {
    const cfg = ruleConfig ?? defaultConfig.referralReward;
    if (!cfg) {
      const na = { applied: false as const, reason: "Rule not configured" };
      return { referrer: na, referee: na };
    }

    const referrerKey = `${input.tenantId}_${input.referrerId}_REFERRAL_REWARD_referrer_${input.triggerBookingId}`;
    const refereeKey = `${input.tenantId}_${input.refereeId}_REFERRAL_REWARD_referee_${input.triggerBookingId}`;

    const [referrerTx, refereeTx] = await Promise.all([
      loyaltyRepository.creditPoints(
        input.referrerId,
        input.tenantId,
        cfg.referrerPoints,
        "Referral reward",
        input.triggerBookingId,
        referrerKey,
      ),
      loyaltyRepository.creditPoints(
        input.refereeId,
        input.tenantId,
        cfg.refereePoints,
        "Welcome referral bonus",
        input.triggerBookingId,
        refereeKey,
      ),
    ]);

    return {
      referrer: { applied: true, transaction: referrerTx },
      referee: { applied: true, transaction: refereeTx },
    };
  }

  /**
   * Credit social share reward points, enforcing a per-month cap.
   * Counts existing social share transactions in the given month.
   */
  async function applySocialShareReward(
    input: SocialShareRewardInput,
    ruleConfig?: SocialShareRewardRule,
  ): Promise<RuleResult> {
    const cfg = ruleConfig ?? defaultConfig.socialShareReward;
    if (!cfg) return { applied: false, reason: "Rule not configured" };

    // Count existing social share rewards in this month
    const allTxs = await loyaltyRepository.listTransactions(input.userId, input.tenantId, 200);
    const monthShareCount = allTxs.filter(
      (tx) =>
        tx.reason === "Social share reward" &&
        tx.type === "credit" &&
        tx.referenceId.startsWith(input.month),
    ).length;

    if (monthShareCount >= cfg.maxPerMonth) {
      return {
        applied: false,
        reason: `Monthly social share limit of ${cfg.maxPerMonth} already reached for ${input.month}`,
      };
    }

    const idempotencyKey = `${input.tenantId}_${input.userId}_SOCIAL_SHARE_${input.shareEventId}`;
    const transaction = await loyaltyRepository.creditPoints(
      input.userId,
      input.tenantId,
      cfg.points,
      "Social share reward",
      `${input.month}_${input.shareEventId}`,
      idempotencyKey,
    );
    return { applied: true, transaction };
  }

  return {
    applyCompletedAppointment,
    applyRebookBonus,
    applyReferralReward,
    applySocialShareReward,
  };
}
