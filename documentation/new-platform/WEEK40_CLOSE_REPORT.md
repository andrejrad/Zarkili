# Week 40 Close Report — Phase 3: Location Dashboard, Settings & Resources

**Date closed:** 2026-05-12
**Week:** W40
**Phase:** Phase 3 — Admin Console
**Jest baseline entered:** 2,717 tests / 163 suites
**Jest baseline closed:** 2,760 tests / 164 suites (+43 tests, +1 suite)
**TypeScript:** `tsc --noEmit` — 0 errors

---

## 1. Objectives

W40 delivered the location operations cluster of the admin console — Batch N from the Phase 3 figma prompts (N.1–N.6). This covers:

- **N.1.1 LocationOverviewScreen** — multi-location KPI table (owner sees all their locations)
- **N.1.2 LocationDashboardScreen** — per-location KPI tiles + today's appointment list
- **N.2 LocationSettingsScreen** — address, contact, operating hours, US holiday calendar, ADA accessibility flags
- **N.3 LocationServiceOverridesScreen** — per-location catalogue price/availability overrides
- **N.4 ResourceManagementScreen** — rooms, chairs, equipment with tab navigation and maintenance banner
- **N.5 AdminWalkInQueueScreen** — real-time walk-in queue, seat and no-show actions
- **N.6 DailyCloseScreen** — denomination cash count, end-of-day checklist, variance display, tips-by-staff, submit flow

W40 also closed **W38-DEBT-10** (admin console first-run coach-mark tour).

---

## 2. New Files Created

### Service layer

| File | Purpose |
|------|---------|
| `src/app/admin/locationAdminService.ts` | `LocationAdminService` interface (20 methods) + full type set: `LocationKpi`, `TodayAppointment`, `ResourceType`, `ResourceStatus`, `ResourceItem`, `CreateResourceInput`, `UpdateResourceInput`, `WalkInStatus`, `WalkInQueueEntry`, `DenominationCount`, `TipsStaffRow`, `DailyCloseReport`, `HolidayEntry`, `LocationServiceOverride`, `LocationAccessibilityFlags`. `createLocationAdminService()` stub factory. |

### Admin screens (7 screens)

| Screen file | Route | Spec |
|-------------|-------|------|
| `src/app/admin/LocationOverviewScreen.tsx` | `LocationOverview` | N.1.1 — multi-location table with per-row KPIs and location status badge |
| `src/app/admin/LocationDashboardScreen.tsx` | `LocationDashboard` | N.1.2 — 5 KPI tiles + colour-coded appointment list |
| `src/app/admin/LocationSettingsScreen.tsx` | `LocationSettings` | N.2 — address, phone/email, 7-day operating hours grid, federal holiday switches, custom closures, 3 ADA toggles |
| `src/app/admin/LocationServiceOverridesScreen.tsx` | `LocationServiceOverrides` | N.3 — active overrides (warm-oat tint) vs catalog-default grouping with strikethrough base price |
| `src/app/admin/ResourceManagementScreen.tsx` | `ResourceManagement` | N.4 — tabbed Rooms/Chairs/Equipment, in-maintenance banner |
| `src/app/admin/AdminWalkInQueueScreen.tsx` | `AdminWalkInQueue` | N.5 — active queue + completed entries, seat/no-show action buttons, wait-duration display |
| `src/app/admin/DailyCloseScreen.tsx` | `DailyClose` | N.6 — denomination counter with +/−, 3-item checklist, variance row, tips-by-staff section, submit gating |

### Debt closure (W38-DEBT-10)

| File | Purpose |
|------|---------|
| `src/app/admin/AdminFirstRunTourOverlay.tsx` | 5-step coach-mark tour for first-time admin users. Uses `CoachMark` primitive. Persists `hasSeenAdminTour: true` to `users/{userId}/tenantPrefs/{tenantId}` via `setDoc({merge:true})`. |

---

## 3. Modified Files

### `src/app/admin/AdminPatterns.tsx`
- `AdminSectionRow` — added `testID?: string` prop (passed to Pressable container)
- `AdminKpiTile` — already had `testID?` and `nullLabel?` from W40 session start (added mid-session prior to this close report)

### `src/app/admin/TenantSettingsShellScreen.tsx`
- Added 6 new `TenantSettingsSection` keys: `'locations'`, `'location-settings'`, `'location-service-overrides'`, `'resources'`, `'admin-walk-in-queue'`, `'daily-close'`
- Added "Locations & operations" settings group with 6 rows

### `src/app/navigation/AppNavigatorShell.tsx`
**Imports (lines ~62–70):**
- 7 new screen imports + `AdminFirstRunTourOverlay` + `LocationAdminService` type import from `locationAdminService`
- `doc`, `getDoc` added to `firebase/firestore` import

**Props:**
- `locationAdminService?: LocationAdminService | null` added to `AppNavigatorShellProps`

**NO_TAB_ROUTES (line ~450):**
- 7 new route names: `"LocationOverview"`, `"LocationDashboard"`, `"LocationSettings"`, `"LocationServiceOverrides"`, `"ResourceManagement"`, `"AdminWalkInQueue"`, `"DailyClose"`

**State (lines ~820–880):**
- 35 new state variables for location list, dashboard, settings, overrides, resources, walk-in queue, daily close, and admin tour
- `adminTourChecked` / `adminTourVisible` state for first-run tour
- One-time Firestore check `useEffect` that reads `users/{userId}/tenantPrefs/{tenantId}.hasSeenAdminTour` and sets `adminTourVisible`

**Loaders (after `loadBillingRefunds`):**
- 7 loaders: `loadLocationList`, `loadLocationDashboard(locationId)`, `loadLocationSettings(locationId)`, `loadLocationOverrides(locationId)`, `loadLocationResources(locationId)`, `loadWalkInQueue(locationId)`, `loadDailyClose(locationId)`

**Main useEffect:**
- 7 new loader triggers (route-name guarded, with `activeLocationId` check)
- `loadLocationList` through `loadDailyClose` added to dependency array

**TenantSettingsShell sectionRouteMap:**
- 6 new entries mapping `TenantSettingsSection` keys to route names

**Route render blocks:**
- `OwnerHome` block wrapped in Fragment + `AdminFirstRunTourOverlay` rendered when `adminTourChecked && adminTourVisible`
- 7 new `if (activeRoute.name === "...")` blocks for all W40 routes

---

## 4. Test Coverage

**New test file:** `__tests__/w40LocationAdmin.test.tsx`

| Suite | Tests |
|-------|-------|
| LocationOverviewScreen | 6 |
| LocationDashboardScreen | 4 |
| LocationSettingsScreen | 4 |
| LocationServiceOverridesScreen | 4 |
| ResourceManagementScreen | 5 |
| AdminWalkInQueueScreen | 6 |
| DailyCloseScreen | 8 |
| AdminFirstRunTourOverlay | 6 |
| **Total** | **43** |

All 43 pass. Full suite: **2,760 / 164** (all green).

---

## 5. Debt Register

### Closed this week

| ID | Description | Closed by |
|----|-------------|-----------|
| W38-DEBT-10 | Admin console first-run coach-mark tour missing | `AdminFirstRunTourOverlay.tsx` — see [DEBT_REGISTER.md](DEBT_REGISTER.md) |

### Deferred (no new debt opened)

No new debt items were opened in W40. Backend wiring for all 7 location service methods remains stub-only and will be progressively replaced in W43 (Booking Operations) and Phase 3.5 (Release Readiness).

---

## 6. Architecture Notes

### Location ID flow
All location-specific routes receive `activeLocationId` from AppNavigatorShell state. `LocationOverviewScreen.onSelectLocation(locationId)` sets this state and navigates to `LocationDashboard`. All per-location loaders accept `locationId` as a parameter (not a closure variable) to ensure correct async capture.

### Admin tour persistence path
`users/{userId}/tenantPrefs/{tenantId}` — subcollection per tenant prevents cross-tenant flag bleed. Uses `setDoc(..., {merge: true})` so the document can accumulate future preference flags without overwriting unrelated fields.

### Service method signatures (key notes)
- `updateLocation(locationId, tenantId, input)` — three-arg because tenantId is needed for the Firestore path
- `addWalkIn(locationId, clientName, partySize, requestedServiceName, requestedStaffName)` — five explicit args (no object shorthand) matching the interface
- `updateWalkInStatus(entryId, status: WalkInStatus, assignedStaffName: string | null)` — entry-scoped, location inferred from the entry document
- `submitDailyClose(locationId, dateIso, submittedByName)` — submitter name recorded for audit trail

---

## 7. Week 41 Preview

W41 = **Staff Management cluster** (Phase 3 Batch O):
- Staff list with role badges and status indicators
- Staff detail / edit screen (bio, certifications, specialties)
- Staff schedule screen (weekly availability grid)
- Staff performance metrics (bookings, revenue, cancellations)
- Commission settings per-staff
- Staff invite and onboarding flow

Carry-in: none (DEBT_REGISTER clean at W40 close).
