/**
 * reviewAdminRepository.ts — W46-DEBT-1
 *
 * Firestore adapters for the admin review surfaces.
 *
 * Collection layout:
 *   tenants/{tenantId}/reviews/{reviewId}          — ReviewEntry docs
 *   tenants/{tenantId}/reviewRules/{ruleId}         — ReviewAutomationRule docs
 *
 * ReviewQueueRepository  — read path (list, getById, reputationStats)
 * ReviewWriteRepository  — write path (reply, flag, dispute, hide, bulk, automation rules)
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

import type {
  ReputationStats,
  ReviewAutomationRule,
  ReviewAutomationRuleInput,
  ReviewBulkAction,
  ReviewDisputeInput,
  ReviewEntry,
  ReviewFlagInput,
  ReviewHideInput,
  ReviewQueueFilter,
  ReviewRatingBreakdown,
  ReviewReplyInput,
} from "../../domains/reviews/reviewAdminModel";

import type {
  ReviewQueueRepository,
  ReviewWriteRepository,
} from "./reviewAdminService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REVIEWS_SUBCOL = "reviews";
const REVIEW_RULES_SUBCOL = "reviewRules";

function reviewsCol(db: Firestore, tenantId: string) {
  return collection(db, "tenants", tenantId, REVIEWS_SUBCOL);
}

function reviewRef(db: Firestore, tenantId: string, reviewId: string) {
  return doc(db, "tenants", tenantId, REVIEWS_SUBCOL, reviewId);
}

function rulesCol(db: Firestore, tenantId: string) {
  return collection(db, "tenants", tenantId, REVIEW_RULES_SUBCOL);
}

function ruleRef(db: Firestore, tenantId: string, ruleId: string) {
  return doc(db, "tenants", tenantId, REVIEW_RULES_SUBCOL, ruleId);
}

function toIso(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (typeof (ts as { toDate?: unknown }).toDate === "function") {
    return (ts as { toDate(): Date }).toDate().toISOString();
  }
  return String(ts);
}

function docToEntry(id: string, data: Record<string, unknown>): ReviewEntry {
  return {
    reviewId: id,
    tenantId: String(data.tenantId ?? ""),
    clientId: String(data.clientId ?? data.customerId ?? ""),
    clientName: String(data.clientName ?? ""),
    rating: typeof data.rating === "number" ? data.rating : 0,
    comment: typeof data.comment === "string" ? data.comment : "",
    status: (data.status as ReviewEntry["status"]) ?? "pending",
    createdAt: toIso(data.createdAt),
    replyText: typeof data.replyText === "string" ? data.replyText : null,
    repliedAt: data.repliedAt ? toIso(data.repliedAt) : null,
    repliedBy: typeof data.repliedBy === "string" ? data.repliedBy : null,
    flagReason: typeof data.flagReason === "string" ? data.flagReason : null,
    flaggedBy: typeof data.flaggedBy === "string" ? data.flaggedBy : null,
    flaggedAt: data.flaggedAt ? toIso(data.flaggedAt) : null,
    disputeReason: typeof data.disputeReason === "string" ? data.disputeReason : null,
    automationRuleId: typeof data.automationRuleId === "string" ? data.automationRuleId : null,
    staffId: typeof data.staffId === "string" ? data.staffId : null,
    serviceId: typeof data.serviceId === "string" ? data.serviceId : null,
    bookingId: typeof data.bookingId === "string" ? data.bookingId : null,
  };
}

function docToRule(id: string, data: Record<string, unknown>): ReviewAutomationRule {
  return {
    ruleId: id,
    tenantId: String(data.tenantId ?? ""),
    label: String(data.label ?? ""),
    triggerRating: typeof data.triggerRating === "number" ? data.triggerRating : 1,
    triggerRatingOp: (data.triggerRatingOp as ReviewAutomationRule["triggerRatingOp"]) ?? "eq",
    replyTemplate: String(data.replyTemplate ?? ""),
    active: Boolean(data.active),
    createdAt: toIso(data.createdAt),
  };
}

// ---------------------------------------------------------------------------
// ReviewQueueRepository — Firestore adapter
// ---------------------------------------------------------------------------

export function createFirestoreReviewQueueRepository(db: Firestore): ReviewQueueRepository {
  return {
    async list(tenantId, filter) {
      const col = reviewsCol(db, tenantId);
      const constraints =
        filter === "all"
          ? [orderBy("createdAt", "desc")]
          : [where("status", "==", filter), orderBy("createdAt", "desc")];
      const snap = await getDocs(query(col, ...constraints));
      return snap.docs.map((d) => docToEntry(d.id, d.data() as Record<string, unknown>));
    },

    async getById(reviewId, tenantId) {
      const snap = await getDoc(reviewRef(db, tenantId, reviewId));
      if (!snap.exists()) return null;
      return docToEntry(snap.id, snap.data() as Record<string, unknown>);
    },

    async getReputationStats(tenantId) {
      const col = reviewsCol(db, tenantId);
      const snap = await getDocs(query(col, orderBy("createdAt", "desc")));
      const docs = snap.docs.map((d) => d.data() as Record<string, unknown>);

      const breakdown: ReviewRatingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let ratingSum = 0;
      let repliedCount = 0;
      let pendingCount = 0;
      let flaggedCount = 0;

      for (const d of docs) {
        const r = typeof d.rating === "number" ? Math.max(1, Math.min(5, Math.round(d.rating))) as 1|2|3|4|5 : null;
        if (r) { breakdown[r] += 1; ratingSum += r; }
        if (d.status === "replied") repliedCount += 1;
        if (d.status === "pending") pendingCount += 1;
        if (d.status === "flagged") flaggedCount += 1;
      }

      const total = docs.length;
      const trendSnap = await getDocs(
        query(col, where("createdAt", ">=", new Date(Date.now() - 30 * 24 * 3600 * 1000)), orderBy("createdAt", "desc"))
      );
      const trendRatings = trendSnap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return typeof data.rating === "number" ? data.rating : 0;
      });
      const trendAvg = trendRatings.length
        ? trendRatings.reduce((a, b) => a + b, 0) / trendRatings.length
        : 0;

      const stats: ReputationStats = {
        averageRating: total > 0 ? Math.round((ratingSum / total) * 10) / 10 : 0,
        totalReviews: total,
        breakdown,
        replyRate: total > 0 ? repliedCount / total : 0,
        pendingCount,
        flaggedCount,
        trendLast30Days: Math.round(trendAvg * 10) / 10,
      };
      return stats;
    },
  };
}

// ---------------------------------------------------------------------------
// ReviewWriteRepository — Firestore adapter
// ---------------------------------------------------------------------------

export function createFirestoreReviewWriteRepository(db: Firestore): ReviewWriteRepository {
  return {
    async saveReply(input: ReviewReplyInput) {
      const ref = reviewRef(db, input.tenantId, input.reviewId);
      await updateDoc(ref, {
        replyText: input.replyText,
        repliedBy: input.authorId,
        repliedAt: serverTimestamp(),
        status: "replied",
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(ref);
      return docToEntry(snap.id, snap.data() as Record<string, unknown>);
    },

    async flagReview(input: ReviewFlagInput) {
      const ref = reviewRef(db, input.tenantId, input.reviewId);
      await updateDoc(ref, {
        status: "flagged",
        flagReason: input.reason,
        flaggedBy: input.flaggedBy,
        flaggedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(ref);
      return docToEntry(snap.id, snap.data() as Record<string, unknown>);
    },

    async disputeReview(input: ReviewDisputeInput) {
      const ref = reviewRef(db, input.tenantId, input.reviewId);
      await updateDoc(ref, {
        status: "disputed",
        disputeReason: input.reasoning,
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(ref);
      return docToEntry(snap.id, snap.data() as Record<string, unknown>);
    },

    async hideReview(input: ReviewHideInput) {
      const ref = reviewRef(db, input.tenantId, input.reviewId);
      await updateDoc(ref, {
        status: "hidden",
        flagReason: input.reason,
        flaggedBy: input.hiddenBy,
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(ref);
      return docToEntry(snap.id, snap.data() as Record<string, unknown>);
    },

    async bulkAction(tenantId, action) {
      const batch = writeBatch(db);
      const newStatus = action.type === "hide" ? "hidden" : "flagged";
      for (const reviewId of action.reviewIds) {
        batch.update(reviewRef(db, tenantId, reviewId), {
          status: newStatus,
          flagReason: action.reason,
          flaggedBy: action.actorId,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    },

    async saveAutomationRule(input: ReviewAutomationRuleInput) {
      const newRef = doc(rulesCol(db, input.tenantId));
      const data = {
        ...input,
        ruleId: newRef.id,
        createdAt: serverTimestamp(),
      };
      await setDoc(newRef, data);
      return {
        ...input,
        ruleId: newRef.id,
        createdAt: new Date().toISOString(),
      };
    },

    async listAutomationRules(tenantId) {
      const snap = await getDocs(query(rulesCol(db, tenantId), orderBy("createdAt", "desc")));
      return snap.docs.map((d) => docToRule(d.id, d.data() as Record<string, unknown>));
    },

    async toggleAutomationRule(ruleId, tenantId, active) {
      await updateDoc(ruleRef(db, tenantId, ruleId), { active });
    },

    async deleteAutomationRule(ruleId, tenantId) {
      await deleteDoc(ruleRef(db, tenantId, ruleId));
    },
  };
}
