import { describe, expect, it, jest } from "@jest/globals";

import {
  buildDeterministicRanking,
  createMarketplacePersonalizationService,
  enforceCompetitorSuppression,
  hasUserSignals,
  type MarketplacePersonalizationDependencies,
  type MarketplacePersonalizationModelOutput,
  type PersonalizationCandidate,
  type PersonalizationInput,
  type PersonalizationUserProfile,
} from "../marketplacePersonalizationService";

import type { AiBudgetUsageSnapshot } from "../../../shared/ai";
import type { MarketplacePost } from "../../marketplace/model";

const MONTH = "2026-04";

function post(p: Partial<MarketplacePost> & { postId: string; tenantId: string }): MarketplacePost {
  return {
    postId: p.postId,
    tenantId: p.tenantId,
    title: p.title ?? `title-${p.postId}`,
    description: p.description ?? "",
    imageUrls: p.imageUrls ?? [],
    serviceTags: p.serviceTags ?? [],
    styleTags: p.styleTags ?? [],
    bookThisLookServiceId: p.bookThisLookServiceId,
    isPublished: p.isPublished ?? true,
    createdAt: p.createdAt ?? { _type: "ts" },
    updatedAt: p.updatedAt ?? { _type: "ts" },
  };
}

function snapshot(featureSpend = 0, globalSpend = 0): AiBudgetUsageSnapshot {
  return {
    monthKey: MONTH,
    globalSpendUsd: globalSpend,
    featureSpendUsd: { "marketplace-personalization": featureSpend },
  };
}

const userWithSignals: PersonalizationUserProfile = {
  userHash: "u1",
  preferredServiceTags: ["balayage"],
  preferredStyleTags: ["minimalist"],
  bookedPostIds: ["p-booked"],
  interactedPostIds: ["p-int"],
  preferredCity: "NYC",
};

const coldUser: PersonalizationUserProfile = {
  userHash: "u-cold",
  preferredServiceTags: [],
  preferredStyleTags: [],
  bookedPostIds: [],
  interactedPostIds: [],
};

function makeDeps(overrides: Partial<MarketplacePersonalizationDependencies> = {}): MarketplacePersonalizationDependencies {
  return {
    getUsageSnapshot: async () => snapshot(),
    callModel: async () => ({ rerank: [] }),
    ...overrides,
  };
}

function makeInput(overrides: Partial<PersonalizationInput> = {}): PersonalizationInput {
  return {
    tenantId: "tenant-host",
    monthKey: MONTH,
    tenantContext: null,
    user: userWithSignals,
    candidates: [],
    topN: 5,
    ...overrides,
  };
}

describe("hasUserSignals", () => {
  it("returns false for an empty profile", () => {
    expect(hasUserSignals(coldUser)).toBe(false);
  });
  it("returns true when any signal is present", () => {
    expect(hasUserSignals(userWithSignals)).toBe(true);
  });
});

describe("enforceCompetitorSuppression", () => {
  it("keeps all candidates for anonymous browsing", () => {
    const cs: PersonalizationCandidate[] = [
      { post: post({ postId: "a", tenantId: "t1" }) },
      { post: post({ postId: "b", tenantId: "t2" }) },
    ];
    expect(enforceCompetitorSuppression(cs, null)).toHaveLength(2);
  });

  it("drops competitor-tenant posts inside an active funnel", () => {
    const cs: PersonalizationCandidate[] = [
      { post: post({ postId: "a", tenantId: "t1" }) },
      { post: post({ postId: "b", tenantId: "t2" }) },
    ];
    const safe = enforceCompetitorSuppression(cs, "t1");
    expect(safe).toHaveLength(1);
    expect(safe[0].post.tenantId).toBe("t1");
  });
});

describe("buildDeterministicRanking", () => {
  it("ranks cold-start by popularity with fallback-default reason", () => {
    const cs: PersonalizationCandidate[] = [
      { post: post({ postId: "lo", tenantId: "t" }), popularityScore: 10 },
      { post: post({ postId: "hi", tenantId: "t" }), popularityScore: 80 },
    ];
    const r = buildDeterministicRanking(cs, coldUser);
    expect(r[0].post.postId).toBe("hi");
    expect(r[0].reasonCodes).toContain("fallback-default");
    expect(r[0].reasonCodes).toContain("popular");
  });

  it("rewards previously-booked above tag matches", () => {
    const cs: PersonalizationCandidate[] = [
      {
        post: post({
          postId: "p-booked",
          tenantId: "t",
          serviceTags: [],
          styleTags: [],
        }),
      },
      {
        post: post({
          postId: "p-tag",
          tenantId: "t",
          serviceTags: ["balayage"],
          styleTags: ["minimalist"],
        }),
      },
    ];
    const r = buildDeterministicRanking(cs, userWithSignals);
    expect(r[0].post.postId).toBe("p-booked");
    expect(r[0].reasonCodes).toContain("previously-booked");
  });
});

describe("createMarketplacePersonalizationService", () => {
  it("uses deterministic ranking and skips the model on cold-start", async () => {
    const callModel = jest.fn();
    const svc = createMarketplacePersonalizationService(
      makeDeps({ callModel: callModel as unknown as MarketplacePersonalizationDependencies["callModel"] })
    );
    const result = await svc.rankFeed(
      makeInput({
        user: coldUser,
        candidates: [
          { post: post({ postId: "a", tenantId: "t" }), popularityScore: 10 },
          { post: post({ postId: "b", tenantId: "t" }), popularityScore: 50 },
        ],
      })
    );
    expect(result.mode).toBe("deterministic");
    expect(result.coldStart).toBe(true);
    expect(result.items[0].post.postId).toBe("b");
    expect(result.items[0].rationale).toBeNull();
    expect(callModel).not.toHaveBeenCalled();
  });

  it("falls back to deterministic when guard is exhausted (no rationale)", async () => {
    const callModel = jest.fn();
    const svc = createMarketplacePersonalizationService(
      makeDeps({
        getUsageSnapshot: async () => snapshot(95, 1500),
        callModel: callModel as unknown as MarketplacePersonalizationDependencies["callModel"],
      })
    );
    const result = await svc.rankFeed(
      makeInput({
        candidates: [{ post: post({ postId: "a", tenantId: "t" }), popularityScore: 5 }],
      })
    );
    expect(result.mode).toBe("deterministic");
    expect(result.providerCalled).toBe(false);
    expect(result.items[0].rationale).toBeNull();
    expect(callModel).not.toHaveBeenCalled();
  });

  it("downshifts to low-cost in protection state", async () => {
    const callModel = jest
      .fn<(...a: unknown[]) => Promise<MarketplacePersonalizationModelOutput>>()
      .mockResolvedValue({ rerank: [] });
    const svc = createMarketplacePersonalizationService(
      makeDeps({
        getUsageSnapshot: async () => snapshot(82, 600),
        callModel: callModel as unknown as MarketplacePersonalizationDependencies["callModel"],
      })
    );
    const result = await svc.rankFeed(
      makeInput({
        candidates: [{ post: post({ postId: "a", tenantId: "t" }) }],
      })
    );
    expect(result.modelTierUsed).toBe("low-cost");
    expect(callModel).toHaveBeenCalledWith(expect.objectContaining({ modelTier: "low-cost" }));
  });

  it("applies the model's rerank only for known postIds and clamps scores", async () => {
    const callModel = jest
      .fn<(...a: unknown[]) => Promise<MarketplacePersonalizationModelOutput>>()
      .mockResolvedValue({
        rerank: [
          { postId: "b", score: 5, rationale: "matches your style" }, // clamped to 1
          { postId: "ghost", score: 0.99, rationale: "should be ignored" },
        ],
      });
    const svc = createMarketplacePersonalizationService(
      makeDeps({ callModel: callModel as unknown as MarketplacePersonalizationDependencies["callModel"] })
    );
    const result = await svc.rankFeed(
      makeInput({
        candidates: [
          { post: post({ postId: "a", tenantId: "t" }) },
          { post: post({ postId: "b", tenantId: "t", serviceTags: ["balayage"] }) },
        ],
      })
    );
    expect(result.mode).toBe("ai-augmented");
    expect(result.items[0].post.postId).toBe("b");
    expect(result.items[0].score).toBe(1);
    expect(result.items[0].rationale).toBe("matches your style");
    expect(result.items.some((i) => i.post.postId === "ghost")).toBe(false);
  });

  it("falls back to deterministic on model error and still emits observability once", async () => {
    const telemetry = jest.fn();
    const log = jest.fn();
    const svc = createMarketplacePersonalizationService(
      makeDeps({
        callModel: async () => {
          throw new Error("provider down");
        },
        logTelemetryEvent: telemetry,
        logRanking: log,
      })
    );
    const result = await svc.rankFeed(
      makeInput({
        candidates: [
          { post: post({ postId: "a", tenantId: "t", serviceTags: ["balayage"] }) },
        ],
      })
    );
    expect(result.mode).toBe("deterministic");
    expect(result.providerCalled).toBe(true);
    expect(result.items[0].rationale).toBeNull();
    expect(telemetry).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("suppresses competitor-tenant posts inside an active booking funnel", async () => {
    const svc = createMarketplacePersonalizationService(makeDeps());
    const result = await svc.rankFeed(
      makeInput({
        tenantContext: "t-host",
        candidates: [
          { post: post({ postId: "own", tenantId: "t-host", serviceTags: ["balayage"] }) },
          { post: post({ postId: "competitor", tenantId: "t-rival", serviceTags: ["balayage"] }) },
        ],
      })
    );
    expect(result.items.map((it) => it.post.postId)).toEqual(["own"]);
  });

  it("emits exactly one guard decision and one telemetry event per call", async () => {
    const guardLog = jest.fn();
    const telemetry = jest.fn();
    const svc = createMarketplacePersonalizationService(
      makeDeps({ logGuardDecision: guardLog, logTelemetryEvent: telemetry })
    );
    await svc.rankFeed(
      makeInput({
        candidates: [{ post: post({ postId: "a", tenantId: "t" }) }],
      })
    );
    expect(guardLog).toHaveBeenCalledTimes(1);
    expect(telemetry).toHaveBeenCalledTimes(1);
  });

  it("attaches stable impressionTokens for analytics attribution", async () => {
    const svc = createMarketplacePersonalizationService(
      makeDeps({
        generateImpressionToken: ({ userHash, postId }) => `tok-${userHash}-${postId}`,
      })
    );
    const result = await svc.rankFeed(
      makeInput({
        candidates: [
          { post: post({ postId: "a", tenantId: "t" }) },
          { post: post({ postId: "b", tenantId: "t" }) },
        ],
      })
    );
    const tokens = result.items.map((it) => it.impressionToken);
    expect(tokens).toEqual(expect.arrayContaining(["tok-u1-a", "tok-u1-b"]));
  });

  it("logs ranking with mode and coldStart for downstream CTR/conversion analytics", async () => {
    const log = jest.fn();
    const svc = createMarketplacePersonalizationService(
      makeDeps({
        callModel: async () => ({ rerank: [] }),
        logRanking: log,
      })
    );
    await svc.rankFeed(
      makeInput({
        candidates: [{ post: post({ postId: "a", tenantId: "t" }) }],
      })
    );
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "ai-augmented",
        coldStart: false,
        items: expect.arrayContaining([
          expect.objectContaining({ postId: "a" }),
        ]),
      })
    );
  });

  it("respects topN by truncating the ranked list", async () => {
    const svc = createMarketplacePersonalizationService(makeDeps());
    const result = await svc.rankFeed(
      makeInput({
        topN: 2,
        candidates: [
          { post: post({ postId: "a", tenantId: "t" }) },
          { post: post({ postId: "b", tenantId: "t" }) },
          { post: post({ postId: "c", tenantId: "t" }) },
        ],
      })
    );
    expect(result.items).toHaveLength(2);
  });
});
