/**
 * Marketplace acquisitions repository (W17-DEBT-2).
 *
 * Persists a `MarketplaceAttribution` alongside a booking, at:
 *   tenants/{tenantId}/marketplaceAcquisitions/{bookingId}
 *
 * The doc id is the bookingId so the salon can join acquisitions back to
 * bookings without an extra index, and double-writes are idempotent
 * (same booking → same doc id → same payload).
 *
 * Pure persistence — no business rules. The caller (booking pipeline) is
 * responsible for building the attribution via `attributeAcquisition` and
 * calling `saveAcquisition` after the booking write commits.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  type Firestore,
} from "firebase/firestore";

import { attributeAcquisition } from "./guardrailsService";
import { MarketplaceError, type MarketplaceAttribution } from "./model";

// ---------------------------------------------------------------------------
// Repository type
// ---------------------------------------------------------------------------

export type MarketplaceAcquisitionsRepository = {
  /**
   * Writes (or overwrites — idempotent) the acquisition record for a booking.
   * Throws `INVALID_ATTRIBUTION` if `tenantId` or `bookingId` is empty.
   */
  saveAcquisition(
    bookingId: string,
    attribution: MarketplaceAttribution,
  ): Promise<void>;

  getAcquisition(
    tenantId: string,
    bookingId: string,
  ): Promise<MarketplaceAttribution | null>;

  listAcquisitions(tenantId: string): Promise<MarketplaceAttribution[]>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

const COLLECTION_NAME = "marketplaceAcquisitions";

function acquisitionPath(tenantId: string): string {
  return `tenants/${tenantId}/${COLLECTION_NAME}`;
}

export function createMarketplaceAcquisitionsRepository(
  db: Firestore,
): MarketplaceAcquisitionsRepository {
  async function saveAcquisition(
    bookingId: string,
    attribution: MarketplaceAttribution,
  ): Promise<void> {
    if (!attribution.tenantId || !attribution.tenantId.trim()) {
      throw new MarketplaceError("INVALID_ATTRIBUTION", "tenantId is required");
    }
    if (!bookingId || !bookingId.trim()) {
      throw new MarketplaceError(
        "INVALID_ATTRIBUTION",
        "bookingId is required to persist a marketplace acquisition",
      );
    }
    const ref = doc(db, acquisitionPath(attribution.tenantId), bookingId);
    await setDoc(ref, { bookingId, ...attribution });
  }

  async function getAcquisition(
    tenantId: string,
    bookingId: string,
  ): Promise<MarketplaceAttribution | null> {
    const ref = doc(db, acquisitionPath(tenantId), bookingId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as MarketplaceAttribution;
    return data;
  }

  async function listAcquisitions(tenantId: string): Promise<MarketplaceAttribution[]> {
    const colRef = collection(db, acquisitionPath(tenantId));
    const snap = await getDocs(query(colRef));
    return snap.docs.map((d) => d.data() as MarketplaceAttribution);
  }

  return { saveAcquisition, getAcquisition, listAcquisitions };
}

// ---------------------------------------------------------------------------
// Booking pipeline helper
// ---------------------------------------------------------------------------

/**
 * Convenience wrapper used by the booking creation pipeline.
 *
 * Builds the attribution via `attributeAcquisition` and persists it.
 * Returns the attribution that was persisted so the caller can log it
 * alongside the booking write.
 *
 * Errors thrown by `attributeAcquisition` (INVALID_ATTRIBUTION) propagate.
 */
export async function persistMarketplaceAcquisition(
  repository: MarketplaceAcquisitionsRepository,
  input: {
    tenantId: string;
    customerUserId: string;
    bookingId: string;
    sourcePostId?: string;
    sourceTenantId?: string;
    capturedAt?: number;
  },
): Promise<MarketplaceAttribution> {
  const attribution = attributeAcquisition({
    tenantId: input.tenantId,
    customerUserId: input.customerUserId,
    sourcePostId: input.sourcePostId,
    sourceTenantId: input.sourceTenantId,
    capturedAt: input.capturedAt,
  });
  await repository.saveAcquisition(input.bookingId, attribution);
  return attribution;
}
