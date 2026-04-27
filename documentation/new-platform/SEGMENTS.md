# Segments Domain — Technical Specification

## Overview

The Segments domain provides a customer cohort engine for tenant-scoped marketing.
It computes named customer groups (segments) from booking activity data, respecting
each customer's marketing consent.

Segments are computed **on-demand** from booking summaries — they are **not** persisted
in Firestore. Callers (e.g. campaign schedulers) are responsible for caching results
if needed.

---

## Baseline Segments

| Segment ID           | Description                                              | Lookback |
|----------------------|----------------------------------------------------------|----------|
| `at_risk_30d`        | Had completed bookings historically, none in last 30 d   | 30 days  |
| `inactive_60d`       | Any booking ever, none in last 60 days                   | 60 days  |
| `new_customers_30d`  | First completed booking within the last 30 days          | 30 days  |
| `high_value`         | Total spend on completed bookings ≥ 500 (currency units) | n/a      |

---

## Consent Model

Only customers who have **opted in** to marketing communications for a specific
tenant appear in segment results. This is enforced at compute time via the
`tenants/{tenantId}/marketingConsent/{userId}` collection.

```
MarketingConsent {
  userId: string
  tenantId: string
  optedIn: boolean
  updatedAt: Timestamp
}
```

---

## Collection Layout

```
tenants/{tenantId}/marketingConsent/{userId}
```

---

## Key Types

### BookingSummary (input)
```typescript
{
  userId: string
  date: string         // "YYYY-MM-DD"
  amount: number
  status: "completed" | "cancelled" | "no_show" | string
}
```

### SegmentResult (output)
```typescript
{
  tenantId: string
  segmentId: BaselineSegmentId
  customerIds: string[]
  count: number
  computedAt: string   // ISO timestamp
}
```

---

## Repository API

| Method                                              | Description                          |
|-----------------------------------------------------|--------------------------------------|
| `computeSegment(tenantId, segmentId, bookings, nowIso?)` | Compute and return a SegmentResult |
| `getConsentedCustomerIds(tenantId)`                 | Return IDs of opted-in customers     |
| `setConsent(consent)`                               | Upsert marketing consent record      |
| `getConsent(tenantId, userId)`                      | Retrieve a single consent record     |

---

## Error Codes

| Code               | Trigger                              |
|--------------------|--------------------------------------|
| `TENANT_REQUIRED`  | Empty `tenantId` supplied            |
| `INVALID_SEGMENT`  | Unknown segment ID                   |
