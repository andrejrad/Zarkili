# Week 35 — Manual QA Test Case Pack (Mock Data)

Executable, checkbox-driven version of the 68 test cases defined in [PHASE2_3_CONSUMER_FIREBASE_INTEGRATION_WEEKS_35_TO_37.md](../PHASE2_3_CONSUMER_FIREBASE_INTEGRATION_WEEKS_35_TO_37.md). Each test case is run twice (iOS + Android). Findings are logged in `WEEK35_QA_MOCK_FINDINGS.md`.

## Run Header

- **Tester:** ___
- **Platform:** ☐ iOS  ☐ Android
- **Build:** ___
- **mockData.ts revision:** ___
- **Date started:** ___
- **Date completed:** ___

## Severity Legend

- **P0** — blocks W36 start (Firebase integration cannot begin)
- **P1** — must fix and retest within W35
- **P2** — log ticket, defer post-W37

## Result Notation

For each test case below, mark one: **PASS** ✅ / **FAIL** ❌ / **DEFERRED** ⏭

If FAIL, log severity (P0/P1/P2) and a finding entry in `WEEK35_QA_MOCK_FINDINGS.md` with the TC-NNN reference.

---

## Section 1 — Launch and Auth (TC-001 – TC-009)

- [ ] **TC-001** Cold launch — Start app from scratch → `LandingScreen` renders, CTA buttons visible, no crash
- [ ] **TC-002** Login (email) — Tap Login → enter email/password → submit → navigates to Home or `CompleteProfile`, no crash
- [ ] **TC-003** Login back nav — Login → press Back → returns to `LandingScreen`
- [ ] **TC-004** Register — Tap Register → fill form → submit → navigates to `CompleteProfile`
- [ ] **TC-005** CompleteProfile → Home — Fill profile form → submit → navigates to Home/Discover tab, tab bar visible
- [ ] **TC-006** Social sign-in selector — Login → Social tab → provider buttons render, no crash
- [ ] **TC-007** Email verification — Triggered post-register (mock) → `EmailVerificationScreen` shows email + Resend + confirm
- [ ] **TC-008** Forgot password — Login → Forgot Password → `ForgotPasswordScreen` renders, submit shows confirmation
- [ ] **TC-009** Deep link auth — Launch with `zarkili://login` → `LandingScreen` or `LoginScreen` opens, no crash

## Section 2 — Navigation Shell and Tabs (TC-010 – TC-015)

- [ ] **TC-010** Tab bar — Post-login → 5 tabs visible (Home, Discover, Bookings, Rewards, Profile)
- [ ] **TC-011** Tab switching — Tap each tab in sequence → each renders root screen, no crash
- [ ] **TC-012** Tab state persistence — Discover → drill 2 levels → Home → back to Discover → document actual behavior, flag if unexpected
- [ ] **TC-013** Rewards tab — Tap Rewards → `LoyaltyLandingScreen` renders (NOT old `<ScrollView>` placeholder)
- [ ] **TC-014** Android hardware back — Any nested screen → hardware Back → navigates up correctly, no double-pop, no crash
- [ ] **TC-015** Home tab root — Tap Home → `HomeRouteScreen` renders with mock data visible

## Section 3 — Discovery and Search (TC-016 – TC-024)

- [ ] **TC-016** DiscoverHomeScreen — Discover tab → category pills + featured salons from mock render
- [ ] **TC-017** Category pill tap — Tap a category pill → `ExploreResultsScreen` renders with mock results
- [ ] **TC-018** Map toggle — `ExploreResultsScreen` → Map → `ExploreMapScreen` renders (stub map acceptable)
- [ ] **TC-019** Filters — Explore → Filters button → `DiscoverFiltersScreen` renders, filter chips interactive
- [ ] **TC-020** Salon profile — Tap a result card → `SalonProfileScreen` renders with mock salon data
- [ ] **TC-021** Service detail — Salon profile → tap a service → `ServiceDetailScreen` renders with price, duration, staff list
- [ ] **TC-022** Staff detail — Salon profile → tap staff member → `StaffDetailScreen` renders
- [ ] **TC-023** Back nav from profile — `SalonProfileScreen` → Back → returns to `ExploreResultsScreen`
- [ ] **TC-024** DiscoverFeed — Discover tab → Feed view → `DiscoverFeedScreen` renders mock posts

## Section 4 — Booking Flow End-to-End (TC-025 – TC-039)

- [ ] **TC-025** Enter booking flow — Salon profile → Book Now → `ServiceSelectionScreen` renders mock service groups
- [ ] **TC-026** Service selection — Select 1 service → Next → `StaffSelectionScreen` renders relevant mock staff
- [ ] **TC-027** Staff selection — Select staff → Next → `DateTimeSelectionScreen` renders
- [ ] **TC-028** Date/time selection — Select date and slot → Next → `GuestDetailsScreen` renders
- [ ] **TC-029** Guest details — Fill required fields → Next → `BookingReviewScreen` renders with correct summary
- [ ] **TC-030** Booking review — Inspect summary → Confirm → `BookingPaymentScreen` renders
- [ ] **TC-031** Payment step — Select mock card → Pay → `BookingConfirmationScreen` renders
- [ ] **TC-032** Confirmation screen — Booking ID, service summary, navigation CTAs all visible
- [ ] **TC-033** Booking list — Bookings tab → upcoming and past mock bookings render
- [ ] **TC-034** Booking detail — Tap a booking → `BookingDetailScreen` renders full details
- [ ] **TC-035** Cancel booking — Booking detail → Cancel → cancellation flow renders, confirmation shows policy text
- [ ] **TC-036** Reschedule — Booking detail → Reschedule → re-enters `DateTimeSelectionScreen` in reschedule mode
- [ ] **TC-037** Back nav mid-flow — During booking flow → press Back repeatedly → flow unwinds, `BookingFlowState` clears
- [ ] **TC-038** Policies screen — Booking review → Policies link → `BookingPoliciesScreen` renders
- [ ] **TC-039** Slot segment toggle — Date/time → Morning/Afternoon/Evening → slot list filters per segment

## Section 5 — Payments and Cards (TC-040 – TC-043)

- [ ] **TC-040** Payment methods list — Profile → Payment Methods → saved mock cards render with brand + last 4
- [ ] **TC-041** Add card — Add Card CTA → `AddPaymentMethodScreen` renders
- [ ] **TC-042** Remove card — Swipe/long-press mock card → Remove → confirmation dialog shown
- [ ] **TC-043** Loyalty points in payment — `BookingPaymentScreen` → apply points toggle → discount reflected in running total

## Section 6 — Loyalty and Rewards (TC-044 – TC-050)

- [ ] **TC-044** Loyalty landing — Rewards tab → points balance, current tier, earn/browse CTAs render
- [ ] **TC-045** Reward catalog — Loyalty → Browse Rewards → `RewardCatalogScreen` renders mock rewards
- [ ] **TC-046** Reward detail — Tap reward → `RewardDetailScreen` renders with points cost and description
- [ ] **TC-047** Redeem flow — Reward detail → Redeem → `RewardRedemptionConfirmScreen` renders, confirm shows success
- [ ] **TC-048** Points history — Loyalty → History → `PointsHistoryScreen` renders earn/spend rows
- [ ] **TC-049** Activities list — Loyalty → Earn → Activities → `ActivitiesScreen` renders mock challenges
- [ ] **TC-050** Activity detail — Tap an activity → `ActivityDetailScreen` renders with progress and claim CTA

## Section 7 — Messaging and Notifications (TC-051 – TC-055)

- [ ] **TC-051** Messaging inbox — Navigation → Messages → `MessagesInboxScreen` renders mock threads (unread badge visible)
- [ ] **TC-052** Message thread — Tap a thread → `MessageThreadScreen` renders mock messages chronologically
- [ ] **TC-053** Compose — Compose button in inbox → compose screen renders, send action available
- [ ] **TC-054** Notification center — Bell icon or nav → Notifications → `NotificationCenterScreen` renders mock notifications
- [ ] **TC-055** Channel preferences — Settings → Notifications → `ChannelPreferencesScreen` renders 8-event × 3-channel matrix

## Section 8 — Profile and Settings (TC-056 – TC-062)

- [ ] **TC-056** Profile screen — Profile tab → `ProfileScreen` renders mock name, avatar, stats
- [ ] **TC-057** Edit profile — Profile → Edit → `EditProfileScreen` renders editable fields, Save visible
- [ ] **TC-058** Settings shell — Profile → Settings → `SettingsShellScreen` renders all sections
- [ ] **TC-059** Notification settings — Settings → Notifications → notification pref screens reachable
- [ ] **TC-060** Payment methods — Settings → Payment → `PaymentMethodManagementScreen` reachable
- [ ] **TC-061** Legal screens — Settings → Legal → ToS, Privacy Policy, Licenses, About all reachable
- [ ] **TC-062** Sign out — Settings → Sign Out → returns to `LandingScreen`, auth state cleared

## Section 9 — Waitlist (TC-063 – TC-064)

- [ ] **TC-063** Waitlist list — Appointments or nav → Waitlist → `WaitlistScreen` renders mock entries
- [ ] **TC-064** Join waitlist — Slot unavailable → Join Waitlist CTA → `WaitlistJoinScreen` renders with slot details pre-filled

## Section 10 — Onboarding Flows (TC-065 – TC-068)

- [ ] **TC-065** Client onboarding entry — New user or forced onboarding route → `ClientOnboardingWelcomeScreen` renders (not placeholder text)
- [ ] **TC-066** Client onboarding steps — Progress through all 7 client steps → each renders real `ClientOnboarding*` component
- [ ] **TC-067** Salon onboarding entry — Owner user → `SalonOnboardingWizard` route → step 1 renders
- [ ] **TC-068** Salon onboarding steps — Progress through all 9 salon steps → each renders real `SalonOnboarding*`, progress advances

---

## Run Summary

| Result | iOS | Android |
|--------|-----|---------|
| PASS ✅ | __ / 68 | __ / 68 |
| FAIL ❌ | __ | __ |
| DEFERRED ⏭ | __ | __ |

| Severity | iOS | Android |
|----------|-----|---------|
| P0 | __ | __ |
| P1 | __ | __ |
| P2 | __ | __ |

## W35 Exit Gate

- [ ] All 68 TCs executed on both platforms
- [ ] Zero P0 findings open
- [ ] All P1 findings fixed and retested
- [ ] All P2 findings logged with ticket references
- [ ] Findings file `WEEK35_QA_MOCK_FINDINGS.md` complete and signed off
- [ ] W35 close report filed
- [ ] W36 may begin
