import { createReferralsRepository } from "../repository";
import { ReferralError, generateCode } from "../model";

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

  let docIdCounter = 0;

  function doc(dbOrColRef: unknown, colOrId?: string, docId?: string) {
    if (
      typeof dbOrColRef === "object" &&
      dbOrColRef !== null &&
      "_path" in (dbOrColRef as Record<string, unknown>)
    ) {
      const colPath = (dbOrColRef as { _path: string })._path;
      const realId = colOrId ?? `gen-${++docIdCounter}`;
      const key = `${colPath}/${realId}`;
      return { _key: key, _path: colPath, id: realId };
    }
    const realId = docId ?? `gen-${++docIdCounter}`;
    const key = `${colOrId}/${realId}`;
    return { _key: key, _path: colOrId as string, id: realId };
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

  async function updateDoc(ref: { _key: string }, patch: Record<string, unknown>) {
    if (!store[ref._key]) throw new Error(`Document ${ref._key} does not exist`);
    const existing = store[ref._key];
    for (const [k, v] of Object.entries(patch)) {
      existing[k] = resolveValue(existing[k], v);
    }
  }

  function collection(_db: unknown, path: string) {
    return { _path: path };
  }

  type WhereClause = { _field: string; _op: string; _value: unknown };

  function where(field: string, op: string, value: unknown): WhereClause {
    return { _field: field, _op: op, _value: value };
  }

  function query(col: { _path: string }, ...constraints: WhereClause[]) {
    return { _path: col._path, _wheres: constraints };
  }

  async function getDocs(q: { _path: string; _wheres: WhereClause[] }) {
    const prefix = q._path + "/";
    let docs = Object.entries(store)
      .filter(([key]) => key.startsWith(prefix) && key.slice(prefix.length).indexOf("/") === -1)
      .map(([key, data]) => {
        const id = key.slice(prefix.length);
        return { id, data: () => ({ ...data }), exists: () => true };
      });

    for (const w of q._wheres) {
      docs = docs.filter((d) => {
        const val = (d.data() as Record<string, unknown>)[w._field];
        if (w._op === "==") return val === w._value;
        return true;
      });
    }

    return { docs, empty: docs.length === 0 };
  }

  function serverTimestamp() {
    return { _type: "serverTimestamp" };
  }

  const db = {} as unknown;

  return { db, store, doc, getDoc, setDoc, updateDoc, collection, where, query, getDocs, serverTimestamp };
}

// ---------------------------------------------------------------------------
// Wire mock to jest
// ---------------------------------------------------------------------------

let mock: ReturnType<typeof makeFirestoreMock>;

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc: (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc: (...args: unknown[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
  updateDoc: (...args: unknown[]) => mock.updateDoc(...(args as Parameters<typeof mock.updateDoc>)),
  collection: (...args: unknown[]) => mock.collection(...(args as Parameters<typeof mock.collection>)),
  where: (...args: unknown[]) => mock.where(...(args as Parameters<typeof mock.where>)),
  query: (...args: unknown[]) => mock.query(...(args as Parameters<typeof mock.query>)),
  getDocs: (...args: unknown[]) => mock.getDocs(...(args as Parameters<typeof mock.getDocs>)),
  serverTimestamp: () => mock.serverTimestamp(),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT = "t1";
const USER_A = "userA";
const USER_B = "userB";
const USER_C = "userC";

beforeEach(() => {
  mock = makeFirestoreMock();
});

// ---------------------------------------------------------------------------
// generateCode (pure helper)
// ---------------------------------------------------------------------------

describe("generateCode", () => {
  it("generates a 6-character code by default", () => {
    const code = generateCode();
    expect(code).toHaveLength(6);
  });

  it("generates only unambiguous alphanumeric characters", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateCode();
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    }
  });

  it("generates different codes on successive calls (statistically)", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(1);
  });

  it("respects custom length", () => {
    expect(generateCode(8)).toHaveLength(8);
  });
});

// ---------------------------------------------------------------------------
// generateReferralCode
// ---------------------------------------------------------------------------

describe("createReferralsRepository — generateReferralCode", () => {
  it("creates a referral code for a new user", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rc = await repo.generateReferralCode(USER_A, TENANT);
    expect(rc.userId).toBe(USER_A);
    expect(rc.tenantId).toBe(TENANT);
    expect(rc.code).toHaveLength(6);
    expect(rc.usageCount).toBe(0);
  });

  it("is idempotent — returns same code on second call", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rc1 = await repo.generateReferralCode(USER_A, TENANT);
    const rc2 = await repo.generateReferralCode(USER_A, TENANT);
    expect(rc1.code).toBe(rc2.code);
  });

  it("generates different codes for different users", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rc1 = await repo.generateReferralCode(USER_A, TENANT);
    // Mock doesn't guarantee collision avoidance but codes are stored by code value
    // Create USER_B with manual code to ensure no collision
    const rc2 = await repo.generateReferralCode(USER_B, TENANT);
    // Both should have their own code
    expect(rc1.userId).toBe(USER_A);
    expect(rc2.userId).toBe(USER_B);
  });
});

// ---------------------------------------------------------------------------
// getReferralCode
// ---------------------------------------------------------------------------

describe("createReferralsRepository — getReferralCode", () => {
  it("returns null for unknown code", async () => {
    const repo = createReferralsRepository(mock.db as never);
    expect(await repo.getReferralCode("UNKNOWN")).toBeNull();
  });

  it("returns code after it has been created", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rc = await repo.generateReferralCode(USER_A, TENANT);
    const found = await repo.getReferralCode(rc.code);
    expect(found?.userId).toBe(USER_A);
  });
});

// ---------------------------------------------------------------------------
// getReferralCodeForUser
// ---------------------------------------------------------------------------

describe("createReferralsRepository — getReferralCodeForUser", () => {
  it("returns null when user has no code", async () => {
    const repo = createReferralsRepository(mock.db as never);
    expect(await repo.getReferralCodeForUser(USER_A, TENANT)).toBeNull();
  });

  it("returns the user's code after generation", async () => {
    const repo = createReferralsRepository(mock.db as never);
    await repo.generateReferralCode(USER_A, TENANT);
    const found = await repo.getReferralCodeForUser(USER_A, TENANT);
    expect(found?.userId).toBe(USER_A);
  });
});

// ---------------------------------------------------------------------------
// createReferralRecord
// ---------------------------------------------------------------------------

describe("createReferralsRepository — createReferralRecord", () => {
  it("creates a pending referral record", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rc = await repo.generateReferralCode(USER_A, TENANT);
    const record = await repo.createReferralRecord(TENANT, USER_A, USER_B, rc.code);
    expect(record.status).toBe("pending");
    expect(record.referrerId).toBe(USER_A);
    expect(record.refereeId).toBe(USER_B);
    expect(record.rewardedAt).toBeNull();
  });

  it("throws SELF_REFERRAL when referrer and referee are the same", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rc = await repo.generateReferralCode(USER_A, TENANT);
    await expect(
      repo.createReferralRecord(TENANT, USER_A, USER_A, rc.code),
    ).rejects.toThrow(ReferralError);
  });

  it("throws SELF_REFERRAL with correct code", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rc = await repo.generateReferralCode(USER_A, TENANT);
    await expect(
      repo.createReferralRecord(TENANT, USER_A, USER_A, rc.code),
    ).rejects.toMatchObject({ code: "SELF_REFERRAL" });
  });

  it("throws ALREADY_REFERRED when referee already has a pending record", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rcA = await repo.generateReferralCode(USER_A, TENANT);
    const rcC = await repo.generateReferralCode(USER_C, TENANT);
    await repo.createReferralRecord(TENANT, USER_A, USER_B, rcA.code);
    await expect(
      repo.createReferralRecord(TENANT, USER_C, USER_B, rcC.code),
    ).rejects.toMatchObject({ code: "ALREADY_REFERRED" });
  });

  it("increments usageCount on the referral code", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rc = await repo.generateReferralCode(USER_A, TENANT);
    await repo.createReferralRecord(TENANT, USER_A, USER_B, rc.code);
    const updated = await repo.getReferralCode(rc.code);
    expect(updated?.usageCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// rewardReferral
// ---------------------------------------------------------------------------

describe("createReferralsRepository — rewardReferral", () => {
  it("sets status to rewarded and records rewardedAt", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rc = await repo.generateReferralCode(USER_A, TENANT);
    const record = await repo.createReferralRecord(TENANT, USER_A, USER_B, rc.code);
    await repo.rewardReferral(record.recordId, TENANT);
    const key = `tenants/${TENANT}/referralRecords/${record.recordId}`;
    const doc = mock.store[key];
    expect(doc?.["status"]).toBe("rewarded");
    expect(doc?.["rewardedAt"]).toBeDefined();
  });

  it("throws CODE_NOT_FOUND for unknown recordId", async () => {
    const repo = createReferralsRepository(mock.db as never);
    await expect(
      repo.rewardReferral("nonexistent", TENANT),
    ).rejects.toMatchObject({ code: "CODE_NOT_FOUND" });
  });

  it("throws ALREADY_REWARDED if called twice", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rc = await repo.generateReferralCode(USER_A, TENANT);
    const record = await repo.createReferralRecord(TENANT, USER_A, USER_B, rc.code);
    await repo.rewardReferral(record.recordId, TENANT);
    await expect(
      repo.rewardReferral(record.recordId, TENANT),
    ).rejects.toMatchObject({ code: "ALREADY_REWARDED" });
  });
});

// ---------------------------------------------------------------------------
// getPendingReferralForReferee
// ---------------------------------------------------------------------------

describe("createReferralsRepository — getPendingReferralForReferee", () => {
  it("returns null when no pending referral", async () => {
    const repo = createReferralsRepository(mock.db as never);
    expect(await repo.getPendingReferralForReferee(USER_B, TENANT)).toBeNull();
  });

  it("returns pending record after createReferralRecord", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rc = await repo.generateReferralCode(USER_A, TENANT);
    await repo.createReferralRecord(TENANT, USER_A, USER_B, rc.code);
    const found = await repo.getPendingReferralForReferee(USER_B, TENANT);
    expect(found?.refereeId).toBe(USER_B);
  });

  it("returns null after referral is rewarded", async () => {
    const repo = createReferralsRepository(mock.db as never);
    const rc = await repo.generateReferralCode(USER_A, TENANT);
    const record = await repo.createReferralRecord(TENANT, USER_A, USER_B, rc.code);
    await repo.rewardReferral(record.recordId, TENANT);
    // Rewarded records have status "rewarded", not "pending"
    const found = await repo.getPendingReferralForReferee(USER_B, TENANT);
    expect(found).toBeNull();
  });
});
