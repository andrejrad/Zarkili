# Week 29 Close Report — Batch I: Legal, Lifecycle, Settings Depth, Auth Edges (Consumer UI)

**Window:** Week 29 (Phase 2.1 consumer-UI first depth sprint).
**Status:** ✅ Complete — all 11 screens (I.1–I.11), 6 shared-UI primitives, 4 test suites delivered, 4 tsc errors fixed, 2 jest failures fixed — GO for Week 30.
**Predecessor:** [WEEK28_CLOSE_REPORT.md](WEEK28_CLOSE_REPORT.md).

## 1. Scope

W29 (Batch I) completes the legal compliance surface, account lifecycle controls, accessibility/settings depth, and auth edge cases for Phase 2.1. This covers COPPA age-gating, GDPR/CCPA data-export and deletion flows, marketing consent (CAN-SPAM / TCPA / CCPA), MFA setup/challenge, device management, recovery codes, profile editing, credential changes, connected accounts, accessibility settings, and the in-app help center.

W29 is entirely `code-only` per `FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md`.

All screens are props-driven with no Firestore I/O. The navigator layer wires live data when Phase 3 backend services ship.

## 2. Features Delivered

### 2.1 Foundation — `src/shared/ui/` (6 new primitives)

| Primitive | Surface |
|-----------|---------|
| `MfaOtpInput` | 6-cell (configurable `cellCount`) OTP entry. Hidden backing `TextInput` for paste + auto-advance. Cells rendered as individual `View` tiles with active-border highlight. `error` string displayed below. Disabled overlay. `testID`-forwarded backing input and error label. |
| `LegalPageLayout` | Reusable legal page shell. Back header + H3 title. Last-updated muted label. Horizontal jump-link chip `ScrollView`. Scrollable body slot (`children`). Optional sticky footer slot. `testID`-forwarded back, title, jump-links area, individual jump-link chips, and scroll view. |
| `ConsentToggleList` | Sectioned consent toggle list. Wraps `PreferenceToggleRow` per item. Optional inline disclosure banners for TCPA/CCPA/CAN-SPAM compliance. `testID` pattern: `${testID}-${item.id}` for toggle row, `${testID}-disclosure-${item.id}` for disclosure banner. |
| `DeletionConfirmationModal` | Account deletion guard. Requires typing `"DELETE"` + password; primary CTA disabled until both fields valid. Uses `ModalSheet` + `InputField` (no `autoCapitalize` — that prop does not exist on `InputField`) + `Button` variant=`"destructive"`. `testID`-forwarded phrase field, password field, confirm button, error label. |
| `DeviceRow` | Device management row. Device icon + name body + last-active label-small muted + 44×44 revoke `Pressable`. `isCurrent` flag suppresses revoke button. Optional separator. `testID`-forwarded name, last-active label, revoke button. |
| `RecoveryCodesList` | 2-column monospaced recovery codes grid. Warning banner. Copy All + Download action buttons. Plain solid bottom border per row (no `borderBottomStyle: "dotted"` — invalid in React Native StyleSheet). `testID`-forwarded per-code cells, copy-all, and download buttons. |

All primitives reuse W21 design tokens (`src/shared/ui/tokens.ts`) unchanged and are fully props-driven.

### 2.2 Screens — 11 screens across 5 directories

| # | Screen | File | Key Design |
|---|--------|------|------------|
| I.1 | **Legal Page** | `src/app/legal/LegalPageScreen.tsx` | `pageType` prop selects ToS / Privacy / Cookies / About / Licenses content. Jump links derived from `sections` array (not a separate prop — see Fix #1 below). Cookies page renders CCPA "Do Not Sell or Share" button when `isCaResident={true}`. `state="loading"` shows `ActivityIndicator` without layout. Accept-required banner. |
| I.2 | **Marketing Consent** | `src/app/legal/MarketingConsentScreen.tsx` | Internal state machine: `default → saving → saved → error`. `savedToast` auto-dismissed via `setTimeout`. CCPA third-party sharing row only when `isCaResident={true}`. Uses `ConsentToggleList` with inline CAN-SPAM / TCPA disclosure banners. |
| I.3 | **Data Export** | `src/app/legal/DataExportScreen.tsx` | `exportState`: `default → building → ready → expired → error`. Export category checkboxes. Status card with progress indicator. Downloadable file card. Expired-export banner with "Request New" CTA. |
| I.4 | **Delete Account** | `src/app/legal/DeleteAccountScreen.tsx` | `state`: `default → cooldown → confirming → error`. Opens `DeletionConfirmationModal` on delete button press. Cooldown card with cancel-deletion CTA. |
| I.5 | **Age Gate** | `src/app/auth/AgeGateScreen.tsx` | DOB auto-formats MM/DD/YYYY on input. Continue CTA disabled until `dob.length >= 10`. COPPA blocked state: full-screen copy, no back button shown. `state`: `default → blocked → error`. |
| I.6 | **Edit Profile** | `src/app/profile/EditProfileScreen.tsx` | 96 px avatar circle + camera overlay. Display name, pronouns chip-row, bio (250 char limit). Internal dirty-state tracking: save button disabled when not dirty. `state`: `default → dirty → saving → saved → error`. Pronoun testID format: `${testID}-pronoun-${p.replace(/\//g, "-")}`. |
| I.7 | **Change Credentials** | `src/app/profile/ChangeCredentialsScreen.tsx` | `credentialType`: `email → phone → password`. 2-step flow. Step 1: current-password verification. Step 2: new value + confirm value. `state`: `default → validating → mismatch → success`. `onChangeConfirmValue` is optional — wired as `onChangeConfirmValue ?? (() => {})` to satisfy `InputField.onChangeText` type. |
| I.8 | **Connected Accounts** | `src/app/profile/ConnectedAccountsScreen.tsx` | SSO providers (Google / Apple / Facebook) connect/disconnect buttons. Calendar sync section (Google Calendar / Apple Calendar / Outlook) with `PreferenceToggleRow`. Per-service error state. |
| I.9 | **Accessibility Settings** | `src/app/settings/AccessibilitySettingsScreen.tsx` | Text size S/M/L/XL radio row + live preview text. Reduce motion toggle. High contrast toggle. VoiceOver hints toggle. Theme System/Light/Dark radio cards. Save CTA with error banner. |
| I.10 | **Help** | `src/app/support/HelpScreen.tsx` | Search `TextInput` → `search-results \| no-results` state. Category grid (6 categories). Article list. Contact form in `ModalSheet`. States: `default → search-results → no-results → sending → sent → error`. |
| I.11 | **Auth Edge** | `src/app/auth/AuthEdgeScreen.tsx` | 9 views via discriminated union `view` prop: `locked \| mfa-setup \| mfa-challenge \| recovery-codes \| devices \| sign-out-all \| re-auth \| magic-link \| sso-conflict`. MFA setup: step 1 = method picker, step 2 = `MfaOtpInput` OTP verify. Devices: `DeviceRow` list; sign-out-all confirm in nested `ModalSheet`. Re-auth: `ModalSheet` when `reAuthVisible={true}`. Recovery codes: `RecoveryCodesList`. |

### 2.3 Legal compliance embedded this week

| ID | Regulation | Surface |
|----|-----------|---------|
| W29-LEG-001 | COPPA | `AgeGateScreen` blocks under-13 users with locked screen and no back navigation |
| W29-LEG-002 | CCPA | `MarketingConsentScreen` third-party sharing toggle is `isCaResident`-gated; `LegalPageScreen` (Cookies) surfaces "Do Not Sell or Share" for CA residents |
| W29-LEG-003 | GDPR / CCPA | `DataExportScreen` provides data portability flow; `DeleteAccountScreen` provides right-to-erasure flow with required cooldown guard |
| W29-LEG-004 | CAN-SPAM / TCPA | `MarketingConsentScreen` uses `ConsentToggleList` with inline disclosure banners per consent item |

### 2.4 Index

`src/shared/ui/index.ts` updated with W29 Batch I exports:
```typescript
// W29 Batch I primitives — Legal, Lifecycle, Settings, Auth Edges
export { MfaOtpInput } from "./MfaOtpInput";
export type { MfaOtpInputProps } from "./MfaOtpInput";
export { LegalPageLayout } from "./LegalPageLayout";
export type { LegalPageLayoutProps, LegalJumpLink } from "./LegalPageLayout";
export { ConsentToggleList } from "./ConsentToggleList";
export type { ConsentToggleListProps, ConsentItem } from "./ConsentToggleList";
export { DeletionConfirmationModal } from "./DeletionConfirmationModal";
export type { DeletionConfirmationModalProps } from "./DeletionConfirmationModal";
export { DeviceRow } from "./DeviceRow";
export type { DeviceRowProps } from "./DeviceRow";
export { RecoveryCodesList } from "./RecoveryCodesList";
export type { RecoveryCodesListProps } from "./RecoveryCodesList";
```

## 3. Tests

- **Root jest:** 2,236 → **2,317** passing across 140 → **144** suites (+81 tests, +4 suites).
- **`npx tsc --noEmit`** (root): 0 errors after 4 fix-pass corrections (see §4 below).

| Suite | Path | Coverage |
|-------|------|---------|
| `legalScreens` | `src/app/legal/__tests__/legalScreens.test.tsx` | `LegalPageScreen` (default, loading, error, accept-required, cookies CCPA row, sections-derived jump links), `MarketingConsentScreen` (toggle change, CA resident row, saved banner), `DataExportScreen` (all 5 export states), `DeleteAccountScreen` (delete CTA, cooldown, modal visibility). 25 tests. |
| `profileScreens` | `src/app/profile/__tests__/profileScreens.test.tsx` | `EditProfileScreen` (dirty-state tracking, pronoun chips, bio limit), `ChangeCredentialsScreen` (step flows for email/phone/password, mismatch state), `ConnectedAccountsScreen` (SSO connect/disconnect buttons, calendar toggles). |
| `settingsAndSupportScreens` | `src/app/settings/__tests__/settingsAndSupportScreens.test.tsx` | `AccessibilitySettingsScreen` (text size selection, toggles, theme picker, save/error), `HelpScreen` (search states, category grid, no-results, contact form modal). |
| `authEdgeScreens` | `src/app/auth/__tests__/authEdgeScreens.test.tsx` | `AgeGateScreen` (DOB input, COPPA blocked state), `AuthEdgeScreen` (all 9 views: locked, mfa-setup steps 1+2, mfa-challenge, recovery-codes, devices, sign-out-all, re-auth modal, magic-link, sso-conflict). |

## 4. Fix-Pass Summary

Four tsc errors and two jest failures were found and resolved in a single fix pass after initial delivery.

### tsc Errors Fixed

| # | Error | Fix |
|---|-------|-----|
| 1 | Test passed `jumpLinks` as a direct prop on `LegalPageScreen` — prop does not exist; jump links are derived from `sections`. | Tests changed to pass `sections` array; jump links auto-generated in the component. |
| 2 | `ChangeCredentialsScreen` passed `onChangeConfirmValue` (optional `(v: string) => void`) directly to `InputField.onChangeText` which requires a non-optional function. | Bound as `onChangeConfirmValue ?? (() => {})`. |
| 3 | `DeletionConfirmationModal` passed `autoCapitalize` to `InputField` — that prop does not exist on `InputFieldProps`. | Removed `autoCapitalize` from the component. |
| 4 | `RecoveryCodesList` used `borderBottomStyle: "dotted"` in `StyleSheet.create` — a web-only CSS property, invalid in React Native. | Removed; plain solid border used. |

### jest Failures Fixed

| # | Failure | Fix |
|---|---------|-----|
| 1 | `getByText("Introduction")` threw "found multiple elements" — the word appears in both a jump-link chip label and a section heading. | Changed assertion to `getAllByText("Introduction").length >= 1`. |
| 2 | `ConsentToggleList` disclosure `testID` expected was `consent-list-marketing-sms-disclosure-marketing-sms`; actual pattern is `${testID}-disclosure-${item.id}`. | Corrected test expectation to `consent-list-disclosure-marketing-sms`. |

## 5. Security

- **No Firestore I/O from screens.** All screens are props-driven. No new security rules or indexes needed.
- **Deletion gate.** `DeleteAccountScreen` requires the server-side cooldown state to be passed in via prop; deletion is a two-step: server sets cooldown → screen shows confirmation → `DeletionConfirmationModal` requires typed `"DELETE"` + current password before calling `onConfirmDelete`. The UI adds an explicit human-intent gate on top of the backend hard-delete.
- **COPPA.** `AgeGateScreen` blocked state suppresses all navigation callbacks. The blocked screen has no back button, no retry, and no alternative CTA — enforcement must also be applied server-side.
- **MFA.** `MfaOtpInput` uses a hidden backing `TextInput` to prevent clipboard-write APIs from bypassing OTP entry. The component does not store OTP value beyond the controlled `value` prop.
- **Credential change 2-step.** `ChangeCredentialsScreen` always requires current-password verification (step 1) before accepting a new value (step 2). Step 2 UI is not rendered until `step={2}` is set by the parent, which is triggered by successful step-1 server verification.
- **WCAG 2.1 AA.** All interactive targets ≥ 44×44. `MfaOtpInput` backing `TextInput` has `accessibilityLabel`. `DeviceRow` revoke button has explicit accessible label. `ConsentToggleList` toggles use `PreferenceToggleRow` which sets `accessibilityRole="switch"`.

## 6. Debt Register

| ID | Description | Target |
|----|-------------|--------|
| **W29-DEBT-1** | **Legal, profile, settings, and auth-edge backend services** — Firestore collections and Cloud Functions for: data export (`requestDataExport`, `downloadExport`), account deletion (`initiateAccountDeletion`, `cancelDeletion`, `hardDeleteAccount`), marketing consent writes, credential-change verification flow, MFA enrollment/challenge, device session management, connected-account OAuth flows, accessibility-settings persistence. | Phase 3 / Phase 4 backend pass |
| **W29-DEBT-2** | **i18n.** All W29 strings are hard-coded in English. W32 (B-019) will introduce the full i18n pass. | W32 |
| **W29-DEBT-3** | **`DeletionConfirmationModal` uppercase enforcement.** Phrase field accepts any case; uppercase display would require a custom `onChangeText` transform (not `autoCapitalize` which does not exist on `InputField`). | W32 polish pass |

Previously carried debts: W19-DEBT-4, W19-DEBT-5, W20-DEBT-2 through W20-DEBT-4, W22-DEBT-1, W22-DEBT-3, W23-DEBT-1, W23-DEBT-3, W24-DEBT-1 through W24-DEBT-3, W25-DEBT-1 through W25-DEBT-3, W26-DEBT-1 through W26-DEBT-3, W27-DEBT-1, W27-DEBT-2, W28-DEBT-1, W28-DEBT-2.

## 7. Index — Changed Files

### New (production)

**Primitives — `src/shared/ui/`:**
- `MfaOtpInput.tsx`
- `LegalPageLayout.tsx`
- `ConsentToggleList.tsx`
- `DeletionConfirmationModal.tsx`
- `DeviceRow.tsx`
- `RecoveryCodesList.tsx`

**Screens:**
- `src/app/legal/LegalPageScreen.tsx`
- `src/app/legal/MarketingConsentScreen.tsx`
- `src/app/legal/DataExportScreen.tsx`
- `src/app/legal/DeleteAccountScreen.tsx`
- `src/app/auth/AgeGateScreen.tsx`
- `src/app/profile/EditProfileScreen.tsx`
- `src/app/profile/ChangeCredentialsScreen.tsx`
- `src/app/profile/ConnectedAccountsScreen.tsx`
- `src/app/settings/AccessibilitySettingsScreen.tsx`
- `src/app/support/HelpScreen.tsx`
- `src/app/auth/AuthEdgeScreen.tsx`

### Updated (production)

- `src/shared/ui/index.ts` — W29 Batch I exports appended.

### New (test)

- `src/app/legal/__tests__/legalScreens.test.tsx`
- `src/app/profile/__tests__/profileScreens.test.tsx`
- `src/app/settings/__tests__/settingsAndSupportScreens.test.tsx`
- `src/app/auth/__tests__/authEdgeScreens.test.tsx`

## 8. Blockers for Week 30

None. All W29 screens are complete and green. W30 (B-017 — Booking, Payments, Discovery Edge Cases) is unblocked.
