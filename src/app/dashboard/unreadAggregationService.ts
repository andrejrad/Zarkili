/**
 * unreadAggregationService.ts
 *
 * Aggregates per-salon unread message counts and tenant metadata for the
 * Multi-Salon Dashboard.
 *
 *   loadSalonSummaries   — one-shot fetch, suitable for initial load
 *   subscribeToSalonSummaries — real-time subscription; fires on every unread
 *                               count change across any of the user's tenants
 *
 * Only tenants with subscriptionStatus "active" or "trialing" are included.
 * Tenant metadata (name, logoUrl) is fetched in parallel after the access list
 * is resolved; missing tenants fall back gracefully.
 */

import type { UserTenantAccess } from "../../domains/tenants/userTenantAccessModel";
import type { UserTenantAccessRepository } from "../../domains/tenants/userTenantAccessRepository";
import type { TenantRepository } from "../../domains/tenants/repository";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SalonSummary = {
  tenantId: string;
  tenantName: string;
  logoUrl: string | null;
  unreadMessageCount: number;
  subscriptionStatus: UserTenantAccess["subscriptionStatus"];
  accessLevel: UserTenantAccess["accessLevel"];
  /** Firestore Timestamp of the next upcoming confirmed appointment, or null */
  nextAppointmentAt: UserTenantAccess["nextAppointmentAt"];
  /** Display name of the service for the next appointment, or null */
  nextAppointmentServiceName: UserTenantAccess["nextAppointmentServiceName"];
};

export type SalonSummariesResult =
  | { ok: true; summaries: SalonSummary[]; totalUnread: number }
  | { ok: false; message: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTIVE_STATUSES: UserTenantAccess["subscriptionStatus"][] = ["active", "trialing"];

function isActive(access: UserTenantAccess): boolean {
  return ACTIVE_STATUSES.includes(access.subscriptionStatus);
}

function normalizeError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createUnreadAggregationService(
  userTenantAccessRepository: UserTenantAccessRepository,
  tenantRepository: TenantRepository,
) {
  /**
   * Builds a SalonSummary array from a list of access records by enriching
   * each with tenant name and logo fetched in parallel.
   */
  async function buildSummaries(accesses: UserTenantAccess[]): Promise<SalonSummary[]> {
    const active = accesses.filter(isActive);
    return Promise.all(
      active.map(async (access) => {
        const tenant = await tenantRepository.getTenantById(access.tenantId);
        return {
          tenantId: access.tenantId,
          tenantName: tenant?.name ?? access.tenantId,
          logoUrl: tenant?.branding?.logoUrl ?? null,
          unreadMessageCount: access.unreadMessageCount,
          subscriptionStatus: access.subscriptionStatus,
          accessLevel: access.accessLevel,
          nextAppointmentAt: access.nextAppointmentAt ?? null,
          nextAppointmentServiceName: access.nextAppointmentServiceName ?? null,
        };
      }),
    );
  }

  /**
   * One-shot load: fetches all user tenant accesses and resolves tenant
   * metadata in parallel.  Returns summaries sorted by tenantName ascending.
   */
  async function loadSalonSummaries(userId: string): Promise<SalonSummariesResult> {
    try {
      const accesses = await userTenantAccessRepository.getUserTenants(userId);
      const summaries = await buildSummaries(accesses);
      summaries.sort((a, b) => a.tenantName.localeCompare(b.tenantName));
      const totalUnread = summaries.reduce((sum, s) => sum + s.unreadMessageCount, 0);
      return { ok: true, summaries, totalUnread };
    } catch (err) {
      return { ok: false, message: normalizeError(err) };
    }
  }

  /**
   * Real-time subscription: calls onUpdate immediately and again whenever any
   * of the user's access records change (e.g. after a message write increments
   * unreadMessageCount).  Returns an unsubscribe function.
   *
   * onUpdate is called with an error result if tenant metadata fetch fails.
   */
  function subscribeToSalonSummaries(
    userId: string,
    onUpdate: (result: SalonSummariesResult) => void,
  ): () => void {
    return userTenantAccessRepository.subscribeUserTenants(userId, (accesses) => {
      buildSummaries(accesses)
        .then((summaries) => {
          summaries.sort((a, b) => a.tenantName.localeCompare(b.tenantName));
          const totalUnread = summaries.reduce((sum, s) => sum + s.unreadMessageCount, 0);
          onUpdate({ ok: true, summaries, totalUnread });
        })
        .catch((err: unknown) => {
          onUpdate({ ok: false, message: normalizeError(err) });
        });
    });
  }

  return { loadSalonSummaries, subscribeToSalonSummaries };
}

export type UnreadAggregationService = ReturnType<typeof createUnreadAggregationService>;
