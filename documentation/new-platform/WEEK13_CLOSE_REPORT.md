# Week 13 Close — Acceptance Report

**Date**: 2026-04-26  
**Week**: 13 of 52  
**Engineer**: Zarkili Engineering (AI-assisted)  
**Phase**: Weeks 13–20 — Stripe Foundation, Trial/Gating, Onboarding, Marketplace, AI

---

## 1. Planned vs. Delivered

| Task | Planned | Delivered | Status |
|------|---------|-----------|--------|
| 13.1 | Stripe Billing Domain (SaaS Subscriptions) | `billing/model.ts` (status surface, plan/interval, webhook event types, state machine, errors), `billing/repository.ts` (singleton subscription doc + idempotency markers), `billing/subscriptionService.ts` (`applyWebhookEvent` with idempotency + state-machine enforcement, `transitionSubscription`, `createInitialSubscription`), `billing/index.ts`, +43 tests | ✅ Complete |
| 13.2 | Stripe Connect Domain (Salon Payouts) | `connect/model.ts` (4-state surface, account type, W-9/W-8BEN tax forms, 1099-K eligibility, status derivation from Stripe account snapshot, state machine), `connect/repository.ts` (singleton + idempotency), `connect/connectService.ts` (`onboardAccount`, `applyAccountEvent` for `account.updated` + `payout.failed` + `payout.paid`, restriction-reason capture), `connect/index.ts`, +31 tests | ✅ Complete |
| Rules | Firestore rules for new collections | Explicit rules added for `tenants/{tenantId}/billing/{docId}`, `tenants/{tenantId}/billingWebhookIdempotency/{eventId}`, `tenants/{tenantId}/connect/{docId}`, `tenants/{tenantId}/connectWebhookIdempotency/{eventId}` | ✅ Complete |

**Variance**: 0 planned items undelivered. Out-of-scope items (actual Stripe SDK calls, Cloud Function webhook handler, admin UI surfaces) are intentionally deferred — these belong in Week 14 (gating UI) and Week 15 (admin) per the build plan. Week 13 establishes the domain layer they will consume.

**Platform scope**: web, ios, android — pure domain logic; no platform-specific code.

---

## 2. Quality Metrics

| Metric | Entering Week 13 | Exiting Week 13 | Change |
|--------|-----------------|-----------------|--------|
| Test count | 1,226 | 1,300 | +74 |
| Test suites | 77 | 81 | +4 |
| TypeScript errors | 0 | 0 | ✅ |
| Failing tests | 0 | 0 | ✅ |
| Web smoke gate | 6/6 | 6/6 | ✅ |
| Native smoke gate | 22/22 | 22/22 | ✅ |

---

## 3. Webhook Mapping Summary (Task 13.1)

| Stripe event | Internal action |
|---|---|
| `customer.subscription.created` | Create normalized `Subscription` record. Map raw status via `mapStripeStatus`. Stamp `pastDueSince` if initial status is `past_due`. |
| `customer.subscription.updated` | Map raw status; transition existing subscription. Reject illegal transition. Refresh period/trial fields from payload. |
| `customer.subscription.deleted` | Transition to `cancelled` (terminal). |
| `customer.subscription.trial_will_end` | Informational — no status change; idempotency marker only. |
| `invoice.payment_failed` | Transition to `past_due`. Stamp `pastDueSince` on first entry; preserve across re-entries. |
| `invoice.payment_succeeded` | Recovery: `past_due → active` or `suspended → active` and clear `pastDueSince`. No-op on already-active subscription (idempotency only). |

**Stripe → internal status mapping** (`mapStripeStatus`):

| Raw Stripe status | Internal `SubscriptionStatus` |
|---|---|
| `trialing` | `trialing` |
| `active` | `active` |
| `past_due` | `past_due` |
| `unpaid` | `suspended` |
| `paused` | `suspended` |
| `incomplete` | `trialing` |
| `incomplete_expired` | `cancelled` |
| `canceled` | `cancelled` |

Unrecognised statuses throw `BillingError("INVALID_STATUS")` rather than defaulting silently.

---

## 4. State Machines

### 4.1 Subscription state machine (Task 13.1)

```
trialing  → trialing | active | past_due | cancelled
active    → active | past_due | suspended | cancelled
past_due  → past_due | active | suspended | cancelled
suspended → suspended | active | cancelled
cancelled → cancelled                     (terminal)
```

Enforced in two layers:
1. `mapStripeStatus` — translation of inbound raw Stripe status (validation gate).
2. `transitionSubscription` / `isValidTransition` — application-layer guard that throws `BillingError("INVALID_TRANSITION")` before persisting.

### 4.2 Connect state machine (Task 13.2)

```
not_started          → not_started | pending_verification | restricted
pending_verification → pending_verification | active | restricted
active               → active | restricted
restricted           → restricted | pending_verification | active
```

Status is **derived** from Stripe account snapshot fields (`charges_enabled`, `payouts_enabled`, `details_submitted`, `requirements.currently_due`) by `deriveConnectStatusFromAccount`:

- Active iff `charges_enabled && payouts_enabled && requirements.currently_due is empty`.
- Restricted iff `details_submitted` and either `!charges_enabled` or `!payouts_enabled`.
- Otherwise pending_verification.

`restrictionReasons` array captures `requirements.currently_due` plus `disabled_reason` for admin visibility.

---

## 5. Connect Account Model (Task 13.2)

| Field | Purpose |
|---|---|
| `stripeAccountId` | Stripe `acct_…` (null until `onboardAccount` called). |
| `accountType` | Defaults to `express` for US per US_PRIMARY_MARKET_ADDENDUM. |
| `country` | ISO 3166-1 alpha-2; drives tax-form requirement. |
| `status` | Derived; one of `not_started | pending_verification | active | restricted`. |
| `payoutsEnabled` / `chargesEnabled` / `detailsSubmitted` | Mirror Stripe boolean flags. |
| `taxFormType` | `w9` (US persons), `w8ben` (foreign owners), null (non-US). Required for US salons at onboarding (`buildInitialAccount` throws `ConnectError("TAX_FORM_REQUIRED")` otherwise). |
| `taxFormCapturedAt` | Timestamp; stamped when `taxFormType` is supplied. |
| `eligible1099K` | US §6050W reporting flag (false at onboarding; flipped by future Cloud Function once thresholds met). |
| `lastPayoutFailureAt` / `lastPayoutFailureReason` | Refreshed on every `payout.failed` event for admin visibility (KPI: last failure recency). |
| `restrictionReasons` | Stripe `requirements.currently_due` + `disabled_reason` while restricted; cleared when active. |
| `lastEventId` | Audit pointer to last applied Stripe event. |

---

## 6. Idempotency Strategy (Both Tasks)

- Each tenant has a per-collection idempotency subcollection: `billingWebhookIdempotency` and `connectWebhookIdempotency`.
- The marker doc id IS the Stripe event id (`evt_…`).
- `applyWebhookEvent` / `applyAccountEvent` first call `hasProcessedEvent`; if present, return `{ outcome: "duplicate" }` without mutating state.
- State-changing events use `saveSubscriptionWithIdempotency` / `saveAccountWithIdempotency` — a single `writeBatch` writes the singleton record AND the idempotency marker atomically. There is no window in which the state can change without the event being recorded, or vice versa.
- Informational events (`trial_will_end`, `payout.paid`, `invoice.payment_succeeded` on already-active) call `recordProcessedEvent` (idempotency marker only) and return `{ outcome: "ignored" }`.

This eliminates the two classic webhook race conditions:
1. Duplicate webhook delivery → no double-write (verified by test "is idempotent — replaying same event...").
2. State change persisted but idempotency marker lost (or vice versa) → impossible because both writes are in the same batch.

---

## 7. Security Audit Findings and Resolutions

| Severity | Finding | Resolution |
|----------|---------|------------|
| **NONE** | New domain code reviewed for OWASP Top 10. No injection vectors (all writes go through typed model). No unbounded queries. No client-side cap bypass paths. | n/a |
| **MEDIUM** | New collections must not rely on implicit catch-all deny (Week 12 hardening principle). | Closed: explicit Firestore rules added for all 4 new collection paths. Tenant owner/admin can read billing + connect docs (settings UI). All writes restricted to `isPlatformAdmin()` (server-side webhook handler runs with admin credentials). Idempotency markers are admin-only read+write (internal dedup store). |
| **LOW** | State drift risk: a malformed webhook payload could push subscription into an undefined state. | Closed: `mapStripeStatus` throws on unknown raw status; `isValidTransition` throws on illegal transition before persisting. Both errors surface as `BillingError`/`ConnectError` for the webhook handler to NACK Stripe (triggering retry). |
| **LOW** | Connect tax compliance gap: US salons could reach `active` without a W-9 / W-8BEN. | Closed at onboarding: `buildInitialAccount` throws `ConnectError("TAX_FORM_REQUIRED")` for `country === "US"` with `taxFormType === null`. (Stripe-side `requirements.currently_due` continues to enforce on Stripe's side.) |

No P0/P1/P2 findings open from Week 13.

---

## 8. Open Defects and Technical Debt

1. **[W13-DEBT-1]** No actual Stripe SDK call yet. The domain layer is consumer-agnostic — Cloud Function `stripeWebhookHandler` (Week 14) will instantiate the service and call `applyWebhookEvent`. Tracked as part of Week 14 implementation.
2. **[W13-DEBT-2]** No admin UI for billing or connect health. Owner billing settings + connect health surface are part of Phase 3 Week 34 (`B-021`). Domain reads are exposed via `getSubscription` / `getAccount` so the UI can hook in directly.
3. **[W13-DEBT-3]** `eligible1099K` flag is currently always false at onboarding. Threshold-monitoring job to flip it (`gross >= $20k AND >= 200 transactions in calendar year`) is not implemented; tracked for the same release window as 1099-K reporting (Phase 3, post-W34).
4. **[W13-DEBT-4]** Subscription record carries `cancelAtPeriodEnd` but no automated job converts a `cancel_at_period_end=true` subscription to `cancelled` at period end. Stripe sends `customer.subscription.deleted` at the boundary, which the handler will process — no separate job needed. Documented for Week 14 verification.

---

## 9. Index / Rule Changes

- `firestore.rules` — 4 new explicit `match` blocks added for:
  - `tenants/{tenantId}/billing/{docId}` — read: platform admin or tenant owner/admin; write: platform admin only.
  - `tenants/{tenantId}/billingWebhookIdempotency/{eventId}` — read/write: platform admin only.
  - `tenants/{tenantId}/connect/{docId}` — read: platform admin or tenant owner/admin; write: platform admin only.
  - `tenants/{tenantId}/connectWebhookIdempotency/{eventId}` — read/write: platform admin only.
- No new Firestore composite indexes — singleton-doc reads + simple existence checks only.

---

## 10. Files Changed

### Added
- `src/domains/billing/model.ts`
- `src/domains/billing/repository.ts`
- `src/domains/billing/subscriptionService.ts`
- `src/domains/billing/index.ts`
- `src/domains/billing/__tests__/repository.test.ts`
- `src/domains/billing/__tests__/subscriptionService.test.ts`
- `src/domains/connect/model.ts`
- `src/domains/connect/repository.ts`
- `src/domains/connect/connectService.ts`
- `src/domains/connect/index.ts`
- `src/domains/connect/__tests__/repository.test.ts`
- `src/domains/connect/__tests__/connectService.test.ts`
- `documentation/new-platform/WEEK13_CLOSE_REPORT.md` (this file)

### Modified
- `firestore.rules` — 4 new collection rules
- `documentation/new-platform/WEEKLY_LOG.md` — Week 13 entry appended
- `documentation/PROGRAM_TRACKING_BOARD.md` — Week 13 cards moved to Done

---

## 11. Test-State-Transition Coverage Summary

### Subscription state-machine coverage (43 tests)

| Transition / scenario | Test |
|---|---|
| `mapStripeStatus` for all 8 Stripe statuses | ✅ 8 cases |
| Unknown Stripe status throws | ✅ |
| `isValidTransition` allowed (9 samples) | ✅ |
| `isValidTransition` forbidden (4 samples) | ✅ |
| `pastDueSince` stamped on first entry to past_due | ✅ |
| `pastDueSince` preserved across past_due updates | ✅ |
| `pastDueSince` cleared on recovery to active | ✅ |
| Illegal transition throws | ✅ |
| `customer.subscription.created` → trialing | ✅ |
| Idempotent replay of created event → duplicate outcome, no double-write | ✅ |
| trialing → active on subscription.updated{active} | ✅ |
| active → past_due on invoice.payment_failed (with pastDueSince stamp) | ✅ |
| past_due → active on invoice.payment_succeeded (clears pastDueSince) | ✅ |
| invoice.payment_succeeded on active → ignored (idempotency recorded) | ✅ |
| active → suspended on subscription.updated{unpaid} | ✅ |
| Any → cancelled on subscription.deleted | ✅ |
| trial_will_end → ignored | ✅ |
| Cancelled → active rejected (illegal transition) | ✅ |
| Non-create event with no subscription throws | ✅ |
| Empty event id / tenantId rejected | ✅ |
| created event without subscription payload rejected | ✅ |

### Connect state-machine coverage (31 tests)

| Transition / scenario | Test |
|---|---|
| `deriveConnectStatusFromAccount` — active path | ✅ |
| `deriveConnectStatusFromAccount` — restricted (charges disabled) | ✅ |
| `deriveConnectStatusFromAccount` — restricted (payouts disabled) | ✅ |
| `deriveConnectStatusFromAccount` — pending_verification (no details) | ✅ |
| `deriveConnectStatusFromAccount` — pending_verification (requirements outstanding) | ✅ |
| `isValidConnectTransition` allowed (5 samples) | ✅ |
| `isValidConnectTransition` forbidden (2 samples) | ✅ |
| US salon onboarding without tax form throws | ✅ |
| US salon onboarding with W-9 captures form + timestamp | ✅ |
| Non-US salon onboarding permits null tax form | ✅ |
| Initial onboard persists pending_verification | ✅ |
| pending_verification → active on full Stripe approval | ✅ |
| active → restricted captures restriction reasons | ✅ |
| restricted → active clears restriction reasons | ✅ |
| Idempotent replay of account.updated → duplicate outcome | ✅ |
| payout.failed records timestamp + reason without status change | ✅ |
| payout.paid → ignored (idempotency recorded) | ✅ |
| account.updated with no existing account throws | ✅ |
| Empty event id / tenantId rejected | ✅ |

---

## 12. Phase Position

Week 13 of the Weeks 13–20 phase complete. Week 14 (Stripe Tax + Free Trial Lifecycle + Subscription/Trial Gating) consumes both `subscriptionService` and `connectService` directly:

- 14.0 Stripe Tax wires into the SaaS billing checkout path that creates the initial `customer.subscription.created` event consumed here.
- 14.1 Free Trial Lifecycle reads `Subscription.trialEndsAt` to drive the expiry job.
- 14.2 Subscription and Trial Feature Gating reads `Subscription.status` to enforce `past_due` grace and `suspended` access gate; reads `ConnectAccount.status` to gate in-app payment availability.

No code blockers entering Week 14.

---

## 13. Go-Forward Gate Decision

| Gate | Result |
|------|--------|
| Both Week 13 tasks delivered | ✅ Pass |
| Test suite clean (1300 tests, 0 failures) | ✅ Pass |
| TypeScript errors: 0 | ✅ Pass |
| Web smoke gate (6/6) | ✅ Pass |
| Native smoke gate (22/22) | ✅ Pass |
| Security audit: 0 open P0/P1/P2 findings | ✅ Pass |
| Firestore rules updated for new collections | ✅ Pass |

**RECOMMENDATION: GO for Week 14.**
