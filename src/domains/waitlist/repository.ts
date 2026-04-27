/**
 * Waitlist repository
 *
 * Collection layout:
 *   tenants/{tenantId}/waitlist/{entryId}
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import {
  JoinWaitlistInput,
  WaitlistEntry,
  WaitlistError,
  WaitlistMatchCandidate,
  validateWaitlistDates,
} from "./model";

// ---------------------------------------------------------------------------
// Repository factory
// ---------------------------------------------------------------------------

export type WaitlistRepository = {
  /**
   * Add a new waitlist entry, returning the generated entry ID.
   * Throws WaitlistError("invalid-date-range") for nonsensical date ranges.
   * Throws WaitlistError("already-on-waitlist") if the user already has an
   * active entry for the same service + location.
   */
  joinWaitlist(input: JoinWaitlistInput): Promise<string>;

  /**
   * Set an entry's status to "cancelled" (soft delete).
   * Throws WaitlistError("not-found") if the entry does not exist.
   */
  leaveWaitlist(entryId: string, tenantId: string, userId: string): Promise<void>;

  /**
   * List all active waitlist entries for a given tenant location.
   * Ordered by createdAt ascending (first-come-first-served).
   */
  listWaitlistByLocation(
    tenantId: string,
    locationId: string,
  ): Promise<WaitlistEntry[]>;

  /**
   * Find active waitlist entries that match the given slot parameters.
   * Applies server-side filters for tenantId, locationId, serviceId, status=="active".
   * Client-side filters for staffId compatibility and date range overlap.
   */
  findMatchingWaitlistEntries(
    tenantId: string,
    locationId: string,
    serviceId: string,
    staffId: string,
    date: string, // ISO date string "YYYY-MM-DD"
    limit?: number,
  ): Promise<WaitlistMatchCandidate[]>;

  /**
   * Mark an entry as "matched" with the given slot.
   * Throws WaitlistError("not-found") if the entry does not exist.
   */
  markMatched(entryId: string, tenantId: string, matchedSlotId: string): Promise<void>;

  /**
   * Update the lastNotifiedAt timestamp after sending a notification.
   */
  updateLastNotifiedAt(entryId: string, tenantId: string, iso: string): Promise<void>;
};

function waitlistCollectionPath(tenantId: string) {
  return `tenants/${tenantId}/waitlist`;
}

export function createWaitlistRepository(db: Firestore): WaitlistRepository {
  async function joinWaitlist(input: JoinWaitlistInput): Promise<string> {
    validateWaitlistDates(input.dateFrom, input.dateTo);

    // Check for existing active entry for same user + service + location
    const colRef = collection(db, waitlistCollectionPath(input.tenantId));
    const existingQuery = query(
      colRef,
      where("userId", "==", input.userId),
      where("locationId", "==", input.locationId),
      where("serviceId", "==", input.serviceId),
      where("status", "==", "active"),
    );
    const existingSnap = await getDocs(existingQuery);
    if (!existingSnap.empty) {
      throw new WaitlistError(
        "already-on-waitlist",
        `User ${input.userId} is already on the waitlist for service ${input.serviceId} at location ${input.locationId}`,
      );
    }

    const entryRef = doc(colRef);
    const entryId = entryRef.id;

    const entry: WaitlistEntry = {
      ...input,
      entryId,
      status: "active",
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      matchedSlotId: null,
      lastNotifiedAt: null,
    };

    await setDoc(entryRef, entry);
    return entryId;
  }

  async function leaveWaitlist(
    entryId: string,
    tenantId: string,
    _userId: string,
  ): Promise<void> {
    const entryRef = doc(db, waitlistCollectionPath(tenantId), entryId);
    const snap = await getDoc(entryRef);
    if (!snap.exists()) {
      throw new WaitlistError("not-found", `Waitlist entry ${entryId} not found`);
    }
    await updateDoc(entryRef, {
      status: "cancelled",
      updatedAt: serverTimestamp(),
    });
  }

  async function listWaitlistByLocation(
    tenantId: string,
    locationId: string,
  ): Promise<WaitlistEntry[]> {
    const colRef = collection(db, waitlistCollectionPath(tenantId));
    const q = query(
      colRef,
      where("locationId", "==", locationId),
      where("status", "==", "active"),
    );
    const snap = await getDocs(q);
    const entries: WaitlistEntry[] = snap.docs.map((d) => d.data() as WaitlistEntry);
    // Client-side sort: FCFS — earliest createdAt first
    entries.sort((a, b) => {
      const aSeconds = (a.createdAt as any)?.seconds ?? 0;
      const bSeconds = (b.createdAt as any)?.seconds ?? 0;
      return aSeconds - bSeconds;
    });
    return entries;
  }

  async function findMatchingWaitlistEntries(
    tenantId: string,
    locationId: string,
    serviceId: string,
    staffId: string,
    date: string,
    limit = 50,
  ): Promise<WaitlistMatchCandidate[]> {
    const colRef = collection(db, waitlistCollectionPath(tenantId));
    // Firestore side: filter by tenantId, locationId, serviceId, active status
    const q = query(
      colRef,
      where("tenantId", "==", tenantId),
      where("locationId", "==", locationId),
      where("serviceId", "==", serviceId),
      where("status", "==", "active"),
    );
    const snap = await getDocs(q);

    const candidates: WaitlistMatchCandidate[] = [];

    for (const d of snap.docs) {
      const entry = d.data() as WaitlistEntry;

      // Client-side: staff compatibility
      const staffOk = entry.staffId === null || entry.staffId === staffId;
      // Client-side: date must fall within [dateFrom, dateTo]
      const dateOk = entry.dateFrom <= date && date <= entry.dateTo;

      if (staffOk && dateOk) {
        candidates.push({
          entryId: entry.entryId,
          userId: entry.userId,
          tenantId: entry.tenantId,
          locationId: entry.locationId,
          serviceId: entry.serviceId,
          staffId: entry.staffId,
          dateFrom: entry.dateFrom,
          dateTo: entry.dateTo,
          lastNotifiedAt: entry.lastNotifiedAt,
        });
      }

      if (candidates.length >= limit) {
        break;
      }
    }

    return candidates;
  }

  async function markMatched(
    entryId: string,
    tenantId: string,
    matchedSlotId: string,
  ): Promise<void> {
    const entryRef = doc(db, waitlistCollectionPath(tenantId), entryId);
    const snap = await getDoc(entryRef);
    if (!snap.exists()) {
      throw new WaitlistError("not-found", `Waitlist entry ${entryId} not found`);
    }
    await updateDoc(entryRef, {
      status: "matched",
      matchedSlotId,
      updatedAt: serverTimestamp(),
    });
  }

  async function updateLastNotifiedAt(
    entryId: string,
    tenantId: string,
    iso: string,
  ): Promise<void> {
    const entryRef = doc(db, waitlistCollectionPath(tenantId), entryId);
    await updateDoc(entryRef, {
      lastNotifiedAt: iso,
      updatedAt: serverTimestamp(),
    });
  }

  return {
    joinWaitlist,
    leaveWaitlist,
    listWaitlistByLocation,
    findMatchingWaitlistEntries,
    markMatched,
    updateLastNotifiedAt,
  };
}
