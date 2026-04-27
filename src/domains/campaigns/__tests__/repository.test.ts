import { createCampaignRepository } from "../repository";
import { isValidTransition } from "../model";
import type { Campaign } from "../model";

// ---------------------------------------------------------------------------
// In-memory Firestore mock
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function resolveValue(v: unknown): unknown {
    if (v !== null && typeof v === "object" && "_type" in (v as Record<string, unknown>)) {
      return { seconds: 1000, nanoseconds: 0 };
    }
    return v;
  }

  function doc(_db: unknown, path?: string, id?: string) {
    return { _key: `${path}/${id}`, id: id as string };
  }

  async function getDoc(ref: { _key: string; id: string }) {
    const data = store[ref._key];
    return { exists: () => data !== undefined, data: () => (data ? { ...data } : null), id: ref.id };
  }

  async function setDoc(ref: { _key: string }, data: Record<string, unknown>) {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) resolved[k] = resolveValue(v);
    store[ref._key] = resolved;
  }

  async function updateDoc(ref: { _key: string }, data: Record<string, unknown>) {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) resolved[k] = resolveValue(v);
    store[ref._key] = { ...(store[ref._key] ?? {}), ...resolved };
  }

  function collection(_db: unknown, path: string) {
    return { _path: path };
  }

  type WhereClause = { _field: string; _op: string; _value: unknown };
  function where(field: string, op: string, value: unknown): WhereClause {
    return { _field: field, _op: op, _value: value };
  }

  function orderBy(field: string): { _orderBy: string } {
    return { _orderBy: field };
  }

  type QueryRef = { _path: string; _wheres: WhereClause[]; _orderBy?: string };
  function query(colRef: { _path: string }, ...clauses: unknown[]): QueryRef {
    const wheres = clauses.filter((c) => "_field" in (c as object)) as WhereClause[];
    const ob = clauses.find((c) => "_orderBy" in (c as object)) as { _orderBy: string } | undefined;
    return { _path: colRef._path, _wheres: wheres, _orderBy: ob?._orderBy };
  }

  function applyWhere(data: Record<string, unknown>, clause: WhereClause): boolean {
    const val = data[clause._field];
    if (clause._op === "==")  return val === clause._value;
    if (clause._op === "<=")  return typeof val === "string" && typeof clause._value === "string" && val <= clause._value;
    return false;
  }

  async function getDocs(q: QueryRef) {
    const prefix = q._path + "/";
    let matches = Object.entries(store)
      .filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes("/"))
      .map(([key, data]) => ({ key, data }))
      .filter(({ data }) => q._wheres.every((w) => applyWhere(data, w)));

    if (q._orderBy) {
      const field = q._orderBy;
      matches = matches.sort((a, b) => {
        const av = a.data[field] as string;
        const bv = b.data[field] as string;
        return av < bv ? -1 : av > bv ? 1 : 0;
      });
    }

    return {
      docs: matches.map(({ key, data }) => ({
        data: () => ({ ...data }),
        id: key.split("/").pop()!,
        exists: () => true,
      })),
    };
  }

  function serverTimestamp() { return { _type: "serverTimestamp" }; }

  return { db: {} as unknown, doc, getDoc, setDoc, updateDoc, collection, where, orderBy, query, getDocs, serverTimestamp };
}

let mock = makeFirestoreMock();

jest.mock("firebase/firestore", () => ({
  doc:             (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc:          (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc:          (...args: unknown[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
  updateDoc:       (...args: unknown[]) => mock.updateDoc(...(args as Parameters<typeof mock.updateDoc>)),
  collection:      (...args: unknown[]) => mock.collection(...(args as Parameters<typeof mock.collection>)),
  where:           (...args: unknown[]) => mock.where(...(args as Parameters<typeof mock.where>)),
  orderBy:         (...args: unknown[]) => mock.orderBy(...(args as Parameters<typeof mock.orderBy>)),
  query:           (...args: unknown[]) => mock.query(...(args as Parameters<typeof mock.query>)),
  getDocs:         (...args: unknown[]) => mock.getDocs(...(args as Parameters<typeof mock.getDocs>)),
  serverTimestamp: () => mock.serverTimestamp(),
}));

beforeEach(() => { mock = makeFirestoreMock(); });

function makeRepo() { return createCampaignRepository(mock.db as never); }

const DRAFT_INPUT: Omit<Campaign, "campaignId" | "createdAt" | "updatedAt" | "metrics"> = {
  tenantId: "tenant-1",
  name: "Re-engagement Q4",
  channel: "email",
  segmentId: "at_risk_30d",
  templateId: "tmpl-001",
  status: "draft",
  scheduledAt: "2026-05-01T10:00:00.000Z",
  requiredSubscriptionTier: "starter" as const,
  createdBy: "admin-user",
};

// ---------------------------------------------------------------------------
// isValidTransition (pure)
// ---------------------------------------------------------------------------

describe("isValidTransition", () => {
  it("draft → scheduled is valid",        () => expect(isValidTransition("draft",     "scheduled")).toBe(true));
  it("draft → sending is invalid",        () => expect(isValidTransition("draft",     "sending")).toBe(false));
  it("scheduled → sending is valid",      () => expect(isValidTransition("scheduled", "sending")).toBe(true));
  it("scheduled → paused is valid",       () => expect(isValidTransition("scheduled", "paused")).toBe(true));
  it("sending → completed is valid",      () => expect(isValidTransition("sending",   "completed")).toBe(true));
  it("completed → any is invalid",        () => expect(isValidTransition("completed", "cancelled")).toBe(false));
  it("cancelled → any is invalid",        () => expect(isValidTransition("cancelled", "draft")).toBe(false));
  it("paused → sending is valid",         () => expect(isValidTransition("paused",    "sending")).toBe(true));
});

// ---------------------------------------------------------------------------
// createCampaign
// ---------------------------------------------------------------------------

describe("CampaignRepository — createCampaign", () => {
  it("returns a campaign with a generated campaignId", async () => {
    const c = await makeRepo().createCampaign(DRAFT_INPUT);
    expect(c.campaignId).toBeTruthy();
    expect(c.name).toBe("Re-engagement Q4");
  });

  it("initialises metrics to zero", async () => {
    const c = await makeRepo().createCampaign(DRAFT_INPUT);
    expect(c.metrics.sent).toBe(0);
    expect(c.metrics.opened).toBe(0);
  });

  it("persists so getCampaign can retrieve it", async () => {
    const repo = makeRepo();
    const c = await repo.createCampaign(DRAFT_INPUT);
    const fetched = await repo.getCampaign("tenant-1", c.campaignId);
    expect(fetched?.campaignId).toBe(c.campaignId);
  });

  it("throws TENANT_REQUIRED when tenantId is empty", async () => {
    await expect(makeRepo().createCampaign({ ...DRAFT_INPUT, tenantId: "" })).rejects.toThrow("TENANT_REQUIRED");
  });
});

// ---------------------------------------------------------------------------
// getCampaign
// ---------------------------------------------------------------------------

describe("CampaignRepository — getCampaign", () => {
  it("returns null for unknown campaign", async () => {
    expect(await makeRepo().getCampaign("tenant-1", "nonexistent")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateCampaignStatus
// ---------------------------------------------------------------------------

describe("CampaignRepository — updateCampaignStatus", () => {
  it("transitions draft → scheduled", async () => {
    const repo = makeRepo();
    const c = await repo.createCampaign(DRAFT_INPUT);
    await repo.updateCampaignStatus("tenant-1", c.campaignId, "scheduled");
    const updated = await repo.getCampaign("tenant-1", c.campaignId);
    expect(updated?.status).toBe("scheduled");
  });

  it("throws INVALID_STATUS_TRANSITION for illegal transition", async () => {
    const repo = makeRepo();
    const c = await repo.createCampaign(DRAFT_INPUT);
    await expect(repo.updateCampaignStatus("tenant-1", c.campaignId, "sending"))
      .rejects.toThrow("INVALID_STATUS_TRANSITION");
  });

  it("throws CAMPAIGN_NOT_FOUND for unknown id", async () => {
    await expect(makeRepo().updateCampaignStatus("tenant-1", "bad-id", "scheduled"))
      .rejects.toThrow("CAMPAIGN_NOT_FOUND");
  });

  it("full pipeline: draft → scheduled → sending → completed", async () => {
    const repo = makeRepo();
    const c = await repo.createCampaign(DRAFT_INPUT);
    await repo.updateCampaignStatus("tenant-1", c.campaignId, "scheduled");
    await repo.updateCampaignStatus("tenant-1", c.campaignId, "sending");
    await repo.updateCampaignStatus("tenant-1", c.campaignId, "completed");
    const final = await repo.getCampaign("tenant-1", c.campaignId);
    expect(final?.status).toBe("completed");
  });
});

// ---------------------------------------------------------------------------
// getDueCampaigns
// ---------------------------------------------------------------------------

describe("CampaignRepository — getDueCampaigns", () => {
  it("returns empty when no scheduled campaigns", async () => {
    const result = await makeRepo().getDueCampaigns("tenant-1", "2026-05-01T12:00:00.000Z");
    expect(result).toEqual([]);
  });

  it("returns campaigns due at or before nowIso", async () => {
    const repo = makeRepo();
    const c = await repo.createCampaign(DRAFT_INPUT); // scheduledAt: 2026-05-01T10:00:00
    await repo.updateCampaignStatus("tenant-1", c.campaignId, "scheduled");
    const due = await repo.getDueCampaigns("tenant-1", "2026-05-01T12:00:00.000Z");
    expect(due.map((d) => d.campaignId)).toContain(c.campaignId);
  });

  it("does not return campaigns scheduled in the future", async () => {
    const repo = makeRepo();
    const c = await repo.createCampaign(DRAFT_INPUT); // scheduledAt: 2026-05-01T10:00:00
    await repo.updateCampaignStatus("tenant-1", c.campaignId, "scheduled");
    const due = await repo.getDueCampaigns("tenant-1", "2026-04-30T00:00:00.000Z");
    expect(due.map((d) => d.campaignId)).not.toContain(c.campaignId);
  });

  it("does not return draft campaigns", async () => {
    const repo = makeRepo();
    const c = await repo.createCampaign(DRAFT_INPUT);
    const due = await repo.getDueCampaigns("tenant-1", "2026-05-02T00:00:00.000Z");
    expect(due.map((d) => d.campaignId)).not.toContain(c.campaignId);
  });

  it("throws TENANT_REQUIRED for empty tenantId", async () => {
    await expect(makeRepo().getDueCampaigns("", "2026-05-01T00:00:00.000Z")).rejects.toThrow("TENANT_REQUIRED");
  });
});

// ---------------------------------------------------------------------------
// recordSendLog / getCampaignSendLogs
// ---------------------------------------------------------------------------

describe("CampaignRepository — send logs", () => {
  const LOG_INPUT = {
    campaignId: "cmp-999",
    tenantId: "tenant-1",
    userId: "user-1",
    status: "sent" as const,
    channel: "email" as const,
  };

  it("recordSendLog returns a log with generated logId", async () => {
    const log = await makeRepo().recordSendLog(LOG_INPUT);
    expect(log.logId).toBeTruthy();
    expect(log.userId).toBe("user-1");
  });

  it("getCampaignSendLogs returns all logs for a campaign", async () => {
    const repo = makeRepo();
    await repo.recordSendLog(LOG_INPUT);
    await repo.recordSendLog({ ...LOG_INPUT, userId: "user-2" });
    const logs = await repo.getCampaignSendLogs("tenant-1", "cmp-999");
    expect(logs).toHaveLength(2);
  });

  it("getCampaignSendLogs filters by campaignId", async () => {
    const repo = makeRepo();
    await repo.recordSendLog(LOG_INPUT);
    await repo.recordSendLog({ ...LOG_INPUT, campaignId: "cmp-other" });
    const logs = await repo.getCampaignSendLogs("tenant-1", "cmp-999");
    expect(logs).toHaveLength(1);
    expect(logs[0].campaignId).toBe("cmp-999");
  });

  it("getCampaignSendLogs returns empty when no logs", async () => {
    const logs = await makeRepo().getCampaignSendLogs("tenant-1", "nonexistent");
    expect(logs).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// markSendLogConverted (W11-DEBT-2)
// ---------------------------------------------------------------------------

describe("CampaignRepository — markSendLogConverted (W11-DEBT-2)", () => {
  const LOG_INPUT = {
    campaignId: "cmp-conv",
    tenantId: "tenant-1",
    userId: "user-1",
    status: "sent" as const,
    channel: "email" as const,
  };

  it("flips converted=true and stamps conversionRef", async () => {
    const repo = makeRepo();
    await repo.createCampaign({ ...DRAFT_INPUT, name: "Conv test" });
    const log = await repo.recordSendLog(LOG_INPUT);
    const updated = await repo.markSendLogConverted("tenant-1", log.logId, "booking-42");
    expect(updated.converted).toBe(true);
    expect(updated.conversionRef).toBe("booking-42");
  });

  it("persists the conversion (re-fetch reflects flag)", async () => {
    const repo = makeRepo();
    const log = await repo.recordSendLog(LOG_INPUT);
    await repo.markSendLogConverted("tenant-1", log.logId, "booking-42");
    const logs = await repo.getCampaignSendLogs("tenant-1", "cmp-conv");
    expect(logs[0].converted).toBe(true);
    expect(logs[0].conversionRef).toBe("booking-42");
  });

  it("increments the parent campaign's converted metric", async () => {
    const repo = makeRepo();
    const c = await repo.createCampaign({ ...DRAFT_INPUT, name: "Metric test" });
    const log = await repo.recordSendLog({ ...LOG_INPUT, campaignId: c.campaignId });
    await repo.markSendLogConverted("tenant-1", log.logId, "booking-1");
    const refreshed = await repo.getCampaign("tenant-1", c.campaignId);
    expect(refreshed?.metrics.converted).toBe(1);
  });

  it("is idempotent — second call does not double-count", async () => {
    const repo = makeRepo();
    const c = await repo.createCampaign({ ...DRAFT_INPUT, name: "Idempotent" });
    const log = await repo.recordSendLog({ ...LOG_INPUT, campaignId: c.campaignId });
    await repo.markSendLogConverted("tenant-1", log.logId, "booking-1");
    await repo.markSendLogConverted("tenant-1", log.logId, "booking-1");
    const refreshed = await repo.getCampaign("tenant-1", c.campaignId);
    expect(refreshed?.metrics.converted).toBe(1);
  });

  it("throws SEND_LOG_NOT_FOUND for unknown logId", async () => {
    await expect(
      makeRepo().markSendLogConverted("tenant-1", "nope", "booking-x"),
    ).rejects.toThrow("SEND_LOG_NOT_FOUND");
  });

  it("throws TENANT_REQUIRED for empty tenantId", async () => {
    await expect(
      makeRepo().markSendLogConverted("", "log-x", "booking-x"),
    ).rejects.toThrow("TENANT_REQUIRED");
  });
});
