# Phase 2.2 — Navigation Wiring and Discovery Screens (Weeks 33–34)

## Why This Plan Exists
Phase 2.1 (Weeks 21–32, Batches A–L) built 60+ consumer UI screen components as presentation-only, prop-driven files. All are covered by 160 test suites (2,656 tests) and pass `tsc --noEmit`, but **none are wired into `AppNavigatorShell.tsx`**. The running app still renders `HandoffScreens.tsx` placeholders.

This phase closes that gap. It wires every W21-W32 screen component into the live navigator, builds the 8 missing W22 discovery screen files, and replaces the onboarding placeholder with real components — making the full consumer UI visible and navigable in the running app.

Phase 2.2 inserts cleanly between Phase 2.1 and Phase 2.3. It does **not** add real Firebase/Firestore reads; screens remain prop-driven with mock/static data. Real backend connections are made in Phase 2.3 (W35–W37) — first via a full manual QA pass with mock data (W35), then domain-by-domain Firebase integration (W36–W37). See [PHASE2_3_CONSUMER_FIREBASE_INTEGRATION_WEEKS_35_TO_37.md](PHASE2_3_CONSUMER_FIREBASE_INTEGRATION_WEEKS_35_TO_37.md).

## Scope Boundary

### In scope
- **Stream A (Week 33):** Wire 41 existing W21-W32 screens into `AppNavigatorShell.renderRouteContent()` and `renderTabContent()`. Auth, booking, payments, loyalty, activities, reviews, messaging, notifications, waitlist. Onboarding real screens replace generic placeholder.
- **Stream B (Week 34):** Create 8 W22 discovery screen files (`DiscoverHomeScreen`, `DiscoverFeedScreen`, `ExploreResultsScreen`, `ExploreMapScreen`, `DiscoverFiltersScreen`, `SalonProfileScreen`, `ServiceDetailScreen`, `StaffDetailScreen`). Wire all 8 into the navigator.
- **Stream C (Week 34):** Replace `parseOnboardingRoute()` generic text with `SalonOnboardingWizard` (for all 9 salon steps) and the 5 `ClientOnboarding*` screens (for all 7 client steps).

### Out of scope
- Real Firebase/Firestore service calls — screens use static mock props. Firebase integration is Phase 2.3 (W35–W37).
- Phase 3 admin screens — those start at Week 38.
- Backend booking persistence — `BookingConfirmationScreen` renders confirmation UI only; no mutation is fired.
- Stripe payments integration — `BookingPaymentScreen` is a card-picker UI; no Stripe SDK calls.
- Push notification delivery — `NotificationCenterScreen` renders mock notifications.

## Assumptions
- All W21-W32 screen component files are type-correct and test-green at W32 exit.
- `AppNavigatorShell.tsx` state may be extended to hold booking flow state and mock data objects.
- Mock data is defined inline or in a `src/app/navigation/mockData.ts` file; it is not production data.
- The `HandoffScreens.tsx` file is retained but its components are no longer rendered for routes that have a real component.
- The `parseOnboardingRoute()` helper is retained to identify the active step; the wiring reads its return value to select the correct real screen.

## Entry Conditions (must be true before Week 33 starts)
1. W32 close report signed off; Phase 2.1 complete; 2,656 tests / 160 suites all green.
2. `AppNavigatorShell.tsx`, `routes.ts`, and `HandoffScreens.tsx` read and understood.
3. All W21-W32 screen file paths and required prop signatures indexed (see inventory below).
4. Booking flow architecture decision made (see Decision Gates).

## Exit Conditions (Definition of Done for Phase 2.2)
1. All 49 static routes have a matching `if (activeRoute.name === "...")` branch in `renderRouteContent()`.
2. `renderTabContent()` Rewards tab renders `LoyaltyLandingScreen` instead of the `<ScrollView>` placeholder.
3. No `HandoffScreen` component is rendered for any route where a Phase 2.1 screen exists.
4. `parseOnboardingRoute()` genuine steps render real `SalonOnboarding*` / `ClientOnboarding*` components — not generic placeholder text.
5. W22 discovery: 8 new screen files exist under `src/app/discovery/` with test suites.
6. Full jest suite ≥ 2,800 tests. `tsc --noEmit` reports zero errors.
7. W33 and W34 close reports filed under `documentation/new-platform/`.
8. Tracking board updated; B-020 (Phase 2.2) marked done.

---

## Navigation Architecture

### `renderRouteContent()` extended pattern
Every new branch follows this shape:
```tsx
if (activeRoute.name === "RouteNameHere") {
  return (
    <ScreenComponent
      requiredProp={mockValue}
      onAction={() => navigate("NextRoute")}
    />
  );
}
```

Branches are inserted **before** the fallback `return <HomeRouteScreen ... />`. The existing wired routes (Landing, Login, Register, CompleteProfile, DiscoverBusinesses, admin routes, SalonDashboard, OwnerAiBudgetSettings) are left unchanged.

### Booking flow state machine
The booking flow spans 11 sequential routes. A single `BookingFlowState` object lives in `AppNavigatorShell` state, initialised when `BookingService` is entered and cleared on confirmation or back-to-home.

```ts
interface BookingFlowState {
  selectedServiceIds: string[];
  selectedStaffId: string | null;
  selectedDate: Date | null;
  selectedSlot: string | null;          // ISO time string
  selectedSegment: "morning" | "afternoon" | "evening";
  guestContact: { name: string; phone: string; email: string } | null;
  pricingBreakdown: PricingBreakdown | null;
  policiesAcknowledged: boolean;
  selectedCardId: string | null;
  notes: string;
  confirmedBookingId: string | null;
}
```

Each screen in the flow reads from and writes back to this state via the navigator's handlers. Static mock data (salon info, staff list, service groups, time slots, saved cards) is defined in `src/app/navigation/mockData.ts`.

### `renderTabContent()` Rewards tab
Currently a `<ScrollView>` placeholder. After W33 this renders:
```tsx
<LoyaltyLandingScreen
  points={mockLoyaltyPoints}
  historyEntries={mockLoyaltyHistory}
  onPressBrowseRewards={() => navigate("RewardCatalog")}
  onPressEarnAction={() => navigate("Activities")}
/>
```

---

## Week 33 — Stream A: Wire Existing Screens

### Auth routes (8 screens)

| Route | Component file | Notes |
|---|---|---|
| `SignIn` | `src/app/auth/SignInScreen.tsx` — `SignInScreen` | All props optional; wire `onSignIn → navigate("AppShell")` |
| `SignUp` | `src/app/auth/SignUpScreen.tsx` — `SignUpScreen` | All props optional; wire `onSignUp → navigate("AppShell")` |
| `SocialSignIn` | `src/app/auth/SocialSignInSelectorScreen.tsx` — `SocialSignInSelectorScreen` | `onProvider` required; mock social auth handler |
| `ForgotPassword` | `src/app/auth/ForgotPasswordScreen.tsx` — `ForgotPasswordScreen` | Optional props; `onSubmit → navigate("Login")` |
| `ResetPassword` | `src/app/auth/ResetPasswordScreen.tsx` — `ResetPasswordScreen` | `onSubmit` required |
| `EmailVerification` | `src/app/auth/EmailVerificationScreen.tsx` — `EmailVerificationScreen` | `email`, `onResend` required; mock email |
| `OtpVerification` | `src/app/auth/OtpVerificationScreen.tsx` — `OtpVerificationScreen` | `destination`, `onVerify`, `onResend` required |
| `AccountMerge` | `src/app/auth/AccountMergeScreen.tsx` — `AccountMergeScreen` | `bookingCount`, `onChoose` required |

Landing `Login` and `Register` branches already exist using `AuthRouteScreen`. These remain unchanged.

### Booking flow routes (11 screens)

| Route | Component | Required → mock |
|---|---|---|
| `BookingService` | `ServiceSelectionScreen` | `groups` from `mockServiceGroups`; booking state |
| `BookingStaff` | `StaffSelectionScreen` | `staffOptions` from `mockStaff`; booking state |
| `BookingDate` | `BookingDatePickerScreen` | `month`, `selectedDate`, handlers |
| `BookingTime` | `BookingTimePickerScreen` | `date`, `availableSlots` from mock, booking state |
| `BookingReview` | `BookingReviewScreen` | all booking state props |
| `BookingPolicies` | `BookingPoliciesScreen` | `visible=true`, `sections` from mock |
| `BookingPayment` | `BookingPaymentScreen` | `pricing`, `savedCards` from mock |
| `BookingConfirmation` | `BookingConfirmationScreen` | booking state; `onPressDone → navigate("AppShell")` |
| `ManageBooking` | `ManageBookingScreen` | mock booking details |
| `GuestContact` | `GuestContactScreen` | booking state |
| `PostBookingUpgrade` | `PostBookingUpgradeScreen` | `visible=true`, `onPressCreateAccount → navigate("Register")` |

### Payment routes (6 screens)

| Route | Component | Notes |
|---|---|---|
| `SavedPaymentMethods` | `SavedPaymentMethodsScreen` | `methods` from mock |
| `AddPaymentMethod` | `AddPaymentMethodScreen` | `state`, `onChange`, `onSubmit` |
| `Tipping` | `TippingScreen` | `subtotal` from booking state or mock |
| `Receipt` | `ReceiptScreen` | mock receipt data |
| `BookingHistory` | `BookingHistoryScreen` | `records` from mock |
| `RefundStatus` | `RefundStatusScreen` | mock refund |

### Loyalty, activities, reviews routes (9 screens)

| Route | Component | Notes |
|---|---|---|
| `LoyaltyLanding` | `LoyaltyLandingScreen` | + wire Rewards tab in `renderTabContent()` |
| `RewardCatalog` | `RewardCatalogScreen` | mock catalog |
| `RewardRedemption` | `RewardRedemptionScreen` | mock reward |
| `Activities` | `ActivitiesScreen` | mock activities list |
| `ActivityDetail` | `ActivityDetailScreen` | mock `activity` |
| `ClaimActivityReward` | `ClaimActivityRewardScreen` | `visible=true`, mock |
| `ReviewPrompt` | `ReviewPromptScreen` | mock salon, draft |
| `ReviewDetail` | `ReviewDetailScreen` | mock review |
| `Referral` | `ReferralScreen` | mock code, stats |

### Messaging, notifications, waitlist routes (7 screens)

| Route | Component | Notes |
|---|---|---|
| `Inbox` | `InboxScreen` | mock threads |
| `Thread` | `ThreadScreen` | mock thread + messages |
| `Compose` | `ComposeScreen` | mock recipients |
| `NotificationCenter` | `NotificationCenterScreen` | mock notifications |
| `NotificationPreferences` | `NotificationPreferencesScreen` | mock preferences |
| `WaitlistJoin` | `WaitlistJoinSheet` | `visible=true`, mock service |
| `WaitlistPosition` | `WaitlistPositionScreen` | mock position |

### Onboarding — real screens (Stream A part)
The current `parseOnboardingRoute()` block renders generic placeholder text for all 16 onboarding routes. In W33, implement the first pass:

**Client onboarding (5 real screens):** `ClientOnboardingProfileScreen`, `ClientOnboardingPreferencesScreen`, `ClientOnboardingPaymentScreen`, `ClientOnboardingLocationScreen`, `ClientOnboardingNotificationsScreen`. Each receives `totalSteps`, `currentStep` from `parseOnboardingRoute()` result, plus an `onContinue / onSkip` handler that advances the route.

**Salon onboarding** is deferred to W34 Stream C because it requires `SalonOnboardingWizard` with `wizardState`, which is more architecturally complex.

### W33 tests
- `__tests__/w33NavigatorAuthWiring.test.tsx` — smoke-renders each auth route branch; verifies screen component renders without error.
- `__tests__/w33NavigatorBookingWiring.test.tsx` — smoke-renders each booking flow route; verifies state is passed correctly.
- `__tests__/w33NavigatorPaymentsLoyaltyWiring.test.tsx` — smoke-renders payments + loyalty + messaging + waitlist routes.
- `__tests__/w33ClientOnboardingWiring.test.tsx` — verifies `parseOnboardingRoute()` branches render real components not placeholder text.

### W33 acceptance gate
- All 41 routes (8 auth + 11 booking + 6 payments + 9 loyalty/activities/reviews + 7 messaging/notifications/waitlist) have real component branches in `renderRouteContent()`.
- Rewards tab renders `LoyaltyLandingScreen`.
- Client onboarding 5 routes render real screens.
- `npx tsc --noEmit` clean.
- Jest suite all green; count increase from 2,656 baseline.
- W33 close report filed.

---

## Week 34 — Stream B: W22 Discovery Screens + Stream C: Salon Onboarding

### Stream B — W22 Discovery screen files (8 new components)

The W22 batch routes (`DiscoverHome`, `DiscoverFeed`, `ExploreResults`, `ExploreMap`, `DiscoverFilters`, `SalonProfile`, `ServiceDetail`, `StaffDetail`) exist in `routes.ts` but have no screen component files. This week creates them under `src/app/discovery/`.

Each screen follows the same prop-driven, presentation-only pattern as all Phase 2.1 screens:

| File | Component | Core required props |
|---|---|---|
| `DiscoverHomeScreen.tsx` | `DiscoverHomeScreen` | `featuredSalons`, `categories`, `onSelectSalon`, `onSelectCategory` |
| `DiscoverFeedScreen.tsx` | `DiscoverFeedScreen` | `posts`, `activeFilter`, `onFilterChange`, `onSelectPost`, `onSelectSalon` |
| `ExploreResultsScreen.tsx` | `ExploreResultsScreen` | `query`, `results`, `filters`, `onSelectSalon`, `onChangeFilters` |
| `ExploreMapScreen.tsx` | `ExploreMapScreen` | `results`, `selectedSalonId`, `onSelectSalon`, `onPressBack` — map is a stub `<View>` (react-native-maps wiring deferred, W22-DEBT-1) |
| `DiscoverFiltersScreen.tsx` | `DiscoverFiltersScreen` | `filters`, `onChange`, `onApply`, `onReset` |
| `SalonProfileScreen.tsx` | `SalonProfileScreen` | `salon`, `services`, `staff`, `reviews`, `onBook`, `onBack` |
| `ServiceDetailScreen.tsx` | `ServiceDetailScreen` | `service`, `salon`, `onBook`, `onBack` |
| `StaffDetailScreen.tsx` | `StaffDetailScreen` | `staff`, `services`, `onBook`, `onBack` |

All 8 screen files:
- Use existing design tokens from `src/shared/ui/` and `design-handoff/tokens/`.
- Include `testID` props on primary containers (format: `discover-home`, `discover-feed`, etc.).
- Export both component and its prop type.
- Are wired into `renderRouteContent()` branches once created.

The existing `DiscoverBusinesses` route (which renders `ExploreRouteScreen`) is left unchanged — it predates the W22 batch and serves a different, simpler discovery entry point.

### Stream C — Salon onboarding real screens

`SalonOnboardingWizard` is a single component that drives all 9 salon onboarding steps (`SalonOnboardingAccount` through `SalonOnboardingVerification`) internally via its own step navigation. `AppNavigatorShell` mounts it once for any active salon onboarding route and passes:

```tsx
<SalonOnboardingWizard
  tenantId={mockTenantId}
  wizardState={mockSalonWizardState}
  isLoading={false}
  onCompleteStep={(step) => updateMockWizardState(step)}
  onSkipStep={(step) => updateMockWizardState(step)}
  onGoLive={() => navigate("SalonDashboard")}
/>
```

`parseOnboardingRoute()` continues to identify that we're in a salon onboarding flow. The navigator branch switches on the salon-onboarding group and renders `SalonOnboardingWizard` in place of the generic placeholder.

### W34 tests
- `__tests__/w34DiscoveryScreens.test.tsx` — tests for all 8 new discovery screen components (≥ 80 tests: render, props, interaction handlers, accessibility).
- `__tests__/w34SalonOnboardingWiring.test.tsx` — verifies `SalonOnboardingWizard` renders within the navigator shell for salon onboarding routes; verifies `onGoLive` navigates to `SalonDashboard`.
- `__tests__/w34DiscoveryNavigatorWiring.test.tsx` — smoke-renders each of the 8 discovery route branches.

### W34 acceptance gate
- 8 new discovery screen files exist in `src/app/discovery/` with full test coverage.
- All 8 discovery routes have real component branches.
- `SalonOnboardingWizard` renders for all 9 salon onboarding routes; no generic placeholder text.
- All 49 static routes and 16 dynamic onboarding routes fully wired.
- `npx tsc --noEmit` clean.
- Jest suite all green; count ≥ 2,800.
- Phase 2.2 close report and tracking board B-020 updated.

---

## Decision Gates

| Gate | Decide by | Default if undecided |
|---|---|---|
| Booking flow state location: AppNavigatorShell vs dedicated BookingContext | Start of Week 33 | AppNavigatorShell state (consistent with existing pattern for discovery feed, dashboard, etc.) |
| Mock data location: inline in navigator vs `mockData.ts` | Start of Week 33 | `src/app/navigation/mockData.ts` to keep navigator readable |
| ExploreMap: react-native-maps stub or skip the route branch? | Start of Week 34 | Stub `<View>` with `testID="explore-map-stub"` and a back button; real map deferred (W22-DEBT-1) |
| SalonOnboardingWizard: one branch or one per step? | Start of Week 34 | One branch for the entire wizard; the wizard manages its own step routing internally |
| HandoffScreens.tsx: delete after wiring or keep? | End of Week 34 | Keep file; remove individual exports once each real component is wired |

---

## Mock Data Strategy

`src/app/navigation/mockData.ts` exports stable mock objects reused across all navigator branches:

```ts
// mockData.ts structure
export const mockServiceGroups: ServiceGroup[] = [...];
export const mockStaff: StaffOption[] = [...];
export const mockTimeSlots: string[] = [...];
export const mockSavedCards: SavedCard[] = [...];
export const mockLoyaltyPoints: number = 420;
export const mockLoyaltyHistory: LoyaltyHistoryEntry[] = [...];
export const mockNotifications: AppNotification[] = [...];
export const mockThreads: MessageThread[] = [...];
export const mockActivities: Activity[] = [...];
export const mockSalonWizardState: SalonWizardState = { completedSteps: [], currentStep: "account" };
// ...
```

These values are typed against the screen component prop types so TypeScript enforces correctness. They are clearly marked with a `/* MOCK — replace with real service call in Phase 3 */` comment on each usage site in the navigator.

---

## Parallel Streams (run alongside Weeks 33–34)
- **Design supply**: Batch M (Phase 3 admin) is in-flight per Wave 2 timing; W34 is the last window before Phase 3 entry.
- **Phase 3 prep**: Figma batch M review + admin design system tokens (data tables, bulk action bar) should be accepted by end of W34.

---

## Acceptance Gate Per Week
1. Week-N close report under `documentation/new-platform/PHASE2_2_WEEKN_CLOSE_REPORT.md`.
2. Test deltas: total test count, new suites added, navigator smoke test suite green.
3. `tsc --noEmit` clean after every commit.
4. Every new navigator branch has at least one smoke test that renders the component without throwing.
5. Tracking board B-020 updated; week cards moved to Done.

---

## Risk Register

| Risk | Severity | Probability | Mitigation |
|---|---|---|---|
| Booking flow state threading causes prop-drilling complexity | Medium | High | Keep `BookingFlowState` flat and shallow; use a `useBookingFlow()` getter/setter hook within AppNavigatorShell to reduce boilerplate |
| Type errors from screen prop changes between W23 and now | Medium | Low | Run `tsc --noEmit` after each batch of imports; fix errors before proceeding to next batch |
| W34 discovery screens introduce new design tokens | Low | Low | Screens must reuse existing tokens only; flag any new token as a design debt item |
| ExploreMapScreen map library conflicts with Expo SDK 54 | Medium | Medium | Ship as a `<View>` stub immediately; W22-DEBT-1 tracks real wiring |
| SalonOnboardingWizard internal navigation clashes with AppNavigatorShell | Medium | Low | SalonOnboardingWizard manages its own step state; AppNavigatorShell only needs to mount/unmount it based on route group |

---

## Trello Code Convention
Phase 2.2 cards follow the existing prefix scheme:
- `[W33-NAV-001]` Wire auth routes (8)
- `[W33-NAV-002]` Booking flow state machine + wire 11 routes
- `[W33-NAV-003]` Wire payments routes (6)
- `[W33-NAV-004]` Wire loyalty/activities/reviews routes (9)
- `[W33-NAV-005]` Wire messaging/notifications/waitlist routes (7)
- `[W33-NAV-006]` Wire Rewards tab; client onboarding real screens
- `[W34-NAV-007]` W22 discovery screen files (8 components)
- `[W34-NAV-008]` Wire 8 discovery routes
- `[W34-NAV-009]` SalonOnboardingWizard wiring (Stream C)

New category code: `NAV` — Navigation wiring and integration.

---

## Cross-References
- Master index: [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md)
- Gantt: [PROJECT_GANTT_AGILE_PLAN.md](PROJECT_GANTT_AGILE_PLAN.md)
- Tracking board: [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md)
- Phase 2 plan (prerequisite): [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md](PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md)
- Phase 3 plan (follows this phase): [PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md](PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md)
- Navigator under wiring: [src/app/navigation/AppNavigatorShell.tsx](src/app/navigation/AppNavigatorShell.tsx)
- Route definitions: [src/app/navigation/routes.ts](src/app/navigation/routes.ts)
- Handoff placeholders: [src/app/navigation/HandoffScreens.tsx](src/app/navigation/HandoffScreens.tsx)


