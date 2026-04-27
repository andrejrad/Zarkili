# Week 14 Close Report — Free Trial & Gating

**Phase:** Phase 1 — Multi-Tenant Foundation (Weeks 13–20)
**Sprint window:** Week 14 (single execution day)
**Status:** ✅ COMPLETE — GO for Week 15 (Salon Onboarding Wizard v1)
**Author:** GitHub Copilot (agent execution)

---

## 1. Scope Delivered

| Task | Title | Outcome |
|------|-------|---------|
| 14.0 | Stripe Tax integration (US sales tax + EU VAT) | ✅ Domain + cache + local rule engine; Cloud Function wiring deferred to W14-DEBT-1 |
| 14.1 | Free Trial Lifecycle Engine | ✅ State machine, idempotent expiry job, activation guard |
| 14.2 | Subscription & Trial Feature Gating | ✅ 5-feature gate matrix, past-due grace, denial audit log |

---

## 2. Files Changed

### New domain — `src/domains/tax/` (Task 14.0)
- [src/domains/tax/model.ts](src/domains/tax/model.ts) — `TaxQuote`, `TaxCalculation`, US-state and EU-VAT rule helpers, `TaxError` taxonomy.
- [src/domains/tax/repository.ts](src/domains/tax/repository.ts) — Cache layer at `tenants/{tenantId}/taxCalculations/{quoteId}` and `platform/__platform__/taxCalculations/{quoteId}`.
- [src/domains/tax/taxService.ts](src/domains/tax/taxService.ts) — `createTaxService` with TTL cache + `TaxProvider` port; `createLocalTaxProvider` for tests/preview; `computeTaxLocally` deterministic rule engine.
- [src/domains/tax/index.ts](src/domains/tax/index.ts) — Re-exports.
- [src/domains/tax/__tests__/taxService.test.ts](src/domains/tax/__tests__/taxService.test.ts) — 35 tests (US states, NYC surcharge, EU VAT, reverse-charge, cache hit/miss, TTL expiry, guards).
- [src/domains/tax/__tests__/repository.test.ts](src/domains/tax/__tests__/repository.test.ts) — 4 tests (path layout, tenant isolation, platform path).

### New domain — `src/domains/trial/` (Task 14.1)
- [src/domains/trial/model.ts](src/domains/trial/model.ts) — `Trial` record, `TrialStatus` (5-state), `canActivate`, `deriveTrialStatusAt`, state machine, `TrialError`.
- [src/domains/trial/repository.ts](src/domains/trial/repository.ts) — Singleton at `tenants/{tenantId}/trial/state` + idempotent job-run markers at `tenants/{tenantId}/trialJobRuns/{runId}` (atomic batch).
- [src/domains/trial/trialService.ts](src/domains/trial/trialService.ts) — `activateTrial`, `tickExpiry` (idempotent), `upgradeTrial`, plus pure helpers `buildInitialTrial`, `applyTick`, `applyUpgrade`.
- [src/domains/trial/index.ts](src/domains/trial/index.ts) — Re-exports.
- [src/domains/trial/__tests__/trialService.test.ts](src/domains/trial/__tests__/trialService.test.ts) — 38 tests (activation guard, custom length, state transitions, idempotency, upgrade paths).
- [src/domains/trial/__tests__/repository.test.ts](src/domains/trial/__tests__/repository.test.ts) — 4 tests (paths, atomic batch, isolation).

### New domain — `src/domains/gating/` (Task 14.2)
- [src/domains/gating/model.ts](src/domains/gating/model.ts) — `FEATURE_GROUPS` (booking, marketplace, campaigns, analytics, AI), `decideGate`, `PAST_DUE_GRACE_DAYS=7`, per-feature policy override (revoke-on-past-due for campaigns + AI), `buildDenialAudit`.
- [src/domains/gating/repository.ts](src/domains/gating/repository.ts) — Append-only audit at `tenants/{tenantId}/gateDenials/{autoId}`.
- [src/domains/gating/gatingService.ts](src/domains/gating/gatingService.ts) — `check`, `checkAll`, `assertAllowed` (throws `GateDeniedError`), optional `auditWarnings`.
- [src/domains/gating/index.ts](src/domains/gating/index.ts) — Re-exports.
- [src/domains/gating/__tests__/gatingService.test.ts](src/domains/gating/__tests__/gatingService.test.ts) — 49 tests (full gate matrix × feature, past-due grace lifecycle, trial-only fallbacks, audit recording, assertAllowed throw behaviour).

### Modified
- [firestore.rules](firestore.rules) — 4 new explicit match blocks before catch-all deny: `taxCalculations`, `platform/{platformId}/taxCalculations`, `trial/{docId}` + `trialJobRuns/{runId}`, `gateDenials/{docId}`. Tenant owner/admin reads; platformAdmin writes (job runs are platform-only read+write).
- [documentation/new-platform/WEEKLY_LOG.md](documentation/new-platform/WEEKLY_LOG.md) — Week 14 entry appended.
- [documentation/PROGRAM_TRACKING_BOARD.md](documentation/PROGRAM_TRACKING_BOARD.md) — D-060…D-063 added to Done lane.

---

## 3. Tax Jurisdiction Coverage Matrix

| Buyer location | Service product | Tax outcome | Reason code |
|----------------|-----------------|-------------|-------------|
| US — CT, HI, NM, SD, WV | personal service | state rate (4%–6.35%) | `us_state_taxable_service` |
| US — NYC (NY State, city = "New York") | personal service | 4.5% local surcharge | `nyc_surcharge` |
| US — NY State (non-NYC), CA, TX, FL, … | personal service | 0%, audited | `us_state_nontaxable_service` |
| US — any state | platform SaaS | delegated to Stripe Tax | `out_of_scope` |
| EU member — B2C cross-border | personal service | destination VAT rate | `eu_vat_standard` |
| EU member — B2B cross-border w/ VAT id | personal service | 0%, reverse-charge | `eu_vat_reverse_charge` |
| EU domestic B2B | personal service | destination VAT rate (no reverse) | `eu_vat_standard` |
| Anywhere else | any | 0%, audited | `out_of_scope` |

Caching: per (tenantId|platform, quoteId) for 15 minutes by default; configurable via `DEFAULT_TAX_CACHE_TTL_SECONDS` override.

---

## 4. Trial Lifecycle State Machine

```
not_started ──activate (onboarding✓ + launch✓)──▶ active
active ──tick (≤3d remaining)──▶ expiring_soon
active|expiring_soon ──tick (endsAt < now)──▶ expired
active|expiring_soon ──upgrade──▶ upgraded
expired ──upgrade──▶ upgraded   (recoverable)
upgraded ──(terminal)──▶ upgraded
```

- Default trial length: 14 days (override via `TrialService.activateTrial(_, _, { trialLengthDays })`).
- `expiring_soon` window: 3 days (`EXPIRING_SOON_WINDOW_DAYS`).
- Activation requires `onboardingComplete && launchActivated` — otherwise `TrialError("ACTIVATION_BLOCKED")`.

### Job idempotency strategy

Every expiry-job invocation must supply a `runId` (typically a UTC date bucket like `"2026-04-26T00"`). The repository writes the trial transition + the run marker in a single `writeBatch`, so:

- A retry within the same bucket is a no-op (`outcome: "duplicate"`).
- A no-state-change tick still records the marker (`outcome: "noop"`) so we don't re-poll Firestore on the next retry.
- A genuine transition writes both marker + new trial state atomically — they cannot diverge.

---

## 5. Gating Decision Matrix

| Subscription status | Trial status | booking | marketplace | analytics | campaigns | AI |
|---------------------|--------------|---------|-------------|-----------|-----------|-----|
| `active` | * | allow | allow | allow | allow | allow |
| `trialing` | `active` | allow | allow | allow | allow | allow |
| `trialing` | `expiring_soon` | warn | warn | warn | warn | warn |
| `trialing` | `expired` | deny | deny | deny | deny | deny |
| `past_due` (≤7d since `pastDueSince`) | * | warn | warn | warn | **deny** | **deny** |
| `past_due` (>7d) | * | deny | deny | deny | deny | deny |
| `suspended` | * | deny | deny | deny | deny | deny |
| `cancelled` | * | deny | deny | deny | deny | deny |
| `null` (no sub) | `not_started` | deny | deny | deny | deny | deny |
| `null` (no sub) | `active` | allow | allow | allow | allow | allow |
| `null` (no sub) | `upgraded` | allow | allow | allow | allow | allow |

Outcomes: **allow** (full access), **warn** (`allow_with_warning` — admin shell renders banner + upgrade CTA), **deny** (UI/back-end refuse + record `gateDenials` event).

### Denial audit model

```ts
type GateDenialAuditEvent = {
  tenantId: string;
  userId: string | null;
  feature: FeatureGroup;
  outcome: "allow_with_warning" | "deny";
  reason: GateReason;
  subscriptionStatus: SubscriptionStatus | null;
  trialStatus: TrialStatus | null;
  attemptedAt: Timestamp;
};
```

By default only `deny` outcomes are persisted. Set `auditWarnings: true` on the service for higher-fidelity compliance review (e.g. during an investigation).

---

## 6. Security Audit

- **Firestore rules:** every new collection has an explicit match block before the catch-all deny.
  - `taxCalculations` (tenant + platform): tenant owner/admin read; platformAdmin write.
  - `trial/{docId}`: tenant owner/admin read; platformAdmin write.
  - `trialJobRuns/{runId}`: platformAdmin read + write only.
  - `gateDenials/{docId}`: tenant owner/admin read; platformAdmin write.
- **Idempotency keys:** `quoteId` (sha256 of canonical request) for tax; `runId` (bucketed) for trial expiry. All write paths combine state + marker via `writeBatch` so partial failures are impossible.
- **No PHI flows through tax calls** (HIPAA non-applicability preserved — only tenant address, buyer address, and aggregate amounts are sent to Stripe Tax in production).
- **Bypass-resistance:** gating decisions are computed server-side from canonical Subscription + Trial reads; UI banners are advisory only, real enforcement lives in the same `decideGate` function the Cloud Function will call (no UI/back-end drift possible).

---

## 7. Test Coverage Summary

| Suite | Tests |
|-------|-------|
| `tax/__tests__/repository.test.ts` | 4 |
| `tax/__tests__/taxService.test.ts` | 35 |
| `trial/__tests__/repository.test.ts` | 4 |
| `trial/__tests__/trialService.test.ts` | 38 |
| `gating/__tests__/gatingService.test.ts` | 49 |
| **Week 14 total** | **130** |

---

## 8. Week-end Gate Results

| Gate | Result |
|------|--------|
| `npm test -- --watch=false` | ✅ **1,430 / 1,430** tests passing across 86 suites (was 1,300 / 81 — Δ +130 / +5) |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx eslint src/domains/tax src/domains/trial src/domains/gating` | ✅ 0 errors |
| `npm run test:smoke:web` | ✅ 6 / 6 |
| `npm run test:smoke:native` | ✅ 22 / 22 |

---

## 9. Debt Register (deferred to later weeks)

| ID | Description | Target |
|----|-------------|--------|
| W13-DEBT-1 | Cloud Function `stripeWebhookHandler` wiring `createSubscriptionService(...).applyWebhookEvent(event)` | Week 14 backend follow-up (carried) |
| W13-DEBT-4 | Verify `cancelAtPeriodEnd=true` flow via `customer.subscription.deleted` | Carried |
| W14-DEBT-1 | Cloud Function `stripeTaxCalculate` provider that calls Stripe Tax API and persists with the same TTL semantics; replace `createLocalTaxProvider` in production wiring | Week 14 backend follow-up |
| W14-DEBT-2 | Cloud Scheduler job that invokes `tickExpiry(tenantId, runId)` for every active-trial tenant on an hourly cadence | Week 14 backend follow-up |
| W14-DEBT-3 | Admin shell suspension banner + upgrade CTA component (consumes `GateDecision.message`) | Phase 3 W34 |
| W14-DEBT-4 | Tax breakdown surfaces on consumer/admin receipts and admin invoices | Phase 3 W34 |
| W14-DEBT-5 | EU VAT id format validation (Stripe Tax handles canonical validation; pre-flight via VIES) | Optional, Week 16 |

KI-001 (staffSchedules RBAC) and KI-003 (Firestore emulator rule tests) remain open and will be retired in Week 15 alongside the onboarding wizard work.

---

## 10. Recommendation

**GO for Week 15 — Salon Onboarding Wizard v1.**

The Week 14 surface gives Week 15 everything it needs:

- `TrialService.activateTrial` is the launch trigger fired at the wizard's final step.
- `GatingService` already understands the post-activation state, so the wizard can render the trial banner the moment activation succeeds.
- `TaxService` is ready to power tax-jurisdiction summaries on the wizard's *Business Profile* step (the Phase 3 W33 admin tenant settings will reuse the same cache).

No P0/P1 issues introduced. Pre-existing lint warnings in unrelated files (waitlist, templates, messages) remain as legacy debt and are unaffected by this week.
