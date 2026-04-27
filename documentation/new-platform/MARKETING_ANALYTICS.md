# Marketing Analytics — Campaign & Challenge KPIs

**Domain**: `src/domains/analytics/campaignMetricsService.ts`  
**App layer**: `src/app/analytics/campaignAnalyticsService.ts`  
**Week**: 11

---

## Overview

The marketing analytics module aggregates KPIs for campaigns (email/SMS/push) and challenges (activities). All computation is pure — no Firestore calls — operating over `Campaign[]` and `ParticipationRecord[]` data fetched by `AnalyticsRepository`.

---

## Campaign KPI Definitions

| KPI | Formula | Notes |
|-----|---------|-------|
| `sent` | Raw count | From `Campaign.metrics.sent` |
| `delivered` | Raw count | From `Campaign.metrics.delivered` |
| `opened` | Raw count | From `Campaign.metrics.opened` |
| `clicked` | Raw count | From `Campaign.metrics.clicked` |
| `failed` | Raw count | From `Campaign.metrics.failed` |
| `openRate` | `opened / delivered` | 0 when `delivered = 0` |
| `clickRate` | `clicked / delivered` | 0 when `delivered = 0` |
| `conversionRate` | `clicked / sent` (proxy) | True conversion events not yet tracked; clicks used as a weak conversion signal |

### Attribution Note
`conversionRate` is a **click-proxy**, not a confirmed purchase/booking conversion. A dedicated conversion event (e.g. `booking_completed_from_campaign`) should be added in a future sprint (Week 17+) for accurate attribution. Until then, clickRate is the primary engagement signal.

### Double-Count Risk
Campaigns with `status === "sending"` may have partial metrics. Reports should filter to `status === "completed"` or treat in-progress metrics as provisional.

---

## Challenge (Activity) KPI Definitions

| KPI | Formula | Notes |
|-----|---------|-------|
| `participants` | `participations.length` | All participation records for the activity |
| `completed` | `count where p.completed === true` | Rule threshold reached |
| `completionRate` | `completed / participants` | 0 when no participants |
| `rewardsAwarded` | `count where p.rewardedAt !== undefined` | Reward actually paid out |

### Completion vs Reward Gap
`rewardsAwarded` can be less than `completed` if reward processing fails or is delayed. A gap of ≥ 20% between `completed` and `rewardsAwarded` should trigger an operational alert.

---

## Export-Ready Data Adapters

Both `computeCampaignKpisBatch` and `computeChallengeKpisBatch` return plain arrays of typed objects, ready for JSON or CSV serialisation via `exportService.ts`.

Example usage:
```typescript
const campaigns = await analyticsRepository.fetchCampaigns(tenantId);
const kpis = computeCampaignKpisBatch(campaigns);
// kpis is serialisable as JSON or can be piped through bookingsToCsv adapter
```

---

## Subscription Gating

Campaign and challenge analytics appear in `accessibleReports` for plans:
- `professional`
- `enterprise`

Free trial and starter plans do not see campaign/challenge analytics in the dashboard.

---

## Files

| File | Purpose |
|------|---------|
| `src/domains/analytics/campaignMetricsService.ts` | Pure campaign + challenge KPI computation |
| `src/app/analytics/campaignAnalyticsService.ts` | App-layer orchestration |
| `src/app/analytics/ReportingScreens.tsx` | `CampaignAnalyticsScreen` component |
| `src/domains/analytics/__tests__/campaignMetricsService.test.ts` | KPI formula tests |
| `src/app/analytics/__tests__/campaignAnalyticsService.test.ts` | Service tests |
| `src/app/analytics/__tests__/ReportingScreens.smoke.test.tsx` | Screen smoke tests |
