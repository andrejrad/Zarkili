import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Text, TouchableOpacity } from "react-native";

import type { UpdateAiBudgetConfigInput } from "../../../domains/ai";
import type { AiBudgetAdminSettingsService } from "../useAiBudgetAdminSettings";
import { useAiBudgetAdminSettings } from "../useAiBudgetAdminSettings";

type HookProbeProps = {
  userId: string | null;
  service: AiBudgetAdminSettingsService | null;
};

function HookProbe({ userId, service }: HookProbeProps) {
  const state = useAiBudgetAdminSettings(userId, service);

  return (
    <>
      <Text>error:{state.error ?? "none"}</Text>
      <Text>loading:{state.loading ? "yes" : "no"}</Text>
      <Text>audit-count:{state.auditLogs.length}</Text>
      <Text>audit-has-more:{state.auditHasMore ? "yes" : "no"}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => void state.refresh()}>
        <Text>refresh</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => void state.loadMoreAuditLogs()}>
        <Text>load-more</Text>
      </TouchableOpacity>
    </>
  );
}

function createBaseService(
  listBudgetAuditLogsForAdmin: AiBudgetAdminSettingsService["listBudgetAuditLogsForAdmin"]
): AiBudgetAdminSettingsService {
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
}

describe("useAiBudgetAdminSettings", () => {
  it("surfaces refresh errors when first audit page fetch fails", async () => {
    const listBudgetAuditLogsForAdmin = jest.fn(async () => {
      throw new Error("audit list unavailable");
    });

    const service = createBaseService(listBudgetAuditLogsForAdmin);

    render(<HookProbe userId="platform-admin-1" service={service} />);

    fireEvent.press(screen.getByText("refresh"));

    await waitFor(() => {
      expect(screen.getByText("error:audit list unavailable")).toBeTruthy();
      expect(screen.getByText("audit-count:0")).toBeTruthy();
      expect(screen.getByText("loading:no")).toBeTruthy();
    });

    expect(listBudgetAuditLogsForAdmin).toHaveBeenCalledWith(
      { userId: "platform-admin-1" },
      { limit: 10 }
    );
  });

  it("keeps existing audit logs and surfaces error when load-more fetch fails", async () => {
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
      .mockRejectedValueOnce(new Error("load-more failed"));

    const service = createBaseService(listBudgetAuditLogsForAdmin);

    render(<HookProbe userId="platform-admin-1" service={service} />);

    fireEvent.press(screen.getByText("refresh"));

    await waitFor(() => {
      expect(screen.getByText("error:none")).toBeTruthy();
      expect(screen.getByText("audit-count:1")).toBeTruthy();
      expect(screen.getByText("audit-has-more:yes")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("load-more"));

    await waitFor(() => {
      expect(screen.getByText("error:load-more failed")).toBeTruthy();
      expect(screen.getByText("audit-count:1")).toBeTruthy();
      expect(screen.getByText("audit-has-more:yes")).toBeTruthy();
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
  });
});
