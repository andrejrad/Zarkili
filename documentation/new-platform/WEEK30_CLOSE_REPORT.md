# Week 30 Close Report — Batch J: Booking, Payments, Discovery, Reviews Edge Cases (Consumer UI)

**Window:** Week 30 (Phase 2.1 consumer-UI depth sprint).
**Status:** ✅ Complete — all 12 screens (J.1–J.11 with multi-exports), 5 shared-UI primitives, 4 test suites delivered, tsc 0 errors, 74/74 jest tests — GO for Week 31.
**Predecessor:** [WEEK29_CLOSE_REPORT.md](WEEK29_CLOSE_REPORT.md).

## 1. Scope

W30 (Batch J) delivers edge-case screens across four consumer UI domains: booking (slot conflicts, multi-service, recurring, on-behalf, fees), payments (3DS overlay, native pay, pre-auth, split, gift cards, promo codes, wallet, disputes), discovery (search helpers, map clustering, salon actions), and reviews (filter/sort, photo lightbox, guidelines). These screens handle the rare but high-stakes user journeys that must work before app store submission.

W30 is entirely `code-only` per `FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md` — no Figma requirements.

All screens are props-driven with no live data I/O. Decision gate defaults applied: Recurring bookings = post-launch (No), Group messaging = post-launch (No).

## 2. Features Delivered

### 2.1 Foundation — `src/shared/ui/` (5 new primitives)

| Primitive | Surface |
|-----------|---------|
| `SearchSuggestionRow` | Leading icon emoji (🕐 recent / 🔖 saved / 🔍 suggested) + body label with first-match highlight in `colors.primary` + trailing ✕ remove (recent/saved) or › chevron (suggested). Props: `type`, `label`, `highlight?`, `onPress`, `onRemove?`, `testID?`. |
| `HelpfulUnhelpfulChip` | Side-by-side 👍/👎 chips with counts. Voted chip shows filled background (accent for helpful, error for unhelpful). Props: `helpfulCount`, `unhelpfulCount`, `userVote?`, `onPressHelpful`, `onPressUnhelpful`, `testID?`. |
| `ConflictRecoveryModal` | Wraps `ModalSheet`; renders up to 3 `TimeSlotChip`s with internal selection state. Footer: "See more times" tertiary + "Pick this time" primary (disabled until selection). States: `"default" \| "no-alternatives" \| "error"`. |
| `ThreeDsOverlay` | Full-screen `Modal` (transparent) with `rgba(0,0,0,0.6)` scrim; white 320×420 card, `borderRadius: 24`. Cancel ✕ always top-right. `pending` = `ActivityIndicator` + iframe placeholder; `approved/declined/timeout` = coloured banner. States: `"pending" \| "approved" \| "declined" \| "timeout"`. |
| `MapCluster` | `count` undefined or 1 → 32×32 coral-blossom pin; 2–9 → 40×40 mint-fresh cluster; ≥10 → 48×48 mint-fresh cluster. White count label inside cluster. Used by `NearMeSalonMapScreen`. |

All primitives use the W21 token layer (`src/shared/ui/tokens.ts`) unchanged.

### 2.2 Screens — 12 screens across 4 directories

| # | Screen(s) | File | Key Design |
|---|-----------|------|------------|
| J.1 | **SlotConflictScreen** | `src/app/booking/SlotConflictScreen.tsx` | Warning screen + up to 3 `TimeSlotChip` alternatives + "Pick this time" CTA disabled until selection. Re-exports `ConflictRecoveryModal`. States: `default \| no-alternatives \| error`. |
| J.2 | **MultiServiceBookingScreen**, **RecurringBookingSheet**, **OnBehalfBookingScreen** | `src/app/booking/MultiServiceBookingScreen.tsx` | J.2.1: duration totalizer sticky banner showing total time + price. J.2.2: recurring sheet with frequency chips (weekly/biweekly/monthly) + occurrences field + optional conflict warning `Banner`. J.2.3: `Switch` toggle + name/phone fields with required-fields error banner. Decision gate: recurring = post-launch. |
| J.3 | **FeeDisclosureSheet** | `src/app/booking/FeeDisclosureSheet.tsx` | Fee types: `deposit \| cancellation \| reschedule \| noShow`. noShow type requires acknowledgement checkbox before Continue CTA enabled. Deposit type shows `refundPolicy` text block. |
| J.4 | **ThreeDsScreen**, **PaymentFailedScreen** | `src/app/payments/PaymentFailedScreen.tsx` | `ThreeDsScreen`: thin wrapper that mounts `<ThreeDsOverlay visible />`. `PaymentFailedScreen`: 4 reasons (declined / insufficient-funds / network / error) with contextual copy, 3 actions (retry / use-other / contact-support). |
| J.5 | **NativePayScreen** | `src/app/payments/NativePayScreen.tsx` | Apple Pay / Google Pay / ACH placeholder screens. Methods: `apple \| google \| ach`. States: `ready \| pending \| completed \| cancelled`. Confirm button only visible in `ready` state. Bottom-sheet style layout. |
| J.6 | **PreAuthDisclosureSheet**, **SplitPaymentSheet**, **GiftCardSheet**, **PromoCodeSheet**, **WalletTopUpSheet** | `src/app/payments/PaymentExtrasScreen.tsx` | J.6.1: hold amount display + "I understand, continue". J.6.2: split amounts validated to sum `=== totalCents`. J.6.3: gift card code entry + balance display + remove. J.6.4: promo code + discount line. J.6.5: preset chips ($25/$50/$100) + custom `CurrencyInput`. |
| J.7 | **DisputeScreen** | `src/app/payments/DisputeScreen.tsx` | States: `open \| resolved-won \| resolved-lost \| error`. Reg E/Visa rules body box with blue left border. Timeline with filled/outlined dots per step. Evidence items with emoji icons. |
| J.8 | **SearchHelpersScreen**, **SearchSortSheet** | `src/app/discover/SearchHelpersScreen.tsx` | `SearchSuggestionRow` type=recent/saved/suggested per list section. States: `default \| typing \| no-results`. Sort: `recommended \| distance \| rating \| price-asc`. |
| J.9 | **NearMeSalonMapScreen** | `src/app/discover/NearMeSalonMapScreen.tsx` | `MapCluster` for single pin / cluster. Location-denied overlay: full-screen scrim + Allow Location button + ZIP fallback. Pin-detail `ModalSheet` with rating, distance, price tier, View Salon CTA. States: `granted \| denied \| no-results-in-view \| error`. |
| J.10 | **SalonActionsSheet** | `src/app/discover/SalonActionsSheet.tsx` | Expandable hours panel + holidays list. `Linking.openURL` for directions (Apple Maps / Google Maps). `Share.share()` for share. Block: `Alert.alert` destructive confirm. Report: inline `InputField` form → "reported" state + `Banner`. Internal states: `default \| reporting \| reported \| blocked \| error`. |
| J.11 | **ReviewsEdgeScreen**, **ReviewFilterSortSheet**, **ReviewPhotoLightbox**, **ReviewGuidelinesPage** | `src/app/reviews/ReviewsEdgeScreen.tsx` | Main list: `HelpfulUnhelpfulChip` per review, salon reply display, edit/delete for own reviews (delete confirm sheet). Filter: minRating chips 1–5 + withPhotosOnly checkbox + sort (newest/highest-rated/most-helpful). Lightbox: full-screen `Modal` with prev/next nav. Guidelines: 5 sections via `LegalPageLayout` children. |

### 2.3 Index

`src/shared/ui/index.ts` updated with W30 Batch J exports:
```typescript
// W30 Batch J primitives — Booking, Payments, Discovery, Reviews Edges
export { SearchSuggestionRow } from "./SearchSuggestionRow";
export type { SearchSuggestionRowProps, SearchSuggestionRowType } from "./SearchSuggestionRow";
export { HelpfulUnhelpfulChip } from "./HelpfulUnhelpfulChip";
export type { HelpfulUnhelpfulChipProps, HelpfulVote } from "./HelpfulUnhelpfulChip";
export { ConflictRecoveryModal } from "./ConflictRecoveryModal";
export type { ConflictRecoveryModalProps, ConflictRecoveryState } from "./ConflictRecoveryModal";
export { ThreeDsOverlay } from "./ThreeDsOverlay";
export type { ThreeDsOverlayProps, ThreeDsState } from "./ThreeDsOverlay";
export { MapCluster } from "./MapCluster";
export type { MapClusterProps } from "./MapCluster";
```

## 3. Tests

- **Root jest:** 2,317 → **2,391** passing across 144 → **148** suites (+74 tests, +4 suites).
- **`npx tsc --noEmit`** (root): 0 errors after a fix-pass correcting `radius.pill → radius.full`, `StickyFooterCta` prop names (`label → primaryLabel`, `onPress → onPrimaryPress`), `InputField` unsupported props (`keyboardType / editable / multiline` removed; `variant` used instead), `BookingService` import moved to `bookingHelpers`, `CurrencyInput` required `onChangeText` added, `RatingStars` prop `rating → value` and `size="sm" → size={16}`, `LegalPageLayout` `sections` replaced with JSX children.

| Suite | Path | Tests |
|-------|------|-------|
| bookingEdgeScreens | `src/app/booking/__tests__/bookingEdgeScreens.test.tsx` | 18 |
| paymentsEdgeScreens | `src/app/payments/__tests__/paymentsEdgeScreens.test.tsx` | 22 |
| discoverEdgeScreens | `src/app/discover/__tests__/discoverEdgeScreens.test.tsx` | 19 |
| reviewsEdgeScreens | `src/app/reviews/__tests__/reviewsEdgeScreens.test.tsx` | 15 |

## 4. Bug Fixes / API Corrections

| # | Issue | Fix |
|---|-------|-----|
| F-001 | `radius.pill` token doesn't exist | Replaced all usages with `radius.full` (9999) across 6 files |
| F-002 | `StickyFooterCta` has `primaryLabel` / `onPrimaryPress` not `label` / `onPress` | Fixed both call sites in `MultiServiceBookingScreen.tsx` |
| F-003 | `InputField` does not accept `keyboardType`, `editable`, or `multiline` | Used `variant` for keyboard type; `disabled` for editable; removed `multiline` |
| F-004 | `BookingService` not exported from `ServiceSelectionScreen` | Import moved to `bookingHelpers` where the type is defined |
| F-005 | `CurrencyInput` requires `onChangeText` (string), `onChangeValue` is the numeric callback | Fixed `WalletTopUpSheet` to use `onChangeText` for state update |
| F-006 | `RatingStars` prop is `value`, not `rating`; `size` is `16 \| 20 \| 32`, not `"sm"` | Fixed call site in `ReviewsEdgeScreen` |
| F-007 | `LegalPageLayout` uses `children` not a `sections` prop | `ReviewGuidelinesPage` now maps sections to JSX children |
| F-008 | `PreAuthDisclosureSheet` fee box `View` missing `testID` | Added `testID={testID ? \`${testID}-fee-box\` : undefined}` |

## 5. Decision Gates

| Item | Decision | Rationale |
|------|----------|-----------|
| Recurring bookings | Post-launch (No) | `RecurringBookingSheet` shipped but navigator may show "Coming soon" overlay; complexity requires separate QA cycle |
| Group messaging | Post-launch (No) | Not in scope for W30 |
| On-behalf booking | Delivered | Simple toggle + name/phone fields; consistent with staff app companion concept |

## 6. Files Created This Week

**Shared UI (5 primitives):**
- `src/shared/ui/SearchSuggestionRow.tsx`
- `src/shared/ui/HelpfulUnhelpfulChip.tsx`
- `src/shared/ui/ConflictRecoveryModal.tsx`
- `src/shared/ui/ThreeDsOverlay.tsx`
- `src/shared/ui/MapCluster.tsx`

**Booking (3 screen files, 5 screen exports):**
- `src/app/booking/SlotConflictScreen.tsx`
- `src/app/booking/MultiServiceBookingScreen.tsx`
- `src/app/booking/FeeDisclosureSheet.tsx`

**Payments (4 screen files, 8 screen exports):**
- `src/app/payments/PaymentFailedScreen.tsx`
- `src/app/payments/NativePayScreen.tsx`
- `src/app/payments/PaymentExtrasScreen.tsx`
- `src/app/payments/DisputeScreen.tsx`

**Discovery (3 screen files, 5 screen exports):**
- `src/app/discover/SearchHelpersScreen.tsx`
- `src/app/discover/NearMeSalonMapScreen.tsx`
- `src/app/discover/SalonActionsSheet.tsx`

**Reviews (1 screen file, 4 screen exports):**
- `src/app/reviews/ReviewsEdgeScreen.tsx`

**Tests (4 suites):**
- `src/app/booking/__tests__/bookingEdgeScreens.test.tsx`
- `src/app/payments/__tests__/paymentsEdgeScreens.test.tsx`
- `src/app/discover/__tests__/discoverEdgeScreens.test.tsx`
- `src/app/reviews/__tests__/reviewsEdgeScreens.test.tsx`

**Updated:**
- `src/shared/ui/index.ts` — W30 Batch J exports appended

## 7. Risk Log

| Risk | Status |
|------|--------|
| `PaymentExtrasScreen` pre-auth, gift card, and promo flows require backend integration for real code validation | Deferred — screens are prop-driven, caller holds state |
| `NearMeSalonMapScreen` uses placeholder `View` mock for map; react-native-maps not yet installed | Deferred — map rendering out of scope for UI sprint |
| `ThreeDsOverlay` iframe is a placeholder `View`; WebView integration required for real 3DS | Deferred — 3DS provider TBD |
| `SalonActionsSheet.handleDirections` uses `Linking.openURL` with hardcoded lat/lng fallback pattern | Acceptable for W30; real coordinates come from salon data model |

## 8. Successor

**Week 31** — per `PROGRAM_TRACKING_BOARD.md`, next batch to be confirmed. Phase 2.1 consumer UI depth sprint continues.
