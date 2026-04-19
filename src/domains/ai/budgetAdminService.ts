import type {
  AiBudgetConfigRepository,
  UpdateAiBudgetConfigInput,
} from "./budgetConfigRepository";

export type AiBudgetAdminDependencies = {
  repository: AiBudgetConfigRepository;
  isPlatformAdmin: (userId: string) => Promise<boolean>;
};

export type AiBudgetAdminActor = {
  userId: string;
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

  return {
    getBudgetConfigForAdmin,
    updateBudgetConfigForAdmin,
  };
}

export type AiBudgetAdminService = ReturnType<typeof createAiBudgetAdminService>;
