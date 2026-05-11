/**
 * W46 — messagingAdminService
 *
 * Factory for admin messaging surfaces: inbox triage, thread assignment,
 * canned replies, auto-reply configuration, message archive / search,
 * block/report client from inbox.
 *
 * Pattern (mirrors clientCrmService / loyaltyAdminService):
 *   • Optional repo port injections.
 *   • Absent repo → { ok: false, message: "… not configured." }
 */

import type {
  AdminThread,
  AutoReplyConfig,
  BlockFromInboxInput,
  CannedReply,
  CannedReplyInput,
  MessageArchiveFilter,
  MessagingAdminResult,
  ReportFromInboxInput,
  ThreadArchiveInput,
  ThreadAssignInput,
  ThreadResolveInput,
} from "../../domains/messaging/messagingAdminModel";

// ---------------------------------------------------------------------------
// Repository ports
// ---------------------------------------------------------------------------

export type AdminThreadRepository = {
  listThreads(tenantId: string, status?: string): Promise<AdminThread[]>;
  getThread(threadId: string, tenantId: string): Promise<AdminThread | null>;
  assignThread(input: ThreadAssignInput): Promise<AdminThread>;
  resolveThread(input: ThreadResolveInput): Promise<AdminThread>;
  archiveThread(input: ThreadArchiveInput): Promise<AdminThread>;
  blockFromInbox(input: BlockFromInboxInput): Promise<void>;
  reportFromInbox(input: ReportFromInboxInput): Promise<void>;
  searchArchive(tenantId: string, filter: MessageArchiveFilter): Promise<AdminThread[]>;
};

export type CannedReplyRepository = {
  listCannedReplies(tenantId: string): Promise<CannedReply[]>;
  saveCannedReply(input: CannedReplyInput): Promise<CannedReply>;
  deleteCannedReply(cannedId: string, tenantId: string): Promise<void>;
  getAutoReplyConfig(tenantId: string): Promise<AutoReplyConfig | null>;
  saveAutoReplyConfig(config: AutoReplyConfig): Promise<void>;
};

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

function fmtError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMessagingAdminService(
  threadRepo?: AdminThreadRepository,
  cannedRepo?: CannedReplyRepository,
) {
  // -------------------------------------------------------------------------
  // Thread inbox
  // -------------------------------------------------------------------------

  async function listThreads(
    tenantId: string,
    status?: string,
  ): Promise<MessagingAdminResult<AdminThread[]>> {
    if (!threadRepo) return { ok: false, message: "Thread repository not configured." };
    try {
      return { ok: true, data: await threadRepo.listThreads(tenantId, status) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function getThread(
    threadId: string,
    tenantId: string,
  ): Promise<MessagingAdminResult<AdminThread | null>> {
    if (!threadRepo) return { ok: false, message: "Thread repository not configured." };
    try {
      return { ok: true, data: await threadRepo.getThread(threadId, tenantId) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function assignThread(
    input: ThreadAssignInput,
  ): Promise<MessagingAdminResult<AdminThread>> {
    if (!threadRepo) return { ok: false, message: "Thread repository not configured." };
    try {
      return { ok: true, data: await threadRepo.assignThread(input) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function resolveThread(
    input: ThreadResolveInput,
  ): Promise<MessagingAdminResult<AdminThread>> {
    if (!threadRepo) return { ok: false, message: "Thread repository not configured." };
    try {
      return { ok: true, data: await threadRepo.resolveThread(input) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function archiveThread(
    input: ThreadArchiveInput,
  ): Promise<MessagingAdminResult<AdminThread>> {
    if (!threadRepo) return { ok: false, message: "Thread repository not configured." };
    try {
      return { ok: true, data: await threadRepo.archiveThread(input) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function blockFromInbox(
    input: BlockFromInboxInput,
  ): Promise<MessagingAdminResult<void>> {
    if (!threadRepo) return { ok: false, message: "Thread repository not configured." };
    try {
      await threadRepo.blockFromInbox(input);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function reportFromInbox(
    input: ReportFromInboxInput,
  ): Promise<MessagingAdminResult<void>> {
    if (!threadRepo) return { ok: false, message: "Thread repository not configured." };
    try {
      await threadRepo.reportFromInbox(input);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function searchArchive(
    tenantId: string,
    filter: MessageArchiveFilter,
  ): Promise<MessagingAdminResult<AdminThread[]>> {
    if (!threadRepo) return { ok: false, message: "Thread repository not configured." };
    try {
      return { ok: true, data: await threadRepo.searchArchive(tenantId, filter) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Canned replies
  // -------------------------------------------------------------------------

  async function listCannedReplies(
    tenantId: string,
  ): Promise<MessagingAdminResult<CannedReply[]>> {
    if (!cannedRepo) return { ok: false, message: "Canned reply repository not configured." };
    try {
      return { ok: true, data: await cannedRepo.listCannedReplies(tenantId) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function saveCannedReply(
    input: CannedReplyInput,
  ): Promise<MessagingAdminResult<CannedReply>> {
    if (!cannedRepo) return { ok: false, message: "Canned reply repository not configured." };
    try {
      return { ok: true, data: await cannedRepo.saveCannedReply(input) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function deleteCannedReply(
    cannedId: string,
    tenantId: string,
  ): Promise<MessagingAdminResult<void>> {
    if (!cannedRepo) return { ok: false, message: "Canned reply repository not configured." };
    try {
      await cannedRepo.deleteCannedReply(cannedId, tenantId);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Auto-reply config
  // -------------------------------------------------------------------------

  async function loadAutoReplyConfig(
    tenantId: string,
  ): Promise<MessagingAdminResult<AutoReplyConfig | null>> {
    if (!cannedRepo) return { ok: false, message: "Canned reply repository not configured." };
    try {
      return { ok: true, data: await cannedRepo.getAutoReplyConfig(tenantId) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function saveAutoReplyConfig(
    config: AutoReplyConfig,
  ): Promise<MessagingAdminResult<void>> {
    if (!cannedRepo) return { ok: false, message: "Canned reply repository not configured." };
    try {
      await cannedRepo.saveAutoReplyConfig(config);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  return {
    listThreads,
    getThread,
    assignThread,
    resolveThread,
    archiveThread,
    blockFromInbox,
    reportFromInbox,
    searchArchive,
    listCannedReplies,
    saveCannedReply,
    deleteCannedReply,
    loadAutoReplyConfig,
    saveAutoReplyConfig,
  };
}

export type MessagingAdminService = ReturnType<typeof createMessagingAdminService>;
