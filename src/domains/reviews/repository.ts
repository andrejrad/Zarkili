/**
 * Reviews repository
 *
 * Collection layout:
 *   tenants/{tenantId}/reviews/{reviewId}
 *   tenants/{tenantId}/ratingAggregates/staff_{staffId}     ← cached rating aggregate
 *   tenants/{tenantId}/ratingAggregates/location_{locationId} ← cached rating aggregate
 *
 * Firestore indexes required:
 *   tenants/{tenantId}/reviews — staffId ASC, status ASC, createdAt DESC
 *   tenants/{tenantId}/reviews — locationId ASC, status ASC, createdAt DESC
 *   tenants/{tenantId}/reviews — bookingId ASC  (unique check)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import {
  ReviewError,
  canModerate,
  validateRating,
  calculateAverageRating,
  type Review,
  type CreateReviewInput,
  type ModerateReviewInput,
  type RatingAggregate,
} from "./model";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

export type ReviewRepository = {
  /**
   * Create a new review for a completed booking.
   * Throws ReviewError("NOT_ELIGIBLE")   when the booking is not completed or
   *                                       the customerId doesn't match.
   * Throws ReviewError("ALREADY_REVIEWED") when a review for this booking exists.
   * Throws ReviewError("INVALID_RATING") when rating is outside 1–5.
   */
  createReview(
    input: CreateReviewInput,
    /** Pass a verified booking snapshot — repository doesn't re-fetch it */
    bookingSnapshot: { status: string; customerId: string },
  ): Promise<Review>;

  /** Get the review for a specific booking, or null if none exists. */
  getBookingReview(tenantId: string, bookingId: string): Promise<Review | null>;

  /** List published reviews for a staff member, newest first. */
  listStaffReviews(
    tenantId: string,
    staffId: string,
    status?: Review["status"],
  ): Promise<Review[]>;

  /** List published reviews for a location, newest first. */
  listLocationReviews(
    tenantId: string,
    locationId: string,
    status?: Review["status"],
  ): Promise<Review[]>;

  /**
   * Moderate a review (publish / hide / reject).
   * Throws ReviewError("NOT_FOUND")          when review doesn't exist.
   * Throws ReviewError("INVALID_TRANSITION") when the status change is disallowed.
   */
  moderateReview(input: ModerateReviewInput): Promise<Review>;

  /** Aggregate average rating for a staff member (published reviews only). */
  getStaffRatingAggregate(tenantId: string, staffId: string): Promise<RatingAggregate>;

  /** Aggregate average rating for a location (published reviews only). */
  getLocationRatingAggregate(tenantId: string, locationId: string): Promise<RatingAggregate>;

  /**
   * Recompute and persist the cached aggregate for a staff member.
   * Call from a scheduled Cloud Function for periodic consistency fixes.
   */
  syncStaffAggregate(tenantId: string, staffId: string): Promise<RatingAggregate>;

  /**
   * Recompute and persist the cached aggregate for a location.
   * Call from a scheduled Cloud Function for periodic consistency fixes.
   */
  syncLocationAggregate(tenantId: string, locationId: string): Promise<RatingAggregate>;
};

export function createReviewRepository(db: Firestore): ReviewRepository {
  function reviewsCol(tenantId: string) {
    return collection(db, `tenants/${tenantId}/reviews`);
  }

  function reviewRef(tenantId: string, reviewId: string) {
    return doc(db, `tenants/${tenantId}/reviews`, reviewId);
  }

  function aggregatesCol(tenantId: string) {
    return collection(db, `tenants/${tenantId}/ratingAggregates`);
  }

  function staffAggregateRef(tenantId: string, staffId: string) {
    return doc(aggregatesCol(tenantId), `staff_${staffId}`);
  }

  function locationAggregateRef(tenantId: string, locationId: string) {
    return doc(aggregatesCol(tenantId), `location_${locationId}`);
  }

  // -------------------------------------------------------------------------
  // createReview
  // -------------------------------------------------------------------------

  async function createReview(
    input: CreateReviewInput,
    bookingSnapshot: { status: string; customerId: string },
  ): Promise<Review> {
    assertNonEmpty(input.tenantId, "tenantId");
    assertNonEmpty(input.bookingId, "bookingId");
    assertNonEmpty(input.customerId, "customerId");
    validateRating(input.rating);

    // Eligibility: booking must be completed and belong to this customer
    if (bookingSnapshot.status !== "completed") {
      throw new ReviewError("NOT_ELIGIBLE", "Review can only be submitted for a completed booking");
    }
    if (bookingSnapshot.customerId !== input.customerId) {
      throw new ReviewError("NOT_ELIGIBLE", "Customer does not own this booking");
    }

    // Duplicate check
    const existing = await getBookingReview(input.tenantId, input.bookingId);
    if (existing) {
      throw new ReviewError("ALREADY_REVIEWED", `A review for booking ${input.bookingId} already exists`);
    }

    const ref = doc(reviewsCol(input.tenantId));
    const reviewId = ref.id;
    const now = serverTimestamp();

    const reviewData: Omit<Review, "createdAt" | "updatedAt" | "moderatedAt"> & {
      createdAt: unknown;
      updatedAt: unknown;
      moderatedAt: null;
    } = {
      reviewId,
      tenantId: input.tenantId,
      locationId: input.locationId,
      staffId: input.staffId,
      bookingId: input.bookingId,
      customerId: input.customerId,
      rating: input.rating,
      comment: input.comment ?? null,
      status: "pending_moderation",
      createdAt: now,
      updatedAt: now,
      moderatedBy: null,
      moderatedAt: null,
      moderationReason: null,
    };

    await setDoc(ref, reviewData);
    const snap = await getDoc(ref);
    return snap.data() as Review;
  }

  // -------------------------------------------------------------------------
  // getBookingReview
  // -------------------------------------------------------------------------

  async function getBookingReview(
    tenantId: string,
    bookingId: string,
  ): Promise<Review | null> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(bookingId, "bookingId");

    const q = query(
      reviewsCol(tenantId),
      where("bookingId", "==", bookingId),
    );
    const snap = await getDocs(q);
    if (snap.docs.length === 0) return null;
    return snap.docs[0].data() as Review;
  }

  // -------------------------------------------------------------------------
  // listStaffReviews
  // -------------------------------------------------------------------------

  async function listStaffReviews(
    tenantId: string,
    staffId: string,
    status: Review["status"] = "published",
  ): Promise<Review[]> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(staffId, "staffId");

    const q = query(
      reviewsCol(tenantId),
      where("staffId", "==", staffId),
      where("status", "==", status),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Review);
  }

  // -------------------------------------------------------------------------
  // listLocationReviews
  // -------------------------------------------------------------------------

  async function listLocationReviews(
    tenantId: string,
    locationId: string,
    status: Review["status"] = "published",
  ): Promise<Review[]> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(locationId, "locationId");

    const q = query(
      reviewsCol(tenantId),
      where("locationId", "==", locationId),
      where("status", "==", status),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Review);
  }

  // -------------------------------------------------------------------------
  // moderateReview
  // -------------------------------------------------------------------------

  async function moderateReview(input: ModerateReviewInput): Promise<Review> {
    assertNonEmpty(input.reviewId, "reviewId");
    assertNonEmpty(input.tenantId, "tenantId");
    assertNonEmpty(input.moderatorId, "moderatorId");

    const ref = reviewRef(input.tenantId, input.reviewId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw new ReviewError("NOT_FOUND", `Review ${input.reviewId} not found`);
    }

    const current = snap.data() as Review;
    if (!canModerate(current.status, input.status)) {
      throw new ReviewError(
        "INVALID_TRANSITION",
        `Cannot transition review from ${current.status} to ${input.status}`,
      );
    }

    const now = serverTimestamp();
    await updateDoc(ref, {
      status: input.status,
      moderatedBy: input.moderatorId,
      moderatedAt: now,
      moderationReason: input.reason ?? null,
      updatedAt: now,
    });

    const updated = await getDoc(ref);
    const review = updated.data() as Review;

    // Inline cache update — keeps aggregates consistent after every moderation action
    await syncStaffAggregate(input.tenantId, review.staffId);
    await syncLocationAggregate(input.tenantId, review.locationId);

    return review;
  }

  // -------------------------------------------------------------------------
  // getStaffRatingAggregate
  // -------------------------------------------------------------------------

  async function getStaffRatingAggregate(
    tenantId: string,
    staffId: string,
  ): Promise<RatingAggregate> {
    const cacheSnap = await getDoc(staffAggregateRef(tenantId, staffId));
    if (cacheSnap.exists()) {
      const cached = cacheSnap.data() as RatingAggregate;
      return cached;
    }
    // Cache miss — compute and store
    return syncStaffAggregate(tenantId, staffId);
  }

  // -------------------------------------------------------------------------
  // getLocationRatingAggregate
  // -------------------------------------------------------------------------

  async function getLocationRatingAggregate(
    tenantId: string,
    locationId: string,
  ): Promise<RatingAggregate> {
    const cacheSnap = await getDoc(locationAggregateRef(tenantId, locationId));
    if (cacheSnap.exists()) {
      const cached = cacheSnap.data() as RatingAggregate;
      return cached;
    }
    return syncLocationAggregate(tenantId, locationId);
  }

  // -------------------------------------------------------------------------
  // syncStaffAggregate / syncLocationAggregate   (public for scheduled sync)
  // -------------------------------------------------------------------------

  async function syncStaffAggregate(
    tenantId: string,
    staffId: string,
  ): Promise<RatingAggregate> {
    const reviews = await listStaffReviews(tenantId, staffId, "published");
    const aggregate = calculateAverageRating(reviews.map((r) => r.rating));
    await setDoc(staffAggregateRef(tenantId, staffId), aggregate);
    return aggregate;
  }

  async function syncLocationAggregate(
    tenantId: string,
    locationId: string,
  ): Promise<RatingAggregate> {
    const reviews = await listLocationReviews(tenantId, locationId, "published");
    const aggregate = calculateAverageRating(reviews.map((r) => r.rating));
    await setDoc(locationAggregateRef(tenantId, locationId), aggregate);
    return aggregate;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    createReview,
    getBookingReview,
    listStaffReviews,
    listLocationReviews,
    moderateReview,
    getStaffRatingAggregate,
    getLocationRatingAggregate,
    syncStaffAggregate,
    syncLocationAggregate,
  };
}
