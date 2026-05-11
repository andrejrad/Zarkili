/**
 * loyaltyHelpers.test.ts
 * Unit tests for pure loyalty domain helpers.
 */

import {
  computeTierProgress,
  deriveTier,
  filterActivitiesByTab,
  filterRewards,
  formatPoints,
  formatPointsDelta,
  formatReferralCode,
  isReviewSubmittable,
  nextTier,
  pointsToNextTier,
  sortRewards,
  type Activity,
  type Reward,
  type ReviewDraft,
} from "../loyaltyHelpers";

/* ─────────────────────── deriveTier ─────────────────────── */
describe("deriveTier", () => {
  it("returns Bronze for 0 points", () => {
    expect(deriveTier(0)).toBe("Bronze");
  });

  it("returns Silver at exactly 500", () => {
    expect(deriveTier(500)).toBe("Silver");
  });

  it("returns Gold at exactly 1500", () => {
    expect(deriveTier(1500)).toBe("Gold");
  });

  it("returns Platinum at exactly 5000", () => {
    expect(deriveTier(5000)).toBe("Platinum");
  });

  it("returns Platinum above 5000", () => {
    expect(deriveTier(9999)).toBe("Platinum");
  });
});

/* ─────────────────────── pointsToNextTier / nextTier ─────────────────────── */
describe("pointsToNextTier", () => {
  it("returns 500 from 0 (Bronze → Silver)", () => {
    expect(pointsToNextTier(0)).toBe(500);
  });

  it("returns null when already Platinum", () => {
    expect(pointsToNextTier(5000)).toBeNull();
  });
});

describe("nextTier", () => {
  it("returns Silver for Bronze tier holder", () => {
    expect(nextTier("Bronze")).toBe("Silver");
  });

  it("returns null for Platinum", () => {
    expect(nextTier("Platinum")).toBeNull();
  });
});

/* ─────────────────────── computeTierProgress ─────────────────────── */
describe("computeTierProgress", () => {
  it("returns 0 for fresh Bronze user", () => {
    expect(computeTierProgress(0)).toBe(0);
  });

  it("returns 1 when at or above Platinum threshold", () => {
    expect(computeTierProgress(5000)).toBe(1);
  });

  it("returns ~0.5 halfway between Silver (500) and Gold (1500)", () => {
    expect(computeTierProgress(1000)).toBeCloseTo(0.5, 2);
  });
});

/* ─────────────────────── formatPoints ─────────────────────── */
describe("formatPoints", () => {
  it("formats with pts suffix", () => {
    expect(formatPoints(200)).toBe("200 pts");
  });

  it("handles zero", () => {
    expect(formatPoints(0)).toBe("0 pts");
  });
});

describe("formatPointsDelta", () => {
  it("prefixes positive with +", () => {
    expect(formatPointsDelta(50)).toBe("+50 pts");
  });

  it("prefixes negative with -", () => {
    expect(formatPointsDelta(-100)).toBe("-100 pts");
  });
});

/* ─────────────────────── filterRewards ─────────────────────── */
const MOCK_REWARDS: Reward[] = [
  { id: "r1", title: "Free Coffee", points: 100, type: "Free", redeemed: false, locked: false, imageAlt: "" },
  { id: "r2", title: "10% Discount", points: 200, type: "Discount", redeemed: false, locked: false, imageAlt: "" },
  { id: "r3", title: "Spa Day", points: 5000, type: "Experience", redeemed: true, locked: true, imageAlt: "" },
];

describe("filterRewards", () => {
  it("returns all rewards for All tab", () => {
    expect(filterRewards(MOCK_REWARDS, "All", 1000).length).toBe(3);
  });

  it("filters to matching type", () => {
    const result = filterRewards(MOCK_REWARDS, "Free", 1000);
    expect(result.every((r) => r.type === "Free")).toBe(true);
  });
});

describe("sortRewards", () => {
  it("sorts ascending by points for lowest-points", () => {
    const sorted = sortRewards(MOCK_REWARDS, "lowest-points");
    expect(sorted[0].id).toBe("r1");
    expect(sorted[sorted.length - 1].id).toBe("r3");
  });

  it("sorts descending by points for highest-points", () => {
    const sorted = sortRewards(MOCK_REWARDS, "highest-points");
    expect(sorted[0].id).toBe("r3");
  });
});

/* ─────────────────────── filterActivitiesByTab ─────────────────────── */
const MOCK_ACTIVITIES: Activity[] = [
  { id: "a1", title: "Book twice", icon: "📅", status: "in_progress", currentSteps: 1, totalSteps: 2, pointsReward: 100, isNew: true, steps: [] },
  { id: "a2", title: "Write a review", icon: "⭐", status: "completed", currentSteps: 1, totalSteps: 1, pointsReward: 50, isNew: false, steps: [] },
  { id: "a3", title: "Old challenge", icon: "🏆", status: "expired", currentSteps: 0, totalSteps: 3, pointsReward: 200, isNew: false, steps: [] },
];

describe("filterActivitiesByTab", () => {
  it("returns active activities for active tab", () => {
    const result = filterActivitiesByTab(MOCK_ACTIVITIES, "active");
    expect(result.every((a) => a.status !== "completed" && a.status !== "expired")).toBe(true);
  });

  it("returns completed activities for completed tab", () => {
    const result = filterActivitiesByTab(MOCK_ACTIVITIES, "completed");
    expect(result.every((a) => a.status === "completed")).toBe(true);
  });

  it("returns all activities for all tab", () => {
    expect(filterActivitiesByTab(MOCK_ACTIVITIES, "all").length).toBe(3);
  });
});

/* ─────────────────────── isReviewSubmittable ─────────────────────── */
describe("isReviewSubmittable", () => {
  const baseDraft: ReviewDraft = {
    overallRating: 0,
    aspectRatings: { Service: 0, Cleanliness: 0, Value: 0, Atmosphere: 0 },
    text: "",
    photoUris: [],
    anonymous: false,
  };

  it("returns false when rating is 0", () => {
    expect(isReviewSubmittable(baseDraft)).toBe(false);
  });

  it("returns true when rating > 0", () => {
    expect(isReviewSubmittable({ ...baseDraft, overallRating: 4 })).toBe(true);
  });
});

/* ─────────────────────── formatReferralCode ─────────────────────── */
describe("formatReferralCode", () => {
  it("uppercases and inserts dashes every 4 chars", () => {
    expect(formatReferralCode("abc12345")).toBe("ABC1-2345");
  });

  it("formats 8-char code with one dash", () => {
    expect(formatReferralCode("ZARK12AB")).toBe("ZARK-12AB");
  });
});
