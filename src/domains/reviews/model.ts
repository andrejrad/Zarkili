/**
 * Reviews domain model
 *
 * A Review is submitted by a customer for a completed booking.
 * It belongs to a tenant, location, staff member, and the specific booking.
 *
 * Status lifecycle:
 *   pending_moderation → published | hidden | rejected
 */

import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewStatus =
  | "pending_moderation"
  | "published"
  | "hidden"
  | "rejected";

export type Review = {
  /** Firestore document ID */
  reviewId: string;
  tenantId: string;
  locationId: string;
  /** Staff member who performed the service */
  staffId: string;
  /** The booking this review is for — used for eligibility check */
  bookingId: string;
  /** Customer who submitted the review */
  customerId: string;
  /** Integer 1–5 */
  rating: number;
  /** Optional free-text comment */
  comment: string | null;
  status: ReviewStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Populated when admin moderates */
  moderatedBy: string | null;
  moderatedAt: Timestamp | null;
  moderationReason: string | null;
};

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export type CreateReviewInput = {
  tenantId: string;
  locationId: string;
  staffId: string;
  bookingId: string;
  customerId: string;
  rating: number;
  comment?: string;
};

export type ModerateReviewInput = {
  reviewId: string;
  tenantId: string;
  /** The admin/moderator performing the action */
  moderatorId: string;
  status: "published" | "hidden" | "rejected";
  reason?: string;
};

// ---------------------------------------------------------------------------
// Rating aggregate
// ---------------------------------------------------------------------------

export type RatingAggregate = {
  averageRating: number;
  reviewCount: number;
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type ReviewErrorCode =
  | "NOT_ELIGIBLE"         // booking not completed or not owned by customer
  | "ALREADY_REVIEWED"     // a review for this bookingId already exists
  | "NOT_FOUND"            // review document does not exist
  | "INVALID_RATING"       // rating outside 1–5
  | "INVALID_TRANSITION";  // attempted moderation status is not allowed

export class ReviewError extends Error {
  constructor(
    public readonly code: ReviewErrorCode,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "ReviewError";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Allowed moderation transitions from current status */
export const REVIEW_MODERATION_TRANSITIONS: Partial<
  Record<ReviewStatus, ReviewStatus[]>
> = {
  pending_moderation: ["published", "hidden", "rejected"],
  published: ["hidden", "rejected"],
  hidden: ["published", "rejected"],
  rejected: ["published"],
};

export function canModerate(
  from: ReviewStatus,
  to: ReviewStatus,
): boolean {
  return (REVIEW_MODERATION_TRANSITIONS[from] ?? []).includes(to);
}

export function validateRating(rating: number): void {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ReviewError("INVALID_RATING", `Rating must be an integer 1–5, got ${rating}`);
  }
}

/**
 * Calculate average rating from a list of published reviews.
 * Returns { averageRating: 0, reviewCount: 0 } when list is empty.
 */
export function calculateAverageRating(ratings: number[]): RatingAggregate {
  if (ratings.length === 0) {
    return { averageRating: 0, reviewCount: 0 };
  }
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return {
    averageRating: Math.round((sum / ratings.length) * 10) / 10,
    reviewCount: ratings.length,
  };
}
