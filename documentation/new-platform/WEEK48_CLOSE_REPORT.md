# Week 48 Close Report — AI Admin & Marketplace Tenant Tools

**Date closed:** 2026-05-11
**Jest baseline at start of week:** 3359 tests / 171 suites (W47 close — all passing)
**Jest at close:** 3409 tests / 172 suites — all passing
**TypeScript:** `tsc --noEmit` clean
**Commit:** `7465548` — `feat(W48): AI admin + marketplace tenant tools — 8 screens, 50 tests`

---

## 1. Scope

W48 delivered the **AI Admin & Marketplace Tenant Tools** cluster (Phase 3 Batch V), per [PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md](../PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md) §Week 48.

W47-DEBT-1 and W47-DEBT-2 (booking source tracking, multi-currency revenue pipeline) were not resolved — both deferred to W49 as they require cross-cutting booking model changes. No carry-in debts were retired this week.

The program goal was:

**AI Admin (tenant_owner UI for AI feature governance):**
- **AI Toggles** — per-feature enable/disable across 5 groups (Booking, Client, Campaigns, Staff, Marketplace); pending-change tracking with explicit Save All
- **AI Budget Config** — global monthly cap input, per-feature cap inputs with usage progress bars and threshold colouring (green / amber / red), save flow
- **AI Suggestion Review Queue** — filterable (by kind: content / campaign / schedule / pricing / all) approval/rejection queue with bulk approve-all-pending; pending count summary strip
- **AI Usage Analytics** — 5-tile KPI row (tokens, cost, avg latency, incidents, blocks); usage-by-feature sorted by cost; safety incidents table with severity badges
- **AI Audit Log** — decision filter chips (All / Auto / Approved / Rejected / Overridden); actor/keyword text search; CSV export button; entry list with output snippet + safety flags

**Marketplace Tenant Tools:**
- **Marketplace Post Composer** — full creation form (title ≤ 80 chars, category dropdown, description 100–800 chars, tags max 10, price, duration, visibility toggle, available-for-booking toggle); live compliance checklist (5 checks); Publish disabled until all checks pass; Save Draft always available
- **Per-Post Performance** — post summary card (title, category, status badge, price); 5-tile KPI row (impressions, clicks, CTR, bookings, revenue); ratings section (avg rating, review count, 5-star %, low-rating %); recent bookings table
- **Anti-Theft Compliance Dashboard** — 3-tile KPI row (signals, confirmed, at-risk staff); anomaly signals list with risk score, staff/client attribution, status chip, Investigate / Escalate / Dismiss actions; empty clean-system state

All 8 surfaces are fully wired in AppNavigatorShell. Three deferred items are tracked as **W48-DEBT-1** through **W48-DEBT-3**.

---

## 2. What Was Built

### 2.1 Type modules

| File | Key exports |
|------|-------------|
| `src/app/admin/aiAdminTypes.ts` | `AiFeatureToggleConfig`, `AI_FEATURE_GROUPS` (5 groups), `AiSuggestionKind`, `AiSuggestionStatus`, `AiSuggestion`, `AiSuggestionFilter`, `AiSuggestionQueueSummary`, `AiUsageKpi`, `AiUsageByFeature`, `AiIncidentType`, `AiSafetyIncident`, `AiAuditDecision`, `AiAuditLogEntry`, `AiAuditFilter` |
| `src/app/admin/marketplaceAdminTypes.ts` | `MarketplacePostStatus`, `MarketplaceVisibility`, `MarketplacePost`, `CreateMarketplacePostInput`, `UpdateMarketplacePostInput`, `PostComplianceCheckResult`, `PostPerformanceMetrics`, `PostBookingRow`, `AntiTheftAnomalyType`, `AntiTheftSignalStatus`, `AntiTheftSignal`, `AntiTheftKpi` |

### 2.2 Service factories

#### `src/app/admin/aiAdminService.ts`

`createAiAdminService(db: Firestore)` — all methods RBAC-guard FORBIDDEN for `technician` and `client`, TENANT_REQUIRED guard on empty/null tenantId.

| Method | Collection | Notes |
|--------|-----------|-------|
| `getAiToggles(tenantId, actorRole)` | `tenants/{tenantId}/aiConfig/toggles` | reads single doc |
| `updateAiToggles(tenantId, actorRole, toggles[])` | same | setDoc merge |
| `listAiSuggestions(tenantId, actorRole, filter?)` | `tenants/{tenantId}/aiSuggestions` | where kind + status; client-side text search on inputSummary |
| `getAiSuggestionQueueSummary(tenantId, actorRole)` | same | pending count by status==pending query |
| `approveAiSuggestion(tenantId, actorRole, id, note?)` | same | updateDoc status→approved |
| `rejectAiSuggestion(tenantId, actorRole, id, note?)` | same | updateDoc status→rejected |
| `getAiUsageKpi(tenantId, actorRole)` | `tenants/{tenantId}/aiUsage/current` | reads single doc |
| `getAiUsageByFeature(tenantId, actorRole)` | `tenants/{tenantId}/aiUsage/current/byFeature` | subcollection |
| `listAiSafetyIncidents(tenantId, actorRole)` | `tenants/{tenantId}/aiSafetyIncidents` | ordered createdAt DESC |
| `listAiAuditLog(tenantId, actorRole, filter?)` | `tenants/{tenantId}/aiAuditLog` | where decision + text search |

Exports `AiAdminService` type.

#### `src/app/admin/marketplaceAdminService.ts`

`createMarketplaceAdminService(db: Firestore)` — same RBAC/TENANT guard pattern.

| Method | Collection | Notes |
|--------|-----------|-------|
| `listMarketplacePosts` | `tenants/{tenantId}/marketplacePosts` | |
| `getMarketplacePost` | same | single doc |
| `createMarketplacePost` | same | addDoc, returns created post with generated postId |
| `updateMarketplacePost` | same | updateDoc |
| `publishMarketplacePost` | same | updateDoc status→published, publishedAt set |
| `deleteMarketplacePost` | same | deleteDoc |
| `getPostPerformance` | `tenants/{tenantId}/postPerformance/{postId}` | |
| `getPostBookings` | `tenants/{tenantId}/bookings` | where marketplacePostId==postId |
| `getAntiTheftKpi` | `tenants/{tenantId}/antiTheftSignals` | aggregate confirmedCount, counts atRiskStaff |
| `listAntiTheftSignals` | same | ordered detectedAt DESC |
| `investigateAntiTheftSignal` | same | updateDoc status→confirmed + investigatedBy/At |
| `escalateAntiTheftSignal` | same | updateDoc status→confirmed |
| `dismissAntiTheftSignal` | same | updateDoc status→dismissed |

Also exports `checkPostCompliance(input): PostComplianceCheckResult` — a pure function (no Firestore), used both by the screen's live checklist and in tests.

Exports `MarketplaceAdminService` type.

### 2.3 Admin screens

| Screen | File | Key props | testID |
|--------|------|-----------|--------|
| `AiTogglesScreen` | `src/app/admin/AiTogglesScreen.tsx` | `loading, saving, toggles, pendingChanges, onToggle, onSaveAll, onBack` | `"ai-toggles-screen"` |
| `AiBudgetConfigScreen` | `src/app/admin/AiBudgetConfigScreen.tsx` | `loading, saving, error, budgetConfig, usageByFeature, onUpdateGlobalCap, onUpdateFeatureCap, onSave, onRetry, onBack` | `"ai-budget-config-screen"` |
| `AiSuggestionQueueScreen` | `src/app/admin/AiSuggestionQueueScreen.tsx` | `loading, saving, error, suggestions, summary, filter, onChangeFilter, onApprove, onReject, onApproveAllPending, onRetry, onBack` | `"ai-suggestion-queue-screen"` |
| `AiUsageAnalyticsScreen` | `src/app/admin/AiUsageAnalyticsScreen.tsx` | `loading, error, kpi, usageByFeature, incidents, onRetry, onBack` | `"ai-usage-analytics-screen"` |
| `AiAuditLogScreen` | `src/app/admin/AiAuditLogScreen.tsx` | `loading, error, entries, filter, totalCount, onChangeFilter, onExportCsv, onRetry, onBack` | `"ai-audit-log-screen"` |
| `MarketplacePostComposerScreen` | `src/app/admin/MarketplacePostComposerScreen.tsx` | `saving, error, initialPost, onSaveDraft, onPublish, onBack` | `"marketplace-post-composer-screen"` |
| `PerPostPerformanceScreen` | `src/app/admin/PerPostPerformanceScreen.tsx` | `loading, error, post, metrics, bookings, onRetry, onBack` | `"per-post-performance-screen"` |
| `AntiTheftComplianceDashboardScreen` | `src/app/admin/AntiTheftComplianceDashboardScreen.tsx` | `loading, error, kpi, signals, onInvestigate, onEscalate, onDismiss, onRetry, onBack` | `"anti-theft-compliance-screen"` |

### 2.4 Routes — `src/app/navigation/routes.ts`

Eight routes added after `OperatorAuditLog` (line 319), before `// W15-DEBT-1`:

| Route name | Path | Group | Guard |
|-----------|------|-------|-------|
| `AiToggles` | `/owner/ai/toggles` | `owner` | `authenticated` |
| `AiBudgetConfig` | `/owner/ai/budget` | `owner` | `authenticated` |
| `AiSuggestionQueue` | `/owner/ai/suggestions` | `owner` | `authenticated` |
| `AiUsageAnalytics` | `/owner/ai/usage` | `owner` | `authenticated` |
| `AiAuditLog` | `/owner/ai/audit` | `owner` | `authenticated` |
| `MarketplacePostComposer` | `/owner/marketplace/compose` | `owner` | `authenticated` |
| `PerPostPerformance` | `/owner/marketplace/post-performance` | `owner` | `authenticated` |
| `AntiTheftCompliance` | `/owner/compliance/anti-theft` | `owner` | `authenticated` |

### 2.5 AppNavigatorShell wiring — `src/app/navigation/AppNavigatorShell.tsx`

- **15 import lines** added (8 screens + 2 service factories + `checkPostCompliance` + type imports for both modules + `AiBudgetGuardConfig`)
- **2 useMemos** added: `aiAdminService`, `marketplaceAdminSvc`
- **~50 state variables** added covering all 8 screens (loading/saving/error state + domain data per screen)
- **W48 route activators** added: 5 AI routes batched under `w48AiRoutes` array check + standalone `AntiTheftCompliance` block
- **8 render blocks** added after `OperatorAuditLog` render block, before `// W48-DEBT-1 — Onboarding admin` comment (~320 lines)

### 2.6 Tests — `__tests__/w48AiMarketplace.test.tsx`

50 tests across 10 describe blocks:

| Block | Tests | Coverage |
|-------|-------|---------|
| `AiTogglesScreen` | 5 | root testID, loading spinner, onBack, pending banner visible, onSaveAll called |
| `AiBudgetConfigScreen` | 5 | root testID, onBack, retry on error, onRetry called, budget table rendered |
| `AiSuggestionQueueScreen` | 5 | root testID, summary strip, onApprove with correct id, onReject with correct id, empty state |
| `AiUsageAnalyticsScreen` | 5 | root testID, KPI row, retry on error, onRetry called, usage-by-feature section |
| `AiAuditLogScreen` | 5 | root testID, empty state, entry rendered, onExportCsv called, onBack called |
| `MarketplacePostComposerScreen` | 5 | root testID, field presence (title/category/description/price), compliance checklist, onBack, onSaveDraft |
| `PerPostPerformanceScreen` | 5 | root testID, post summary card, KPI row, empty bookings state, booking row rendered |
| `AntiTheftComplianceDashboardScreen` | 5 | root testID, KPI row, onInvestigate (signalId + staffId), onDismiss, empty state |
| `aiAdminService — RBAC guards` | 6 | FORBIDDEN for `technician` (getAiToggles, listAiSuggestions, approveAiSuggestion), FORBIDDEN for `client` (listAiSuggestions, rejectAiSuggestion), TENANT_REQUIRED (empty string, null-ish) |
| `checkPostCompliance` | 4 | allPassing=false for empty input, titleOk=false >80 chars, descriptionOk=false <100 chars, allPassing=true for valid post |

---

## 3. Debt Retired

No carry-in debts were retired in W48.

W47-DEBT-1 and W47-DEBT-2 were originally targeted at W48 but deferred to W49 (see §4 below).

---

## 4. Deferred (New Debt)

| Debt ID | Description | Target |
|---------|-------------|--------|
| W47-DEBT-1 | `MarketplaceAttributionData` direct/marketplace booking counts always 0 — deferred from W48; booking source tracking requires `bookingSource` field on booking document and aggregation query | W49 |
| W47-DEBT-2 | `RevenueBreakdown.byCurrency` always empty — deferred from W48; multi-currency pipeline requires `billingCurrency` on invoice/booking docs | W49 |
| W48-DEBT-1 | `AiSuggestionQueueSummary.approvedToday` / `rejectedToday` always 0 — needs date-scoped Firestore aggregation or daily reset counter | W50 |
| W48-DEBT-2 | `PostPerformanceMetrics` (impressions, clicks, CTR) not yet written by any analytics pipeline — Cloud Function or client-side event tracking needed | W50 |
| W48-DEBT-3 | `AiBudgetConfigScreen` write path is a `setTimeout` stub — needs design decision on tenant-scoped vs. platform-admin budget collection; then replace with real `aiAdminService` write | W49 |
