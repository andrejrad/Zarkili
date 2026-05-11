# Week 25 Close Report — Batch E: Loyalty, Activities, Reviews (Consumer UI)

**Window:** Week 25 (Phase 2 consumer-UI fifth sprint).
**Status:** ✅ Complete — all 9 screens (E.1–E.9), 5 new shared-UI primitives, 1 helper module, and all test gates delivered — GO for Week 26.
**Predecessor:** [WEEK24_CLOSE_REPORT.md](WEEK24_CLOSE_REPORT.md).

## 1. Scope

Per [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md](PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md) Batch E, W25 ships the consumer loyalty / activities / reviews surface area: loyalty landing hub, reward catalog with filtering and sorting, reward redemption gate, activity challenge browser, activity detail, reward claim confirmation, post-booking review prompt, review detail read view, and referral link share screen — plus the complete `loyaltyHelpers.ts` pure-logic module and all supporting shared-UI primitives.

W25 was completed in two phases:

1. **Design-handoff session** (separate, prior) — Batch E design-handoff artifacts locked into `design-handoff/specs/*` and `design-handoff/components/*`; 5 W25 primitives scaffolded and specifications reviewed.
2. **W25 engineering session** (this report) — primitives fully implemented, `loyaltyHelpers.ts` authored, 9 screens built, routes added, 5 test suites created, all test-fix passes run to green.

All screens are props-driven with no Firestore I/O — the navigator layer wires live data once the backend loyalty service ships.

## 2. Features Delivered

### 2.1 Foundation — `src/shared/ui/` (5 new primitives)

| Primitive | Surface |
|-----------|---------|
| `ProgressRing` | SVG-based circular progress ring with `progress` (0–1), `size`, `strokeWidth`, `color`, optional `centerLabel` and `centerSubLabel` text, and `state` ("idle" / "loading" / "error"). Renders a hidden marker View keyed `{testID}-loading` during loading and an error-icon center View keyed `{testID}-error` during error. WCAG: `accessibilityRole="progressbar"` with `accessibilityValue.now` (0–100). |
| `TierBadge` | Capsule badge displaying a loyalty tier label. Non-interactive path: `accessibilityRole="text"`. Interactive path (`onPress`): `accessibilityRole="button"` with `accessibilityLabel`. Tier color mapped from `colors.tier.*` design token. Visual uppercase applied via `textTransform: "uppercase"` in style (not JS `.toUpperCase()`) so RNTL queries match text content. |
| `RewardCard` | Pressable reward card with `title`, `pointCost`, `type` chip, optional `imageUri`, lock overlay (when `isLocked`) keyed `{testID}-locked-overlay`, and redeemed ribbon (when `isRedeemed`) keyed `{testID}-redeemed-badge`. `accessibilityState.disabled` set when locked or redeemed. |
| `RatingSelector` | Star-rating row (1–5) with configurable `size` (24 or 32), `isDisabled`, and `onRatingChange`. Stars rendered as `Pressable` with `testID="rs-star-{n}"` — no `accessibilityElementsHidden` or `importantForAccessibility` so RNTL can query all stars. Outer `<View testID={testID}>` carries `accessibilityRole="adjustable"` and `accessibilityState={{ disabled: isDisabled }}`. |
| `PhotoUploadTile` | Square upload tile that switches between a Pressable add-photo state and a disabled placeholder (when `isDisabled`). Disabled branch renders the "Max 5 photos" text with no `accessibilityElementsHidden` so RNTL queries reach it. Max-photo count driven by `MAX_REVIEW_PHOTOS` constant from `loyaltyHelpers.ts`. |

All five reuse W21 design tokens (`src/shared/ui/tokens.ts`) unchanged. All are props-driven and have no business knowledge.

### 2.2 Pure helper — `src/app/loyalty/loyaltyHelpers.ts`

Zero React imports. 39 exported symbols across five logical sections:

#### Tier system
- **Types / constants:** `LoyaltyTier` union ("Bronze" / "Silver" / "Gold" / "Platinum"), `LOYALTY_TIERS`, `TIER_THRESHOLDS` (500 / 1,500 / 5,000 / ∞), `TIER_PROGRESS_LABEL`.
- **Functions:** `deriveTier(points)` (threshold scan), `nextTier(current)` (null at Platinum), `pointsToNextTier(points)` (null at Platinum), `computeTierProgress(points)` (0–1 clamped, 1.0 at Platinum).

#### Point formatting
- `formatPoints(n)` — "1,234 pts" (thousands separator); `formatPointsDelta(delta)` — "+50 pts" / "−25 pts".

#### Earn actions / history
- **Types / constants:** `EarnAction` (id, label, pointValue, iconName), `DEFAULT_EARN_ACTIONS` (5 standard earn entries), `HistoryEntry` (id, date, label, delta, type).
- **Functions:** `formatHistoryDate(iso)` — locale date string.

#### Rewards
- **Types / constants:** `RewardFilterTab` union ("All" / "Free" / "Discount" / "Experience" / "Partner"), `REWARD_FILTER_TABS`, `RewardSortOption` union ("lowest-points" / "highest-points" / "newest"), `Reward` type (id, title, description, type, pointCost, isLocked, isRedeemed, imageUri, expiresAt).
- **Functions:** `filterRewards(rewards, tab)`, `sortRewards(rewards, sort)`.

#### Activities
- **Types / constants:** `ActivityStatus` union (5 states), `ActivityTab` union ("active" / "completed" / "all"), `ACTIVITY_TABS`, `ACTIVITY_TAB_LABELS`, `ActivityStep` (id, label, completed), `Activity` (id, title, description, status, steps, pointReward, deadline).
- **Functions:** `filterActivitiesByTab(activities, tab)`, `computeActivityProgressLabel(activity)` ("2 of 3 steps done"), `deriveActivityCtaLabel(status)` (per-status CTA string).

#### Reviews / referrals
- **Types / constants:** `ReviewAspect` union ("Service" / "Cleanliness" / "Value" / "Atmosphere"), `REVIEW_ASPECTS`, `AspectRating`, `ReviewDraft` (overallRating, aspectRatings, text, photos), `EMPTY_REVIEW_DRAFT`, `MAX_REVIEW_PHOTOS` (5), `MAX_REVIEW_TEXT_LENGTH` (500), `ReferralStats` (code, referralCount, pointsEarned, pendingCount).
- **Functions:** `isReviewSubmittable(draft)` (overallRating ≥ 1 required), `formatReferralCode(code)` — groups into "XXXX-XXXX" chunks.

### 2.3 Screens — `src/app/loyalty/`, `src/app/activities/`, `src/app/reviews/` (9 screens)

| # | Screen | File | Composition |
|---|--------|------|-------------|
| E.1 | **Loyalty Landing** | `src/app/loyalty/LoyaltyLandingScreen.tsx` | `ProgressRing` tier-progress hero + `TierBadge` + points balance + next-tier hint text + `EarnActionRow` list sourced from `DEFAULT_EARN_ACTIONS` + points history feed + loading skeleton wrapper keyed `{testID}-loading` + `StickyFooterCta` Browse rewards button (`primaryTestID`). |
| E.2 | **Reward Catalog** | `src/app/loyalty/RewardCatalogScreen.tsx` | `SegmentedControl`-style `RewardFilterTab` row + sort-by `ModalSheet` + `RewardCard` grid + empty-per-tab states + loading / error. |
| E.3 | **Reward Redemption** | `src/app/loyalty/RewardRedemptionScreen.tsx` | `RewardCard` detail hero + point cost vs. balance comparison + lock/insufficient/expired state banners + earn-more hint in scroll body (when insufficient) + `StickyCtaBar` (proper `primaryLabel` / `onPrimaryPress` / `primaryTestID` props; `primaryDisabled` when redeeming or insufficient). |
| E.4 | **Activities** | `src/app/activities/ActivitiesScreen.tsx` | `SegmentedControl` active/completed/all tabs + `ActivityCard` rows with status chips + `filterActivitiesByTab` composing the visible list + loading / error / empty-per-tab. |
| E.5 | **Activity Detail** | `src/app/activities/ActivityDetailScreen.tsx` | Activity header (title, description, deadline, point reward) + step-checklist rows + `ProgressRing` step progress + `StickyCtaBar` (proper props; `ctaLabel` from `deriveActivityCtaLabel`). |
| E.6 | **Claim Activity Reward** | `src/app/activities/ClaimActivityRewardScreen.tsx` | `ModalSheet` (no `title` prop — avoids duplicate heading) + animated confetti placeholder + "Reward earned!" heading + point-award summary + `StickyCtaBar` Done CTA. |
| E.7 | **Review Prompt** | `src/app/reviews/ReviewPromptScreen.tsx` | Star `RatingSelector` (overall, `size={32}`) + per-aspect `RatingSelector` grid (size 24) + `AspectChip` row (each chip renders `{aspect}` string — `ReviewAspect` is a string union, not an object) + text `TextInput` (500-char limit) + `PhotoUploadTile` row (max 5) + `StickyCtaBar` Submit review (proper props; `primaryDisabled={!submittable}`). |
| E.8 | **Review Detail** | `src/app/reviews/ReviewDetailScreen.tsx` | Read-only review display: author, date, overall star row, aspect pills, review text, photo gallery, salon reply block + loading / error (retry `Pressable` keyed `{testID}-retry`). |
| E.9 | **Referral** | `src/app/loyalty/ReferralScreen.tsx` | `formatReferralCode`-formatted code block + copy-to-clipboard `Pressable` + share sheet trigger + stats card (referrals sent, points earned, pending) + how-it-works explainer. |

### 2.4 Routes

Nine new public `guard: "none"` routes appended to [src/app/navigation/routes.ts](../../src/app/navigation/routes.ts):

`LoyaltyLanding` `/loyalty`, `RewardCatalog` `/loyalty/rewards`, `RewardRedemption` `/loyalty/rewards/redeem`, `Activities` `/loyalty/activities`, `ActivityDetail` `/loyalty/activities/detail`, `ClaimActivityReward` `/loyalty/activities/claim`, `ReviewPrompt` `/reviews/prompt`, `ReviewDetail` `/reviews/detail`, `Referral` `/loyalty/referral`.

Anonymous-route ordering snapshot in [src/app/navigation/\_\_tests\_\_/routes.test.ts](../../src/app/navigation/__tests__/routes.test.ts) extended with all 9 new entries after `RefundStatus`.

## 3. Tests

- **Root jest:** 1,953 → **2,045** passing across 128 → **133** suites (+92 tests, +5 suites).
- **Functions vitest:** **187** passing across 14 suites (unchanged — Batch E is consumer-UI only).
- **`npx tsc --noEmit`** (root): 0 errors.

New suites:

- [src/shared/ui/\_\_tests\_\_/loyalty-primitives.test.tsx](../../src/shared/ui/__tests__/loyalty-primitives.test.tsx) — covers all 5 W25 primitives: `ProgressRing` (centerLabel / centerSubLabel props, loading and error testID markers, accessibility role + value), `TierBadge` (text render with display casing, interactive vs. non-interactive roles), `RewardCard` (title + cost render, locked overlay testID, redeemed badge testID, disabled accessibilityState, onPress callback), `RatingSelector` (star testIDs rs-star-1 through rs-star-5 reachable, disabled accessibilityState, onRatingChange callback), `PhotoUploadTile` (add-photo pressable, disabled "Max 5 photos" text visible via getByText).
- [src/app/loyalty/\_\_tests\_\_/loyaltyHelpers.test.ts](../../src/app/loyalty/__tests__/loyaltyHelpers.test.ts) — covers all 5 logical sections: tier thresholds, `nextTier` / `pointsToNextTier` boundary cases, `computeTierProgress` at Platinum, `formatPoints` thousands separator, `formatPointsDelta` signed display, `filterRewards` by tab including "All" passthrough, `sortRewards` all three options, `filterActivitiesByTab` active/completed/all partitions, `computeActivityProgressLabel` step fraction phrasing, `deriveActivityCtaLabel` all 5 status values, `isReviewSubmittable` (zero rating blocked, full draft passes), `formatReferralCode` grouping.
- [src/app/loyalty/\_\_tests\_\_/loyaltyScreens.test.tsx](../../src/app/loyalty/__tests__/loyaltyScreens.test.tsx) — smoke renders for `LoyaltyLandingScreen`, `RewardCatalogScreen`, and `RewardRedemptionScreen` with key state branches (loading skeleton, error + retry, locked reward, insufficient-points hint, redeemed ribbon).
- [src/app/activities/\_\_tests\_\_/activitiesScreens.test.tsx](../../src/app/activities/__tests__/activitiesScreens.test.tsx) — smoke renders for `ActivitiesScreen`, `ActivityDetailScreen`, and `ClaimActivityRewardScreen`.
- [src/app/reviews/\_\_tests\_\_/reviewScreens.test.tsx](../../src/app/reviews/__tests__/reviewScreens.test.tsx) — smoke renders for `ReviewPromptScreen` (aspect labels from string union, submittable gate) and `ReviewDetailScreen` (retry testID in error state).

### Test-fix pass summary

Several test / component mismatches were discovered during first-run and corrected in the same session:

| Root cause | Fix applied |
|-----------|-------------|
| `ProgressRing` missing `{testID}-loading` and `{testID}-error` marker elements | Added hidden marker Views with those testIDs |
| `TierBadge` `.toUpperCase()` made RNTL text tree disagree with test query | Removed `.toUpperCase()`, added `textTransform: "uppercase"` to style |
| `RewardCard` lock overlay and redeemed ribbon had no testIDs | Added `{testID}-locked-overlay` and `{testID}-redeemed-badge` |
| `RatingSelector` stars had `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"` hiding them from RNTL `getByTestId` | Removed both props from star Pressables |
| `PhotoUploadTile` disabled branch had `accessibilityElementsHidden` hiding text content | Removed `accessibilityElementsHidden` and `importantForAccessibility` from disabled return |
| `ReviewPromptScreen` `AspectChip` used `aspect.label` | `ReviewAspect` is a string union — changed to `{aspect}` |
| Three screens (`ReviewPromptScreen`, `ActivityDetailScreen`, `RewardRedemptionScreen`) used `StickyCtaBar` as a children container | `StickyCtaBar` does not render `children` — refactored all three to use `primaryLabel` / `onPrimaryPress` / `primaryTestID` / `primaryDisabled` props |
| `ClaimActivityRewardScreen` had `title="Reward earned"` on `ModalSheet` duplicating the body heading | Removed `title=` prop from `ModalSheet` call |
| `ReviewDetailScreen` retry `Pressable` had no testID | Added `{testID}-retry` testID |
| Test prop names wrong (`onViewRewards`, `onEarnActionPress`, `onRetry`) | Corrected to `onPressBrowseRewards`, `onPressEarnAction`, `onPressRetry` |
| routes.test.ts hardcoded list missing 9 new routes | Added all 9 W25 routes to the `toEqual` snapshot |
| 5 TypeScript errors: lowercase `RewardFilterTab` values in test, `SkeletonBox` width type, redundant `screenState !== "error"` check, `size="large"` on `RatingSelector`, `PhotoUploadTile` `StyleSheet.create` cast | Fixed each specifically |

## 4. Security

- **No PCI surface.** W25 screens handle loyalty points, reviews, and referral codes only. No payment data.
- **No Firestore I/O from screens.** All screens are props-driven; live data wired via navigator layer once backend loyalty service ships. No new Firestore rules needed.
- **Referral code display only.** `formatReferralCode` splits and formats a code received as a prop — no generation of codes client-side. Clipboard write is a shallow wrapper on the React Native Clipboard API; no sensitive credentials involved.
- **Review photos are URIs only.** `PhotoUploadTile` accepts `uri` string props; no file I/O or network upload is performed in the component layer. Upload pipeline is caller responsibility.
- **WCAG 2.1 AA preserved:** every interactive element ≥ 44×44 (`ProgressRing` min 44h, `RewardCard` Pressable min 44h, `TierBadge` button path min 44h, `RatingSelector` stars `spacing.touchTarget`). `ProgressRing` exposes `accessibilityRole="progressbar"` + `accessibilityValue.now`. `RatingSelector` exposes `accessibilityRole="adjustable"` + `accessibilityState.disabled`. `RewardCard` exposes `accessibilityState.disabled` when locked/redeemed.
- **No telemetry changes.** W25 screens compose no new AI feature calls and do not extend the `aiFeatureKeys` registry.

## 5. Architectural Notes

- **Pure-helper pattern preserved.** `loyaltyHelpers.ts` has zero React imports. Tier thresholds, reward filtering, activity status derivation, and referral formatting can all be reused in Cloud Functions (loyalty points ledger writes, activity completion webhooks) without rewrites.
- **`StickyCtaBar` contract clarified.** Does not render `children`. Requires `primaryLabel` + `onPrimaryPress`; optional `primaryTestID`, `primaryDisabled`, `secondaryLabel`, `onSecondaryPress`. Three screens were incorrectly using it as a children container; all three corrected.
- **`StickyFooterCta` vs. `StickyCtaBar` distinction.** `LoyaltyLandingScreen` uses `StickyFooterCta` (total display + CTA button; has `primaryTestID` prop forwarded to inner `Button`). `ActivityDetailScreen`, `ReviewPromptScreen`, and `RewardRedemptionScreen` use `StickyCtaBar` (pure action bar; no total display).
- **`TierBadge` visual-only uppercase.** `textTransform: "uppercase"` is applied in the stylesheet for visual presentation; the text content in the component tree remains the original casing ("Gold", not "GOLD"). This is the correct pattern — RNTL queries the text content, not the rendered glyph.
- **`RatingSelector` accessibility.** Stars are individually pressable `Pressable` elements with `testID="rs-star-{n}"`. The outer `<View>` carries the consolidated `accessibilityRole="adjustable"` and `accessibilityState={{ disabled: isDisabled }}` as the single accessibility node for screen readers. `accessibilityElementsHidden` was intentionally **not** applied to individual stars so both `getByTestId` and `onPress` are reachable in RNTL.
- **`computeTierProgress` returns 1.0 at Platinum.** Platinum has no next threshold; `pointsToNextTier` returns null and the progress formula clamps to 1.0 / `ProgressRing` renders a full ring.
- **`filterRewards("All")` is a passthrough.** No transformation applied; order is preserved from the caller's list, allowing the navigator to pre-sort by `sortRewards` before filtering.
- **`deriveActivityCtaLabel` covers all 5 `ActivityStatus` values.** A TypeScript exhaustive-check pattern (`never` branch) ensures new status values added in future cause a compile error rather than a runtime gap.

## 6. Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))

- **Closed:** No prior debts closed in W25.
- **New W25 debts (3):**
  - **W25-DEBT-1** — Backend loyalty service: points ledger Firestore write (bookings/{id}/loyaltyEvents subcollection), Cloud Function trigger on booking-confirmed event emitting point award, `getPointsBalance(userId)` + `getPointsHistory(userId)` read ports. Required to wire live data to `LoyaltyLandingScreen` and `RewardCatalogScreen`.
  - **W25-DEBT-2** — Reward redemption write path: `redeemReward(userId, rewardId)` Cloud Function with idempotency key + Firestore point deduction + reward-issuance document at `users/{uid}/redeemedRewards/{rewardId}`. Required to wire `RewardRedemptionScreen.onRedeem`.
  - **W25-DEBT-3** — Activity completion + claim write path: activity progress tracked server-side via `logActivityStep(userId, activityId, stepId)` Cloud Function; `claimActivityReward(userId, activityId)` Cloud Function with same idempotency + point-award pattern. Required to wire `ActivityDetailScreen.onCtaPress` and `ClaimActivityRewardScreen.onClaim`.
- **Carried forward:** W19-DEBT-4, W19-DEBT-5, W20-DEBT-2, W20-DEBT-3, W20-DEBT-4, W22-DEBT-1, W22-DEBT-3, W23-DEBT-1, W23-DEBT-3, W24-DEBT-1, W24-DEBT-2, W24-DEBT-3.

## 7. Index — Changed Files

- **New (production):** `src/shared/ui/{ProgressRing,TierBadge,RewardCard,RatingSelector,PhotoUploadTile}.tsx`; `src/app/loyalty/loyaltyHelpers.ts`; `src/app/loyalty/{LoyaltyLandingScreen,RewardCatalogScreen,RewardRedemptionScreen,ReferralScreen}.tsx`; `src/app/activities/{ActivitiesScreen,ActivityDetailScreen,ClaimActivityRewardScreen}.tsx`; `src/app/reviews/{ReviewPromptScreen,ReviewDetailScreen}.tsx`.
- **New (tests):** `src/shared/ui/__tests__/loyalty-primitives.test.tsx`; `src/app/loyalty/__tests__/{loyaltyHelpers,loyaltyScreens}.test.ts(x)`; `src/app/activities/__tests__/activitiesScreens.test.tsx`; `src/app/reviews/__tests__/reviewScreens.test.tsx`.
- **Modified:** `src/shared/ui/index.ts` (W25 primitive exports under `// W25 Batch E primitives`); `src/app/navigation/routes.ts` (+9 public `/loyalty/*` + `/reviews/*` routes); `src/app/navigation/__tests__/routes.test.ts` (anonymous-route snapshot extended); `documentation/new-platform/WEEKLY_LOG.md`; `documentation/PROGRAM_TRACKING_BOARD.md`.

## 8. Next-Week Prerequisites (Week 26)

W26 inherits W21 + W22 + W23 + W24 + W25 primitives unchanged. The Phase 2 consumer-UI surface area (auth → discover → booking → payments → loyalty / activities / reviews) is now feature-complete on the screen layer. W26 and beyond shift emphasis to:

- **W25-DEBT-1 / 2 / 3** — loyalty backend (points ledger, reward redemption, activity claims) to wire live data into the E.* screens.
- **W23-DEBT-1** — booking persistence Cloud Functions + read ports for salon / services / staff / availability (also gates W25 activity completion triggers, which hook into booking-confirmed events).
- **W24-DEBT-2** — Stripe server-side payment infrastructure (still required for the D.1 / D.2 real-money path).
- **W22-DEBT-1** — `react-native-maps` wiring for `ExploreMapScreen` (target W28).
- Review write path: `submitReview(userId, bookingId, draft)` Cloud Function gates `ReviewPromptScreen.onSubmit`.
- Referral claim path: backend referral tracking and point-award on first booking gates `ReferralScreen` onShare intent.

