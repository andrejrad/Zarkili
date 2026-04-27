# Marketplace Personalization Engine — v1

**Status:** v1 (Week 20). Service: [`createMarketplacePersonalizationService`](../../src/domains/ai/marketplacePersonalizationService.ts). Feature key: `marketplace-personalization`.

This document is the policy and ranking-strategy reference for marketplace feed personalization. Any change to the ranking signals, hard constraints, or fallback behaviour MUST be reflected here in the same change.

---

## 1. Scope

The personalization engine consumes a candidate list of `MarketplacePost` records (already filtered for visibility and tenant context by [`discoveryService.getFeedPage`](../../src/domains/marketplace/discoveryService.ts)) and re-ranks them for a specific user. It augments — but never replaces — the deterministic discovery ordering, and it never queries the data store directly.

## 2. Hard constraints

These constraints are enforced inside the service even when upstream callers are correct, as defence in depth:

1. **Anti-client-theft.** When `tenantContext` is set (the user is in salon X's booking funnel), [`enforceCompetitorSuppression`](../../src/domains/ai/marketplacePersonalizationService.ts) drops every candidate post whose `tenantId` differs from `tenantContext`. Anonymous browsing (`tenantContext === null`) accepts all candidates. This mirrors `isCompetitorRecommendationAllowed` in `src/domains/marketplace/model.ts`.

2. **Allow-list of postIds.** The AI model can rerank, but it cannot *introduce* posts. Any `postId` returned by the model that was not in the deterministic baseline is dropped.

3. **Score clamp.** Model scores are clamped to `[0,1]` before sorting.

4. **Filter bubble guard.** The deterministic baseline always includes every safe candidate (capped only by `topN`). The model can re-order; the model **cannot remove**. This means low-scoring items still surface in the long tail.

## 3. Ranking strategy

`buildDeterministicRanking` is the always-on baseline. It computes per-candidate scores from the consent-safe user signals:

| Signal | Weight (cumulative) | Reason code |
|--------|--------------------|-------------|
| Post is in `bookedPostIds` | +0.50 | `previously-booked` |
| Post is in `interactedPostIds` | +0.20 | `previously-interacted` |
| Service-tag intersection (capped) | +up to 0.30 | `preferred-service-tag` |
| Style-tag intersection (capped) | +up to 0.20 | `preferred-style-tag` |
| `preferredCity` is set | reason only | `city-match` |
| `popularityScore > 0` | +up to 0.10 | `popular` |

The score is clamped to `[0,1]`. Sort is `score DESC, postId ASC` for stability.

**Cold-start path:** if the user has no signals (`hasUserSignals === false`), the service skips the AI call entirely and ranks by `popularityScore` with reason `fallback-default`. This is verified by an explicit test.

## 4. Cost-guard fallbacks

`evaluateAiBudgetGuard({ feature: "marketplace-personalization", ... })` runs on every call. The service degrades cleanly:

- **Healthy / warning:** AI rerank with rationale.
- **Protection:** AI rerank with rationale, model tier downshifted to `low-cost`.
- **Exhausted:** deterministic ranking only; no rationale.
- **No model configured:** deterministic ranking only; no rationale.
- **Model error:** deterministic ranking only; no rationale; observability still emitted.

In every fallback path `mode === "deterministic"` and `rationale === null`.

## 5. Observability — CTR and conversion lift

Every returned `PersonalizedItem` carries an `impressionToken`. The default token is `imp:{monthKey}:{userHash}:{postId}` and is deterministic for stable attribution. Callers may inject `generateImpressionToken` for custom keying.

`logRanking` (per-call) emits `{ tenantId, monthKey, userHash, mode, coldStart, items: [{ postId, score, impressionToken }] }`. Downstream analytics pipelines join on `impressionToken` to attribute click-through and booking-conversion lift back to the run that produced the impression.

Two-call observability is emitted exactly **once** per `rankFeed` invocation:
- `logGuardDecision` (when configured)
- `logTelemetryEvent` (always)
- `logAlert` (only when `alertLevel !== "none"`)

## 6. Forward debt

- W20-DEBT-3 — Wire `logRanking` into the platform analytics pipeline (impressions, clicks, conversions). Target: post-launch.
- W20-DEBT-4 — Per-tenant cold-start popularity index (currently the caller injects `popularityScore`). Target: W22 with marketplace data-model pass.
