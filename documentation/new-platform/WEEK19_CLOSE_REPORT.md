# Week 19 Close Report — AI Assistance v1

**Status:** Complete — all 6 tasks delivered in-week.
**Theme:** AI Assistance v1 — chat surface, scheduling assistant, content assistant, service recommendations, marketing automation orchestrator, retention insights, and scheduling optimization engine — all sharing the existing AI cost-guard infrastructure (`evaluateAiBudgetGuard` + `buildAiCostTelemetryEvent` from W17).
**Test deltas:** 1553 → 1634 root jest (+81); 150 → 150 functions/ vitest (no functions/ changes).
**Type-check:** clean (root + functions/).

---

## 1. Scope decisions

W19 prompts list six AI tasks (19.1 chat / 19.2 scheduling+retention+content assistants triad / 19.3 service recommendations / 19.4 marketing automation orchestrator / 19.5 retention insights copilot / 19.6 scheduling optimization engine), each carrying the full mandatory cost-guard checklist.

**Delivered this week:** **all 6 tasks**. The first delivery pass shipped 19.1, 19.3, 19.5 and proposed deferring 19.2, 19.4, 19.6 to W22–W24. After explicit user pushback (“why didn't you move to the other 3 tasks?”), the agent reversed the scope cut and delivered 19.2 (scheduling + content assistants), 19.4 (marketing orchestrator), and 19.6 (scheduling optimization engine) in the same week, all on the same `evaluateAiBudgetGuard` infrastructure and the same `supportTriageService` template.

**Lesson recorded:** when the platform pattern is established and the work fits the same template, ship it; don't pre-emptively defer. The W19-DEBT-1/-2/-3 entries that the first pass opened were closed in-week by the second pass; only W19-DEBT-4 (`ClientRetentionMetrics` analytics job) and W19-DEBT-5 (chat-assistance feature-key split) remain genuinely open.

---

## 2. Deliverables

### Task 19.1 — AI Chat Assistance (`createChatAssistantService`)

- **File:** [src/domains/ai/chatAssistantService.ts](../../src/domains/ai/chatAssistantService.ts)
- **Tests:** [src/domains/ai/__tests__/chatAssistantService.test.ts](../../src/domains/ai/__tests__/chatAssistantService.test.ts) — 11 cases passing
- **Surfaces:** client / admin / staff (`ChatAssistantSurface`)
- **Feature key:** `support-triage` (chat + support share a cost bucket; documented in [AI_CHAT_POLICY.md](AI_CHAT_POLICY.md) with W19-DEBT-5 follow-up to split telemetry-driven)
- **Cost-guard checklist:** ✅ healthy/warning/protection/exhausted, ✅ premium-model disable in protection, ✅ deterministic fallback in exhausted (escalates to humans), ✅ telemetry + alert ports, ✅ guard-decision logger
- **Beyond cost guard:** tenant-isolation assertion on `ChatContext.tenantId`, injected `applySafetyFilter` port, configurable confidence threshold (`DEFAULT_CHAT_CONFIDENCE_THRESHOLD = 0.6`), discriminated `ChatEscalationReason` (`budget-exhausted` / `low-confidence` / `unsafe-output` / `context-isolation-violation` / `model-error`)

### Task 19.3 — AI Service Recommendations Engine (`createServiceRecommendationsService`)

- **File:** [src/domains/ai/serviceRecommendationsService.ts](../../src/domains/ai/serviceRecommendationsService.ts)
- **Tests:** [src/domains/ai/__tests__/serviceRecommendationsService.test.ts](../../src/domains/ai/__tests__/serviceRecommendationsService.test.ts) — 12 cases passing
- **Feature key:** `service-recommendations` (cap $140/mo)
- **Cost-guard checklist:** ✅ all four states; **deterministic engine is built-in** — `buildDeterministicRecommendations` scores via `repeat-affinity` / `category-affinity` / `popular-in-tenant` and is used both as the explicit fallback when the guard is exhausted **and** as the safe ranking when AI output is empty after policy filtering or when the model throws.
- **Defence in depth:** `filterCatalogForClient` rejects unavailable services, services exceeding the client's `maxPriceUsd`, and services in the client's `disallowedCategories` (matched on category + `tags`). Model output is re-filtered against the same allow-list before return. Reason codes: `repeat-affinity`, `category-affinity`, `popular-in-tenant`, `ai-personalized`, `fallback-default`.

### Task 19.5 — AI Retention Insights Copilot (`createRetentionInsightsService`)

- **File:** [src/domains/ai/retentionInsightsService.ts](../../src/domains/ai/retentionInsightsService.ts)
- **Tests:** [src/domains/ai/__tests__/retentionInsightsService.test.ts](../../src/domains/ai/__tests__/retentionInsightsService.test.ts) — 16 cases passing
- **Feature key:** `retention-insights` (cap $150/mo)
- **Cost-guard checklist:** ✅ all four states; the protective state pattern is implemented as **metrics-only mode** — when the cap is exhausted (or no `callNarrativeModel` dep is provided), the service returns deterministic scores, reason codes, and queued actions with `narrative = null` instead of bypassing the response entirely. Per-client narrative errors degrade only that client to metrics-only.
- **Pure helpers (independently tested):** `computeBaselineRetentionScore` (clamped weighted score with reason codes), `pickActionsForScore` (deterministic banded action selection), `estimateChurnHorizonDays` (clamped to [7, 180] days)
- **Approval queue invariant:** every suggested action is emitted with `status: "needs-review"`. The service **never** triggers communications directly — staff approval is a hard precondition for any send. Verified by an explicit test.

### Task 19.2 — AI Scheduling Assistant (`createSchedulingAssistantService`) and AI Content Assistant (`createContentAssistantService`)

- **Files:** [src/domains/ai/schedulingAssistantService.ts](../../src/domains/ai/schedulingAssistantService.ts), [src/domains/ai/contentAssistantService.ts](../../src/domains/ai/contentAssistantService.ts)
- **Tests:** [src/domains/ai/__tests__/schedulingAssistantService.test.ts](../../src/domains/ai/__tests__/schedulingAssistantService.test.ts) (9 cases), [src/domains/ai/__tests__/contentAssistantService.test.ts](../../src/domains/ai/__tests__/contentAssistantService.test.ts) (9 cases)
- **Retention slice:** covered by Task 19.5 `retentionInsightsService` (no duplicate service).
- **Feature keys:** `scheduling-optimization` (assistant), `content-creation` (assistant).
- **Scheduling assistant:** pure `enumerateConstraintSafeSlots` (15-min step, work-window + booking-collision-safe) + `rankSlotsHeuristically` (preferred-staff and hour-band scoring). Defence-in-depth: model picks are re-validated against the constraint-safe candidate set; empty-after-defence triggers heuristic fallback.
- **Content assistant:** `buildTemplateDraft` with tone-prefixed templates (friendly/formal/playful/concise) and email-only subjects. Runtime invariant: `approvalMode` MUST be `"human-approval"` (throws otherwise). Drafts always emitted with `status: "needs-review"`. Template fallback fires on cap-exhausted, model-error, OR safety-filter rejection.

### Task 19.4 — AI Marketing Automation Orchestrator (`createMarketingOrchestratorService`)

- **File:** [src/domains/ai/marketingOrchestratorService.ts](../../src/domains/ai/marketingOrchestratorService.ts)
- **Tests:** [src/domains/ai/__tests__/marketingOrchestratorService.test.ts](../../src/domains/ai/__tests__/marketingOrchestratorService.test.ts) — 14 cases passing (3 quiet-hours, 6 pure rules, 5 service-level)
- **Feature key:** `marketing-orchestration`.
- **Design:** pure `evaluateRulesEngine` runs first and encodes every spec safety rule — trigger satisfaction, per-channel consent, quiet-hours suppression (with wrap-midnight via `isInQuietHours`), per-campaign frequency cap (`minIntervalHours`), in-batch dedupe, and auto-send opt-in. AI personalisation layer applies ONLY to already-queued dispatches; rule-blocked items keep rules-only personalisation. Cap-exhausted: rules-only.
- **Decision statuses:** `queued-needs-review`, `queued-auto-send`, `blocked-no-consent`, `blocked-quiet-hours`, `blocked-frequency-cap`, `blocked-trigger-not-satisfied`, `blocked-duplicate-in-batch`.

### Task 19.6 — AI Scheduling Optimization Engine (`createSchedulingOptimizationService`)

- **File:** [src/domains/ai/schedulingOptimizationService.ts](../../src/domains/ai/schedulingOptimizationService.ts)
- **Tests:** [src/domains/ai/__tests__/schedulingOptimizationService.test.ts](../../src/domains/ai/__tests__/schedulingOptimizationService.test.ts) — 10 cases passing
- **Feature key:** `scheduling-optimization` (shared with 19.2 assistant; same cost bucket).
- **Salon-side:** `analyzeDayPlan` produces utilization ratio, `low-utilization` / `high-utilization-overbooking-risk` / `tight-buffers` flags, and a scaled `suggestedBufferMinutes`.
- **Reschedule-on-cancellation:** `buildHeuristicRescheduleSuggestions` (same-staff-first, min start-deviation ranking) consumes `enumerateConstraintSafeSlots` from `schedulingAssistantService` to guarantee no double-bookings. AI augmentation re-validates picks against the safe set; defence-in-depth empty triggers heuristic fallback.
- **Instrumentation:** `DEFAULT_OPTIMIZATION_LATENCY_TARGET_MS = 1500` exported per spec.

### Public surface

- [src/domains/ai/index.ts](../../src/domains/ai/index.ts) re-exports all seven services + their public types and helpers.

### Documentation

- [AI_CHAT_POLICY.md](AI_CHAT_POLICY.md) — chat policy, feature-key justification, safety + escalation contract, open follow-ups.
- [AI_RETENTION_INSIGHTS.md](AI_RETENTION_INSIGHTS.md) — retention copilot policy, deterministic baseline contract, approval-queue invariant, open follow-ups.

---

## 3. Test gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` (root) | ✅ clean |
| `npx jest` (root) | ✅ 1634/1634 (98 suites) — was 1553 |
| `cd functions && npx tsc --noEmit` | ✅ clean |
| `cd functions && npx vitest run` | ✅ 150/150 (11 files) — unchanged from W18 |

Test count delta (+81): chatAssistantService 11, serviceRecommendationsService 12, retentionInsightsService 16, schedulingAssistantService 9, contentAssistantService 9, marketingOrchestratorService 14, schedulingOptimizationService 10.

---

## 4. Mandatory runtime cost-guard checklist (per-task)

Every W19 task in the prompt pack ships with the same 8-item checklist. All seven delivered services satisfy every item:

| Item | 19.1 Chat | 19.2 Sched | 19.2 Content | 19.3 Recs | 19.4 Marketing | 19.5 Retention | 19.6 Optimize |
|------|----------|------------|--------------|-----------|----------------|----------------|---------------|
| 1. Per-feature monthly cap consumed via `defaultAiBudgetGuardConfig` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2. Four budget states honoured | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3. Premium model disabled in `protection` state (low-cost downshift) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4. Deterministic fallback when `exhausted` (no provider call) | ✅ (escalation) | ✅ (heuristic) | ✅ (template) | ✅ (built-in engine) | ✅ (rules-only) | ✅ (metrics-only mode) | ✅ (heuristic) |
| 5. Telemetry event emitted via `buildAiCostTelemetryEvent` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6. Alert fired when `alertLevel !== "none"` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7. Guard decision observable per call (`logGuardDecision`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8. Cross-reference to [AI_RUNTIME_AND_COST_POLICY.md](AI_RUNTIME_AND_COST_POLICY.md) in policy doc | ✅ | shared with 19.6 | n/a | n/a | n/a | ✅ | shared with 19.2 |

---

## 5. Debt register changes

- **Carried forward into W19 (now into W20):** W18-DEBT-1 (`stripeTaxCalculate` Cloud Function) — target updated to W20.
- **W19 debts opened and closed in-week (re-close after user pushback):**
  - W19-DEBT-1 — Task 19.2 (Scheduling + Content Assistants). **closed (W19)** — retention slice covered by 19.5.
  - W19-DEBT-2 — Task 19.4 (Marketing Automation Orchestrator). **closed (W19)**.
  - W19-DEBT-3 — Task 19.6 (Scheduling Optimization Engine). **closed (W19)**.
- **W19 debts that remain open:**
  - W19-DEBT-4 — `ClientRetentionMetrics` upstream analytics job (the service is pure; its data feed is a separate slot). Target: W22.
  - W19-DEBT-5 — Promote `chat-assistance` to its own `aiFeatureKeys` entry (telemetry-driven). Target: post-launch.

See [DEBT_REGISTER.md](DEBT_REGISTER.md) §"Week 19" for the canonical entries.

---

## 6. Diary entries

First pass: D-083 through D-087 appended to [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md) and the W19 row appended to [WEEKLY_LOG.md](WEEKLY_LOG.md). Re-close pass: D-088 through D-091 appended to [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md) and the W19 row in [WEEKLY_LOG.md](WEEKLY_LOG.md) updated with a same-week amendment.

---

## 7. Next week (W20)

W20 prompt pack (consumer UI plan W21-W28) starts here. Carry-forward into W20:

1. **W18-DEBT-1** — `stripeTaxCalculate` Cloud Function (high severity, oldest open debt).
2. W20 prompt content (to be audited at W20 kickoff).
