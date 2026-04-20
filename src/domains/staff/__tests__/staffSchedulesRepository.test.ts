import { createStaffSchedulesRepository } from "../staffSchedulesRepository";
import type { UpsertStaffScheduleTemplateInput } from "../staffSchedulesModel";

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  const serverTimestamp = () => ({ _type: "serverTimestamp" });

  function doc(_db: unknown, collectionPath: string, id: string) {
    const key = `${collectionPath}/${id}`;
    return { key, id, path: key };
  }

  async function getDoc(ref: { key: string; id: string }) {
    const data = store[ref.key];
    return { exists: () => data !== undefined, data: () => data ?? null, id: ref.id };
  }

  async function setDoc(ref: { key: string }, data: Record<string, unknown>) {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      resolved[k] = v && typeof v === "object" && "_type" in v ? { seconds: 0, nanoseconds: 0 } : v;
    }
    store[ref.key] = { ...(store[ref.key] ?? {}), ...resolved };
  }

  async function updateDoc(ref: { key: string }, patch: Record<string, unknown>) {
    if (!store[ref.key]) {
      throw new Error(`Document ${ref.key} does not exist`);
    }

    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      resolved[k] = v && typeof v === "object" && "_type" in v ? { seconds: 1, nanoseconds: 0 } : v;
    }
    store[ref.key] = { ...store[ref.key], ...resolved };
  }

  function collection(_db: unknown, col: string) {
    return { _col: col };
  }

  function where(field: string, op: string, value: unknown) {
    return { field, op, value };
  }

  function query(colRef: { _col: string }, ...filters: Array<{ field: string; op: string; value: unknown }>) {
    return { col: colRef._col, filters };
  }

  async function getDocs(q: { col: string; filters: Array<{ field: string; op: string; value: unknown }> }) {
    const docs = Object.entries(store)
      .filter(([key]) => key.startsWith(`${q.col}/`))
      .filter(([, data]) =>
        q.filters.every(({ field, op, value }) => {
          if (op === "==") {
            return (data as Record<string, unknown>)[field] === value;
          }

          return true;
        })
      )
      .map(([key, data]) => ({ id: key.split("/")[1], data: () => data }));

    return { empty: docs.length === 0, docs };
  }

  const db = {} as unknown;
  return { db, doc, getDoc, setDoc, updateDoc, collection, where, query, getDocs, serverTimestamp };
}

let mockFirestore: ReturnType<typeof makeFirestoreMock>;

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockFirestore.doc(...args as [unknown, string, string]),
  getDoc: (...args: unknown[]) => mockFirestore.getDoc(...args as [{ key: string; id: string }]),
  setDoc: (...args: unknown[]) => mockFirestore.setDoc(...args as [{ key: string }, Record<string, unknown>]),
  updateDoc: (...args: unknown[]) => mockFirestore.updateDoc(...args as [{ key: string }, Record<string, unknown>]),
  collection: (...args: unknown[]) => mockFirestore.collection(...args as [unknown, string]),
  where: (...args: unknown[]) => mockFirestore.where(...args as [string, string, unknown]),
  query: (...args: unknown[]) => mockFirestore.query(...args as [{ _col: string }, ...Array<{ field: string; op: string; value: unknown }>]),
  getDocs: (...args: unknown[]) => mockFirestore.getDocs(...args as [{ col: string; filters: Array<{ field: string; op: string; value: unknown }> }]),
  serverTimestamp: () => mockFirestore.serverTimestamp(),
}));

function makeInput(overrides: Partial<UpsertStaffScheduleTemplateInput> = {}): UpsertStaffScheduleTemplateInput {
  return {
    tenantId: "tenantA",
    staffId: "staffA",
    locationId: "locA",
    weekTemplate: {
      mon: [
        { start: "09:00", end: "12:00" },
        { start: "13:00", end: "17:00" },
      ],
      tue: [{ start: "10:00", end: "16:00" }],
    },
    exceptions: [],
    ...overrides,
  };
}

describe("StaffSchedulesRepository", () => {
  let repo: ReturnType<typeof createStaffSchedulesRepository>;

  beforeEach(() => {
    mockFirestore = makeFirestoreMock();
    repo = createStaffSchedulesRepository(mockFirestore.db as Parameters<typeof createStaffSchedulesRepository>[0]);
  });

  it("upserts and returns schedule template", async () => {
    const schedule = await repo.upsertScheduleTemplate(makeInput());

    expect(schedule.scheduleId).toBe("tenantA_staffA_locA");
    expect(schedule.weekTemplate.mon).toHaveLength(2);
  });

  it("gets schedule template by tenant, staff, and location", async () => {
    await repo.upsertScheduleTemplate(makeInput());

    const schedule = await repo.getScheduleTemplate("tenantA", "staffA", "locA");

    expect(schedule?.scheduleId).toBe("tenantA_staffA_locA");
  });

  it("rejects malformed time ranges", async () => {
    await expect(
      repo.upsertScheduleTemplate(
        makeInput({
          weekTemplate: {
            mon: [{ start: "09:90", end: "10:00" }],
          },
        })
      )
    ).rejects.toThrow("weekTemplate.mon[0].start is out of range");
  });

  it("rejects overlapping week template ranges", async () => {
    await expect(
      repo.upsertScheduleTemplate(
        makeInput({
          weekTemplate: {
            mon: [
              { start: "09:00", end: "12:00" },
              { start: "11:30", end: "13:00" },
            ],
          },
        })
      )
    ).rejects.toThrow("weekTemplate.mon contains overlapping ranges");
  });

  it("rejects overlapping exception ranges", async () => {
    await expect(
      repo.upsertScheduleTemplate(
        makeInput({
          exceptions: [
            {
              date: "2026-06-10",
              blocks: [
                { start: "08:00", end: "10:00" },
                { start: "09:30", end: "11:00" },
              ],
              isClosed: false,
              note: null,
            },
          ],
        })
      )
    ).rejects.toThrow("exceptions[0].blocks contains overlapping ranges");
  });

  it("adds and removes exceptions", async () => {
    await repo.upsertScheduleTemplate(makeInput());

    await repo.addException("tenantA_staffA_locA", {
      date: "2026-06-11",
      blocks: [{ start: "09:00", end: "11:00" }],
      isClosed: false,
      note: "late opening",
    });

    let schedule = await repo.getScheduleTemplate("tenantA", "staffA", "locA");
    expect(schedule?.exceptions).toHaveLength(1);

    await repo.removeException("tenantA_staffA_locA", "2026-06-11");

    schedule = await repo.getScheduleTemplate("tenantA", "staffA", "locA");
    expect(schedule?.exceptions).toHaveLength(0);
  });
});
