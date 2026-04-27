import type { Timestamp } from "firebase/firestore";

import type { ConnectAccount } from "../model";
import { createConnectRepository } from "../repository";

// ---------------------------------------------------------------------------
// Slim Firestore mock (singleton + writeBatch + idempotency)
// ---------------------------------------------------------------------------

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
    const key = `${colPath}/${docId}`;
    return { _key: key, _path: colPath, id: docId };
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

const TENANT = "tenantR";
function ts(seconds: number): Timestamp {
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}

function sampleAccount(): ConnectAccount {
  return {
    tenantId: TENANT,
    stripeAccountId: "acct_r",
    accountType: "express",
    country: "US",
    status: "pending_verification",
    payoutsEnabled: false,
    chargesEnabled: false,
    detailsSubmitted: false,
    taxFormType: "w9",
    taxFormCapturedAt: ts(1_000_000),
    eligible1099K: false,
    lastPayoutFailureAt: null,
    lastPayoutFailureReason: null,
    restrictionReasons: [],
    lastEventId: null,
    createdAt: ts(1_000_000),
    updatedAt: ts(1_000_000),
  };
}

describe("createConnectRepository", () => {
  it("returns null when no account exists", async () => {
    const repo = createConnectRepository(mock.db as never);
    expect(await repo.getAccount(TENANT)).toBeNull();
  });

  it("saveAccount persists without idempotency record", async () => {
    const repo = createConnectRepository(mock.db as never);
    await repo.saveAccount(sampleAccount());
    const stored = await repo.getAccount(TENANT);
    expect(stored?.stripeAccountId).toBe("acct_r");
    expect(await repo.hasProcessedEvent(TENANT, "evt_anything")).toBe(false);
  });

  it("saveAccountWithIdempotency persists account + event id atomically", async () => {
    const repo = createConnectRepository(mock.db as never);
    const account = { ...sampleAccount(), status: "active" as const };
    await repo.saveAccountWithIdempotency(account, "evt_acc_1");
    expect((await repo.getAccount(TENANT))?.status).toBe("active");
    expect(await repo.hasProcessedEvent(TENANT, "evt_acc_1")).toBe(true);
  });

  it("recordProcessedEvent marks event without writing account", async () => {
    const repo = createConnectRepository(mock.db as never);
    await repo.recordProcessedEvent(TENANT, "evt_noop");
    expect(await repo.hasProcessedEvent(TENANT, "evt_noop")).toBe(true);
    expect(await repo.getAccount(TENANT)).toBeNull();
  });
});
