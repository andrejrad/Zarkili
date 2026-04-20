import { createAiBudgetAdminService } from "../budgetAdminService";
import type { AiBudgetConfigRepository } from "../budgetConfigRepository";

describe("AiBudgetAdminService", () => {
  function createAuditPageMock() {
    return {
      items: [
        {
          id: "log-1",
          eventType: "ai_budget_config_update",
          actorUserId: "owner1",
          targetPath: "platform/config",
          reason: "manual update",
          createdAt: "ts-1",
        },
      ],
      count: 1,
      limit: 20,
      nextPageToken: null,
      filters: {
        eventType: "ai_budget_config_update",
        targetPath: "platform/config",
      },
    };
  }

  function createRepositoryMock(): jest.Mocked<AiBudgetConfigRepository> {
    return {
      getBudgetConfig: jest.fn(async () => ({
        globalMonthlyCapUsd: 1090,
        warningThreshold: 0.7,
        protectionThreshold: 0.9,
        featureCaps: {
          "content-creation": { monthlyCapUsd: 120 },
          "marketing-orchestration": { monthlyCapUsd: 180 },
          "service-recommendations": { monthlyCapUsd: 140 },
          "scheduling-optimization": { monthlyCapUsd: 180 },
          "retention-insights": { monthlyCapUsd: 150 },
          "support-triage": { monthlyCapUsd: 120 },
          "no-show-fraud": { monthlyCapUsd: 110 },
          "marketplace-personalization": { monthlyCapUsd: 90 },
        },
      })),
      updateBudgetConfig: jest.fn(async (input) => ({
        globalMonthlyCapUsd: input.globalMonthlyCapUsd ?? 1090,
        warningThreshold: input.warningThreshold ?? 0.7,
        protectionThreshold: input.protectionThreshold ?? 0.9,
        featureCaps: {
          "content-creation": { monthlyCapUsd: 120 },
          "marketing-orchestration": { monthlyCapUsd: 180 },
          "service-recommendations": { monthlyCapUsd: 140 },
          "scheduling-optimization": { monthlyCapUsd: 180 },
          "retention-insights": { monthlyCapUsd: 150 },
          "support-triage": {
            monthlyCapUsd: input.featureCaps?.["support-triage"]?.monthlyCapUsd ?? 120,
          },
          "no-show-fraud": { monthlyCapUsd: 110 },
          "marketplace-personalization": { monthlyCapUsd: 90 },
        },
      })),
    };
  }

  it("allows platform admin to read budget config", async () => {
    const repository = createRepositoryMock();
    const listBudgetAuditLogs = jest.fn(async () => createAuditPageMock());
    const service = createAiBudgetAdminService({
      repository,
      isPlatformAdmin: async () => true,
      listBudgetAuditLogs,
    });

    const result = await service.getBudgetConfigForAdmin({ userId: "owner1" });

    expect(repository.getBudgetConfig).toHaveBeenCalledTimes(1);
    expect(result.globalMonthlyCapUsd).toBe(1090);
  });

  it("rejects non-admin actor for read", async () => {
    const repository = createRepositoryMock();
    const listBudgetAuditLogs = jest.fn(async () => createAuditPageMock());
    const service = createAiBudgetAdminService({
      repository,
      isPlatformAdmin: async () => false,
      listBudgetAuditLogs,
    });

    await expect(
      service.getBudgetConfigForAdmin({ userId: "regular-user" })
    ).rejects.toThrow("Only platform admin can manage AI budget config");

    expect(repository.getBudgetConfig).not.toHaveBeenCalled();
  });

  it("allows platform admin to update config", async () => {
    const repository = createRepositoryMock();
    const listBudgetAuditLogs = jest.fn(async () => createAuditPageMock());
    const service = createAiBudgetAdminService({
      repository,
      isPlatformAdmin: async () => true,
      listBudgetAuditLogs,
    });

    const result = await service.updateBudgetConfigForAdmin(
      { userId: "owner1" },
      {
        featureCaps: {
          "support-triage": { monthlyCapUsd: 160 },
        },
      }
    );

    expect(repository.updateBudgetConfig).toHaveBeenCalledTimes(1);
    expect(result.featureCaps["support-triage"].monthlyCapUsd).toBe(160);
  });

  it("rejects blank actor id", async () => {
    const repository = createRepositoryMock();
    const listBudgetAuditLogs = jest.fn(async () => createAuditPageMock());
    const service = createAiBudgetAdminService({
      repository,
      isPlatformAdmin: async () => true,
      listBudgetAuditLogs,
    });

    await expect(
      service.updateBudgetConfigForAdmin({ userId: " " }, { globalMonthlyCapUsd: 1500 })
    ).rejects.toThrow("actor.userId is required");

    expect(repository.updateBudgetConfig).not.toHaveBeenCalled();
  });

  it("allows platform admin to list audit logs", async () => {
    const repository = createRepositoryMock();
    const listBudgetAuditLogs = jest.fn(async () => createAuditPageMock());
    const service = createAiBudgetAdminService({
      repository,
      isPlatformAdmin: async () => true,
      listBudgetAuditLogs,
    });

    const result = await service.listBudgetAuditLogsForAdmin(
      { userId: "owner1" },
      { limit: 10, eventType: "ai_budget_config_update" }
    );

    expect(listBudgetAuditLogs).toHaveBeenCalledWith({
      limit: 10,
      eventType: "ai_budget_config_update",
    });
    expect(result.count).toBe(1);
  });

  it("rejects non-admin actor for audit log listing", async () => {
    const repository = createRepositoryMock();
    const listBudgetAuditLogs = jest.fn(async () => createAuditPageMock());
    const service = createAiBudgetAdminService({
      repository,
      isPlatformAdmin: async () => false,
      listBudgetAuditLogs,
    });

    await expect(
      service.listBudgetAuditLogsForAdmin({ userId: "regular-user" }, { limit: 10 })
    ).rejects.toThrow("Only platform admin can manage AI budget config");

    expect(listBudgetAuditLogs).not.toHaveBeenCalled();
  });
});
