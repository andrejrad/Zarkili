# Analytics Queries — Technical Reference

**Domain**: `src/domains/analytics/`  
**App layer**: `src/app/analytics/`  
**Week**: 11

---

## Overview

The analytics layer provides tenant-scoped, subscription-gated metrics for retention, rebooking, at-risk detection, visit intervals, staff performance, and service performance. All computation is performed in pure functions (`metricsService.ts`) over arrays of `Booking` objects, making the logic fully testable without Firebase.

---

## Architecture

```
AnalyticsRepository  (Firestore queries)
        ↓
  reportingService   (app-layer orchestration + RBAC context)
        ↓
  metricsService     (pure computation — no Firestore)
        ↓
  ReportingScreens   (presentational React Native UI)
```

---

## Metric Formulas

### Retention Rate
```
retentionRate = retainedClients / totalUniqueClients

retainedClients  = clients with ≥ 2 distinct visit dates in the window
totalUniqueClients = all clients with ≥ 1 completed booking in the window
```
- **Status filter**: `completed` only
- **Window**: defined by `AnalyticsDateRange { start, end }` (YYYY-MM-DD inclusive)

### Rebooking Rate
```
rebookingRate = rebookedClients / totalUniqueClients

rebookedClients = clients with ≥ 2 completed bookings in the window
```
- Counts any 2 completed bookings (does not require distinct dates — same-day repeat is valid)

### At-Risk Clients
```
atRiskClients = count of clients where daysSinceLastVisit > thresholdDays

daysSinceLastVisit = today - lastCompletedVisitDate (calendar days)
```
- Uses **most recent** completed booking date per client
- `thresholdDays` is configurable — default 60 d in `ReportingDashboardScreen`

### Average Visit Interval
```
avgDaysBetweenVisits = mean(per-client mean gaps)

per-client mean gap = mean of consecutive visit intervals for that client
```
- Returns `null` when fewer than 2 visits exist globally
- `medianDaysBetweenVisits` = median of the per-client means (not the raw intervals)

### Staff Performance
```
noShowRate = noShowCount / (completedBookings + noShowCount)
```
- `completedBookings`: `status === "completed"` in the filter window
- `noShowCount`: `status === "no_show"`
- `cancellationCount`: `status === "cancelled" | "rejected"`

### Service Performance
```
popularityRank: 1 = highest completedBookings count
```
- Ranked descending by `completedBookings`

### Client Attention List
```
riskLevel:
  high   → daysSinceLastVisit > 90
  medium → 60 < daysSinceLastVisit ≤ 90
  low    → 30 < daysSinceLastVisit ≤ 60
```
- Only clients with `daysSinceLastVisit > 30` are included
- Sorted descending by `daysSinceLastVisit`

---

## Subscription Tier Context

`getTenantAnalyticsContext(tenantId, subscriptionTier)` returns:

| Plan         | Accessible Reports |
|--------------|-------------------|
| `free_trial` | retention, rebooking |
| `starter`    | + at_risk, visit_interval |
| `professional` | + staff_performance, service_performance, campaign_analytics, challenge_analytics |
| `enterprise` | + export |

This context is stored in `TenantAnalyticsContext.accessibleReports: ReportKey[]`. The `ReportingDashboardScreen` reads this array to show or hide sections. Week 14 can enforce gating at the service layer.

---

## Firestore Queries (AnalyticsRepository)

### `fetchCompletedBookings(tenantId, dateRange, locationId?)`
```
Collection: bookings
Where: tenantId == t, status == "completed", date >= start, date <= end
Optional: locationId == l
```
Requires composite index: `(tenantId, status, date)` — see `firestore.indexes.json`.

### `fetchAllBookingsByTenant(tenantId)`
```
Collection: bookings
Where: tenantId == t
```
Used for at-risk, visit-interval, staff-performance, and service-performance reports (all statuses required).

### `fetchCampaigns(tenantId)` / `fetchActivities(tenantId)`
```
Sub-collections: tenants/{tenantId}/campaigns, tenants/{tenantId}/activities
```

### `fetchParticipations(tenantId, activityId)`
```
Sub-collection: tenants/{tenantId}/activityParticipations
Where: activityId == a
```

---

## Data Quality Notes

- **Status filtering**: `completed` bookings for visit metrics; all statuses for staff/service performance
- **No unbounded queries**: all scope-scoped by `tenantId`; date range required for `fetchCompletedBookings`
- **Tenant isolation**: `AnalyticsRepository` enforces `tenantId` guard; throws if empty
- **Edge cases**: zero-division in all rate metrics returns `0`; null returned when data is insufficient for interval calculation

---

## Files

| File | Purpose |
|------|---------|
| `src/domains/analytics/model.ts` | All analytics types |
| `src/domains/analytics/metricsService.ts` | Pure metric computation |
| `src/domains/analytics/analyticsRepository.ts` | Firestore queries |
| `src/domains/analytics/__tests__/metricsService.test.ts` | Metric formula tests |
| `src/app/analytics/reportingService.ts` | App-layer orchestration |
| `src/app/analytics/ReportingScreens.tsx` | Admin dashboard + campaign screens |
| `src/app/analytics/__tests__/reportingService.test.ts` | Service tests |
| `src/app/analytics/__tests__/ReportingScreens.smoke.test.tsx` | Screen smoke tests |
