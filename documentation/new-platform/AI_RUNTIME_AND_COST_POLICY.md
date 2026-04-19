# AI Runtime and Cost Policy

Date: 2026-04-19
Status: Approved baseline for v1
Owner: Platform

## 1. Purpose

This policy defines how AI is operated in production for Zarkili:
- provider strategy
- subscription and billing model
- model lifecycle ("training" approach)
- cost controls and fail-safe behavior
- privacy and tenant isolation requirements

## 2. Subscription and Provider Model

1. AI is a platform-level backend service, not an end-user dependency.
2. Salons and clients do not need personal ChatGPT/Claude subscriptions.
3. The platform uses provider API accounts (for example OpenAI, optionally Anthropic later) and pays per usage.
4. All AI calls are made from trusted backend services (Cloud Functions/server), never directly from mobile/web clients.

## 3. Baseline Provider Strategy (v1)

1. Primary provider: OpenAI API.
2. Baseline model tier:
- default to lower-cost model for routine tasks (for example recommendations/content drafts/support triage)
- escalate to higher-capability model only for high-risk/low-confidence paths
3. Provider abstraction:
- keep an internal adapter layer so model/provider can be switched without app release
- avoid provider-specific assumptions in domain contracts

## 4. Model Lifecycle (How "Training" Works)

Zarkili does not train foundation models from scratch.

v1 lifecycle:
1. Prompted inference + business rules + strict output schemas.
2. Retrieval/context injection from tenant-scoped data and policy docs.
3. Human override and escalation on uncertainty or policy risk.
4. Continuous tuning from production feedback.

Tuning signals to collect:
- suggestion accepted/rejected
- manual correction by salon/admin
- escalation reason
- false positive/false negative flags
- latency and cost per feature

Fine-tuning policy:
1. Fine-tuning is optional and only considered after:
- sufficient labeled examples
- measurable quality gap not solvable by prompt/rules/retrieval
- explicit ROI review (quality gain vs. infra cost)
2. Fine-tuned models must remain behind the same safety and explainability contracts.

## 5. Cost-Control Rules

### 5.1 Budget ownership

1. Platform sets monthly AI budget globally.
2. Optional per-tenant soft quotas are allowed for higher-cost features.
3. Budget usage is reviewed weekly during AI rollout phases.

### 5.2 Runtime guardrails

1. Use deterministic structured outputs where possible to reduce retries.
2. Cap max tokens per request by feature type.
3. Prefer summarization/compression of context before sending to model.
4. Cache safe, reusable outputs where business rules allow.
5. Use confidence thresholds and rule gates to avoid unnecessary premium-model calls.

### 5.3 Degradation behavior on limits/errors

When budgets or provider health are constrained:
1. Keep core booking flows fully functional (no AI dependency for baseline operations).
2. Fall back from premium model to lower-cost model where safe.
3. Fall back from AI action to deterministic rule-based suggestion.
4. If still not safe, disable only the affected AI feature and show neutral UX copy.
5. Never block critical user actions because AI is unavailable.

## 6. Safety, Privacy, and Compliance Rules

1. Tenant isolation is mandatory in all prompt contexts and logs.
2. Send minimum required fields only; avoid unnecessary personal/sensitive data.
3. API keys remain server-side (Secret Manager / Functions config only).
4. AI outputs must be explainable for decisions with operational impact.
5. High-risk categories (fraud/no-show/risk) require human override path.
6. Honor consent/opt-out settings for all AI-driven communications.
7. Do not use sensitive attributes for inference.

## 7. Feature-to-Model Routing Baseline (v1)

1. Content draft/caption/help text:
- low-cost model first
- optional human approval before send/publish

2. Marketing orchestration suggestions:
- low-cost model for draft strategy
- hard policy checks (quiet hours, opt-out, anti-spam) before execution

3. Service recommendations and scheduling suggestions:
- low-cost model + deterministic hard constraints
- no suggestion may violate availability/business rules

4. Retention/insight narratives:
- low-cost model for explanation text
- metrics and scores come from deterministic analytics pipeline

5. Support escalation triage:
- low-cost model by default
- premium model optional for low-confidence retries
- mandatory escalate for sensitive intents (billing/refund/legal/abuse/privacy)

6. No-show/fraud prediction:
- rule + model hybrid with explicit reason codes
- stricter review thresholds and human override

## 8. Observability and Acceptance KPIs

Track per-feature:
- request count
- p50/p95 latency
- token and cost usage
- acceptance/override rate
- escalation rate
- policy-block rate

Initial KPI targets:
1. >= 95% AI calls logged with feature tag and tenantId.
2. <= 5% AI-generated actions executed without policy gate check.
3. 100% high-risk actions have explainability fields and override path.
4. Zero cross-tenant context leakage incidents.

## 9. Rollout Phases

1. Phase A: Internal validation
- AI enabled for owner/internal testing only
- aggressive logging and threshold tuning

2. Phase B: Tenant pilot
- limited tenant cohort
- weekly quality/cost review and prompt updates

3. Phase C: General availability
- budget alerts, SLO monitors, and fallback paths active
- quarterly review for provider/model adjustments

## 10. Decision Summary

1. End users do not need external AI subscriptions.
2. Platform uses backend API subscriptions and pays per use.
3. "Training" starts as tuning and retrieval with human feedback loops.
4. Fine-tuning is optional, late-stage, and ROI-gated.
