import type { TenantMembership } from "../../domains/auth";
import { createAuthRepository } from "../../domains/auth";
import { auth, db } from "../../shared/config";
import { env } from "../../shared/config/env";

const authRepository = createAuthRepository(auth, db);

function getDevelopmentDevMembership(userId: string): TenantMembership[] {
  if (env.appVariant !== "development" || userId !== "dev-user") {
    return [];
  }

  return [
    {
      membershipId: "tenantA_dev-user",
      tenantId: "tenantA",
      userId: "dev-user",
      role: "tenant_admin",
      status: "active",
    },
  ];
}

export async function listActiveTenantMembershipsForUser(
  userId: string
): Promise<TenantMembership[]> {
  try {
    const memberships = await authRepository.listUserTenantMemberships(userId);
    if (memberships.length > 0) {
      return memberships;
    }
  } catch {
    // Firebase may reject unauthenticated reads (e.g. sign-in-as-dev bypasses Firebase auth).
    // Fall through to dev-mode fallback below.
  }

  // Dev-mode fallback keeps sign-in-as-dev flows usable before tenantUsers is seeded.
  return getDevelopmentDevMembership(userId);
}
