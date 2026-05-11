# W36-A — Per-Screen Firebase Wire-Up Checklist

> Companion to [W36_FIREBASE_SERVICE_GAP_REPORT.md](W36_FIREBASE_SERVICE_GAP_REPORT.md).
> Scope: **W36-A only** — wire screens that already have a matching Phase 1 factory
> in `src/domains/<domain>/`. Methods that are missing entirely (W36-B small adds,
> W36-C payments scaffold) are excluded from this list.
>
> Mechanic per row: replace the prop-driven `mockXxxData` value in
> `src/app/navigation/AppNavigatorShell.tsx` with a hook/loader that calls the
> domain factory, keeps the same prop shape, and surfaces loading/error via the
> existing `Banner` primitive.

Generated: 2026-04-30 (W35→W36 transition)

---

## Legend

- **Bundle** — key in [src/app/navigation/mockData.ts](src/app/navigation/mockData.ts) to retire.
- **Factory** — Phase 1 entry point under `src/domains/`.
- **Risk** — wire-up complexity. `S` straight swap, `M` needs adapter/projection, `L` needs new app-layer service.
- **Tests** — closest existing test file to extend.

---

## 1. Auth screens — `src/domains/auth/repository.ts`

`AuthProvider` already calls `createAuthRepository`; most auth screens are
pre-wired through context. The mock bundle is only used for **placeholder
display values** on screens reached via deep link before the user has typed
anything.

| Screen | Bundle field | Factory method | Risk | Notes |
|---|---|---|---|---|
| [SignInScreen](src/app/auth/SignInScreen.tsx) | — | `signIn` | S | Already wired via `AuthProvider`. Verify error-mapping covers `auth/wrong-password`, `auth/user-not-found`, `auth/too-many-requests`. |
| [SignUpScreen](src/app/auth/SignUpScreen.tsx) | — | `createAccount` | S | Already wired. Confirm profile doc is written (`createAccount` bundles it). |
| [ForgotPasswordScreen](src/app/auth/ForgotPasswordScreen.tsx) | — | `sendPasswordReset` | S | Already wired. |
| [ResetPasswordScreen](src/app/auth/ResetPasswordScreen.tsx) | — | (Firebase action code) | S | Uses Firebase OOB code; verify deep-link parsing. |
| [EmailVerificationScreen](src/app/auth/EmailVerificationScreen.tsx) | `mockAuthData.pendingVerificationEmail` | **W36-B** `sendEmailVerification` | — | Defer — method missing. |
| [OtpVerificationScreen](src/app/auth/OtpVerificationScreen.tsx) | `mockAuthData.pendingOtpDestination` | (phone provider) | M | Wire to Firebase phone-auth confirmation result. |
| [SocialSignInSelectorScreen](src/app/auth/SocialSignInSelectorScreen.tsx) | — | **W36-B** `signInWithProvider` | — | Defer — method missing. |
| [AccountMergeScreen](src/app/auth/AccountMergeScreen.tsx) | `mockAuthData.accountMerge.{bookingCount,loyaltyPoints,emailExists}` | `listBookingsByCustomer` + `getBalance` (loyalty) + `readUserProfile` | M | Build app-layer adapter `getMergePreview(email)`. |
| [AgeGateScreen](src/app/auth/AgeGateScreen.tsx) | — | (local state only) | S | No wire-up needed. |
| [AuthEdgeScreen](src/app/auth/AuthEdgeScreen.tsx) | — | (state machine) | S | No wire-up needed. |

---

## 2. Discover / Explore — `src/domains/discovery/service.ts`

| Screen | Bundle field | Factory method | Risk | Notes |
|---|---|---|---|---|
| [HomeScreen](src/app/discover/HomeScreen.tsx) | `mockDiscoveryData.featuredSalons`, `categories`, `recentBookings` | `discoveryService.getHomeFeed()` | S | Wrap in `useEffect` + `useState`; loading skeleton already exists. |
| [DiscoverFeedScreen](src/app/discover/DiscoverFeedScreen.tsx) | `mockDiscoveryData.feedPosts` | `discoveryService.getExploreFeed()` | M | Cursor pagination is **W36-B**. Initial wire-up loads first page only. |
| [ExploreSearchResultsScreen](src/app/discover/ExploreSearchResultsScreen.tsx) | `mockDiscoveryData.searchResults` | **W36-B** `discoveryService.search` | — | Defer — method missing. |
| [FilterSheetScreen](src/app/discover/FilterSheetScreen.tsx) | `mockDiscoveryData.defaultFilters` | (local state, persisted to AsyncStorage) | S | No backend call. |
| [SalonProfileScreen](src/app/discover/SalonProfileScreen.tsx) | `mockDiscoveryData.salonProfile` | `getLocationById` + `listServicesByLocation` + `listLocationStaff` | M | Build app-layer adapter `getConsumerSalonView(tenantId, locationId)`. |
| [ServiceDetailScreen](src/app/discover/ServiceDetailScreen.tsx) | (subset of `salonProfile`) | `listServicesByLocation` | S | Reuse adapter from SalonProfileScreen. |
| [StaffMemberDetailScreen](src/app/discover/StaffMemberDetailScreen.tsx) | (subset of `salonProfile`) | `listLocationStaff` | S | Reuse adapter. |
| [NearMeSalonMapScreen](src/app/discover/NearMeSalonMapScreen.tsx) | `mockDiscoveryData.featuredSalons` | `discoveryService.getHomeFeed` (filtered by geo) | M | Geo filter is post-W36; initial wire returns full set. |
| [ExploreMapScreen](src/app/discover/ExploreMapScreen.tsx) | `mockDiscoveryData.featuredSalons` | `discoveryService.getHomeFeed` | S | Same as above. |

---

## 3. Booking flow — `src/domains/bookings/repository.ts` + `slotEngine.ts`

| Screen | Bundle field | Factory method | Risk | Notes |
|---|---|---|---|---|
| [ServiceSelectionScreen](src/app/booking/ServiceSelectionScreen.tsx) | `mockBookingData.serviceGroups`, `addOnCatalog` | `listServicesByLocation` | M | Group-by-category projection done client-side. |
| [StaffSelectionScreen](src/app/booking/StaffSelectionScreen.tsx) | `mockBookingData.staff` | `listServiceQualifiedStaff` | S | Filters by selected service IDs. |
| [BookingDatePickerScreen](src/app/booking/BookingDatePickerScreen.tsx) | (date list, local) | (no backend call) | S | — |
| [BookingTimePickerScreen](src/app/booking/BookingTimePickerScreen.tsx) | `mockBookingData.timeSlots`, `disabledSlots`, `timezone` | **W36-B** `slotEngineService.getAvailableSlots` orchestrator | — | Defer — orchestrator missing (`generateSlots` exists but needs wrapping). |
| [BookingReviewScreen](src/app/booking/BookingReviewScreen.tsx) | `mockBookingData.priceBreakdown` | (local computation from picked services + add-ons) | S | Pricing math stays client-side until pricing service exists. |
| [BookingPoliciesScreen](src/app/booking/BookingPoliciesScreen.tsx) | `mockBookingData.policySections` | `getLocationById` (policies field) | S | — |
| [BookingPaymentScreen](src/app/booking/BookingPaymentScreen.tsx) | `mockBookingData.savedCards`, `mockPaymentsData.savedMethods` | **W36-C** `paymentsRepository.getSavedPaymentMethods` | — | Defer — payments domain missing entirely. |
| [BookingConfirmationScreen](src/app/booking/BookingConfirmationScreen.tsx) | (booking from previous step) | `bookingsRepository.createBookingAtomically` | S | Already idempotent + transactional. |
| [ManageBookingScreen](src/app/booking/ManageBookingScreen.tsx) | (booking detail) | `getBookingById` + `cancelBooking` (+ **W36-B** `rescheduleBooking`) | M | Cancel ready; reschedule deferred. |
| [SlotConflictScreen](src/app/booking/SlotConflictScreen.tsx) | (alt slots) | **W36-B** `getAvailableSlots` | — | Defer. |
| [GuestContactScreen](src/app/booking/GuestContactScreen.tsx) | (form only) | (no backend) | S | Persisted as part of `createBookingAtomically` payload. |
| [MultiServiceBookingScreen](src/app/booking/MultiServiceBookingScreen.tsx) | (services from selection) | (no extra call) | S | — |
| [PostBookingUpgradeScreen](src/app/booking/PostBookingUpgradeScreen.tsx) | `mockBookingData.upgradeOffers` | `listServicesByLocation` (filtered) | S | — |

---

## 4. Booking history — `src/domains/bookings/repository.ts`

| Screen | Bundle field | Factory method | Risk | Notes |
|---|---|---|---|---|
| [BookingHistoryScreen](src/app/payments/BookingHistoryScreen.tsx) | `mockPaymentsData.bookingHistory` | `listBookingsByCustomer(tenantId, customerId, { status, limit })` | S | Note: lives under `app/payments/` for historical reasons; backed by bookings domain. |
| [ReceiptScreen](src/app/payments/ReceiptScreen.tsx) | `mockPaymentsData.receipt` | `getBookingById` (receipt fields) | S | — |
| [RefundStatusScreen](src/app/payments/RefundStatusScreen.tsx) | `mockPaymentsData.refund` | **W36-C** payments | — | Defer. |
| [DisputeScreen](src/app/payments/DisputeScreen.tsx) | (form) | **W36-C** payments | — | Defer. |
| [SavedPaymentMethodsScreen](src/app/payments/SavedPaymentMethodsScreen.tsx) | `mockPaymentsData.savedMethods` | **W36-C** payments | — | Defer. |
| [AddPaymentMethodScreen](src/app/payments/AddPaymentMethodScreen.tsx) | — | **W36-C** payments | — | Defer. |
| [TippingScreen](src/app/payments/TippingScreen.tsx) | (tip presets) | **W36-C** payments | — | Defer. |
| [NativePayScreen](src/app/payments/NativePayScreen.tsx) | — | **W36-C** payments | — | Defer. |
| [PaymentFailedScreen](src/app/payments/PaymentFailedScreen.tsx) | (error state) | (local) | S | No backend. |
| [PaymentExtrasScreen](src/app/payments/PaymentExtrasScreen.tsx) | (mock list) | **W36-C** payments | — | Defer. |

---

## 5. Loyalty — `src/domains/loyalty/repository.ts`

| Screen | Bundle field | Factory method | Risk | Notes |
|---|---|---|---|---|
| [LoyaltyLandingScreen](src/app/loyalty/LoyaltyLandingScreen.tsx) | `mockLoyaltyData.points`, `historyEntries`, `earnActions` | `getCustomerLoyaltyState(userId, tenantId)` | S | Single-call hydration. |
| [ClientLoyaltyScreen](src/app/loyalty/ClientLoyaltyScreen.tsx) | `mockLoyaltyData.points`, `historyEntries` | `getBalance` + `listTransactions` | S | — |
| [RewardCatalogScreen](src/app/loyalty/RewardCatalogScreen.tsx) | `mockLoyaltyData.rewards` | (rewards live on tenant config — read via `tenants` repo) | M | Needs tenant-loyalty-config read. |
| [RewardRedemptionScreen](src/app/loyalty/RewardRedemptionScreen.tsx) | (selected reward) | `debitPoints` | S | Already transactional. |
| [ReferralScreen](src/app/loyalty/ReferralScreen.tsx) | `mockLoyaltyData.referralStats` | `referrals` repo (`src/domains/referrals/`) | S | — |
| [LoyaltyExtrasScreen](src/app/loyalty/LoyaltyExtrasScreen.tsx) | `mockLoyaltyData.activities` | `listTransactions` | S | — |

---

## 6. Notifications & messaging

Mock-only today; mostly W37 once messaging Cloud Functions are in.

| Screen | Bundle | Factory | Risk | Notes |
|---|---|---|---|---|
| [NotificationCenterScreen](src/app/notifications/NotificationCenterScreen.tsx) | `mockMessagingData.notifications` | `notifications` repo | S | Single read. |
| [NotificationPreferencesScreen](src/app/notifications/NotificationPreferencesScreen.tsx) | `mockMessagingData.preferences` | `notifications` repo (prefs) | S | — |
| [NotificationsExtrasScreen](src/app/notifications/NotificationsExtrasScreen.tsx) | (extras) | — | S | Static. |

---

## 7. Profile & settings — `src/domains/auth/repository.ts`

| Screen | Bundle | Factory | Risk | Notes |
|---|---|---|---|---|
| [EditProfileScreen](src/app/profile/EditProfileScreen.tsx) | (current user from `AuthProvider`) | `updateProfile` | S | — |
| [ChangeCredentialsScreen](src/app/profile/ChangeCredentialsScreen.tsx) | — | `updateEmailAddress` (+ `updatePassword` via Firebase) | S | — |
| [ConnectedAccountsScreen](src/app/profile/ConnectedAccountsScreen.tsx) | — | **W36-B** provider linking | — | Defer. |

---

## 8. Suggested execution order (W36-A)

1. **Auth re-verification** — confirm SignIn/SignUp/ForgotPassword still pass against the live `AuthProvider` after the W35 nav refactor.
2. **Discover home feed** — single-screen, single-call wire-up. Lowest-risk first cut.
3. **Salon profile adapter** — pulls in three domain reads; gates the booking flow.
4. **Booking creation path** (Service → Staff → Date → Confirmation), skipping TimePicker (depends on W36-B).
5. **Booking history + Receipt** — read-only, completes the round-trip story.
6. **Loyalty landing + redemption** — independent from booking; can run in parallel with #3.
7. **Profile edit** — last, depends on auth being green.

---

## 9. Build/test checklist per row

For each row marked S/M:

- [ ] Add a `useXxx` hook in `src/app/<domain>/hooks/` (or extend existing) that calls the factory and returns `{ data, loading, error }`.
- [ ] Replace the `mockXxx` prop in [AppNavigatorShell.tsx](src/app/navigation/AppNavigatorShell.tsx) with the hook output.
- [ ] Show loading skeleton (already on most screens) and route errors to `Banner` (`tone="error"`).
- [ ] Add a unit test that mocks the factory and asserts the screen renders with `data`, `loading`, and `error` states.
- [ ] Delete the now-unused mock bundle field from `mockData.ts` only after **every** consumer is wired (track per-bundle in a follow-up cleanup PR at the end of W36-A).
- [ ] Re-run `npm run check` (lint + typecheck + Jest) and confirm green.

---

## 10. Things explicitly out of scope for W36-A

- Cursor pagination on `getExploreFeed` → W36-B.
- `discoveryService.search` → W36-B.
- `getAvailableSlots` orchestrator → W36-B.
- `rescheduleBooking` → W36-B.
- `signInWithProvider`, `sendEmailVerification`, provider linking → W36-B.
- Entire payments domain (saved methods, charge, tipping, refunds, disputes) → W36-C.
- Geo-filtered "near me" map queries → post-W36.
- Cloud Function changes for messaging → W37.
