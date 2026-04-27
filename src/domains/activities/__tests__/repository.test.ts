import { createActivityRepository } from "../repository";
import { isValidActivityTransition, isActivityCompleted } from "../model";
import type { Activity } from "../model";

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

  async function setDoc(ref: { _key: string }, data: Record<string, unknown>, _opts?: unknown) {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) resolved[k] = resolveValue(v);
    store[ref._key] = resolved;
  }

  function collection(_db: unknown, path: string) {
    return { _path: path };
  }

  type WhereClause = { _field: string; _op: string; _value: unknown };
  function where(field: string, op: string, value: unknown): WhereClause {
    return { _field: field, _op: op, _value: value };
  }

  type QueryRef = { _path: string; _wheres: WhereClause[] };
  function query(colRef: { _path: string }, ...clauses: unknown[]): QueryRef {
    const wheres = clauses.filter((c) => "_field" in (c as object)) as WhereClause[];
    return { _path: colRef._path, _wheres: wheres };
  }

  async function getDocs(q: QueryRef) {
    const prefix = q._path + "/";
    const matches = Object.entries(store)
      .filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes("/"))
      .map(([key, data]) => ({ key, data }));
    return {
      docs: matches.map(({ key, data }) => ({
        data: () => ({ ...data }),
        id: key.split("/").pop()!,
        exists: () => true,
      })),
    };
  }

  function serverTimestamp() { return { _type: "serverTimestamp" }; }

  return { db: {} as unknown, doc, getDoc, setDoc, collection, where, query, getDocs, serverTimestamp };
}

let mock = makeFirestoreMock();

jest.mock("firebase/firestore", () => ({
  doc:             (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc:          (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc:          (...args: unknown[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
  collection:      (...args: unknown[]) => mock.collection(...(args as Parameters<typeof mock.collection>)),
  where:           (...args: unknown[]) => mock.where(...(args as Parameters<typeof mock.where>)),
  query:           (...args: unknown[]) => mock.query(...(args as Parameters<typeof mock.query>)),
  getDocs:         (...args: unknown[]) => mock.getDocs(...(args as Parameters<typeof mock.getDocs>)),
  serverTimestamp: () => mock.serverTimestamp(),
}));

beforeEach(() => { mock = makeFirestoreMock(); });

function makeRepo() { return createActivityRepository(mock.db as never); }

const ACTIVITY_DRAFT: Omit<Activity, "activityId" | "createdAt" | "updatedAt"> = {
  tenantId: "tenant-1",
  type: "visit_streak",
  name: "Visit 3 times",
  status: "draft",
  startDate: "2026-05-01",
  endDate: "2026-07-31",
  rule: { type: "visit_streak", targetValue: 3 },
  reward: { type: "discount_percent", value: 15, description: "15% off next visit" },
  createdBy: "admin",
};

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

describe("isValidActivityTransition", () => {
  it("draft → active is valid",      () => expect(isValidActivityTransition("draft",    "active")).toBe(true));
  it("draft → expired is invalid",   () => expect(isValidActivityTransition("draft",    "expired")).toBe(false));
  it("active → inactive is valid",   () => expect(isValidActivityTransition("active",   "inactive")).toBe(true));
  it("active → expired is valid",    () => expect(isValidActivityTransition("active",   "expired")).toBe(true));
  it("inactive → active is valid",   () => expect(isValidActivityTransition("inactive", "active")).toBe(true));
  it("expired → any is invalid",     () => expect(isValidActivityTransition("expired",  "active")).toBe(false));
});

describe("isActivityCompleted", () => {
  const rule = { type: "visit_streak" as const, targetValue: 3 };
  it("returns true when progress meets target",  () => expect(isActivityCompleted({ progress: 3, completed: false }, rule)).toBe(true));
  it("returns true when progress exceeds target",() => expect(isActivityCompleted({ progress: 5, completed: false }, rule)).toBe(true));
  it("returns false below target",               () => expect(isActivityCompleted({ progress: 2, completed: false }, rule)).toBe(false));
  it("returns true when already marked completed",() => expect(isActivityCompleted({ progress: 0, completed: true }, rule)).toBe(true));
});

// ---------------------------------------------------------------------------
// createActivity
// ---------------------------------------------------------------------------

describe("ActivityRepository — createActivity", () => {
  it("returns an activity with a generated id", async () => {
    const a = await makeRepo().createActivity(ACTIVITY_DRAFT);
    expect(a.activityId).toBeTruthy();
    expect(a.name).toBe("Visit 3 times");
  });

  it("persists so getActivity retrieves it", async () => {
    const repo = makeRepo();
    const a = await repo.createActivity(ACTIVITY_DRAFT);
    const fetched = await repo.getActivity("tenant-1", a.activityId);
    expect(fetched?.activityId).toBe(a.activityId);
  });

  it("throws TENANT_REQUIRED for empty tenantId", async () => {
    await expect(makeRepo().createActivity({ ...ACTIVITY_DRAFT, tenantId: "" })).rejects.toThrow("TENANT_REQUIRED");
  });
});

// ---------------------------------------------------------------------------
// activateActivity / deactivateActivity
// ---------------------------------------------------------------------------

describe("ActivityRepository — status transitions", () => {
  it("activates a draft activity", async () => {
    const repo = makeRepo();
    const a = await repo.createActivity(ACTIVITY_DRAFT);
    await repo.activateActivity("tenant-1", a.activityId);
    const fetched = await repo.getActivity("tenant-1", a.activityId);
    expect(fetched?.status).toBe("active");
  });

  it("deactivates an active activity", async () => {
    const repo = makeRepo();
    const a = await repo.createActivity(ACTIVITY_DRAFT);
    await repo.activateActivity("tenant-1", a.activityId);
    await repo.deactivateActivity("tenant-1", a.activityId);
    const fetched = await repo.getActivity("tenant-1", a.activityId);
    expect(fetched?.status).toBe("inactive");
  });

  it("throws INVALID_STATUS_TRANSITION for illegal move", async () => {
    const repo = makeRepo();
    const a = await repo.createActivity(ACTIVITY_DRAFT);
    await expect(repo.updateActivityStatus("tenant-1", a.activityId, "expired"))
      .rejects.toThrow("INVALID_STATUS_TRANSITION");
  });

  it("throws ACTIVITY_NOT_FOUND for unknown id", async () => {
    await expect(makeRepo().activateActivity("tenant-1", "bad-id"))
      .rejects.toThrow("ACTIVITY_NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// recordParticipation
// ---------------------------------------------------------------------------

describe("ActivityRepository — recordParticipation", () => {
  async function activeActivity() {
    const repo = makeRepo();
    const a = await repo.createActivity(ACTIVITY_DRAFT);
    await repo.activateActivity("tenant-1", a.activityId);
    return { repo, a };
  }

  it("creates participation with progress 1", async () => {
    const { repo, a } = await activeActivity();
    const p = await repo.recordParticipation("tenant-1", a.activityId, "user-1", 1);
    expect(p.progress).toBe(1);
    expect(p.completed).toBe(false);
  });

  it("increments progress on subsequent call", async () => {
    const { repo, a } = await activeActivity();
    await repo.recordParticipation("tenant-1", a.activityId, "user-1", 1);
    const p = await repo.recordParticipation("tenant-1", a.activityId, "user-1", 1);
    expect(p.progress).toBe(2);
  });

  it("marks completed when target reached", async () => {
    const { repo, a } = await activeActivity();
    await repo.recordParticipation("tenant-1", a.activityId, "user-1", 3);
    const p = await repo.getParticipation("tenant-1", a.activityId, "user-1");
    expect(p?.completed).toBe(true);
  });

  it("throws ALREADY_COMPLETED when trying to re-participate", async () => {
    const { repo, a } = await activeActivity();
    await repo.recordParticipation("tenant-1", a.activityId, "user-1", 3);
    await expect(repo.recordParticipation("tenant-1", a.activityId, "user-1", 1))
      .rejects.toThrow("ALREADY_COMPLETED");
  });

  it("throws ACTIVITY_NOT_ACTIVE for draft activity", async () => {
    const repo = makeRepo();
    const a = await repo.createActivity(ACTIVITY_DRAFT);
    await expect(repo.recordParticipation("tenant-1", a.activityId, "user-1", 1))
      .rejects.toThrow("ACTIVITY_NOT_ACTIVE");
  });

  it("throws ACTIVITY_NOT_FOUND for unknown activity", async () => {
    await expect(makeRepo().recordParticipation("tenant-1", "bad-id", "user-1", 1))
      .rejects.toThrow("ACTIVITY_NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// checkCompletion
// ---------------------------------------------------------------------------

describe("ActivityRepository — checkCompletion", () => {
  it("returns false when no participation exists", async () => {
    const repo = makeRepo();
    const a = await repo.createActivity(ACTIVITY_DRAFT);
    expect(await repo.checkCompletion("tenant-1", a.activityId, "user-1")).toBe(false);
  });

  it("returns true after target is reached", async () => {
    const repo = makeRepo();
    const a = await repo.createActivity(ACTIVITY_DRAFT);
    await repo.activateActivity("tenant-1", a.activityId);
    await repo.recordParticipation("tenant-1", a.activityId, "user-1", 3);
    expect(await repo.checkCompletion("tenant-1", a.activityId, "user-1")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// awardReward
// ---------------------------------------------------------------------------

describe("ActivityRepository — awardReward", () => {
  it("sets rewardedAt on participation", async () => {
    const repo = makeRepo();
    const a = await repo.createActivity(ACTIVITY_DRAFT);
    await repo.activateActivity("tenant-1", a.activityId);
    await repo.recordParticipation("tenant-1", a.activityId, "user-1", 3);
    await repo.awardReward("tenant-1", a.activityId, "user-1", "2026-05-10T12:00:00Z");
    const p = await repo.getParticipation("tenant-1", a.activityId, "user-1");
    expect(p?.rewardedAt).toBe("2026-05-10T12:00:00Z");
  });

  it("throws ACTIVITY_NOT_FOUND when no participation exists", async () => {
    await expect(makeRepo().awardReward("tenant-1", "act-1", "user-1", "2026-05-10"))
      .rejects.toThrow("ACTIVITY_NOT_FOUND");
  });
});
