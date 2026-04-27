# Batch A — Auth & Onboarding

> Consumed by **Week 21**. Critical path. Without this, Phase 2 cannot start.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Screens covered: Sign in · Sign up (email + phone) · Social sign-in selector · Forgot password · Reset password · Email verification · Phone verification (OTP) · Onboarding steps (profile, preferences, notifications, location, payment-optional) · Account merge/upgrade · Error & empty variants.

New components introduced in this batch: `input-field` (text/email/phone/password/OTP), `button` (primary/secondary/tertiary), `form-row`, `segmented-control`, `stepper`, `banner`.

---

## SCREEN — A.1 Sign In

```text
SCREEN: Sign In            DEVICE: iPhone 14 390×844
PERSONA: Returning consumer; en-US.
USER JOB: Authenticate with email or phone in under 15 seconds.

LAYOUT
- Header: 56pt; back chevron left, "Sign in" heading-3, no right action.
- Body (24 page V padding):
  - Brand mark (32pt) at top, 24 gap.
  - Segmented-control: [Email] [Phone], full-width, height 44, radius medium.
  - input-field (email or phone) — auto-switch by segment.
  - input-field (password) with show/hide eye icon (44×44).
  - "Forgot password?" tertiary text-button, right-aligned, label 14/20.
- Footer (sticky 16 above safe area): primary button "Sign in" full-width, height 48, radius medium.
  Below: text "New here? Create account" with tertiary button.

REUSE: Welcome screen header pattern. Components new: input-field, button, segmented-control.

TOKENS
- Background cream-silk; surface white card around inputs (radius large 16, padding 16).
- Primary CTA coral-blossom; pressed #CF8B80.
- Error state: 1.5px error border #F44336, error text label-small.

CONTENT (en-US)
- Email placeholder: "you@example.com"
- Phone placeholder: "(555) 555-1234"
- Password placeholder: "Your password"

STATES
1. Default (empty)
2. Filled valid
3. Loading (button shows spinner, inputs disabled)
4. Error (wrong password) — banner above CTA: "Incorrect email or password"
5. Locked (after 5 attempts) — banner warning, CTA disabled, link to recovery

INTERACTIONS
- Submit on Enter / Done.
- Failed attempt → shake input 100ms (skip if reduce-motion).

ACCESSIBILITY
- accessibilityLabel on eye icon: "Show password" / "Hide password"
- Inputs use accessibilityHint for format expectation.
```

---

## SCREEN — A.2 Sign Up (Email + Phone)

```text
SCREEN: Sign Up            DEVICE: iPhone 14 390×844
PERSONA: New consumer; US-based.
USER JOB: Create account in ≤ 60 seconds; collect minimum legal info.

LAYOUT
- Header: back, title "Create account", stepper 1/4.
- Body:
  - Segmented-control: [Email] [Phone].
  - First name, Last name (form-row, two columns).
  - Email OR phone (per segment).
  - Password (with strength meter — chip pill row: weak/fair/strong).
  - Checkbox: "I agree to Terms and Privacy Policy" with inline links (US: cite ADA/WCAG-compliant Terms).
  - Optional: "Send me marketing emails" (off by default — TCPA/CAN-SPAM safe default).
- Sticky footer: primary CTA "Continue" disabled until validators pass.

CONTENT
- Phone format placeholder: "(555) 555-1234"
- Password rule helper: "8+ chars, 1 number, 1 symbol"

STATES: default, validation-error per field, submitting, server-error banner, success → push to A.5/A.6.

ACCESSIBILITY
- Strength meter has accessibilityValue ("weak", "fair", "strong").
- Checkbox is 44×44 hit target with label tappable.
```

---

## SCREEN — A.3 Social Sign-In Selector

```text
SCREEN: Social Sign-In     DEVICE: iPhone 14 390×844
PERSONA: User who prefers SSO.
USER JOB: Pick a provider and authenticate.

LAYOUT
- Header: close (X), title "Continue with"
- Vertical stack of provider buttons (each 48 tall, radius medium 12, 16 gap):
  Apple (white text on black), Google (white bg, color logo, 1px border), Facebook.
- Divider with "or" label.
- Tertiary "Use email or phone instead" → goes to A.1.

STATES: default, loading per provider, error banner if cancelled or denied.

ACCESSIBILITY
- Each button: accessibilityLabel "Continue with <provider>". Apple button MUST follow Apple HIG (priority on iOS).
```

---

## SCREEN — A.4 Forgot Password + Reset

```text
SCREEN: Forgot Password (request)  DEVICE: iPhone 14 390×844
LAYOUT
- Header back + title.
- Body: heading-2 "Reset your password", body text instruction, single email input, primary CTA "Send reset link".
STATES: default, sending, sent (success state shows mint-fresh banner "Check your inbox" + email shown), rate-limited error.

SCREEN: Reset Password (from deep link)
LAYOUT
- New password field + confirm field with strength meter.
- CTA "Update password".
STATES: default, mismatch error, expired-link error (with "Request new link" CTA), success → auto-sign-in then go to home.
```

---

## SCREEN — A.5 Email Verification

```text
SCREEN: Email Verification   DEVICE: iPhone 14 390×844
LAYOUT
- Illustration (envelope, 96×96, mint-fresh accent).
- Heading-2 "Verify your email"
- Body: "We sent a link to <user@example.com>. Tap it to continue."
- Secondary CTA "Resend email" (cooldown 60s, shows countdown).
- Tertiary "Change email".
STATES: waiting, resent (banner), verified (success → home), bounce-error (red banner).
```

---

## SCREEN — A.6 Phone Verification (OTP)

```text
SCREEN: OTP Verification      DEVICE: iPhone 14 390×844
LAYOUT
- Heading-2 "Enter the 6-digit code"
- Body small "Sent to (555) 555-1234. Change number"
- 6-cell OTP input (each cell 48×56, radius medium, gap 8). Auto-advance and paste support.
- Resend button with 60s cooldown.
- Sticky CTA "Verify" enabled when 6 digits entered.
STATES: default, partial, error (cells turn error border, banner "Code didn't match"), expired ("Code expired — request new"), success.
ACCESSIBILITY: each cell accessibilityLabel "Digit 1 of 6", accessibilityValue is the digit.
```

---

## SCREEN — A.7 Onboarding Steps (4 frames)

```text
SCREENS: Onboarding 1–4      DEVICE: iPhone 14 390×844
Common: stepper at top showing N/4. Sticky footer with secondary "Skip" + primary "Continue".

A.7.1 Profile
- Avatar upload (circle 96, plus icon overlay), display name input, optional pronouns chip-row (She/Her, He/Him, They/Them, Prefer not to say).

A.7.2 Preferences
- Heading "What are you into?"
- Category-pill grid (use existing component): nails, hair, skin, lashes, brows, massage, makeup, barber, waxing, spa.
- Multi-select; min 1 to continue.

A.7.3 Notifications consent (TCPA/CAN-SPAM safe defaults — all OFF by default)
- Form rows with toggle: "Booking reminders", "Promotions and offers (SMS)", "Promotions and offers (email)", "New salons near you".
- Disclosure note: "Message and data rates may apply. Reply STOP to unsubscribe."

A.7.4 Location
- Map preview placeholder card.
- Primary CTA "Use my location" → triggers system permission prompt (illustrate iOS permission sheet variant).
- Secondary CTA "Enter ZIP" opens input bottom sheet (5-digit ZIP).
- States: permission-granted, permission-denied (banner + ZIP fallback), error.

A.7.5 Payment (optional)
- Card upload using a stub of D.2 Add-payment-method form OR "Skip for now" tertiary action.
```

---

## SCREEN — A.8 Account Merge / Upgrade (Guest → Full)

```text
SCREEN: Account Merge       DEVICE: iPhone 14 390×844
PERSONA: Guest user with bookings; wants persistent account.
LAYOUT
- Heading "Save your bookings"
- Body small explainer (bookings count, loyalty points carry over).
- Choice cards (radius large 16): "Sign in (existing account)" / "Create new account".
- Banner warning if guest email already exists in system: "This email is already registered. Sign in to merge."
STATES: default, conflict (email already exists), merging (loader), merged success (toast), error.
```

---

## SCREEN — A.9 Auth Error & Empty Variants

```text
Deliver one frame per error case across A.1–A.8 using the banner component:
- Network offline → banner warning with retry CTA.
- Rate limited → banner error with countdown.
- Server 5xx → banner error generic + "Try again".
- Account suspended → full-screen empty state with support link.
```

---

## COMPONENT — A.C1 input-field

```text
COMPONENT: input-field    VARIANTS: text, email, phone, password, OTP-cell
USED IN: A.1 A.2 A.4 A.5 A.6 + most forms downstream.

ANATOMY
- Label (label 14/20, foreground)
- Input row: surface white, 1px border #E5E0D1, radius medium 12, height 48, padding H 16.
- Optional leading icon (24×24) or trailing affordance (clear ✕, eye, copy).
- Helper text below (label-small muted).

STATES (variants)
- default, hover (border foreground 30%), focused (2px coral-blossom border + glow primary-10),
  filled, disabled (#F5F5F5 bg, #B0B0B0 fg), error (1.5px error border + error helper),
  loading (right-aligned 16pt spinner).

TOKENS
- Padding H 16, V 12. Gap to label 4. Gap to helper 4.
- Typography: input body 14/20 weight 400.

ACCESSIBILITY
- Tap target 48 height + 8 hit slop = 56.
- accessibilityLabel = label string; helper text exposed via accessibilityHint.
- Error: accessibilityLiveRegion = polite, announces error message.

API
- props: label, value, onChangeText, type, placeholder, error, helper, leftIcon, rightAdornment,
  disabled, autoComplete, secureTextEntry, maxLength.
```

---

## COMPONENT — A.C2 button

```text
COMPONENT: button    VARIANTS: primary, secondary, tertiary, destructive, icon-only
ANATOMY
- Container with radius medium 12 (full 9999 if pill variant).
- Label label 14/20 weight 500.
- Optional left/right icon 20×20 with 8 gap.

SIZES
- Large: height 48, padding H 24
- Medium: height 40, padding H 20
- Small: height 32, padding H 16 (label-small)

STATES per variant
- primary: bg coral-blossom, fg #FFFFFF; hover #D99A90; pressed #CF8B80; disabled #B0B0B0/#F5F5F5.
- secondary: bg surface, fg foreground, 1px border #E5E0D1.
- tertiary: bg transparent, fg coral-blossom; underline on focus.
- destructive: bg error #F44336, fg #FFFFFF.
- icon-only: 44×44 minimum, accessibilityLabel required.

ACCESSIBILITY
- Focus ring 2px coral-blossom + 2px offset.
- accessibilityRole = "button".
```

---

## COMPONENT — A.C3 form-row, A.C4 segmented-control, A.C5 stepper, A.C6 banner

```text
form-row: stack of label + input(s) + helper, vertical gap 4, between rows gap 16.

segmented-control:
- Container surface white 1px border, radius medium 12, height 44, internal padding 4.
- Selected segment: bg coral-blossom, fg white, radius small 8.
- States: default, selected, disabled.

stepper:
- Horizontal pill with N steps. Active step coral-blossom; complete steps mint-fresh check; remaining border-only.
- Height 8 line + 12 dot. accessibilityLabel "Step 2 of 4".

banner:
- Variants: info (#2196F3), success (mint-fresh + accent-foreground), warning (#FF9800), error (#F44336).
- Layout: 16 padding, radius medium 12, leading icon 20, body 14/20, optional action label-button right.
- Dismiss icon 24×24 if dismissible.
- accessibilityRole = "alert" for error/warning.
```

---

## Human Review Checklist

- [ ] Tokens match `design-handoff/tokens/*` exactly.
- [ ] All 9 screen groups (A.1–A.9) plus 6 new components delivered.
- [ ] All required states (default/loading/empty/error/role/success) per screen.
- [ ] TCPA/CAN-SPAM marketing toggles default OFF.
- [ ] WCAG 2.1 AA contrast verified.
- [ ] Touch targets ≥44×44.
- [ ] OTP input supports paste + auto-advance.
- [ ] Apple Sign-In present and follows HIG (iOS).
- [ ] US phone format `(XXX) XXX-XXXX`; ZIP 5-digit.
- [ ] Frames named `A-<screen>-<state>`.
