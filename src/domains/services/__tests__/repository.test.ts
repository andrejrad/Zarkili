import { createServiceRepository } from "../repository";
import type { CreateServiceInput } from "../model";

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  const serverTimestamp = () => ({ _type: "serverTimestamp" });

  function doc(_db: unknown, ...segments: string[]) {
    const key = segments.join("/");
    const id = segments[segments.length - 1];
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

  function collection(_db: unknown, ...segments: string[]) {
    return { _col: segments.join("/") };
  }

  function collectionGroup(_db: unknown, name: string) {
    return { _cg: name };
  }

  function where(field: string, op: string, value: unknown) {
    return { field, op, value };
  }

  function orderBy(field: string, direction?: string) {
    return { _orderBy: field, direction: direction ?? "asc" };
  }

  function query(
    ref: { _col?: string; _cg?: string },
    ...constraints: Array<unknown>
  ) {
    const filters = constraints.filter(
      (c): c is { field: string; op: string; value: unknown } =>
        !!c && typeof c === "object" && "field" in (c as Record<string, unknown>),
    );
    return { col: ref._col, cg: ref._cg, filters };
  }

  async function getDocs(qIn: {
    col?: string;
    cg?: string;
    _col?: string;
    _cg?: string;
    filters?: Array<{ field: string; op: string; value: unknown }>;
  }) {
    // Accept either a query() result or a raw collection/collectionGroup ref
    const q = {
      col: qIn.col ?? qIn._col,
      cg: qIn.cg ?? qIn._cg,
      filters: qIn.filters ?? [],
    };
    const docs = Object.entries(store)
      .filter(([key]) => {
        if (q.col) return key.startsWith(`${q.col}/`) && key.slice(q.col.length + 1).indexOf("/") === -1;
        if (q.cg) {
          // Match any doc whose penultimate path segment equals the collection group name
          const parts = key.split("/");
          return parts.length >= 2 && parts[parts.length - 2] === q.cg;
        }
        return false;
      })
      .filter(([, data]) =>
        q.filters.every(({ field, op, value }) => {
          if (op === "==") {
            return (data as Record<string, unknown>)[field] === value;
          }

          if (op === "array-contains") {
            const fieldValue = (data as Record<string, unknown>)[field];
            return Array.isArray(fieldValue) && fieldValue.includes(value);
          }

          return true;
        })
      )
      .map(([key, data]) => {
        const parts = key.split("/");
        return { id: parts[parts.length - 1], data: () => data };
      });

    return { empty: docs.length === 0, docs };
  }

  const db = {} as unknown;
  return {
    db,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    collectionGroup,
    where,
    orderBy,
    query,
    getDocs,
    serverTimestamp,
  };
}

let mockFirestore: ReturnType<typeof makeFirestoreMock>;

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockFirestore.doc(...(args as [unknown, ...string[]])),
  getDoc: (...args: unknown[]) => mockFirestore.getDoc(...args as [{ key: string; id: string }]),
  setDoc: (...args: unknown[]) => mockFirestore.setDoc(...args as [{ key: string }, Record<string, unknown>]),
  updateDoc: (...args: unknown[]) => mockFirestore.updateDoc(...args as [{ key: string }, Record<string, unknown>]),
  collection: (...args: unknown[]) => mockFirestore.collection(...(args as [unknown, ...string[]])),
  collectionGroup: (...args: unknown[]) =>
    mockFirestore.collectionGroup(...(args as [unknown, string])),
  where: (...args: unknown[]) => mockFirestore.where(...args as [string, string, unknown]),
  orderBy: (...args: unknown[]) => mockFirestore.orderBy(...(args as [string, string?])),
  query: (...args: unknown[]) =>
    mockFirestore.query(
      ...(args as [{ _col?: string; _cg?: string }, ...Array<unknown>]),
    ),
  getDocs: (...args: unknown[]) =>
    mockFirestore.getDocs(
      ...(args as [
        {
          col?: string;
          cg?: string;
          filters: Array<{ field: string; op: string; value: unknown }>;
        },
      ]),
    ),
  serverTimestamp: () => mockFirestore.serverTimestamp(),
}));

function makeInput(overrides: Partial<CreateServiceInput> = {}): CreateServiceInput {
  return {
    tenantId: "tenantA",
    locationId: "locA",
    name: "Gel Manicure",
    description: null,
    categoryId: "manicure",
    tags: [],
    baseDurationMinutes: 60,
    baseBufferMinutes: 10,
    basePrice: 45,
    baseCurrency: "EUR",
    technicianIds: [],
    photoUrl: null,
    active: true,
    sortOrder: 10,
    ...overrides,
  };
}

describe("ServiceRepository", () => {
  let repo: ReturnType<typeof createServiceRepository>;

  beforeEach(() => {
    mockFirestore = makeFirestoreMock();
    repo = createServiceRepository(mockFirestore.db as Parameters<typeof createServiceRepository>[0]);
  });

  describe("createService", () => {
    it("creates a service and returns it with serviceId", async () => {
      const service = await repo.createService("svc1", makeInput());
      expect(service.serviceId).toBe("svc1");
      expect(service.tenantId).toBe("tenantA");
      expect(service.name).toBe("Gel Manicure");
    });

    it("throws if service already exists", async () => {
      await repo.createService("svc1", makeInput());
      await expect(repo.createService("svc1", makeInput())).rejects.toThrow("already exists");
    });

    it("rejects price outside allowed boundary", async () => {
      await expect(repo.createService("svc1", makeInput({ basePrice: -1 }))).rejects.toThrow(
        "basePrice must be between"
      );
    });

    it("rejects duration outside allowed boundary", async () => {
      await expect(
        repo.createService("svc1", makeInput({ baseDurationMinutes: 3 }))
      ).rejects.toThrow("baseDurationMinutes must be between");
    });
  });

  describe("updateService", () => {
    it("updates allowed fields", async () => {
      await repo.createService("svc1", makeInput());
      await repo.updateService("svc1", "tenantA", { basePrice: 49, baseDurationMinutes: 75 });

      const tenantServices = await repo.listServicesByTenant("tenantA");
      expect(tenantServices[0].basePrice).toBe(49);
      expect(tenantServices[0].baseDurationMinutes).toBe(75);
    });

    it("throws on empty payload", async () => {
      await repo.createService("svc1", makeInput());
      await expect(repo.updateService("svc1", "tenantA", {})).rejects.toThrow(
        "Update payload must not be empty"
      );
    });

    it("blocks cross-tenant update", async () => {
      await repo.createService("svc1", makeInput({ tenantId: "tenantA" }));
      await expect(repo.updateService("svc1", "tenantB", { basePrice: 40 })).rejects.toThrow(
        "Cross-tenant service update is not allowed"
      );
    });
  });

  describe("listServicesByTenant", () => {
    it("returns only active services for tenant", async () => {
      await repo.createService("svc1", makeInput({ tenantId: "tenantA", active: true }));
      await repo.createService("svc2", makeInput({ tenantId: "tenantA", active: false }));
      await repo.createService("svc3", makeInput({ tenantId: "tenantB", active: true }));

      const services = await repo.listServicesByTenant("tenantA");

      expect(services).toHaveLength(1);
      expect(services[0].serviceId).toBe("svc1");
    });
  });

  describe("listServicesByLocation", () => {
    it("returns only services matching tenant and location", async () => {
      await repo.createService("svc1", makeInput({ tenantId: "tenantA", locationId: "locA" }));
      await repo.createService("svc2", makeInput({ tenantId: "tenantA", locationId: "locB" }));
      await repo.createService("svc3", makeInput({ tenantId: "tenantA", locationId: "locA" }));
      await repo.createService("svc4", makeInput({ tenantId: "tenantB", locationId: "locA" }));

      const services = await repo.listServicesByLocation("tenantA", "locA");

      expect(services).toHaveLength(2);
      expect(services.every((service) => service.tenantId === "tenantA")).toBe(true);
      expect(services.every((service) => service.locationId === "locA")).toBe(true);
    });
  });

  describe("archiveService", () => {
    it("archives service by setting active=false", async () => {
      await repo.createService("svc1", makeInput({ active: true }));
      await repo.archiveService("svc1", "tenantA");

      const services = await repo.listServicesByTenant("tenantA");
      expect(services).toEqual([]);
    });

    it("blocks cross-tenant archive", async () => {
      await repo.createService("svc1", makeInput({ tenantId: "tenantA" }));
      await expect(repo.archiveService("svc1", "tenantB")).rejects.toThrow(
        "Cross-tenant service archive is not allowed"
      );
    });
  });
});
