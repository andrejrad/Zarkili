import { describe, expect, it, jest } from "@jest/globals";

import {
  createMarketplacePostsService,
  type CreateMarketplacePostInput,
} from "../marketplacePostsService";
import type { MarketplacePost } from "../model";
import type { MarketplaceRepository } from "../repository";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeRepoStub(): {
  repo: MarketplaceRepository;
  createPost: jest.Mock;
  updatePost: jest.Mock;
} {
  const createPost = jest.fn(async (post: Omit<MarketplacePost, "postId" | "createdAt" | "updatedAt">) => ({
    ...post,
    postId: "post-1",
    createdAt: { _type: "ts" },
    updatedAt: { _type: "ts" },
  }) as unknown as MarketplacePost);
  const updatePost = jest.fn(async () => undefined);
  const repo: MarketplaceRepository = {
    upsertProfile: jest.fn() as never,
    getProfile: jest.fn() as never,
    createPost: createPost as never,
    getPost: jest.fn() as never,
    updatePost: updatePost as never,
    getPublishedPosts: jest.fn() as never,
    upsertSettings: jest.fn() as never,
    getSettings: jest.fn() as never,
    getVisibleProfiles: jest.fn() as never,
  };
  return { repo, createPost: createPost as unknown as jest.Mock, updatePost: updatePost as unknown as jest.Mock };
}

function makeInput(overrides: Partial<CreateMarketplacePostInput> = {}): CreateMarketplacePostInput {
  return {
    tenantId: "tenant-1",
    title: "Balayage refresh",
    description: "Sun-kissed dimension on healthy hair.",
    imageUrls: ["https://example.com/1.jpg"],
    serviceTags: ["color"],
    styleTags: ["balayage"],
    isPublished: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// createPost
// ---------------------------------------------------------------------------

describe("marketplacePostsService.createPost", () => {
  it("delegates clean copy to the repository", async () => {
    const { repo, createPost } = makeRepoStub();
    const svc = createMarketplacePostsService(repo);
    const result = await svc.createPost(makeInput());
    expect(createPost).toHaveBeenCalledTimes(1);
    expect(result.postId).toBe("post-1");
  });

  it("blocks creation when title contains forbidden commission vocabulary", async () => {
    const { repo, createPost } = makeRepoStub();
    const svc = createMarketplacePostsService(repo);
    await expect(
      svc.createPost(makeInput({ title: "10% commission special" })),
    ).rejects.toThrow(/COMMISSION_MESSAGING_FORBIDDEN/);
    expect(createPost).not.toHaveBeenCalled();
  });

  it("blocks creation when description contains forbidden commission vocabulary", async () => {
    const { repo, createPost } = makeRepoStub();
    const svc = createMarketplacePostsService(repo);
    await expect(
      svc.createPost(makeInput({ description: "Pay only the per-booking fee on first visit" })),
    ).rejects.toThrow(/COMMISSION_MESSAGING_FORBIDDEN/);
    expect(createPost).not.toHaveBeenCalled();
  });

  it("is case-insensitive for forbidden tokens", async () => {
    const { repo } = makeRepoStub();
    const svc = createMarketplacePostsService(repo);
    await expect(
      svc.createPost(makeInput({ description: "Includes a small Marketplace Fee." })),
    ).rejects.toThrow(/COMMISSION_MESSAGING_FORBIDDEN/);
  });

  it("reports the offending tokens in the error message", async () => {
    const { repo } = makeRepoStub();
    const svc = createMarketplacePostsService(repo);
    let caught: Error | null = null;
    try {
      await svc.createPost(makeInput({ description: "platform fee + booking fee" }));
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).not.toBeNull();
    expect(caught!.message.toLowerCase()).toContain("platform fee");
    expect(caught!.message.toLowerCase()).toContain("booking fee");
  });
});

// ---------------------------------------------------------------------------
// updatePost
// ---------------------------------------------------------------------------

describe("marketplacePostsService.updatePost", () => {
  it("delegates clean updates to the repository", async () => {
    const { repo, updatePost } = makeRepoStub();
    const svc = createMarketplacePostsService(repo);
    await svc.updatePost("tenant-1", "post-1", { title: "Fresh balayage", description: "Updated copy." });
    expect(updatePost).toHaveBeenCalledTimes(1);
  });

  it("blocks update when title is dirty", async () => {
    const { repo, updatePost } = makeRepoStub();
    const svc = createMarketplacePostsService(repo);
    await expect(
      svc.updatePost("tenant-1", "post-1", { title: "5% commission cut" }),
    ).rejects.toThrow(/COMMISSION_MESSAGING_FORBIDDEN/);
    expect(updatePost).not.toHaveBeenCalled();
  });

  it("blocks update when description is dirty", async () => {
    const { repo, updatePost } = makeRepoStub();
    const svc = createMarketplacePostsService(repo);
    await expect(
      svc.updatePost("tenant-1", "post-1", { description: "Includes a new client fee." }),
    ).rejects.toThrow(/COMMISSION_MESSAGING_FORBIDDEN/);
    expect(updatePost).not.toHaveBeenCalled();
  });

  it("does not lint untouched fields (allows partial updates)", async () => {
    const { repo, updatePost } = makeRepoStub();
    const svc = createMarketplacePostsService(repo);
    // Caller updates only image URLs — must not be blocked even if title is otherwise clean
    await svc.updatePost("tenant-1", "post-1", { imageUrls: ["https://example.com/2.jpg"] });
    expect(updatePost).toHaveBeenCalledTimes(1);
  });

  it("skips empty-string title/description rather than asserting on them", async () => {
    const { repo, updatePost } = makeRepoStub();
    const svc = createMarketplacePostsService(repo);
    // empty string — nothing to lint, repo still receives the patch
    await svc.updatePost("tenant-1", "post-1", { title: "", description: "" });
    expect(updatePost).toHaveBeenCalledTimes(1);
  });
});
