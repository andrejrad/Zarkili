/**
 * Segments repository
 *
 * Collection layout:
 *   tenants/{tenantId}/marketingConsent/{userId}
 *
 * Segment computation is performed in-memory from booking summaries.
 * Results are returned as SegmentResult objects — NOT persisted (computed on demand).
 * For scheduled batch jobs, callers should persist results themselves.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  where,
  type Firestore,
} from "firebase/firestore";

import {
  SegmentError,
  BASELINE_SEGMENT_CRITERIA,
  computeAtRiskSegment,
  computeInactiveSegment,
  computeNewCustomersSegment,
  computeHighValueSegment,
  type BaselineSegmentId,
  type BookingSummary,
  type MarketingConsent,
  type SegmentResult,
} from "./model";

// ---------------------------------------------------------------------------
// Repository type
// ---------------------------------------------------------------------------

export type SegmentRepository = {
  /**
   * Compute a baseline segment from pre-fetched booking summaries.
   * Only customers present in the consent collection are included.
   */
  computeSegment(
    tenantId: string,
    segmentId: BaselineSegmentId,
    bookings: BookingSummary[],
    nowIso?: string,
  ): Promise<SegmentResult>;

  /** Return IDs of customers who have opted in to marketing for this tenant. */
  getConsentedCustomerIds(tenantId: string): Promise<string[]>;

  /** Record or update a customer's marketing consent. */
  setConsent(consent: Omit<MarketingConsent, "updatedAt">): Promise<void>;

  /** Get a single customer's consent record, or null if none exists. */
  getConsent(tenantId: string, userId: string): Promise<MarketingConsent | null>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSegmentRepository(db: Firestore): SegmentRepository {
  function consentCol(tenantId: string) {
    return collection(db, `tenants/${tenantId}/marketingConsent`);
  }

  function consentRef(tenantId: string, userId: string) {
    return doc(db, `tenants/${tenantId}/marketingConsent`, userId);
  }

  async function getConsentedCustomerIds(tenantId: string): Promise<string[]> {
    if (!tenantId) throw new SegmentError("TENANT_REQUIRED", "tenantId is required");

    const q = query(consentCol(tenantId), where("optedIn", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.id);
  }

  async function setConsent(
    consent: Omit<MarketingConsent, "updatedAt">,
  ): Promise<void> {
    if (!consent.tenantId) throw new SegmentError("TENANT_REQUIRED", "tenantId is required");

    await setDoc(
      consentRef(consent.tenantId, consent.userId),
      { ...consent, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  async function getConsent(
    tenantId: string,
    userId: string,
  ): Promise<MarketingConsent | null> {
    const snap = await getDoc(consentRef(tenantId, userId));
    if (!snap.exists()) return null;
    return snap.data() as MarketingConsent;
  }

  async function computeSegment(
    tenantId: string,
    segmentId: BaselineSegmentId,
    bookings: BookingSummary[],
    nowIso: string = new Date().toISOString().slice(0, 10),
  ): Promise<SegmentResult> {
    if (!tenantId) throw new SegmentError("TENANT_REQUIRED", "tenantId is required");

    const criteria = BASELINE_SEGMENT_CRITERIA[segmentId];
    if (!criteria) {
      throw new SegmentError("INVALID_SEGMENT", `Unknown segment: ${segmentId}`);
    }

    const consentedIds = await getConsentedCustomerIds(tenantId);
    const consentedSet = new Set(consentedIds);

    let customerIds: string[];

    switch (segmentId) {
      case "at_risk_30d":
        customerIds = computeAtRiskSegment(bookings, consentedSet, nowIso, criteria.lookbackDays);
        break;
      case "inactive_60d":
        customerIds = computeInactiveSegment(bookings, consentedSet, nowIso, criteria.lookbackDays);
        break;
      case "new_customers_30d":
        customerIds = computeNewCustomersSegment(bookings, consentedSet, nowIso, criteria.lookbackDays);
        break;
      case "high_value":
        customerIds = computeHighValueSegment(
          bookings,
          consentedSet,
          criteria.minLifetimeSpend ?? 500,
        );
        break;
      default: {
        const _exhaustive: never = segmentId;
        throw new SegmentError("INVALID_SEGMENT", `Unhandled segment: ${_exhaustive}`);
      }
    }

    return {
      tenantId,
      segmentId,
      customerIds,
      count: customerIds.length,
      computedAt: new Date().toISOString(),
    };
  }

  return { computeSegment, getConsentedCustomerIds, setConsent, getConsent };
}
