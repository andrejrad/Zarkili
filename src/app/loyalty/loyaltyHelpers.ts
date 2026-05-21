/**
 * loyaltyHelpers.ts — Batch E loyalty / review / referral helpers.
 *
 * Pure functions — zero React imports, zero I/O.
 * Reusable server-side or in tests without a renderer.
 */

// ---------------------------------------------------------------------------
// Tier types
// ---------------------------------------------------------------------------

export type LoyaltyTier = "Bronze" | "Silver" | "Gold" | "Platinum";

export const LOYALTY_TIERS: LoyaltyTier[] = ["Bronze", "Silver", "Gold", "Platinum"];

/** Points required to reach each tier (Bronze is 0 — everyone starts here). */
export const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  Bronze: 0,
  Silver: 500,
  Gold: 1_500,
  Platinum: 5_000,
};

export const TIER_PROGRESS_LABEL: Record<LoyaltyTier, string> = {
  Bronze: "Bronze",
  Silver: "Silver",
  Gold: "Gold",
  Platinum: "Platinum",
};

/** Derive current tier from a points balance. */
export function deriveTier(points: number): LoyaltyTier {
  const tiers = LOYALTY_TIERS.slice().reverse(); // highest first
  for (const tier of tiers) {
    if (points >= TIER_THRESHOLDS[tier]) return tier;
  }
  return "Bronze";
}

/** Next tier above current, or null at Platinum. */
export function nextTier(current: LoyaltyTier): LoyaltyTier | null {
  const idx = LOYALTY_TIERS.indexOf(current);
  return idx < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[idx + 1] : null;
}

/** Points required to reach the next tier from current balance. Returns null at Platinum. */
export function pointsToNextTier(points: number): number | null {
  const current = deriveTier(points);
  const next = nextTier(current);
  if (!next) return null;
  return Math.max(0, TIER_THRESHOLDS[next] - points);
}

/**
 * Progress fraction (0–1) within the current tier band.
 * 0 = just entered this tier; 1 = ready for next tier.
 */
export function computeTierProgress(points: number): number {
  const current = deriveTier(points);
  const next = nextTier(current);
  if (!next) return 1; // Platinum cap = 100%
  const start = TIER_THRESHOLDS[current];
  const end = TIER_THRESHOLDS[next];
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (points - start) / (end - start)));
}

// ---------------------------------------------------------------------------
// Point formatting
// ---------------------------------------------------------------------------

/** "1,240 pts" */
export function formatPoints(n: number): string {
  return `${n.toLocaleString("en-US")} pts`;
}

/** "+50 pts" / "-25 pts" */
export function formatPointsDelta(delta: number): string {
  const abs = Math.abs(delta).toLocaleString("en-US");
  return delta >= 0 ? `+${abs} pts` : `-${abs} pts`;
}

// ---------------------------------------------------------------------------
// Earn actions
// ---------------------------------------------------------------------------

export type EarnAction = {
  id: string;
  icon: string;
  label: string;
  points: number;
  route: string;
};

export const DEFAULT_EARN_ACTIONS: readonly EarnAction[] = [
  { id: "book", icon: "calendar", label: "Book a service", points: 50, route: "/book/service" },
  { id: "refer", icon: "user-plus", label: "Refer a friend", points: 200, route: "/loyalty/referral" },
  { id: "review", icon: "star", label: "Leave a review", points: 25, route: "/reviews/prompt" },
] as const;

// ---------------------------------------------------------------------------
// History entries
// ---------------------------------------------------------------------------

export type HistoryEntry = {
  id: string;
  /** ISO 8601 date string. */
  date: string;
  description: string;
  /** Positive = earned, negative = redeemed / spent. */
  delta: number;
  /** Raw Firestore event type key (e.g. "booking_completed"). Used by getEventTypeLabel. */
  eventType?: string;
  /** Optional event context data (serviceName, locationName, rewardName, note, etc.). */
  eventData?: Record<string, string>;
};

// ---------------------------------------------------------------------------
// Activity date formatting (spec §3.6.3)
// ---------------------------------------------------------------------------

/**
 * Format ISO date to a human-readable relative or short date.
 *   Today / Yesterday / N days ago / "14 May" / "14 May 2025"
 * Never MM/DD/YYYY. Never wraps across lines.
 */
export function formatActivityDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** @deprecated Use formatActivityDate instead. */
export function formatHistoryDate(iso: string): string {
  return formatActivityDate(iso);
}

// ---------------------------------------------------------------------------
// Event type label map (spec §3.6.2)
// ---------------------------------------------------------------------------

export const EVENT_TYPE_LABELS: Record<
  string,
  (data: Record<string, string>) => string
> = {
  booking_completed:  (d) => `${d.serviceName ?? "Service"} — ${d.locationName ?? "location"}`,
  reward_redemption:  (d) => `${d.rewardName ?? "Reward"} redeemed`,
  referral_bonus:     ()  => "Friend referral bonus",
  review_bonus:       ()  => "Review bonus",
  review_photo_bonus: ()  => "Photo review bonus",
  welcome_bonus:      ()  => "Welcome bonus",
  manual_adjustment:  (d) => d.note ?? "Points adjustment",
};

/** Map a raw eventType + optional eventData to a human-readable label. */
export function getEventTypeLabel(
  eventType: string,
  eventData?: Record<string, string>,
): string {
  const fn = EVENT_TYPE_LABELS[eventType];
  return fn ? fn(eventData ?? {}) : "Points update";
}

// ---------------------------------------------------------------------------
// Reward types
// ---------------------------------------------------------------------------

export type RewardFilterTab = "All" | "Free" | "Discount" | "Experience" | "Partner";

export const REWARD_FILTER_TABS: readonly RewardFilterTab[] = [
  "All",
  "Free",
  "Discount",
  "Experience",
  "Partner",
] as const;

export type RewardSortOption = "lowest-points" | "highest-points" | "newest";

export type Reward = {
  id: string;
  title: string;
  points: number;
  type: RewardFilterTab;
  imageAlt?: string;
  /** ISO 8601 expiry date. */
  expiresAt?: string;
  redeemed?: boolean;
  locked?: boolean;
};

/**
 * Inline reward item shown in the Redeem section on the Rewards tab.
 * Client-computed from the full RewardObject returned by the catalogue API.
 */
export type InlineReward = {
  id: string;
  name: string;
  pointsRequired: number;
  /** URL or null for placeholder. */
  photoUrl: string | null;
  /** ISO 8601 expiry, or null for no expiry. */
  expiresAt: string | null;
  /** true when userPoints >= pointsRequired */
  isRedeemable: boolean;
  /** max(0, pointsRequired - userPoints) */
  pointsNeeded: number;
};

export function filterRewards(
  rewards: readonly Reward[],
  tab: RewardFilterTab,
  userPoints: number,
): Reward[] {
  return rewards
    .filter((r) => tab === "All" || r.type === tab)
    .map((r) => r); // pass-through; sorting is caller responsibility
}

export function sortRewards(
  rewards: readonly Reward[],
  sort: RewardSortOption,
): Reward[] {
  return [...rewards].sort((a, b) =>
    sort === "highest-points"
      ? b.points - a.points
      : sort === "newest"
      ? 0 // without createdAt sorting is stable
      : a.points - b.points,
  );
}

// ---------------------------------------------------------------------------
// Activity types
// ---------------------------------------------------------------------------

export type ActivityStatus = "not_started" | "in_progress" | "ready_to_claim" | "completed" | "expired";
export type ActivityTab = "active" | "completed" | "all";

export const ACTIVITY_TABS: readonly ActivityTab[] = ["active", "completed", "all"] as const;

export const ACTIVITY_TAB_LABELS: Record<ActivityTab, string> = {
  active: "Active",
  completed: "Completed",
  all: "All",
};

export type ActivityStep = {
  id: string;
  label: string;
  completed: boolean;
};

export type Activity = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  steps: readonly ActivityStep[];
  /** Renamed from rewardPoints for consistency with UI. */
  pointsReward: number;
  bonusPoints?: number;
  currentSteps: number;
  totalSteps: number;
  isNew?: boolean;
  status: ActivityStatus;
  /** ISO 8601. */
  expiresAt?: string;
  /** Pre-formatted US date label e.g. 01/31/2025. */
  expiryLabel?: string;
};

export function filterActivitiesByTab(
  activities: readonly Activity[],
  tab: ActivityTab,
): Activity[] {
  if (tab === "all") return [...activities];
  if (tab === "active") return activities.filter((a) => a.status === "not_started" || a.status === "in_progress" || a.status === "ready_to_claim");
  return activities.filter((a) => a.status === "completed");
}

export function computeActivityProgressLabel(activity: Activity): string {
  const total = activity.steps.length;
  const done = activity.steps.filter((s) => s.completed).length;
  return `${done} of ${total} steps`;
}

export function deriveActivityCtaLabel(status: ActivityStatus): string {
  switch (status) {
    case "not_started": return "Start";
    case "in_progress": return "Continue";
    case "ready_to_claim": return "Claim reward";
    case "completed": return "Completed";
    case "expired": return "Expired";
  }
}

// ---------------------------------------------------------------------------
// Review types
// ---------------------------------------------------------------------------

export type ReviewAspect = "Service" | "Cleanliness" | "Value" | "Atmosphere";

export const REVIEW_ASPECTS: readonly ReviewAspect[] = [
  "Service",
  "Cleanliness",
  "Value",
  "Atmosphere",
] as const;

export type AspectRating = {
  aspect: ReviewAspect;
  rating: number;
};

export type ReviewDraft = {
  overallRating: number;
  aspectRatings: Record<ReviewAspect, number>;
  photoUris: readonly string[];
  text: string;
  anonymous: boolean;
};

export const EMPTY_REVIEW_DRAFT: ReviewDraft = {
  overallRating: 0,
  aspectRatings: { Service: 0, Cleanliness: 0, Value: 0, Atmosphere: 0 },
  photoUris: [],
  text: "",
  anonymous: false,
};

export const MAX_REVIEW_PHOTOS = 5;
export const MAX_REVIEW_TEXT_LENGTH = 500;

export function isReviewSubmittable(draft: ReviewDraft): boolean {
  return draft.overallRating > 0;
}

// ---------------------------------------------------------------------------
// Referral
// ---------------------------------------------------------------------------

export type ReferralStats = {
  invited: number;
  joined: number;
  earned: number;
};

export function formatReferralCode(code: string): string {
  // Insert dashes every 4 chars e.g. "ZARK-1A2B-CDEF"
  return code.replace(/(.{4})(?=.)/g, "$1-").toUpperCase();
}
