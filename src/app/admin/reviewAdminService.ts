/**
 * W46 — reviewAdminService
 *
 * Factory for admin review surfaces: review queue, owner reply composer,
 * flag / dispute / hide, review automation rules, and reputation dashboard.
 *
 * Pattern (mirrors clientCrmService / loyaltyAdminService):
 *   • Optional repo port injections.
 *   • Absent repo → { ok: false, message: "… not configured." }
 *   • Real Firestore adapters tracked as W46-DEBT-1 (if needed).
 */

import type {
  ReputationStats,
  ReviewAdminResult,
  ReviewAutomationRule,
  ReviewAutomationRuleInput,
  ReviewBulkAction,
  ReviewDisputeInput,
  ReviewEntry,
  ReviewFlagInput,
  ReviewHideInput,
  ReviewQueueFilter,
  ReviewReplyInput,
} from "../../domains/reviews/reviewAdminModel";

// ---------------------------------------------------------------------------
// Repository ports
// ---------------------------------------------------------------------------

export type ReviewQueueRepository = {
  list(tenantId: string, filter: ReviewQueueFilter): Promise<ReviewEntry[]>;
  getById(reviewId: string, tenantId: string): Promise<ReviewEntry | null>;
  getReputationStats(tenantId: string): Promise<ReputationStats>;
};

export type ReviewWriteRepository = {
  saveReply(input: ReviewReplyInput): Promise<ReviewEntry>;
  flagReview(input: ReviewFlagInput): Promise<ReviewEntry>;
  disputeReview(input: ReviewDisputeInput): Promise<ReviewEntry>;
  hideReview(input: ReviewHideInput): Promise<ReviewEntry>;
  bulkAction(tenantId: string, action: ReviewBulkAction): Promise<void>;
  saveAutomationRule(input: ReviewAutomationRuleInput): Promise<ReviewAutomationRule>;
  listAutomationRules(tenantId: string): Promise<ReviewAutomationRule[]>;
  toggleAutomationRule(ruleId: string, tenantId: string, active: boolean): Promise<void>;
  deleteAutomationRule(ruleId: string, tenantId: string): Promise<void>;
};

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

function fmtError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createReviewAdminService(
  queueRepo?: ReviewQueueRepository,
  writeRepo?: ReviewWriteRepository,
) {
  // -------------------------------------------------------------------------
  // Review queue
  // -------------------------------------------------------------------------

  async function listReviews(
    tenantId: string,
    filter: ReviewQueueFilter,
  ): Promise<ReviewAdminResult<ReviewEntry[]>> {
    if (!queueRepo) return { ok: false, message: "Review queue repository not configured." };
    try {
      return { ok: true, data: await queueRepo.list(tenantId, filter) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function getReview(
    reviewId: string,
    tenantId: string,
  ): Promise<ReviewAdminResult<ReviewEntry | null>> {
    if (!queueRepo) return { ok: false, message: "Review queue repository not configured." };
    try {
      return { ok: true, data: await queueRepo.getById(reviewId, tenantId) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function loadReputationStats(
    tenantId: string,
  ): Promise<ReviewAdminResult<ReputationStats>> {
    if (!queueRepo)
      return { ok: false, message: "Review queue repository not configured." };
    try {
      return { ok: true, data: await queueRepo.getReputationStats(tenantId) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Write actions
  // -------------------------------------------------------------------------

  async function replyToReview(
    input: ReviewReplyInput,
  ): Promise<ReviewAdminResult<ReviewEntry>> {
    if (!writeRepo) return { ok: false, message: "Review write repository not configured." };
    try {
      return { ok: true, data: await writeRepo.saveReply(input) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function flagReview(
    input: ReviewFlagInput,
  ): Promise<ReviewAdminResult<ReviewEntry>> {
    if (!writeRepo) return { ok: false, message: "Review write repository not configured." };
    try {
      return { ok: true, data: await writeRepo.flagReview(input) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function disputeReview(
    input: ReviewDisputeInput,
  ): Promise<ReviewAdminResult<ReviewEntry>> {
    if (!writeRepo) return { ok: false, message: "Review write repository not configured." };
    try {
      return { ok: true, data: await writeRepo.disputeReview(input) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function hideReview(
    input: ReviewHideInput,
  ): Promise<ReviewAdminResult<ReviewEntry>> {
    if (!writeRepo) return { ok: false, message: "Review write repository not configured." };
    try {
      return { ok: true, data: await writeRepo.hideReview(input) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function bulkAction(
    tenantId: string,
    action: ReviewBulkAction,
  ): Promise<ReviewAdminResult<void>> {
    if (!writeRepo) return { ok: false, message: "Review write repository not configured." };
    try {
      await writeRepo.bulkAction(tenantId, action);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Automation rules
  // -------------------------------------------------------------------------

  async function listAutomationRules(
    tenantId: string,
  ): Promise<ReviewAdminResult<ReviewAutomationRule[]>> {
    if (!writeRepo) return { ok: false, message: "Review write repository not configured." };
    try {
      return { ok: true, data: await writeRepo.listAutomationRules(tenantId) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function saveAutomationRule(
    input: ReviewAutomationRuleInput,
  ): Promise<ReviewAdminResult<ReviewAutomationRule>> {
    if (!writeRepo) return { ok: false, message: "Review write repository not configured." };
    try {
      return { ok: true, data: await writeRepo.saveAutomationRule(input) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function toggleAutomationRule(
    ruleId: string,
    tenantId: string,
    active: boolean,
  ): Promise<ReviewAdminResult<void>> {
    if (!writeRepo) return { ok: false, message: "Review write repository not configured." };
    try {
      await writeRepo.toggleAutomationRule(ruleId, tenantId, active);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function deleteAutomationRule(
    ruleId: string,
    tenantId: string,
  ): Promise<ReviewAdminResult<void>> {
    if (!writeRepo) return { ok: false, message: "Review write repository not configured." };
    try {
      await writeRepo.deleteAutomationRule(ruleId, tenantId);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  return {
    listReviews,
    getReview,
    loadReputationStats,
    replyToReview,
    flagReview,
    disputeReview,
    hideReview,
    bulkAction,
    listAutomationRules,
    saveAutomationRule,
    toggleAutomationRule,
    deleteAutomationRule,
  };
}

export type ReviewAdminService = ReturnType<typeof createReviewAdminService>;
