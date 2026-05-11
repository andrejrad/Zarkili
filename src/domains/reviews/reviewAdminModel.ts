/**
 * W46 — reviewAdminModel
 *
 * Domain types for the admin review-queue, owner reply composer,
 * flag / dispute / hide surfaces, review automation rules, and
 * reputation summary dashboard.
 */

// ---------------------------------------------------------------------------
// Review entry
// ---------------------------------------------------------------------------

export type ReviewStatus =
  | "pending"
  | "replied"
  | "flagged"
  | "hidden"
  | "disputed";

export type ReviewEntry = {
  reviewId: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  rating: number; // 1–5
  comment: string;
  status: ReviewStatus;
  createdAt: string; // ISO datetime
  replyText: string | null;
  repliedAt: string | null;
  repliedBy: string | null;
  flagReason: string | null;
  flaggedBy: string | null;
  flaggedAt: string | null;
  disputeReason: string | null;
  automationRuleId: string | null;
  staffId: string | null;
  serviceId: string | null;
  bookingId: string | null;
};

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export type ReviewQueueFilter = "all" | "pending" | "replied" | "flagged" | "hidden" | "disputed";

// ---------------------------------------------------------------------------
// Write inputs
// ---------------------------------------------------------------------------

export type ReviewReplyInput = {
  reviewId: string;
  tenantId: string;
  replyText: string;
  authorId: string;
};

export type ReviewFlagInput = {
  reviewId: string;
  tenantId: string;
  reason: string;
  flaggedBy: string;
};

export type ReviewDisputeInput = {
  reviewId: string;
  tenantId: string;
  reasoning: string;
  requestedBy: string;
};

export type ReviewHideInput = {
  reviewId: string;
  tenantId: string;
  reason: string;
  hiddenBy: string;
};

export type ReviewBulkAction =
  | { type: "hide"; reviewIds: string[]; reason: string; actorId: string }
  | { type: "flag"; reviewIds: string[]; reason: string; actorId: string };

// ---------------------------------------------------------------------------
// Automation rules
// ---------------------------------------------------------------------------

export type ReviewRatingOp = "eq" | "gte" | "lte";

export type ReviewAutomationRule = {
  ruleId: string;
  tenantId: string;
  label: string;
  triggerRating: number;
  triggerRatingOp: ReviewRatingOp;
  replyTemplate: string;
  active: boolean;
  createdAt: string;
};

export type ReviewAutomationRuleInput = Omit<ReviewAutomationRule, "ruleId" | "createdAt">;

// ---------------------------------------------------------------------------
// Reputation stats
// ---------------------------------------------------------------------------

export type ReviewRatingBreakdown = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

export type ReputationStats = {
  averageRating: number;
  totalReviews: number;
  breakdown: ReviewRatingBreakdown;
  replyRate: number; // 0–1
  pendingCount: number;
  flaggedCount: number;
  trendLast30Days: number | null; // delta in avg rating
};

// ---------------------------------------------------------------------------
// Generic result wrapper
// ---------------------------------------------------------------------------

export type ReviewAdminResult<T> = { ok: true; data: T } | { ok: false; message: string };
