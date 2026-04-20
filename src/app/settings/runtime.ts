import { httpsCallable } from "firebase/functions";

import {
  createAiBudgetAdminService,
  createAiBudgetConfigRepository,
  type AiBudgetAuditLogPage,
  type ListAiBudgetAuditLogsInput,
} from "../../domains/ai";
import { auth, db, functions } from "../../shared/config";

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
const listAiBudgetAuditLogsAdminCallable = httpsCallable<ListAiBudgetAuditLogsInput, AiBudgetAuditLogPage>(
  functions,
  "listAiBudgetAuditLogsAdmin"
);

export const appAiBudgetAdminService = createAiBudgetAdminService({
  repository: aiBudgetConfigRepository,
  isPlatformAdmin: resolvePlatformAdminFromAuthClaims,
  listBudgetAuditLogs: async (input) => {
    const result = await listAiBudgetAuditLogsAdminCallable(input);
    return result.data;
  },
});
