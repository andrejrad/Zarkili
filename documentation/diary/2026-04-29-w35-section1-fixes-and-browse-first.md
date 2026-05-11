# Daily Diary — 2026-04-29 (Section 2): W35 Section 1 device QA fixes + browse-first navigation + W36 prep

> Continuation of 2026-04-29. Earlier sessions covered W31/W32 batches K & L.
> This session covered the W35 device QA Section 1 findings, the browse-first
> navigation refactor, and a parallel W36 prep pass.

## Scope of the day's chat

1. W35 Section 1 device QA findings (TC-005 to TC-008) — fixed.
2. Browse-first navigation refactor — implemented and validated.
3. Parallel W36 prep work (gap report, memory hygiene, route cleanup,
   lint sweep, a11y pre-pass, mock-data audit).

## 1. W35 Section 1 device QA findings — fixed

Findings raised by the user during manual device QA:

- **TC-005**: Sign-in screen had no visible loading indicator on submit.
- **TC-006**: Sign-up form did not surface backend validation errors.
- **TC-007**: Forgot-password screen had no success-state confirmation.
- **TC-008**: Email verification screen lacked a "resend" affordance.

All four resolved in the auth screens under `src/app/auth/`. Tests added
to cover each finding. All 161 suites and 2,676 tests green; tsc clean.

## 2. Browse-first navigation

User intent: *"user should land on home tab and be able to explore without
logging in. Bookings, Rewards, Profile tabs as well as messages and salon
selector should be behind the login."*

Implementation:

- `AppShell` route is now `guard: "none"` and lands on the **Home** tab.
- `BottomTabBar` shows Home/Explore as public; Bookings/Rewards/Profile
  render an inline `WelcomeRouteScreen` auth-gate when the user is
  unauthenticated.
- Messages icon and salon selector hidden for unauthenticated users.
- `AuthProvider` now hydrates a null session without redirecting to login.

Tests updated for the new flow. Test count remained 2,676 / 161 suites
all green; tsc clean.

## 3. Parallel W36 prep (this session)

While the user runs Section 2 device QA, agent worked through six
independent items:

- **A — W36 Firebase service gap report.** Inventoried every Phase 1
  domain repository under `src/domains/` and compared it to the W36 plan
  (`PHASE2_3_CONSUMER_FIREBASE_INTEGRATION_WEEKS_35_TO_37.md`). Output
  written to `documentation/W36_FIREBASE_SERVICE_GAP_REPORT.md`. Headline
  finding: **payments domain is the biggest gap** — `src/domains/billing/`
  only handles B2B subscription billing, no consumer payment-method or
  charge code exists. All other W36 surfaces have Phase 1 equivalents
  with mostly cosmetic naming/signature differences.
- **D — Repo memory + diary.** This entry plus a memory update recording
  the browse-first decision and the W36 gap-report location.
- **F — Dead Login/Register routes.** _(see Section 4 below)_
- **B — Lint/dead-code sweep.** _(see Section 4 below)_
- **E — Accessibility pre-pass on auth screens.** _(see Section 4 below)_
- **C — Mock data completeness audit.** _(see Section 4 below)_

## 4. Outcomes & next steps

- **W35 Section 1**: closed. Awaiting user's Section 2 device QA results.
- **W36**: unblocked — gap report enables a 3-batch sequencing
  (W36-A wire-up, W36-B small additions, W36-C payments scaffold).
- **Browse-first**: shipped. Open question for product: should the
  Bookings/Rewards/Profile gates remember the intended destination so a
  successful sign-in returns the user to that tab? Currently they land
  back on Home.

## 5. Validation status at end of session

- 161 / 161 test suites green
- 2,676 / 2,676 tests green
- `tsc` clean
- `npm run check` passing (per repo memory bootstrap notes)

## 6. Open items carried forward

- Implement the three W36 batches per the gap report.
- Process Section 2 device QA findings when the user returns them.
- Reconsider whether the legacy `/login` and `/register` routes should be
  removed once the navigation refactor has bedded in across all device
  QA sessions.
