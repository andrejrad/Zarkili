/**
 * w44ClientCrmExtras.test.tsx
 *
 * W44 — Client / CRM (~100 tests)
 *
 * Covers:
 *   createClientCrmService — listClients
 *   createClientCrmService — loadClientDetail
 *   createClientCrmService — mergeClients
 *   createClientCrmService — blockClient / unblockClient
 *   createClientCrmService — requestGdprExport / loadGdprRequests
 *   createClientCrmService — deleteClient
 *   createClientCrmService — buildSegmentPreview / saveSegment
 *   createClientCrmService — sendToSegment
 *   createClientCrmService — loadMergeCandidates
 *   ClientListAdminScreen
 *   ClientDetailAdminScreen
 *   MergeClientsScreen
 *   BlockClientScreen
 *   SegmentBuilderScreen
 *   TargetedMessageScreen
 *   GdprExportScreen
 *   DeleteClientScreen
 *   routes.ts — 10 W44 routes
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { createClientCrmService } from "../src/app/admin/clientCrmService";
import type {
  ClientListRepository,
  ClientDetailRepository,
  ClientWriteRepository,
  GdprRepository,
  SegmentBuilderRepository,
  CampaignSendRepository,
} from "../src/app/admin/clientCrmService";

import { ClientListAdminScreen } from "../src/app/admin/ClientListAdminScreen";
import { ClientDetailAdminScreen } from "../src/app/admin/ClientDetailAdminScreen";
import { MergeClientsScreen } from "../src/app/admin/MergeClientsScreen";
import { BlockClientScreen } from "../src/app/admin/BlockClientScreen";
import { SegmentBuilderScreen } from "../src/app/admin/SegmentBuilderScreen";
import { TargetedMessageScreen } from "../src/app/admin/TargetedMessageScreen";
import { GdprExportScreen } from "../src/app/admin/GdprExportScreen";
import { DeleteClientScreen } from "../src/app/admin/DeleteClientScreen";

import { appRoutes as ROUTES } from "../src/app/navigation/routes";
import type {
  ClientDetailAdmin,
  ClientListEntry,
  GdprExportRequest,
  MergeCandidateSummary,
  SegmentFilter,
  SegmentPreview,
  SavedSegment,
} from "../src/domains/clients/clientCrmModel";

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const makeListEntry = (overrides: Partial<ClientListEntry> = {}): ClientListEntry => ({
  clientId: "c1",
  name: "Jane Doe",
  phone: "+1-555-0101",
  email: "jane@example.com",
  status: "active",
  isVip: false,
  tier: "gold",
  totalBookings: 12,
  totalSpendCents: 150000,
  lastVisitDate: "2026-04-01",
  avatarUrl: null,
  ...overrides,
});

const makeDetailAdmin = (overrides: Partial<ClientDetailAdmin> = {}): ClientDetailAdmin => ({
  clientId: "c1",
  name: "Jane Doe",
  phone: "+1-555-0101",
  email: "jane@example.com",
  status: "active",
  isVip: false,
  tier: "gold",
  tierPoints: 420,
  loyaltyBalance: 210,
  totalBookings: 12,
  totalSpendCents: 150000,
  sinceDate: "2023-01-15",
  avatarUrl: null,
  notes: "Regular Friday client.",
  allergies: [
    { allergyId: "a1", label: "Ammonia", severity: "high" },
  ],
  photoUrls: [],
  consents: [
    { consentId: "cs1", type: "marketing", grantedAt: "2023-01-15T10:00:00Z", revokedAt: null },
  ],
  bookingHistory: [
    {
      bookingId: "bk1",
      date: "2026-04-01",
      serviceName: "Haircut",
      staffName: "Alice",
      status: "completed",
      amountCents: 5000,
    },
  ],
  ...overrides,
});

const makeMergeSummary = (id: string): MergeCandidateSummary => ({
  clientId: id,
  name: `Client ${id}`,
  phone: "+1-555-0100",
  email: `${id}@example.com`,
  bookingCount: 5,
  loyaltyPoints: 100,
});

const makeGdprRequest = (status: GdprExportRequest["status"] = "ready"): GdprExportRequest => ({
  requestId: "req1",
  clientId: "c1",
  exportType: "full",
  format: "json",
  status,
  requestedAt: "2026-05-01T10:00:00Z",
  completedAt: status === "ready" ? "2026-05-01T10:05:00Z" : null,
  downloadUrl: status === "ready" ? "https://example.com/export.json" : null,
});

const makeSegmentPreview = (): SegmentPreview => ({
  estimatedCount: 42,
  sampleClientIds: ["c1", "c2", "c3"],
});

const makeSavedSegment = (): SavedSegment => ({
  segmentId: "seg1",
  name: "High-value churned",
  filters: [],
  estimatedCount: 42,
  createdAt: "2026-05-01T10:00:00Z",
  createdBy: "owner1",
});

const makeSegmentFilter = (): SegmentFilter => ({
  filterId: "f1",
  field: "lastVisitDays",
  operator: "greater_than",
  value: "30",
});

// ---------------------------------------------------------------------------
// Mock repositories
// ---------------------------------------------------------------------------

function makeListRepo(clients: ClientListEntry[] = []): ClientListRepository {
  return { list: jest.fn().mockResolvedValue(clients) };
}

function makeDetailRepo(detail: ClientDetailAdmin | null = null): ClientDetailRepository {
  return { getDetail: jest.fn().mockResolvedValue(detail) };
}

function makeWriteRepo(): ClientWriteRepository {
  return {
    mergeClients: jest.fn().mockResolvedValue({ mergedClientId: "merged1" }),
    blockClient: jest.fn().mockResolvedValue(undefined),
    unblockClient: jest.fn().mockResolvedValue(undefined),
    deleteClient: jest.fn().mockResolvedValue(undefined),
  };
}

function makeGdprRepo(
  requests: GdprExportRequest[] = [],
): GdprRepository {
  return {
    requestExport: jest.fn().mockResolvedValue(makeGdprRequest()),
    listPreviousRequests: jest.fn().mockResolvedValue(requests),
  };
}

function makeSegmentRepo(): SegmentBuilderRepository {
  return {
    previewSegment: jest.fn().mockResolvedValue(makeSegmentPreview()),
    saveSegment: jest.fn().mockResolvedValue(makeSavedSegment()),
  };
}

function makeCampaignRepo(): CampaignSendRepository {
  return {
    sendToSegment: jest.fn().mockResolvedValue({ messageId: "msg1", recipientCount: 42, scheduledAt: null }),
  };
}

// ---------------------------------------------------------------------------
// createClientCrmService — listClients
// ---------------------------------------------------------------------------

describe("clientCrmService.listClients", () => {
  it("returns not-configured when no listRepo provided", async () => {
    const svc = createClientCrmService();
    const r = await svc.listClients("t1", "all", null, "");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/not configured/i);
  });

  it("returns client list from repo", async () => {
    const clients = [makeListEntry(), makeListEntry({ clientId: "c2", name: "Bob" })];
    const svc = createClientCrmService(makeListRepo(clients));
    const r = await svc.listClients("t1", "active", null, "Jane");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(2);
  });

  it("propagates repo error as { ok: false }", async () => {
    const repo: ClientListRepository = {
      list: jest.fn().mockRejectedValue(new Error("Firestore down")),
    };
    const svc = createClientCrmService(repo);
    const r = await svc.listClients("t1", "all", null, "");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe("Firestore down");
  });
});

// ---------------------------------------------------------------------------
// createClientCrmService — loadClientDetail
// ---------------------------------------------------------------------------

describe("clientCrmService.loadClientDetail", () => {
  it("returns not-configured when no detailRepo", async () => {
    const svc = createClientCrmService();
    const r = await svc.loadClientDetail("c1", "t1");
    expect(r.ok).toBe(false);
  });

  it("returns { ok: false } when client not found", async () => {
    const svc = createClientCrmService(undefined, makeDetailRepo(null));
    const r = await svc.loadClientDetail("c1", "t1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/not found/i);
  });

  it("returns client detail on success", async () => {
    const detail = makeDetailAdmin();
    const svc = createClientCrmService(undefined, makeDetailRepo(detail));
    const r = await svc.loadClientDetail("c1", "t1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.name).toBe("Jane Doe");
  });
});

// ---------------------------------------------------------------------------
// createClientCrmService — mergeClients
// ---------------------------------------------------------------------------

describe("clientCrmService.mergeClients", () => {
  it("returns not-configured when no writeRepo", async () => {
    const svc = createClientCrmService();
    const r = await svc.mergeClients({ primaryClientId: "c1", duplicateClientId: "c2", reason: "dup", performedBy: "owner", tenantId: "t1" });
    expect(r.ok).toBe(false);
  });

  it("returns error when reason is empty", async () => {
    const svc = createClientCrmService(undefined, undefined, makeWriteRepo());
    const r = await svc.mergeClients({ primaryClientId: "c1", duplicateClientId: "c2", reason: "  ", performedBy: "owner", tenantId: "t1" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/reason/i);
  });

  it("returns merged client ID on success", async () => {
    const svc = createClientCrmService(undefined, undefined, makeWriteRepo());
    const r = await svc.mergeClients({ primaryClientId: "c1", duplicateClientId: "c2", reason: "Duplicate record", performedBy: "owner", tenantId: "t1" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.mergedClientId).toBe("merged1");
  });
});

// ---------------------------------------------------------------------------
// createClientCrmService — blockClient / unblockClient
// ---------------------------------------------------------------------------

describe("clientCrmService.blockClient", () => {
  it("returns not-configured when no writeRepo", async () => {
    const svc = createClientCrmService();
    const r = await svc.blockClient({ clientId: "c1", tenantId: "t1", reason: "no_show", durationDays: 30, performedBy: "owner" });
    expect(r.ok).toBe(false);
  });

  it("succeeds with writeRepo", async () => {
    const svc = createClientCrmService(undefined, undefined, makeWriteRepo());
    const r = await svc.blockClient({ clientId: "c1", tenantId: "t1", reason: "no_show", durationDays: 30, performedBy: "owner" });
    expect(r.ok).toBe(true);
  });

  it("permanent block (null duration) succeeds", async () => {
    const svc = createClientCrmService(undefined, undefined, makeWriteRepo());
    const r = await svc.blockClient({ clientId: "c1", tenantId: "t1", reason: "harassment", durationDays: null, performedBy: "owner" });
    expect(r.ok).toBe(true);
  });
});

describe("clientCrmService.unblockClient", () => {
  it("returns not-configured when no writeRepo", async () => {
    const svc = createClientCrmService();
    const r = await svc.unblockClient({ clientId: "c1", tenantId: "t1", performedBy: "owner" });
    expect(r.ok).toBe(false);
  });

  it("succeeds with writeRepo", async () => {
    const svc = createClientCrmService(undefined, undefined, makeWriteRepo());
    const r = await svc.unblockClient({ clientId: "c1", tenantId: "t1", performedBy: "owner" });
    expect(r.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createClientCrmService — GDPR
// ---------------------------------------------------------------------------

describe("clientCrmService.requestGdprExport", () => {
  it("returns not-configured when no gdprRepo", async () => {
    const svc = createClientCrmService();
    const r = await svc.requestGdprExport({ clientId: "c1", tenantId: "t1", exportType: "full", format: "json", requestedBy: "owner" });
    expect(r.ok).toBe(false);
  });

  it("returns new export request on success", async () => {
    const svc = createClientCrmService(undefined, undefined, undefined, makeGdprRepo());
    const r = await svc.requestGdprExport({ clientId: "c1", tenantId: "t1", exportType: "full", format: "csv", requestedBy: "owner" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.requestId).toBe("req1");
  });
});

describe("clientCrmService.loadGdprRequests", () => {
  it("returns empty list when no previous requests", async () => {
    const svc = createClientCrmService(undefined, undefined, undefined, makeGdprRepo([]));
    const r = await svc.loadGdprRequests("c1", "t1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(0);
  });

  it("returns list of past requests", async () => {
    const svc = createClientCrmService(undefined, undefined, undefined, makeGdprRepo([makeGdprRequest(), makeGdprRequest("pending")]));
    const r = await svc.loadGdprRequests("c1", "t1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// createClientCrmService — deleteClient
// ---------------------------------------------------------------------------

describe("clientCrmService.deleteClient", () => {
  it("returns not-configured when no writeRepo", async () => {
    const svc = createClientCrmService();
    const r = await svc.deleteClient({ clientId: "c1", tenantId: "t1", reason: "GDPR request", performedBy: "owner" });
    expect(r.ok).toBe(false);
  });

  it("returns error when reason is empty", async () => {
    const svc = createClientCrmService(undefined, undefined, makeWriteRepo());
    const r = await svc.deleteClient({ clientId: "c1", tenantId: "t1", reason: "", performedBy: "owner" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/reason/i);
  });

  it("succeeds with reason provided", async () => {
    const svc = createClientCrmService(undefined, undefined, makeWriteRepo());
    const r = await svc.deleteClient({ clientId: "c1", tenantId: "t1", reason: "GDPR right to be forgotten", performedBy: "owner" });
    expect(r.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createClientCrmService — segment builder
// ---------------------------------------------------------------------------

describe("clientCrmService.buildSegmentPreview", () => {
  it("returns not-configured when no segmentRepo", async () => {
    const svc = createClientCrmService();
    const r = await svc.buildSegmentPreview("t1", [makeSegmentFilter()]);
    expect(r.ok).toBe(false);
  });

  it("returns estimated count from repo", async () => {
    const svc = createClientCrmService(undefined, undefined, undefined, undefined, makeSegmentRepo());
    const r = await svc.buildSegmentPreview("t1", [makeSegmentFilter()]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.estimatedCount).toBe(42);
  });
});

describe("clientCrmService.saveSegment", () => {
  it("returns error when name is empty", async () => {
    const svc = createClientCrmService(undefined, undefined, undefined, undefined, makeSegmentRepo());
    const r = await svc.saveSegment({ name: "", filters: [], tenantId: "t1", createdBy: "owner" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/name/i);
  });

  it("saves segment and returns saved record", async () => {
    const svc = createClientCrmService(undefined, undefined, undefined, undefined, makeSegmentRepo());
    const r = await svc.saveSegment({ name: "High-value churned", filters: [makeSegmentFilter()], tenantId: "t1", createdBy: "owner" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.segmentId).toBe("seg1");
  });
});

// ---------------------------------------------------------------------------
// createClientCrmService — sendToSegment
// ---------------------------------------------------------------------------

describe("clientCrmService.sendToSegment", () => {
  it("returns not-configured when no campaignRepo", async () => {
    const svc = createClientCrmService();
    const r = await svc.sendToSegment({ segmentId: "seg1", tenantId: "t1", channel: "push", subject: null, body: "Hello!", scheduledAt: null, sentBy: "owner" });
    expect(r.ok).toBe(false);
  });

  it("returns error when body is empty", async () => {
    const svc = createClientCrmService(undefined, undefined, undefined, undefined, undefined, makeCampaignRepo());
    const r = await svc.sendToSegment({ segmentId: "seg1", tenantId: "t1", channel: "push", subject: null, body: "", scheduledAt: null, sentBy: "owner" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/body/i);
  });

  it("returns error when email has no subject", async () => {
    const svc = createClientCrmService(undefined, undefined, undefined, undefined, undefined, makeCampaignRepo());
    const r = await svc.sendToSegment({ segmentId: "seg1", tenantId: "t1", channel: "email", subject: "", body: "Hi", scheduledAt: null, sentBy: "owner" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/subject/i);
  });

  it("succeeds with valid push message", async () => {
    const svc = createClientCrmService(undefined, undefined, undefined, undefined, undefined, makeCampaignRepo());
    const r = await svc.sendToSegment({ segmentId: "seg1", tenantId: "t1", channel: "push", subject: null, body: "Come back!", scheduledAt: null, sentBy: "owner" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.recipientCount).toBe(42);
  });

  it("succeeds with email with subject", async () => {
    const svc = createClientCrmService(undefined, undefined, undefined, undefined, undefined, makeCampaignRepo());
    const r = await svc.sendToSegment({ segmentId: "seg1", tenantId: "t1", channel: "email", subject: "We miss you", body: "Come back!", scheduledAt: null, sentBy: "owner" });
    expect(r.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createClientCrmService — loadMergeCandidates
// ---------------------------------------------------------------------------

describe("clientCrmService.loadMergeCandidates", () => {
  it("returns not-configured when no detailRepo", async () => {
    const svc = createClientCrmService();
    const r = await svc.loadMergeCandidates("c1", "c2", "t1");
    expect(r.ok).toBe(false);
  });

  it("returns error when primary not found", async () => {
    const detailRepo: ClientDetailRepository = {
      getDetail: jest.fn().mockResolvedValue(null),
    };
    const svc = createClientCrmService(undefined, detailRepo);
    const r = await svc.loadMergeCandidates("c1", "c2", "t1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/primary/i);
  });

  it("returns summaries for both clients", async () => {
    const a = makeDetailAdmin({ clientId: "c1", name: "Alice" });
    const b = makeDetailAdmin({ clientId: "c2", name: "Bob" });
    const detailRepo: ClientDetailRepository = {
      getDetail: jest.fn()
        .mockResolvedValueOnce(a)
        .mockResolvedValueOnce(b),
    };
    const svc = createClientCrmService(undefined, detailRepo);
    const r = await svc.loadMergeCandidates("c1", "c2", "t1");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.primary.name).toBe("Alice");
      expect(r.data.duplicate.name).toBe("Bob");
    }
  });
});

// ---------------------------------------------------------------------------
// ClientListAdminScreen
// ---------------------------------------------------------------------------

describe("ClientListAdminScreen", () => {
  const baseProps = {
    loading: false,
    error: null,
    clients: [] as ClientListEntry[],
    search: "",
    filter: "all" as const,
    savedView: null,
    selectedIds: [] as string[],
    onSearchChange: jest.fn(),
    onFilterChange: jest.fn(),
    onSavedViewChange: jest.fn(),
    onSelectClient: jest.fn(),
    onToggleSelect: jest.fn(),
    onBulkBlock: jest.fn(),
    onBulkExport: jest.fn(),
    onBulkMessage: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders with testID", () => {
    const { getByTestId } = render(<ClientListAdminScreen {...baseProps} />);
    expect(getByTestId("client-list-screen")).toBeTruthy();
  });

  it("renders search input", () => {
    const { getByTestId } = render(<ClientListAdminScreen {...baseProps} />);
    expect(getByTestId("search-input")).toBeTruthy();
  });

  it("renders filter chips", () => {
    const { getByTestId } = render(<ClientListAdminScreen {...baseProps} />);
    expect(getByTestId("filter-all")).toBeTruthy();
    expect(getByTestId("filter-active")).toBeTruthy();
    expect(getByTestId("filter-blocked")).toBeTruthy();
    expect(getByTestId("filter-vip")).toBeTruthy();
  });

  it("renders saved-view selector", () => {
    const { getByTestId } = render(<ClientListAdminScreen {...baseProps} />);
    expect(getByTestId("saved-view-selector")).toBeTruthy();
  });

  it("shows empty state when no clients", () => {
    const { getByText } = render(<ClientListAdminScreen {...baseProps} />);
    expect(getByText(/no clients found/i)).toBeTruthy();
  });

  it("renders client rows", () => {
    const clients = [makeListEntry({ clientId: "c1" }), makeListEntry({ clientId: "c2", name: "Bob" })];
    const { getByTestId } = render(<ClientListAdminScreen {...baseProps} clients={clients} />);
    expect(getByTestId("client-row-c1")).toBeTruthy();
    expect(getByTestId("client-row-c2")).toBeTruthy();
  });

  it("calls onSelectClient when row pressed", () => {
    const onSelectClient = jest.fn();
    const { getByTestId } = render(
      <ClientListAdminScreen {...baseProps} clients={[makeListEntry()]} onSelectClient={onSelectClient} />,
    );
    fireEvent.press(getByTestId("client-row-c1"));
    expect(onSelectClient).toHaveBeenCalledWith("c1");
  });

  it("calls onFilterChange when filter-active pressed", () => {
    const onFilterChange = jest.fn();
    const { getByTestId } = render(<ClientListAdminScreen {...baseProps} onFilterChange={onFilterChange} />);
    fireEvent.press(getByTestId("filter-active"));
    expect(onFilterChange).toHaveBeenCalledWith("active");
  });

  it("shows bulk-action-bar when selectedIds is non-empty", () => {
    const { getByTestId } = render(
      <ClientListAdminScreen
        {...baseProps}
        clients={[makeListEntry()]}
        selectedIds={["c1"]}
      />,
    );
    expect(getByTestId("bulk-action-bar")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<ClientListAdminScreen {...baseProps} loading={true} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(<ClientListAdminScreen {...baseProps} error="Server error" />);
    expect(getByText(/server error/i)).toBeTruthy();
  });

  it("calls onBack when back pressed", () => {
    const onBack = jest.fn();
    const { getAllByText } = render(<ClientListAdminScreen {...baseProps} onBack={onBack} />);
    fireEvent.press(getAllByText(/back/i)[0]);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// ClientDetailAdminScreen
// ---------------------------------------------------------------------------

describe("ClientDetailAdminScreen", () => {
  const detail = makeDetailAdmin();
  const baseProps = {
    loading: false,
    error: null,
    client: detail,
    activeTab: "history" as const,
    notesEditing: false,
    notesText: "Regular Friday client.",
    onTabChange: jest.fn(),
    onNotesChange: jest.fn(),
    onNotesSave: jest.fn(),
    onMerge: jest.fn(),
    onBlock: jest.fn(),
    onGdpr: jest.fn(),
    onDelete: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders testID", () => {
    const { getByTestId } = render(<ClientDetailAdminScreen {...baseProps} />);
    expect(getByTestId("client-detail-admin-screen")).toBeTruthy();
  });

  it("renders client header", () => {
    const { getByTestId } = render(<ClientDetailAdminScreen {...baseProps} />);
    expect(getByTestId("client-header")).toBeTruthy();
  });

  it("renders all 7 tabs", () => {
    const { getByTestId } = render(<ClientDetailAdminScreen {...baseProps} />);
    ["history", "preferences", "loyalty", "notes", "allergies", "gallery", "consents"].forEach((t) => {
      expect(getByTestId(`tab-${t}`)).toBeTruthy();
    });
  });

  it("renders booking history list on history tab", () => {
    const { getByTestId } = render(<ClientDetailAdminScreen {...baseProps} />);
    expect(getByTestId("booking-history-list")).toBeTruthy();
  });

  it("renders allergy chips on allergies tab", () => {
    const { getByTestId } = render(
      <ClientDetailAdminScreen {...baseProps} activeTab="allergies" />,
    );
    expect(getByTestId("allergy-chips")).toBeTruthy();
  });

  it("renders consent list on consents tab", () => {
    const { getByTestId } = render(
      <ClientDetailAdminScreen {...baseProps} activeTab="consents" />,
    );
    expect(getByTestId("consent-list")).toBeTruthy();
  });

  it("renders notes editor on notes tab when notesEditing=true", () => {
    const { getByTestId } = render(
      <ClientDetailAdminScreen
        {...baseProps}
        activeTab="notes"
        notesEditing={true}
      />,
    );
    expect(getByTestId("notes-editor")).toBeTruthy();
  });

  it("calls onMerge when merge button pressed", () => {
    const onMerge = jest.fn();
    const { getByText } = render(<ClientDetailAdminScreen {...baseProps} onMerge={onMerge} />);
    fireEvent.press(getByText("Merge"));
    expect(onMerge).toHaveBeenCalledTimes(1);
  });

  it("calls onBlock when block button pressed", () => {
    const onBlock = jest.fn();
    const { getByText } = render(<ClientDetailAdminScreen {...baseProps} onBlock={onBlock} />);
    fireEvent.press(getByText("Block"));
    expect(onBlock).toHaveBeenCalledTimes(1);
  });

  it("shows loading state", () => {
    const { getByText } = render(
      <ClientDetailAdminScreen {...baseProps} loading={true} client={null} />,
    );
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows empty state when client is null", () => {
    const { getByText } = render(
      <ClientDetailAdminScreen {...baseProps} client={null} />,
    );
    expect(getByText(/not found/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// MergeClientsScreen
// ---------------------------------------------------------------------------

describe("MergeClientsScreen", () => {
  const primary = makeMergeSummary("c1");
  const duplicate = makeMergeSummary("c2");
  const baseProps = {
    loading: false,
    error: null,
    primary,
    duplicate,
    reason: "",
    submitting: false,
    submitError: null,
    submitSuccess: false,
    onReasonChange: jest.fn(),
    onConfirm: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders testID", () => {
    const { getByTestId } = render(<MergeClientsScreen {...baseProps} />);
    expect(getByTestId("merge-clients-screen")).toBeTruthy();
  });

  it("renders comparison table", () => {
    const { getByTestId } = render(<MergeClientsScreen {...baseProps} />);
    expect(getByTestId("comparison-table")).toBeTruthy();
  });

  it("renders primary and duplicate col headers", () => {
    const { getByTestId } = render(<MergeClientsScreen {...baseProps} />);
    expect(getByTestId("primary-col")).toBeTruthy();
    expect(getByTestId("duplicate-col")).toBeTruthy();
  });

  it("renders reason input", () => {
    const { getByTestId } = render(<MergeClientsScreen {...baseProps} />);
    expect(getByTestId("reason-input")).toBeTruthy();
  });

  it("renders confirm button", () => {
    const { getByTestId } = render(<MergeClientsScreen {...baseProps} />);
    expect(getByTestId("confirm-btn")).toBeTruthy();
  });

  it("calls onConfirm when confirm pressed", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(<MergeClientsScreen {...baseProps} reason="dup" onConfirm={onConfirm} />);
    fireEvent.press(getByTestId("confirm-btn"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows success message", () => {
    const { getByText } = render(<MergeClientsScreen {...baseProps} submitSuccess={true} />);
    expect(getByText(/merged successfully/i)).toBeTruthy();
  });

  it("shows submit error", () => {
    const { getByText } = render(
      <MergeClientsScreen {...baseProps} submitError="Server error" />,
    );
    expect(getByText(/server error/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// BlockClientScreen
// ---------------------------------------------------------------------------

describe("BlockClientScreen", () => {
  const baseProps = {
    clientName: "Jane Doe",
    reason: "no_show" as const,
    durationDays: 30,
    submitting: false,
    error: null,
    success: false,
    onReasonChange: jest.fn(),
    onDurationChange: jest.fn(),
    onBlock: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders testID", () => {
    const { getByTestId } = render(<BlockClientScreen {...baseProps} />);
    expect(getByTestId("block-client-screen")).toBeTruthy();
  });

  it("renders reason selector", () => {
    const { getByTestId } = render(<BlockClientScreen {...baseProps} />);
    expect(getByTestId("reason-selector")).toBeTruthy();
  });

  it("renders reason options", () => {
    const { getByTestId } = render(<BlockClientScreen {...baseProps} />);
    expect(getByTestId("reason-noshow")).toBeTruthy();
  });

  it("renders duration selector", () => {
    const { getByTestId } = render(<BlockClientScreen {...baseProps} />);
    expect(getByTestId("duration-selector")).toBeTruthy();
  });

  it("renders block button", () => {
    const { getByTestId } = render(<BlockClientScreen {...baseProps} />);
    expect(getByTestId("block-btn")).toBeTruthy();
  });

  it("calls onBlock when block pressed", () => {
    const onBlock = jest.fn();
    const { getByTestId } = render(<BlockClientScreen {...baseProps} onBlock={onBlock} />);
    fireEvent.press(getByTestId("block-btn"));
    expect(onBlock).toHaveBeenCalledTimes(1);
  });

  it("shows success message", () => {
    const { getByText } = render(<BlockClientScreen {...baseProps} success={true} />);
    expect(getByText(/blocked successfully/i)).toBeTruthy();
  });

  it("calls onReasonChange when reason option pressed", () => {
    const onReasonChange = jest.fn();
    const { getByText } = render(<BlockClientScreen {...baseProps} onReasonChange={onReasonChange} />);
    fireEvent.press(getByText("Harassment"));
    expect(onReasonChange).toHaveBeenCalledWith("harassment");
  });
});

// ---------------------------------------------------------------------------
// SegmentBuilderScreen
// ---------------------------------------------------------------------------

describe("SegmentBuilderScreen", () => {
  const baseProps = {
    segmentName: "",
    filters: [] as SegmentFilter[],
    preview: null,
    previewing: false,
    saving: false,
    error: null,
    onNameChange: jest.fn(),
    onAddFilter: jest.fn(),
    onRemoveFilter: jest.fn(),
    onUpdateFilter: jest.fn(),
    onPreview: jest.fn(),
    onSave: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders testID", () => {
    const { getByTestId } = render(<SegmentBuilderScreen {...baseProps} />);
    expect(getByTestId("segment-builder-screen")).toBeTruthy();
  });

  it("renders name input", () => {
    const { getByTestId } = render(<SegmentBuilderScreen {...baseProps} />);
    expect(getByTestId("segment-name-input")).toBeTruthy();
  });

  it("renders filter canvas", () => {
    const { getByTestId } = render(<SegmentBuilderScreen {...baseProps} />);
    expect(getByTestId("filter-canvas")).toBeTruthy();
  });

  it("renders add-filter button", () => {
    const { getByTestId } = render(<SegmentBuilderScreen {...baseProps} />);
    expect(getByTestId("add-filter-btn")).toBeTruthy();
  });

  it("renders preview and save buttons", () => {
    const { getByTestId } = render(<SegmentBuilderScreen {...baseProps} />);
    expect(getByTestId("preview-btn")).toBeTruthy();
    expect(getByTestId("save-btn")).toBeTruthy();
  });

  it("calls onAddFilter when add-filter pressed", () => {
    const onAddFilter = jest.fn();
    const { getByTestId } = render(<SegmentBuilderScreen {...baseProps} onAddFilter={onAddFilter} />);
    fireEvent.press(getByTestId("add-filter-btn"));
    expect(onAddFilter).toHaveBeenCalledTimes(1);
  });

  it("calls onPreview when preview pressed", () => {
    const onPreview = jest.fn();
    const { getByTestId } = render(<SegmentBuilderScreen {...baseProps} onPreview={onPreview} />);
    fireEvent.press(getByTestId("preview-btn"));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it("shows estimated count badge when preview available", () => {
    const { getByTestId } = render(
      <SegmentBuilderScreen {...baseProps} preview={makeSegmentPreview()} />,
    );
    expect(getByTestId("estimated-count")).toBeTruthy();
  });

  it("shows previewing (loading) state", () => {
    const { getByText } = render(<SegmentBuilderScreen {...baseProps} previewing={true} />);
    expect(getByText(/estimating/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// TargetedMessageScreen
// ---------------------------------------------------------------------------

describe("TargetedMessageScreen", () => {
  const baseProps = {
    segmentName: "High-value churned",
    recipientCount: 42,
    channel: "push" as const,
    subject: "",
    body: "",
    scheduledAt: null,
    sending: false,
    error: null,
    success: false,
    onChannelChange: jest.fn(),
    onSubjectChange: jest.fn(),
    onBodyChange: jest.fn(),
    onScheduleChange: jest.fn(),
    onSend: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders testID", () => {
    const { getByTestId } = render(<TargetedMessageScreen {...baseProps} />);
    expect(getByTestId("targeted-message-screen")).toBeTruthy();
  });

  it("renders segment name", () => {
    const { getByText } = render(<TargetedMessageScreen {...baseProps} />);
    expect(getByText("High-value churned")).toBeTruthy();
  });

  it("renders channel selector", () => {
    const { getByTestId } = render(<TargetedMessageScreen {...baseProps} />);
    expect(getByTestId("channel-push")).toBeTruthy();
    expect(getByTestId("channel-sms")).toBeTruthy();
    expect(getByTestId("channel-email")).toBeTruthy();
  });

  it("renders body input", () => {
    const { getByTestId } = render(<TargetedMessageScreen {...baseProps} />);
    expect(getByTestId("body-input")).toBeTruthy();
  });

  it("renders send button", () => {
    const { getByTestId } = render(<TargetedMessageScreen {...baseProps} />);
    expect(getByTestId("send-btn")).toBeTruthy();
  });

  it("calls onSend when send pressed", () => {
    const onSend = jest.fn();
    const { getByTestId } = render(<TargetedMessageScreen {...baseProps} body="Hello!" onSend={onSend} />);
    fireEvent.press(getByTestId("send-btn"));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("shows success text when success=true", () => {
    const { getByText } = render(<TargetedMessageScreen {...baseProps} success={true} />);
    expect(getByText(/dispatched/i)).toBeTruthy();
  });

  it("shows subject input when channel is email", () => {
    const { getByTestId } = render(<TargetedMessageScreen {...baseProps} channel="email" />);
    expect(getByTestId("subject-input")).toBeTruthy();
  });

  it("calls onChannelChange when sms pressed", () => {
    const onChannelChange = jest.fn();
    const { getByTestId } = render(
      <TargetedMessageScreen {...baseProps} onChannelChange={onChannelChange} />,
    );
    fireEvent.press(getByTestId("channel-sms"));
    expect(onChannelChange).toHaveBeenCalledWith("sms");
  });
});

// ---------------------------------------------------------------------------
// GdprExportScreen
// ---------------------------------------------------------------------------

describe("GdprExportScreen", () => {
  const baseProps = {
    clientName: "Jane Doe",
    loading: false,
    error: null,
    exportType: "full" as const,
    format: "json" as const,
    previousRequests: [] as GdprExportRequest[],
    submitting: false,
    submitError: null,
    submitSuccess: false,
    onExportTypeChange: jest.fn(),
    onFormatChange: jest.fn(),
    onRequestExport: jest.fn(),
    onDeleteClient: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders testID", () => {
    const { getByTestId } = render(<GdprExportScreen {...baseProps} />);
    expect(getByTestId("gdpr-export-screen")).toBeTruthy();
  });

  it("renders export type options", () => {
    const { getByTestId } = render(<GdprExportScreen {...baseProps} />);
    expect(getByTestId("export-type-full")).toBeTruthy();
    expect(getByTestId("export-type-bookings")).toBeTruthy();
    expect(getByTestId("export-type-loyalty")).toBeTruthy();
  });

  it("renders format options", () => {
    const { getByTestId } = render(<GdprExportScreen {...baseProps} />);
    expect(getByTestId("format-json")).toBeTruthy();
    expect(getByTestId("format-csv")).toBeTruthy();
  });

  it("renders request export button", () => {
    const { getByTestId } = render(<GdprExportScreen {...baseProps} />);
    expect(getByTestId("request-export-btn")).toBeTruthy();
  });

  it("renders previous requests section", () => {
    const { getByTestId } = render(<GdprExportScreen {...baseProps} />);
    expect(getByTestId("previous-requests")).toBeTruthy();
  });

  it("renders delete client button", () => {
    const { getByTestId } = render(<GdprExportScreen {...baseProps} />);
    expect(getByTestId("delete-client-btn")).toBeTruthy();
  });

  it("calls onRequestExport when request export pressed", () => {
    const onRequestExport = jest.fn();
    const { getByTestId } = render(<GdprExportScreen {...baseProps} onRequestExport={onRequestExport} />);
    fireEvent.press(getByTestId("request-export-btn"));
    expect(onRequestExport).toHaveBeenCalledTimes(1);
  });

  it("calls onDeleteClient when delete pressed", () => {
    const onDeleteClient = jest.fn();
    const { getByTestId } = render(<GdprExportScreen {...baseProps} onDeleteClient={onDeleteClient} />);
    fireEvent.press(getByTestId("delete-client-btn"));
    expect(onDeleteClient).toHaveBeenCalledTimes(1);
  });

  it("shows submit success", () => {
    const { getByText } = render(<GdprExportScreen {...baseProps} submitSuccess={true} />);
    expect(getByText(/submitted/i)).toBeTruthy();
  });

  it("calls onExportTypeChange when bookings pressed", () => {
    const onExportTypeChange = jest.fn();
    const { getByTestId } = render(
      <GdprExportScreen {...baseProps} onExportTypeChange={onExportTypeChange} />,
    );
    fireEvent.press(getByTestId("export-type-bookings"));
    expect(onExportTypeChange).toHaveBeenCalledWith("bookings");
  });
});

// ---------------------------------------------------------------------------
// DeleteClientScreen
// ---------------------------------------------------------------------------

describe("DeleteClientScreen", () => {
  const baseProps = {
    clientName: "Jane Doe",
    reason: "",
    submitting: false,
    error: null,
    success: false,
    onReasonChange: jest.fn(),
    onDelete: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders testID", () => {
    const { getByTestId } = render(<DeleteClientScreen {...baseProps} />);
    expect(getByTestId("delete-client-screen")).toBeTruthy();
  });

  it("renders reason input", () => {
    const { getByTestId } = render(<DeleteClientScreen {...baseProps} />);
    expect(getByTestId("delete-reason-input")).toBeTruthy();
  });

  it("renders confirmation checkbox", () => {
    const { getByTestId } = render(<DeleteClientScreen {...baseProps} />);
    expect(getByTestId("delete-confirm-checkbox")).toBeTruthy();
  });

  it("renders submit button", () => {
    const { getByTestId } = render(<DeleteClientScreen {...baseProps} />);
    expect(getByTestId("delete-submit-btn")).toBeTruthy();
  });

  it("shows success message", () => {
    const { getByText } = render(<DeleteClientScreen {...baseProps} success={true} />);
    expect(getByText(/client deleted/i)).toBeTruthy();
  });

  it("shows error text", () => {
    const { getByText } = render(<DeleteClientScreen {...baseProps} error="Delete failed" />);
    expect(getByText(/delete failed/i)).toBeTruthy();
  });

  it("calls onReasonChange when text entered", () => {
    const onReasonChange = jest.fn();
    const { getByTestId } = render(<DeleteClientScreen {...baseProps} onReasonChange={onReasonChange} />);
    fireEvent.changeText(getByTestId("delete-reason-input"), "GDPR request");
    expect(onReasonChange).toHaveBeenCalledWith("GDPR request");
  });

  it("calls onDelete when submit pressed (after confirm checked)", () => {
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <DeleteClientScreen {...baseProps} reason="GDPR request" onDelete={onDelete} />,
    );
    // Check the confirmation checkbox first
    fireEvent.press(getByTestId("delete-confirm-checkbox"));
    // Now press submit
    fireEvent.press(getByTestId("delete-submit-btn"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// routes.ts — W44 routes (10 routes)
// ---------------------------------------------------------------------------

describe("W44 Client / CRM routes", () => {
  const W44_ROUTES = [
    { name: "ClientListAdmin", path: "/owner/clients" },
    { name: "ClientDetailAdmin", path: "/owner/clients/detail" },
    { name: "MergeClients", path: "/owner/clients/merge" },
    { name: "BlockClient", path: "/owner/clients/block" },
    { name: "GdprExport", path: "/owner/clients/gdpr" },
    { name: "DeleteClient", path: "/owner/clients/delete" },
    { name: "SegmentBuilder", path: "/owner/segments/new" },
    { name: "TargetedMessage", path: "/owner/segments/message" },
  ];

  W44_ROUTES.forEach(({ name, path }) => {
    it(`has route ${name} at ${path}`, () => {
      const route = ROUTES.find((r) => r.name === name);
      expect(route).toBeDefined();
      expect(route?.path).toBe(path);
    });

    it(`${name} is in group owner`, () => {
      const route = ROUTES.find((r) => r.name === name);
      expect(route?.group).toBe("owner");
    });

    it(`${name} has guard authenticated`, () => {
      const route = ROUTES.find((r) => r.name === name);
      expect(route?.guard).toBe("authenticated");
    });
  });
});
