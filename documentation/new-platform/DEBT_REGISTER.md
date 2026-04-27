# Debt Register

**Single source of truth for deferred work, technical debt, and known issues across all weeks.**

| Field | Meaning |
|-------|---------|
| `ID` | Stable identifier — `Wnn-DEBT-n` (week-scoped) or `KI-nnn` (pre-W11 known issues) or `Wnn-HARDENING-n` (security debt). |
| `Source` | The week (and document) where the item was first recorded. |
| `Target` | When/where the item is scheduled to be resolved. |
| `Status` | `open` · `in-progress` · `closed` (with the closing week). |
| `Severity` | `Low` · `Medium` · `High` — operational impact if it stays open. |
| `Owner` | Who carries it (defaults to platform engineering). |

## Protocol

1. **Week-start:** the agent reads this file, filters to rows where `Status = open|in-progress` AND `Target ≤ current week`, and includes them in that week's plan.
2. **Week-end:** the agent (a) appends any newly deferred items, (b) flips resolved rows to `closed (Wnn)`, (c) links the resolving close report.
3. **Audit:** every close report's "Debt Register" section must reference an `ID` from this table — no orphan debt outside the register.

The register is the operational truth; the per-week close reports remain the historical detail.

---

## Pre-Week 11 Known Issues (rolled up into PILOT_GO_LIVE.md)

Weeks 1–10 did not use the `Wnn-DEBT-n` convention. Carry-over items from that period were captured as `KI-nnn` ("Known Issue") in [PILOT_GO_LIVE.md](PILOT_GO_LIVE.md) and [PHASE1_COMPLETION_REPORT.md](PHASE1_COMPLETION_REPORT.md).

| ID | Source | Description | Severity | Target | Status |
|----|--------|-------------|----------|--------|--------|
| KI-001 | W9 (RBAC milestone) — [PILOT_GO_LIVE.md](PILOT_GO_LIVE.md) | `staffSchedules` reads restricted to `tenant_owner`/`tenant_admin`; `location_manager` cannot read own-location schedules | Low | Week 15 | **closed (W15)** — verified during W15 audit: `firestore.rules` line 29 includes `location_manager` in `isTenantAdmin`, and `staffSchedules` allows reads via `isTenantMember`. Repository (`src/domains/staff/staffSchedulesRepository.ts`) has no service-layer role check. KI-001 was already silently resolved at the rules layer. |
| KI-002 | W10 (booking slot tokens) — [PILOT_GO_LIVE.md](PILOT_GO_LIVE.md) | `bookingSlotTokens` expiry is app-enforced only; expired tokens not auto-purged from Firestore | Low | Week 16 (combine with feature-flag/maintenance Cloud Function) | **closed (W16)** — `purgeExpiredSlotTokens` scheduled Cloud Function ships in `functions/src/purgeSlotTokens.ts`, runs daily at 02:30 UTC, deletes tokens with `date < today − 1 day` in 400-doc batches; 9 vitest cases cover cutoff math + boundary + scale |
| KI-003 | W9 (Firestore rules) — [PILOT_GO_LIVE.md](PILOT_GO_LIVE.md) | Firestore emulator rule tests not yet written for loyalty/campaigns collections | Low | Week 16 (rolled forward from W15 — W15 added rules tests for new onboarding subcollections; emulator wiring still deferred) | open |
| KI-004 | W10 (rollout strategy) — [PILOT_GO_LIVE.md](PILOT_GO_LIVE.md) | No tenant-level feature flags — toggling features requires a code deploy | Medium | Week 16 (per Phase 1 plan §16.2) | open |

**Note on Weeks 1–10:** all functional acceptance criteria for those weeks were met without spawning week-specific debt; only the four `KI` items above persisted. There are no other open items from that period.

---

## Week 11 — Analytics & Campaign Insights

| ID | Source | Description | Severity | Target | Status |
|----|--------|-------------|----------|--------|--------|
| W11-DEBT-1 | W11 — [WEEKLY_LOG.md](WEEKLY_LOG.md) (line ~52) | Date and location *Change* buttons fire callback stubs; no actual date or location picker components are wired | Low | Week 16 (Phase 2 W21 client preference work, per Phase 1 plan §16.2) | open |
| W11-DEBT-2 | W11 — [WEEKLY_LOG.md](WEEKLY_LOG.md) (line ~53) | Booking-completion event emission into the campaign send-log pipeline is not implemented (`converted` metric model is in place but not fed) | Medium | Week 16 (Phase 1 plan §16.2) | **closed (W16)** — repository now exposes `markSendLogConverted(tenantId, logId, conversionRef)`: idempotent flag flip on the send-log doc plus atomic `metrics.converted++` on the parent campaign; `CampaignSendLog` extended with `converted`, `conversionRef`, `convertedAt`; 6 new repo tests |

---

## Week 12 — Security & Rules Hardening

| ID | Source | Description | Severity | Target | Status |
|----|--------|-------------|----------|--------|--------|
| W12-HARDENING-1 | W12 — [WEEK12_CLOSE_REPORT.md](WEEK12_CLOSE_REPORT.md) | `reportingService` and `campaignAnalyticsService` lacked `actorRole` RBAC layer (defense-in-depth) | High | Week 12 | **closed (W12)** — 9 methods × 2 services hardened |
| W12-HARDENING-2 | W12 — [WEEK12_CLOSE_REPORT.md](WEEK12_CLOSE_REPORT.md) | Missing/implicit Firestore rules for several collections | High | Week 12 | **closed (W12)** — 11 explicit rules blocks added; documented in [SECURITY_RULES_FINAL.md](SECURITY_RULES_FINAL.md) |

---

## Week 13 — Stripe Billing & Connect

| ID | Source | Description | Severity | Target | Status |
|----|--------|-------------|----------|--------|--------|
| W13-DEBT-1 | W13 — [WEEK13_CLOSE_REPORT.md](WEEK13_CLOSE_REPORT.md) | Cloud Function `stripeWebhookHandler` not yet wired — needs to instantiate `createSubscriptionService` + `createConnectService` and call `applyWebhookEvent` / `applyAccountEvent` | High | Week 18 — closed in [WEEK18_CLOSE_REPORT.md](WEEK18_CLOSE_REPORT.md) §2.2 (admin-SDK adapters + pure dispatchers; +64 vitest tests including signed-payload e2e) | **closed** |
| W13-DEBT-2 | W13 — [WEEK13_CLOSE_REPORT.md](WEEK13_CLOSE_REPORT.md) | No admin UI for billing or Stripe Connect health surfaces | Medium | Phase 3 — Week 34 (B-021) | open |
| W13-DEBT-3 | W13 — [WEEK13_CLOSE_REPORT.md](WEEK13_CLOSE_REPORT.md) | `eligible1099K` flag never flipped to true — threshold-monitoring job (`gross ≥ $20k AND ≥ 200 transactions / calendar year`) not implemented | Medium | Phase 3 — post-W34 (1099-K reporting window) | open |
| W13-DEBT-4 | W13 — [WEEK13_CLOSE_REPORT.md](WEEK13_CLOSE_REPORT.md) | `cancelAtPeriodEnd=true` boundary handling not yet verified end-to-end (relies on Stripe `customer.subscription.deleted` at period end — confirm webhook lands and transitions to `cancelled`) | Low | Week 18 — closed in [WEEK18_CLOSE_REPORT.md](WEEK18_CLOSE_REPORT.md) §2.2 (parser preserves verbatim; dispatcher writes through; handler integration test asserts persisted doc) | **closed** |

---

## Week 14 — Stripe Tax + Free Trial + Gating

| ID | Source | Description | Severity | Target | Status |
|----|--------|-------------|----------|--------|--------|
| W14-DEBT-1 | W14 — [WEEK14_CLOSE_REPORT.md](WEEK14_CLOSE_REPORT.md) | Cloud Function `stripeTaxCalculate` provider that calls Stripe Tax API and persists with the same TTL semantics as `createLocalTaxProvider` | High | Renamed → **W18-DEBT-1** in W18 close (deferred from W18 backend pass for scope; rationale in [WEEK18_CLOSE_REPORT.md](WEEK18_CLOSE_REPORT.md) §5) | superseded |
| W14-DEBT-2 | W14 — [WEEK14_CLOSE_REPORT.md](WEEK14_CLOSE_REPORT.md) | Cloud Scheduler job that invokes `tickExpiry(tenantId, runId)` for every active-trial tenant on an hourly cadence | High | Week 18 — closed in [WEEK18_CLOSE_REPORT.md](WEEK18_CLOSE_REPORT.md) §2.3 (`trialExpiryHourly` onSchedule + pure handler + 11 vitest tests) | **closed** |
| W14-DEBT-3 | W14 — [WEEK14_CLOSE_REPORT.md](WEEK14_CLOSE_REPORT.md) | Admin shell suspension banner + upgrade CTA component (consumes `GateDecision.message`) | Medium | Phase 3 — Week 34 | open |
| W14-DEBT-4 | W14 — [WEEK14_CLOSE_REPORT.md](WEEK14_CLOSE_REPORT.md) | Tax breakdown surfaces on consumer/admin receipts and admin invoices | Medium | Phase 3 — Week 34 | open |
| W14-DEBT-5 | W14 — [WEEK14_CLOSE_REPORT.md](WEEK14_CLOSE_REPORT.md) | Pre-flight EU VAT id format validation via VIES (Stripe Tax handles canonical validation; this is for snappier admin UX feedback) | Low | Week 16 — optional | **closed (W20.5)** — [WEEK20_5_CLOSE_REPORT.md](WEEK20_5_CLOSE_REPORT.md): `src/domains/tax/vatValidation.ts` ships `validateEuVatIdFormat` + `normaliseEuVatId` covering all 27 EU member states (Greece = `EL`); 14 jest tests. |

---

## Week 15 — Salon Onboarding Wizard + Admin Controls

| ID | Source | Description | Severity | Target | Status |
|----|--------|-------------|----------|--------|--------|
| W15-DEBT-1 | W15 — [WEEK15_CLOSE_REPORT.md](WEEK15_CLOSE_REPORT.md) | Onboarding admin UI (status dashboard, action buttons) not yet built; service layer is fully wired but consumed only via tests | Medium | Phase 3 — Week 33 (admin UI plan) | open |
| W15-DEBT-2 | W15 — [WEEK15_CLOSE_REPORT.md](WEEK15_CLOSE_REPORT.md) | `OnboardingAdminService.extendTrial` accepts an injected `trialExtender`; production wiring to the trial domain is not done | Medium | Week 18 — closed in [WEEK18_CLOSE_REPORT.md](WEEK18_CLOSE_REPORT.md) §2.1 (`createTrialExtender` adapter + `applyExtension` pure helper + 12 jest tests) | **closed** |
| W15-DEBT-3 | W15 — [WEEK15_CLOSE_REPORT.md](WEEK15_CLOSE_REPORT.md) | Wizard onboarding screens (React Native) not yet built; only the service + repository layers are tested | Medium | Phase 2 — Week 21 (consumer UI plan) | open |
| W16-DEBT-1 | W16 — [WEEK16_CLOSE_REPORT.md](WEEK16_CLOSE_REPORT.md) | `clientOnboardingOrchestrator` stores sessions in an in-memory `Map`; cross-device resume requires persistence to `userOnboardingDrafts` | Medium | Phase 2 — Week 21 (paired with consumer-UI wizard wiring) | **closed (W20.5)** — [WEEK20_5_CLOSE_REPORT.md](WEEK20_5_CLOSE_REPORT.md): orchestrator factory now takes optional `OnboardingPersistencePort`; sync mutation API preserved (fire-and-forget save); new async `restoreSession(sessionId)` hydrates from store and bumps the id counter to avoid collisions; `createFirestoreOnboardingPersistence(db)` adapter writes to `userOnboardingDrafts/{sessionId}`; +21 jest tests (57 originals still green). |

---

## Open Items by Target Week (operational view)

> Sorted by next required action.

| Target | Open IDs |
|--------|----------|
| **Week 19+** | KI-003 (CI emulator infra), KI-004 (separate domain), W11-DEBT-1 (pulled with W11-DEBT-2 once admin UI lands) |
| **Phase 2 — W21** | W15-DEBT-3 |
| **Phase 2 — W22** | W17-DEBT-1 (consumer UI), W19-DEBT-4 |
| **Phase 3 — W33** | W15-DEBT-1 |
| **Phase 3 — W34** | W13-DEBT-2, W14-DEBT-3, W14-DEBT-4 |
| **Phase 3 — post-W34** | W13-DEBT-3 |
| **Post-launch (telemetry-driven)** | W19-DEBT-5, W20-DEBT-2, W20-DEBT-3, W20-DEBT-4 |

**Closed:** W12-HARDENING-1, W12-HARDENING-2, KI-001 (W15), KI-002 (W16), W11-DEBT-2 (W16), W13-DEBT-1 (W18), W13-DEBT-4 (W18), W14-DEBT-2 (W18), W15-DEBT-2 (W18), W19-DEBT-1 (W19), W19-DEBT-2 (W19), W19-DEBT-3 (W19), W14-DEBT-5 (W20.5), W16-DEBT-1 (W20.5), W17-DEBT-2 (W20.5), W17-DEBT-3 (W20.5), W18-DEBT-1 (W20.5), W20-DEBT-1 (W20.5).

---

## Week 17 — Marketplace Launch v1

| ID | Source | Description | Severity | Target | Status |
|----|--------|-------------|----------|--------|--------|
| W17-DEBT-1 | W17 — [WEEK17_CLOSE_REPORT.md](WEEK17_CLOSE_REPORT.md) | Marketplace feed/search/profile services are pure-logic (`discoveryService.ts`); the consumer-facing screens and Firestore-backed feed queries (e.g., `query(collectionGroup('marketplacePosts'), orderBy('createdAt', 'desc'), limit(N))` for cross-tenant browsing) are not yet wired | Medium | Phase 2 — Week 21 (consumer UI plan) | open |
| W17-DEBT-2 | W17 — [WEEK17_CLOSE_REPORT.md](WEEK17_CLOSE_REPORT.md) | `MarketplaceAttribution` is defined and built by `attributeAcquisition`; persisting it alongside booking creation (suggested path `tenants/{tenantId}/marketplaceAcquisitions/{bookingId}`) is not yet wired into the booking pipeline | Medium | Phase 2 — Week 22 (booking-pipeline integration) | **closed (W20.5)** — [WEEK20_5_CLOSE_REPORT.md](WEEK20_5_CLOSE_REPORT.md): `src/domains/marketplace/marketplaceAcquisitionsRepository.ts` ships `saveAcquisition` / `getAcquisition` / `listAcquisitions` plus the `persistMarketplaceAcquisition` booking-pipeline helper; doc id = bookingId for idempotency; +12 jest tests. |
| W17-DEBT-3 | W17 — [WEEK17_CLOSE_REPORT.md](WEEK17_CLOSE_REPORT.md) | `assertNoCommissionMessaging` is invoked by code-path callers but not yet wired as a CMS lint at marketplace-post write time | Low | Phase 3 — Week 33 (admin UI plan) | **closed (W20.5)** — [WEEK20_5_CLOSE_REPORT.md](WEEK20_5_CLOSE_REPORT.md): `src/domains/marketplace/marketplacePostsService.ts` thin wrapper runs `assertNoCommissionMessaging` over title + description on `createPost` / `updatePost` before delegating to the repository; +10 jest tests. |

---

## Week 18 — Stripe Backend Pass

| ID | Source | Description | Severity | Target | Status |
|----|--------|-------------|----------|--------|--------|
| W18-DEBT-1 | W18 — [WEEK18_CLOSE_REPORT.md](WEEK18_CLOSE_REPORT.md) §5 (was W14-DEBT-1) | Cloud Function `stripeTaxCalculate` — onCall callable that wraps `stripe.tax.calculations.create`, persists with TTL = `DEFAULT_TAX_CACHE_TTL_SECONDS = 900` matching the local provider, and exposes the same `TaxQuote → TaxCalculation` contract. Deferred from W18 because the Stripe-Tax-API integration (admin-SDK `TaxRepository` adapter + request-shape mapping + credentials) requires its own focused slot. | High | Week 20 (or first available slot in Phase 2) | **closed (W20.5)** — [WEEK20_5_CLOSE_REPORT.md](WEEK20_5_CLOSE_REPORT.md): `functions/src/stripe/taxAdapter.ts` (pure mappers `buildStripeTaxRequestParams` + `mapStripeTaxResponseToCalculation`, `StripeTaxApiClient` port, real adapter using native Node 20 fetch against `https://api.stripe.com/v1/tax/calculations` with `Stripe-Version: 2024-06-20`) + `functions/src/stripeTaxCalculate.ts` (onCall callable; admin-SDK cache repo at `tenants/{tid}/taxCalculations/{quoteId}` or `platform/__platform__/...`; TTL 900s; RBAC: tenant_admin matches seller.tenantId via custom claim, platform_admin cross-tenant); types duplicated locally so `functions/` carries no client-SDK dep; +20 vitest tests. |

---

## Week 19 — AI Assistance v1

W19 delivered three of six prompted AI tasks under a single shared cost-guard pattern (Tasks 19.1, 19.3, 19.5). The remaining three are larger orchestration/optimization engines that warrant dedicated slots and are tracked here.

| ID | Source | Description | Severity | Target | Status |
|----|--------|-------------|----------|--------|--------|
| W19-DEBT-1 | W19 — [WEEK19_CLOSE_REPORT.md](WEEK19_CLOSE_REPORT.md) §5 (Task 19.2) | AI Scheduling / Retention / Content Assistants triad. Retention slice is covered by Task 19.5 (`retentionInsightsService`). Scheduling assistant: `src/domains/ai/schedulingAssistantService.ts` (constraint-safe slot enumeration + heuristic ranking + AI augmentation). Content assistant: `src/domains/ai/contentAssistantService.ts` (tone-aware template fallback + AI generation + safety filter + needs-review approval queue). | Medium | W19 (re-closed) | **closed (W19)** — closed in same week as opened; +18 tests (scheduling 9, content 9). |
| W19-DEBT-2 | W19 — [WEEK19_CLOSE_REPORT.md](WEEK19_CLOSE_REPORT.md) §5 (Task 19.4) | AI Marketing Automation Orchestrator. Pure rules engine `evaluateRulesEngine` enforces trigger eligibility, per-channel consent, quiet-hours suppression (incl. wrap-midnight), per-campaign frequency cap, in-batch dedupe, and auto-send opt-in. AI personalisation gate runs only over rule-passed dispatches; cap-exhausted state degrades to rules-only. File: `src/domains/ai/marketingOrchestratorService.ts`. | Medium | W19 (re-closed) | **closed (W19)** — closed in same week as opened; +14 tests covering quiet-hours math (3), pure rules engine (6), and service-level guard/AI behaviour (5). |
| W19-DEBT-3 | W19 — [WEEK19_CLOSE_REPORT.md](WEEK19_CLOSE_REPORT.md) §5 (Task 19.6) | AI Scheduling Optimization Engine. Salon-side `analyzeDayPlan` (utilization ratio + low/high-load + tight-buffer flags + recommended buffer), rescheduling-on-cancellation `buildHeuristicRescheduleSuggestions` (same-staff preference + start-deviation ordering, never proposes colliding slots), AI augmentation re-validates picks against the constraint-safe set. Cap-exhausted: heuristic-only. File: `src/domains/ai/schedulingOptimizationService.ts`. | Medium | W19 (re-closed) | **closed (W19)** — closed in same week as opened; +10 tests covering day-plan analysis, heuristic rescheduling, and full guard pipeline. |
| W19-DEBT-4 | W19 — [WEEK19_CLOSE_REPORT.md](WEEK19_CLOSE_REPORT.md) §5 | Wire `ClientRetentionMetrics` analytics job that feeds `createRetentionInsightsService`. The service is pure logic over precomputed metrics; the upstream job (read booking history → emit metrics rows) is a separate slot. | Low | Phase 2 — Week 22 | open |
| W19-DEBT-5 | W19 — [WEEK19_CLOSE_REPORT.md](WEEK19_CLOSE_REPORT.md) §5 | Promote `chat-assistance` to its own `aiFeatureKeys` entry (currently buckets cost under `support-triage`). Trigger: 2-3 months of telemetry showing cost shapes diverge meaningfully. | Low | Post-launch (telemetry-driven) | open |

---

## Week 20 — AI Risk Models and Personalization

W20 delivered both prompted tasks (20.1 No-Show / Fraud Risk Scoring; 20.2 Marketplace Personalization Engine). The four debts below are the post-launch / data-pipeline follow-ups identified in [AI_RISK_MODEL_POLICY.md](AI_RISK_MODEL_POLICY.md) and [MARKETPLACE_PERSONALIZATION.md](MARKETPLACE_PERSONALIZATION.md).

| ID | Source | Description | Severity | Target | Status |
|----|--------|-------------|----------|--------|--------|
| W20-DEBT-1 | W20 — [WEEK20_CLOSE_REPORT.md](WEEK20_CLOSE_REPORT.md) §5 | Tenant-policy persistence layer for `RiskPolicy` (Firestore collection + admin callable to update deposit / prepayment / manual-review / block thresholds). Service today accepts `RiskInput.policy` directly; production needs a stored, versioned per-tenant policy. | Low | W22 | **closed (W20.5)** — [WEEK20_5_CLOSE_REPORT.md](WEEK20_5_CLOSE_REPORT.md): `src/domains/ai/riskPolicyRepository.ts` (read side: `validateRiskPolicy` enforces deposit < prepayment < manualReview < block in [0,1], `mergeRiskPolicy`, `createRiskPolicyRepository.getPolicy/resolvePolicy`) + `functions/src/riskPolicyAdmin.ts` (write side: `getRiskPolicyAdmin` + `updateRiskPolicyAdmin` onCall callables; tenant_admin scoped via `auth.token.tenantId`, platform_admin cross-tenant); Firestore path `tenants/{tid}/riskPolicy/current`; +34 tests (17 jest + 17 vitest). |
| W20-DEBT-2 | W20 — [WEEK20_CLOSE_REPORT.md](WEEK20_CLOSE_REPORT.md) §5 | Drift dashboard wiring `logRiskAssessment` into the platform analytics pipeline (score distributions, recommended-action counts, manual-override rates). | Low | Post-launch (telemetry-driven) | open |
| W20-DEBT-3 | W20 — [WEEK20_CLOSE_REPORT.md](WEEK20_CLOSE_REPORT.md) §5 | Wire `logRanking` (impressions + impressionTokens) into the platform analytics pipeline so click-through and booking-conversion lift can be attributed to a specific personalization run. | Low | Post-launch (telemetry-driven) | open |
| W20-DEBT-4 | W20 — [WEEK20_CLOSE_REPORT.md](WEEK20_CLOSE_REPORT.md) §5 | Per-tenant cold-start popularity index. Today the caller injects `popularityScore` into each `PersonalizationCandidate`; the platform should compute and cache this per tenant on a schedule. | Low | W22 (with marketplace data-model pass) | open |

---

## Index of Source Documents

- [PILOT_GO_LIVE.md](PILOT_GO_LIVE.md) — pre-W11 known issues
- [PHASE1_COMPLETION_REPORT.md](PHASE1_COMPLETION_REPORT.md) — phase rollup
- [WEEKLY_LOG.md](WEEKLY_LOG.md) — week-by-week log (W11 inline debt entries)
- [WEEK12_CLOSE_REPORT.md](WEEK12_CLOSE_REPORT.md), [WEEK13_CLOSE_REPORT.md](WEEK13_CLOSE_REPORT.md), [WEEK14_CLOSE_REPORT.md](WEEK14_CLOSE_REPORT.md), [WEEK15_CLOSE_REPORT.md](WEEK15_CLOSE_REPORT.md), [WEEK16_CLOSE_REPORT.md](WEEK16_CLOSE_REPORT.md), [WEEK17_CLOSE_REPORT.md](WEEK17_CLOSE_REPORT.md), [WEEK18_CLOSE_REPORT.md](WEEK18_CLOSE_REPORT.md), [WEEK19_CLOSE_REPORT.md](WEEK19_CLOSE_REPORT.md) — week-end debt registers
- [SECURITY_RULES_FINAL.md](SECURITY_RULES_FINAL.md) — security closure evidence (W12-HARDENING-2)
