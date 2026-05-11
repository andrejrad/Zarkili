# Mock Data Completeness Audit — 2026-04-29

> Audit of `src/app/navigation/mockData.ts` against the screens consumed by
> `AppNavigatorShell.tsx`. Goal: identify missing data fields before W36
> Firebase wire-up replaces these mocks.

## Summary

`mockData.ts` provides **complete coverage** for every consumer screen wired
through `AppNavigatorShell`. No missing fields were found that would block
manual QA. This file is targeted for retirement during W36–W37 as Firebase
services come online (per its own header comment).

## Coverage matrix

| Mock bundle | Screens served | Status |
|---|---|---|
| `mockAuthData` | `EmailVerification`, `OtpVerification`, `AccountMerge` | ✅ Complete |
| `mockBookingData` | `ServiceSelection`, `StaffSelection`, `BookingDate/Time`, `BookingReview`, `BookingPolicies`, `BookingPayment`, `BookingConfirmation`, `ManageBooking` | ✅ Complete (incl. `disabledSlots` for W35 PRE-FLIGHT-1) |
| `mockPaymentsData` | `SavedPaymentMethods`, `AddPaymentMethod`, `Tipping`, `Receipt`, `BookingHistory`, `RefundStatus` | ✅ Complete |
| `mockLoyaltyData` | `LoyaltyLanding`, `RewardCatalog`, `RewardRedemption`, `Activities`, `ActivityDetail`, `ClaimActivityReward`, `Referral`, `ReviewPrompt`, `ReviewDetail` | ✅ Complete |
| `mockMessagingData` | `Inbox`, `Thread`, `Compose`, `NotificationCenter` | ✅ Complete (threads, messages, salon search, quick replies, notifications all populated) |
| `mockWaitlistData` | `WaitlistJoin`, `WaitlistPosition` | ✅ Complete |
| `mockSalonOnboardingData` | Salon onboarding wizard (W34) | ✅ Complete |
| `mockDiscoveryData` | `DiscoverHome`, `DiscoverFeed`, `ExploreResults`, `ExploreMap`, `DiscoverFilters`, `SalonProfile`, `ServiceDetail`, `StaffDetail` | ✅ Complete |

## Minor observations

These are not blockers — just notes for the W36 implementer:

1. **`mockMessagingData.notifications`** has only 3 entries. When testing the
   "Mark all read" + per-tab filtering on `NotificationCenterScreen`,
   consider seeding an additional `system` and `message` category sample
   so each tab on `NotificationCenter` shows at least one row. Low priority.
2. **`mockBookingData.staff`** has 2 staff members but only one has
   `nextAvailableLabel: "Today"`. Browser flow happy-path with
   "Any technician" is well-covered; the multi-staff conflict scenario
   relies on `staff-2`'s `"Tomorrow"` slot. Adequate.
3. **`mockDiscoveryData.salonReviews`** only has 2 snippets. Pagination
   behaviour can't be exercised — but the screen is read-only mock for
   now, so this is fine until W36 wires real Firestore queries.
4. **`mockPaymentsData.refund`** is a single record. If `RefundStatusScreen`
   ever supports listing multiple refunds, this will need to grow.
5. **No `mockReviewsData` bundle** — review-related fixtures live inside
   `mockLoyaltyData.reviewSalon` and `mockLoyaltyData.reviewDetail`. This
   is fine but slightly off-domain; W36 may want to split when wiring real
   `reviewService`.
6. **`mockAuthData.accountMerge.emailExists: false`** — this only exercises
   one branch of `AccountMergeScreen`. The W35 device QA Section 2 may want
   a second variant fixture or a runtime toggle to test the
   `emailExists: true` path (which disables the "Create new account" CTA
   per the screen's `disabled={... || emailExists}` logic).

## Recommendation

No code changes required for W35 device QA. The minor observations above can
be folded into W36 ticket scope when each domain is wired to Firebase.

## What was NOT changed in this session

No source files were modified. This audit is informational only.
