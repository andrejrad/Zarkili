/**
 * updateServiceDerivedFields.ts
 *
 * Cloud Function triggered by writes to tenants/{tenantId}/reviews/{reviewId}.
 *
 * On every published/un-published review, it recomputes and writes derived
 * rating aggregates to three documents:
 *
 *   1. `brands/{tenantId}/locations/{locationId}/service_types/{serviceTypeId}`
 *      — serviceAverageRating, serviceReviewCount, serviceRatingSum
 *      (only when review.serviceId is set)
 *   2. staff/{staffId}            — averageRating, reviewCount, ratingSum
 *      (only when review.technicianRating is set)
 *   3. locations/{locationId}     — averageRating, reviewCount, ratingSum; then backfills
 *      locationAverageRating / locationReviewCount on all services at that location
 *
 * Thresholds (minimum reviews before averageRating is surfaced):
 *   Service    ≥ 5
 *   Technician ≥ 3
 *   Location   ≥ 5
 *
 * Only reviews with status == "published" contribute to aggregates.
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

if (getApps().length === 0) {
  initializeApp();
}

const SERVICE_MIN_REVIEWS = 5;
const STAFF_MIN_REVIEWS = 3;
const LOCATION_MIN_REVIEWS = 5;

// ---------------------------------------------------------------------------
// Pure business logic — unit-testable without Cloud Functions runtime
// ---------------------------------------------------------------------------

export interface ReviewDoc {
  tenantId: string;
  locationId: string;
  staffId: string;
  serviceId?: string | null;
  rating: number;
  technicianRating?: number | null;
  status: string;
}

export interface RatingAggregate {
  averageRating: number | null;
  reviewCount: number;
  ratingSum: number;
}

/**
 * Queries all published reviews for a given target field/value pair and
 * returns the computed aggregate.
 */
export async function computeAggregate(
  db: FirebaseFirestore.Firestore,
  tenantId: string,
  filterField: string,
  filterValue: string,
  ratingField: "rating" | "technicianRating",
  minReviews: number,
): Promise<RatingAggregate> {
  const snap = await db
    .collectionGroup("reviews")
    .where("tenantId", "==", tenantId)
    .where(filterField, "==", filterValue)
    .where("status", "==", "published")
    .get();

  let ratingSum = 0;
  let reviewCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const val = data[ratingField];
    if (typeof val === "number" && val >= 1 && val <= 5) {
      ratingSum += val;
      reviewCount++;
    }
  }

  const averageRating =
    reviewCount >= minReviews ? Math.round((ratingSum / reviewCount) * 10) / 10 : null;

  return { averageRating, reviewCount, ratingSum };
}

// ---------------------------------------------------------------------------
// Cloud Function trigger
// ---------------------------------------------------------------------------

export const updateServiceDerivedFields = onDocumentWritten(
  "tenants/{tenantId}/reviews/{reviewId}",
  async (event) => {
    const db = getFirestore();
    const { tenantId } = event.params;

    // Prefer post-write data; fall back to pre-write for deletions.
    const review = (event.data?.after?.data() ?? event.data?.before?.data()) as
      | ReviewDoc
      | undefined;

    if (!review) {
      logger.warn("updateServiceDerivedFields: no review data found", event.params);
      return;
    }

    const { locationId, staffId, serviceId, technicianRating } = review;

    const updates: Promise<void>[] = [];

    // 1. Location aggregate + denorm backfill to service docs
    updates.push(
      computeAggregate(db, tenantId, "locationId", locationId, "rating", LOCATION_MIN_REVIEWS).then(
        async (locationAgg) => {
          // Write aggregate to the location doc
          await db
            .collection("locations")
            .doc(locationId)
            .update({
              ...locationAgg,
              updatedAt: FieldValue.serverTimestamp(),
            });

          // Backfill locationAverageRating / locationReviewCount on all service_types
          // for this location so Explore cards stay in sync without a re-query.
          const servicesSnap = await db
            .collectionGroup("service_types")
            .where("brandId", "==", tenantId)
            .where("locationId", "==", locationId)
            .get();

          if (!servicesSnap.empty) {
            const batch = db.batch();
            for (const svcDoc of servicesSnap.docs) {
              batch.update(svcDoc.ref, {
                locationAverageRating: locationAgg.averageRating,
                locationReviewCount: locationAgg.reviewCount,
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
            await batch.commit();
          }
        },
      ),
    );

    // 2. Staff / technician aggregate
    if (typeof technicianRating === "number") {
      updates.push(
        computeAggregate(db, tenantId, "staffId", staffId, "technicianRating", STAFF_MIN_REVIEWS).then(
          async (agg) => {
            await db
              .collection("staff")
              .doc(staffId)
              .update({
                ...agg,
                updatedAt: FieldValue.serverTimestamp(),
              });
          },
        ),
      );
    }

    // 3. Service aggregate
    if (serviceId) {
      updates.push(
        computeAggregate(db, tenantId, "serviceId", serviceId, "rating", SERVICE_MIN_REVIEWS).then(
          async ({ averageRating, reviewCount, ratingSum }) => {
            await db
              .collection("brands").doc(tenantId)
              .collection("locations").doc(review.locationId)
              .collection("service_types").doc(serviceId)
              .update({
                serviceAverageRating: averageRating,
                serviceReviewCount: reviewCount,
                serviceRatingSum: ratingSum,
                updatedAt: FieldValue.serverTimestamp(),
              });
          },
        ),
      );
    }

    await Promise.all(updates);
    logger.info("updateServiceDerivedFields: completed", {
      tenantId,
      locationId,
      staffId,
      serviceId,
    });
  },
);
