# Batch I — Legal, Lifecycle, Settings Depth, Auth Edge Cases

> Consumed by **Weeks 29–30**.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Screens: Legal pages (ToS, Privacy, Cookies, About, Open-source) · Marketing consent management · Data export request/status/download · Account deletion · Age/region gate · Edit profile · Change email/phone/password · Connected accounts + calendar sync · Accessibility settings + theme picker · Help/FAQ/contact · Auth edge cases (locked, MFA setup/challenge, recovery codes, devices, sign out from all, re-auth, magic-link landing, SSO conflict).

New components: `legal-page-layout`, `consent-toggle-list`, `deletion-confirmation-modal`, `device-row`, `recovery-codes-list`, `mfa-otp-input`.

---

## SCREEN — I.1 Legal Pages (ToS / Privacy / Cookies / About / Licenses)

```text
SCREENS: Legal Pages (5 frames)    DEVICE: iPhone 14 390×844
LAYOUT (legal-page-layout)
- Header back, title (heading-3) e.g., "Terms of Service".
- Last updated label-small muted "Updated MM/DD/YYYY".
- Anchor jump links chip-row (Sections).
- Body long-form text rendered as headings + paragraphs (body 14/20, headings heading-3).
- Sticky footer: "Download PDF" tertiary; for Cookies → primary "Save preferences".
US compliance: cite ADA + WCAG 2.1 AA in About. Cookie consent shows CCPA "Do Not Sell or Share" toggle for CA residents.
STATES: default, loading, error, accept-required (Cookie banner first-run variant).
```

## SCREEN — I.2 Marketing Consent Management

```text
SCREEN: Marketing Consents    DEVICE: iPhone 14
LAYOUT
- Sectioned list (consent-toggle-list):
  - Marketing emails (CAN-SPAM disclosure)
  - Marketing SMS (TCPA disclosure: "Reply STOP to unsubscribe")
  - Push promotions
  - Personalized recommendations (data-use disclosure)
  - Third-party sharing (CCPA opt-out — applies in CA + state laws)
- Each row: toggle + helper body-small + "Learn more" tertiary link.
STATES: default, saving (inline), saved toast, error.
```

## SCREEN — I.3 Data Export Request, Status, Download (3 frames)

```text
I.3.1 Request — heading-2 "Export your data", body explainer (CCPA + GDPR scope), category checklist, primary CTA "Request export".
I.3.2 Status — progress card (Pending → Building → Ready) with ETA "Within 30 days".
I.3.3 Download — file card (size, format ZIP/JSON), primary "Download" + body small expiry notice.
STATES: default, building, ready, expired, error per frame.
```

## SCREEN — I.4 Account Deletion

```text
SCREEN: Delete Account    DEVICE: iPhone 14
LAYOUT
- Heading-2 "Delete account".
- Body warning: data retention, refunds outstanding, 30-day cooldown.
- Reason picker (radio group).
- deletion-confirmation-modal: type "DELETE" to confirm + password re-entry.
- Destructive primary CTA "Delete account".
STATES: default, cooldown-active (shows days remaining + cancel deletion CTA), confirming, error.
```

## SCREEN — I.5 Age / Region Gate (if in scope)

```text
SCREEN: Age Gate    DEVICE: iPhone 14
LAYOUT
- Heading-2 "Confirm your age".
- Date-of-birth picker (US format MM/DD/YYYY).
- Region (state) picker.
- Primary "Continue".
STATES: default, under-13 blocked (full-screen "Sorry, you must be 13+", COPPA-compliant copy), error.
```

## SCREEN — I.6 Edit Profile

```text
SCREEN: Edit Profile    DEVICE: iPhone 14
LAYOUT
- Avatar editor (96 + change icon overlay).
- Inputs: display name, pronouns chip-row, bio (multiline 250 chars).
- Sticky footer "Save".
STATES: default, dirty, saving, saved toast, validation error, error.
```

## SCREEN — I.7 Change Email / Phone / Password (3 sub-flows)

```text
Each as a 2-step flow with modal-sheet pattern:
- Step 1: enter current password (re-auth).
- Step 2: enter new value; for email/phone trigger verification (A.5/A.6).
States per step: default, validating, mismatch, success.
```

## SCREEN — I.8 Connected Accounts & Calendar Sync

```text
SCREEN: Connected Accounts    DEVICE: iPhone 14
LAYOUT
- Sections: SSO providers (Google, Apple, Facebook) — each row with status pill (Connected / Not connected) and action button (Disconnect / Connect).
- Calendar sync section: Google Calendar, Apple Calendar, Outlook — toggle + last-sync timestamp.
STATES: default, connecting OAuth flow placeholder, connected, sync-error banner, error.
```

## SCREEN — I.9 Accessibility Settings + Theme Picker

```text
SCREEN: Accessibility & Theme    DEVICE: iPhone 14
LAYOUT
- Text size slider (4 sizes: S/M/L/XL) with live preview block.
- Reduce motion toggle.
- High contrast toggle.
- VoiceOver hints toggle.
- Theme picker: System · Light · Dark (radio cards with thumbnail).
STATES: default, dark-mode preview (if in scope), saving, error.
ACCESSIBILITY: slider accessibilityValue "Medium".
```

## SCREEN — I.10 Help / FAQ / Contact Support

```text
SCREEN: Help    DEVICE: iPhone 14
LAYOUT
- Top: search-bar.
- Categories grid (Getting started, Bookings, Payments, Loyalty, Account, Privacy).
- Featured articles list.
- "Contact support" tertiary CTA → opens contact form (subject, body, attachment, email pre-filled) → submission shows ticket number.
STATES: default, search results, no-results, sending, sent (ticket #), error.
```

## SCREEN — I.11 Auth Edge Cases (8 frames)

```text
I.11.1 Account locked — full-screen empty state + "Contact support" + countdown.
I.11.2 MFA setup — choose method (Authenticator app QR, SMS, Email), verify with mfa-otp-input.
I.11.3 MFA challenge — enter 6-digit code; "Use recovery code" tertiary.
I.11.4 Recovery codes — list of 10 codes (recovery-codes-list), Copy + Download buttons, warning "Save these securely".
I.11.5 Device management — list of device-row (device name, last active MM/DD/YYYY h:mm AM/PM, location), trash icon → revoke.
I.11.6 Sign out from all devices — destructive confirm modal-sheet.
I.11.7 Re-auth prompt — modal-sheet asking password before sensitive action.
I.11.8 Magic-link landing — full-screen success/error states.
I.11.9 SSO conflict — banner "This email is linked to Google. Sign in with Google?" with switch CTA.
```

---

## COMPONENTS

```text
legal-page-layout — header, last-updated row, jump-link chip-row, scrollable body with semantic typography, optional sticky footer.

consent-toggle-list — preference-toggle-row with mandatory helper body-small + "Learn more" link. Required disclosures (TCPA/CCPA) rendered as info banners inline.

deletion-confirmation-modal — destructive-confirm modal-sheet with required typed confirmation input + password re-entry + destructive primary disabled until both pass validation.

device-row — icon + device name body + last-active label-small muted + revoke icon-button (44×44).

recovery-codes-list — 2-col grid of monospaced codes (label-large, dotted divider). Copy-all and download CTAs at bottom.

mfa-otp-input — same as A.6 OTP input; shared component.
```

---

## Human Review Checklist

- [ ] All 11 screen groups + 6 components delivered.
- [ ] CCPA "Do Not Sell or Share" toggle present (CA + applicable states).
- [ ] CAN-SPAM and TCPA disclosures rendered inline.
- [ ] Account deletion requires typed confirmation + password.
- [ ] Date-of-birth uses MM/DD/YYYY; underage blocks COPPA-compliant.
- [ ] Recovery codes warned to be stored securely.
- [ ] All required states delivered.
- [ ] Frames named `I-<screen>-<state>`.
