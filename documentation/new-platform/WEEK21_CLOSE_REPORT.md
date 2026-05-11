# Week 21 Close Report — Batch A: Auth & Onboarding (Consumer UI)

**Phase:** Phase 2 — Consumer UI (Weeks 21-28).
**Status:** Complete — all 9 screen groups (A.1-A.9) and all 6 new components delivered + tested. GO for Week 22.
**Build spec:** [BATCH_A_AUTH_ONBOARDING.md](../figma-prompts/BATCH_A_AUTH_ONBOARDING.md) — `code-only` per [FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md](../FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md), no Figma dependency.

---

## 1. Scope

Week 21 opens Phase 2 by delivering the consumer-facing Auth + Onboarding surface end-to-end, wired to the existing `AuthProvider` context and the `clientOnboardingOrchestrator` (made persistable in W20.5 via `W16-DEBT-1`). Foundation primitives ship first (`tokens` + 6 components), then 9 screen groups compose them.

| Group | Title | Status |
|-------|-------|--------|
| A.1 | Sign In (email + phone segments, password) | shipped |
| A.2 | Sign Up (email + phone segments, terms, marketing-off) | shipped |
| A.3 | Social Sign-In Selector (Apple / Google / Facebook) | shipped |
| A.4 | Forgot Password + Reset Password | shipped |
| A.5 | Email Verification (resend + change email) | shipped |
| A.6 | OTP Verification (6-cell, paste + auto-advance) | shipped |
| A.7 | Onboarding Steps × 5 (profile, preferences, notifications, location, payment) | shipped |
| A.8 | Account Merge / Upgrade (guest → full) | shipped |
| A.9 | Error & Empty Variants | covered via `Banner` states across A.1-A.8 |

---

## 2. Deliverables

### 2.1 Foundation — `src/shared/ui/`

- `tokens.ts` — typed re-exports from `design-handoff/tokens/{colors,spacing,typography}.json`. Brand: Coral Blossom `#E3A9A0`, Cream Silk `#F2EDDD`, Mint Fresh `#BBEDDA`. Spacing: 4pt grid. Radii: small=8 / medium=12 / large=16 / 2xl=24 / full=9999. Type scale: heading-1..4, body-large, body, body-small, label-large, label, label-small, overline.
- `Button.tsx` — variants `primary | secondary | tertiary | destructive | icon-only`; sizes `large | medium | small`; busy/disabled state, accessibilityRole=button, focus ring 2px.
- `InputField.tsx` — variants `text | email | phone | password | otp-cell`; states default / filled / focused / disabled / error / loading; eye-toggle for password; phone formatter `(XXX) XXX-XXXX`; OTP-cell auto-advances + supports paste.
- `FormRow.tsx`, `SegmentedControl.tsx`, `Stepper.tsx`, `Banner.tsx` — match A.C3-A.C6 spec.
- `formatters.ts` — pure `formatUsPhone`, `validateEmail`, `validateUsPhone`, `validateZip`, `validatePassword` helpers (US-primary defaults).

### 2.2 Auth screens — `src/app/auth/`

- `SignInScreen.tsx` (A.1), `SignUpScreen.tsx` (A.2), `SocialSignInSelectorScreen.tsx` (A.3), `ForgotPasswordScreen.tsx` + `ResetPasswordScreen.tsx` (A.4), `EmailVerificationScreen.tsx` (A.5), `OtpVerificationScreen.tsx` (A.6), `AccountMergeScreen.tsx` (A.8).
- Each screen consumes `useAuth()` from `src/app/providers/AuthProvider`; failures surface via the shared `Banner` component using `toUserFacingAuthError` formatting at the call sites.
- Marketing toggles default OFF (TCPA / CAN-SPAM safe defaults). Terms checkbox is a 44×44 hit target.

### 2.3 Onboarding screens — `src/app/onboarding/`

- `ClientOnboardingProfileScreen.tsx` (A.7.1) — display name + pronouns chip row.
- `ClientOnboardingPreferencesScreen.tsx` (A.7.2) — service-category multi-select grid; min-1 validation.
- `ClientOnboardingNotificationsScreen.tsx` (A.7.3) — booking reminders, SMS promo, email promo, new salons; all toggles default OFF; explicit STOP-to-unsubscribe disclosure.
- `ClientOnboardingLocationScreen.tsx` (A.7.4) — map placeholder; "Use my location" + ZIP fallback (5-digit).
- `ClientOnboardingPaymentScreen.tsx` (A.7.5) — card stub with "Skip for now" tertiary action; payment is optional in the wizard.
- All five compose the existing `clientOnboardingOrchestrator` (persistable in W20.5) via injected `onContinue` / `onSkip` callbacks; persistence stays opt-in.

### 2.4 Routes — `src/app/navigation/routes.ts`

Eight new public route entries added (all `guard: "none"`): `SignIn`, `SignUp`, `SocialSignIn`, `ForgotPassword`, `ResetPassword`, `EmailVerification`, `OtpVerification`, `AccountMerge`. The existing client-onboarding step routes auto-generate from `clientOnboardingSteps` and continue to enforce `guard: "authenticated"`.

---

## 3. Tests

- Root jest: 1,741 → **1,808** passing across 106 → **117** suites (+67 tests, +11 suites).
- Functions vitest: **187** passing across 14 suites (unchanged — Batch A is consumer-UI only).
- `npx tsc --noEmit` (root): 0 errors. `cd functions; npx tsc --noEmit`: 0 errors.

New suites:
- `src/shared/ui/__tests__/{Button,InputField,primitives,formatters}.test.tsx` (4 suites).
- `src/app/auth/__tests__/{SignInScreen,SignUpScreen,SocialSignInSelectorScreen,PasswordReset,Verification,AccountMergeScreen}.test.tsx` (6 suites).
- `src/app/onboarding/__tests__/ClientOnboardingScreens.steps.test.tsx` (1 suite, 5 describe blocks).

---

## 4. Security & Compliance

- All A.1-A.8 forms validate at the boundary before invoking `authRepository`; firebase-error codes are translated via `toUserFacingAuthError` before reaching the user-visible `Banner`.
- Marketing / promotion toggles are **OFF by default** (TCPA / CAN-SPAM safe defaults).
- OTP cells expose per-cell `accessibilityLabel` (`"Digit N of 6"`); error banners on A.5 / A.6 have `accessibilityRole="alert"`.
- Touch targets ≥ 44×44 (WCAG 2.1 AA). Eye-icon toggle on password field has explicit accessibilityLabel.
- US-primary defaults: `(XXX) XXX-XXXX` phone format; 5-digit ZIP; no IBAN / VAT surfaces in consumer flow.
- Apple Sign-In is the first social provider on iOS per HIG.

---

## 5. Architectural Notes

- AuthProvider surface from W4-W6 was reused unchanged. Screens are pure React components with no direct firebase imports — all auth I/O routes through the `AuthRepository` port and is mockable in tests.
- `clientOnboardingOrchestrator` continues to expose its sync mutation API; the W21 step screens never await persistence directly. The fire-and-forget `_persist` path keeps the wizard responsive even when offline.
- `tokens.ts` is the single source of truth for design-system constants used by consumer-UI; it re-exports from the JSON spec rather than redefining values, so future token bumps land in one place.
- All primitives are props-driven and have **zero** auth/onboarding business knowledge. They can be lifted as-is for Batch B onward.

---

## 6. Debt Register

- **No new debts opened.** All A.7 screens are wired to the persistable orchestrator (W16-DEBT-1 closed in W20.5), so onboarding state survives device-kill.
- Pre-existing forward debts (W11-DEBT-1, W13-DEBT-2/3, W14-DEBT-3/4, W15-DEBT-1/3, W17-DEBT-1, W18-DEBT-2, W19-DEBT-4/5, W20-DEBT-2/3/4, KI-003/004) carry forward unchanged.

---

## 7. Index — Changed Files

### New (production)
- `src/shared/ui/tokens.ts`, `src/shared/ui/Button.tsx`, `src/shared/ui/InputField.tsx`, `src/shared/ui/FormRow.tsx`, `src/shared/ui/SegmentedControl.tsx`, `src/shared/ui/Stepper.tsx`, `src/shared/ui/Banner.tsx`, `src/shared/ui/formatters.ts`, `src/shared/ui/index.ts`.
- `src/app/auth/SignInScreen.tsx`, `SignUpScreen.tsx`, `SocialSignInSelectorScreen.tsx`, `ForgotPasswordScreen.tsx`, `ResetPasswordScreen.tsx`, `EmailVerificationScreen.tsx`, `OtpVerificationScreen.tsx`, `AccountMergeScreen.tsx`, `index.ts`.
- `src/app/onboarding/ClientOnboardingProfileScreen.tsx`, `ClientOnboardingPreferencesScreen.tsx`, `ClientOnboardingNotificationsScreen.tsx`, `ClientOnboardingLocationScreen.tsx`, `ClientOnboardingPaymentScreen.tsx`.

### New (tests)
- `src/shared/ui/__tests__/Button.test.tsx`, `InputField.test.tsx`, `primitives.test.tsx`, `formatters.test.ts`.
- `src/app/auth/__tests__/SignInScreen.test.tsx`, `SignUpScreen.test.tsx`, `SocialSignInSelectorScreen.test.tsx`, `PasswordReset.test.tsx`, `Verification.test.tsx`, `AccountMergeScreen.test.tsx`.
- `src/app/onboarding/__tests__/ClientOnboardingScreens.steps.test.tsx`.

### Modified
- `src/app/navigation/routes.ts` (+8 public auth routes).
- `src/app/navigation/__tests__/routes.test.ts` (anonymous-route snapshot updated to include new public auth surfaces).
- `WEEKLY_LOG.md`, `PROGRAM_TRACKING_BOARD.md`.

---

## 8. Next-Week Prerequisites (Week 22)

W22 (Batch B — Discovery & Browse) inherits the locked design-system primitives (`Button`, `InputField`, `FormRow`, `SegmentedControl`, `Stepper`, `Banner`, `tokens`). Discovery already has an existing scaffold (`DISCOVERY_SCAFFOLD.md`) so the W22 work focuses on home / search / filters / category / tenant-profile screens composed from the same primitives plus the existing `service-card`, `chip`, `category-pill`, `filter-button`, `search-bar` JSON specs.
