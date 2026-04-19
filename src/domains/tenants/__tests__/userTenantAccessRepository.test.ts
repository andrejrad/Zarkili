import { createUserTenantAccessRepository } from "../userTenantAccessRepository";
import type { CreateUserTenantAccessInput } from "../userTenantAccessModel";

type StoredDoc = Record<string, unknown>;

const mockStore = new Map<string, StoredDoc>();

const mockDoc = jest.fn((_db: unknown, collectionName: string, id: string) => ({
  path: `${collectionName}/${id}`,
  id,
}));
const mockSetDoc = jest.fn(async (ref: { path: string }, data: StoredDoc) => {
  mockStore.set(ref.path, { ...data });
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
    .filter(([path]) => path.startsWith("userTenantAccess/"))
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

function makeAccessInput(overrides: Partial<CreateUserTenantAccessInput> = {}): CreateUserTenantAccessInput {
  return {
    userId: "userA",
    tenantId: "tenantA",
    accessLevel: "admin",
    subscriptionStatus: "active",
    subscribedAt: new Date("2026-04-01T00:00:00.000Z") as never,
    unreadMessageCount: 0,
    lastMessageAt: null,
    lastAccessedAt: null,
    status: "active",
    ...overrides,
  };
}

describe("UserTenantAccessRepository", () => {
  const db = {};

  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  it("creates user tenant access", async () => {
    const repo = createUserTenantAccessRepository(db as never);

    const created = await repo.createUserTenantAccess(makeAccessInput());

    expect(created.userId).toBe("userA");
    expect(created.tenantId).toBe("tenantA");
  });

  it("updates unread message count", async () => {
    const repo = createUserTenantAccessRepository(db as never);

    await repo.createUserTenantAccess(makeAccessInput());

    await repo.updateUnreadMessageCount("userA", "tenantA", 3, new Date("2026-04-19T10:00:00.000Z"));

    const entries = await repo.getUserTenants("userA");
    expect(entries[0].unreadMessageCount).toBe(3);
  });

  it("deactivates user tenant access", async () => {
    const repo = createUserTenantAccessRepository(db as never);

    await repo.createUserTenantAccess(makeAccessInput());
    await repo.deactivateUserTenantAccess("userA", "tenantA");

    const entries = await repo.getUserTenants("userA");
    expect(entries[0].status).toBe("inactive");
  });

  it("returns tenant users by tenant", async () => {
    const repo = createUserTenantAccessRepository(db as never);

    await repo.createUserTenantAccess(makeAccessInput({ userId: "userA", tenantId: "tenantA" }));
    await repo.createUserTenantAccess(makeAccessInput({ userId: "userB", tenantId: "tenantA" }));
    await repo.createUserTenantAccess(makeAccessInput({ userId: "userC", tenantId: "tenantB" }));

    const users = await repo.getTenantUsers("tenantA");

    expect(users).toHaveLength(2);
    expect(users.every((u) => u.tenantId === "tenantA")).toBe(true);
  });
});
