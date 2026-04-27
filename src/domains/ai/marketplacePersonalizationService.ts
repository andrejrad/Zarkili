/**
 * Week 20 - Task 20.2: Marketplace Personalization Engine v1
 *
 * Re-ranks a candidate marketplace feed for a given user using their
 * preferences, prior interactions, and booking history. Hard constraints:
 *
 *   1. Anti-client-theft (defence in depth): when the user is inside an
 *      active booking funnel for tenant X (tenantContext === X), no
 *      competitor-tenant posts may be returned. We re-filter at the
 *      service boundary even though `discoveryService.getFeedPage` already
 *      enforces this — the personalization layer must never re-introduce
 *      suppressed posts.
 *
 *   2. Cold-start safety: users with no preference / interaction signals
 *      receive a deterministic popularity ranking with no AI rationale.
 *
 *   3. Cost-guard: when the AI cap is exhausted (or no model is configured),
 *      we degrade to deterministic ranking *without* generated rationale.
 *
 *   4. Observability: every result includes `impressionToken`s so the
 *      caller's analytics pipeline can attribute click-through and
 *      booking-conversion lift back to a personalization run.
 *
 * See also:
 *   - documentation/new-platform/MARKETPLACE_PERSONALIZATION.md (policy)
 *   - src/domains/marketplace/guardrailsService.ts (assertNoCompetitorRecommendations)
 */

import {
  buildAiCostTelemetryEvent,
  defaultAiBudgetGuardConfig,
  evaluateAiBudgetGuard,
  type AiAlertLevel,
  type AiBudgetGuardConfig,
  type AiBudgetGuardDecision,
  type AiBudgetUsageSnapshot,
  type AiCostTelemetryEvent,
} from "../../shared/ai";
import { isCompetitorRecommendationAllowed } from "../marketplace/model";
import type { MarketplacePost } from "../marketplace/model";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type PersonalizationTier = "low-cost" | "high";
export type PersonalizationMode = "ai-augmented" | "deterministic";

export type PersonalizationUserProfile = {
  /** Opaque user identifier; never reversed by this service. */
  userHash: string;
  /** Preferred service tags (e.g. "balayage", "men-cuts"). */
  preferredServiceTags: string[];
  /** Preferred style tags (e.g. "minimalist", "vivid-color"). */
  preferredStyleTags: string[];
  /** PostIds the user has booked from in the past (strong signal). */
  bookedPostIds: string[];
  /** PostIds the user has interacted with (lighter signal). */
  interactedPostIds: string[];
  /** Optional preferred city for proximity ranking. */
  preferredCity?: string;
};

export type PersonalizationCandidate = {
  post: MarketplacePost;
  /** Optional engagement counter from upstream popularity index. */
  popularityScore?: number;
};

export type PersonalizationInput = {
  tenantId: string;
  monthKey: string;
  /** Active booking funnel tenant, or null for anonymous browsing. */
  tenantContext: string | null;
  user: PersonalizationUserProfile;
  candidates: PersonalizationCandidate[];
  /** Maximum items to return. */
  topN: number;
};

export type PersonalizedItem = {
  post: MarketplacePost;
  /** Final ranking score in [0,1]. */
  score: number;
  /** Why this post was ranked here. */
  reasonCodes: PersonalizationReasonCode[];
  /** Optional AI-generated rationale; null when running deterministically. */
  rationale: string | null;
  /** Stable opaque token for analytics attribution. */
  impressionToken: string;
};

export type PersonalizationReasonCode =
  | "preferred-service-tag"
  | "preferred-style-tag"
  | "previously-booked"
  | "previously-interacted"
  | "city-match"
  | "popular"
  | "fallback-default";

export type MarketplacePersonalizationModelInput = {
  tenantId: string;
  user: PersonalizationUserProfile;
  baseline: ReadonlyArray<{
    postId: string;
    score: number;
    reasonCodes: PersonalizationReasonCode[];
  }>;
  modelTier: PersonalizationTier;
};

export type MarketplacePersonalizationModelOutput = {
  rerank: ReadonlyArray<{
    postId: string;
    score: number;
    rationale: string;
  }>;
};

export type PersonalizationResult = {
  mode: PersonalizationMode;
  items: PersonalizedItem[];
  guard: AiBudgetGuardDecision;
  modelTierUsed: PersonalizationTier | null;
  providerCalled: boolean;
  /** True when the input had no actionable signals → cold-start path. */
  coldStart: boolean;
};

export type MarketplacePersonalizationDependencies = {
  getUsageSnapshot: (monthKey: string) => Promise<AiBudgetUsageSnapshot>;
  callModel?: (input: MarketplacePersonalizationModelInput) => Promise<MarketplacePersonalizationModelOutput>;
  logGuardDecision?: (input: {
    feature: "marketplace-personalization";
    tenantId: string;
    monthKey: string;
    decision: AiBudgetGuardDecision;
  }) => void;
  logTelemetryEvent?: (event: AiCostTelemetryEvent) => void;
  logAlert?: (input: {
    level: AiAlertLevel;
    feature: "marketplace-personalization";
    tenantId: string;
    monthKey: string;
    event: AiCostTelemetryEvent;
  }) => void;
  /** Per-call analytics hook for impression/click/conversion lift tracking. */
  logRanking?: (input: {
    tenantId: string;
    monthKey: string;
    userHash: string;
    mode: PersonalizationMode;
    coldStart: boolean;
    items: ReadonlyArray<{ postId: string; score: number; impressionToken: string }>;
  }) => void;
  /** Inject deterministic impression-token generator for tests; defaults to a stable hash. */
  generateImpressionToken?: (input: { userHash: string; postId: string; monthKey: string }) => string;
  budgetConfig?: AiBudgetGuardConfig;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function hasUserSignals(user: PersonalizationUserProfile): boolean {
  return (
    user.preferredServiceTags.length > 0 ||
    user.preferredStyleTags.length > 0 ||
    user.bookedPostIds.length > 0 ||
    user.interactedPostIds.length > 0 ||
    Boolean(user.preferredCity)
  );
}

/**
 * Defence-in-depth: drop any candidate post whose tenantId differs from the
 * active booking funnel tenant. Anonymous browsing (tenantContext === null)
 * accepts all published candidates.
 */
export function enforceCompetitorSuppression(
  candidates: readonly PersonalizationCandidate[],
  tenantContext: string | null
): PersonalizationCandidate[] {
  if (isCompetitorRecommendationAllowed(tenantContext)) {
    return [...candidates];
  }
  return candidates.filter((c) => c.post.tenantId === tenantContext);
}

/**
 * Deterministic baseline ranking. Returns items sorted by descending score
 * with explainable reason codes. Does NOT call any AI provider.
 */
export function buildDeterministicRanking(
  candidates: readonly PersonalizationCandidate[],
  user: PersonalizationUserProfile
): Array<{
  post: MarketplacePost;
  score: number;
  reasonCodes: PersonalizationReasonCode[];
}> {
  const cold = !hasUserSignals(user);
  const bookedSet = new Set(user.bookedPostIds);
  const interactedSet = new Set(user.interactedPostIds);
  const serviceSet = new Set(user.preferredServiceTags);
  const styleSet = new Set(user.preferredStyleTags);

  const scored = candidates.map((candidate) => {
    const reasonCodes: PersonalizationReasonCode[] = [];
    let score = 0;

    if (cold) {
      const popularity = candidate.popularityScore ?? 0;
      score = clamp01(popularity / 100);
      reasonCodes.push("fallback-default");
      if (popularity > 0) reasonCodes.push("popular");
    } else {
      if (bookedSet.has(candidate.post.postId)) {
        score += 0.5;
        reasonCodes.push("previously-booked");
      }
      if (interactedSet.has(candidate.post.postId)) {
        score += 0.2;
        reasonCodes.push("previously-interacted");
      }

      const serviceMatches = candidate.post.serviceTags.filter((tag) => serviceSet.has(tag)).length;
      if (serviceMatches > 0) {
        score += Math.min(0.3, serviceMatches * 0.15);
        reasonCodes.push("preferred-service-tag");
      }

      const styleMatches = candidate.post.styleTags.filter((tag) => styleSet.has(tag)).length;
      if (styleMatches > 0) {
        score += Math.min(0.2, styleMatches * 0.1);
        reasonCodes.push("preferred-style-tag");
      }

      if (user.preferredCity) {
        // Posts don't carry city directly; the upstream candidate query is
        // expected to be city-pre-filtered. We still emit the reason code
        // when a preferred city is set so downstream UI can label the row.
        reasonCodes.push("city-match");
      }

      const popularity = candidate.popularityScore ?? 0;
      if (popularity > 0) {
        score += Math.min(0.1, popularity / 1000);
        reasonCodes.push("popular");
      }

      if (reasonCodes.length === 0) {
        reasonCodes.push("fallback-default");
      }
    }

    return { post: candidate.post, score: clamp01(score), reasonCodes };
  });

  return scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.post.postId.localeCompare(b.post.postId);
  });
}

function defaultImpressionToken(input: { userHash: string; postId: string; monthKey: string }): string {
  return `imp:${input.monthKey}:${input.userHash}:${input.postId}`;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export function createMarketplacePersonalizationService(deps: MarketplacePersonalizationDependencies) {
  const budgetConfig = deps.budgetConfig ?? defaultAiBudgetGuardConfig;
  const tokenFor = deps.generateImpressionToken ?? defaultImpressionToken;

  function emitObservability(input: {
    tenantId: string;
    usage: AiBudgetUsageSnapshot;
    guard: AiBudgetGuardDecision;
    providerCalled: boolean;
    modelTierUsed: PersonalizationTier | null;
  }): void {
    const event = buildAiCostTelemetryEvent({
      feature: "marketplace-personalization",
      tenantId: input.tenantId,
      usage: input.usage,
      config: budgetConfig,
      guard: input.guard,
      providerCalled: input.providerCalled,
      modelTierUsed: input.modelTierUsed,
    });

    deps.logTelemetryEvent?.(event);

    if (event.alertLevel !== "none") {
      deps.logAlert?.({
        level: event.alertLevel,
        feature: "marketplace-personalization",
        tenantId: input.tenantId,
        monthKey: event.monthKey,
        event,
      });
    }
  }

  function buildResult(opts: {
    input: PersonalizationInput;
    ranked: Array<{ post: MarketplacePost; score: number; reasonCodes: PersonalizationReasonCode[] }>;
    rationaleByPostId: Map<string, string>;
    mode: PersonalizationMode;
    guard: AiBudgetGuardDecision;
    modelTierUsed: PersonalizationTier | null;
    providerCalled: boolean;
    coldStart: boolean;
  }): PersonalizationResult {
    const items: PersonalizedItem[] = opts.ranked.slice(0, opts.input.topN).map((r) => ({
      post: r.post,
      score: r.score,
      reasonCodes: r.reasonCodes,
      rationale: opts.rationaleByPostId.get(r.post.postId) ?? null,
      impressionToken: tokenFor({
        userHash: opts.input.user.userHash,
        postId: r.post.postId,
        monthKey: opts.input.monthKey,
      }),
    }));

    return {
      mode: opts.mode,
      items,
      guard: opts.guard,
      modelTierUsed: opts.modelTierUsed,
      providerCalled: opts.providerCalled,
      coldStart: opts.coldStart,
    };
  }

  async function rankFeed(input: PersonalizationInput): Promise<PersonalizationResult> {
    const safeCandidates = enforceCompetitorSuppression(input.candidates, input.tenantContext);
    const baseline = buildDeterministicRanking(safeCandidates, input.user);
    const coldStart = !hasUserSignals(input.user);

    const usage = await deps.getUsageSnapshot(input.monthKey);
    const guard = evaluateAiBudgetGuard({
      feature: "marketplace-personalization",
      usage,
      config: budgetConfig,
    });

    deps.logGuardDecision?.({
      feature: "marketplace-personalization",
      tenantId: input.tenantId,
      monthKey: input.monthKey,
      decision: guard,
    });

    const fallback = (providerCalled: boolean, modelTier: PersonalizationTier | null): PersonalizationResult => {
      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled,
        modelTierUsed: modelTier,
      });
      const result = buildResult({
        input,
        ranked: baseline,
        rationaleByPostId: new Map(),
        mode: "deterministic",
        guard,
        modelTierUsed: modelTier,
        providerCalled,
        coldStart,
      });
      deps.logRanking?.({
        tenantId: input.tenantId,
        monthKey: input.monthKey,
        userHash: input.user.userHash,
        mode: result.mode,
        coldStart: result.coldStart,
        items: result.items.map((it) => ({
          postId: it.post.postId,
          score: it.score,
          impressionToken: it.impressionToken,
        })),
      });
      return result;
    };

    if (!guard.allowed || !deps.callModel || coldStart) {
      // Cold-start uses deterministic popularity ranking with no AI call.
      return fallback(false, null);
    }

    const modelTier: PersonalizationTier = guard.disablePremiumModel ? "low-cost" : "high";

    try {
      const modelOutput = await deps.callModel({
        tenantId: input.tenantId,
        user: input.user,
        baseline: baseline.map((b) => ({
          postId: b.post.postId,
          score: b.score,
          reasonCodes: b.reasonCodes,
        })),
        modelTier,
      });

      // Defence in depth: ignore any postId the model invented; clamp scores.
      const allowedIds = new Set(baseline.map((b) => b.post.postId));
      const overrideScore = new Map<string, number>();
      const rationaleByPostId = new Map<string, string>();
      for (const r of modelOutput.rerank) {
        if (!allowedIds.has(r.postId)) continue;
        overrideScore.set(r.postId, clamp01(r.score));
        if (r.rationale && r.rationale.trim().length > 0) {
          rationaleByPostId.set(r.postId, r.rationale);
        }
      }

      const reranked = baseline
        .map((b) => ({
          ...b,
          score: overrideScore.has(b.post.postId) ? overrideScore.get(b.post.postId)! : b.score,
        }))
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.post.postId.localeCompare(b.post.postId);
        });

      emitObservability({
        tenantId: input.tenantId,
        usage,
        guard,
        providerCalled: true,
        modelTierUsed: modelTier,
      });

      const result = buildResult({
        input,
        ranked: reranked,
        rationaleByPostId,
        mode: "ai-augmented",
        guard,
        modelTierUsed: modelTier,
        providerCalled: true,
        coldStart,
      });
      deps.logRanking?.({
        tenantId: input.tenantId,
        monthKey: input.monthKey,
        userHash: input.user.userHash,
        mode: result.mode,
        coldStart: result.coldStart,
        items: result.items.map((it) => ({
          postId: it.post.postId,
          score: it.score,
          impressionToken: it.impressionToken,
        })),
      });
      return result;
    } catch {
      return fallback(true, modelTier);
    }
  }

  return {
    rankFeed,
  };
}
