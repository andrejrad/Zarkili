import { createOnboardingRepository } from "../repository";
import {
  ONBOARDING_STEPS,
  GO_LIVE_REQUIRED_STEPS,
  buildInitialStepStatuses,
  computeCompletionScore,
  deriveBlockers,
} from "../model";

// ---------------------------------------------------------------------------
// In-memory Firestore mock
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function resolveValue(_existing: unknown, newVal: unknown): unknown {
    if (newVal !== null && typeof newVal === "object" && "_type" in (newVal as Record<string, unknown>)) {
      const typed = newVal as { _type: string };
      if (typed._type === "serverTimestamp") {
        return { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
      }
    }
    return newVal;
  }

  function doc(dbOrColRef: unknown, colOrId?: string, docId?: string) {
    if (
      typeof dbOrColRef === "object" &&
      dbOrColRef !== null &&
      "_path" in (dbOrColRef as Record<string, unknown>)
    ) {
      const colPath = (dbOrColRef as { _path: string })._path;
      const realId = colOrId ?? "auto";
      const key = `${colPath}/${realId}`;
      return { _key: key, id: realId };
    }
    const realId = docId ?? "auto";
    const key = `${colOrId}/${realId}`;
    return { _key: key, id: realId };
  }

  function collection(_db: unknown, path: string) {
    return { _path: path };
  }

  function where(field: string, op: string, value: unknown) {
    return { _kind: "where", field, op, value };
  }

  function orderBy(field: string, dir: "asc" | "desc" = "asc") {
    return { _kind: "orderBy", field, dir };
  }

  function query(colRef: { _path: string }, ...constraints: Array<Record<string, unknown>>) {
    return { _path: colRef._path, constraints };
  }

  async function getDocs(input: { _path?: string; constraints?: Array<Record<string, unknown>> }) {
    const path: string = (input as { _path?: string })._path ?? "";
    const constraints = input.constraints ?? [];
    const docs = Object.entries(store)
      .filter(([key]) => {
        const idx = key.lastIndexOf("/");
        return idx > -1 && key.slice(0, idx) === path;
      })
      .map(([key, data]) => ({
        id: key.slice(key.lastIndexOf("/") + 1),
        data: () => ({ ...data }),
      }));

    const orderConstraint = constraints.find((c) => c._kind === "orderBy") as
      | { _kind: "orderBy"; field: string; dir: "asc" | "desc" }
      | undefined;
    if (orderConstraint) {
      const { field, dir } = orderConstraint;
      docs.sort((a, b) => {
        const av = (a.data() as Record<string, unknown>)[field];
        const bv = (b.data() as Record<string, unknown>)[field];
        const an = typeof av === "object" && av !== null && "seconds" in (av as Record<string, unknown>)
          ? (av as { seconds: number }).seconds
          : Number(av ?? 0);
        const bn = typeof bv === "object" && bv !== null && "seconds" in (bv as Record<string, unknown>)
          ? (bv as { seconds: number }).seconds
          : Number(bv ?? 0);
        return dir === "desc" ? bn - an : an - bn;
      });
    }

    return {
      empty: docs.length === 0,
      docs,
      forEach(cb: (d: { id: string; data: () => unknown }) => void) {
        docs.forEach(cb);
      },
    };
  }

  async function getDoc(ref: { _key: string; id: string }) {
    const data = store[ref._key];
    return {
      exists: () => data !== undefined,
      data: () => (data !== undefined ? { ...data } : null),
      id: ref.id,
    };
  }

  async function setDoc(ref: { _key: string }, data: Record<string, unknown>) {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      resolved[k] = resolveValue(undefined, v);
    }
    store[ref._key] = resolved;
  }

  function serverTimestamp() {
    return { _type: "serverTimestamp" };
  }

  const db = {} as unknown;

  return { db, store, doc, getDoc, setDoc, serverTimestamp, collection, where, orderBy, query, getDocs };
}

// ---------------------------------------------------------------------------
// Wire mock to jest
// ---------------------------------------------------------------------------

let mock: ReturnType<typeof makeFirestoreMock>;

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc: (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc: (...args: unknown[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
  serverTimestamp: () => mock.serverTimestamp(),
  collection: (...args: unknown[]) => mock.collection(...(args as Parameters<typeof mock.collection>)),
  where: (...args: unknown[]) => mock.where(...(args as Parameters<typeof mock.where>)),
  orderBy: (...args: unknown[]) => mock.orderBy(...(args as Parameters<typeof mock.orderBy>)),
  query: (...args: unknown[]) => mock.query(...(args as Parameters<typeof mock.query>)),
  getDocs: (...args: unknown[]) => mock.getDocs(...(args as Parameters<typeof mock.getDocs>)),
}));

const TENANT = "salon1";

beforeEach(() => {
  mock = makeFirestoreMock();
});

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe("buildInitialStepStatuses", () => {
  it("creates all 9 steps with pending status", () => {
    const statuses = buildInitialStepStatuses();
    expect(Object.keys(statuses)).toHaveLength(9);
    expect(Object.values(statuses).every((s) => s === "pending")).toBe(true);
  });
});

describe("computeCompletionScore", () => {
  it("returns 0 when no steps completed", () => {
    const statuses = buildInitialStepStatuses();
    expect(computeCompletionScore(statuses)).toBe(0);
  });

  it("returns 100 when all steps completed", () => {
    const statuses = Object.fromEntries(
      ONBOARDING_STEPS.map((s) => [s, "completed"]),
    ) as Record<typeof ONBOARDING_STEPS[number], "completed">;
    expect(computeCompletionScore(statuses)).toBe(100);
  });

  it("returns correct percentage for partial completion", () => {
    const statuses = buildInitialStepStatuses();
    statuses["ACCOUNT"] = "completed";
    statuses["BUSINESS_PROFILE"] = "completed";
    statuses["SERVICES"] = "completed";
    // 3 of 9 = 33%
    expect(computeCompletionScore(statuses)).toBe(33);
  });
});

describe("deriveBlockers", () => {
  it("returns all required steps as blockers when all pending", () => {
    const statuses = buildInitialStepStatuses();
    const blockers = deriveBlockers(statuses);
    expect(blockers).toHaveLength(GO_LIVE_REQUIRED_STEPS.length);
  });

  it("returns empty array when all required steps are completed", () => {
    const statuses = buildInitialStepStatuses();
    GO_LIVE_REQUIRED_STEPS.forEach((s) => { statuses[s] = "completed"; });
    expect(deriveBlockers(statuses)).toHaveLength(0);
  });

  it("only lists incomplete required steps", () => {
    const statuses = buildInitialStepStatuses();
    statuses["BUSINESS_PROFILE"] = "completed";
    const blockers = deriveBlockers(statuses);
    expect(blockers.map((b) => b.step)).not.toContain("BUSINESS_PROFILE");
    expect(blockers.map((b) => b.step)).toContain("SERVICES");
    expect(blockers.map((b) => b.step)).toContain("AVAILABILITY");
  });
});

// ---------------------------------------------------------------------------
// getOnboardingState
// ---------------------------------------------------------------------------

describe("createOnboardingRepository — getOnboardingState", () => {
  it("returns null before onboarding started", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    expect(await repo.getOnboardingState(TENANT)).toBeNull();
  });

  it("returns state after startOnboarding", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.startOnboarding(TENANT);
    const state = await repo.getOnboardingState(TENANT);
    expect(state?.tenantId).toBe(TENANT);
  });
});

// ---------------------------------------------------------------------------
// startOnboarding
// ---------------------------------------------------------------------------

describe("createOnboardingRepository — startOnboarding", () => {
  it("creates state with all steps pending", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    const state = await repo.startOnboarding(TENANT);
    expect(state.tenantId).toBe(TENANT);
    expect(Object.values(state.stepStatuses).every((s) => s === "pending")).toBe(true);
    expect(state.completionScore).toBe(0);
  });

  it("sets currentStep to first step", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    const state = await repo.startOnboarding(TENANT);
    expect(state.currentStep).toBe(ONBOARDING_STEPS[0]);
  });

  it("sets canGoLive to false initially", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    const state = await repo.startOnboarding(TENANT);
    expect(state.canGoLive).toBe(false);
  });

  it("includes go-live blockers initially", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    const state = await repo.startOnboarding(TENANT);
    expect(state.blockers.length).toBeGreaterThan(0);
  });

  it("is idempotent — returns existing state on second call", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    const s1 = await repo.startOnboarding(TENANT);
    const s2 = await repo.startOnboarding(TENANT);
    expect(s1.tenantId).toBe(s2.tenantId);
  });
});

// ---------------------------------------------------------------------------
// advanceStep
// ---------------------------------------------------------------------------

describe("createOnboardingRepository — advanceStep", () => {
  it("marks step as completed", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.startOnboarding(TENANT);
    const state = await repo.advanceStep(TENANT, "ACCOUNT", "completed");
    expect(state.stepStatuses["ACCOUNT"]).toBe("completed");
  });

  it("advances currentStep past completed step", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.startOnboarding(TENANT);
    const state = await repo.advanceStep(TENANT, "ACCOUNT", "completed");
    expect(state.currentStep).toBe("BUSINESS_PROFILE");
  });

  it("updates completion score after step completion", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.startOnboarding(TENANT);
    const state = await repo.advanceStep(TENANT, "ACCOUNT", "completed");
    expect(state.completionScore).toBeGreaterThan(0);
  });

  it("removes blocker for required step when completed", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.startOnboarding(TENANT);
    await repo.advanceStep(TENANT, "BUSINESS_PROFILE", "completed");
    const state = await repo.getOnboardingState(TENANT);
    const hasBlocker = state?.blockers.some((b) => b.step === "BUSINESS_PROFILE");
    expect(hasBlocker).toBe(false);
  });

  it("sets canGoLive when all required steps completed", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.startOnboarding(TENANT);
    await repo.advanceStep(TENANT, "BUSINESS_PROFILE", "completed");
    await repo.advanceStep(TENANT, "SERVICES", "completed");
    const state = await repo.advanceStep(TENANT, "AVAILABILITY", "completed");
    expect(state.canGoLive).toBe(true);
    expect(state.blockers).toHaveLength(0);
  });

  it("supports skip status", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.startOnboarding(TENANT);
    const state = await repo.advanceStep(TENANT, "MARKETPLACE_VISIBILITY", "skipped");
    expect(state.stepStatuses["MARKETPLACE_VISIBILITY"]).toBe("skipped");
  });

  it("creates state if wizard not yet started", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    const state = await repo.advanceStep(TENANT, "ACCOUNT", "completed");
    expect(state.stepStatuses["ACCOUNT"]).toBe("completed");
  });
});

// ---------------------------------------------------------------------------
// resetOnboarding
// ---------------------------------------------------------------------------

describe("createOnboardingRepository — resetOnboarding", () => {
  it("resets all steps to pending", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.advanceStep(TENANT, "ACCOUNT", "completed");
    await repo.resetOnboarding(TENANT);
    const state = await repo.getOnboardingState(TENANT);
    expect(state?.stepStatuses["ACCOUNT"]).toBe("pending");
  });

  it("resets canGoLive to false", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.advanceStep(TENANT, "BUSINESS_PROFILE", "completed");
    await repo.advanceStep(TENANT, "SERVICES", "completed");
    await repo.advanceStep(TENANT, "AVAILABILITY", "completed");
    await repo.resetOnboarding(TENANT);
    const state = await repo.getOnboardingState(TENANT);
    expect(state?.canGoLive).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// W15.1 — drafts (saveDraft / getDraft / listDrafts)
// ---------------------------------------------------------------------------

describe("createOnboardingRepository — drafts", () => {
  it("returns null for missing draft", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    expect(await repo.getDraft(TENANT, "BUSINESS_PROFILE")).toBeNull();
  });

  it("saves and reads back a draft with schema version", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    const draft = await repo.saveDraft(TENANT, "BUSINESS_PROFILE", {
      legalName: "Acme Salon",
      city: "Zagreb",
    });

    expect(draft.tenantId).toBe(TENANT);
    expect(draft.step).toBe("BUSINESS_PROFILE");
    expect(draft.schemaVersion).toBe(1);
    expect(draft.payload).toMatchObject({ legalName: "Acme Salon", city: "Zagreb" });

    const fetched = await repo.getDraft(TENANT, "BUSINESS_PROFILE");
    expect(fetched?.payload).toMatchObject({ legalName: "Acme Salon" });
  });

  it("overwrites an existing draft on second save", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.saveDraft(TENANT, "BUSINESS_PROFILE", { legalName: "Old" });
    await repo.saveDraft(TENANT, "BUSINESS_PROFILE", { legalName: "New" });
    const fetched = await repo.getDraft(TENANT, "BUSINESS_PROFILE");
    expect(fetched?.payload).toMatchObject({ legalName: "New" });
  });

  it("lists every saved draft for a tenant", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.saveDraft(TENANT, "ACCOUNT", { ownerEmail: "a@b.com" });
    await repo.saveDraft(TENANT, "BUSINESS_PROFILE", { legalName: "Acme" });
    await repo.saveDraft(TENANT, "SERVICES", { services: [{ name: "Cut" }] });

    const drafts = await repo.listDrafts(TENANT);
    expect(drafts).toHaveLength(3);
    const steps = drafts.map((d) => d.step).sort();
    expect(steps).toEqual(["ACCOUNT", "BUSINESS_PROFILE", "SERVICES"].sort());
  });

  it("scopes drafts by tenant", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.saveDraft("salon1", "ACCOUNT", { ownerEmail: "a@b.com" });
    await repo.saveDraft("salon2", "ACCOUNT", { ownerEmail: "c@d.com" });

    expect(await repo.listDrafts("salon1")).toHaveLength(1);
    expect(await repo.listDrafts("salon2")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// W15.2 — timeline (appendTimelineEvent / listTimeline)
// ---------------------------------------------------------------------------

describe("createOnboardingRepository — timeline", () => {
  it("appends an event and reads it back", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    const event = await repo.appendTimelineEvent({
      eventId: "evt-1",
      tenantId: TENANT,
      action: "extend_trial",
      actorUserId: "platform-1",
      actorRole: "platform_admin",
      reason: "Customer asked for more time",
      details: { daysAdded: 7 },
    });

    expect(event.eventId).toBe("evt-1");
    expect(event.action).toBe("extend_trial");

    const list = await repo.listTimeline(TENANT);
    expect(list).toHaveLength(1);
    expect(list[0]?.eventId).toBe("evt-1");
  });

  it("rejects duplicate eventId", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.appendTimelineEvent({
      eventId: "evt-dup",
      tenantId: TENANT,
      action: "reset_step",
      actorUserId: "u1",
      actorRole: "tenant_owner",
      reason: "fix",
      details: { step: "ACCOUNT" },
    });

    await expect(
      repo.appendTimelineEvent({
        eventId: "evt-dup",
        tenantId: TENANT,
        action: "reset_step",
        actorUserId: "u1",
        actorRole: "tenant_owner",
        reason: "fix again",
        details: { step: "ACCOUNT" },
      }),
    ).rejects.toThrow(/already exists/);
  });

  it("lists timeline events newest first", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    // Force distinct timestamps by mutating Date.now between writes.
    const realNow = Date.now;
    let n = 1_700_000_000_000;
    Date.now = () => (n += 1000);
    try {
      await repo.appendTimelineEvent({
        eventId: "evt-a",
        tenantId: TENANT,
        action: "reset_step",
        actorUserId: "u1",
        actorRole: "tenant_owner",
        reason: "first",
        details: {},
      });
      await repo.appendTimelineEvent({
        eventId: "evt-b",
        tenantId: TENANT,
        action: "reset_step",
        actorUserId: "u1",
        actorRole: "tenant_owner",
        reason: "second",
        details: {},
      });
    } finally {
      Date.now = realNow;
    }

    const list = await repo.listTimeline(TENANT);
    expect(list.map((e) => e.eventId)).toEqual(["evt-b", "evt-a"]);
  });

  it("scopes timeline by tenant", async () => {
    const repo = createOnboardingRepository(mock.db as never);
    await repo.appendTimelineEvent({
      eventId: "evt-1",
      tenantId: "salon1",
      action: "extend_trial",
      actorUserId: "u1",
      actorRole: "platform_admin",
      reason: "r",
      details: {},
    });
    await repo.appendTimelineEvent({
      eventId: "evt-2",
      tenantId: "salon2",
      action: "extend_trial",
      actorUserId: "u1",
      actorRole: "platform_admin",
      reason: "r",
      details: {},
    });

    expect(await repo.listTimeline("salon1")).toHaveLength(1);
    expect(await repo.listTimeline("salon2")).toHaveLength(1);
  });
});
