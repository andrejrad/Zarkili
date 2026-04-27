import type { Timestamp } from "firebase/firestore";

import type { Subscription } from "../model";
import { createBillingRepository } from "../repository";

// ---------------------------------------------------------------------------
// Slim Firestore mock — singleton doc reads/writes + writeBatch
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

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const TENANT = "tenantX";

function ts(seconds: number): Timestamp {
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}

function sampleSubscription(): Subscription {
  return {
    tenantId: TENANT,
    stripeCustomerId: "cus_x",
    stripeSubscriptionId: "sub_x",
    planId: "professional",
    interval: "annual",
    status: "active",
    currentPeriodStart: ts(1_000_000),
    currentPeriodEnd: ts(2_000_000),
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    pastDueSince: null,
    lastEventId: null,
    createdAt: ts(1_000_000),
    updatedAt: ts(1_000_000),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createBillingRepository", () => {
  it("returns null when no subscription exists", async () => {
    const repo = createBillingRepository(mock.db as never);
    const result = await repo.getSubscription(TENANT);
    expect(result).toBeNull();
  });

  it("persists subscription and idempotency marker atomically", async () => {
    const repo = createBillingRepository(mock.db as never);
    const sub = sampleSubscription();
    await repo.saveSubscriptionWithIdempotency(sub, "evt_1");
    const stored = await repo.getSubscription(TENANT);
    expect(stored?.stripeSubscriptionId).toBe("sub_x");
    expect(stored?.planId).toBe("professional");
    expect(await repo.hasProcessedEvent(TENANT, "evt_1")).toBe(true);
  });

  it("hasProcessedEvent returns false for unknown event", async () => {
    const repo = createBillingRepository(mock.db as never);
    expect(await repo.hasProcessedEvent(TENANT, "evt_unknown")).toBe(false);
  });

  it("recordProcessedEvent marks event without touching subscription", async () => {
    const repo = createBillingRepository(mock.db as never);
    await repo.recordProcessedEvent(TENANT, "evt_noop");
    expect(await repo.hasProcessedEvent(TENANT, "evt_noop")).toBe(true);
    expect(await repo.getSubscription(TENANT)).toBeNull();
  });

  it("overwrites prior subscription on subsequent save", async () => {
    const repo = createBillingRepository(mock.db as never);
    await repo.saveSubscriptionWithIdempotency(sampleSubscription(), "evt_1");
    await repo.saveSubscriptionWithIdempotency(
      { ...sampleSubscription(), planId: "enterprise" },
      "evt_2",
    );
    const stored = await repo.getSubscription(TENANT);
    expect(stored?.planId).toBe("enterprise");
    expect(await repo.hasProcessedEvent(TENANT, "evt_1")).toBe(true);
    expect(await repo.hasProcessedEvent(TENANT, "evt_2")).toBe(true);
  });
});
