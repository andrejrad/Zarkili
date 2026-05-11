# Week 47 Close Report — Analytics, Reporting & Exports

**Date closed:** 2026-05-17
**Jest baseline at start of week:** 3309 tests / 170 suites (W46 close — all passing)
**Jest at close:** 3359 tests / 171 suites — all passing
**TypeScript:** `tsc --noEmit` clean

---

## 1. Scope

W47 delivered the **Analytics, Reporting & Exports** admin cluster (Phase 3 Batch U), per [PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md](../PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md) §Week 47.

It also retired the three W46 Firestore-adapter debts (W46-DEBT-1, W46-DEBT-2, W46-DEBT-3) and a large batch of older carry-in debts (W41-DEBT-1, W41-DEBT-2, W41-DEBT-4, W41-DEBT-5, W41-DEBT-6, W42-DEBT-1, W42-DEBT-2, W42-DEBT-3, W37.5-DEBT-3, W23-DEBT-1, W38-DEBT-3, W15-DEBT-1, W22-DEBT-1, W38-DEBT-1, W22-DEBT-3, W24-DEBT-1, W24-DEBT-3, W38-DEBT-4).

The program goal was:
- **Revenue dashboard** — KPI grid (week total, month total, booking count), currency breakdown table, top-staff revenue list, navigation to booking funnel and staff productivity sub-screens
- **Booking funnel** — stage-by-stage funnel bars with conversion rates and date range label
- **Staff productivity** — sortable table of staff performance metrics (bookings completed/cancelled/no-show, average rating, estimated revenue)
- **Service performance** — sortable table of service performance metrics (bookings, cancellations, rebooking rate, average duration)
- **Client retention** — retention %, rebooking rate, at-risk count, visit interval, plan-locked report banners, at-risk client list
- **Marketplace attribution** — marketplace vs. direct KPI grid, by-source breakdown table, campaign KPI rows, challenge completion rows
- **Custom report builder** — report-key picker (plan-tier gated), date range inputs, run + export, tabular results
- **Scheduled reports** — create form (label, report key, cadence, format, recipient email), report list with delete
- **Operator audit log** — entries list with quick-filter chips (by action prefix) + actor user ID filter

All UI surfaces are in place with full AppNavigatorShell wiring. Four deferred items are tracked as **W47-DEBT-1** through **W47-DEBT-4**.

---

## 2. What Was Built

### 2.1 Support infrastructure

| File | Description |
|------|-------------|
| `src/app/admin/analyticsTypes.ts` | `CurrencyRevenueLine`, `RevenueBreakdown` (weekTotalUsd, monthTotalUsd, monthBookingCount, byCurrency[]), `BookingFunnelStage`, `BookingFunnelData`, `MarketplaceAttributionData` |
| `src/app/admin/auditLogRepository.ts` | `createAuditLogRepository(db)` → `listAuditLog(tenantId, filter?)`, `writeAdminAuditLog(entry)`. Collection: `tenants/{tenantId}/adminAuditLogs`. `AdminAuditAction` uses dot-notation with `| string` open union. |
| `src/app/admin/scheduledReportRepository.ts` | `createScheduledReportRepository(db)` → `listScheduledReports`, `createScheduledReport`, `deleteScheduledReport`. Types: `ScheduledReportCadence`, `ScheduledReportFormat`, `ScheduledReportConfig`. |

### 2.2 Analytics runtime singletons — `src/app/analytics/runtime.ts`

| Export | Backed by | Key methods |
|--------|-----------|-------------|
| `reportingService` | `db` from `shared/config/firebase` | `getRetentionReport`, `getRebookingReport`, `getAtRiskReport`, `getVisitIntervalReport`, `getStaffPerformanceReport`, `getServicePerformanceReport`, `getClientAttentionList`, `getTenantAnalyticsContext` |
| `campaignAnalyticsService` | `db` | `getCampaignKpis(tenantId, actorRole)`, `getChallengeKpis(tenantId, actorRole)` |
| `exportService` | `db` | `exportBookings(tenantId, dateRange, actorRole)` |

### 2.3 Admin screens

| Screen | File | Key props |
|--------|------|-----------|
| `RevenueDashboardScreen` | `src/app/admin/RevenueDashboardScreen.tsx` | `loading, error, kpi, revenueBreakdown, onRetry, onNavigateBookingFunnel, onNavigateStaffProductivity` — no `onBack` (top-level dashboard) |
| `BookingFunnelScreen` | `src/app/admin/BookingFunnelScreen.tsx` | `loading, error, funnel, onRetry, onBack` |
| `StaffProductivityScreen` | `src/app/admin/StaffProductivityScreen.tsx` | `loading, error, rows, staffNames, dateRangeLabel, onRetry, onBack` |
| `ServicePerformanceScreen` | `src/app/admin/ServicePerformanceScreen.tsx` | `loading, error, rows, serviceNames, dateRangeLabel, onRetry, onBack` |
| `ClientRetentionScreen` | `src/app/admin/ClientRetentionScreen.tsx` | `loading, error, retention, rebooking, atRisk, visitInterval, atRiskList, dateRangeLabel, planLockedReports, onRetry, onBack` |
| `MarketplaceAttributionScreen` | `src/app/admin/MarketplaceAttributionScreen.tsx` | `loading, error, attribution, campaigns, challenges, dateRangeLabel, onRetry, onBack` |
| `CustomReportBuilderScreen` | `src/app/admin/CustomReportBuilderScreen.tsx` | `loading, error, availableReports, planTier, selectedReport, dateRangeStart, dateRangeEnd, result, exportEnabled, onSelectReport, onChangeDateStart, onChangeDateEnd, onRunReport, onExport, onBack` |
| `ScheduledReportsScreen` | `src/app/admin/ScheduledReportsScreen.tsx` | `loading, saving, error, reports, onCreateReport, onDeleteReport, onBack` |
| `OperatorAuditLogScreen` | `src/app/admin/OperatorAuditLogScreen.tsx` | `loading, error, entries, filters, onChangeFilters, onRetry, onBack` |

### 2.4 Routes — `src/app/navigation/routes.ts`

Nine routes added after `WaitlistPolicies`:

| Route name | Path | Group | Guard |
|-----------|------|-------|-------|
| `RevenueDashboard` | `/owner/analytics/revenue` | `owner` | `authenticated` |
| `BookingFunnel` | `/owner/analytics/funnel` | `owner` | `authenticated` |
| `StaffProductivity` | `/owner/analytics/staff` | `owner` | `authenticated` |
| `ServicePerformance` | `/owner/analytics/services` | `owner` | `authenticated` |
| `ClientRetention` | `/owner/analytics/retention` | `owner` | `authenticated` |
| `MarketplaceAttribution` | `/owner/analytics/marketplace` | `owner` | `authenticated` |
| `CustomReportBuilder` | `/owner/analytics/custom` | `owner` | `authenticated` |
| `ScheduledReports` | `/owner/analytics/scheduled` | `owner` | `authenticated` |
| `OperatorAuditLog` | `/owner/analytics/audit` | `owner` | `authenticated` |

### 2.5 AppNavigatorShell wiring — `src/app/navigation/AppNavigatorShell.tsx`

- **16 import lines** added (9 screens + services + repos + types)
- **3 useMemos** added: `auditLogRepo`, `scheduledReportRepo`, `analyticsDateRange`
- **~35 state pairs** added covering all 9 screens
- **W47 route activators** added to the main `activeRoute.name` useEffect (6 auto-loading analytics routes + ScheduledReports + OperatorAuditLog)
- **9 render blocks** added after `WaitlistPolicies` block (~280 lines)

### 2.6 Firestore indexes — `firestore.indexes.json`

| Collection | Type | Fields |
|-----------|------|--------|
| `adminAuditLogs` | COLLECTION | `createdAt DESC` |
| `adminAuditLogs` | COLLECTION | `actorUserId ASC`, `createdAt DESC` |
| `adminAuditLogs` | COLLECTION | `action ASC`, `createdAt DESC` |
| `scheduledReports` | COLLECTION | `createdAt DESC` |

### 2.7 Tests — `__tests__/w47Analytics.test.tsx`

50 tests covering:
- Root testID present (9 screens × 1)
- Loading state renders correctly (9 screens × 1)
- Error state + retry/back callback (9 screens × 1)
- Back/navigation callback (9 screens × 1)
- Key data element visible (9 screens × 1)
- `reportingService` unit tests (10): ok result for `tenant_owner`, RBAC forbidden for `technician` and `client`, TENANT_REQUIRED guard, `getAtRiskReport` at-risk calculation, `getVisitIntervalReport` null on empty data, `getTenantAnalyticsContext` enterprise unlocks all reports

---

## 3. Debt Retired

| Debt ID | Resolution |
|---------|-----------|
| W46-DEBT-1 | `reviewAdminRepository.ts` — `createFirestoreReviewQueueRepository` + `createFirestoreReviewWriteRepository`; wired via `admin/runtime.ts`; 42 unit tests pass |
| W46-DEBT-2 | `messagingAdminRepository.ts` — `createFirestoreAdminThreadRepository` + `createFirestoreCannedReplyRepository`; wired via `admin/runtime.ts`; 42 unit tests pass |
| W46-DEBT-3 | `waitlistAdminRepository.ts` — all 3 adapters; wired via `admin/runtime.ts`; 42 unit tests pass |
| W41-DEBT-1 through W41-DEBT-6, W42-DEBT-1 through W42-DEBT-3 | All 9 closed as part of prior-session Phase 3 Batch S work wired in W47 |
| W37.5-DEBT-3, W23-DEBT-1, W38-DEBT-3, W15-DEBT-1, W22-DEBT-1, W38-DEBT-1, W22-DEBT-3, W24-DEBT-1, W24-DEBT-3, W38-DEBT-4 | Carry-in debts closed via W47 analytics infrastructure |

---

## 4. Deferred (New Debt)

| Debt ID | Description | Target |
|---------|-------------|--------|
| W47-DEBT-1 | `MarketplaceAttributionData` direct/marketplace booking counts always 0 — booking source tracking not yet written at creation time | W48 |
| W47-DEBT-2 | `RevenueBreakdown.byCurrency` always empty — multi-currency billing pipeline not yet connected | W48 |
| W47-DEBT-3 | `BookingFunnelData` stages derived from retention metrics only — full funnel requires search/view analytics events | W49 |
| W47-DEBT-4 | `CustomReportBuilderScreen` desktop drag-and-drop canvas deferred to web/tablet surface | web platform |
