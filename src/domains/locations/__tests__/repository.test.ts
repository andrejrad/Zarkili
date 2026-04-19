import { createLocationRepository } from "../repository";
import type { CreateLocationInput } from "../model";

// ---------------------------------------------------------------------------
// In-memory Firestore mock (same shape as tenant tests)
// ---------------------------------------------------------------------------
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
          if (op === "==") return (data as Record<string, unknown>)[field] === value;
          return true;
        })
      )
      .map(([key, data]) => ({ id: key.split("/")[1], data: () => data }));
    return { empty: docs.length === 0, docs };
  }

  const db = {} as unknown;
  return { db, store, doc, getDoc, setDoc, updateDoc, collection, where, query, getDocs, serverTimestamp };
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeInput(overrides: Partial<CreateLocationInput> = {}): CreateLocationInput {
  return {
    tenantId: "tenantA",
    name: "Downtown Studio",
    code: "DOWNTOWN",
    status: "active",
    timezone: "Europe/Zagreb",
    phone: "+38512345678",
    email: "downtown@luna.hr",
    address: {
      line1: "Ilica 12",
      city: "Zagreb",
      country: "HR",
      postalCode: "10000",
      lat: 45.81,
      lng: 15.97,
    },
    operatingHours: {
      mon: [{ start: "09:00", end: "19:00" }],
      tue: [{ start: "09:00", end: "19:00" }],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("LocationRepository", () => {
  let repo: ReturnType<typeof createLocationRepository>;

  beforeEach(() => {
    mockFirestore = makeFirestoreMock();
    repo = createLocationRepository(mockFirestore.db as Parameters<typeof createLocationRepository>[0]);
  });

  describe("createLocation", () => {
    it("creates a location and returns it with locationId", async () => {
      const loc = await repo.createLocation("loc1", makeInput());
      expect(loc.locationId).toBe("loc1");
      expect(loc.tenantId).toBe("tenantA");
      expect(loc.name).toBe("Downtown Studio");
    });

    it("throws if tenantId is empty", async () => {
      await expect(
        repo.createLocation("loc1", makeInput({ tenantId: "" }))
      ).rejects.toThrow("tenantId is required");
    });

    it("throws if name is empty", async () => {
      await expect(
        repo.createLocation("loc1", makeInput({ name: "" }))
      ).rejects.toThrow("Location name is required");
    });

    it("throws if code is empty", async () => {
      await expect(
        repo.createLocation("loc1", makeInput({ code: "  " }))
      ).rejects.toThrow("Location code is required");
    });

    it("throws if address.city is missing", async () => {
      await expect(
        repo.createLocation("loc1", makeInput({ address: { line1: "A", city: "", country: "HR", postalCode: "10000" } }))
      ).rejects.toThrow("address.city is required");
    });

    it("throws if location already exists", async () => {
      await repo.createLocation("loc1", makeInput());
      await expect(repo.createLocation("loc1", makeInput())).rejects.toThrow("already exists");
    });
  });

  describe("getLocationById", () => {
    it("returns null for unknown id", async () => {
      const result = await repo.getLocationById("missing");
      expect(result).toBeNull();
    });

    it("returns the location when it exists", async () => {
      await repo.createLocation("loc1", makeInput());
      const result = await repo.getLocationById("loc1");
      expect(result?.locationId).toBe("loc1");
    });
  });

  describe("listTenantLocations", () => {
    it("returns only active locations for the given tenantId", async () => {
      await repo.createLocation("loc1", makeInput({ tenantId: "tenantA", status: "active" }));
      await repo.createLocation("loc2", makeInput({ tenantId: "tenantA", status: "inactive" }));
      await repo.createLocation("loc3", makeInput({ tenantId: "tenantB", status: "active" }));

      const result = await repo.listTenantLocations("tenantA");

      expect(result.length).toBe(1);
      expect(result[0].locationId).toBe("loc1");
    });

    it("throws if tenantId is blank", async () => {
      await expect(repo.listTenantLocations("  ")).rejects.toThrow("tenantId is required");
    });

    it("returns empty array when tenant has no active locations", async () => {
      const result = await repo.listTenantLocations("tenantA");
      expect(result).toEqual([]);
    });
  });

  describe("updateLocation", () => {
    it("updates allowed fields", async () => {
      await repo.createLocation("loc1", makeInput());
      await repo.updateLocation("loc1", "tenantA", { name: "New Name" });
      const updated = await repo.getLocationById("loc1");
      expect(updated?.name).toBe("New Name");
    });

    it("throws on empty payload", async () => {
      await repo.createLocation("loc1", makeInput());
      await expect(repo.updateLocation("loc1", "tenantA", {})).rejects.toThrow(
        "Update payload must not be empty"
      );
    });

    it("throws if location does not exist", async () => {
      await expect(repo.updateLocation("missing", "tenantA", { name: "X" })).rejects.toThrow(
        "not found"
      );
    });

    it("blocks cross-tenant update", async () => {
      await repo.createLocation("loc1", makeInput({ tenantId: "tenantA" }));
      await expect(repo.updateLocation("loc1", "tenantB", { name: "Hijack" })).rejects.toThrow(
        "Cross-tenant location update is not allowed"
      );
    });
  });

  describe("deactivateLocation", () => {
    it("sets status to inactive", async () => {
      await repo.createLocation("loc1", makeInput());
      await repo.deactivateLocation("loc1", "tenantA");
      const result = await repo.getLocationById("loc1");
      expect(result?.status).toBe("inactive");
    });

    it("throws if location does not exist", async () => {
      await expect(repo.deactivateLocation("missing", "tenantA")).rejects.toThrow("not found");
    });

    it("blocks cross-tenant deactivation", async () => {
      await repo.createLocation("loc1", makeInput({ tenantId: "tenantA" }));
      await expect(repo.deactivateLocation("loc1", "tenantB")).rejects.toThrow(
        "Cross-tenant location deactivation is not allowed"
      );
    });
  });
});
