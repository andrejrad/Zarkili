import { createTenantRepository, resolveTenantDefaultLanguage } from "../repository";
import type { CreateTenantInput } from "../model";

// ---------------------------------------------------------------------------
// Minimal in-memory Firestore mock
// ---------------------------------------------------------------------------
function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  const serverTimestamp = () => ({ _type: "serverTimestamp" });

  function doc(_db: unknown, collectionPath: string, id: string) {
    const key = `${collectionPath}/${id}`;
    return {
      key,
      id,
      path: key,
    };
  }

  async function getDoc(ref: { key: string; id: string }) {
    const data = store[ref.key];
    return {
      exists: () => data !== undefined,
      data: () => data ?? null,
      id: ref.id,
    };
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
      .map(([key, data]) => ({
        id: key.split("/")[1],
        data: () => data,
      }));
    return { empty: docs.length === 0, docs };
  }

  const db = {} as unknown;
  return { db, store, doc, getDoc, setDoc, updateDoc, collection, where, query, getDocs, serverTimestamp };
}

// ---------------------------------------------------------------------------
// Jest mock for firebase/firestore
// ---------------------------------------------------------------------------
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
// Test helpers
// ---------------------------------------------------------------------------
function makeInput(overrides: Partial<CreateTenantInput> = {}): CreateTenantInput {
  return {
    name: "Luna Nails",
    slug: "luna-nails",
    status: "active",
    ownerUserId: "uid_owner",
    plan: "starter",
    country: "HR",
    defaultLanguage: "en",
    defaultCurrency: "EUR",
    timezone: "Europe/Zagreb",
    branding: {
      logoUrl: null,
      primary: "#1F4D3A",
      secondary: "#F2E7D5",
      accent: "#C08A45",
      fontHeading: "Manrope",
      fontBody: "Inter",
      radius: 12,
    },
    settings: {
      bookingLeadHours: 2,
      bookingMaxDays: 90,
      cancellationWindowHours: 24,
      allowGuestBooking: false,
      requireDeposit: false,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("TenantRepository", () => {
  let repo: ReturnType<typeof createTenantRepository>;

  beforeEach(() => {
    mockFirestore = makeFirestoreMock();
    repo = createTenantRepository(mockFirestore.db as Parameters<typeof createTenantRepository>[0]);
  });

  describe("createTenant", () => {
    it("creates a tenant and returns it with tenantId", async () => {
      const tenant = await repo.createTenant("tenantA", makeInput());
      expect(tenant.tenantId).toBe("tenantA");
      expect(tenant.name).toBe("Luna Nails");
      expect(tenant.slug).toBe("luna-nails");
    });

    it("throws if name is empty", async () => {
      await expect(repo.createTenant("tenantA", makeInput({ name: "" }))).rejects.toThrow(
        "Tenant name is required"
      );
    });

    it("throws if slug is empty", async () => {
      await expect(repo.createTenant("tenantA", makeInput({ slug: "  " }))).rejects.toThrow(
        "Tenant slug is required"
      );
    });

    it("throws if ownerUserId is missing", async () => {
      await expect(repo.createTenant("tenantA", makeInput({ ownerUserId: "" }))).rejects.toThrow(
        "Tenant ownerUserId is required"
      );
    });

    it("throws when tenantId already exists", async () => {
      await repo.createTenant("tenantA", makeInput());
      await expect(repo.createTenant("tenantA", makeInput())).rejects.toThrow(
        "Tenant with id tenantA already exists"
      );
    });

    it("auto-seeds Croatian default language from country market when missing", async () => {
      const tenant = await repo.createTenant(
        "tenantA",
        makeInput({ country: "HR", defaultLanguage: undefined })
      );

      expect(tenant.defaultLanguage).toBe("hr");
    });

    it("auto-seeds Spanish default language from country market when missing", async () => {
      const tenant = await repo.createTenant(
        "tenantA",
        makeInput({ country: "ES", defaultLanguage: undefined })
      );

      expect(tenant.defaultLanguage).toBe("es");
    });

    it("falls back to English for unknown market when language is missing", async () => {
      const tenant = await repo.createTenant(
        "tenantA",
        makeInput({ country: "DE", timezone: "Europe/Berlin", defaultLanguage: undefined })
      );

      expect(tenant.defaultLanguage).toBe("en");
    });
  });

  describe("resolveTenantDefaultLanguage", () => {
    it("prefers explicit language override", () => {
      const language = resolveTenantDefaultLanguage({
        country: "HR",
        timezone: "Europe/Zagreb",
        defaultLanguage: "es",
      });

      expect(language).toBe("es");
    });

    it("uses timezone seed when market code is unknown", () => {
      const language = resolveTenantDefaultLanguage({
        country: "XX",
        timezone: "Europe/Madrid",
        defaultLanguage: undefined,
      });

      expect(language).toBe("es");
    });
  });

  describe("getTenantById", () => {
    it("returns null for unknown id", async () => {
      const result = await repo.getTenantById("missing");
      expect(result).toBeNull();
    });

    it("returns the tenant when it exists", async () => {
      await repo.createTenant("tenantA", makeInput());
      const result = await repo.getTenantById("tenantA");
      expect(result?.tenantId).toBe("tenantA");
    });
  });

  describe("getTenantBySlug", () => {
    it("returns null when no tenant has that slug", async () => {
      const result = await repo.getTenantBySlug("unknown-slug");
      expect(result).toBeNull();
    });

    it("returns the matching tenant by slug", async () => {
      await repo.createTenant("tenantA", makeInput({ slug: "unique-slug" }));
      const result = await repo.getTenantBySlug("unique-slug");
      expect(result?.tenantId).toBe("tenantA");
    });
  });

  describe("updateTenant", () => {
    it("updates allowed fields", async () => {
      await repo.createTenant("tenantA", makeInput());
      await repo.updateTenant("tenantA", { name: "New Name" });
      const updated = await repo.getTenantById("tenantA");
      expect(updated?.name).toBe("New Name");
    });

    it("throws on empty update payload", async () => {
      await repo.createTenant("tenantA", makeInput());
      await expect(repo.updateTenant("tenantA", {})).rejects.toThrow(
        "Update payload must not be empty"
      );
    });

    it("throws if name is blanked out in update", async () => {
      await repo.createTenant("tenantA", makeInput());
      await expect(repo.updateTenant("tenantA", { name: "  " })).rejects.toThrow(
        "Tenant name must not be blank"
      );
    });

    it("throws if tenant does not exist", async () => {
      await expect(repo.updateTenant("missing", { name: "X" })).rejects.toThrow("not found");
    });
  });

  describe("listActiveTenants", () => {
    it("returns only active tenants", async () => {
      await repo.createTenant("tenantA", makeInput({ status: "active" }));
      await repo.createTenant("tenantB", makeInput({ slug: "b", status: "suspended" }));
      const result = await repo.listActiveTenants();
      expect(result.length).toBe(1);
      expect(result[0].tenantId).toBe("tenantA");
    });

    it("returns empty array when no active tenants", async () => {
      const result = await repo.listActiveTenants();
      expect(result).toEqual([]);
    });
  });
});
