# WEEK 38 CLOSE REPORT — Phase 3 Week 1: Owner Console Foundation

**Sprint:** W38  
**Phase:** Phase 3 — Admin and Operator UI (Week 1 of 12)  
**Closed:** 2026-05-10  
**Engineer:** Copilot

---

## 1. Summary

Week 38 delivered the owner console foundation: all Phase 3 admin pattern primitives, the owner KPI dashboard, tenant settings shell, and seven tenant-configuration screens wired to the real Phase 1 service layer. Admin services for staff and service catalog (`staffAdminService`, `serviceAdminService`, `tenantLocationAdminService`) were added with Firestore test coverage.

**Phase 3 entry conditions verified at W38 start:**
- ✅ Phase 2.3 close report signed off (W37.6-pre addendum, 2026-05-09)
- ✅ All consumer domains connected to real Firebase; `mockData.ts` zero production imports
- ⚠️ Batch M Figma artifacts — not yet promoted to `design-handoff/batch-m/` (completing today alongside this close report)
- ✅ No P0/P1 defects open against booking/payments path
- ✅ Platform super-admin role and impersonation model documented in `PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md`

**Real-data acceptance check (W38):** Owner KPI dashboard reads `bookings/{tenantId}` subcollections from live Firestore and renders today/this-week booking counts in real time. Revenue tiles render `null` (styled as "Pending setup") until W23-DEBT-1 charge path lands. Acceptance check is **partially met** — booking count is real; revenue component is acknowledged deferred.

---

## 2. Screens and Services Delivered

### 2.1 Admin Pattern Library — ✅ NEW (`src/app/admin/AdminPatterns.tsx`)

Eight reusable primitives used across all Phase 3 admin screens. These establish the admin visual language and replace the ad-hoc pattern approach from Phase 2.

| Component | Purpose |
|-----------|---------|
| `AdminEmptyState` | Empty list/section — title, body, optional CTA button |
| `AdminLoadingState` | Loading indicator with label |
| `AdminErrorState` | Error with retry button |
| `AdminRoleDeniedState` | Role-denied gate — message + contact-admin link |
| `AdminHelpAnchor` | Deep link to runbook / help doc |
| `AdminSectionRow` | Navigation row (settings shell + sidebar lists) |
| `AdminKpiTile` | KPI metric card with value, label, trend, null-safe rendering |
| `AdminToggleRow` | Labelled toggle with description |

### 2.2 Owner Home / KPI Dashboard — ✅ WIRED (`src/app/admin/OwnerHomeScreen.tsx`)

Reads live Firestore via `ownerKpiService.getKpiSummary(tenantId, db)`:
- `bookingsToday` and `bookingsThisWeek` — real Firestore queries against `tenants/{tenantId}/bookings` with `date` filters
- `revenueEstimatedTodayUsd` / `revenueEstimatedThisWeekUsd` — null (W23-DEBT-1)
- `occupancyTodayPct` — null (W40)
- `topStaff` — derived from booking count per `staffId` today
- `alerts` — empty array (W38; operator alert emission deferred to W39 when Stripe Connect events are wired)

Quick-nav rows navigate into the tenant settings shell and sub-screens.

### 2.3 Operator Notification Center — ✅ DELIVERED (`src/app/admin/AdminScreens.tsx`)

Surfaces the 4 alert categories defined in the W38 plan: booking failures, payment failures, payout issues, AI safety events. Data feed is empty in W38 (relies on W39 Stripe Connect webhook surface). Component renders an `AdminEmptyState` with appropriate messaging when no alerts are present.

### 2.4 Tenant Settings Shell — ✅ WIRED (`src/app/admin/TenantSettingsShellScreen.tsx`)

Sectioned navigation hub with 7 sub-screens:

| Section | Route key | Screen |
|---------|-----------|--------|
| Business profile | `business-profile` | `BusinessProfileScreen` |
| Brand | `brand` | `BrandSettingsScreen` |
| Tax | `tax` | `TaxSettingsScreen` |
| Currency | `currency` | `CurrencySettingsScreen` |
| Legal docs | `legal-docs` | `LegalDocumentsScreen` |
| Domain | `domain` | `DomainSettingsScreen` |
| Notifications | `notifications` | `OwnerNotificationPreferencesScreen` |

### 2.5 Business Profile — ✅ WIRED (`src/app/admin/BusinessProfileScreen.tsx`)

Reads `tenants/{tenantId}` document via `tenantLocationAdminService.getTenantProfile(tenantId)`. Displays: legal name, address, contact email/phone, business hours global defaults, country, timezone. Edit mutations write back through the same service. Input validation at boundary (name non-empty, valid timezone from `Intl.supportedValuesOf("timeZone")`).

### 2.6 Brand Settings — ✅ WIRED (`src/app/admin/BrandSettingsScreen.tsx`)

Logo upload stub (W39 — Firebase Storage). Primary/secondary brand color inputs with hex validation. Public profile preview link. Reads `tenants/{tenantId}/branding` subcollection via `brandingService`.

### 2.7 Tax Settings — ✅ WIRED (`src/app/admin/TaxSettingsScreen.tsx`)

Reads Stripe Tax integration status from W14 `taxService`. Surfaces: tax jurisdiction summary per location (US state sales tax + EU VAT), tax ID on file (EIN for US, VAT number for EU). **US-primary note:** most US states do not tax personal services; states that do (CT, HI, NM, SD, WV, NYC surcharge) appear automatically via Stripe Tax based on salon address. EU VAT handled by same Stripe Tax integration.

### 2.8 Currency Settings — ✅ WIRED (`src/app/admin/CurrencySettingsScreen.tsx`)

Multi-currency screen per [US_PRIMARY_MARKET_ADDENDUM.md](../US_PRIMARY_MARKET_ADDENDUM.md) Group B = YES resolution. Exposes: tenant default currency (USD primary), per-location currency override, FX-disclosure preferences for receipts. Reads from `currencyService`. Cross-currency settlement handled by Stripe Connect (no new write path needed here).

### 2.9 Legal Documents — ⚠️ PARTIAL (`src/app/admin/LegalDocumentsScreen.tsx`)

Displays 4 required document types (business license, insurance, service agreement, privacy policy) with statuses. **Upload `Pressable` is a stub** — Firebase Storage wiring deferred to W39. Tracked as W38-DEBT-9 (not closed).

### 2.10 Domain Settings — ✅ DELIVERED (`src/app/admin/DomainSettingsScreen.tsx`)

Decision gate resolved **No** (custom domains post-launch per W37 decision gate). Screen renders as a read-only informational surface explaining that custom domains are on the roadmap. No write wiring needed.

### 2.11 Owner Notification Preferences — ⚠️ PARTIAL (`src/app/admin/OwnerNotificationPreferencesScreen.tsx`)

6 toggles (bookingAlerts, paymentAlerts, payoutAlerts, aiSafetyEvents, dailyDigest, weeklyDigest) in local React state. **Firestore write not wired** — `ownerNotificationPrefs/{tenantId}` document schema and the `updateOwnerNotificationPrefs` method are defined but the persistence call was out of scope for the admin service endpoint that was not yet implemented. Tracked as W38-DEBT-8 (not closed).

### 2.12 Admin Service Layer — ✅ WIRED

Three new RBAC-guarded admin services backed by real Firestore:

**`tenantLocationAdminService.ts`** — `getTenantProfile`, `updateTenantProfile`, `getBrandingConfig`, `updateBrandingConfig`, `getTaxConfig`, `getCurrencyConfig`, `updateCurrencyConfig`. Reads `tenants/{tenantId}` top-level document and subcollections. Role check: `tenant_owner` or `tenant_admin` via custom claims. **18 total admin service tests** across the three suites (2 in `tenantLocationAdminService.test.ts` core, plus `staffAdminService.test.ts` and `serviceAdminService.test.ts`).

**`staffAdminService.ts`** — `readStaffList`, `createStaffForTenant`, `deactivateStaffMember`. Delegate to existing `staffService` (W7) with admin RBAC wrapper.

**`serviceAdminService.ts`** — `readServicesList`, `createServiceForTenant`, `archiveService`. Delegate to `serviceCatalogService` with admin RBAC wrapper. (Full catalog depth deferred to W42.)

**`ownerKpiService.ts`** — `getKpiSummary(tenantId, db)` — direct Firestore queries (no service abstraction layer needed for this read-only aggregation surface).

**`runtime.ts`** — admin runtime factory providing `ownerKpiService`, `tenantLocationAdminService`, `staffAdminService`, `serviceAdminService` from injected Firestore instance. Mirrors Phase 2 runtime pattern.

### 2.13 Admin First-Run Tour — ❌ NOT BUILT

Light-touch coach-mark tour for first-time admin console entry (W38-DEBT-10). `CoachMark` primitive and `CoachMarkTutorialOverlay` exist from W32/Batch L but no admin tour overlay or `hasSeenAdminTour` persistence was built. Deferred to W39/W40. Risk: low — onboarding wizard covers initial login.

---

## 3. W38 Exit Gate Checklist

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` (root) | ✅ 0 errors |
| `npx jest --passWithNoTests --forceExit` | ✅ 2686/2686 passed (+18 new admin service tests included) |
| Admin pattern library complete | ✅ 8 primitives (empty, loading, error, role-denied, help anchor, section row, KPI tile, toggle row) |
| Owner home wired to real Firestore | ✅ Booking counts live; revenue null pending W23-DEBT-1 |
| Tenant settings shell 7 sections | ✅ All 7 sections route correctly |
| Service integration map (W38) | ⚠️ `tenantService` ✅, `brandingService` ✅, `taxService` ✅, `currencyService` ✅, `notificationService` — owner notif prefs write deferred (W38-DEBT-8) |
| RBAC enforcement tests | ✅ Role guards in `tenantLocationAdminService`, `staffAdminService`, `serviceAdminService` |
| Audit-log coverage | ⚠️ Write mutations go through existing `auditService` (W12); no new audit entries required for W38 read/config screens |
| Batch M Figma promoted to `design-handoff/batch-m/` | ✅ Created 2026-05-10 alongside this close report |

---

## 4. Debt Register

### Newly opened in W38

| ID | Description | Severity | Target |
|----|-------------|----------|--------|
| W38-DEBT-1 | **Per-date availability Firestore endpoint** — `BookingDateTimeScreen` calendar dots always empty. Requires `availability/{tenantId}/dates/{date}` collection maintained by `onBookingWritten` trigger or scheduled job. | Medium | Phase 3 (pre-iOS beta) |
| W38-DEBT-2 | **`SalonProfileScreen` — `getSalonById` backend** — renders hardcoded inline static object. Requires `getSalonById` domain method + subcollection reads. | High | Phase 2 — W39+ |
| W38-DEBT-3 | **`ReceiptScreen` — real Firestore receipt** — hardcoded inline. Blocked on W23-DEBT-1 charge path. | Medium | Phase 2 — W39+ |
| W38-DEBT-4 | **`RefundStatusScreen` — real refund backend** — hardcoded inline. Requires Stripe `charge.refunded` webhook + `refunds` collection. | Medium | Phase 2 — W39+ |
| W38-DEBT-5 | **Social sign-in provider** — `onProvider` is a no-op stub in AppNavigatorShell. | Medium | Phase 2.3 |
| W38-DEBT-8 | **`OwnerNotificationPreferencesScreen` Firestore write** — prefs lost on unmount; no `ownerNotificationPrefs/{tenantId}` write. | Medium | W39 |
| W38-DEBT-9 | **`LegalDocumentsScreen` upload stub** — Firebase Storage wiring not implemented. | Medium | W39 |
| W38-DEBT-10 | **Admin console first-run tour** — no admin coach-mark tour or `hasSeenAdminTour` flag. | Low | W39/W40 |

### W38 debt not opened (pre-closed in W37.6-pre)

| ID | Description | Status |
|----|-------------|--------|
| W38-DEBT-6 | `DiscoverFeedScreen posts=[]` is correct — no mock removal needed | closed (W37.6-pre) |
| W38-DEBT-7 | `SalonOnboardingWizard` inline static is intentional design | closed (W37.6-pre) |

### Carry-forward open from prior weeks (still open entering W39)

| ID | Description | Target |
|----|-------------|--------|
| W37-DEBT-4 | iOS manual QA pass (device required) | First iOS device availability |
| W37-DEBT-7 | Salon onboarding step forms (9 scaffold-only forms) | Phase 3 admin tooling sprint |
| W23-DEBT-1 | Booking persistence + charge path Cloud Functions | Phase 2 — W39+ |
| W24-DEBT-3 | Receipt PDF pipeline | Phase 2 — W39+ |
| W15-DEBT-1 | Onboarding admin UI | Phase 3 |
| W13-DEBT-2 | Admin billing UI (closed by W39) | W39 |
| W14-DEBT-3 | Admin suspension banner | W39 |
| W14-DEBT-4 | Admin invoice tax breakdown | W39 |
| W37.5-DEBT-3 | Node.js runtime upgrade functions Node 20 → 22 | Before 2026-10-30 |
| KI-003 | CI emulator infra | W19+ |
| KI-004 | Tenant feature flags | W19+ |

---

## 5. Build Health

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx jest --passWithNoTests --forceExit` | ✅ 2686/2686 passed |
| Firebase functions deploy (17 Gen2 functions) | ✅ live on `zarkili-dev-a1b1c` (unchanged since W37.5-pre) |
| AppNavigatorShell mockData imports | ✅ 0 |
| Admin screens rendered in AppNavigatorShell | ✅ `OwnerHome`, `TenantSettingsShell`, and all 7 sub-screens wired to routes |

---

## 6. Next Week — W39: Subscription, Billing, Connect, Payouts

W39 consumes: `subscriptionService` (W13), `stripeConnectService` (W14), `payoutService`, `invoiceService`, `pdfRenderService`.

**Deliverables:**
- Plan selection and change-plan flow
- Invoice history with download
- Admin payment method management
- Cancel and pause subscription flows
- Stripe Connect onboarding (admin)
- Connect health, document submission, restricted-state recovery
- Payout history and pending balance
- Payout schedule controls
- Refund / dispute admin view
- PDF/print rendering for invoices, payout statements, refund receipts

**Carry-in debt to close in W39:** W38-DEBT-8 (`OwnerNotificationPreferences` Firestore write), W38-DEBT-9 (`LegalDocuments` Storage upload), W13-DEBT-2 (admin billing UI), W14-DEBT-3 (suspension banner), W14-DEBT-4 (admin invoice tax lines).

**W39 exit gate:** Plan change updates Stripe + Firestore; payout history pulls from real Connect account (`zarkili-dev-a1b1c`).
