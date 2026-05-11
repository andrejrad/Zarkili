/**
 * staffHelpers.ts — W27 Batch G domain types and utilities for the Staff App.
 *
 * Zero React imports. All types, constants, and pure utility functions live here
 * so they are safe to import from screens, components, and test files alike.
 *
 * Primitive types and utilities shared with shared/ui components are defined
 * in src/shared/staffTypes.ts and re-exported here for convenience.
 *
 * Sections:
 *  1. Re-exports from shared/staffTypes (primitives safe for shared/ui)
 *  2. Queue / appointment types
 *  3. Client types
 *  4. Additional constants and utilities
 */

// ─── 1. Re-exports from shared/staffTypes ────────────────────────────────────

export {
  type StaffQueueStatus,
  type AISuggestionType,
  type AISuggestion,
  type AIBudgetState,
  AVATAR_PALETTE,
  STAFF_QUEUE_STATUS_LABELS,
  djb2AvatarColor,
  formatWaitTime,
} from "../../shared/staffTypes";

// ─── 2. Queue / appointment types ────────────────────────────────────────────

import type { StaffQueueStatus, AIBudgetState } from "../../shared/staffTypes";

export type StaffAppointment = {
  id: string;
  clientName: string;
  clientId: string;
  service: string;
  /** ISO-8601 datetime string, e.g. "2026-05-12T14:00:00". */
  startTime: string;
  durationMinutes: number;
  /** 1-based queue position; undefined for calendar appointments not in queue. */
  position?: number;
  status: StaffQueueStatus;
  /**
   * Initials derived from clientName (e.g. "JD" for "Jane Doe").
   * Pre-computed so components never do string ops during render.
   */
  initials: string;
  stylist?: string;
};

// ─── 3. Client types ──────────────────────────────────────────────────────────

export type ClientRow = {
  id: string;
  name: string;
  initials: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "locked";
  isVIP: boolean;
  /** ISO-8601 date string, e.g. "2025-11-03". */
  lastVisit: string | null;
  /** Lifetime spend in USD cents (avoids float arithmetic in display). */
  lifetimeValueCents: number;
  noShows: number;
};

export type ClientDetail = ClientRow & {
  phone: string | null;
  email: string | null;
  /** ISO-8601 date client first visited. */
  since: string;
  totalVisits: number;
  upcomingAppointment: Pick<StaffAppointment, "id" | "startTime" | "service"> | null;
  preferredServices: string[];
  preferredStylists: string[];
  /** Free-text allergy / sensitivity notes. */
  allergies: string | null;
  loyaltyPoints: number;
};

export type ClientNoteEntry = {
  id: string;
  /** ISO-8601 datetime. */
  createdAt: string;
  authorName: string;
  /** "note" = manual staff note; "visit" = auto-generated visit summary. */
  kind: "note" | "visit";
  body: string;
  service?: string;
};

// ─── 3. AI surface types ──────────────────────────────────────────────────────

// AISuggestionType, AISuggestion, AIBudgetState — re-exported from shared/staffTypes above

export type AIChatMessage = {
  id: string;
  role: "user" | "assistant";
  body: string;
  /** ISO-8601 datetime. */
  sentAt: string;
};

// ─── 4. Constants ─────────────────────────────────────────────────────────────

// AVATAR_PALETTE, STAFF_QUEUE_STATUS_LABELS — re-exported from shared/staffTypes above

export const AI_BUDGET_THRESHOLDS = {
  /** Remaining tokens below this value triggers "warning" state. */
  warningBelowTokens: 5_000,
  /** Remaining tokens at or below this value triggers "exhausted" state. */
  exhaustedAtTokens: 0,
} as const;

// ─── 5. Utilities ─────────────────────────────────────────────────────────────

// djb2AvatarColor, formatWaitTime — re-exported from shared/staffTypes above

/**
 * Derive up to 2 initials from a full name string.
 * e.g. "Jane Doe" → "JD", "Valentina" → "V"
 */
export function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * formatLtv — format lifetime value cents to a display string.
 * e.g. 123456 → "$1,234" (drops cents for display brevity)
 */
export function formatLtv(usd: number): string {
  const dollars = Math.floor(usd);
  return `$${dollars.toLocaleString("en-US")}`;
}

/**
 * Resolve the AIBudgetState from a remaining token count.
 */
export function resolveAIBudgetState(remainingTokens: number): AIBudgetState {
  if (remainingTokens <= AI_BUDGET_THRESHOLDS.exhaustedAtTokens) return "exhausted";
  if (remainingTokens < AI_BUDGET_THRESHOLDS.warningBelowTokens) return "warning";
  return "ok";
}
