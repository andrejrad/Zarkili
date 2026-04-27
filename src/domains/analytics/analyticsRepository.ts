/**
 * Analytics query repository
 *
 * Provides tenant-scoped, analytics-oriented Firestore queries over the
 * existing bookings, campaigns, and activities collections.
 *
 * Collections queried:
 *   bookings                                          (global, tenantId field)
 *   tenants/{tenantId}/campaigns
 *   tenants/{tenantId}/activities
 *   tenants/{tenantId}/activityParticipations
 */

import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";

import type { Booking } from "../bookings/model";
import type { Campaign } from "../campaigns/model";
import type { Activity, ParticipationRecord } from "../activities/model";
import type { AnalyticsDateRange } from "./model";

// ---------------------------------------------------------------------------
// Repository type
// ---------------------------------------------------------------------------

export type AnalyticsRepository = {
  /**
   * Returns completed bookings in the given date range, scoped to the tenant.
   * Optional locationId narrows to a single location.
   */
  fetchCompletedBookings(
    tenantId: string,
    dateRange: AnalyticsDateRange,
    locationId?: string,
  ): Promise<Booking[]>;

  /**
   * Returns bookings for the tenant across all statuses.
   * Optional `since` ("YYYY-MM-DD") caps the Firestore query to bookings on or
   * after that date, preventing unbounded full-history reads on large tenants.
   */
  fetchAllBookingsByTenant(tenantId: string, since?: string): Promise<Booking[]>;

  /** Returns all campaigns for the tenant including embedded metrics. */
  fetchCampaigns(tenantId: string): Promise<Campaign[]>;

  /** Returns all activities defined for the tenant. */
  fetchActivities(tenantId: string): Promise<Activity[]>;

  /** Returns participation records for a specific activity. */
  fetchParticipations(
    tenantId: string,
    activityId: string,
  ): Promise<ParticipationRecord[]>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createAnalyticsRepository(db: Firestore): AnalyticsRepository {
  const BOOKINGS_COL = "bookings";

  function campaignCol(tenantId: string) {
    return collection(db, `tenants/${tenantId}/campaigns`);
  }

  function activityCol(tenantId: string) {
    return collection(db, `tenants/${tenantId}/activities`);
  }

  function participationCol(tenantId: string) {
    return collection(db, `tenants/${tenantId}/activityParticipations`);
  }

  async function fetchCompletedBookings(
    tenantId: string,
    dateRange: AnalyticsDateRange,
    locationId?: string,
  ): Promise<Booking[]> {
    if (!tenantId) throw new Error("tenantId is required");

    const col = collection(db, BOOKINGS_COL);
    const constraints = [
      where("tenantId", "==", tenantId),
      where("status", "==", "completed"),
      where("date", ">=", dateRange.start),
      where("date", "<=", dateRange.end),
    ];
    if (locationId) {
      constraints.push(where("locationId", "==", locationId));
    }
    const snap = await getDocs(query(col, ...constraints));
    return snap.docs.map((d) => d.data() as Booking);
  }

  async function fetchAllBookingsByTenant(tenantId: string, since?: string): Promise<Booking[]> {
    if (!tenantId) throw new Error("tenantId is required");
    const col = collection(db, BOOKINGS_COL);
    const constraints = [where("tenantId", "==", tenantId)];
    if (since) {
      constraints.push(where("date", ">=", since));
    }
    const snap = await getDocs(query(col, ...constraints));
    return snap.docs.map((d) => d.data() as Booking);
  }

  async function fetchCampaigns(tenantId: string): Promise<Campaign[]> {
    if (!tenantId) throw new Error("tenantId is required");
    const snap = await getDocs(query(campaignCol(tenantId)));
    return snap.docs.map((d) => d.data() as Campaign);
  }

  async function fetchActivities(tenantId: string): Promise<Activity[]> {
    if (!tenantId) throw new Error("tenantId is required");
    const snap = await getDocs(query(activityCol(tenantId)));
    return snap.docs.map((d) => d.data() as Activity);
  }

  async function fetchParticipations(
    tenantId: string,
    activityId: string,
  ): Promise<ParticipationRecord[]> {
    if (!tenantId) throw new Error("tenantId is required");
    const snap = await getDocs(
      query(participationCol(tenantId), where("activityId", "==", activityId)),
    );
    return snap.docs.map((d) => d.data() as ParticipationRecord);
  }

  return {
    fetchCompletedBookings,
    fetchAllBookingsByTenant,
    fetchCampaigns,
    fetchActivities,
    fetchParticipations,
  };
}
