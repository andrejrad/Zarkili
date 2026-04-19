import { createTenantUsersRepository } from "../tenantUsersRepository";
import type { AssignTenantUserInput } from "../tenantUsersModel";

type StoredDoc = Record<string, unknown>;

const mockStore = new Map<string, StoredDoc>();

const mockDoc = jest.fn((_db: unknown, collectionName: string, id: string) => ({
  path: `${collectionName}/${id}`,
  id,
}));
const mockSetDoc = jest.fn(async (ref: { path: string }, data: StoredDoc) => {
  mockStore.set(ref.path, {
    ...data,
  });
});
const mockGetDoc = jest.fn(async (ref: { path: string }) => ({
  exists: () => mockStore.has(ref.path),
  data: () => mockStore.get(ref.path),
}));
const mockUpdateDoc = jest.fn(async (ref: { path: string }, patch: StoredDoc) => {
  if (!mockStore.has(ref.path)) {
    throw new Error("missing");
  }

  mockStore.set(ref.path, {
    ...(mockStore.get(ref.path) ?? {}),
    ...patch,
  });
});
const mockCollection = jest.fn((_db: unknown, collectionName: string) => ({ collectionName }));
const mockWhere = jest.fn((field: string, op: string, value: unknown) => ({ field, op, value }));
const mockQuery = jest.fn((collectionRef: { collectionName: string }, ...clauses: Array<Record<string, unknown>>) => ({
  collectionName: collectionRef.collectionName,
  clauses,
}));
const mockGetDocs = jest.fn(async (q: { clauses: Array<Record<string, unknown>> }) => {
  const tenantId = q.clauses.find((clause) => clause.field === "tenantId")?.value;
  const userId = q.clauses.find((clause) => clause.field === "userId")?.value;

  const docs = [...mockStore.entries()]
    .filter(([path]) => path.startsWith("tenantUsers/"))
    .map(([, value]) => value)
    .filter((value) => (tenantId ? value.tenantId === tenantId : true))
    .filter((value) => (userId ? value.userId === userId : true))
    .map((value) => ({ data: () => value }));

  return { docs };
});

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...(args as [unknown, string, string])),
  setDoc: (...args: unknown[]) => mockSetDoc(...(args as [{ path: string }, StoredDoc])),
  getDoc: (...args: unknown[]) => mockGetDoc(...(args as [{ path: string }])),
  updateDoc: (...args: unknown[]) =>
    mockUpdateDoc(...(args as [{ path: string }, StoredDoc])),
  collection: (...args: unknown[]) =>
    mockCollection(...(args as [unknown, string])),
  where: (...args: unknown[]) =>
    mockWhere(...(args as [string, string, unknown])),
  query: (...args: unknown[]) =>
    mockQuery(...(args as [{ collectionName: string }, ...Array<Record<string, unknown>>])),
  getDocs: (...args: unknown[]) =>
    mockGetDocs(...(args as [{ clauses: Array<Record<string, unknown>> }])),
  serverTimestamp: () => new Date("2026-04-19T00:00:00.000Z"),
}));

function makeAssignInput(overrides: Partial<AssignTenantUserInput> = {}): AssignTenantUserInput {
  return {
    tenantId: "tenantA",
    userId: "userA",
    role: "tenant_admin",
    permissions: ["locations:read", "locations:write"],
    status: "active",
    subscription: {
      tier: "starter",
      status: "active",
      billingCycle: "monthly",
      startDate: new Date("2026-04-01T00:00:00.000Z") as never,
      trialEndsAt: null,
      nextBillingDate: new Date("2026-05-01T00:00:00.000Z") as never,
      suspendedAt: null,
      suspensionReason: null,
    },
    ...overrides,
  };
}

describe("TenantUsersRepository", () => {
  const db = {};

  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  it("assigns user to tenant", async () => {
    const repo = createTenantUsersRepository(db as never);

    const assigned = await repo.assignUserToTenant("tenantA_userA", makeAssignInput());

    expect(assigned.tenantId).toBe("tenantA");
    expect(assigned.userId).toBe("userA");
    expect(assigned.role).toBe("tenant_admin");
  });

  it("rejects invalid subscription status", async () => {
    const repo = createTenantUsersRepository(db as never);

    await expect(
      repo.assignUserToTenant(
        "tenantA_userA",
        makeAssignInput({
          subscription: {
            ...makeAssignInput().subscription,
            status: "bad" as never,
          },
        })
      )
    ).rejects.toThrow("subscription.status is invalid");
  });

  it("requires trial end date for trialing status", async () => {
    const repo = createTenantUsersRepository(db as never);

    await expect(
      repo.assignUserToTenant(
        "tenantA_userA",
        makeAssignInput({
          subscription: {
            ...makeAssignInput().subscription,
            status: "trialing",
            trialEndsAt: null,
          },
        })
      )
    ).rejects.toThrow("subscription.trialEndsAt is required for trialing status");
  });

  it("blocks role change from non-admin actors", async () => {
    const repo = createTenantUsersRepository(db as never);

    await repo.assignUserToTenant("tenantA_userA", makeAssignInput({ role: "technician" }));

    await expect(
      repo.updateTenantUserRole("tenantA_userA", {
        actorRole: "client",
        nextRole: "location_manager",
      })
    ).rejects.toThrow("Only tenant_owner or tenant_admin can change roles");
  });

  it("blocks tenant_admin from promoting tenant_owner", async () => {
    const repo = createTenantUsersRepository(db as never);

    await repo.assignUserToTenant("tenantA_userA", makeAssignInput({ role: "tenant_admin" }));

    await expect(
      repo.updateTenantUserRole("tenantA_userA", {
        actorRole: "tenant_admin",
        nextRole: "tenant_owner",
      })
    ).rejects.toThrow("tenant_admin cannot change tenant_owner role");
  });

  it("lists tenant users by tenant", async () => {
    const repo = createTenantUsersRepository(db as never);

    await repo.assignUserToTenant("tenantA_userA", makeAssignInput({ tenantId: "tenantA", userId: "userA" }));
    await repo.assignUserToTenant("tenantA_userB", makeAssignInput({ tenantId: "tenantA", userId: "userB" }));
    await repo.assignUserToTenant("tenantB_userC", makeAssignInput({ tenantId: "tenantB", userId: "userC" }));

    const users = await repo.listTenantUsers("tenantA");

    expect(users).toHaveLength(2);
    expect(users.every((user) => user.tenantId === "tenantA")).toBe(true);
  });

  it("lists tenant roles by user", async () => {
    const repo = createTenantUsersRepository(db as never);

    await repo.assignUserToTenant("tenantA_userA", makeAssignInput({ tenantId: "tenantA", userId: "userA" }));
    await repo.assignUserToTenant("tenantB_userA", makeAssignInput({ tenantId: "tenantB", userId: "userA" }));

    const memberships = await repo.getUserTenantRoles("userA");

    expect(memberships).toHaveLength(2);
    expect(memberships.every((m) => m.userId === "userA")).toBe(true);
  });
});
