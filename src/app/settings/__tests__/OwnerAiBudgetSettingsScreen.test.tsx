import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type {
  AiBudgetAdminService,
  ListAiBudgetAuditLogsInput,
  UpdateAiBudgetConfigInput,
} from "../../../domains/ai";
import { OwnerAiBudgetSettingsScreen } from "../OwnerAiBudgetSettingsScreen";

describe("OwnerAiBudgetSettingsScreen", () => {
  function createServiceMock(): AiBudgetAdminService {
    return {
      getBudgetConfigForAdmin: jest.fn(async () => ({
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
      listBudgetAuditLogsForAdmin: jest
        .fn()
        .mockResolvedValueOnce({
          items: [
            {
              id: "log-1",
              eventType: "ai_budget_config_update",
              actorUserId: "platform-admin-1",
              targetPath: "platform/config",
              reason: "initial setup",
              createdAt: "2026-04-20T08:00:00.000Z",
            },
          ],
          count: 1,
          limit: 10,
          nextPageToken: "log-1",
          filters: {
            eventType: null,
            targetPath: null,
          },
        })
        .mockResolvedValueOnce({
          items: [
            {
              id: "log-2",
              eventType: "ai_budget_config_update",
              actorUserId: "platform-admin-2",
              targetPath: "platform/config",
              reason: "monthly adjustment",
              createdAt: "2026-04-20T09:00:00.000Z",
            },
          ],
          count: 1,
          limit: 10,
          nextPageToken: null,
          filters: {
            eventType: null,
            targetPath: null,
          },
        }),
      updateBudgetConfigForAdmin: jest.fn(async (_actor: { userId: string }, input: UpdateAiBudgetConfigInput) => ({
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

  it("loads and paginates audit history from owner settings", async () => {
    const service = createServiceMock();

    render(
      <OwnerAiBudgetSettingsScreen
        userId="platform-admin-1"
        service={service}
        onBack={() => undefined}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Global cap USD: 1090")).toBeTruthy();
      expect(screen.getByText("Reason: initial setup")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Load more audit events"));

    await waitFor(() => {
      expect(screen.getByText("Reason: monthly adjustment")).toBeTruthy();
    });

    const listAuditLogsMock = service.listBudgetAuditLogsForAdmin as jest.MockedFunction<
      (actor: { userId: string }, input: ListAiBudgetAuditLogsInput) => Promise<unknown>
    >;

    expect(listAuditLogsMock).toHaveBeenNthCalledWith(
      1,
      { userId: "platform-admin-1" },
      { limit: 10 }
    );
    expect(listAuditLogsMock).toHaveBeenNthCalledWith(
      2,
      { userId: "platform-admin-1" },
      { limit: 10, nextPageToken: "log-1" }
    );
  });

  it("shows empty audit history state when first page has no items", async () => {
    const service: AiBudgetAdminService = {
      getBudgetConfigForAdmin: jest.fn(async () => ({
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
      listBudgetAuditLogsForAdmin: jest.fn(async () => ({
        items: [],
        count: 0,
        limit: 10,
        nextPageToken: null,
        filters: {
          eventType: null,
          targetPath: null,
        },
      })),
      updateBudgetConfigForAdmin: jest.fn(async (_actor: { userId: string }, input: UpdateAiBudgetConfigInput) => ({
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

    render(
      <OwnerAiBudgetSettingsScreen
        userId="platform-admin-1"
        service={service}
        onBack={() => undefined}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("No audit events yet.")).toBeTruthy();
    });

    expect(screen.queryByText("Load more audit events")).toBeNull();
  });

  it("re-fetches budget config and first-page audit logs when refresh is pressed", async () => {
    const getBudgetConfigForAdmin = jest.fn(async () => ({
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
    }));

    const listBudgetAuditLogsForAdmin = jest.fn(async () => ({
      items: [],
      count: 0,
      limit: 10,
      nextPageToken: null,
      filters: {
        eventType: null,
        targetPath: null,
      },
    }));

    const service: AiBudgetAdminService = {
      getBudgetConfigForAdmin,
      listBudgetAuditLogsForAdmin,
      updateBudgetConfigForAdmin: jest.fn(async (_actor: { userId: string }, input: UpdateAiBudgetConfigInput) => ({
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

    render(
      <OwnerAiBudgetSettingsScreen
        userId="platform-admin-1"
        service={service}
        onBack={() => undefined}
      />
    );

    await waitFor(() => {
      expect(getBudgetConfigForAdmin).toHaveBeenCalledTimes(1);
      expect(listBudgetAuditLogsForAdmin).toHaveBeenCalledTimes(1);
    });

    fireEvent.press(screen.getByText("Refresh budget config"));

    await waitFor(() => {
      expect(getBudgetConfigForAdmin).toHaveBeenCalledTimes(2);
      expect(listBudgetAuditLogsForAdmin).toHaveBeenCalledTimes(2);
    });

    expect(listBudgetAuditLogsForAdmin).toHaveBeenNthCalledWith(
      1,
      { userId: "platform-admin-1" },
      { limit: 10 }
    );
    expect(listBudgetAuditLogsForAdmin).toHaveBeenNthCalledWith(
      2,
      { userId: "platform-admin-1" },
      { limit: 10 }
    );
  });

  it("clears load-more error after refresh succeeds", async () => {
    const getBudgetConfigForAdmin = jest.fn(async () => ({
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
    }));

    const listBudgetAuditLogsForAdmin = jest
      .fn()
      .mockResolvedValueOnce({
        items: [
          {
            id: "log-1",
            eventType: "ai_budget_config_update",
            actorUserId: "platform-admin-1",
            targetPath: "platform/config",
            reason: "initial setup",
            createdAt: "2026-04-20T08:00:00.000Z",
          },
        ],
        count: 1,
        limit: 10,
        nextPageToken: "log-1",
        filters: {
          eventType: null,
          targetPath: null,
        },
      })
      .mockRejectedValueOnce(new Error("load-more failed"))
      .mockResolvedValueOnce({
        items: [
          {
            id: "log-1",
            eventType: "ai_budget_config_update",
            actorUserId: "platform-admin-1",
            targetPath: "platform/config",
            reason: "initial setup",
            createdAt: "2026-04-20T08:00:00.000Z",
          },
        ],
        count: 1,
        limit: 10,
        nextPageToken: null,
        filters: {
          eventType: null,
          targetPath: null,
        },
      });

    const service: AiBudgetAdminService = {
      getBudgetConfigForAdmin,
      listBudgetAuditLogsForAdmin,
      updateBudgetConfigForAdmin: jest.fn(async (_actor: { userId: string }, input: UpdateAiBudgetConfigInput) => ({
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

    render(
      <OwnerAiBudgetSettingsScreen
        userId="platform-admin-1"
        service={service}
        onBack={() => undefined}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Reason: initial setup")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Load more audit events"));

    await waitFor(() => {
      expect(screen.getByText("load-more failed")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Refresh budget config"));

    await waitFor(() => {
      expect(screen.queryByText("load-more failed")).toBeNull();
    });

    expect(listBudgetAuditLogsForAdmin).toHaveBeenNthCalledWith(
      1,
      { userId: "platform-admin-1" },
      { limit: 10 }
    );
    expect(listBudgetAuditLogsForAdmin).toHaveBeenNthCalledWith(
      2,
      { userId: "platform-admin-1" },
      { limit: 10, nextPageToken: "log-1" }
    );
    expect(listBudgetAuditLogsForAdmin).toHaveBeenNthCalledWith(
      3,
      { userId: "platform-admin-1" },
      { limit: 10 }
    );
  });
});
