/**
 * W44 — clientCrmService
 *
 * Factory for admin Client / CRM surfaces: client list, client detail,
 * merge duplicates, block / unblock, GDPR export, delete client with audit,
 * segment builder preview / save, and targeted-message dispatch.
 *
 * Pattern (mirrors bookingOpsService):
 *   • All repository-backed methods accept optional port injections.
 *   • When a repo is absent the method returns { ok: false, message: "… not configured." }.
 *   • Real Firestore adapters tracked as W44-DEBT-1.
 */

import type {
  BlockClientInput,
  ClientCrmResult,
  ClientDetailAdmin,
  ClientFilter,
  ClientListEntry,
  ClientSavedView,
  DeleteClientInput,
  GdprExportInput,
  GdprExportRequest,
  MergeCandidateSummary,
  MergeInput,
  SavedSegment,
  SegmentBuilderInput,
  SegmentFilter,
  SegmentPreview,
  TargetedMessageInput,
  TargetedMessageResult,
  UnblockClientInput,
} from "../../domains/clients/clientCrmModel";

// ---------------------------------------------------------------------------
// Repository ports
// ---------------------------------------------------------------------------

export type ClientListRepository = {
  list(
    tenantId: string,
    filter: ClientFilter,
    savedView: ClientSavedView | null,
    search: string,
  ): Promise<ClientListEntry[]>;
};

export type ClientDetailRepository = {
  getDetail(clientId: string, tenantId: string): Promise<ClientDetailAdmin | null>;
};

export type ClientWriteRepository = {
  mergeClients(input: MergeInput): Promise<{ mergedClientId: string }>;
  blockClient(input: BlockClientInput): Promise<void>;
  unblockClient(input: UnblockClientInput): Promise<void>;
  deleteClient(input: DeleteClientInput): Promise<void>;
};

export type GdprRepository = {
  requestExport(input: GdprExportInput): Promise<GdprExportRequest>;
  listPreviousRequests(clientId: string, tenantId: string): Promise<GdprExportRequest[]>;
};

export type SegmentBuilderRepository = {
  previewSegment(
    tenantId: string,
    filters: SegmentFilter[],
  ): Promise<SegmentPreview>;
  saveSegment(input: SegmentBuilderInput): Promise<SavedSegment>;
};

export type CampaignSendRepository = {
  sendToSegment(input: TargetedMessageInput): Promise<TargetedMessageResult>;
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

export function createClientCrmService(
  listRepo?: ClientListRepository,
  detailRepo?: ClientDetailRepository,
  writeRepo?: ClientWriteRepository,
  gdprRepo?: GdprRepository,
  segmentRepo?: SegmentBuilderRepository,
  campaignRepo?: CampaignSendRepository,
) {
  // -------------------------------------------------------------------------
  // Client list
  // -------------------------------------------------------------------------

  async function listClients(
    tenantId: string,
    filter: ClientFilter,
    savedView: ClientSavedView | null,
    search: string,
  ): Promise<ClientCrmResult<ClientListEntry[]>> {
    if (!listRepo) {
      return { ok: false, message: "Client list repository not configured." };
    }
    try {
      const data = await listRepo.list(tenantId, filter, savedView, search);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Client detail
  // -------------------------------------------------------------------------

  async function loadClientDetail(
    clientId: string,
    tenantId: string,
  ): Promise<ClientCrmResult<ClientDetailAdmin>> {
    if (!detailRepo) {
      return { ok: false, message: "Client detail repository not configured." };
    }
    try {
      const detail = await detailRepo.getDetail(clientId, tenantId);
      if (!detail) {
        return { ok: false, message: "Client not found." };
      }
      return { ok: true, data: detail };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Merge clients
  // -------------------------------------------------------------------------

  async function mergeClients(
    input: MergeInput,
  ): Promise<ClientCrmResult<{ mergedClientId: string }>> {
    if (!writeRepo) {
      return { ok: false, message: "Client write repository not configured." };
    }
    if (!input.reason.trim()) {
      return { ok: false, message: "Merge reason is required." };
    }
    try {
      const data = await writeRepo.mergeClients(input);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Block / unblock
  // -------------------------------------------------------------------------

  async function blockClient(
    input: BlockClientInput,
  ): Promise<ClientCrmResult<void>> {
    if (!writeRepo) {
      return { ok: false, message: "Client write repository not configured." };
    }
    try {
      await writeRepo.blockClient(input);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function unblockClient(
    input: UnblockClientInput,
  ): Promise<ClientCrmResult<void>> {
    if (!writeRepo) {
      return { ok: false, message: "Client write repository not configured." };
    }
    try {
      await writeRepo.unblockClient(input);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // GDPR export
  // -------------------------------------------------------------------------

  async function requestGdprExport(
    input: GdprExportInput,
  ): Promise<ClientCrmResult<GdprExportRequest>> {
    if (!gdprRepo) {
      return { ok: false, message: "GDPR repository not configured." };
    }
    try {
      const data = await gdprRepo.requestExport(input);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function loadGdprRequests(
    clientId: string,
    tenantId: string,
  ): Promise<ClientCrmResult<GdprExportRequest[]>> {
    if (!gdprRepo) {
      return { ok: false, message: "GDPR repository not configured." };
    }
    try {
      const data = await gdprRepo.listPreviousRequests(clientId, tenantId);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Delete client
  // -------------------------------------------------------------------------

  async function deleteClient(
    input: DeleteClientInput,
  ): Promise<ClientCrmResult<void>> {
    if (!writeRepo) {
      return { ok: false, message: "Client write repository not configured." };
    }
    if (!input.reason.trim()) {
      return { ok: false, message: "Deletion reason is required." };
    }
    try {
      await writeRepo.deleteClient(input);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Segment builder
  // -------------------------------------------------------------------------

  async function buildSegmentPreview(
    tenantId: string,
    filters: SegmentFilter[],
  ): Promise<ClientCrmResult<SegmentPreview>> {
    if (!segmentRepo) {
      return { ok: false, message: "Segment repository not configured." };
    }
    try {
      const data = await segmentRepo.previewSegment(tenantId, filters);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function saveSegment(
    input: SegmentBuilderInput,
  ): Promise<ClientCrmResult<SavedSegment>> {
    if (!segmentRepo) {
      return { ok: false, message: "Segment repository not configured." };
    }
    if (!input.name.trim()) {
      return { ok: false, message: "Segment name is required." };
    }
    try {
      const data = await segmentRepo.saveSegment(input);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Targeted message
  // -------------------------------------------------------------------------

  async function sendToSegment(
    input: TargetedMessageInput,
  ): Promise<ClientCrmResult<TargetedMessageResult>> {
    if (!campaignRepo) {
      return { ok: false, message: "Campaign send repository not configured." };
    }
    if (!input.body.trim()) {
      return { ok: false, message: "Message body is required." };
    }
    if (input.channel === "email" && !input.subject?.trim()) {
      return { ok: false, message: "Subject is required for email campaigns." };
    }
    try {
      const data = await campaignRepo.sendToSegment(input);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Load merge candidate summaries (convenience — same detail repo)
  // -------------------------------------------------------------------------

  async function loadMergeCandidates(
    primaryId: string,
    duplicateId: string,
    tenantId: string,
  ): Promise<ClientCrmResult<{ primary: MergeCandidateSummary; duplicate: MergeCandidateSummary }>> {
    if (!detailRepo) {
      return { ok: false, message: "Client detail repository not configured." };
    }
    try {
      const [a, b] = await Promise.all([
        detailRepo.getDetail(primaryId, tenantId),
        detailRepo.getDetail(duplicateId, tenantId),
      ]);
      if (!a) return { ok: false, message: "Primary client not found." };
      if (!b) return { ok: false, message: "Duplicate client not found." };
      const toSummary = (c: ClientDetailAdmin): MergeCandidateSummary => ({
        clientId: c.clientId,
        name: c.name,
        phone: c.phone,
        email: c.email,
        bookingCount: c.totalBookings,
        loyaltyPoints: c.loyaltyBalance,
      });
      return { ok: true, data: { primary: toSummary(a), duplicate: toSummary(b) } };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  return {
    listClients,
    loadClientDetail,
    mergeClients,
    blockClient,
    unblockClient,
    requestGdprExport,
    loadGdprRequests,
    deleteClient,
    buildSegmentPreview,
    saveSegment,
    sendToSegment,
    loadMergeCandidates,
  };
}

export type ClientCrmService = ReturnType<typeof createClientCrmService>;
