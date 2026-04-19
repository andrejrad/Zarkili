import { createTenantAccessSyncService } from "../tenantAccessSyncService";

describe("TenantAccessSyncService", () => {
  it("creates userTenantAccess mirror after tenantUsers assignment", async () => {
    const assignUserToTenant = jest.fn(async () => ({
      membershipId: "tenantA_userA",
      tenantId: "tenantA",
      userId: "userA",
      role: "tenant_admin",
      permissions: ["locations:read"],
      status: "active",
      subscription: {
        tier: "starter",
        status: "active",
        billingCycle: "monthly",
        startDate: new Date("2026-04-01T00:00:00.000Z"),
        trialEndsAt: null,
        nextBillingDate: new Date("2026-05-01T00:00:00.000Z"),
        suspendedAt: null,
        suspensionReason: null,
      },
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    }));

    const createUserTenantAccess = jest.fn(async () => undefined);

    const service = createTenantAccessSyncService(
      {
        assignUserToTenant,
        updateTenantUserRole: jest.fn(),
        listTenantUsers: jest.fn(),
        getUserTenantRoles: jest.fn(),
      } as never,
      {
        createUserTenantAccess,
        updateUnreadMessageCount: jest.fn(),
        getUserTenants: jest.fn(),
        getTenantUsers: jest.fn(),
        deactivateUserTenantAccess: jest.fn(),
      } as never
    );

    await service.assignUserAndCreateAccess("tenantA_userA", {
      tenantId: "tenantA",
      userId: "userA",
      role: "tenant_admin",
      permissions: ["locations:read"],
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
    });

    expect(assignUserToTenant).toHaveBeenCalledTimes(1);
    expect(createUserTenantAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "userA",
        tenantId: "tenantA",
        accessLevel: "admin",
        subscriptionStatus: "active",
      })
    );
  });
});
