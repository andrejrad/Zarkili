/**
 * marketplace/guardrailsService.ts (W17.2 — Anti-Client-Theft Enforcement)
 *
 * Enforces the three core marketplace guardrails:
 *
 *   1. **No competitor recommendations** in active booking flows. Once a
 *      customer is in salon X's funnel, no salon ≠ X is shown or suggested.
 *      `assertNoCompetitorRecommendations` throws if any recommendation in
 *      the list points at a different tenant.
 *
 *   2. **Marketplace attribution** ties acquired clients to the originating
 *      salon, not the platform. `attributeAcquisition` builds the attribution
 *      record that travels with the booking; the salon owns the client.
 *
 *   3. **No-commission messaging integrity**. Platform copy must never
 *      reference per-booking fees, "marketplace fees", commissions, or any
 *      synonym. `assertNoCommissionMessaging` flags forbidden tokens so
 *      product/marketing copy can be linted at write-time.
 *
 * Pure functions only — no Firestore, no I/O. Callers wire the results into
 * their booking pipeline / CMS validators.
 */

import {
  MarketplaceError,
  type BookingFlowContext,
  type MarketplaceAttribution,
  type RecommendedSalon,
} from "./model";

// ---------------------------------------------------------------------------
// Forbidden commission-related vocabulary (case-insensitive substring match)
// ---------------------------------------------------------------------------

/**
 * Tokens that, if present in user-facing copy, indicate commission-style
 * monetization the marketplace explicitly does not implement.
 *
 * Kept as a const tuple so additions are obvious in PR review.
 */
export const FORBIDDEN_COMMISSION_TOKENS = [
  "commission",
  "per-booking fee",
  "per booking fee",
  "marketplace fee",
  "booking fee",
  "platform fee",
  "new client fee",
  "percentage of revenue",
] as const;

// ---------------------------------------------------------------------------
// Guard 1 — no competitor recommendations in an active booking flow
// ---------------------------------------------------------------------------

/**
 * Throws `COMPETITOR_RECOMMENDATION_BLOCKED` if any recommendation in the
 * list points at a tenant other than the one the customer is currently
 * booking with. Returns silently when the list is empty or every entry
 * matches `context.tenantId`.
 *
 * Use at the boundary of any "you might also like" / "people also booked"
 * surface that runs *inside* a salon's booking funnel.
 */
export function assertNoCompetitorRecommendations(
  context: BookingFlowContext,
  recommendations: readonly RecommendedSalon[],
): void {
  if (!context.tenantId || !context.tenantId.trim()) {
    throw new MarketplaceError(
      "INVALID_ATTRIBUTION",
      "BookingFlowContext.tenantId is required",
    );
  }

  const violators = recommendations.filter((r) => r.tenantId !== context.tenantId);
  if (violators.length > 0) {
    const ids = violators.map((v) => v.tenantId).join(", ");
    throw new MarketplaceError(
      "COMPETITOR_RECOMMENDATION_BLOCKED",
      `Cross-promotion blocked: ${violators.length} non-context salon(s) [${ids}] cannot be recommended inside ${context.tenantId}'s booking flow`,
    );
  }
}

/**
 * Non-throwing companion: filters out any recommendation whose `tenantId`
 * doesn't match the booking-flow context. Use this in surfaces that
 * tolerate an empty result rather than a hard error (e.g., a "more from
 * this salon" carousel that should silently degrade if no same-tenant
 * recs exist).
 */
export function filterToContextTenant(
  context: BookingFlowContext,
  recommendations: readonly RecommendedSalon[],
): RecommendedSalon[] {
  if (!context.tenantId) return [];
  return recommendations.filter((r) => r.tenantId === context.tenantId);
}

// ---------------------------------------------------------------------------
// Guard 2 — marketplace attribution records (salon owns the client)
// ---------------------------------------------------------------------------

/**
 * Builds an attribution record for a booking acquired through the
 * marketplace. The record travels with the booking but never reassigns
 * client ownership — the booking salon is and remains the client's salon.
 *
 * Throws `INVALID_ATTRIBUTION` if required fields are missing.
 */
export function attributeAcquisition(input: {
  tenantId: string;
  customerUserId: string;
  sourcePostId?: string;
  sourceTenantId?: string;
  capturedAt?: number;
}): MarketplaceAttribution {
  if (!input.tenantId || !input.tenantId.trim()) {
    throw new MarketplaceError("INVALID_ATTRIBUTION", "tenantId is required");
  }
  if (!input.customerUserId || !input.customerUserId.trim()) {
    throw new MarketplaceError("INVALID_ATTRIBUTION", "customerUserId is required");
  }

  // sourceTenantId defaults to the booking salon — the common case where
  // the customer clicked through that same salon's profile or post.
  const sourceTenantId = input.sourceTenantId?.trim() || input.tenantId;

  return {
    tenantId: input.tenantId,
    customerUserId: input.customerUserId,
    sourcePostId: input.sourcePostId,
    sourceTenantId,
    capturedAt: input.capturedAt ?? Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Guard 3 — no-commission messaging integrity
// ---------------------------------------------------------------------------

/**
 * Returns the list of forbidden tokens found in `text`, case-insensitive.
 * Empty array means the copy is clean.
 *
 * Use this for non-throwing checks (e.g., CMS preview warnings).
 */
export function findCommissionTokens(text: string): string[] {
  if (!text) return [];
  const haystack = text.toLowerCase();
  return FORBIDDEN_COMMISSION_TOKENS.filter((tok) => haystack.includes(tok));
}

/**
 * Throws `COMMISSION_MESSAGING_FORBIDDEN` if `text` contains any forbidden
 * commission-style token. Use at the boundary of any platform-published
 * marketing/product copy (post text, email templates, push notifications,
 * etc).
 */
export function assertNoCommissionMessaging(text: string): void {
  const hits = findCommissionTokens(text);
  if (hits.length > 0) {
    throw new MarketplaceError(
      "COMMISSION_MESSAGING_FORBIDDEN",
      `Commission-style language is forbidden in marketplace copy. Found: ${hits.join(", ")}`,
    );
  }
}
