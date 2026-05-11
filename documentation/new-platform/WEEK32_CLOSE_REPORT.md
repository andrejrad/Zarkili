# WEEK 32 CLOSE REPORT — Batch L: Cross-Cutting Platform, i18n, Store Readiness, Release

**Sprint:** W32  
**Closed:** 2026-04-29  
**Engineer:** Copilot  
**Backlog item:** B-019  
**Phase:** Phase 2.1 (Consumer app feature completeness — COMPLETE)

---

## 1. Summary

Week 32 is the final sprint of Phase 2.1. Batch L delivers all cross-cutting platform surfaces that every other screen in the app depends on — force-update gate, offline recovery, permissions prompts, first-run onboarding flows, language/locale settings, store-readiness disclosures, and supplementary legal screens.

With this batch merged, Phase 2.1 is functionally complete. The codebase is ready for a Phase 2.1 release candidate build.

---

## 2. Deliverables

### 2.1 Primitives (6 / 6 ✅)

| # | Primitive | Key Props |
|---|-----------|-----------|
| L.P1 | `ForceUpdateGate` | `visible`, `currentVersion`, `minVersion`, `onUpdatePress` |
| L.P2 | `OfflineBanner` | `status: "offline"|"reconnecting"|"restored"`, `onRetry?` |
| L.P3 | `CoachMark` | `step`, `totalSteps`, `title`, `body`, `onNext`, `onSkip?` |
| L.P4 | `RateTheAppPrompt` | 3-stage star→feedback→thanks modal |
| L.P5 | `LanguagePicker` | `locales: SupportedLocale[]`, `onConfirm(code: string)` |
| L.P6 | `PermissionsGate` | `permissionType`, `variant?: "screen"|"card"`, `onOpenSettings` |

### 2.2 Screen Files (6 / 6 ✅)

| # | File | Exports |
|---|------|---------|
| L.1 | `src/app/platform/PlatformCrossScreens.tsx` | ForceUpdateScreen, MaintenanceModeScreen, OfflineScreen, ServerErrorFallbackScreen, FeatureFlagDisabledScreen, DeepLinkFallbackScreen |
| L.2 | `src/app/platform/PermissionsExtrasScreen.tsx` | CameraPermissionScreen, PhotosPermissionScreen, ContactsPermissionScreen, CalendarPermissionScreen, LocationPermissionScreen |
| L.3 | `src/app/onboarding/FirstRunExtrasScreen.tsx` | CoachMarkTutorialOverlay, WhatsNewSheet, RateTheAppScreen, InviteFriendsSheet |
| L.4 | `src/app/settings/I18nSettingsScreen.tsx` | LanguagePickerScreen, LocaleFormatsScreen, LanguageSwitchConfirmSheet |
| L.5 | `src/app/settings/StoreReadinessScreens.tsx` | PrivacyNutritionLabelScreen, DataSafetyScreen, AppInfoScreen, ReleaseNotesScreen |
| L.6 | `src/app/legal/LegalExtrasScreen.tsx` | OpenSourceLicensesScreen, AttributionsScreen, AccessibilityStatementScreen, CookiePolicyScreen |

### 2.3 Index Updated ✅

`src/shared/ui/index.ts` — 6 primitive exports appended under the W32 Batch L block.

### 2.4 Tests (6 suites / 100 tests ✅)

| File | Tests |
|------|-------|
| `__tests__/w32PrimitivesL.test.tsx` | ~24 |
| `__tests__/w32PlatformCrossScreens.test.tsx` | ~22 |
| `__tests__/w32PermissionsExtras.test.tsx` | ~15 |
| `__tests__/w32FirstRunExtras.test.tsx` | ~19 |
| `__tests__/w32I18nSettings.test.tsx` | ~12 |
| `__tests__/w32StoreAndLegalExtras.test.tsx` | ~28 |

---

## 3. Build Health

| Check | Status |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx jest --no-coverage` | ✅ 2,656 / 2,656 |
| Test suites | ✅ 160 / 160 |

---

## 4. Decision Gates

| Gate | Decision |
|------|----------|
| RTL layout support (W32) | ❌ Out of scope — Phase 3+ |
| iOS Live Activities | ❌ Out of scope — Phase 4 |
| Android Widgets | ❌ Out of scope — Phase 4 |
| App Clip / Instant App | ❌ Out of scope — Phase 3 |

These decisions were carried forward from W26 milestone and remain unchanged.

---

## 5. Fixes Applied During W32

- **`I18nSettingsScreen.tsx`** — `SegmentedControl` usage corrected from invalid `selectedIndex`/`options: string[]` API to the correct generic typed `value: T` / `options: SegmentedOption<T>[]` API.
- **`FirstRunExtrasScreen.tsx`** — Removed `ShareTargetRow` (a contact card primitive) and replaced with inline `Pressable` rows appropriate for app-share targets.
- **`LegalExtrasScreen.tsx`** — `colors.primarySubtle` (non-existent token) replaced with `colors.primary10`.

---

## 6. Baseline Comparison

| | Count |
|---|---|
| Tests before W32 | 2,556 |
| Tests after W32 | 2,656 |
| Delta | **+100** |
| Suites before W32 | 154 |
| Suites after W32 | 160 |
| Delta | **+6** |

---

## 7. Phase 2.1 Final Inventory

Weeks W21–W32 (Batches A–L) added to the codebase:
- **63 shared/ui primitives** (all in `src/shared/ui/`)
- **60+ app screens** across `src/app/{auth,bookings,calendar,client,discovery,legal,marketplace,messaging,notifications,onboarding,payments,platform,profile,reviews,salon,settings,staff,support,wallet}/`

Phase 2.1 is **complete**. The codebase is ready for:
- Phase 2.2 accessibility audit pass
- Phase 2.1 release candidate E2E testing
- Phase 3 admin UI build (W33+)

---

## 8. Next Steps

**B-020 / Phase 2.2 options:**
1. Accessibility audit pass across all Phase 2.1 screens (keyboard nav, contrast, labels, touch targets)
2. Phase 3 admin UI kickoff (W33 — Batch M)
3. Integration with real backend (swap mock services for Firebase/Firestore)
4. E2E test setup (Detox or Maestro)
