import type {
  AiBudgetConfigRepository,
  UpdateAiBudgetConfigInput,
} from "./budgetConfigRepository";

export type AiBudgetAdminDependencies = {
  repository: AiBudgetConfigRepository;
  isPlatformAdmin: (userId: string) => Promise<boolean>;
  listBudgetAuditLogs: (input: ListAiBudgetAuditLogsInput) => Promise<AiBudgetAuditLogPage>;
};

export type AiBudgetAdminActor = {
  userId: string;
};

export type ListAiBudgetAuditLogsInput = {
  limit?: number;
  eventType?: string;
  targetPath?: string;
  nextPageToken?: string;
};

export type AiBudgetAuditLogItem = {
  id: string;
  eventType: string | null;
  actorUserId: string | null;
  targetPath: string | null;
  reason: string | null;
  createdAt: unknown;
};

export type AiBudgetAuditLogPage = {
  items: AiBudgetAuditLogItem[];
  count: number;
  limit: number;
  nextPageToken: string | null;
  filters: {
    eventType: string | null;
    targetPath: string | null;
  };
};

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

export function createAiBudgetAdminService(deps: AiBudgetAdminDependencies) {
  async function assertPlatformAdmin(actor: AiBudgetAdminActor): Promise<void> {
    assertNonEmpty(actor.userId, "actor.userId");

    const allowed = await deps.isPlatformAdmin(actor.userId);
    if (!allowed) {
      throw new Error("Only platform admin can manage AI budget config");
    }
  }

  async function getBudgetConfigForAdmin(actor: AiBudgetAdminActor) {
    await assertPlatformAdmin(actor);
    return deps.repository.getBudgetConfig();
  }

  async function updateBudgetConfigForAdmin(
    actor: AiBudgetAdminActor,
    input: UpdateAiBudgetConfigInput
  ) {
    await assertPlatformAdmin(actor);
    return deps.repository.updateBudgetConfig(input);
  }

  async function listBudgetAuditLogsForAdmin(
    actor: AiBudgetAdminActor,
    input: ListAiBudgetAuditLogsInput = {}
  ) {
    await assertPlatformAdmin(actor);
    return deps.listBudgetAuditLogs(input);
  }

  return {
    getBudgetConfigForAdmin,
    listBudgetAuditLogsForAdmin,
    updateBudgetConfigForAdmin,
  };
}

export type AiBudgetAdminService = ReturnType<typeof createAiBudgetAdminService>;
