# Week 42 Close Report — Service Catalog Depth

**Date closed:** 2026-05-10
**Jest baseline at start of week:** 2824 tests / 165 suites (all passing)
**Jest at close:** 2902 tests / 166 suites — all passing
**TypeScript:** `tsc --noEmit` clean

---

## 1. Scope

W42 delivered the **Service Catalog Depth** cluster (Phase 3 Batch P), per [PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md](../PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md) §Week 42.

The program goal was: _category/tag management, bulk import/export (CSV), price list management, add-ons and packages, seasonal availability rules, photos/media manager, booking rules per service, visibility toggles._

All UI surfaces are in place. Repository adapters (the Firestore write path) are stubs returning `{ ok: false, message: "X repository not configured." }` and are tracked as W42-DEBT-1; they land in W43 alongside the booking operations pass.

---

## 2. What Was Built

### 2.1 Domain model — `src/domains/services/serviceCatalogModel.ts`

New types extending the base `Service` model:

| Type | Description |
|------|-------------|
| `ServiceCategory` + `CreateServiceCategoryInput` + `UpdateServiceCategoryInput` | Category with name, sortOrder, optional color |
| `ServiceAddon` + `CreateServiceAddonInput` + `UpdateServiceAddonInput` | Add-on with name, price, currency, durationMinutes, active flag |
| `ServiceSeasonalRule` + `CreateServiceSeasonalRuleInput` | Date-range rule with label, startDate, endDate, blockedCompletely, optional customDurationMinutes |
| `ServiceBookingRules` + `UpdateServiceBookingRulesInput` | Per-service depositPercent, cancellationWindowHours, leadTimeHours, bufferMinutes |
| `ServiceVisibilityConfig` + `UpdateServiceVisibilityInput` | onlineBooking, marketplaceListed, internalOnly flags |
| `ServicePriceOverride` + `UpsertServicePriceOverrideInput` | Per-location price with locationId, price, currency |
| `ServiceImportRow` + `ServiceImportResult` | CSV import row shape + result envelope with rows + errors arrays |

All types exported from `src/domains/services/index.ts`.

### 2.2 `src/app/admin/serviceCatalogService.ts`

Factory `createServiceCatalogService(input?)` with 7 optional repository port injections. Pure architecture — all methods return `UiResult<T>`:

| Method group | Methods |
|-------------|---------|
| Categories | `readCategories`, `createCategory`, `updateCategory`, `deleteCategory` |
| Add-ons | `readAddons`, `createAddon`, `updateAddon` |
| Seasonal rules | `readSeasonalRules`, `createSeasonalRule`, `deleteSeasonalRule` |
| Booking rules | `readBookingRules`, `saveBookingRules` |
| Visibility | `readVisibility`, `saveVisibility` |
| Price overrides | `readPriceOverrides`, `upsertPriceOverride`, `deletePriceOverride` |
| Media | `readServiceMedia` |

**Pure helper:** `parseImportCsv(csvText: string): ServiceImportResult` — no async, no repo. Validates required columns (case-insensitive), validates each row (name, category, currency 3-letter, positive-integer duration, non-negative price). Returns `{ rows, errors }`.

**Repository port types exported:** `ServiceCategoryRepository`, `ServiceAddonRepository`, `ServiceSeasonalRuleRepository`, `ServiceBookingRulesRepository`, `ServiceVisibilityRepository`, `ServicePriceOverrideRepository`, `ServiceMediaRepository`

**Type alias exported:** `ServiceCatalogService = ReturnType<typeof createServiceCatalogService>`

### 2.3 Eight new screen files

| File | testID root | Key props | Cargo |
|------|-------------|-----------|-------|
| `ServiceCategoriesScreen.tsx` | `service-categories-screen` | `categories: ServiceCategory[]`, `newCategoryName`, `onCreateCategory`, `onDeleteCategory` | AdminDataTable + BulkActionBar + BulkConfirmModal |
| `ServiceBulkImportScreen.tsx` | `service-bulk-import-screen` | `csvText`, `parsedRows`, `parseErrors`, `importSubmitting`, `importSuccess`, `onCsvChange`, `onImport` | Multiline TextInput + parse-error card + preview card |
| `ServicePricingScreen.tsx` | `service-pricing-screen` | `overrides: ServicePriceOverride[]`, `locationId`, `price`, `currency`, `onUpsert`, `onDeleteOverride` | Upsert form + override list with delete |
| `ServiceAddOnsScreen.tsx` | `service-addons-screen` | `addons: ServiceAddon[]`, `newName/Price/Duration`, `onCreate`, `onToggleActive` | Create form + list with Switch toggle |
| `ServiceSeasonalRulesScreen.tsx` | `service-seasonal-rules-screen` | `rules: ServiceSeasonalRule[]`, `newLabel/Start/End`, `onCreate`, `onDeleteRule` | Create form + rules list with remove |
| `ServicePhotosScreen.tsx` | `service-photos-screen` | `mediaUrls: string[]`, `uploading`, `uploadError`, `onUpload`, `onRemovePhoto` | Upload stub + photo-card grid |
| `ServiceBookingRulesScreen.tsx` | `service-booking-rules-screen` | `depositPercent`, `cancellationWindowHours`, `leadTimeHours`, `bufferMinutes`, `onSave` | 4 numeric TextInputs + rule-reference info card |
| `ServiceVisibilityScreen.tsx` | `service-visibility-screen` | `onlineBooking`, `marketplaceListed`, `internalOnly`, `onSave` | 3 AdminToggleRow + internalOnly warning card |

### 2.4 AdminScreens.tsx — ServiceListScreen + ServiceEditScreen

**ServiceListScreen** — fully replaced from minimal stub:
- New props: `services: Service[]`, `error: string | null`, `onSelectService(service)`, `onImportCsv()`, `onExportCsv()`, `onBulkArchive(serviceIds[])`
- `AdminDataTable` with 4 columns: Name (flex 2), Category (flex 1), Price (flex 1), Status (flex 1)
- `selectedKeys: Set<string>` multi-select state
- `BulkActionBar` with destructive Archive action → `BulkConfirmModal`
- Import CSV / Export CSV `SecondaryButton` row

**ServiceEditScreen** — 7 new optional sub-navigation callback props:
`onCategories?`, `onPricing?`, `onAddOns?`, `onSeasonalRules?`, `onPhotos?`, `onBookingRules?`, `onVisibility?`

Renders a "Catalog settings" card with a `SecondaryButton` per present callback.

### 2.5 routes.ts — 8 W42 routes

| Route name | Path | Guard |
|------------|------|-------|
| `ServiceCategories` | `/owner/service/categories` | authenticated |
| `ServiceBulkImport` | `/owner/service/import` | authenticated |
| `ServicePricing` | `/owner/service/pricing` | authenticated |
| `ServiceAddOns` | `/owner/service/addons` | authenticated |
| `ServiceSeasonalRules` | `/owner/service/seasonal` | authenticated |
| `ServicePhotos` | `/owner/service/photos` | authenticated |
| `ServiceBookingRules` | `/owner/service/booking-rules` | authenticated |
| `ServiceVisibility` | `/owner/service/visibility` | authenticated |

All: `group: "owner"`.

### 2.6 AppNavigatorShell.tsx — wiring

- **Imports:** 8 new screen components + `parseImportCsv` + `createServiceCatalogService` + 7 new domain types
- **NO_TAB_ROUTES:** added ServiceList, ServiceCreate, ServiceEdit + all 8 W42 routes
- **`serviceCatalogService` useMemo:** `createServiceCatalogService()` (no repos — returns stubs until W43)
- **State added** (~80 new state variables): categories, import, pricing, addons, seasonal, photos, booking-rules, visibility sub-feature state
- **ServiceList handler** updated with `onSelectService`, `onImportCsv` (resets import state + navigate), `onExportCsv` (computes CSV string in memory — file write stub), `onBulkArchive` (calls `serviceAdminService.archiveService` per id)
- **ServiceEdit handler** updated with 7 sub-nav navigate callbacks
- **8 new route render blocks** added: each screen wired with full async handlers that call `serviceCatalogService` methods; since no repos are injected, all calls return the "not configured" error shown in the screen's error state

### 2.7 Test file — `__tests__/w42ServiceCatalogExtras.test.tsx`

78 tests across 13 describe blocks:

| Describe | Tests |
|----------|-------|
| `parseImportCsv` — pure function | 10 |
| `serviceCatalogService.readCategories` | 3 |
| `serviceCatalogService.saveBookingRules` | 3 |
| `ServiceCategoriesScreen` | 6 |
| `ServiceBulkImportScreen` | 6 |
| `ServicePricingScreen` | 5 |
| `ServiceAddOnsScreen` | 6 |
| `ServiceSeasonalRulesScreen` | 5 |
| `ServicePhotosScreen` | 6 |
| `ServiceBookingRulesScreen` | 6 |
| `ServiceVisibilityScreen` | 6 |
| `routes.ts — W42 service catalog routes` | 16 |
| **Total** | **78** |

---

## 3. Test Coverage Summary

| Suite | Tests |
|-------|-------|
| Domain model (types only — no runtime tests needed) | — |
| `parseImportCsv` utility | 10 |
| `serviceCatalogService` methods | 6 |
| 8 new screen components | 46 |
| routes.ts W42 routes | 16 |
| **New tests this week** | **78** |
| **Cumulative** | **2902** |

---

## 4. What Was Descoped from the W42 Spec

| Spec item | Reason | Tracked as |
|-----------|--------|------------|
| Real Firestore repository adapters for all 7 catalog domains | W42 is a UI-first pass; adapters land with the W43 booking ops backend sprint to keep scope bounded | W42-DEBT-1 |
| Photo upload (expo-image-picker + Firebase Storage) | Native picker integration blocked on device test infra not yet available in this phase; upload button is a UI stub | W42-DEBT-2 |
| Export CSV file download / share sheet | In-memory CSV string computed but not written to file system or shared; wires in W43 with platform file write | W42-DEBT-3 |

---

## 5. Defects and Post-Ship Fixes

| Issue | Root cause | Fix |
|-------|-----------|-----|
| `ServiceListScreen` block corrupted in AppNavigatorShell | `replace_string_in_file` matched wrong anchor when inserting W42 route blocks; the `return (` + opening `<ServiceListScreen` were dropped | Detected via `grep_search` finding 2 matches; full block restored with `replace_string_in_file` |
| `AdminDataTableColumn<T>` columns had `key` + `label` instead of `header` | W42 code used an earlier draft API shape; correct shape has only `header` + `render` + optional `flex` | Removed `key` and renamed `label` → `header` in AdminScreens.tsx and ServiceCategoriesScreen.tsx |
| `AdminDataTable` call used `getRowId` instead of `keyExtractor` | Same draft-vs-final mismatch | Replaced `getRowId` with `keyExtractor` |
| `BulkActionBar` called with `onAction(id)` + `actions[].id` | Actual API is `onPress: () => void` per action; no `id` or `onAction` | Rewrote actions array with inline `onPress` callbacks |
| `BulkConfirmModal` called with `message` + `submitting` props | Actual props are `body` + no `submitting` | Renamed `message` → `body`, removed `submitting` |
| `ServiceListScreen` props mismatch (`errorMessage`/`servicesList` vs `error`/`services`) | Prop names in the screen definition drifted from what the shell passed | Aligned to `error`/`services` throughout |
| `AdminToggleRow` called with `onChange` + `testID` | Actual API uses `onToggle`; no `testID` | Fixed in `ServiceVisibilityScreen.tsx` |
| `createAddon` called with `serviceId` in input | `CreateServiceAddonInput` (derived from `ServiceAddon`) has no `serviceId` field — add-ons are tenant-scoped, not service-scoped | Removed `serviceId`, added required `currency` field |
| `ROUTES` import in test file | Routes export is named `appRoutes`, not `ROUTES` | Changed import to `{ appRoutes as ROUTES }` |

---

## 6. Debt Register

New items added to [DEBT_REGISTER.md](DEBT_REGISTER.md). No prior-week items were closed by W42 work (all W41 debts target W43; no other carry-in items were due at W42).

| ID | Description | Severity | Target | Status |
|----|-------------|----------|--------|--------|
| W42-DEBT-1 | All 7 `serviceCatalogService` repository ports are stubs — real Firestore adapters not yet built; every catalog method returns `"not configured"`. Covers categories, add-ons, seasonal rules, booking rules, visibility, price overrides, media list. | High | W43 | open |
| W42-DEBT-2 | `ServicePhotosScreen.onUpload` is a UI stub — no expo-image-picker or Firebase Storage integration. Upload button renders correctly; real storage wiring deferred. | Medium | W43 | open |
| W42-DEBT-3 | `onExportCsv` in AppNavigatorShell computes a CSV string in memory but does not write to the file system or invoke a native share sheet. | Low | W43 | open |

---

## 7. Looking Ahead — W43

W43 = **Booking Operations** per PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md §Week 43:
master calendar, drag-to-reschedule, booking detail with audit, manual booking creation, block time, override/force-book, no-show marking, cancellation handling, rebook/reschedule.

**Carry-in from debt register (due at W43):**
- W41-DEBT-1 (staff invite backend)
- W41-DEBT-2 (commission service backend)
- W41-DEBT-4 (role-change audit write)
- W41-DEBT-5 (schedule editor write UI)
- W41-DEBT-6 (qualification/service-mapping editor)
- W42-DEBT-1 (all 7 catalog repository adapters)
- W42-DEBT-2 (photo upload integration)
- W42-DEBT-3 (export CSV file write)

W43 opens with a **mock-first prototype gate (Mon–Tue)** before wiring to live `bookingService` + `slotEngine` (per spec §W43 rationale). The catalog repository adapters (W42-DEBT-1) are the prerequisite for the ServiceEdit sub-nav to be functional end-to-end.
