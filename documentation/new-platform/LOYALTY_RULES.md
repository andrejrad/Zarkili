# Loyalty Rules

Domain: `src/domains/loyalty/`  
App layer: `src/app/loyalty/`  
Delivered: Week 8, Tasks 8.1 & 8.2

---

## Overview

The loyalty system has two layers:

1. **Ledger** (`src/domains/loyalty/repository.ts`) — stores tiers, balances, and transactions per tenant/customer.
2. **Rules engine** (`src/app/loyalty/loyaltyRulesEngine.ts`) — evaluates earning events and calls the ledger. Each rule is idempotent.

---

## Ledger Collections

| Collection | Document ID | Purpose |
|---|---|---|
| `tenants/{tenantId}/loyaltyConfig/config` | singleton | Tier definitions and redemption options |
| `tenants/{tenantId}/loyaltyStates/{userId}` | userId | Customer balance, lifetime points, current tier |
| `tenants/{tenantId}/loyaltyTransactions/{txId}` | auto-ID | Individual credit/debit records |
| `tenants/{tenantId}/loyaltyIdempotency/{key}` | idempotency key | Prevents double-crediting |

---

## Loyalty Config Model

```ts
type TenantLoyaltyConfig = {
  tenantId: string;
  tiers: LoyaltyTier[];          // ordered by minLifetimePoints ascending
  redemptionOptions: LoyaltyRedemptionOption[];
  updatedAt: Timestamp;
};

type LoyaltyTier = {
  tierId: string;
  name: string;                  // e.g. "Silver", "Gold", "Platinum"
  minLifetimePoints: number;
  benefits: string[];
};

type LoyaltyRedemptionOption = {
  optionId: string;
  label: string;                 // e.g. "10% off next visit"
  pointsCost: number;
  isActive: boolean;
};
```

---

## Repository API — `createLoyaltyRepository(db)`

| Method | Description |
|---|---|
| `getLoyaltyConfig(tenantId)` | Returns tenant config or `null` |
| `saveLoyaltyConfig(config)` | Upserts tier + redemption config |
| `getCustomerLoyaltyState(tenantId, userId)` | Returns balance, lifetime points, current tier |
| `creditPoints(tenantId, userId, points, idempotencyKey, meta)` | Batch: upsert state + write tx + write idempotency doc |
| `debitPoints(tenantId, userId, points, idempotencyKey, meta)` | Same batch pattern; throws if balance insufficient |
| `getBalance(tenantId, userId)` | Returns current point balance |
| `listTransactions(tenantId, userId, options?)` | Paginated transaction history; filterable by type and date range |

All writes are done via `writeBatch` to ensure the state, transaction record, and idempotency marker are committed atomically.

---

## Earning Rules

All rules require `EarningRulesConfig` values to be set per tenant. Rules not present in config are silently skipped (`applied: false`).

### 1. `applyCompletedAppointment`

Triggered: when a booking moves to `completed`.

```
points = floor(appointmentValue × pointsPerCurrencyUnit)
```

- Minimum 1 point if value rounds to 0 is not applied — 0 returns `applied: false`.
- Idempotency key: `{tenantId}_{userId}_COMPLETED_APPOINTMENT_{bookingId}`

### 2. `applyRebookBonus`

Triggered: when a customer makes a new booking within `windowDays` of their previous booking date.

- Fixed `bonusPoints` regardless of appointment value.
- Idempotency key: `{tenantId}_{userId}_REBOOK_BONUS_{bookingId}`

### 3. `applyReferralReward`

Triggered: when a referred customer completes their first booking.

- Credits both **referrer** (`referrerPoints`) and **referee** (`refereePoints`).
- Uses separate idempotency keys for referrer and referee credits.
- Idempotency key pattern: `{tenantId}_{userId}_REFERRAL_REWARD_{referrerId}_{bookingId}`

### 4. `applySocialShareReward`

Triggered: when a customer performs a social share action.

- Monthly cap enforced: `listTransactions` is called to count existing `SOCIAL_SHARE_REWARD` credits for `month` (format `YYYY-MM`). If count ≥ `maxPerMonth`, returns `applied: false`.
- Idempotency key: `{tenantId}_{userId}_SOCIAL_SHARE_{shareEventId}`

---

## Idempotency Pattern

Before writing any credit/debit, the ledger checks `loyaltyIdempotency/{key}`. If the document exists the operation is a no-op, returning the original transaction. This makes all rule applications safe to retry or replay from event queues.

---

## Tier Resolution

```ts
resolveCurrentTier(lifetimePoints, tiers): LoyaltyTier | null
```

Iterates tiers ordered by `minLifetimePoints` descending and returns the first tier the customer qualifies for. Returns `null` if no tier threshold is met.

---

## Admin Service — `createLoyaltyAdminService`

Located: `src/app/loyalty/loyaltyAdminService.ts`

| Method | Description |
|---|---|
| `listCustomerLoyaltyOverview(tenantId)` | All customers sorted by points descending |
| `adjustPoints(tenantId, userId, delta, reason)` | Positive = credit, negative = debit; generates admin idempotency key |
| `redeemPointsForCustomer(tenantId, userId, optionId)` | Deducts `pointsCost` and records redemption |
| `getTopCustomers(tenantId, n)` | Returns top-N customers by current balance |

---

## UI Components

| Component | File | Role |
|---|---|---|
| `ClientLoyaltyScreen` | `src/app/loyalty/ClientLoyaltyScreen.tsx` | Tier badge, balance, progress bar, redemption options, transaction history |
| `AdminLoyaltyScreen` | `src/app/loyalty/AdminLoyaltyScreen.tsx` | Customer overview, per-customer detail, point adjustment modal, redemption actions |
