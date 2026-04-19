import { createAuthRepository } from "../repository";

const mockSignInWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();

jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmailAndPassword(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

type MembershipDoc = {
  id: string;
  data: Record<string, unknown>;
};

let mockMembershipDocs: MembershipDoc[] = [];

jest.mock("firebase/firestore", () => ({
  collection: (_db: unknown, name: string) => ({ name }),
  where: (field: string, op: string, value: unknown) => ({ field, op, value }),
  query: (col: { name: string }, ...filters: Array<{ field: string; op: string; value: unknown }>) => ({
    col,
    filters,
  }),
  getDocs: async (q: { filters: Array<{ field: string; op: string; value: unknown }> }) => {
    const userIdFilter = q.filters.find((f) => f.field === "userId");
    const statusFilter = q.filters.find((f) => f.field === "status");

    const docs = mockMembershipDocs
      .filter((doc) => doc.data.userId === userIdFilter?.value)
      .filter((doc) => doc.data.status === statusFilter?.value)
      .map((doc) => ({ id: doc.id, data: () => doc.data }));

    return { docs };
  },
}));

describe("AuthRepository", () => {
  const auth = {
    currentUser: null as null | { uid: string; email: string | null },
  };
  const db = {};

  beforeEach(() => {
    mockMembershipDocs = [];
    mockSignInWithEmailAndPassword.mockReset();
    mockSignOut.mockReset();
    auth.currentUser = null;
  });

  it("returns null session when no current user exists", async () => {
    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.getCurrentSession()).resolves.toBeNull();
  });

  it("returns current session when user exists", async () => {
    auth.currentUser = { uid: "user_1", email: "u1@test.dev" };
    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.getCurrentSession()).resolves.toEqual({
      userId: "user_1",
      email: "u1@test.dev",
    });
  });

  it("signs in and maps user credential to auth session", async () => {
    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "user_2", email: "u2@test.dev" },
    });

    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.signIn({ email: "u2@test.dev", password: "secret" })).resolves.toEqual({
      userId: "user_2",
      email: "u2@test.dev",
    });
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(auth, "u2@test.dev", "secret");
  });

  it("rejects sign in with blank email", async () => {
    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.signIn({ email: " ", password: "secret" })).rejects.toThrow("email is required");
  });

  it("rejects sign in with blank password", async () => {
    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.signIn({ email: "u3@test.dev", password: " " })).rejects.toThrow("password is required");
  });

  it("signs out current user", async () => {
    const repo = createAuthRepository(auth as never, db as never);

    await repo.signOutCurrentUser();

    expect(mockSignOut).toHaveBeenCalledWith(auth);
  });

  it("lists only active memberships for requested user", async () => {
    mockMembershipDocs = [
      {
        id: "tenantA_user_1",
        data: { tenantId: "tenantA", userId: "user_1", role: "tenant_admin", status: "active" },
      },
      {
        id: "tenantA_user_2",
        data: { tenantId: "tenantA", userId: "user_2", role: "client", status: "active" },
      },
      {
        id: "tenantB_user_1",
        data: { tenantId: "tenantB", userId: "user_1", role: "client", status: "inactive" },
      },
    ];

    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.listUserTenantMemberships("user_1")).resolves.toEqual([
      {
        membershipId: "tenantA_user_1",
        tenantId: "tenantA",
        userId: "user_1",
        role: "tenant_admin",
        status: "active",
      },
    ]);
  });

  it("rejects membership lookup with blank userId", async () => {
    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.listUserTenantMemberships(" ")).rejects.toThrow("userId is required");
  });
});
