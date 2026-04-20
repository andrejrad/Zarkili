import { createStaffRepository } from "../repository";
import type { CreateStaffInput } from "../model";

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
    store[ref.key] = resolved;
  }

  async function updateDoc(ref: { key: string }, patch: Record<string, unknown>) {
    if (!store[ref.key]) throw new Error(`Document ${ref.key} does not exist`);
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
          const fieldValue = (data as Record<string, unknown>)[field];
          if (op === "==") {
            return fieldValue === value;
          }

          if (op === "array-contains") {
            return Array.isArray(fieldValue) && fieldValue.includes(value);
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

function makeInput(overrides: Partial<CreateStaffInput> = {}): CreateStaffInput {
  return {
    tenantId: "tenantA",
    locationIds: ["locA", "locB"],
    userId: "userA",
    displayName: "Ana Novak",
    role: "technician",
    status: "active",
    skills: ["nail-art", "gel"],
    serviceIds: ["svc1", "svc2"],
    constraints: [
      {
        key: "max_daily_bookings",
        value: 8,
      },
    ],
    ...overrides,
  };
}

describe("StaffRepository", () => {
  let repo: ReturnType<typeof createStaffRepository>;

  beforeEach(() => {
    mockFirestore = makeFirestoreMock();
    repo = createStaffRepository(mockFirestore.db as Parameters<typeof createStaffRepository>[0]);
  });

  describe("createStaff", () => {
    it("creates a staff member and returns it with staffId", async () => {
      const staff = await repo.createStaff("staff1", makeInput());
      expect(staff.staffId).toBe("staff1");
      expect(staff.tenantId).toBe("tenantA");
      expect(staff.displayName).toBe("Ana Novak");
    });

    it("rejects invalid role", async () => {
      await expect(repo.createStaff("staff1", makeInput({ role: "invalid" as never }))).rejects.toThrow(
        "role is invalid"
      );
    });

    it("rejects invalid serviceIds array", async () => {
      await expect(
        repo.createStaff("staff1", makeInput({ serviceIds: ["svc1", ""] }))
      ).rejects.toThrow("serviceIds contains invalid value");
    });
  });

  describe("updateStaff", () => {
    it("updates allowed fields", async () => {
      await repo.createStaff("staff1", makeInput());
      await repo.updateStaff("staff1", "tenantA", {
        displayName: "Ana Updated",
        serviceIds: ["svc2", "svc3"],
      });

      const staff = await repo.listLocationStaff("tenantA", "locA");
      expect(staff[0].displayName).toBe("Ana Updated");
      expect(staff[0].serviceIds).toEqual(["svc2", "svc3"]);
    });

    it("blocks cross-tenant update", async () => {
      await repo.createStaff("staff1", makeInput({ tenantId: "tenantA" }));
      await expect(repo.updateStaff("staff1", "tenantB", { displayName: "Hijack" })).rejects.toThrow(
        "Cross-tenant staff update is not allowed"
      );
    });
  });

  describe("listLocationStaff", () => {
    it("returns active staff for tenant and location", async () => {
      await repo.createStaff("staff1", makeInput({ tenantId: "tenantA", locationIds: ["locA"], status: "active" }));
      await repo.createStaff("staff2", makeInput({ tenantId: "tenantA", locationIds: ["locB"], status: "active" }));
      await repo.createStaff("staff3", makeInput({ tenantId: "tenantA", locationIds: ["locA"], status: "inactive" }));
      await repo.createStaff("staff4", makeInput({ tenantId: "tenantB", locationIds: ["locA"], status: "active" }));

      const staff = await repo.listLocationStaff("tenantA", "locA");

      expect(staff).toHaveLength(1);
      expect(staff[0].staffId).toBe("staff1");
    });
  });

  describe("listServiceQualifiedStaff", () => {
    it("returns staff qualified for service in specific location", async () => {
      await repo.createStaff("staff1", makeInput({
        tenantId: "tenantA",
        locationIds: ["locA"],
        serviceIds: ["svc1", "svc2"],
        status: "active",
      }));
      await repo.createStaff("staff2", makeInput({
        tenantId: "tenantA",
        locationIds: ["locA"],
        serviceIds: ["svc3"],
        status: "active",
      }));
      await repo.createStaff("staff3", makeInput({
        tenantId: "tenantA",
        locationIds: ["locB"],
        serviceIds: ["svc1"],
        status: "active",
      }));

      const staff = await repo.listServiceQualifiedStaff("tenantA", "locA", "svc1");

      expect(staff).toHaveLength(1);
      expect(staff[0].staffId).toBe("staff1");
    });
  });

  describe("deactivateStaff", () => {
    it("deactivates staff member", async () => {
      await repo.createStaff("staff1", makeInput({ status: "active" }));
      await repo.deactivateStaff("staff1", "tenantA");

      const staff = await repo.listLocationStaff("tenantA", "locA");
      expect(staff).toEqual([]);
    });

    it("blocks cross-tenant deactivation", async () => {
      await repo.createStaff("staff1", makeInput({ tenantId: "tenantA" }));
      await expect(repo.deactivateStaff("staff1", "tenantB")).rejects.toThrow(
        "Cross-tenant staff deactivation is not allowed"
      );
    });
  });
});
