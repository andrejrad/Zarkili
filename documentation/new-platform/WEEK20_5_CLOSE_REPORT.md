# Week 20.5 Close Report — Pre-W21 Backend Debt Pass

**Window:** Single-day debt-clearance pass between W20 close and W21 start.
**Status:** Complete — 6 debts shipped + tested — GO for Week 21.
**Sibling:** [WEEK20_CLOSE_REPORT.md](WEEK20_CLOSE_REPORT.md) (the W20 functional close).
**Bundle:** "(b) backend-only debt pass" — selected by the user from the W20.5 triage.

---

## 1. Scope decisions

After W20 close the open-debt audit surfaced 17 carried items. The user picked the "backend-only" bundle so consumer-UI work in W21 can land on a clean backend surface:

| ID | Severity | Source | Outcome |
|----|----------|--------|---------|
| W18-DEBT-1 | High | W18 | **closed** — Stripe Tax onCall callable |
| W14-DEBT-5 | Low (blocked W18-1 polish) | W14 | **closed** — EU VAT format pre-flight |
| W17-DEBT-3 | Low | W17 | **closed** — marketplace post commission lint |
| W17-DEBT-2 | Medium | W17 | **closed** — marketplace acquisitions repo |
| W20-DEBT-1 | Low | W20 | **closed** — risk-policy admin write side |
| W16-DEBT-1 | Medium | W16 | **closed** — onboarding session persistence |

Out of scope (intentionally deferred to their original target weeks): W11-DEBT-1, W13-DEBT-2/3, W14-DEBT-3/4, W15-DEBT-1/3, W17-DEBT-1, W19-DEBT-4/5, W20-DEBT-2/3/4, KI-003/004.

---

## 2. Deliverables

### 2.1 W14-DEBT-5 — EU VAT format pre-flight

- New `src/domains/tax/vatValidation.ts`
  - `validateEuVatIdFormat(input)` — returns `{ valid, country?, normalised? }`; rejects on bad country code or pattern mismatch.
  - `normaliseEuVatId(input)` — strips whitespace / dots / dashes and uppercases.
  - 27-member-state regex map. Greece uses `EL` (not `GR`) per VIES canonical form.
- Re-exported from `src/domains/tax/index.ts`.
- Tests: `src/domains/tax/__tests__/vatValidation.test.ts` — **14 / 14 passing**.

### 2.2 W17-DEBT-3 — marketplace post commission-language lint

- New `src/domains/marketplace/marketplacePostsService.ts`
  - Thin wrapper that runs `assertNoCommissionMessaging` over title + description on `createPost` / `updatePost` before delegating to the repository.
- Re-exported from `src/domains/marketplace/index.ts`.
- Tests: `src/domains/marketplace/__tests__/marketplacePostsService.test.ts` — **10 / 10 passing**.

### 2.3 W17-DEBT-2 — marketplace acquisitions persistence

- New `src/domains/marketplace/marketplaceAcquisitionsRepository.ts`
  - `saveAcquisition(tenantId, attribution)` — writes to `tenants/{tenantId}/marketplaceAcquisitions/{bookingId}`; doc id = bookingId so the booking pipeline can call this idempotently.
  - `getAcquisition(tenantId, bookingId)`.
  - `listAcquisitions(tenantId, opts)` — newest-first by `createdAt`.
  - `persistMarketplaceAcquisition(tenantId, bookingInput, attribution)` — booking-pipeline helper that builds + saves in one call.
- Re-exported from `src/domains/marketplace/index.ts`.
- Tests: `src/domains/marketplace/__tests__/marketplaceAcquisitionsRepository.test.ts` — **12 / 12 passing**.

### 2.4 W20-DEBT-1 — Risk policy persistence (read + admin write)

- New `src/domains/ai/riskPolicyRepository.ts` (read side, client SDK)
  - `validateRiskPolicy(input)` — invariants: all four thresholds in `[0, 1]`, strictly monotonic `deposit < prepayment < manualReview < block`.
  - `mergeRiskPolicy(base, patch)` — partial-update helper.
  - `createRiskPolicyRepository(db)` exposes `getPolicy(tenantId)` and `resolvePolicy(tenantId, fallback)`; Firestore path `tenants/{tid}/riskPolicy/current`.
- New `functions/src/riskPolicyAdmin.ts` (write side, admin SDK)
  - `getRiskPolicyAdmin` and `updateRiskPolicyAdmin` onCall callables.
  - RBAC: `tenant_admin` scoped via `auth.token.tenantId` custom claim; `platform_admin` operates cross-tenant.
  - Same validation as the read side; types duplicated locally so `functions/` carries no client-SDK dep (mirrors W18 trial-expiry pattern).
- Re-exports added to `src/domains/ai/index.ts` and `functions/src/index.ts`.
- Tests:
  - `src/domains/ai/__tests__/riskPolicyRepository.test.ts` — **17 / 17 passing**.
  - `functions/test/riskPolicyAdmin.test.ts` — **17 / 17 passing**.

### 2.5 W18-DEBT-1 — `stripeTaxCalculate` onCall callable

The oldest open backend debt (W14 → W18 → W19 → W20). Closed.

- New `functions/src/stripe/taxAdapter.ts`
  - Pure mapper `buildStripeTaxRequestParams(quote)` — `TaxQuote` → URL-encoded form params with `customer_details[address][...]` bracket notation.
  - Pure mapper `mapStripeTaxResponseToCalculation(quote, response)` — `StripeTaxCalculationResponse` → `TaxCalculation` matching the `createLocalTaxProvider` contract; per-item `taxableAmount` / `taxAmount` / `rate` / `jurisdiction` / `reason` derived from `tax_breakdown[0]` and `tax_rate_details`.
  - `StripeTaxApiClient` port for DI.
  - Real adapter `createStripeTaxApiClient(apiKey)` using native Node 20 `fetch` against `POST https://api.stripe.com/v1/tax/calculations`; HTTP Basic auth (api key as user, password empty); `Stripe-Version: 2024-06-20` pinned.
  - Domain types (`TaxQuote`, `TaxCalculation`, `Address`) are duplicated locally so `functions/` carries no client-SDK dep.
- New `functions/src/stripeTaxCalculate.ts`
  - Pure handler `runStripeTaxCalculate(quote, deps)` — cache check → call Stripe → map → persist → return `{ source: "cache" | "stripe", calculation }`.
  - `createAdminTaxCacheRepo(db)` admin-SDK adapter writing to `tenants/{tid}/taxCalculations/{quoteId}` (or `platform/__platform__/taxCalculations/{quoteId}` when seller has no tenant).
  - TTL = `DEFAULT_TAX_CACHE_TTL_SECONDS = 900` matching the local provider.
  - `stripeTaxCalculate` onCall callable.
  - RBAC: `tenant_admin` must match `seller.tenantId` via `auth.token.tenantId`; `platform_admin` operates cross-tenant; platform-tenant bucket is platform_admin only.
- Re-exports added to `functions/src/index.ts`.
- Tests:
  - `functions/test/stripe/taxAdapter.test.ts` — **13 / 13 passing**.
  - `functions/test/stripeTaxCalculate.test.ts` — **7 / 7 passing**.

### 2.6 W16-DEBT-1 — onboarding session persistence

- `src/app/onboarding/clientOnboardingOrchestrator.ts` extended (sync mutation API preserved):
  - New `OnboardingPersistencePort` (`save` / `load`).
  - Factory now takes optional `{ persistence, onPersistError }` — backward compatible (no-arg call still works; all 57 existing tests still green).
  - Every mutation (`startGuestOnboarding`, `startFullOnboarding`, `upgradeGuestToFull`, `completeModule`, `skipModule`, `updatePreferences`, `mergeWithExistingAccount`) calls `persistence.save(session)` fire-and-forget.
  - New async `restoreSession(sessionId)` hydrates a previously persisted session into the in-memory `Map`; bumps the internal id counter so subsequent `_nextId()` calls cannot clobber the restored session.
- New `src/app/onboarding/clientOnboardingFirestorePersistence.ts`
  - `createFirestoreOnboardingPersistence(db)` adapter writing to `userOnboardingDrafts/{sessionId}`.
  - `serialiseSession` strips `undefined` (Firestore rejects undefined fields).
  - `deserialiseSession` defends against client-side schema drift: filters unknown module values, coerces missing preferences into consent-safe defaults, returns `null` on missing required fields or invalid `mode`.
- Tests:
  - `src/app/onboarding/__tests__/clientOnboardingOrchestrator.persistence.test.ts` — **14 / 14 passing**.
  - `src/app/onboarding/__tests__/clientOnboardingFirestorePersistence.test.ts` — **7 / 7 passing**.
  - Plus all 57 original orchestrator tests still green.

---

## 3. Tests and Quality Outcomes

| Suite | Before W20.5 | After W20.5 | Delta |
|-------|------|------|-------|
| Root jest suites | 100 | **106** | +6 |
| Root jest tests | 1,667 | **1,741** | +74 |
| Functions vitest suites | 12 | **14** | +2 |
| Functions vitest tests | 150 | **187** | +37 |

- `npx tsc --noEmit` (root): 0 errors.
- `cd functions; npx tsc --noEmit`: 0 errors.
- Firestore rules tests (`jest.rules.config.js`) require the emulator; rules suite was not run in this pass (pre-existing — same condition as W20 close). KI-003 (CI emulator wiring) tracks the gap.

---

## 4. Security

- No Firestore rules changes.
- Two new admin callables (`getRiskPolicyAdmin`, `updateRiskPolicyAdmin`, `stripeTaxCalculate`):
  - All three enforce role + tenant scope at function entry.
  - `tenant_admin` is bound to `auth.token.tenantId`; cross-tenant access is `platform_admin` only.
  - Risk-policy validator rejects any payload that violates the deposit < prepayment < manualReview < block invariant — bad input cannot land in Firestore.
  - Stripe Tax callable persists to the tenant's bucket (or the platform-tenant bucket); platform-tenant writes are `platform_admin` only.
- No PII added to logs. Stripe API key reaches the function via the standard secret pipeline — no key value is logged.
- Marketplace post wrapper enforces the existing `assertNoCommissionMessaging` at write time, closing the path where a CMS submission could bypass the in-product UI lint.

---

## 5. Architectural Notes

- All six debts followed the canonical pattern: **pure helpers + DI ports + factory functions**; tests mock the ports with in-memory fakes. No production code reaches Firestore from a unit test.
- `functions/` continues to ship without a `stripe` SDK dependency — `stripeTaxCalculate` uses native `fetch` + `URLSearchParams`, mirroring the W18 webhook handler.
- Domain types crossing the root↔functions boundary are duplicated, never imported (mirrors the trial-expiry scheduler pattern). This keeps `functions/` decoupled from any client-SDK transitive deps.
- `clientOnboardingOrchestrator` kept its sync mutation surface intact. Persistence is fire-and-forget; hydration is the only async addition, so consumer-UI work in W21 can adopt persistence without rewriting any flows.

---

## 6. Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))

- **Closed in W20.5 (6):** W14-DEBT-5, W16-DEBT-1, W17-DEBT-2, W17-DEBT-3, W18-DEBT-1, W20-DEBT-1.
- **No new debts opened.**
- **Open after W20.5:** KI-003, KI-004, W11-DEBT-1, W13-DEBT-2, W13-DEBT-3, W14-DEBT-3, W14-DEBT-4, W15-DEBT-1, W15-DEBT-3, W17-DEBT-1, W19-DEBT-4, W19-DEBT-5, W20-DEBT-2, W20-DEBT-3, W20-DEBT-4.

---

## 7. Index — Changed Files

**New (production):**
- `src/domains/tax/vatValidation.ts`
- `src/domains/marketplace/marketplacePostsService.ts`
- `src/domains/marketplace/marketplaceAcquisitionsRepository.ts`
- `src/domains/ai/riskPolicyRepository.ts`
- `src/app/onboarding/clientOnboardingFirestorePersistence.ts`
- `functions/src/stripe/taxAdapter.ts`
- `functions/src/stripeTaxCalculate.ts`
- `functions/src/riskPolicyAdmin.ts`

**New (tests):**
- `src/domains/tax/__tests__/vatValidation.test.ts`
- `src/domains/marketplace/__tests__/marketplacePostsService.test.ts`
- `src/domains/marketplace/__tests__/marketplaceAcquisitionsRepository.test.ts`
- `src/domains/ai/__tests__/riskPolicyRepository.test.ts`
- `src/app/onboarding/__tests__/clientOnboardingOrchestrator.persistence.test.ts`
- `src/app/onboarding/__tests__/clientOnboardingFirestorePersistence.test.ts`
- `functions/test/stripe/taxAdapter.test.ts`
- `functions/test/stripeTaxCalculate.test.ts`
- `functions/test/riskPolicyAdmin.test.ts`

**Modified:**
- `src/app/onboarding/clientOnboardingOrchestrator.ts` (optional persistence DI; `restoreSession`)
- `src/domains/tax/index.ts` (re-exports)
- `src/domains/marketplace/index.ts` (re-exports)
- `src/domains/ai/index.ts` (re-exports)
- `functions/src/index.ts` (re-exports for the three new callables)
- `documentation/new-platform/DEBT_REGISTER.md` (six rows flipped + operational view + Closed list)
- `documentation/new-platform/WEEKLY_LOG.md` (W20.5 entry)
- `documentation/PROGRAM_TRACKING_BOARD.md` (debt-pass entry)

---

## 8. Next-Week Prerequisites (Week 21)

W21 enters the Phase 2 consumer-UI plan with:
- A persistent onboarding wizard backend (W16-DEBT-1 closed).
- A locked-down marketplace post path (W17-DEBT-3 closed) and a working acquisition sink (W17-DEBT-2 closed).
- A production Stripe Tax callable (W18-DEBT-1 closed).
- Tenant-policy plumbing for risk thresholds (W20-DEBT-1 closed).
- A low-friction VAT pre-flight for admin onboarding UX (W14-DEBT-5 closed).

No backend prerequisites remain blocking W21.
