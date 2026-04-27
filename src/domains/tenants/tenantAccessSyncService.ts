import type { TenantUsersRepository } from "./tenantUsersRepository";
import type { UserTenantAccessRepository } from "./userTenantAccessRepository";
import type { AssignTenantUserInput, TenantUser } from "./tenantUsersModel";

const accessLevelByRole: Record<TenantUser["role"], "owner" | "admin" | "manager" | "technician" | "client"> = {
  tenant_owner: "owner",
  tenant_admin: "admin",
  location_manager: "manager",
  technician: "technician",
  client: "client",
};

export function createTenantAccessSyncService(
  tenantUsersRepository: TenantUsersRepository,
  userTenantAccessRepository: UserTenantAccessRepository
) {
  async function assignUserAndCreateAccess(
    membershipId: string,
    input: AssignTenantUserInput
  ): Promise<void> {
    const membership = await tenantUsersRepository.assignUserToTenant(membershipId, input);

    await userTenantAccessRepository.createUserTenantAccess({
      userId: membership.userId,
      tenantId: membership.tenantId,
      accessLevel: accessLevelByRole[membership.role],
      subscriptionStatus: membership.subscription.status,
      subscribedAt: membership.subscription.startDate,
      unreadMessageCount: 0,
      lastMessageAt: null,
      lastAccessedAt: null,
      nextAppointmentAt: null,
      nextAppointmentServiceName: null,
      status: membership.status,
    });
  }

  return {
    assignUserAndCreateAccess,
  };
}

export type TenantAccessSyncService = ReturnType<typeof createTenantAccessSyncService>;
