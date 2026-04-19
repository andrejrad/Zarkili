import { createAiBudgetAdminService, createAiBudgetConfigRepository } from "../../domains/ai";
import { auth, db } from "../../shared/config";

export async function resolvePlatformAdminFromAuthClaims(userId: string): Promise<boolean> {
  if (!userId || userId.trim().length === 0) {
    return false;
  }

  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    return false;
  }

  const tokenResult = await currentUser.getIdTokenResult();
  return tokenResult.claims.role === "platform_admin";
}

const aiBudgetConfigRepository = createAiBudgetConfigRepository(db);

export const appAiBudgetAdminService = createAiBudgetAdminService({
  repository: aiBudgetConfigRepository,
  isPlatformAdmin: resolvePlatformAdminFromAuthClaims,
});
