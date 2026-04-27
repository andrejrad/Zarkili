import { createSegmentRepository } from "../repository";
import {
  computeAtRiskSegment,
  computeInactiveSegment,
  computeNewCustomersSegment,
  computeHighValueSegment,
  subtractDays,
} from "../model";
import type { BookingSummary } from "../model";

// ---------------------------------------------------------------------------
// In-memory Firestore mock
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function resolveValue(_existing: unknown, newVal: unknown): unknown {
    if (newVal !== null && typeof newVal === "object" && "_type" in (newVal as Record<string, unknown>)) {
      const typed = newVal as { _type: string };
      if (typed._type === "serverTimestamp") return { seconds: 1000, nanoseconds: 0 };
    }
    return newVal;
  }

  function doc(_db: unknown, colOrId?: string, docId?: string) {
    const key = `${colOrId}/${docId}`;
    return { _key: key, _path: colOrId as string, id: docId as string };
  }

  async function getDoc(ref: { _key: string; id: string }) {
    const data = store[ref._key];
    return { exists: () => data !== undefined, data: () => (data ? { ...data } : null), id: ref.id };
  }

  async function setDoc(ref: { _key: string }, data: Record<string, unknown>, _opts?: unknown) {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) resolved[k] = resolveValue(undefined, v);
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

  function applyWhere(data: Record<string, unknown>, clause: WhereClause): boolean {
    const val = data[clause._field];
    if (clause._op === "==") return val === clause._value;
    return false;
  }

  async function getDocs(q: QueryRef) {
    const prefix = q._path + "/";
    const matches = Object.entries(store)
      .filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes("/"))
      .map(([key, data]) => ({ key, data }))
      .filter(({ data }) => q._wheres.every((w) => applyWhere(data, w)));

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

function makeRepo() { return createSegmentRepository(mock.db as never); }

const NOW = "2026-04-24";

// ---------------------------------------------------------------------------
// subtractDays
// ---------------------------------------------------------------------------

describe("subtractDays", () => {
  it("subtracts days correctly",               () => expect(subtractDays("2026-04-24", 30)).toBe("2026-03-25"));
  it("handles month boundary",                 () => expect(subtractDays("2026-03-01", 1)).toBe("2026-02-28"));
  it("returns same date for 0 days",           () => expect(subtractDays("2026-04-24", 0)).toBe("2026-04-24"));
});

// ---------------------------------------------------------------------------
// computeAtRiskSegment
// ---------------------------------------------------------------------------

describe("computeAtRiskSegment", () => {
  it("returns empty when no bookings",                () => expect(computeAtRiskSegment([], new Set(["u1"]), NOW, 30)).toEqual([]));
  it("excludes customer with recent completed booking", () => {
    const bookings: BookingSummary[] = [{ userId: "u1", date: NOW, amount: 100, status: "completed" }];
    expect(computeAtRiskSegment(bookings, new Set(["u1"]), NOW, 30)).toEqual([]);
  });
  it("includes customer with only old completed booking", () => {
    const bookings: BookingSummary[] = [{ userId: "u1", date: "2026-03-01", amount: 100, status: "completed" }];
    expect(computeAtRiskSegment(bookings, new Set(["u1"]), NOW, 30)).toContain("u1");
  });
  it("excludes non-consented customers",              () => {
    const bookings: BookingSummary[] = [{ userId: "u1", date: "2026-03-01", amount: 100, status: "completed" }];
    expect(computeAtRiskSegment(bookings, new Set<string>(), NOW, 30)).toEqual([]);
  });
  it("ignores cancelled bookings when checking recency", () => {
    const bookings: BookingSummary[] = [
      { userId: "u1", date: "2026-03-01", amount: 100, status: "completed" },
      { userId: "u1", date: NOW,          amount: 50,  status: "cancelled" },
    ];
    expect(computeAtRiskSegment(bookings, new Set(["u1"]), NOW, 30)).toContain("u1");
  });
});

// ---------------------------------------------------------------------------
// computeInactiveSegment
// ---------------------------------------------------------------------------

describe("computeInactiveSegment", () => {
  it("returns empty when no bookings",                 () => expect(computeInactiveSegment([], new Set(["u1"]), NOW, 60)).toEqual([]));
  it("excludes customer with any recent booking",      () => {
    const bookings: BookingSummary[] = [{ userId: "u1", date: NOW, amount: 0, status: "cancelled" }];
    expect(computeInactiveSegment(bookings, new Set(["u1"]), NOW, 60)).toEqual([]);
  });
  it("includes customer with no recent bookings",      () => {
    const bookings: BookingSummary[] = [{ userId: "u1", date: "2026-01-01", amount: 0, status: "completed" }];
    expect(computeInactiveSegment(bookings, new Set(["u1"]), NOW, 60)).toContain("u1");
  });
  it("excludes non-consented customers",               () => {
    const bookings: BookingSummary[] = [{ userId: "u1", date: "2026-01-01", amount: 0, status: "completed" }];
    expect(computeInactiveSegment(bookings, new Set<string>(), NOW, 60)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// computeNewCustomersSegment
// ---------------------------------------------------------------------------

describe("computeNewCustomersSegment", () => {
  it("returns empty when no bookings",                 () => expect(computeNewCustomersSegment([], new Set(["u1"]), NOW, 30)).toEqual([]));
  it("includes customer whose first booking is recent", () => {
    const bookings: BookingSummary[] = [{ userId: "u1", date: NOW, amount: 50, status: "completed" }];
    expect(computeNewCustomersSegment(bookings, new Set(["u1"]), NOW, 30)).toContain("u1");
  });
  it("excludes customer whose first booking is old",   () => {
    const bookings: BookingSummary[] = [
      { userId: "u1", date: "2025-01-01", amount: 50, status: "completed" },
      { userId: "u1", date: NOW,          amount: 50, status: "completed" },
    ];
    expect(computeNewCustomersSegment(bookings, new Set(["u1"]), NOW, 30)).toEqual([]);
  });
  it("ignores non-completed bookings",                 () => {
    const bookings: BookingSummary[] = [{ userId: "u1", date: NOW, amount: 0, status: "cancelled" }];
    expect(computeNewCustomersSegment(bookings, new Set(["u1"]), NOW, 30)).toEqual([]);
  });
  it("excludes non-consented customers",               () => {
    const bookings: BookingSummary[] = [{ userId: "u1", date: NOW, amount: 50, status: "completed" }];
    expect(computeNewCustomersSegment(bookings, new Set<string>(), NOW, 30)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// computeHighValueSegment
// ---------------------------------------------------------------------------

describe("computeHighValueSegment", () => {
  it("returns empty when no bookings",                 () => expect(computeHighValueSegment([], new Set(["u1"]), 500)).toEqual([]));
  it("includes customer above threshold",              () => {
    const bookings: BookingSummary[] = [
      { userId: "u1", date: "2026-01-01", amount: 300, status: "completed" },
      { userId: "u1", date: "2026-02-01", amount: 250, status: "completed" },
    ];
    expect(computeHighValueSegment(bookings, new Set(["u1"]), 500)).toContain("u1");
  });
  it("includes customer at exactly the threshold",     () => {
    const bookings: BookingSummary[] = [{ userId: "u1", date: "2026-01-01", amount: 500, status: "completed" }];
    expect(computeHighValueSegment(bookings, new Set(["u1"]), 500)).toContain("u1");
  });
  it("excludes customer below threshold",             () => {
    const bookings: BookingSummary[] = [{ userId: "u1", date: "2026-01-01", amount: 499, status: "completed" }];
    expect(computeHighValueSegment(bookings, new Set(["u1"]), 500)).toEqual([]);
  });
  it("ignores cancelled bookings in spend total",      () => {
    const bookings: BookingSummary[] = [
      { userId: "u1", date: "2026-01-01", amount: 600, status: "cancelled" },
    ];
    expect(computeHighValueSegment(bookings, new Set(["u1"]), 500)).toEqual([]);
  });
  it("excludes non-consented customers",               () => {
    const bookings: BookingSummary[] = [{ userId: "u1", date: "2026-01-01", amount: 1000, status: "completed" }];
    expect(computeHighValueSegment(bookings, new Set<string>(), 500)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// repository — consent management
// ---------------------------------------------------------------------------

describe("SegmentRepository — consent", () => {
  it("getConsent returns null when no record", async () => {
    expect(await makeRepo().getConsent("tenant-1", "user-1")).toBeNull();
  });

  it("setConsent stores opt-in, getConsent retrieves it", async () => {
    const repo = makeRepo();
    await repo.setConsent({ userId: "user-1", tenantId: "tenant-1", optedIn: true });
    const c = await repo.getConsent("tenant-1", "user-1");
    expect(c?.optedIn).toBe(true);
  });

  it("setConsent stores opt-out", async () => {
    const repo = makeRepo();
    await repo.setConsent({ userId: "user-1", tenantId: "tenant-1", optedIn: false });
    const c = await repo.getConsent("tenant-1", "user-1");
    expect(c?.optedIn).toBe(false);
  });

  it("getConsentedCustomerIds returns only opted-in users", async () => {
    const repo = makeRepo();
    await repo.setConsent({ userId: "user-1", tenantId: "tenant-1", optedIn: true });
    await repo.setConsent({ userId: "user-2", tenantId: "tenant-1", optedIn: false });
    const ids = await repo.getConsentedCustomerIds("tenant-1");
    expect(ids).toContain("user-1");
    expect(ids).not.toContain("user-2");
  });

  it("getConsentedCustomerIds is tenant-scoped", async () => {
    const repo = makeRepo();
    await repo.setConsent({ userId: "user-1", tenantId: "tenant-A", optedIn: true });
    const ids = await repo.getConsentedCustomerIds("tenant-B");
    expect(ids).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// repository — computeSegment
// ---------------------------------------------------------------------------

describe("SegmentRepository — computeSegment", () => {
  async function setup() {
    const repo = makeRepo();
    await repo.setConsent({ userId: "u1", tenantId: "t1", optedIn: true });
    await repo.setConsent({ userId: "u2", tenantId: "t1", optedIn: true });
    return repo;
  }

  const oldBooking: BookingSummary = { userId: "u1", date: "2026-01-01", amount: 100, status: "completed" };
  const recentBooking: BookingSummary = { userId: "u2", date: NOW, amount: 100, status: "completed" };

  it("returns SegmentResult with correct shape", async () => {
    const repo = await setup();
    const result = await repo.computeSegment("t1", "at_risk_30d", [oldBooking], NOW);
    expect(result.tenantId).toBe("t1");
    expect(result.segmentId).toBe("at_risk_30d");
    expect(result.count).toBe(result.customerIds.length);
    expect(typeof result.computedAt).toBe("string");
  });

  it("at_risk_30d only includes consented at-risk customers", async () => {
    const repo = await setup();
    const result = await repo.computeSegment("t1", "at_risk_30d", [oldBooking, recentBooking], NOW);
    expect(result.customerIds).toContain("u1");
    expect(result.customerIds).not.toContain("u2");
  });

  it("new_customers_30d identifies new customers", async () => {
    const repo = await setup();
    const result = await repo.computeSegment("t1", "new_customers_30d", [recentBooking], NOW);
    expect(result.customerIds).toContain("u2");
  });

  it("high_value uses 500 default threshold", async () => {
    const repo = await setup();
    const bigSpend: BookingSummary = { userId: "u1", date: "2026-01-01", amount: 600, status: "completed" };
    const result = await repo.computeSegment("t1", "high_value", [bigSpend], NOW);
    expect(result.customerIds).toContain("u1");
  });

  it("returns empty result when no consented users match", async () => {
    const repo = makeRepo(); // no consent records
    const result = await repo.computeSegment("t1", "at_risk_30d", [oldBooking], NOW);
    expect(result.count).toBe(0);
  });

  it("throws TENANT_REQUIRED when tenantId is empty", async () => {
    await expect(makeRepo().computeSegment("", "at_risk_30d", [])).rejects.toThrow("TENANT_REQUIRED");
  });
});
