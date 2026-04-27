# AI Risk Model Policy — No-Show / Fraud Prediction

**Status:** v1 (Week 20). Service: [`createNoShowFraudService`](../../src/domains/ai/noShowFraudService.ts). Feature key: `no-show-fraud`.

This document is the authoritative policy for the no-show / fraud risk model. Any change to model inputs, reason codes, recommended actions, or override paths MUST be reflected here in the same change.

---

## 1. Purpose

Score the risk that a booking will be a no-show or fraudulent, and recommend an action (allow / require-deposit / require-prepayment / manual-review / block). The model is **advisory**; the salon team retains the final decision and the service is engineered so a human is always in the loop for elevated-risk actions.

## 2. Allowed signals (consent-safe)

The input type [`RiskInputSignals`](../../src/domains/ai/noShowFraudService.ts) is the **exhaustive** list of fields the model is allowed to consume:

| Field | Source | Notes |
|------|--------|------|
| `priorBookings` | tenant's own booking history | aggregate count |
| `priorNoShows` | tenant's own booking history | aggregate count |
| `priorLateCancellations` | tenant's own booking history | aggregate count |
| `priorCompletedBookings` | tenant's own booking history | aggregate count |
| `daysSinceLastBooking` | tenant's own booking history | numeric, recency only |
| `leadTimeHours` | new booking request | numeric |
| `bookingsLast24h` | tenant's own booking history | numeric (velocity) |
| `paymentDisputeCount` | tenant's own payment history | aggregate count |
| `highRiskHourBand` | tenant policy | boolean |
| `servicePriceUsd` | service catalogue | numeric |

**The client identifier is `clientHash`** — an opaque, hashed token. The service never receives a raw user id, name, or PII.

## 3. Forbidden signals (audit checklist)

The following signals MUST NOT be added to `RiskInputSignals` without an updated review of this policy and explicit user approval:

- Race, ethnicity, national origin, citizenship status
- Religion, political affiliation, sexual orientation, gender identity
- Full name, email, phone, mailing address, IP address, device fingerprint
- Government ID numbers, financial account numbers
- Health information, disability status
- Any cross-tenant behavioural data (the model only sees the requesting tenant's own history)
- Geographic precision below "city" granularity

## 4. Reason codes

The allow-list of reason codes is enforced at the service boundary by [`filterReasonCodesToAllowList`](../../src/domains/ai/noShowFraudService.ts):

- `high-no-show-rate`
- `high-late-cancellation-rate`
- `new-account-low-history`
- `rapid-velocity`
- `very-short-lead-time`
- `payment-dispute-history`
- `high-risk-hour-band`
- `high-value-service`
- `established-good-history` (trust signal — lowers risk)

Any code emitted by the model that is not on this list is dropped. If filtering removes every code the model returned, the service falls back to the heuristic's reason codes so the assessment always has a non-empty explanation.

## 5. Action thresholds and override path

`RiskPolicy` defaults (`DEFAULT_RISK_POLICY`):

| Threshold | Score ≥ | Action |
|-----------|---------|--------|
| (none) | 0.00 | `allow` |
| `depositThreshold` | 0.40 | `require-deposit` |
| `prepaymentThreshold` | 0.60 | `require-prepayment` |
| `manualReviewThreshold` | 0.80 | `manual-review` |
| `blockThreshold` | 0.95 | `block` |

Tenants may override these via `RiskInput.policy`. Stricter thresholds may not bypass the human-review safeguard.

**Hard invariants:**

1. `requiresHumanReview` is **always true** for `manual-review` and `block` actions, regardless of model output or policy.
2. `requiresHumanReview` is **always true** when the assessment came from rules-only fallback (cap-exhausted, no-model, model-error).
3. The service **never** auto-denies a booking — it only recommends. A `block` action means "do not confirm without staff approval", not "the booking is rejected".
4. The pure helpers `computeHeuristicRiskScore` and `resolveRecommendedAction` are independently testable so reviewers can audit each band end-to-end.

## 6. Cost guard, drift, and observability

- `evaluateAiBudgetGuard({ feature: "no-show-fraud", ... })` runs on every call.
- Telemetry is emitted exactly once per call via `buildAiCostTelemetryEvent`.
- The optional `logRiskAssessment` port lets downstream pipelines aggregate score distributions and recommended-action counts to monitor drift and false-positive rates.
- See [AI_RUNTIME_AND_COST_POLICY.md](AI_RUNTIME_AND_COST_POLICY.md) for the canonical guard semantics.

## 7. Forward debt

- W20-DEBT-1 — Tenant-policy persistence layer for `RiskPolicy` (Firestore collection + admin callable to update). Target: W22.
- W20-DEBT-2 — Drift dashboard wiring `logRiskAssessment` into the platform analytics pipeline. Target: post-launch.
