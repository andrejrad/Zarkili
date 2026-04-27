import type { Timestamp } from "firebase/firestore";

import type { Trial } from "../model";
import { createTrialRepository } from "../repository";

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function resolveValue(v: unknown): unknown {
    if (v !== null && typeof v === "object" && "_type" in (v as Record<string, unknown>)) {
      const t = v as { _type: string };
      if (t._type === "serverTimestamp") return { seconds: 9_999, nanoseconds: 0 };
    }
    return v;
  }

  function doc(_db: unknown, colPath: string, docId: string) {
    return { _key: `${colPath}/${docId}`, id: docId };
  }
  async function getDoc(ref: { _key: string; id: string }) {
    const data = store[ref._key];
    return {
      exists: () => data !== undefined,
      data: () => (data ? { ...data } : null),
      id: ref.id,
    };
  }
  async function setDoc(ref: { _key: string }, data: Record<string, unknown>) {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) resolved[k] = resolveValue(v);
    store[ref._key] = resolved;
  }
  function serverTimestamp() {
    return { _type: "serverTimestamp" };
  }
  function writeBatch() {
    const ops: Array<{ ref: { _key: string }; data: Record<string, unknown> }> = [];
    return {
      set(ref: { _key: string }, data: Record<string, unknown>) {
        ops.push({ ref, data });
      },
      async commit() {
        for (const op of ops) {
          const resolved: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(op.data)) resolved[k] = resolveValue(v);
          store[op.ref._key] = resolved;
        }
      },
    };
  }
  return { db: {} as unknown, store, doc, getDoc, setDoc, serverTimestamp, writeBatch };
}

let mock = makeFirestoreMock();

jest.mock("firebase/firestore", () => ({
  Timestamp: { now: () => ({ seconds: 9_999, nanoseconds: 0 }) },
  doc: (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc: (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc: (...args: unknown[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
  serverTimestamp: () => mock.serverTimestamp(),
  writeBatch: (...args: unknown[]) => mock.writeBatch(...(args as Parameters<typeof mock.writeBatch>)),
}));

beforeEach(() => {
  mock = makeFirestoreMock();
});

function ts(seconds: number): Timestamp {
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}

function sample(): Trial {
  return {
    tenantId: "tenant_a",
    status: "active",
    trialLengthDays: 14,
    startedAt: ts(1_000),
    endsAt: ts(1_000 + 14 * 86_400),
    expiredAt: null,
    upgradedAt: null,
    upgradeSubscriptionId: null,
    lastJobRunId: null,
    createdAt: ts(1_000),
    updatedAt: ts(1_000),
  };
}

describe("TrialRepository", () => {
  it("returns null for missing trial", async () => {
    const repo = createTrialRepository(mock.db as never);
    expect(await repo.getTrial("tenant_a")).toBeNull();
  });

  it("persists and reads trial under tenants/{tenantId}/trial/state", async () => {
    const repo = createTrialRepository(mock.db as never);
    await repo.saveTrial(sample());
    expect(Object.keys(mock.store)).toContain("tenants/tenant_a/trial/state");
    const got = await repo.getTrial("tenant_a");
    expect(got?.status).toBe("active");
  });

  it("saveTrialWithJobRun atomically writes trial + job-run marker", async () => {
    const repo = createTrialRepository(mock.db as never);
    const next: Trial = { ...sample(), status: "expiring_soon" };
    await repo.saveTrialWithJobRun(next, "run-2026-04-26");
    expect(Object.keys(mock.store).sort()).toEqual([
      "tenants/tenant_a/trial/state",
      "tenants/tenant_a/trialJobRuns/run-2026-04-26",
    ]);
    expect(await repo.hasJobRun("tenant_a", "run-2026-04-26")).toBe(true);
  });

  it("recordJobRun records run without changing trial", async () => {
    const repo = createTrialRepository(mock.db as never);
    await repo.recordJobRun("tenant_a", "run-x");
    expect(await repo.hasJobRun("tenant_a", "run-x")).toBe(true);
    expect(await repo.getTrial("tenant_a")).toBeNull();
  });
});
