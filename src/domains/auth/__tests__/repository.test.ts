import { createAuthRepository } from "../repository";

const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
const mockSignInWithCredential = jest.fn();
const mockSignOut = jest.fn();
const mockVerifyBeforeUpdateEmail = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUserWithEmailAndPassword(...args),
  sendPasswordResetEmail: (...args: unknown[]) => mockSendPasswordResetEmail(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmailAndPassword(...args),
  signInWithCredential: (...args: unknown[]) => mockSignInWithCredential(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  verifyBeforeUpdateEmail: (...args: unknown[]) => mockVerifyBeforeUpdateEmail(...args),
}));

type MembershipDoc = {
  id: string;
  data: Record<string, unknown>;
};

let mockMembershipDocs: MembershipDoc[] = [];
let mockUserProfiles: Record<string, Record<string, unknown>> = {};

jest.mock("firebase/firestore", () => ({
  collection: (_db: unknown, name: string) => ({ name }),
  doc: (_db: unknown, name: string, id: string) => ({ name, id }),
  where: (field: string, op: string, value: unknown) => ({ field, op, value }),
  query: (col: { name: string }, ...filters: Array<{ field: string; op: string; value: unknown }>) => ({
    col,
    filters,
  }),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: async (q: { filters: Array<{ field: string; op: string; value: unknown }> }) => {
    const userIdFilter = q.filters.find((f) => f.field === "userId");
    const statusFilter = q.filters.find((f) => f.field === "status");

    const docs = mockMembershipDocs
      .filter((doc) => doc.data.userId === userIdFilter?.value)
      .filter((doc) => doc.data.status === statusFilter?.value)
      .map((doc) => ({ id: doc.id, data: () => doc.data }));

    return { docs };
  },
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  serverTimestamp: () => "SERVER_TIMESTAMP",
}));

describe("AuthRepository", () => {
  const auth = {
    currentUser: null as null | { uid: string; email: string | null },
  };
  const db = {};

  beforeEach(() => {
    mockMembershipDocs = [];
    mockUserProfiles = {};
    mockCreateUserWithEmailAndPassword.mockReset();
    mockSendPasswordResetEmail.mockReset();
    mockSignInWithEmailAndPassword.mockReset();
    mockSignInWithCredential.mockReset();
    mockSignOut.mockReset();
    mockVerifyBeforeUpdateEmail.mockReset();
    mockGetDoc.mockReset();
    mockSetDoc.mockReset();
    auth.currentUser = null;

    mockGetDoc.mockImplementation(async (ref: { name: string; id: string }) => {
      if (ref.name === "userProfiles") {
        const profile = mockUserProfiles[ref.id];
        return {
          exists: () => Boolean(profile),
          data: () => profile,
        };
      }

      return {
        exists: () => false,
        data: () => undefined,
      };
    });

    mockSetDoc.mockImplementation(async (ref: { name: string; id: string }, data: Record<string, unknown>) => {
      if (ref.name === "userProfiles") {
        mockUserProfiles[ref.id] = {
          ...(mockUserProfiles[ref.id] ?? {}),
          ...data,
        };
      }
    });
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
      firstName: null,
      lastName: null,
    });
  });

  it("hydrates current session with stored profile names", async () => {
    auth.currentUser = { uid: "user_1", email: "u1@test.dev" };
    mockUserProfiles.user_1 = {
      userId: "user_1",
      email: "u1@test.dev",
      firstName: "Ana",
      lastName: "Novak",
    };
    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.getCurrentSession()).resolves.toEqual({
      userId: "user_1",
      email: "u1@test.dev",
      firstName: "Ana",
      lastName: "Novak",
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
      firstName: null,
      lastName: null,
    });
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(auth, "u2@test.dev", "secret");
  });

  it("signs in and returns stored profile names when present", async () => {
    mockUserProfiles.user_2 = {
      userId: "user_2",
      email: "u2@test.dev",
      firstName: "Mia",
      lastName: "Kovac",
    };
    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "user_2", email: "u2@test.dev" },
    });

    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.signIn({ email: "u2@test.dev", password: "secret" })).resolves.toEqual({
      userId: "user_2",
      email: "u2@test.dev",
      firstName: "Mia",
      lastName: "Kovac",
    });
  });

  it("creates account and maps user credential to auth session", async () => {
    mockCreateUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "user_3", email: "u3@test.dev" },
    });

    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.createAccount({ email: "u3@test.dev", password: "secret" })).resolves.toEqual({
      userId: "user_3",
      email: "u3@test.dev",
      firstName: null,
      lastName: null,
    });
    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(auth, "u3@test.dev", "secret");
  });

  it("persists profile names for the authenticated user", async () => {
    auth.currentUser = { uid: "user_3", email: "u3@test.dev" };
    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.updateProfile("user_3", { firstName: "Ana", lastName: "Novak" })).resolves.toEqual({
      userId: "user_3",
      email: "u3@test.dev",
      firstName: "Ana",
      lastName: "Novak",
    });

    expect(mockSetDoc).toHaveBeenCalled();
    expect(mockUserProfiles.user_3).toMatchObject({
      userId: "user_3",
      email: "u3@test.dev",
      firstName: "Ana",
      lastName: "Novak",
    });
  });

  it("sends verification email and returns current session without writing to Firestore", async () => {
    auth.currentUser = { uid: "user_3", email: "u3@test.dev" };
    mockUserProfiles.user_3 = {
      userId: "user_3",
      email: "u3@test.dev",
      firstName: "Ana",
      lastName: "Novak",
    };
    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.updateEmailAddress("user_3", { email: "new@test.dev" })).resolves.toEqual({
      userId: "user_3",
      email: "u3@test.dev",
      firstName: "Ana",
      lastName: "Novak",
    });

    expect(mockVerifyBeforeUpdateEmail).toHaveBeenCalledWith(auth.currentUser, "new@test.dev");
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("maps Firebase update email errors to friendly messages", async () => {
    auth.currentUser = { uid: "user_3", email: "u3@test.dev" };
    mockVerifyBeforeUpdateEmail.mockRejectedValue({ code: "auth/requires-recent-login", message: "raw firebase error" });
    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.updateEmailAddress("user_3", { email: "new@test.dev" })).rejects.toThrow(
      "For security, please log in again before changing your email."
    );
  });

  it("sends password reset email", async () => {
    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.sendPasswordReset({ email: "member@test.dev" })).resolves.toBeUndefined();
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(auth, "member@test.dev");
  });

  it("maps Firebase password reset errors to friendly messages", async () => {
    mockSendPasswordResetEmail.mockRejectedValue({ code: "auth/too-many-requests", message: "raw firebase error" });
    const repo = createAuthRepository(auth as never, db as never);

    await expect(repo.sendPasswordReset({ email: "member@test.dev" })).rejects.toThrow(
      "Too many attempts. Please wait a moment and try again."
    );
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

  // ── signInWithSocialCredential ─────────────────────────────────────────

  it("signs in with a social credential and returns auth session", async () => {
    const fakeCredential = { providerId: "google.com" };
    mockSignInWithCredential.mockResolvedValue({
      user: { uid: "social-uid-1", email: "social@example.com" },
    });

    const repo = createAuthRepository(auth as never, db as never);
    const result = await repo.signInWithSocialCredential(fakeCredential as never);

    expect(mockSignInWithCredential).toHaveBeenCalledWith(auth, fakeCredential);
    expect(result).toEqual({
      userId: "social-uid-1",
      email: "social@example.com",
      firstName: null,
      lastName: null,
    });
  });

  it("hydrates profile names after social sign-in when profile exists", async () => {
    const fakeCredential = { providerId: "apple.com" };
    mockSignInWithCredential.mockResolvedValue({
      user: { uid: "social-uid-2", email: null },
    });
    mockUserProfiles["social-uid-2"] = {
      userId: "social-uid-2",
      email: null,
      firstName: "Lea",
      lastName: "Gross",
    };

    const repo = createAuthRepository(auth as never, db as never);
    const result = await repo.signInWithSocialCredential(fakeCredential as never);

    expect(result).toEqual({
      userId: "social-uid-2",
      email: null,
      firstName: "Lea",
      lastName: "Gross",
    });
  });

  it("maps Firebase social sign-in errors to friendly messages", async () => {
    const fakeCredential = { providerId: "google.com" };
    mockSignInWithCredential.mockRejectedValue({
      code: "auth/account-exists-with-different-credential",
      message: "raw firebase error",
    });

    const repo = createAuthRepository(auth as never, db as never);
    await expect(repo.signInWithSocialCredential(fakeCredential as never)).rejects.toThrow(
      "different sign-in method"
    );
  });
});
