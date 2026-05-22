import {
  collection,
  doc,
  getDoc,
  addDoc,
  getDocs,
} from "firebase/firestore";

import { createImpersonationService } from "../impersonationService";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
}));

const mockDb = {} as ReturnType<typeof import("firebase/firestore").getFirestore>;

function resetMocks() {
  jest.clearAllMocks();
  (collection as jest.Mock).mockReturnValue("mock-collection");
  (doc as jest.Mock).mockReturnValue("mock-doc-ref");
  (addDoc as jest.Mock).mockResolvedValue({ id: "new-session-id" });
  // No active session by default
  (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });
}

describe("impersonationService.startImpersonation", () => {
  beforeEach(resetMocks);

  it("throws FORBIDDEN when role is not platform_admin", async () => {
    const svc = createImpersonationService(mockDb);
    await expect(
      svc.startImpersonation("tenant_owner", "admin-1", "t1", "u1", "Valid reason here for test")
    ).rejects.toThrow("FORBIDDEN");
  });

  it("throws VALIDATION when reason is fewer than 10 characters", async () => {
    const svc = createImpersonationService(mockDb);
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
    await expect(
      svc.startImpersonation("platform_admin", "admin-1", "t1", "u1", "short")
    ).rejects.toThrow("VALIDATION");
  });

  it("throws VALIDATION when reason is empty", async () => {
    const svc = createImpersonationService(mockDb);
    await expect(
      svc.startImpersonation("platform_admin", "admin-1", "t1", "u1", "")
    ).rejects.toThrow("VALIDATION");
  });

  it("throws CONFLICT when an active session already exists", async () => {
    const svc = createImpersonationService(mockDb);
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
    const futureExpiry = new Date(Date.now() + 60_000).toISOString();
    (getDocs as jest.Mock).mockResolvedValue({
      empty: false,
      docs: [
        {
          id: "existing-session",
          data: () => ({
            platformAdminId: "admin-1",
            targetTenantId: "t1",
            targetUserId: "u1",
            targetUserEmail: "u@example.com",
            reason: "already running",
            startedAt: new Date().toISOString(),
            expiresAt: futureExpiry,
            active: true,
          }),
        },
      ],
    });

    await expect(
      svc.startImpersonation("platform_admin", "admin-1", "t1", "u1", "Valid reason here for test")
    ).rejects.toThrow("CONFLICT");
  });

  it("resolves user email from userProfiles when profile exists", async () => {
    const svc = createImpersonationService(mockDb);
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ email: "target@example.com", firstName: "Target", lastName: "User" }),
    });

    const session = await svc.startImpersonation(
      "platform_admin",
      "admin-1",
      "tenant-abc",
      "user-xyz",
      "Investigating payment issue for support ticket"
    );

    expect(session.targetUserEmail).toBe("target@example.com");
    expect(session.sessionId).toBe("new-session-id");
  });

  it("falls back to empty string when userProfiles doc does not exist", async () => {
    const svc = createImpersonationService(mockDb);
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

    const session = await svc.startImpersonation(
      "platform_admin",
      "admin-1",
      "tenant-abc",
      "user-xyz",
      "Investigating payment issue for support ticket"
    );

    expect(session.targetUserEmail).toBe("");
    expect(session.sessionId).toBe("new-session-id");
  });

  it("writes to impersonationSessions and platformAuditLog and securityEvents", async () => {
    const svc = createImpersonationService(mockDb);
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

    await svc.startImpersonation(
      "platform_admin",
      "admin-1",
      "tenant-abc",
      "user-xyz",
      "Investigating payment issue for support ticket"
    );

    expect(addDoc).toHaveBeenCalledTimes(3);
  });
});
