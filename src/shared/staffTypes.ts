/**
 * staffTypes.ts — Low-level staff domain types and utilities.
 *
 * Lives in src/shared/ so that shared/ui components can import from here
 * without creating a circular dependency with src/app/staff/staffHelpers.
 *
 * src/app/staff/staffHelpers re-exports everything from this file plus
 * heavier app-layer types (ClientDetail, ClientNoteEntry, etc.).
 */

// ─── Queue types ──────────────────────────────────────────────────────────────

export type StaffQueueStatus = "waiting" | "in-service" | "completed" | "skipped";

export const STAFF_QUEUE_STATUS_LABELS: Record<StaffQueueStatus, string> = {
  waiting: "Waiting",
  "in-service": "In service",
  completed: "Done",
  skipped: "Skipped",
};

// ─── AI types ─────────────────────────────────────────────────────────────────

export type AISuggestionType = "scheduling" | "retention" | "content";

export type AISuggestion = {
  id: string;
  type: AISuggestionType;
  typeLabel: string;
  body: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
};

export type AIBudgetState = "ok" | "warning" | "exhausted";

// ─── Avatar utilities ─────────────────────────────────────────────────────────

/**
 * Avatar background palette — 8 entries.
 * Index derived via djb2AvatarColor().
 */
export const AVATAR_PALETTE: readonly string[] = [
  "#E3A9A0",
  "#BBEDDA",
  "#D1BFB3",
  "#A8C5BD",
  "#C4A49B",
  "#9ED3C0",
  "#B8D4CE",
  "#E8C4C0",
];

/**
 * djb2AvatarColor — maps a client name to a stable index into AVATAR_PALETTE.
 * Uses the djb2 hash function for deterministic, visually distributed colours.
 */
export function djb2AvatarColor(name: string): string {
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) + hash + name.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

/**
 * formatWaitTime — human-readable wait estimate.
 */
export function formatWaitTime(minutes: number): string {
  if (minutes <= 0) return "Now";
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `~${h} hr ${m} min` : `~${h} hr`;
}
