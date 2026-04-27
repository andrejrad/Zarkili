# AI Data Contracts — Feature Store Specification

**Domain**: `src/domains/analytics/aiDataContracts.ts`  
**Model**: `src/domains/analytics/model.ts`  
**Week**: 11

---

## Overview

This document defines the feature vector contracts that will feed ML models in Weeks 19–20. No inference is performed in Week 11; this layer establishes the data shapes, quality gates, and privacy contracts that downstream AI services must consume.

---

## Feature Contracts

### 1. Scheduling Feature Vector (`SchedulingFeatureVector`)

**Purpose**: Predict optimal appointment time slots; personalise availability display.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Customer identifier |
| `tenantId` | string | Tenant scope |
| `preferredDayOfWeek` | number[] | 0=Sun … 6=Sat; derived from booking history |
| `preferredTimeSlot` | string[] | "morning" / "afternoon" / "evening" |
| `avgLeadHours` | number | Mean hours between booking creation and appointment |
| `noShowRate` | number | Historical no-show rate (0–1) |
| `explainability` | ExplainabilityMeta | See below |

**Consent scope**: `analytics_only` — no explicit consent required.

**Quality flags**:
- `preferredDayOfWeek` empty → `missing / warning`
- `avgLeadHours < 0` → `out_of_range / error`
- `noShowRate` outside [0,1] → `out_of_range / error`

---

### 2. Retention Feature Vector (`RetentionFeatureVector`)

**Purpose**: Churn risk scoring; drive re-engagement campaigns.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Customer |
| `tenantId` | string | Tenant scope |
| `daysSinceLastVisit` | number | Calendar days |
| `totalVisits` | number | Lifetime completed bookings |
| `avgVisitIntervalDays` | number \| null | Null if < 2 visits |
| `loyaltyPoints` | number | Current balance |
| `churnRiskScore` | number | 0–1; higher = more likely to churn |
| `explainability` | ExplainabilityMeta | |

**Consent scope**: `analytics_only`.

**Quality flags**:
- `daysSinceLastVisit < 0` → `out_of_range / error`
- `totalVisits === 0` → `missing / warning`
- `churnRiskScore` outside [0,1] → `out_of_range / error`

---

### 3. No-Show Risk Feature Vector (`NoShowRiskFeatureVector`)

**Purpose**: Pre-appointment no-show risk; trigger targeted reminders.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Customer |
| `tenantId` | string | Tenant |
| `bookingId` | string | Specific appointment |
| `historicalNoShowRate` | number | 0–1 |
| `daysTillAppointment` | number | Calendar days until appointment |
| `hasReceivedReminder` | boolean | Whether reminder was already sent |
| `noShowRiskScore` | number | 0–1 |
| `explainability` | ExplainabilityMeta | |

**Consent scope**: `analytics_only`.

**Quality flags**:
- `historicalNoShowRate` outside [0,1] → `out_of_range / error`
- `daysTillAppointment < 0` → `out_of_range / error` (past appointment)
- `noShowRiskScore` outside [0,1] → `out_of_range / error`

---

### 4. Marketplace Personalisation Vector (`MarketplacePersonalizationVector`)

**Purpose**: Service and staff recommendations in the discovery/marketplace screen.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Customer |
| `tenantId` | string | Tenant |
| `preferredServiceIds` | string[] | Services booked most frequently |
| `preferredStaffIds` | string[] | Staff booked most frequently |
| `avgSpend` | number | Mean spend per booking |
| `explainability` | ExplainabilityMeta | |

**Consent scope**: `messaging` — **requires explicit consent** (`requireExplicitConsent: true`).

**Quality flags**:
- `preferredServiceIds` empty → `missing / warning`
- `avgSpend < 0` → `out_of_range / error`

---

## Explainability Contract (`ExplainabilityMeta`)

All feature vectors must carry explainability metadata:

```typescript
type ExplainabilityMeta = {
  reasonCodes: string[];      // e.g. ["last_visit_age", "visit_frequency"]
  confidence: "high" | "medium" | "low";
  sourceSignals: string[];    // e.g. ["booking_history", "loyalty_balance"]
};
```

**Rule**: Any AI output that surfaces to an end-user (recommendation, risk flag, churn alert) **must** attach `reasonCodes` that can be shown in plain language. This is required for GDPR Article 22 right-to-explanation compliance.

---

## Data Quality Gates

The `checkXxxQuality(vector)` functions return `DataQualityFlag[]`. A contract with `error`-severity flags should **not** be consumed by an ML pipeline until the issue is resolved. `warning`-severity flags indicate degraded signal but do not block inference.

```typescript
type DataQualityFlag = {
  field: string;
  issue: "missing" | "stale" | "out_of_range";
  severity: "warning" | "error";
};
```

---

## Consent-Safe Filtering Contract (`ConsentFilter`)

```typescript
type ConsentFilter = {
  requireExplicitConsent: boolean;
  excludeOptedOut: boolean;        // always true — no opted-out users in dataset
  datasetScope: "analytics_only" | "messaging" | "full";
};
```

| Scope | Usage | Explicit Consent |
|-------|-------|-----------------|
| `analytics_only` | Internal metrics, churn scoring | Not required |
| `messaging` | Personalised campaign content, recommendations | Required |
| `full` | Reserved for future use | Required |

**Implementation Note**: The consent filter is a **declaration** on each contract, not an active enforcement layer. The enforcement happens in the campaign dispatch pipeline (Week 17) where `requireExplicitConsent: true` contracts will be filtered against a consent registry before use.

---

## Contract Builders

```typescript
buildSchedulingContract(vector)   → AiFeatureContract<SchedulingFeatureVector>
buildRetentionContract(vector)    → AiFeatureContract<RetentionFeatureVector>
buildNoShowRiskContract(vector)   → AiFeatureContract<NoShowRiskFeatureVector>
buildMarketplaceContract(vector)  → AiFeatureContract<MarketplacePersonalizationVector>
```

Each contract bundles the vector, quality flags, schema version, and consent filter in a single typed object.

---

## Privacy Safeguards

1. **Tenant isolation**: Every vector carries `tenantId`; cross-tenant reads are blocked at the repository layer.
2. **Opt-out**: `excludeOptedOut: true` on all consent filters — opted-out users are excluded from all AI datasets.
3. **Right to erasure**: Deletion of a user's booking history automatically removes them from any derived feature vector (no separate AI store exists in this version).
4. **Personalisation consent**: `messaging`-scope vectors require explicit opt-in. Marketing campaigns using personalisation data check this flag before dispatch.

---

## Files

| File | Purpose |
|------|---------|
| `src/domains/analytics/aiDataContracts.ts` | Contract builders + quality checks |
| `src/domains/analytics/model.ts` | All AI type definitions |
| `src/domains/analytics/__tests__/aiDataContracts.test.ts` | Quality check + builder tests |
