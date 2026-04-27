# AI Retention Insights Policy (Week 19)

## Scope

Governs the AI Retention Insights Copilot delivered in Week 19 (Task 19.5). It applies to `createRetentionInsightsService` (`src/domains/ai/retentionInsightsService.ts`), which produces per-client retention scores, churn horizons, reason codes, and suggested actions for the admin retention copilot UI.

## Cost-guard alignment

- **Feature key:** `retention-insights` (already registered in `aiFeatureKeys`).
- **Per-feature monthly cap:** `defaultAiBudgetGuardConfig.featureCaps["retention-insights"]` ($150/month per tenant).
- **Budget states honoured:**
  - `healthy` → premium narrative model (`high`).
  - `warning` → premium narrative still allowed; telemetry alert emitted.
  - `protection` → automatic downshift to `low-cost` narrative model tier.
  - `exhausted` → narrative generation bypassed; service returns **metrics-only mode** (deterministic scoring, reason codes, and action recommendations with `narrative = null`).
- **Per-client safety net:** If a single client's narrative call throws while the guard is open, that client's insight degrades to metrics-only. Other clients in the same batch are unaffected.

## Deterministic baseline (always present)

- `computeBaselineRetentionScore` produces a numeric risk score in [0,1] from precomputed metrics: days since last booking vs. typical cadence, recent cancellations, no-shows, and booking frequency.
- Reason codes attached automatically: `elapsed-beyond-cadence`, `cancellations-trending-up`, `no-show-pattern`, `low-frequency`. The narrative path adds `ai-narrative` when invoked.
- `pickActionsForScore` deterministically maps score bands to action items: `no-action`, `send-reminder`, `send-personalized-offer`, and (severe band) `send-personalized-offer + schedule-callback`.
- `estimateChurnHorizonDays` clamps horizon estimates to the [7, 180] day window.

## Action queue (no auto-send)

- Every suggested action is emitted with `status: "needs-review"`. The service **never** triggers communications directly; downstream workflows must require staff approval before any message is dispatched. This holds in every budget state, including healthy.

## Tenant isolation

- The service is pure logic over caller-supplied `clients: ReadonlyArray<ClientRetentionMetrics>` and a tenant-scoped `tenantId`. There are no cross-tenant data paths inside the service. Upstream analytics jobs are responsible for tenant-scoping the metrics fed in.

## Telemetry + alerts

- Every `generate` call emits exactly one `buildAiCostTelemetryEvent` event via `logTelemetryEvent`. Non-`none` alert levels also fire `logAlert`.
- Guard decisions are observable per call via `logGuardDecision`.

## Documentation cross-references

- `documentation/AI_RUNTIME_AND_COST_POLICY.md` — global policy + thresholds + decision tree.
- `documentation/AI_FEATURES_SPECS.md` — retention copilot product surface.
- `src/shared/ai/budgetGuard.ts` — guard implementation + feature cap registry.
- `src/domains/ai/retentionInsightsService.ts` — service implementation.

## Open follow-ups

- Wire the retention copilot UI (admin) and a job that populates `ClientRetentionMetrics` from booking history. Both are scheduled for Phase 2 admin UI work (W33+) and the analytics job is tracked under the W19 deferred-debt set documented in `DEBT_REGISTER.md`.
