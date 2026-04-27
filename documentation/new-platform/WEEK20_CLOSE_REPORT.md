# Week 20 Close Report — AI Risk Models and Personalization

**Status:** Complete — both W20 tasks delivered.
**Theme:** AI Risk Models and Personalization v1 — no-show / fraud risk scoring (Task 20.1) and marketplace personalization engine (Task 20.2). Both reuse the W17 cost-guard infrastructure (`evaluateAiBudgetGuard` + `buildAiCostTelemetryEvent`) with no changes to `src/shared/ai`.
**Test deltas:** 1634 → 1667 root jest (+33 across 2 new suites); 150 → 150 functions/ vitest (no functions/ changes).
**Type-check:** clean (root + functions/).

---

## 1. Scope decisions

W20 prompt pack lists two AI tasks: 20.1 (No-Show / Fraud Prediction) and 20.2 (Marketplace Personalization Engine). **Both delivered in-week.**

W18-DEBT-1 (`stripeTaxCalculate` Cloud Function) was identified as a Phase-2 backend-pass slot in the W18 close report and is intentionally not picked up here — it requires a Stripe Tax API admin-SDK adapter and credentials wiring that is out of scope for the W20 AI-pass turn. It carries forward unchanged to the next available backend slot.

---

## 2. Deliverables

### Task 20.1 — No-Show / Fraud Risk Scoring (`createNoShowFraudService`)

- **File:** [src/domains/ai/noShowFraudService.ts](../../src/domains/ai/noShowFraudService.ts)
- **Tests:** [src/domains/ai/__tests__/noShowFraudService.test.ts](../../src/domains/ai/__tests__/noShowFraudService.test.ts) — 17 cases passing
- **Feature key:** `no-show-fraud` (cap $110/mo, pre-defined in `aiFeatureKeys`).
- **Policy doc:** [AI_RISK_MODEL_POLICY.md](AI_RISK_MODEL_POLICY.md) — exhaustive consent-safe input list, forbidden-signal audit checklist, reason-code allow-list, action thresholds, override invariants.
- **Pure helpers (independently exported and tested):**
  - `computeHeuristicRiskScore(signals)` — deterministic baseline used both as the model's heuristic input and as the rules-only fallback. Reason codes: `high-no-show-rate` / `high-late-cancellation-rate` / `new-account-low-history` / `rapid-velocity` / `very-short-lead-time` / `payment-dispute-history` / `high-risk-hour-band` / `high-value-service` / `established-good-history`.
  - `resolveRecommendedAction(score, policy)` — maps score to `allow` / `require-deposit` / `require-prepayment` / `manual-review` / `block`.
  - `filterReasonCodesToAllowList(codes)` — drops any code emitted by the model that is not on the allow-list (defence in depth).
- **Hard invariants:**
  1. `requiresHumanReview === true` for `manual-review` and `block` actions, regardless of model output.
  2. `requiresHumanReview === true` for every rules-only assessment (cap-exhausted, no-model, model-error).
  3. The service never auto-denies — `block` means "do not confirm without staff approval".
- **Cost-guard checklist:** ✅ all 8 items.

### Task 20.2 — Marketplace Personalization Engine (`createMarketplacePersonalizationService`)

- **File:** [src/domains/ai/marketplacePersonalizationService.ts](../../src/domains/ai/marketplacePersonalizationService.ts)
- **Tests:** [src/domains/ai/__tests__/marketplacePersonalizationService.test.ts](../../src/domains/ai/__tests__/marketplacePersonalizationService.test.ts) — 16 cases passing
- **Feature key:** `marketplace-personalization` (cap $90/mo, pre-defined in `aiFeatureKeys`).
- **Policy doc:** [MARKETPLACE_PERSONALIZATION.md](MARKETPLACE_PERSONALIZATION.md) — hard constraints, ranking strategy, observability hooks, forward debts.
- **Pure helpers (independently exported and tested):**
  - `enforceCompetitorSuppression(candidates, tenantContext)` — defence-in-depth re-filter against the marketplace anti-client-theft rule (mirrors `isCompetitorRecommendationAllowed`).
  - `buildDeterministicRanking(candidates, user)` — always-on baseline; cold-start path skips the AI call entirely and ranks by popularity.
  - `hasUserSignals(user)` — boolean cold-start gate.
- **Hard constraints (enforced inside the service even when callers are correct):**
  1. Anti-client-theft re-filter on entry; competitor-tenant posts cannot reach the model.
  2. Allow-list of postIds — the model can rerank but cannot introduce posts.
  3. Score clamp to `[0,1]`.
  4. Filter-bubble guard — the model can re-order but cannot remove items.
- **Observability:** every returned `PersonalizedItem` carries an `impressionToken` (default `imp:{monthKey}:{userHash}:{postId}`); `logRanking` emits the per-call ranking for downstream CTR / conversion-lift attribution.
- **Cost-guard checklist:** ✅ all 8 items.

### Public surface

- [src/domains/ai/index.ts](../../src/domains/ai/index.ts) re-exports both new services + their public types and helpers.

---

## 3. Test gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` (root) | ✅ clean |
| `npx jest` (root) | ✅ **1667 / 1667** (100 suites) — was 1634 / 98 |
| `cd functions && npx tsc --noEmit` | ✅ clean |
| `cd functions && npx vitest run` | ✅ 150 / 150 (11 files) — unchanged |

Test count delta (+33): noShowFraudService 17, marketplacePersonalizationService 16.

---

## 4. Mandatory runtime cost-guard checklist (per-task)

| Item | 20.1 No-Show/Fraud | 20.2 Personalization |
|------|--------------------|----------------------|
| 1. Per-feature monthly cap consumed via `defaultAiBudgetGuardConfig` | ✅ | ✅ |
| 2. Four budget states honoured | ✅ | ✅ |
| 3. Premium model disabled in `protection` state (low-cost downshift) | ✅ | ✅ |
| 4. Deterministic fallback when `exhausted` (no provider call) | ✅ (rules-only with `requiresHumanReview=true`) | ✅ (deterministic, no rationale) |
| 5. Telemetry event emitted via `buildAiCostTelemetryEvent` | ✅ | ✅ |
| 6. Alert fired when `alertLevel !== "none"` | ✅ | ✅ |
| 7. Guard decision observable per call (`logGuardDecision`) | ✅ | ✅ |
| 8. Cross-reference to [AI_RUNTIME_AND_COST_POLICY.md](AI_RUNTIME_AND_COST_POLICY.md) in policy doc | ✅ | ✅ |

---

## 5. Debt register changes

- **Carried forward (still open):** W18-DEBT-1 (`stripeTaxCalculate`); W19-DEBT-4 (`ClientRetentionMetrics` analytics job); W19-DEBT-5 (`chat-assistance` feature-key promotion).
- **New W20 debts opened (4):**
  - W20-DEBT-1 — Tenant-policy persistence layer for `RiskPolicy` (Firestore collection + admin callable). Target: W22.
  - W20-DEBT-2 — Drift dashboard wiring `logRiskAssessment` into the platform analytics pipeline. Target: post-launch.
  - W20-DEBT-3 — Wire `logRanking` into the platform analytics pipeline (impressions, clicks, conversions). Target: post-launch.
  - W20-DEBT-4 — Per-tenant cold-start popularity index (currently injected by caller). Target: W22 with marketplace data-model pass.

See [DEBT_REGISTER.md](DEBT_REGISTER.md) for canonical entries.

---

## 6. Diary entries

D-092 through D-095 appended to [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md) and the W20 row appended to [WEEKLY_LOG.md](WEEKLY_LOG.md).

---

## 7. End-of-Week Security Review (per W20 prompt pack)

Audit checklist for changes introduced this week:

1. **Tenant isolation on writes:** N/A — both new services are pure-logic; no Firestore writes.
2. **Tenant filter on queries:** N/A — both services consume caller-provided candidate lists; no direct queries.
3. **Payment idempotency / signature verification:** N/A — no payment-flow changes.
4. **Onboarding/admin role checks:** N/A — no admin callables added.
5. **AI safety + audit logs:**
   - `no-show-fraud`: consent-safe input type pinned; forbidden-signal audit list documented in policy; reason-code allow-list enforced at service boundary; `requiresHumanReview` invariant tested for `manual-review` / `block` and rules-only fallback; service never auto-denies; `logRiskAssessment` port available for drift monitoring.
   - `marketplace-personalization`: anti-client-theft enforced inside the service as defence in depth; allow-list of `postId`s prevents the model from introducing posts; score clamp prevents runaway ordering; filter-bubble guard preserves long-tail surfacing; `impressionToken` enables CTR / conversion-lift attribution; cold-start path skips AI entirely and emits no rationale.

**P0–P2 findings:** none.

---

## 8. Next week (W21)

W21 opens [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md](../PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md). Carry-forward into W21:

1. **W18-DEBT-1** — `stripeTaxCalculate` Cloud Function (high severity, oldest open debt).
2. **W19-DEBT-4** — `ClientRetentionMetrics` upstream analytics job.
3. **W19-DEBT-5** — promote `chat-assistance` to its own `aiFeatureKeys` entry (telemetry-driven, post-launch).
4. **W20-DEBT-1..-4** as above.
