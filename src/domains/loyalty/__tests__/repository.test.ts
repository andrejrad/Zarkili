import { createLoyaltyRepository } from "../repository";
import { LoyaltyError, resolveCurrentTier, calculateCompletionScore } from "../model";
import type { TenantLoyaltyConfig, LoyaltyTier } from "../model";

// ---------------------------------------------------------------------------
// In-memory Firestore mock
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function resolveValue(existing: unknown, newVal: unknown): unknown {
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

  function collection(_db: unknown, path: string) {
    return { _path: path };
  }

  type WhereClause = { _field: string; _op: string; _value: unknown };
  type OrderByClause = { _orderByField: string; _dir: string };
  type LimitClause = { _limit: number };

  function where(field: string, op: string, value: unknown): WhereClause {
    return { _field: field, _op: op, _value: value };
  }

  function orderBy(field: string, dir = "asc"): OrderByClause {
    return { _orderByField: field, _dir: dir };
  }

  function limit(n: number): LimitClause {
    return { _limit: n };
  }

  type QueryRef = {
    _path: string;
    _wheres: WhereClause[];
    _orderBy: OrderByClause | null;
    _limit: number | null;
  };

  function query(col: { _path: string }, ...constraints: unknown[]): QueryRef {
    const wheres: WhereClause[] = [];
    let ob: OrderByClause | null = null;
    let lim: number | null = null;
    for (const c of constraints) {
      const clause = c as Record<string, unknown>;
      if ("_field" in clause) wheres.push(clause as WhereClause);
      else if ("_orderByField" in clause) ob = clause as OrderByClause;
      else if ("_limit" in clause) lim = (clause as LimitClause)._limit;
    }
    return { _path: col._path, _wheres: wheres, _orderBy: ob, _limit: lim };
  }

  async function getDocs(q: QueryRef) {
    const prefix = q._path + "/";
    let docs = Object.entries(store)
      .filter(([key]) => key.startsWith(prefix) && key.slice(prefix.length).indexOf("/") === -1)
      .map(([key, data]) => {
        const id = key.slice(prefix.length);
        return { id, _key: key, data: () => ({ ...data }), exists: () => true };
      });

    for (const w of q._wheres) {
      docs = docs.filter((d) => {
        const val = (d.data() as Record<string, unknown>)[w._field];
        if (w._op === "==") return val === w._value;
        if (w._op === "array-contains") return Array.isArray(val) && val.includes(w._value);
        return true;
      });
    }

    if (q._orderBy) {
      const { _orderByField: f, _dir: dir } = q._orderBy;
      docs = docs.sort((a, b) => {
        const av = (a.data() as Record<string, unknown>)[f];
        const bv = (b.data() as Record<string, unknown>)[f];
        const an = typeof av === "object" && av !== null ? (av as { seconds: number }).seconds : (av as number ?? 0);
        const bn = typeof bv === "object" && bv !== null ? (bv as { seconds: number }).seconds : (bv as number ?? 0);
        return dir === "desc" ? bn - an : an - bn;
      });
    }

    if (q._limit !== null) docs = docs.slice(0, q._limit);

    return { docs, empty: docs.length === 0 };
  }

  function serverTimestamp() {
    return { _type: "serverTimestamp" };
  }

  function writeBatch(_db: unknown) {
    const ops: Array<{ type: "set"; ref: { _key: string }; data: Record<string, unknown> }> = [];
    return {
      set(ref: { _key: string }, data: Record<string, unknown>) {
        ops.push({ type: "set", ref, data });
      },
      async commit() {
        for (const op of ops) {
          const resolved: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(op.data)) {
            resolved[k] = resolveValue(undefined, v);
          }
          store[op.ref._key] = resolved;
        }
      },
    };
  }

  const db = {} as unknown;

  return { db, store, doc, getDoc, setDoc, collection, where, orderBy, limit, query, getDocs, serverTimestamp, writeBatch };
}

// ---------------------------------------------------------------------------
// Wire mock to jest
// ---------------------------------------------------------------------------

let mock: ReturnType<typeof makeFirestoreMock>;

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc: (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc: (...args: unknown[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
  collection: (...args: unknown[]) => mock.collection(...(args as Parameters<typeof mock.collection>)),
  where: (...args: unknown[]) => mock.where(...(args as Parameters<typeof mock.where>)),
  orderBy: (...args: unknown[]) => mock.orderBy(...(args as Parameters<typeof mock.orderBy>)),
  limit: (n: number) => mock.limit(n),
  query: (...args: unknown[]) => mock.query(...(args as Parameters<typeof mock.query>)),
  getDocs: (...args: unknown[]) => mock.getDocs(...(args as Parameters<typeof mock.getDocs>)),
  serverTimestamp: () => mock.serverTimestamp(),
  writeBatch: (...args: unknown[]) => mock.writeBatch(...(args as Parameters<typeof mock.writeBatch>)),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT = "tenant1";
const USER_A = "userA";
const USER_B = "userB";

const TIERS: LoyaltyTier[] = [
  { tierId: "bronze", name: "Bronze", minPoints: 0, maxPoints: 499, benefits: [] },
  { tierId: "silver", name: "Silver", minPoints: 500, maxPoints: 999, benefits: [] },
  { tierId: "gold", name: "Gold", minPoints: 1000, maxPoints: null, benefits: [] },
];

const SAMPLE_CONFIG: TenantLoyaltyConfig = {
  tenantId: TENANT,
  enabled: true,
  pointsPerCurrencyUnit: 1,
  tiers: TIERS,
  redemptionOptions: [],
  pointsExpiryDays: null,
  createdAt: { seconds: 1000, nanoseconds: 0 } as never,
  updatedAt: { seconds: 1000, nanoseconds: 0 } as never,
};

beforeEach(() => {
  mock = makeFirestoreMock();
});

// ---------------------------------------------------------------------------
// resolveCurrentTier (pure function)
// ---------------------------------------------------------------------------

describe("resolveCurrentTier", () => {
  it("returns null when tiers is empty", () => {
    expect(resolveCurrentTier(500, [])).toBeNull();
  });

  it("returns lowest tier when points meet minimum", () => {
    expect(resolveCurrentTier(0, TIERS)).toBe("bronze");
  });

  it("returns silver at 500 points", () => {
    expect(resolveCurrentTier(500, TIERS)).toBe("silver");
  });

  it("returns gold at 1000 points", () => {
    expect(resolveCurrentTier(1000, TIERS)).toBe("gold");
  });

  it("returns gold for very high points (open-ended top tier)", () => {
    expect(resolveCurrentTier(99999, TIERS)).toBe("gold");
  });
});

// ---------------------------------------------------------------------------
// calculateCompletionScore (pure function)
// ---------------------------------------------------------------------------

describe("calculateCompletionScore", () => {
  it("returns 0 for all-pending", () => {
    expect(calculateCompletionScore({ a: "pending", b: "pending" }, 2)).toBe(0);
  });

  it("returns 100 when all steps completed", () => {
    expect(calculateCompletionScore({ a: "completed", b: "completed" }, 2)).toBe(100);
  });

  it("returns 50 when half completed", () => {
    expect(calculateCompletionScore({ a: "completed", b: "pending", c: "pending", d: "pending" }, 4)).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// getLoyaltyConfig / saveLoyaltyConfig
// ---------------------------------------------------------------------------

describe("createLoyaltyRepository — config", () => {
  it("returns null when no config exists", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    const result = await repo.getLoyaltyConfig(TENANT);
    expect(result).toBeNull();
  });

  it("saves and retrieves config", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.saveLoyaltyConfig(SAMPLE_CONFIG);
    const result = await repo.getLoyaltyConfig(TENANT);
    expect(result?.tenantId).toBe(TENANT);
    expect(result?.pointsPerCurrencyUnit).toBe(1);
    expect(result?.tiers).toHaveLength(3);
  });

  it("overwrites existing config on save", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.saveLoyaltyConfig(SAMPLE_CONFIG);
    await repo.saveLoyaltyConfig({ ...SAMPLE_CONFIG, pointsPerCurrencyUnit: 5 });
    const result = await repo.getLoyaltyConfig(TENANT);
    expect(result?.pointsPerCurrencyUnit).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// getCustomerLoyaltyState
// ---------------------------------------------------------------------------

describe("createLoyaltyRepository — getCustomerLoyaltyState", () => {
  it("returns null for new user", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    const result = await repo.getCustomerLoyaltyState(USER_A, TENANT);
    expect(result).toBeNull();
  });

  it("returns state after credit", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.creditPoints(USER_A, TENANT, 100, "test", "ref1", "key1");
    const state = await repo.getCustomerLoyaltyState(USER_A, TENANT);
    expect(state?.points).toBe(100);
    expect(state?.lifetimePoints).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// creditPoints
// ---------------------------------------------------------------------------

describe("createLoyaltyRepository — creditPoints", () => {
  it("creates a credit transaction", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    const tx = await repo.creditPoints(USER_A, TENANT, 200, "appointment", "booking1", "idem1");
    expect(tx.type).toBe("credit");
    expect(tx.points).toBe(200);
    expect(tx.reason).toBe("appointment");
    expect(tx.referenceId).toBe("booking1");
  });

  it("updates customer points and lifetimePoints", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.creditPoints(USER_A, TENANT, 100, "r1", "ref1", "k1");
    await repo.creditPoints(USER_A, TENANT, 150, "r2", "ref2", "k2");
    const state = await repo.getCustomerLoyaltyState(USER_A, TENANT);
    expect(state?.points).toBe(250);
    expect(state?.lifetimePoints).toBe(250);
  });

  it("resolves tier when config is present", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.saveLoyaltyConfig(SAMPLE_CONFIG);
    await repo.creditPoints(USER_A, TENANT, 600, "appointment", "b1", "k1");
    const state = await repo.getCustomerLoyaltyState(USER_A, TENANT);
    expect(state?.currentTierId).toBe("silver");
  });

  it("throws INVALID_POINTS for zero points", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await expect(
      repo.creditPoints(USER_A, TENANT, 0, "r", "ref", "k"),
    ).rejects.toThrow(LoyaltyError);
  });

  it("throws INVALID_POINTS for negative points", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await expect(
      repo.creditPoints(USER_A, TENANT, -50, "r", "ref", "k"),
    ).rejects.toThrow(LoyaltyError);
  });

  it("is idempotent — same key returns same tx", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    const tx1 = await repo.creditPoints(USER_A, TENANT, 100, "r", "ref", "same-key");
    const tx2 = await repo.creditPoints(USER_A, TENANT, 100, "r", "ref", "same-key");
    expect(tx1.txId).toBe(tx2.txId);
    const balance = await repo.getBalance(USER_A, TENANT);
    expect(balance).toBe(100); // only credited once
  });
});

// ---------------------------------------------------------------------------
// debitPoints
// ---------------------------------------------------------------------------

describe("createLoyaltyRepository — debitPoints", () => {
  it("deducts points from balance", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.creditPoints(USER_A, TENANT, 500, "earn", "b1", "k1");
    await repo.debitPoints(USER_A, TENANT, 200, "redeem", "r1", "k2");
    const balance = await repo.getBalance(USER_A, TENANT);
    expect(balance).toBe(300);
  });

  it("does not reduce lifetimePoints on debit", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.creditPoints(USER_A, TENANT, 500, "earn", "b1", "k1");
    await repo.debitPoints(USER_A, TENANT, 200, "redeem", "r1", "k2");
    const state = await repo.getCustomerLoyaltyState(USER_A, TENANT);
    expect(state?.lifetimePoints).toBe(500);
    expect(state?.points).toBe(300);
  });

  it("throws INSUFFICIENT_POINTS when balance is too low", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.creditPoints(USER_A, TENANT, 100, "earn", "b1", "k1");
    await expect(
      repo.debitPoints(USER_A, TENANT, 200, "redeem", "r1", "k2"),
    ).rejects.toThrow(LoyaltyError);
  });

  it("throws INSUFFICIENT_POINTS for user with no state", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await expect(
      repo.debitPoints(USER_A, TENANT, 50, "redeem", "r1", "k1"),
    ).rejects.toThrow(LoyaltyError);
  });

  it("is idempotent", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.creditPoints(USER_A, TENANT, 500, "earn", "b1", "k1");
    await repo.debitPoints(USER_A, TENANT, 100, "redeem", "r1", "debit-idem");
    await repo.debitPoints(USER_A, TENANT, 100, "redeem", "r1", "debit-idem");
    expect(await repo.getBalance(USER_A, TENANT)).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// getBalance
// ---------------------------------------------------------------------------

describe("createLoyaltyRepository — getBalance", () => {
  it("returns 0 for unknown user", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    expect(await repo.getBalance("nobody", TENANT)).toBe(0);
  });

  it("reflects current balance", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.creditPoints(USER_A, TENANT, 300, "earn", "b1", "k1");
    await repo.debitPoints(USER_A, TENANT, 50, "redeem", "r1", "k2");
    expect(await repo.getBalance(USER_A, TENANT)).toBe(250);
  });
});

// ---------------------------------------------------------------------------
// listTransactions
// ---------------------------------------------------------------------------

describe("createLoyaltyRepository — listTransactions", () => {
  it("returns empty array for new user", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    const txs = await repo.listTransactions(USER_A, TENANT);
    expect(txs).toHaveLength(0);
  });

  it("returns transactions for the correct user only", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.creditPoints(USER_A, TENANT, 100, "earn", "b1", "k1");
    await repo.creditPoints(USER_B, TENANT, 200, "earn", "b2", "k2");
    const txs = await repo.listTransactions(USER_A, TENANT);
    expect(txs).toHaveLength(1);
    expect(txs[0]?.userId).toBe(USER_A);
  });

  it("returns both credit and debit transactions", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.creditPoints(USER_A, TENANT, 500, "earn", "b1", "k1");
    await repo.debitPoints(USER_A, TENANT, 100, "redeem", "r1", "k2");
    const txs = await repo.listTransactions(USER_A, TENANT);
    expect(txs).toHaveLength(2);
    const types = txs.map((t) => t.type).sort();
    expect(types).toEqual(["credit", "debit"]);
  });

  it("respects pageLimit", async () => {
    const repo = createLoyaltyRepository(mock.db as never);
    await repo.creditPoints(USER_A, TENANT, 100, "earn", "b1", "k1");
    await repo.creditPoints(USER_A, TENANT, 100, "earn", "b2", "k2");
    await repo.creditPoints(USER_A, TENANT, 100, "earn", "b3", "k3");
    const txs = await repo.listTransactions(USER_A, TENANT, 2);
    expect(txs).toHaveLength(2);
  });
});
