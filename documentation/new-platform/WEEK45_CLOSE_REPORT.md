# Week 45 Close Report — Loyalty / Activity / Campaign Admin

**Date closed:** 2026-05-10
**Jest baseline at start of week:** 3139 tests / 168 suites (W44 close — all passing)
**Jest at close:** 3245 tests / 169 suites — all passing
**TypeScript:** `tsc --noEmit` clean

---

## 1. Scope

W45 delivered the **Loyalty / Activity / Campaign** admin cluster (Phase 3 Batch S), per [PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md](../PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md) §Week 45.

The program goal was:
- **Loyalty programme configuration** — enabled toggle, points-per-currency, expiry, tier editor
- **Reward catalog** — CRUD for reward entries
- **Manual point adjustment** — credit/debit with reason and audit note
- **Loyalty dashboard** — enrolled count, tier distribution, recent transactions
- **Tier migration** — preview affected customers, run with reason
- **Activity catalog** — list, toggle status, view analytics
- **Activity analytics** — stats grid, daily progress chart
- **Campaign list** — filter by status, open campaign
- **Campaign builder** — channel picker, compliance checker, A/B toggle, schedule
- **Campaign performance** — metrics grid, rates, hourly delivery breakdown
- **Transactional templates** — type tabs × channel chips, default preview, override editor
- **Promotion admin** — promo code list, status filter, create form, pause/activate

All UI surfaces are in place. `createLoyaltyAdminService()` and `createCampaignAdminService()` repository adapters are stubs returning `{ ok: false, message: "X repository not configured." }` and are tracked as **W45-DEBT-1**. Real Firestore adapters land in W46.

W43-DEBT-3 carry-in (staff options in booking-ops handlers) was also resolved this week.

---

## 2. What Was Built

### 2.1 Domain model — `src/domains/loyalty/loyaltyAdminModel.ts`

| Type | Description |
|------|-------------|
| `LoyaltyAdminResult<T>` | `{ ok: true; data: T } \| { ok: false; message: string }` |
| `LoyaltyTierInput` | tierId, name, minPoints, maxPoints, benefits[] |
| `LoyaltyRedemptionOptionInput` | optionId, name, pointsCost, type, description, active |
| `LoyaltyConfigInput` | tenantId, enabled, pointsPerCurrencyUnit, tiers[], redemptionOptions[], pointsExpiryDays |
| `RewardCatalogEntry` | rewardId, tenantId, name, pointsCost, type, description, active |
| `RewardCatalogInput` | name, pointsCost, type, description, active |
| `PointAdjustmentDirection` | `"credit" \| "debit"` |
| `PointAdjustmentReason` | `"goodwill" \| "correction" \| "event_bonus" \| "promotion" \| "other"` |
| `ManualPointAdjustmentInput` | tenantId, clientId, clientName, direction, points, reason, note, performedBy |
| `LoyaltyActivitySummary` | txId, clientId, clientName, direction, points, reason, date |
| `TierDistributionEntry` | tierId, tierName, count |
| `LoyaltyProgramStats` | totalEnrolled, activeThisMonth, totalPointsIssued, totalPointsRedeemed, averageBalance, tierDistribution[], recentTransactions[] |
| `TierMigrationPreview` | customersAffected, upgrades, downgrades, unchanged |
| `TierMigrationInput` | tenantId, reason, performedBy |
| `ActivityAdminEntry` | activityId, tenantId, name, type, status, startDate, endDate, participantCount, completionCount |
| `DailyActivityProgress` | date, newParticipants, completions |
| `ActivityStats` | activityId, activityName, totalParticipants, completedCount, completionRate, rewardsIssued, dailyProgress[] |
| `ActivityBuilderInput` | tenantId, name, type, startDate, endDate, ruleTargetValue, ruleWindowDays, rewardType, rewardValue, rewardDescription, createdBy |

### 2.2 Domain model — `src/domains/campaigns/campaignAdminModel.ts`

| Type | Description |
|------|-------------|
| `CampaignAdminResult<T>` | `{ ok: true; data: T } \| { ok: false; message: string }` |
| `CampaignListEntry` | campaignId, name, status, channel, segmentName, scheduledAt, sent, opened, clicked, converted |
| `CampaignBuilderInput` | tenantId, name, channel, segmentId, segmentName, subject?, body, scheduledAt, abEnabled, abVariantB?, sendTimeOptimization, createdBy |
| `ComplianceCheckItem` | itemId, label, passed, detail? |
| `HourlyDeliveryEntry` | hour, delivered |
| `CampaignMetricsDetail` | sent, delivered, opened, clicked, converted, failed, openRate, clickRate, conversionRate |
| `CampaignPerformanceDetail` | campaignId, name, channel, status, scheduledAt, completedAt, metrics, hourlyDelivery[] |
| `TransactionalTemplateType` | `"booking_confirmation" \| "booking_reminder" \| "no_show" \| "cancellation" \| "receipt" \| "password_reset"` |
| `TransactionalTemplateChannel` | `"email" \| "sms" \| "push"` |
| `TransactionalTemplateDefault` | templateType, channel, subject?, body, variables[] |
| `TransactionalTemplateOverride` | templateType, channel, subject?, body, variables[], isActive, updatedAt |
| `PromoCodeType` | `"percent" \| "fixed" \| "free_service"` |
| `PromoCodeStatus` | `"active" \| "paused" \| "expired" \| "exhausted"` |
| `PromoCode` | codeId, tenantId, code, type, value, description, status, applicableServiceIds[], validFrom, validUntil?, maxUses?, perClientCap?, usesCount, createdBy, createdAt |
| `PromoCodeCreateInput` | tenantId, code, type, value, description, validFrom, validUntil?, maxUses?, perClientCap?, createdBy |

### 2.3 Service factory — `src/app/admin/loyaltyAdminService.ts`

Factory: `createLoyaltyAdminService(configRepo?, rewardRepo?, adjustRepo?, activityRepo?)`

| Method | Validation / Behaviour |
|--------|----------------------|
| `loadLoyaltyConfig(tenantId)` | No repo → not configured |
| `saveLoyaltyConfig(input)` | No repo → not configured |
| `listRewards(tenantId)` | No repo → not configured |
| `saveReward(rewardId\|null, tenantId, input)` | No repo → not configured |
| `deleteReward(rewardId, tenantId)` | No repo → not configured |
| `adjustPoints(input)` | Validates `points > 0`; `note` non-empty after trim; no repo → not configured |
| `loadProgramStats(tenantId)` | No repo → not configured |
| `previewTierMigration(tenantId)` | No repo → not configured |
| `runTierMigration(input)` | Validates `reason` non-empty; no repo → not configured |
| `listActivities(tenantId)` | No repo → not configured |
| `saveActivity(tenantId, input)` | No repo → not configured |
| `loadActivityStats(activityId, tenantId)` | No repo → not configured |

Export: `LoyaltyAdminService = ReturnType<typeof createLoyaltyAdminService>`

### 2.4 Service factory — `src/app/admin/campaignAdminService.ts`

Factory: `createCampaignAdminService(listRepo?, writeRepo?, templateRepo?, promoRepo?)`

| Method | Validation / Behaviour |
|--------|----------------------|
| `listCampaigns(tenantId)` | No repo → not configured |
| `loadCampaignPerformance(campaignId, tenantId)` | No repo → not configured |
| `createCampaign(input)` | Validates name non-empty; segmentId non-empty; body non-empty; no repo → not configured |
| `updateCampaignStatus(campaignId, tenantId, status)` | No repo → not configured |
| `runComplianceCheck(input)` | **Pure — no repo needed.** Returns 5 `ComplianceCheckItem[]`: consent (always pass), throttle (always pass), quiet_hours (always pass), body (passes if non-empty), subject (passes if channel ≠ email or subject non-empty) |
| `loadTransactionalDefaults()` | **Pure — no repo needed.** Returns 18 hardcoded defaults: 6 template types × 3 channels |
| `listTransactionalOverrides(tenantId)` | No repo → not configured |
| `saveTransactionalOverride(overrideId\|null, input)` | Validates `body` non-empty after trim; no repo → not configured |
| `deleteTransactionalOverride(overrideId, tenantId)` | No repo → not configured |
| `listPromoCodes(tenantId)` | No repo → not configured |
| `createPromoCode(input)` | Validates `code` non-empty; `value > 0`; no repo → not configured |
| `updatePromoCodeStatus(codeId, tenantId, status)` | No repo → not configured |

Export: `CampaignAdminService = ReturnType<typeof createCampaignAdminService>`

### 2.5 Admin screens — all 12 created

| Screen file | Route name | testID | Description |
|-------------|-----------|--------|-------------|
| `src/app/admin/LoyaltyConfigScreen.tsx` | `LoyaltyConfig` | `loyalty-config-screen` | Enabled toggle, points, expiry, tiers CRUD |
| `src/app/admin/RewardCatalogScreen.tsx` | `AdminRewardCatalog` | `reward-catalog-screen` | Reward list + inline edit form |
| `src/app/admin/PointAdjustmentScreen.tsx` | `PointAdjustment` | `point-adjustment-screen` | Credit/debit direction, reason chips, audit note |
| `src/app/admin/LoyaltyDashboardScreen.tsx` | `LoyaltyDashboard` | `loyalty-dashboard-screen` | Stats grid, tier distribution, recent transactions |
| `src/app/admin/TierMigrationScreen.tsx` | `TierMigration` | `tier-migration-screen` | Preview stats, reason input, run button |
| `src/app/admin/ActivityCatalogScreen.tsx` | `ActivityCatalog` | `activity-catalog-screen` | Activity list, toggle status, view analytics |
| `src/app/admin/ActivityAnalyticsScreen.tsx` | `ActivityAnalytics` | `activity-analytics-screen` | Stats grid, daily progress rows |
| `src/app/admin/CampaignListScreen.tsx` | `CampaignList` | `campaign-list-screen` | Campaign list, status filter chips |
| `src/app/admin/CampaignBuilderScreen.tsx` | `CampaignBuilder` | `campaign-builder-screen` | Form, channel picker, compliance checklist, A/B |
| `src/app/admin/CampaignPerformanceScreen.tsx` | `CampaignPerformance` | `campaign-performance-screen` | Metrics grid, rates, hourly delivery |
| `src/app/admin/TransactionalTemplateScreen.tsx` | `TransactionalTemplates` | `transactional-template-screen` | Type tabs, channel chips, default preview, override |
| `src/app/admin/PromotionAdminScreen.tsx` | `PromotionAdmin` | `promotion-admin-screen` | Promo code list, status filter, create form |

**Note on naming:** The consumer `RewardCatalog` route (`/loyalty/rewards`) already existed. The admin route was named `AdminRewardCatalog` (`/owner/loyalty/rewards`) to avoid the duplicate-identifier TypeScript error, and the admin screen import aliased as `AdminRewardCatalogScreen`.

### 2.6 Routes added — `src/app/navigation/routes.ts`

12 new routes inserted, all `group: "owner"`, `guard: "authenticated"`:

```
/owner/loyalty/config       → LoyaltyConfig
/owner/loyalty/rewards      → AdminRewardCatalog
/owner/loyalty/points       → PointAdjustment
/owner/loyalty/dashboard    → LoyaltyDashboard
/owner/loyalty/tiers        → TierMigration
/owner/activities           → ActivityCatalog
/owner/activities/analytics → ActivityAnalytics
/owner/campaigns            → CampaignList
/owner/campaigns/new        → CampaignBuilder
/owner/campaigns/performance → CampaignPerformance
/owner/templates/transactional → TransactionalTemplates
/owner/promotions           → PromotionAdmin
```

### 2.7 AppNavigatorShell wiring — `src/app/navigation/AppNavigatorShell.tsx`

**Imports added:**
- 12 screen imports (with `AdminRewardCatalogScreen` alias)
- `createLoyaltyAdminService`, `createCampaignAdminService`
- Domain types: `ActivityAdminEntry`, `ActivityStats`, `LoyaltyConfigInput`, `LoyaltyProgramStats`, `RewardCatalogEntry`, `RewardCatalogInput`, `ManualPointAdjustmentInput`, `TierMigrationPreview`, `CampaignBuilderInput`, `CampaignListEntry`, `CampaignPerformanceDetail`, `ComplianceCheckItem`, `TransactionalTemplateChannel`, `TransactionalTemplateDefault`, `TransactionalTemplateOverride`, `TransactionalTemplateType`, `PromoCode`, `PromoCodeCreateInput`, `PromoCodeStatus`

**State added (~100 lines):** All loyalty config, reward catalog, point adjustment, loyalty stats, tier migration, activity catalog, activity analytics, campaign list/builder/performance, transactional template, and promo code state.

**Services added:**
```typescript
const loyaltyAdminService = useMemo(() => createLoyaltyAdminService(), []);
const campaignAdminService = useMemo(() => createCampaignAdminService(), []);
```

**Route handlers added (12):** All handlers fully implemented with inline async `void service.method().then()` callbacks.

**TSC fixes applied post-wiring:**
- `RewardCatalogScreen` import aliased to avoid duplicate identifier with consumer screen
- `currentUser?.uid` replaced with `userId ?? ""` (correct variable in shell context)
- `editingRewardId` state typed `string | null | undefined` → handler passes `editingRewardId ?? null` to screen prop typed `string | null`

---

## 3. Debt Register Changes

### W43-DEBT-3 — CLOSED this week

**Staff options in booking-ops handlers** — 4 handlers in AppNavigatorShell (`ManualBooking`, `BlockTime`, `ForceBook`, `RescheduleAdmin`) were updated to pass `staffList.map((s) => ({ staffId: s.staffId, name: s.displayName }))` replacing the carry-in stub `(typeof tenantLocations !== "undefined" ? [] : []) as { staffId: string; name: string }[]`.

### W45-DEBT-1 — NEW (open)

| Field | Value |
|-------|-------|
| ID | `W45-DEBT-1` |
| Description | **Loyalty / Campaign / Activity Firestore adapters** — `createLoyaltyAdminService()` and `createCampaignAdminService()` are wired with no repository injections; every method returns `{ ok: false, message: "X not configured." }`. Real Firestore adapters needed for: `LoyaltyConfigAdminRepository`, `RewardCatalogRepository`, `ManualAdjustmentRepository`, `ActivityAdminRepository`, `CampaignListAdminRepository`, `CampaignWriteRepository`, `TransactionalTemplateRepository`, `PromoCodeRepository`. |
| Severity | High |
| Target | W46 |
| Status | open |

---

## 4. Test Coverage

**New test file:** `__tests__/w45LoyaltyActivityCampaignExtras.test.tsx`

| Describe block | Tests | Focus |
|----------------|-------|-------|
| `LoyaltyConfigScreen` | 9 | Render, loading/error, save, add/remove tier, success/error feedback |
| `RewardCatalogScreen` | 7 | Render, reward item, edit/delete/add, form render, save button |
| `PointAdjustmentScreen` | 7 | Render, client name, submit, direction toggle, reason chips, success/error |
| `LoyaltyDashboardScreen` | 5 | Render, tier distribution, transactions, loading/error |
| `TierMigrationScreen` | 5 | Render, preview, run, success/error |
| `ActivityCatalogScreen` | 5 | Render, activity item, analytics, toggle status, create |
| `ActivityAnalyticsScreen` | 5 | Render, stats grid, daily row, loading/error |
| `CampaignListScreen` | 6 | Render, item, open, create, filter chips (all + status) |
| `CampaignBuilderScreen` | 7 | Render, create, compliance check, checklist render, success, subject show/hide |
| `CampaignPerformanceScreen` | 5 | Render, metrics grid, rates, hourly, loading |
| `TransactionalTemplateScreen` | 7 | Render, type tabs, channel chips, default preview, type change, save, success |
| `PromotionAdminScreen` | 7 | Render, item, pause button, updateStatus, form show, createCode, toggleForm |
| `loyaltyAdminService — no repos` | 14 | All 12 methods → not configured; adjustPoints validates points>0 + note; runTierMigration validates reason |
| `campaignAdminService — no repos` | 12 | All 12 methods; createCampaign validates name/segmentId/body; runComplianceCheck pure pass + email-subject fail; loadTransactionalDefaults returns 18 entries; createPromoCode validates code + value>0 |
| **Total** | **106** | |

---

## 5. Metrics

| Metric | Value |
|--------|-------|
| New source files | 14 (2 models, 2 services, 10 screens — LoyaltyConfigScreen, RewardCatalogScreen, PointAdjustmentScreen, LoyaltyDashboardScreen, TierMigrationScreen, ActivityCatalogScreen, ActivityAnalyticsScreen, CampaignListScreen, CampaignBuilderScreen, CampaignPerformanceScreen, TransactionalTemplateScreen, PromotionAdminScreen) |
| New test file | 1 |
| New tests | 106 |
| Routes added | 12 |
| TSC errors fixed | 5 (duplicate identifier, currentUser→userId ×2, editingRewardId undefined→null, AdminRewardCatalog rename) |
| Debts closed | 1 (W43-DEBT-3) |
| Debts opened | 1 (W45-DEBT-1) |
| Jest total | 3245 / 169 suites |
| TSC | clean |

---

## 6. Carry-Forward (W46 Priorities)

| ID | Description | Severity |
|----|-------------|----------|
| W45-DEBT-1 | Loyalty / Campaign / Activity Firestore adapters (8 repos) | High |
| W44-DEBT-1 | CRM Firestore adapters (6 repos) | High |
| W43-DEBT-1 | Booking-ops Firestore adapters (5 repos) | High |
| W41-DEBT-3 | Staff performance metrics service + aggregation job | Medium |
| W43-DEBT-2 | Drag-to-reschedule gesture (react-native-gesture-handler + Reanimated) | Medium |
