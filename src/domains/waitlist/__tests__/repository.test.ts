import { createWaitlistRepository } from "../repository";
import { WaitlistError, validateWaitlistDates } from "../model";
import type { JoinWaitlistInput } from "../model";

// ---------------------------------------------------------------------------
// In-memory Firestore mock
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function resolveValue(existing: unknown, newVal: unknown): unknown {
    if (
      newVal !== null &&
      typeof newVal === "object" &&
      "_type" in (newVal as Record<string, unknown>)
    ) {
      const typed = newVal as { _type: string };
      if (typed._type === "serverTimestamp") {
        return { seconds: Date.now() / 1000, nanoseconds: 0 };
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
      // Called as doc(collectionRef) or doc(collectionRef, id)
      const colPath = (dbOrColRef as { _path: string })._path;
      const realId = colOrId ?? `gen-id-${++docIdCounter}`;
      const key = `${colPath}/${realId}`;
      return { _key: key, _col: colPath, id: realId };
    }
    // Called as doc(db, collectionPath, docId)
    const realId = docId ?? `gen-id-${++docIdCounter}`;
    const key = `${colOrId}/${realId}`;
    return { _key: key, _col: colOrId, id: realId };
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

  // Minimal query builder
  type WhereClause = { field: string; op: string; value: unknown };

  function collection(_db: unknown, path: string) {
    return { _path: path };
  }

  function query(col: { _path: string }, ...constraints: WhereClause[]) {
    return { _path: col._path, _wheres: constraints };
  }

  function where(field: string, op: string, value: unknown): WhereClause {
    return { field, op, value };
  }

  async function getDocs(q: { _path: string; _wheres?: WhereClause[] }) {
    const prefix = q._path + "/";
    let docs = Object.entries(store)
      .filter(([key]) => key.startsWith(prefix) && key.slice(prefix.length).indexOf("/") === -1)
      .map(([key, data]) => {
        const id = key.slice(prefix.length);
        return { id, data: () => ({ ...data }), exists: () => true };
      });

    if (q._wheres) {
      for (const w of q._wheres) {
        docs = docs.filter((d) => {
          const val = (d.data() as Record<string, unknown>)[w.field];
          if (w.op === "==") return val === w.value;
          if (w.op === "array-contains") {
            return Array.isArray(val) && val.includes(w.value);
          }
          return true;
        });
      }
    }

    return { docs, empty: docs.length === 0 };
  }

  function serverTimestamp() {
    return { _type: "serverTimestamp" };
  }

  // Expose the internal store for test assertions
  function getStore() {
    return store;
  }

  return {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    getStore,
  };
}

// ---------------------------------------------------------------------------
// jest.mock must reference the live `mock` variable (set in beforeEach)
// ---------------------------------------------------------------------------

let mock: ReturnType<typeof makeFirestoreMock>;

jest.mock("firebase/firestore", () => ({
  doc: (...args: any[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc: (...args: any[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc: (...args: any[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
  updateDoc: (...args: any[]) => mock.updateDoc(...(args as Parameters<typeof mock.updateDoc>)),
  collection: (...args: any[]) => mock.collection(...(args as Parameters<typeof mock.collection>)),
  query: (...args: any[]) => mock.query(...(args as Parameters<typeof mock.query>)),
  where: (...args: any[]) => mock.where(...(args as Parameters<typeof mock.where>)),
  getDocs: (...args: any[]) => mock.getDocs(...(args as Parameters<typeof mock.getDocs>)),
  serverTimestamp: () => mock.serverTimestamp(),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  mock = makeFirestoreMock();
});

function makeInput(overrides: Partial<JoinWaitlistInput> = {}): JoinWaitlistInput {
  return {
    tenantId: "t1",
    locationId: "l1",
    userId: "u1",
    serviceId: "svc1",
    staffId: null,
    dateFrom: "2025-01-01",
    dateTo: "2025-01-31",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateWaitlistDates
// ---------------------------------------------------------------------------

describe("validateWaitlistDates", () => {
  it("does not throw when dateFrom <= dateTo", () => {
    expect(() => validateWaitlistDates("2025-01-01", "2025-01-31")).not.toThrow();
    expect(() => validateWaitlistDates("2025-01-01", "2025-01-01")).not.toThrow();
  });

  it("throws WaitlistError when dateFrom > dateTo", () => {
    expect(() => validateWaitlistDates("2025-02-01", "2025-01-01")).toThrow(WaitlistError);
    try {
      validateWaitlistDates("2025-02-01", "2025-01-01");
    } catch (e) {
      expect((e as WaitlistError).code).toBe("invalid-date-range");
    }
  });
});

// ---------------------------------------------------------------------------
// joinWaitlist
// ---------------------------------------------------------------------------

describe("joinWaitlist", () => {
  it("returns an entry ID", async () => {
    const repo = createWaitlistRepository(null as any);
    const id = await repo.joinWaitlist(makeInput());
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("stores the entry with status active", async () => {
    const repo = createWaitlistRepository(null as any);
    const id = await repo.joinWaitlist(makeInput({ tenantId: "t1" }));
    const entry = mock.getStore()[`tenants/t1/waitlist/${id}`];
    expect(entry.status).toBe("active");
    expect(entry.userId).toBe("u1");
    expect(entry.serviceId).toBe("svc1");
    expect(entry.matchedSlotId).toBeNull();
    expect(entry.lastNotifiedAt).toBeNull();
  });

  it("stores staffId when provided", async () => {
    const repo = createWaitlistRepository(null as any);
    const id = await repo.joinWaitlist(makeInput({ staffId: "staff1" }));
    const entry = mock.getStore()[`tenants/t1/waitlist/${id}`];
    expect(entry.staffId).toBe("staff1");
  });

  it("throws WaitlistError(invalid-date-range) when dateFrom > dateTo", async () => {
    const repo = createWaitlistRepository(null as any);
    await expect(
      repo.joinWaitlist(makeInput({ dateFrom: "2025-02-01", dateTo: "2025-01-01" })),
    ).rejects.toThrow(WaitlistError);
  });

  it("throws WaitlistError(already-on-waitlist) for duplicate active entry", async () => {
    const repo = createWaitlistRepository(null as any);
    await repo.joinWaitlist(makeInput());
    await expect(repo.joinWaitlist(makeInput())).rejects.toThrow(WaitlistError);
    try {
      await repo.joinWaitlist(makeInput());
    } catch (e) {
      expect((e as WaitlistError).code).toBe("already-on-waitlist");
    }
  });

  it("allows join after the previous entry is cancelled", async () => {
    const repo = createWaitlistRepository(null as any);
    const id1 = await repo.joinWaitlist(makeInput());
    await repo.leaveWaitlist(id1, "t1", "u1");
    const id2 = await repo.joinWaitlist(makeInput());
    expect(id2).toBeTruthy();
    expect(id2).not.toBe(id1);
  });

  it("allows different service for same user", async () => {
    const repo = createWaitlistRepository(null as any);
    await repo.joinWaitlist(makeInput({ serviceId: "svc1" }));
    const id2 = await repo.joinWaitlist(makeInput({ serviceId: "svc2" }));
    expect(id2).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// leaveWaitlist
// ---------------------------------------------------------------------------

describe("leaveWaitlist", () => {
  it("sets entry status to cancelled", async () => {
    const repo = createWaitlistRepository(null as any);
    const id = await repo.joinWaitlist(makeInput());
    await repo.leaveWaitlist(id, "t1", "u1");
    const entry = mock.getStore()[`tenants/t1/waitlist/${id}`];
    expect(entry.status).toBe("cancelled");
  });

  it("throws WaitlistError(not-found) for non-existent entry", async () => {
    const repo = createWaitlistRepository(null as any);
    await expect(repo.leaveWaitlist("non-existent", "t1", "u1")).rejects.toThrow(WaitlistError);
    try {
      await repo.leaveWaitlist("non-existent", "t1", "u1");
    } catch (e) {
      expect((e as WaitlistError).code).toBe("not-found");
    }
  });
});

// ---------------------------------------------------------------------------
// listWaitlistByLocation
// ---------------------------------------------------------------------------

describe("listWaitlistByLocation", () => {
  it("returns empty array when no entries", async () => {
    const repo = createWaitlistRepository(null as any);
    const list = await repo.listWaitlistByLocation("t1", "l1");
    expect(list).toEqual([]);
  });

  it("returns active entries for the location", async () => {
    const repo = createWaitlistRepository(null as any);
    await repo.joinWaitlist(makeInput({ userId: "u1", locationId: "l1" }));
    await repo.joinWaitlist(makeInput({ userId: "u2", locationId: "l1", serviceId: "svc2" }));
    const list = await repo.listWaitlistByLocation("t1", "l1");
    expect(list.length).toBe(2);
    expect(list.every((e) => e.status === "active")).toBe(true);
  });

  it("excludes cancelled entries", async () => {
    const repo = createWaitlistRepository(null as any);
    const id = await repo.joinWaitlist(makeInput({ userId: "u1" }));
    await repo.joinWaitlist(makeInput({ userId: "u2", serviceId: "svc2" }));
    await repo.leaveWaitlist(id, "t1", "u1");
    const list = await repo.listWaitlistByLocation("t1", "l1");
    expect(list.length).toBe(1);
    expect(list[0].userId).toBe("u2");
  });

  it("excludes entries for a different location", async () => {
    const repo = createWaitlistRepository(null as any);
    await repo.joinWaitlist(makeInput({ locationId: "l1" }));
    await repo.joinWaitlist(makeInput({ userId: "u2", locationId: "l2" }));
    const list = await repo.listWaitlistByLocation("t1", "l1");
    expect(list.length).toBe(1);
    expect(list[0].locationId).toBe("l1");
  });
});

// ---------------------------------------------------------------------------
// findMatchingWaitlistEntries
// ---------------------------------------------------------------------------

describe("findMatchingWaitlistEntries", () => {
  it("returns empty array when no active entries", async () => {
    const repo = createWaitlistRepository(null as any);
    const candidates = await repo.findMatchingWaitlistEntries(
      "t1", "l1", "svc1", "staff1", "2025-01-15",
    );
    expect(candidates).toEqual([]);
  });

  it("returns matching candidate", async () => {
    const repo = createWaitlistRepository(null as any);
    await repo.joinWaitlist(makeInput({ dateFrom: "2025-01-01", dateTo: "2025-01-31" }));
    const candidates = await repo.findMatchingWaitlistEntries(
      "t1", "l1", "svc1", "staff1", "2025-01-15",
    );
    expect(candidates.length).toBe(1);
    expect(candidates[0].userId).toBe("u1");
  });

  it("excludes entries where date is before dateFrom", async () => {
    const repo = createWaitlistRepository(null as any);
    await repo.joinWaitlist(makeInput({ dateFrom: "2025-02-01", dateTo: "2025-02-28" }));
    const candidates = await repo.findMatchingWaitlistEntries(
      "t1", "l1", "svc1", "staff1", "2025-01-15",
    );
    expect(candidates).toEqual([]);
  });

  it("excludes entries where date is after dateTo", async () => {
    const repo = createWaitlistRepository(null as any);
    await repo.joinWaitlist(makeInput({ dateFrom: "2025-01-01", dateTo: "2025-01-10" }));
    const candidates = await repo.findMatchingWaitlistEntries(
      "t1", "l1", "svc1", "staff1", "2025-01-15",
    );
    expect(candidates).toEqual([]);
  });

  it("matches entries with staffId === null (any staff)", async () => {
    const repo = createWaitlistRepository(null as any);
    await repo.joinWaitlist(makeInput({ staffId: null }));
    const candidates = await repo.findMatchingWaitlistEntries(
      "t1", "l1", "svc1", "staff1", "2025-01-15",
    );
    expect(candidates.length).toBe(1);
  });

  it("matches entries with exact staffId", async () => {
    const repo = createWaitlistRepository(null as any);
    await repo.joinWaitlist(makeInput({ staffId: "staff1" }));
    const candidates = await repo.findMatchingWaitlistEntries(
      "t1", "l1", "svc1", "staff1", "2025-01-15",
    );
    expect(candidates.length).toBe(1);
  });

  it("excludes entries for a different staff member", async () => {
    const repo = createWaitlistRepository(null as any);
    await repo.joinWaitlist(makeInput({ staffId: "staff99" }));
    const candidates = await repo.findMatchingWaitlistEntries(
      "t1", "l1", "svc1", "staff1", "2025-01-15",
    );
    expect(candidates).toEqual([]);
  });

  it("excludes cancelled entries", async () => {
    const repo = createWaitlistRepository(null as any);
    const id = await repo.joinWaitlist(makeInput());
    await repo.leaveWaitlist(id, "t1", "u1");
    const candidates = await repo.findMatchingWaitlistEntries(
      "t1", "l1", "svc1", "staff1", "2025-01-15",
    );
    expect(candidates).toEqual([]);
  });

  it("returns lastNotifiedAt from entry", async () => {
    const repo = createWaitlistRepository(null as any);
    const id = await repo.joinWaitlist(makeInput());
    await repo.updateLastNotifiedAt(id, "t1", "2025-01-10T10:00:00Z");
    const candidates = await repo.findMatchingWaitlistEntries(
      "t1", "l1", "svc1", "staff1", "2025-01-15",
    );
    expect(candidates[0].lastNotifiedAt).toBe("2025-01-10T10:00:00Z");
  });
});

// ---------------------------------------------------------------------------
// markMatched
// ---------------------------------------------------------------------------

describe("markMatched", () => {
  it("sets entry status to matched with slotId", async () => {
    const repo = createWaitlistRepository(null as any);
    const id = await repo.joinWaitlist(makeInput());
    await repo.markMatched(id, "t1", "slot-abc");
    const entry = mock.getStore()[`tenants/t1/waitlist/${id}`];
    expect(entry.status).toBe("matched");
    expect(entry.matchedSlotId).toBe("slot-abc");
  });

  it("throws WaitlistError(not-found) for non-existent entry", async () => {
    const repo = createWaitlistRepository(null as any);
    await expect(repo.markMatched("nope", "t1", "slot-x")).rejects.toThrow(WaitlistError);
    try {
      await repo.markMatched("nope", "t1", "slot-x");
    } catch (e) {
      expect((e as WaitlistError).code).toBe("not-found");
    }
  });
});

// ---------------------------------------------------------------------------
// updateLastNotifiedAt
// ---------------------------------------------------------------------------

describe("updateLastNotifiedAt", () => {
  it("writes the ISO timestamp", async () => {
    const repo = createWaitlistRepository(null as any);
    const id = await repo.joinWaitlist(makeInput());
    await repo.updateLastNotifiedAt(id, "t1", "2025-01-15T08:00:00Z");
    const entry = mock.getStore()[`tenants/t1/waitlist/${id}`];
    expect(entry.lastNotifiedAt).toBe("2025-01-15T08:00:00Z");
  });
});
