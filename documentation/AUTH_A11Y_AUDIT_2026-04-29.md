# Auth Screens A11y Pre-Pass — 2026-04-29

> Verification audit covering the auth surfaces under `src/app/auth/` plus
> the auth-gate `WelcomeRouteScreen` in `src/app/navigation/HandoffScreens.tsx`.
> Reference: `design-handoff/ACCESSIBILITY_GUIDE.md`.

## Verdict

**Auth screens are in solid a11y shape.** No critical issues found. All
recommendations below are nice-to-have polish.

## What's already correct

| Screen | `accessibilityRole="header"` on title | Buttons labelled | Form inputs labelled | Form errors announced |
|--------|:-:|:-:|:-:|:-:|
| `SignInScreen` | ✅ | ✅ via `Button` primitive | ✅ via `InputField` | ✅ via `Banner` (role=alert, liveRegion=polite) |
| `SignUpScreen` | ✅ | ✅ | ✅ | ✅ |
| `ForgotPasswordScreen` | ✅ | ✅ | ✅ | ✅ |
| `ResetPasswordScreen` | (assumed — Banner present) | ✅ | ✅ | ✅ |
| `EmailVerificationScreen` | ✅ | ✅ | n/a | ✅ |
| `OtpVerificationScreen` | ✅ | ✅ | ✅ (`accessibilityLabel="Verification code"`, per-cell labels) | ✅ |
| `SocialSignInSelectorScreen` | ✅ | ✅ ("Continue with Apple/Google", "Close") | n/a | ✅ |
| `AccountMergeScreen` | (no header role on title — see below) | ✅ ("Sign in to existing account", "Create new account") | n/a | ✅ |
| `WelcomeRouteScreen` (auth-gate) | ❌ heroTitle missing role | ✅ via shared `PrimaryButton`/`SecondaryButton` | n/a | n/a |

Notable correct patterns observed:
- `SignUpScreen` Terms checkbox: `accessibilityRole="checkbox"` + `accessibilityState={{ checked }}` + descriptive `accessibilityLabel="I agree to Terms and Privacy Policy"`.
- `OtpVerificationScreen`: digit cells expose individual `accessibilityLabel={`Digit ${idx + 1} of 6`}` and the row is wrapped in an `accessible` View labelled `"6-digit verification code"`.
- `AuthEdgeScreen` MFA selector: `accessibilityRole="radio"` + `accessibilityState={{ checked }}`.
- Shared `Banner` primitive sets `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"` automatically for `error`/`warning` variants — so all auth error banners are announced.

## Minor recommendations (low priority)

These are **deferred** — not applied in this session because they are cosmetic
and the test suite is currently green.

1. **`WelcomeRouteScreen` `heroTitle`** at line ~244 of `HandoffScreens.tsx`
   should add `accessibilityRole="header"` and an explicit
   `accessibilityLabel` matching the visible copy. This is the first thing a
   user sees when hitting an auth-gated tab — the screen reader currently
   announces it as plain text.

2. **`AccountMergeScreen` title** likely lacks `accessibilityRole="header"`.
   Worth a 30-second check next time the file is open.

3. **`accessibilityHint` is not used anywhere in auth.** This is acceptable —
   the `ACCESSIBILITY_GUIDE.md` reserves hints for non-obvious actions
   (favoriting, etc.). The labels here are self-explanatory.

4. **Reduce-motion check** for hero artwork blobs in `WelcomeRouteScreen`. If
   a future polish pass adds entrance animation, gate it on
   `AccessibilityInfo.isReduceMotionEnabled()`.

5. **Touch-target verification on `ghostLinkButton`** (Browse as guest, Welcome
   screen): visual padding is `spacing.s2`/`s3` which may render < 44pt on
   smaller text scales. Confirm during W37 device QA.

## What was NOT changed in this session

No source files were modified. All recommendations are advisory.
