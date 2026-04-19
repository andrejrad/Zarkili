import type { TenantMembership } from "../../domains/auth";
import { createAuthRepository } from "../../domains/auth";
import { auth, db } from "../../shared/config";

const authRepository = createAuthRepository(auth, db);

export async function listActiveTenantMembershipsForUser(
  userId: string
): Promise<TenantMembership[]> {
  return authRepository.listUserTenantMemberships(userId);
}
