/**
 * Marketplace post write service (W17-DEBT-3 — commission-lint at write time).
 *
 * Thin wrapper around `MarketplaceRepository` that runs `assertNoCommissionMessaging`
 * over user-facing copy (title + description) before any post create/update is
 * persisted. Throws `COMMISSION_MESSAGING_FORBIDDEN` on hits — the same error
 * code the existing CMS-side check raises, so callers get one consistent
 * surface for guardrail violations.
 *
 * Pure composition: the repository is injected, no I/O of its own. The lint
 * is the existing `assertNoCommissionMessaging` from `guardrailsService` —
 * no new vocabulary; this slot only wires the assertion at the write boundary.
 */

import { assertNoCommissionMessaging } from "./guardrailsService";
import type { MarketplacePost } from "./model";
import type { MarketplaceRepository } from "./repository";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateMarketplacePostInput = Omit<
  MarketplacePost,
  "postId" | "createdAt" | "updatedAt"
>;

export type UpdateMarketplacePostInput = Partial<
  Pick<
    MarketplacePost,
    | "title"
    | "description"
    | "imageUrls"
    | "serviceTags"
    | "styleTags"
    | "bookThisLookServiceId"
    | "isPublished"
  >
>;

export type MarketplacePostsService = {
  /**
   * Lints title + description for forbidden commission vocabulary then
   * persists via the repository. Throws `COMMISSION_MESSAGING_FORBIDDEN`
   * on violation; the post is never written when the lint fails.
   */
  createPost(input: CreateMarketplacePostInput): Promise<MarketplacePost>;

  /**
   * Lints any updated `title` / `description` fields and applies the patch.
   * Skips lint for fields the caller did not touch.
   */
  updatePost(
    tenantId: string,
    postId: string,
    updates: UpdateMarketplacePostInput,
  ): Promise<void>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMarketplacePostsService(
  repository: MarketplaceRepository,
): MarketplacePostsService {
  return {
    async createPost(input) {
      lintWriteCopy(input.title, input.description);
      return repository.createPost(input);
    },

    async updatePost(tenantId, postId, updates) {
      if (updates.title !== undefined || updates.description !== undefined) {
        lintWriteCopy(updates.title, updates.description);
      }
      await repository.updatePost(tenantId, postId, updates);
    },
  };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Runs the commission-vocabulary assertion over each non-empty field.
 * Empty / undefined fields are skipped — the assertion is only meaningful
 * over text actually being persisted.
 */
function lintWriteCopy(
  title: string | undefined,
  description: string | undefined,
): void {
  if (typeof title === "string" && title.length > 0) {
    assertNoCommissionMessaging(title);
  }
  if (typeof description === "string" && description.length > 0) {
    assertNoCommissionMessaging(description);
  }
}
