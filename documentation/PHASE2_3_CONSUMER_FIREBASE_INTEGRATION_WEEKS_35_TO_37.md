# Phase 2.3 — Consumer App Manual QA and Firebase Service Integration (Weeks 35–37)

## Why This Plan Exists

Phase 2.2 (W33–W34) wires all 49 consumer routes into `AppNavigatorShell` and builds the 8 missing discovery screen components, but all screens remain **prop-driven with mock/static data** from `src/app/navigation/mockData.ts`. The running app is fully navigable but reads no real Firestore data and fires no real Firebase Auth, Stripe, or FCM calls.

Phase 2 (W21–W32) exit condition #1 states: *"Every domain listed in Domain Coverage has a complete client-facing UI wired to real services."* Phase 2.2 satisfies navigation wiring; this phase satisfies real-service connection.

Phase 2.3 has two explicitly sequenced parts:
- **Week 35 — Manual QA with mock data:** Validate every consumer flow end-to-end before touching real data. Catch navigation bugs, UX gaps, and prop-shape mismatches while the environment is deterministic.
- **Weeks 36–37 — Firebase service integration:** Connect each screen group to its real backend service domain by domain — Auth → Discovery → Booking → Payments → Loyalty → Messaging → Notifications → Waitlist → Onboarding.

## Why Manual Testing Before Firebase

Connecting to a live backend changes two variables at once: the **data source** and **behavior under real async conditions**. Testing with mock data first isolates those variables:

- A navigation or rendering bug found with mock data is always a code/wiring bug.
- A display issue that appears only with real data is always a data-shape or async-state bug.
- A crash that occurs only after Firebase is connected has a narrowed, attributable cause.

Manual QA with mock data also produces a **baseline test protocol** that is re-executed after each Firebase domain integration increment (W36–W37) as a rolling regression check.

## Scope Boundary

### In scope
- **Week 35:** Scripted exploratory QA across all 68 test cases on iOS and Android with mock data. P0/P1 bug fixes within W35.
- **Week 36:** Firebase integration tier 1 — Auth, Discovery/Search, Booking flow, Payments/Stripe.
- **Week 37:** Firebase integration tier 2 — Loyalty, Activities, Messaging, Notifications/FCM, Waitlist, Onboarding orchestration. Retirement of `mockData.ts` from production code. Final smoke test with real data.

### Out of scope
- Admin-side Firebase integration — that is Phase 3's responsibility.
- New backend endpoints or Firestore schema changes — Phase 1 and W13–W20 services are consumed as-is.
- Load testing or performance profiling — Phase 3.5.
- Regression automation for the new flows — automated E2E tests are a Phase 3.5 deliverable.

## Assumptions
- All Phase 2.2 exit conditions met: 49 routes wired, ≥ 2,800 tests green, `tsc --noEmit` clean.
- Development Firebase project is provisioned and accessible.
- Stripe test-mode keys are set in `.env.development`; no live keys used.
- All Phase 1 service classes (`bookingService`, `slotEngineService`, `salonService`, etc.) compile against current schema.
- Development Firestore is seeded with enough test data to exercise each flow (salons, services, staff, at least one booking, loyalty balance, messages).

## Entry Conditions (must be true before Week 35 starts)
1. Phase 2.2 close report signed off; all 49 routes wired in `AppNavigatorShell`; Phase 2.2 exit conditions 1–8 satisfied.
2. Physical or virtual devices available: iOS 16+ (iPhone 14 or later) and Android 12+ (Pixel 6 or emulator API 33+).
3. `mockData.ts` verified as covering all props consumed in `AppNavigatorShell.tsx` Phase 2.2 branches.
4. Devices enrolled in Expo Go or internal development build distribution.
5. Development Firebase project connectivity confirmed (Auth sign-in, Firestore read/write, FCM token registration).
6. Dev Firestore seeded: at least 2 salons, 3 services each, 2 staff each, 1 past booking, loyalty balance > 0, 1 message thread.

## Exit Conditions (Definition of Done for Phase 2.3)
1. Manual QA sign-off: all 68 test cases attempted on iOS and Android; 0 P0/P1 open; findings log committed.
2. Auth flow uses real Firebase Auth including social sign-in.
3. Discovery/Search reads real Firestore salon, service, and staff documents.
4. Booking flow creates, lists, cancels, and reschedules real Firestore booking records via `bookingService`.
5. Payment step calls real Stripe SDK via the Phase 1 Week 13 payment service.
6. Loyalty, activities, messaging (with real-time listener), notifications (FCM), waitlist, and onboarding orchestration all read/write real Firestore.
7. `mockData.ts` removed from production `AppNavigatorShell.tsx` imports; file either deleted or relocated to test scope.
8. App does not crash with empty Firestore state (empty states render correctly for all screens).
9. `tsc --noEmit` clean. Jest suite ≥ 2,800 green (mock stubs updated to reflect real service shapes).
10. Phase 2.3 close report filed under `documentation/new-platform/`.
11. Phase 2 exit condition #1 ("wired to real services") is now satisfied and signed off.

---

## Week 35 — Manual QA with Mock Data

### Purpose

A structured, scripted exploratory test pass across every consumer flow. The app is fully wired with `mockData.ts`; no network calls are made. Two passes are run per platform: iOS and Android. Every finding is triaged before W36 begins; P0 and P1 bugs are fixed within W35.

### Test Environment
- **Build:** Expo development build pointing at development Firebase project (network calls disabled or unreachable; mock data supplies all content)
- **Data:** `src/app/navigation/mockData.ts` — deterministic, no network dependency
- **Devices:** 1× iOS (iPhone 14 or later), 1× Android (Pixel 6 or emulator API 33+)
- **Logging:** Expo DevTools (JS logs), React DevTools (component state inspection)

### Result notation
- ✅ Pass / ❌ Fail / ⏭ Deferred
- Severity if Fail: **P0** (blocks W36 start) · **P1** (must fix in W35) · **P2** (log ticket, defer post-W37)

---

### Section 1 — Launch and Auth (TC-001 – TC-009)

| ID | Flow | Steps | Expected Result |
|----|------|-------|-----------------|
| TC-001 | Cold launch | Start app from scratch | `LandingScreen` renders; CTA buttons visible; no crash |
| TC-002 | Login — email | Tap Login → enter email/password → submit | Navigates to Home or `CompleteProfile`; no crash |
| TC-003 | Login — back nav | Login screen → press Back | Returns to `LandingScreen` |
| TC-004 | Register | Tap Register → fill form → submit | Navigates to `CompleteProfile` |
| TC-005 | CompleteProfile → Home | Fill profile form → submit | Navigates to Home/Discover tab; tab bar visible |
| TC-006 | Social sign-in selector | Login → Social tab | Provider buttons render; no crash |
| TC-007 | Email verification | Triggered post-register (mock) | `EmailVerificationScreen` shows email, Resend button, confirm action |
| TC-008 | Forgot password | Login → Forgot Password | `ForgotPasswordScreen` renders; submit shows confirmation |
| TC-009 | Deep link — auth | Launch with `zarkili://login` | `LandingScreen` or `LoginScreen` opens; no crash |

---

### Section 2 — Navigation Shell and Tabs (TC-010 – TC-015)

| ID | Flow | Steps | Expected Result |
|----|------|-------|-----------------|
| TC-010 | Tab bar | Post-login state | 5 tabs visible: Home, Discover, Bookings, Rewards, Profile |
| TC-011 | Tab switching | Tap each tab in sequence | Each tab renders root screen; no crash |
| TC-012 | Tab state persistence | Discover → drill 2 levels → Home → back to Discover | Document actual behavior (stack reset vs. preserved); flag if unexpected |
| TC-013 | Rewards tab | Tap Rewards | `LoyaltyLandingScreen` renders (not old `<ScrollView>` placeholder) |
| TC-014 | Android hardware back | Any nested screen → hardware Back | Navigates up correctly; no double-pop; no crash |
| TC-015 | Home tab root | Tap Home | `HomeRouteScreen` renders with mock data visible |

---

### Section 3 — Discovery and Search (TC-016 – TC-024)

| ID | Flow | Steps | Expected Result |
|----|------|-------|-----------------|
| TC-016 | DiscoverHomeScreen | Navigate to Discover tab | Category pills and featured salons from mock render |
| TC-017 | Category pill tap | Tap a category pill | `ExploreResultsScreen` renders with mock results |
| TC-018 | Map toggle | `ExploreResultsScreen` → Map | `ExploreMapScreen` renders (stub map or placeholder acceptable) |
| TC-019 | Filters | Explore → Filters button | `DiscoverFiltersScreen` renders; filter chips are interactive |
| TC-020 | Salon profile | Tap a result card | `SalonProfileScreen` renders with mock salon data (name, hours, photos, services, staff) |
| TC-021 | Service detail | Salon profile → tap a service | `ServiceDetailScreen` renders with price, duration, staff list |
| TC-022 | Staff detail | Salon profile → tap a staff member | `StaffDetailScreen` renders |
| TC-023 | Back nav from profile | `SalonProfileScreen` → Back | Returns to `ExploreResultsScreen` |
| TC-024 | DiscoverFeed | Discover tab → Feed view | `DiscoverFeedScreen` renders mock posts |

---

### Section 4 — Booking Flow End-to-End (TC-025 – TC-039)

| ID | Flow | Steps | Expected Result |
|----|------|-------|-----------------|
| TC-025 | Enter booking flow | Salon profile → Book Now | `ServiceSelectionScreen` renders mock service groups |
| TC-026 | Service selection | Select 1 service → Next | `StaffSelectionScreen` renders relevant mock staff |
| TC-027 | Staff selection | Select staff → Next | `DateTimeSelectionScreen` renders |
| TC-028 | Date/time selection | Select date and slot → Next | `GuestDetailsScreen` renders |
| TC-029 | Guest details | Fill required fields → Next | `BookingReviewScreen` renders with correct summary |
| TC-030 | Booking review | Inspect summary → Confirm | `BookingPaymentScreen` renders |
| TC-031 | Payment step | Select mock card → Pay | `BookingConfirmationScreen` renders |
| TC-032 | Confirmation screen | View confirmation | Booking ID, service summary, and navigation CTAs all visible |
| TC-033 | Booking list | Bookings tab | Upcoming and past mock bookings render |
| TC-034 | Booking detail | Tap a booking | `BookingDetailScreen` renders full details |
| TC-035 | Cancel booking | Booking detail → Cancel | Cancellation flow renders; confirmation step shows policy text |
| TC-036 | Reschedule | Booking detail → Reschedule | Re-enters `DateTimeSelectionScreen` in reschedule mode |
| TC-037 | Back nav mid-flow | During booking flow → press Back repeatedly | Flow unwinds step by step; `BookingFlowState` clears when back to pre-flow screen |
| TC-038 | Policies screen | Booking review → Policies link | `BookingPoliciesScreen` renders |
| TC-039 | Slot segment toggle | Date/time screen → Morning / Afternoon / Evening | Slot list filters correctly per segment |

---

### Section 5 — Payments and Cards (TC-040 – TC-043)

| ID | Flow | Steps | Expected Result |
|----|------|-------|-----------------|
| TC-040 | Payment methods list | Profile → Payment Methods | Saved mock cards render with card brand, last 4 |
| TC-041 | Add card | Add Card CTA | `AddPaymentMethodScreen` renders |
| TC-042 | Remove card | Swipe/long-press mock card → Remove | Removal confirmation dialog shown |
| TC-043 | Loyalty points in payment | `BookingPaymentScreen` → apply points toggle | Points discount reflected in running total |

---

### Section 6 — Loyalty and Rewards (TC-044 – TC-050)

| ID | Flow | Steps | Expected Result |
|----|------|-------|-----------------|
| TC-044 | Loyalty landing | Rewards tab | Points balance, current tier, earn/browse CTAs render |
| TC-045 | Reward catalog | Loyalty → Browse Rewards | `RewardCatalogScreen` renders mock rewards |
| TC-046 | Reward detail | Tap reward | `RewardDetailScreen` renders with points cost and description |
| TC-047 | Redeem flow | Reward detail → Redeem | `RewardRedemptionConfirmScreen` renders; confirm shows success state |
| TC-048 | Points history | Loyalty → History | `PointsHistoryScreen` renders with mock entries (earn/spend rows) |
| TC-049 | Activities list | Loyalty → Earn → Activities | `ActivitiesScreen` renders mock challenges |
| TC-050 | Activity detail | Tap an activity | `ActivityDetailScreen` renders with progress and claim CTA |

---

### Section 7 — Messaging and Notifications (TC-051 – TC-055)

| ID | Flow | Steps | Expected Result |
|----|------|-------|-----------------|
| TC-051 | Messaging inbox | Navigation → Messages | `MessagesInboxScreen` renders mock threads (unread badge visible) |
| TC-052 | Message thread | Tap a thread | `MessageThreadScreen` renders mock messages in chronological order |
| TC-053 | Compose | Compose button in inbox | Compose screen renders; send action available |
| TC-054 | Notification center | Bell icon or nav → Notifications | `NotificationCenterScreen` renders mock notifications |
| TC-055 | Channel preferences | Settings → Notifications | `ChannelPreferencesScreen` renders the 8-event × 3-channel matrix |

---

### Section 8 — Profile and Settings (TC-056 – TC-062)

| ID | Flow | Steps | Expected Result |
|----|------|-------|-----------------|
| TC-056 | Profile screen | Profile tab | `ProfileScreen` renders mock name, avatar, stats |
| TC-057 | Edit profile | Profile → Edit | `EditProfileScreen` renders editable fields; Save visible |
| TC-058 | Settings shell | Profile → Settings | `SettingsShellScreen` renders all sections |
| TC-059 | Notification settings | Settings → Notifications | Notification pref screens reachable via navigation |
| TC-060 | Payment methods | Settings → Payment | `PaymentMethodManagementScreen` reachable |
| TC-061 | Legal screens | Settings → Legal | ToS, Privacy Policy, Licenses, About all reachable |
| TC-062 | Sign out | Settings → Sign Out | Returns to `LandingScreen`; auth state cleared |

---

### Section 9 — Waitlist (TC-063 – TC-064)

| ID | Flow | Steps | Expected Result |
|----|------|-------|-----------------|
| TC-063 | Waitlist list | Appointments or nav → Waitlist | `WaitlistScreen` renders mock entries |
| TC-064 | Join waitlist | Slot unavailable → Join Waitlist CTA | `WaitlistJoinScreen` renders with slot details pre-filled |

---

### Section 10 — Onboarding Flows (TC-065 – TC-068)

| ID | Flow | Steps | Expected Result |
|----|------|-------|-----------------|
| TC-065 | Client onboarding entry | New user or forced onboarding route | `ClientOnboardingWelcomeScreen` renders (not placeholder text) |
| TC-066 | Client onboarding steps | Progress through all 7 client steps | Each step renders the real `ClientOnboarding*` component |
| TC-067 | Salon onboarding entry | Owner user → `SalonOnboardingWizard` route | `SalonOnboardingWizard` renders step 1 |
| TC-068 | Salon onboarding steps | Progress through all 9 salon steps | Each step renders real `SalonOnboarding*` component; progress indicator advances |

---

### Bug Triage Protocol

All findings are logged in `documentation/new-platform/WEEK35_QA_MOCK_FINDINGS.md`:

```
## [TC-NNN] — Short title
- Platform: iOS / Android
- Severity: P0 / P1 / P2
- Description: what happened
- Steps to reproduce:
- Expected vs Actual:
- Screenshot ref: (filename or "N/A")
- Status: Open / Fixed / Deferred
```

**P0 findings block W36 start.** P1 findings must be resolved and retested within W35. P2 findings are logged as tickets and deferred.

### W35 Exit Gate

Before declaring W35 complete:
- [ ] iOS pass: all 68 TCs attempted; 0 P0, 0 P1 open
- [ ] Android pass: all 68 TCs attempted; 0 P0, 0 P1 open
- [ ] `WEEK35_QA_MOCK_FINDINGS.md` committed with full findings and resolutions
- [ ] All W35 bug fixes retested and marked resolved
- [ ] `tsc --noEmit` clean after any W35 code fixes
- [ ] Jest suite still green after any W35 code fixes
- [ ] Mock data confirmed as stable baseline: no changes to `mockData.ts` after W35 sign-off (changes invalidate the baseline)

---

## Week 36 — Firebase Integration Tier 1: Auth, Discovery, Booking, Payments

### Integration Pattern

Every domain follows the same **replace-mock → smoke-test** cycle:

1. Identify which `mockData.ts` fields the screen group consumes.
2. Locate the real service class / repository (built in Phase 1 W1–W20).
3. Replace mock props in `AppNavigatorShell.tsx` (and any screen-level state hooks) with real service calls.
4. Run the W35 test cases for that domain using real dev Firestore data.
5. Ensure `tsc --noEmit` passes after each domain.
6. Update jest mocks to reflect the real service module signatures.

All reads and writes target the **development Firebase project** (not production). Stripe is configured with test-mode keys from `.env.development`.

---

### W36 Domain: Auth

**Replace in `AppNavigatorShell` / auth route handlers:**

| Mock | Real service call |
|------|-------------------|
| `onPressLogin` mock handler | `firebaseAuthService.signInWithEmailAndPassword(email, password)` |
| `onPressRegister` mock handler | `firebaseAuthService.createUserWithEmailAndPassword(email, password)` |
| `onProvider` mock handler | `firebaseAuthService.signInWithProvider(providerId)` |
| `onResend` email verification | `firebaseAuthService.sendEmailVerification()` |
| Static `isLoggedIn` flag | `firebaseAuthService.onAuthStateChanged()` listener in shell `useEffect`; drives `activeRoute` on mount |
| `onPasswordReset` mock | `firebaseAuthService.sendPasswordResetEmail(email)` |
| `CompleteProfile` submit | `userProfileService.createProfile(uid, profileData)` |

**Test cases to re-run with real data:** TC-001 – TC-009

**Firebase services consumed:**
- `src/app/auth/firebaseAuthService.ts` (Phase 1, W3–W4)
- `src/services/userProfileService.ts` (Phase 1, W3)

---

### W36 Domain: Discovery and Search

**Replace in `AppNavigatorShell` / discovery route handlers:**

| Mock | Real service call |
|------|-------------------|
| `mockFeaturedSalons` | `discoverService.getFeaturedSalons(tenantId)` |
| `mockSearchResults` | `discoverService.search(query, filters)` |
| `mockSalon` (in `SalonProfileScreen`) | `salonService.getSalon(salonId)` |
| `mockServices` (in profile + detail) | `serviceCatalogService.getServicesForSalon(salonId)` |
| `mockStaff` (in profile + detail) | `staffService.getStaffForSalon(salonId)` |
| Discovery feed mock posts | `discoverService.getFeedPosts(clientId, cursor)` |

**Empty state requirement:** all screens must render their empty-state component when Firestore returns an empty collection (not crash, not spinner-forever).

**Test cases to re-run with real data:** TC-016 – TC-024

**Firebase services consumed:**
- `src/services/discoverService.ts` (Phase 1, W7–W8)
- `src/services/salonService.ts` (Phase 1, W5–W6)
- `src/services/serviceCatalogService.ts` (Phase 1, W5–W6)
- `src/services/staffService.ts` (Phase 1, W6)

---

### W36 Domain: Booking Flow

**Replace in `AppNavigatorShell` booking flow handlers:**

| Mock | Real service call |
|------|-------------------|
| Static mock `availableSlots` | `slotEngineService.getAvailableSlots(salonId, staffId, serviceIds, date)` |
| Booking confirm handler | `bookingService.createBooking(bookingPayload)` |
| Bookings tab list | `bookingService.getBookingsForClient(clientId)` (real-time listener) |
| Booking detail | `bookingService.getBooking(bookingId)` |
| Cancel handler | `bookingService.cancelBooking(bookingId, reason)` |
| Reschedule handler | `bookingService.rescheduleBooking(bookingId, newSlot)` |

**`BookingFlowState` transition:** the state machine is unchanged; only the terminal actions (confirm, cancel, reschedule) now call real services instead of no-ops.

**Test cases to re-run with real data:** TC-025 – TC-039

**Firebase services consumed:**
- `src/services/bookingService.ts` (Phase 1, W9–W10)
- `src/services/slotEngineService.ts` (Phase 1, W10)

---

### W36 Domain: Payments

**Replace in payment route handlers:**

| Mock | Real service call |
|------|-------------------|
| `mockSavedCards` | `paymentService.getSavedPaymentMethods(clientId)` |
| Add card (no-op) | `paymentService.attachPaymentMethod(clientId, stripePaymentMethodId)` using Stripe SDK |
| Remove card (no-op) | `paymentService.detachPaymentMethod(clientId, paymentMethodId)` |
| Booking payment (no-op) | `paymentService.chargeBooking(bookingId, paymentMethodId)` → W13 Cloud Function |
| Loyalty discount application | `paymentService.applyLoyaltyDiscount(clientId, points, bookingId)` |

**Stripe SDK note:** confirm `@stripe/stripe-react-native` is initialised in `App.tsx` with the test publishable key from `.env.development` before W36 starts.

**Test cases to re-run with real data:** TC-040 – TC-043

**Firebase services consumed:**
- `src/services/paymentService.ts` (Phase 1, W13–W14)
- Stripe React Native SDK (W13)

---

### W36 Exit Gate
- [ ] Auth, Discovery, Booking, Payments all reading/writing real Firebase dev data
- [ ] W35 test cases TC-001–TC-043 re-run on real data; 0 P0/P1 open
- [ ] Empty states render correctly for all four domains (no crash on empty Firestore)
- [ ] `tsc --noEmit` clean
- [ ] `npx jest --no-coverage` green (mock stubs updated for real service signatures)
- [ ] No regression on screens not yet migrated (they still use mock props; confirm mock props still resolve)

---

## Week 37 — Firebase Integration Tier 2: Loyalty, Messaging, Notifications, Waitlist, Onboarding

---

### W37 Domain: Loyalty and Activities

**Replace in loyalty and activities route handlers:**

| Mock | Real service call |
|------|-------------------|
| `mockLoyaltyPoints`, `mockTier`, `mockLoyaltyHistory` | `loyaltyService.getClientLoyalty(clientId)` |
| `mockRewards` | `loyaltyService.getRewardCatalog(tenantId)` |
| Reward redeem handler | `loyaltyService.redeemReward(clientId, rewardId)` |
| `mockActivities` | `activitiesService.getActivities(tenantId, clientId)` |
| Activity claim handler | `activitiesService.claimActivity(clientId, activityId)` |

**Test cases to re-run with real data:** TC-044 – TC-050

**Firebase services consumed:**
- `src/services/loyaltyService.ts` (Phase 1, W8)
- `src/services/activitiesService.ts` (Phase 1, W8)

---

### W37 Domain: Messaging

**Replace in messaging route handlers:**

| Mock | Real service call |
|------|-------------------|
| `mockThreads` | `messagingService.getThreadsForClient(clientId)` — **real-time `onSnapshot()` listener** |
| `mockMessages` in thread | `messagingService.getMessages(threadId)` — **real-time `onSnapshot()` listener** |
| Send message handler | `messagingService.sendMessage(threadId, text, attachments)` |

**Real-time listener pattern** (apply consistently across messaging and notifications):
```ts
useEffect(() => {
  const unsub = messagingService.getThreadsForClient(clientId, setThreads);
  return () => unsub();  // cleanup on unmount
}, [clientId]);
```
Every `onSnapshot()` registration must return an unsubscribe function and call it in a `useEffect` cleanup to prevent listener leaks on navigation.

**Test cases to re-run with real data:** TC-051 – TC-053

**Firebase services consumed:**
- `src/services/messagingService.ts` (Phase 1, W11)
- Firestore `onSnapshot()` listeners

---

### W37 Domain: Notifications

**Replace in notification route handlers:**

| Mock | Real service call |
|------|-------------------|
| `mockNotifications` | `notificationService.getNotifications(clientId)` — real-time listener |
| Mark-read handler | `notificationService.markRead(notificationId)` |
| `mockChannelPreferences` | `notificationService.getPreferences(clientId)` |
| Preferences save handler | `notificationService.updatePreferences(clientId, prefs)` |
| FCM token | `firebaseMessagingService.registerToken()` called in `AppNavigatorShell` auth state handler (once after sign-in) |

**FCM integration checklist:**
- [ ] `@react-native-firebase/messaging` initialised; token stored in user Firestore doc
- [ ] `onMessage` handler for foreground notifications registered in shell
- [ ] `onNotificationOpenedApp` handler for background tap-to-navigate registered
- [ ] iOS: confirm `NSUserNotificationUsageDescription` in `Info.plist`
- [ ] Android: confirm `google-services.json` present for dev build

**Test cases to re-run with real data:** TC-054 – TC-055

**Firebase services consumed:**
- `src/services/notificationService.ts` (Phase 1, W11)
- Firebase Cloud Messaging SDK

---

### W37 Domain: Waitlist

**Replace in waitlist route handlers:**

| Mock | Real service call |
|------|-------------------|
| `mockWaitlistEntries` | `waitlistService.getEntriesForClient(clientId)` |
| Join waitlist handler | `waitlistService.joinWaitlist(clientId, salonId, serviceId, preferredDate)` |
| Cancel entry handler | `waitlistService.cancelEntry(clientId, entryId)` |

**Test cases to re-run with real data:** TC-063 – TC-064

**Firebase services consumed:**
- `src/services/waitlistService.ts` (Phase 1, W10)

---

### W37 Domain: Onboarding Orchestration

**Replace in onboarding route handlers:**

| Mock | Real service call |
|------|-------------------|
| Static client onboarding step | `clientOnboardingService.getOnboardingState(clientId)` (W16 backend) |
| Client step completion | `clientOnboardingService.completeStep(clientId, stepId)` |
| Static salon wizard step | `salonOnboardingService.getOnboardingState(tenantId)` (W15 backend) |
| Salon step save | `salonOnboardingService.saveStep(tenantId, stepId, stepData)` |

**Test cases to re-run with real data:** TC-065 – TC-068

**Firebase services consumed:**
- `src/services/clientOnboardingService.ts` (Phase 1, W16)
- `src/services/salonOnboardingService.ts` (Phase 1, W15)

---

### W37 Cleanup — `mockData.ts` Retirement

After all domains are connected:

1. Audit all imports of `mockData.ts` in production files (`src/**`, `app/**` — excluding `__tests__/**`).
2. For each remaining consumer: either replace the import with a real service call or inline the constant directly in the test file under `__mocks__/`.
3. Delete `src/app/navigation/mockData.ts` from production source (or rename to `src/app/navigation/__mocks__/mockData.ts` for test use only).
4. Run `tsc --noEmit` and `npx jest --no-coverage` to confirm nothing breaks.
5. Confirm `AppNavigatorShell.tsx` has no `import` from `mockData`.

---

### W37 Exit Gate (= Phase 2.3 Exit)

- [ ] All 9 consumer domains connected to real Firebase (auth, discovery, booking, payments, loyalty, messaging, notifications, waitlist, onboarding)
- [ ] Real-time listeners (messaging, notifications) confirmed working on both iOS and Android; no leak on navigation away
- [ ] W35 manual QA baseline re-run against real dev data: all 68 TCs pass or have filed P2 tickets
- [ ] Empty-state rendering confirmed for all domains
- [ ] `mockData.ts` removed from production source or relocated to test scope
- [ ] `tsc --noEmit` clean
- [ ] `npx jest --no-coverage` green (≥ 2,800 tests; mock stubs updated to real shapes)
- [ ] Phase 2 exit condition #1 ("wired to real services") confirmed satisfied and signed off
- [ ] Phase 2.3 close report filed under `documentation/new-platform/`
- [ ] `PROGRAM_TRACKING_BOARD.md` Phase 2.3 tracking item marked Done

---

### W37 → W38 Deployment Gate: Stripe (must complete before Phase 3 begins)

The Cloud Function code (`paymentsAttachMethod`, `paymentsDetachMethod`, `paymentsChargeBooking`) was implemented in W37.5. One callable is still missing and deployment has not yet occurred. These two tasks are **hard gates** before W38 — the `payment-create` SLO is a W45 release readiness requirement.

**Step 1 — Implement `paymentsApplyLoyaltyDiscount` (W37.5-DEBT-1)**
- [ ] Add `paymentsApplyLoyaltyDiscount` `onCall` to `functions/src/payments.ts`
- [ ] Reads tenant loyalty config for points→cash conversion rate
- [ ] Debits points via `loyaltyRepository.debitPoints` in a Firestore transaction
- [ ] Returns `LoyaltyDiscountApplied` to client
- [ ] `functions/` tsc clean; vitest green
- [ ] Root tsc clean; Jest green
- [ ] DEBT_REGISTER W37.5-DEBT-1 marked closed

**Step 2 — Deploy to dev and smoke-test (W37.5-DEBT-2)**
- [ ] `STRIPE_API_KEY` secret set in Firebase Secrets Manager for `zarkili-dev` project
- [ ] `firebase deploy --only functions --project zarkili-dev` succeeds
- [ ] In Stripe Dashboard (test mode) → Webhooks → existing endpoint → add events: `payment_method.attached`, `payment_method.detached`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Smoke-test: attach a test card → `clients/{userId}/paymentMethods` doc appears in Firestore
- [ ] Smoke-test: charge a test booking → `tenants/{tenantId}/charges` doc appears; `payment_intent.succeeded` webhook updates `status: captured`
- [ ] Smoke-test: detach → Firestore doc deleted; next method promoted to default
- [ ] DEBT_REGISTER W37.5-DEBT-2 marked closed

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Firestore security rules block client reads in dev project | Medium | High | Review and update dev rules (not production) to grant authenticated client reads before W36 |
| Phase 1 service class interfaces have drifted since W12 | Medium | Medium | Run `tsc --noEmit` after wiring each domain; fix type mismatches before proceeding to next |
| Dev Firestore has no test data for a domain | Low | High | Seed script in `scripts/` covers salons, services, staff, bookings, and loyalty; run before W36 starts |
| Real-time Firestore listener leaks on screen unmount | Medium | Medium | Enforce `useEffect(() => { return () => unsub(); }, [])` pattern for every `onSnapshot()`; code-review gate |
| Stripe test-mode key misconfiguration | Low | High | Verify `.env.development` has `STRIPE_PUBLISHABLE_KEY_TEST` before W36; never commit real keys |
| `mockData.ts` harder to retire than estimated | Low | Low | Half-day budget in W37 cleanup block; if incomplete, log P2 ticket and finish as W38 hotfix |
| FCM permission denied on iOS simulator | Low | Medium | Use real device for FCM testing; simulator cannot receive push notifications |
| Empty Firestore collections expose unhandled undefined props | Medium | Medium | Confirm all screens handle `undefined` / `null` / `[]` gracefully before W36 exits |

---

## Manual QA Baseline Reuse

The 68 test cases from W35 serve as a **rolling regression baseline** across W36 and W37:

- After each Firebase domain integration, re-execute the relevant TCs with real dev data.
- Log pass/fail delta versus the W35 mock-data baseline. Any new failure is attributable to the Firebase change, not a pre-existing navigation bug.
- The W35 findings log (`WEEK35_QA_MOCK_FINDINGS.md`) is the reference for "what was already known" — do not re-triage findings already marked Deferred.

---

## Tracking

| Trello Code | Card | Week |
|-------------|------|------|
| `[W35-QA-001]` | Manual QA — Auth + Navigation shell (TC-001–TC-015) | W35 |
| `[W35-QA-002]` | Manual QA — Discovery + Booking flow (TC-016–TC-039) | W35 |
| `[W35-QA-003]` | Manual QA — Payments + Loyalty + Messaging (TC-040–TC-055) | W35 |
| `[W35-QA-004]` | Manual QA — Notifications + Waitlist + Onboarding (TC-056–TC-068) | W35 |
| `[W35-QA-005]` | W35 P0/P1 bug fix sprint | W35 |
| `[W36-FIR-001]` | Firebase: Auth domain integration | W36 |
| `[W36-FIR-002]` | Firebase: Discovery and Search integration | W36 |
| `[W36-FIR-003]` | Firebase: Booking flow integration | W36 |
| `[W36-FIR-004]` | Firebase: Payments + Stripe SDK integration | W36 |
| `[W37-FIR-005]` | Firebase: Loyalty + Activities integration | W37 |
| `[W37-FIR-006]` | Firebase: Messaging real-time integration | W37 |
| `[W37-FIR-007]` | Firebase: Notifications + FCM integration | W37 |
| `[W37-FIR-008]` | Firebase: Waitlist integration | W37 |
| `[W37-FIR-009]` | Firebase: Onboarding orchestration integration | W37 |
| `[W37-FIR-010]` | `mockData.ts` retirement + final smoke test | W37 |
