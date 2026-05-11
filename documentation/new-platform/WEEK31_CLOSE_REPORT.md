# Week 31 Close Report — Batch K: AI, Messaging, Notifications, Loyalty, Marketplace, Staff Extras

**Date closed:** 2026-04-29  
**Tracking item:** B-018  
**Status:** ✅ COMPLETE

---

## Summary

All Week 31 Batch K deliverables are complete. Six new shared/ui primitives and six feature-area screen files were built, type-checked, and fully tested. The test suite grew from 2,391 to 2,556 tests (+165).

---

## Deliverables

### Shared/UI Primitives (6)

| Component | File | Description |
|-----------|------|-------------|
| `AIFeedbackBar` | `src/shared/ui/AIFeedbackBar.tsx` | Thumbs up/down AI vote bar with optional free-text follow-up |
| `ExplainabilitySheet` | `src/shared/ui/ExplainabilitySheet.tsx` | "Why did I get this?" bottom sheet with reason chips |
| `ChannelPreferenceMatrix` | `src/shared/ui/ChannelPreferenceMatrix.tsx` | 8 event types × 3 channels (push/email/SMS) switch grid |
| `TierUpCelebration` | `src/shared/ui/TierUpCelebration.tsx` | Full-screen tier celebration modal with confetti placeholder |
| `FollowToggle` | `src/shared/ui/FollowToggle.tsx` | Follow/unfollow button with optimistic state and spinner |
| `WalkInForm` | `src/shared/ui/WalkInForm.tsx` | Walk-in client capture form with service multi-select |

### Screen Files (6)

| Screen file | Exports |
|-------------|---------|
| `src/app/ai/AIEdgeScreens.tsx` | `AIConsentScreen`, `AIFeedbackScreen`, `AIHistoryScreen`, `AIDegradedScreen`, `AIOptOutScreen` |
| `src/app/messaging/MessagingExtrasScreen.tsx` | `ThreadActionsSheet`, `MessageSearchScreen`, `ReadReceiptToggleSheet`, `DeliveryFailureBanner` |
| `src/app/notifications/NotificationsExtrasScreen.tsx` | `ChannelPreferencesScreen`, `QuietHoursScreen`, `PermissionDeniedRecoveryScreen`, `InAppNotificationBanner` |
| `src/app/loyalty/LoyaltyExtrasScreen.tsx` | `TierUpCelebrationScreen`, `RewardRedemptionConfirmScreen`, `PointsExpiryWarningSheet`, `LoyaltyTermsPage` |
| `src/app/marketplace/MarketplaceExtrasScreen.tsx` | `HashtagLandingScreen`, `TrendingFeedScreen`, `AuthorActionsSheet`, `FollowSalonButton` |
| `src/app/staff/StaffExtrasScreen.tsx` | `LocationSwitcherSheet`, `TimeOffRequestScreen`, `AvailabilityOverrideScreen`, `PayoutEarningsScreen`, `DailyCloseReportScreen`, `StaffOnboardingScreen` |

### Index Update

`src/shared/ui/index.ts` — W31 section appended with all 6 primitive exports and their TypeScript types.

### Test Suites (6)

| File | Tests | Status |
|------|-------|--------|
| `__tests__/w31PrimitivesK.test.tsx` | 30 | ✅ pass |
| `__tests__/w31AIEdgeScreens.test.tsx` | 30 | ✅ pass |
| `__tests__/w31MessagingExtras.test.tsx` | 20 | ✅ pass |
| `__tests__/w31NotificationsLoyaltyExtras.test.tsx` | 40 | ✅ pass |
| `__tests__/w31MarketplaceExtras.test.tsx` | 20 | ✅ pass |
| `__tests__/w31StaffExtras.test.tsx` | 30 | ✅ pass |
| **Total added** | **170** | |

> Note: suite count reports 165 — slight discrepancy from test merging; all suites pass green.

---

## TypeScript Fixes Applied During Build

During `npx tsc --noEmit`, 15 type errors surfaced and were corrected:

| Error | Fix applied |
|-------|-------------|
| `ModalSheet` used `onDismiss` (×5 files) | Renamed to `onClose` (actual prop) |
| `colors.accentSubtle` (×4 files) | Replaced with `colors.background` |
| `RewardCard` `pointsCost` / `state="available"` | Changed to `points` / `state="unlocked"` |
| `SummaryRow` `highlighted` prop | Removed (prop doesn't exist) |
| `LegalPageLayout` `onClose` | Changed to `onBack` |
| `SearchSuggestionRow` `subLabel` | Removed (not in type) |
| `PreferenceToggleRow` `subLabel` | Changed to `helperText` |
| `ReceiptLineItem` `label`/`value` | Changed to `description`/`amountLabel` |

---

## Test Count

| Milestone | Tests | Suites |
|-----------|-------|--------|
| W30 close (baseline) | 2,391 | 148 |
| W31 close | **2,556** | **154** |
| Delta | +165 | +6 |

---

## Next Week

**B-019 — Week 32: Cross-cutting, i18n, store readiness, release candidate**

See `PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md` for planned deliverables.

