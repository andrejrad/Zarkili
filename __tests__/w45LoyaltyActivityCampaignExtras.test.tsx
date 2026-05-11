/**
 * w45LoyaltyActivityCampaignExtras.test.tsx
 *
 * W45 — Loyalty / Activity / Campaign Admin UI + Service tests
 *
 * Tests:
 *   Screens (render + interaction): LoyaltyConfigScreen, RewardCatalogScreen,
 *     PointAdjustmentScreen, LoyaltyDashboardScreen, TierMigrationScreen,
 *     ActivityCatalogScreen, ActivityAnalyticsScreen, CampaignListScreen,
 *     CampaignBuilderScreen, CampaignPerformanceScreen,
 *     TransactionalTemplateScreen, PromotionAdminScreen
 *   Services: loyaltyAdminService (12 methods), campaignAdminService (12 methods)
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { LoyaltyConfigScreen } from "../src/app/admin/LoyaltyConfigScreen";
import { RewardCatalogScreen } from "../src/app/admin/RewardCatalogScreen";
import { PointAdjustmentScreen } from "../src/app/admin/PointAdjustmentScreen";
import { LoyaltyDashboardScreen } from "../src/app/admin/LoyaltyDashboardScreen";
import { TierMigrationScreen } from "../src/app/admin/TierMigrationScreen";
import { ActivityCatalogScreen } from "../src/app/admin/ActivityCatalogScreen";
import { ActivityAnalyticsScreen } from "../src/app/admin/ActivityAnalyticsScreen";
import { CampaignListScreen } from "../src/app/admin/CampaignListScreen";
import { CampaignBuilderScreen } from "../src/app/admin/CampaignBuilderScreen";
import { CampaignPerformanceScreen } from "../src/app/admin/CampaignPerformanceScreen";
import { TransactionalTemplateScreen } from "../src/app/admin/TransactionalTemplateScreen";
import { PromotionAdminScreen } from "../src/app/admin/PromotionAdminScreen";
import { createLoyaltyAdminService } from "../src/app/admin/loyaltyAdminService";
import { createCampaignAdminService } from "../src/app/admin/campaignAdminService";
import type { LoyaltyConfigInput } from "../src/domains/loyalty/loyaltyAdminModel";
import type { CampaignBuilderInput, PromoCodeCreateInput } from "../src/domains/campaigns/campaignAdminModel";

// ---------------------------------------------------------------------------
// LoyaltyConfigScreen
// ---------------------------------------------------------------------------

describe("LoyaltyConfigScreen", () => {
  const baseConfig: LoyaltyConfigInput = {
    tenantId: "t1",
    enabled: true,
    pointsPerCurrencyUnit: 10,
    tiers: [{ tierId: "t1", name: "Bronze", minPoints: 0, maxPoints: 500, benefits: [] }],
    redemptionOptions: [],
    pointsExpiryDays: 365,
  };

  const baseProps = {
    loading: false,
    error: null,
    config: baseConfig,
    saving: false,
    saveError: null,
    saveSuccess: false,
    onToggleEnabled: jest.fn(),
    onPointsPerUnitChange: jest.fn(),
    onExpiryDaysChange: jest.fn(),
    onAddTier: jest.fn(),
    onRemoveTier: jest.fn(),
    onTierChange: jest.fn(),
    onSave: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders with testID", () => {
    const { getByTestId } = render(<LoyaltyConfigScreen {...baseProps} />);
    expect(getByTestId("loyalty-config-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<LoyaltyConfigScreen {...baseProps} loading config={null} />);
    expect(getByText("Loading loyalty config…")).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(
      <LoyaltyConfigScreen {...baseProps} loading={false} error="Fetch failed" config={null} />,
    );
    expect(getByText("Fetch failed")).toBeTruthy();
  });

  it("renders save button", () => {
    const { getByTestId } = render(<LoyaltyConfigScreen {...baseProps} />);
    expect(getByTestId("save-loyalty-config-btn")).toBeTruthy();
  });

  it("calls onSave when save pressed", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(<LoyaltyConfigScreen {...baseProps} onSave={onSave} />);
    fireEvent.press(getByTestId("save-loyalty-config-btn"));
    expect(onSave).toHaveBeenCalled();
  });

  it("calls onAddTier", () => {
    const onAddTier = jest.fn();
    const { getByTestId } = render(<LoyaltyConfigScreen {...baseProps} onAddTier={onAddTier} />);
    fireEvent.press(getByTestId("add-tier-btn"));
    expect(onAddTier).toHaveBeenCalled();
  });

  it("calls onRemoveTier with tierId", () => {
    const onRemoveTier = jest.fn();
    const { getByTestId } = render(<LoyaltyConfigScreen {...baseProps} onRemoveTier={onRemoveTier} />);
    fireEvent.press(getByTestId("tier-remove-t1"));
    expect(onRemoveTier).toHaveBeenCalledWith("t1");
  });

  it("shows saveSuccess message", () => {
    const { getByText } = render(<LoyaltyConfigScreen {...baseProps} saveSuccess />);
    expect(getByText("Saved successfully.")).toBeTruthy();
  });

  it("shows saveError message", () => {
    const { getByText } = render(<LoyaltyConfigScreen {...baseProps} saveError="Save failed" />);
    expect(getByText("Save failed")).toBeTruthy();
  });

  it("calls onBack when back pressed", () => {
    const onBack = jest.fn();
    const { getAllByText } = render(<LoyaltyConfigScreen {...baseProps} onBack={onBack} />);
    fireEvent.press(getAllByText("← Back")[0]);
    expect(onBack).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// RewardCatalogScreen
// ---------------------------------------------------------------------------

describe("RewardCatalogScreen", () => {
  const reward = {
    rewardId: "r1",
    tenantId: "t1",
    name: "Free Wash",
    pointsCost: 200,
    type: "free_service" as const,
    description: "One free wash",
    active: true,
  };

  const baseProps = {
    loading: false,
    error: null,
    rewards: [reward],
    editingRewardId: undefined as string | null | undefined,
    form: { name: "", pointsCost: 0, type: "discount" as const, description: "", active: true },
    saving: false,
    saveError: null,
    onFormChange: jest.fn(),
    onEditReward: jest.fn(),
    onDeleteReward: jest.fn(),
    onSaveReward: jest.fn(),
    onCancelEdit: jest.fn(),
    onAddNew: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders screen testID", () => {
    const { getByTestId } = render(<RewardCatalogScreen {...baseProps} />);
    expect(getByTestId("reward-catalog-screen")).toBeTruthy();
  });

  it("renders reward item", () => {
    const { getByTestId } = render(<RewardCatalogScreen {...baseProps} />);
    expect(getByTestId("reward-item-r1")).toBeTruthy();
  });

  it("calls onEditReward", () => {
    const onEditReward = jest.fn();
    const { getByTestId } = render(<RewardCatalogScreen {...baseProps} onEditReward={onEditReward} />);
    fireEvent.press(getByTestId("edit-reward-r1"));
    expect(onEditReward).toHaveBeenCalledWith("r1");
  });

  it("calls onDeleteReward", () => {
    const onDeleteReward = jest.fn();
    const { getByTestId } = render(<RewardCatalogScreen {...baseProps} onDeleteReward={onDeleteReward} />);
    fireEvent.press(getByTestId("delete-reward-r1"));
    expect(onDeleteReward).toHaveBeenCalledWith("r1");
  });

  it("calls onAddNew", () => {
    const onAddNew = jest.fn();
    const { getByTestId } = render(<RewardCatalogScreen {...baseProps} onAddNew={onAddNew} />);
    fireEvent.press(getByTestId("add-reward-btn"));
    expect(onAddNew).toHaveBeenCalled();
  });

  it("shows form when editingRewardId is null", () => {
    const { getByTestId } = render(<RewardCatalogScreen {...baseProps} editingRewardId={null} />);
    expect(getByTestId("reward-form")).toBeTruthy();
  });

  it("shows save button in form", () => {
    const { getByTestId } = render(<RewardCatalogScreen {...baseProps} editingRewardId={null} />);
    expect(getByTestId("save-reward-btn")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PointAdjustmentScreen
// ---------------------------------------------------------------------------

describe("PointAdjustmentScreen", () => {
  const baseProps = {
    clientName: "Anna Schmidt",
    clientId: "c1",
    direction: "credit" as const,
    points: "100",
    reason: "goodwill" as const,
    note: "Compensation for issue",
    saving: false,
    error: null,
    success: false,
    onDirectionChange: jest.fn(),
    onPointsChange: jest.fn(),
    onReasonChange: jest.fn(),
    onNoteChange: jest.fn(),
    onSubmit: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders screen testID", () => {
    const { getByTestId } = render(<PointAdjustmentScreen {...baseProps} />);
    expect(getByTestId("point-adjustment-screen")).toBeTruthy();
  });

  it("shows client name", () => {
    const { getByText } = render(<PointAdjustmentScreen {...baseProps} />);
    expect(getByText("Anna Schmidt")).toBeTruthy();
  });

  it("calls onSubmit", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<PointAdjustmentScreen {...baseProps} onSubmit={onSubmit} />);
    fireEvent.press(getByTestId("submit-adjustment-btn"));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("calls onDirectionChange", () => {
    const onDirectionChange = jest.fn();
    const { getByTestId } = render(<PointAdjustmentScreen {...baseProps} onDirectionChange={onDirectionChange} />);
    fireEvent.press(getByTestId("direction-debit"));
    expect(onDirectionChange).toHaveBeenCalledWith("debit");
  });

  it("calls onReasonChange", () => {
    const onReasonChange = jest.fn();
    const { getByTestId } = render(<PointAdjustmentScreen {...baseProps} onReasonChange={onReasonChange} />);
    fireEvent.press(getByTestId("reason-correction"));
    expect(onReasonChange).toHaveBeenCalledWith("correction");
  });

  it("shows success message", () => {
    const { getByText } = render(<PointAdjustmentScreen {...baseProps} success />);
    expect(getByText("Points adjusted successfully.")).toBeTruthy();
  });

  it("shows error message", () => {
    const { getByText } = render(<PointAdjustmentScreen {...baseProps} error="Adjustment failed" />);
    expect(getByText("Adjustment failed")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// LoyaltyDashboardScreen
// ---------------------------------------------------------------------------

describe("LoyaltyDashboardScreen", () => {
  const stats = {
    totalEnrolled: 400,
    activeThisMonth: 120,
    totalPointsIssued: 50000,
    totalPointsRedeemed: 12000,
    averageBalance: 200,
    tierDistribution: [{ tierId: "t1", tierName: "Bronze", count: 300 }],
    recentTransactions: [
      {
        txId: "tx1",
        clientId: "c1",
        clientName: "Anna",
        direction: "credit" as const,
        points: 50,
        reason: "visit",
        date: "2025-01-01",
      },
    ],
  };

  const baseProps = {
    loading: false,
    error: null,
    stats,
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders screen testID", () => {
    const { getByTestId } = render(<LoyaltyDashboardScreen {...baseProps} />);
    expect(getByTestId("loyalty-dashboard-screen")).toBeTruthy();
  });

  it("renders tier distribution", () => {
    const { getByTestId } = render(<LoyaltyDashboardScreen {...baseProps} />);
    expect(getByTestId("tier-dist-t1")).toBeTruthy();
  });

  it("renders recent transactions", () => {
    const { getByTestId } = render(<LoyaltyDashboardScreen {...baseProps} />);
    expect(getByTestId("tx-row-tx1")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<LoyaltyDashboardScreen {...baseProps} loading stats={null} />);
    expect(getByText("Loading dashboard…")).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(
      <LoyaltyDashboardScreen {...baseProps} error="Network error" stats={null} />,
    );
    expect(getByText("Network error")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// TierMigrationScreen
// ---------------------------------------------------------------------------

describe("TierMigrationScreen", () => {
  const preview = { customersAffected: 250, upgrades: 80, downgrades: 20, unchanged: 150 };

  const baseProps = {
    previewLoading: false,
    previewError: null,
    preview,
    reason: "Annual rebalance",
    running: false,
    runError: null,
    runSuccess: false,
    onReasonChange: jest.fn(),
    onRunMigration: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders screen testID", () => {
    const { getByTestId } = render(<TierMigrationScreen {...baseProps} />);
    expect(getByTestId("tier-migration-screen")).toBeTruthy();
  });

  it("renders migration preview", () => {
    const { getByTestId } = render(<TierMigrationScreen {...baseProps} />);
    expect(getByTestId("migration-preview")).toBeTruthy();
  });

  it("calls onRunMigration", () => {
    const onRunMigration = jest.fn();
    const { getByTestId } = render(<TierMigrationScreen {...baseProps} onRunMigration={onRunMigration} />);
    fireEvent.press(getByTestId("run-migration-btn"));
    expect(onRunMigration).toHaveBeenCalled();
  });

  it("shows runSuccess message", () => {
    const { getByText } = render(<TierMigrationScreen {...baseProps} runSuccess />);
    expect(getByText("Migration completed successfully.")).toBeTruthy();
  });

  it("shows runError message", () => {
    const { getByText } = render(<TierMigrationScreen {...baseProps} runError="Migration failed" />);
    expect(getByText("Migration failed")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ActivityCatalogScreen
// ---------------------------------------------------------------------------

describe("ActivityCatalogScreen", () => {
  const activity = {
    activityId: "a1",
    name: "Visit Streak",
    type: "visit_streak" as const,
    status: "active" as const,
    startDate: "2025-01-01",
    endDate: "2025-06-30",
    participantCount: 120,
    completionCount: 40,
  };

  const baseProps = {
    loading: false,
    error: null,
    activities: [activity],
    onViewAnalytics: jest.fn(),
    onToggleStatus: jest.fn(),
    onCreateActivity: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders screen testID", () => {
    const { getByTestId } = render(<ActivityCatalogScreen {...baseProps} />);
    expect(getByTestId("activity-catalog-screen")).toBeTruthy();
  });

  it("renders activity item", () => {
    const { getByTestId } = render(<ActivityCatalogScreen {...baseProps} />);
    expect(getByTestId("activity-item-a1")).toBeTruthy();
  });

  it("calls onViewAnalytics", () => {
    const onViewAnalytics = jest.fn();
    const { getByTestId } = render(<ActivityCatalogScreen {...baseProps} onViewAnalytics={onViewAnalytics} />);
    fireEvent.press(getByTestId("view-analytics-a1"));
    expect(onViewAnalytics).toHaveBeenCalledWith("a1");
  });

  it("calls onToggleStatus", () => {
    const onToggleStatus = jest.fn();
    const { getByTestId } = render(<ActivityCatalogScreen {...baseProps} onToggleStatus={onToggleStatus} />);
    fireEvent.press(getByTestId("toggle-status-a1"));
    expect(onToggleStatus).toHaveBeenCalledWith("a1", "active");
  });

  it("calls onCreateActivity", () => {
    const onCreateActivity = jest.fn();
    const { getByTestId } = render(<ActivityCatalogScreen {...baseProps} onCreateActivity={onCreateActivity} />);
    fireEvent.press(getByTestId("create-activity-btn"));
    expect(onCreateActivity).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ActivityAnalyticsScreen
// ---------------------------------------------------------------------------

describe("ActivityAnalyticsScreen", () => {
  const stats = {
    activityId: "a1",
    activityName: "Visit Streak",
    totalParticipants: 120,
    completedCount: 40,
    completionRate: 0.33,
    rewardsIssued: 40,
    dailyProgress: [{ date: "2025-01-01", newParticipants: 5, completions: 2 }],
  };

  const baseProps = {
    loading: false,
    error: null,
    stats,
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders screen testID", () => {
    const { getByTestId } = render(<ActivityAnalyticsScreen {...baseProps} />);
    expect(getByTestId("activity-analytics-screen")).toBeTruthy();
  });

  it("renders stats grid", () => {
    const { getByTestId } = render(<ActivityAnalyticsScreen {...baseProps} />);
    expect(getByTestId("stats-grid")).toBeTruthy();
  });

  it("renders daily progress row", () => {
    const { getByTestId } = render(<ActivityAnalyticsScreen {...baseProps} />);
    expect(getByTestId("daily-row-2025-01-01")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<ActivityAnalyticsScreen {...baseProps} loading stats={null} />);
    expect(getByText("Loading analytics…")).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(
      <ActivityAnalyticsScreen {...baseProps} error="Load failed" stats={null} />,
    );
    expect(getByText("Load failed")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// CampaignListScreen
// ---------------------------------------------------------------------------

describe("CampaignListScreen", () => {
  const campaign = {
    campaignId: "cm1",
    name: "Summer Promo",
    status: "scheduled" as const,
    channel: "email" as const,
    segmentName: "VIP clients",
    scheduledAt: "2025-07-01T09:00:00Z",
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
  };

  const baseProps = {
    loading: false,
    error: null,
    campaigns: [campaign],
    statusFilter: null as string | null,
    onStatusFilter: jest.fn(),
    onOpenCampaign: jest.fn(),
    onCreateCampaign: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders screen testID", () => {
    const { getByTestId } = render(<CampaignListScreen {...baseProps} />);
    expect(getByTestId("campaign-list-screen")).toBeTruthy();
  });

  it("renders campaign item", () => {
    const { getByTestId } = render(<CampaignListScreen {...baseProps} />);
    expect(getByTestId("campaign-item-cm1")).toBeTruthy();
  });

  it("calls onOpenCampaign when item pressed", () => {
    const onOpenCampaign = jest.fn();
    const { getByTestId } = render(<CampaignListScreen {...baseProps} onOpenCampaign={onOpenCampaign} />);
    fireEvent.press(getByTestId("campaign-item-cm1"));
    expect(onOpenCampaign).toHaveBeenCalledWith("cm1");
  });

  it("calls onCreateCampaign", () => {
    const onCreateCampaign = jest.fn();
    const { getByTestId } = render(<CampaignListScreen {...baseProps} onCreateCampaign={onCreateCampaign} />);
    fireEvent.press(getByTestId("create-campaign-btn"));
    expect(onCreateCampaign).toHaveBeenCalled();
  });

  it("calls onStatusFilter with status", () => {
    const onStatusFilter = jest.fn();
    const { getByTestId } = render(<CampaignListScreen {...baseProps} onStatusFilter={onStatusFilter} />);
    fireEvent.press(getByTestId("filter-sent"));
    expect(onStatusFilter).toHaveBeenCalledWith("sent");
  });

  it("calls onStatusFilter(null) for All chip", () => {
    const onStatusFilter = jest.fn();
    const { getByTestId } = render(<CampaignListScreen {...baseProps} onStatusFilter={onStatusFilter} />);
    fireEvent.press(getByTestId("filter-all"));
    expect(onStatusFilter).toHaveBeenCalledWith(null);
  });
});

// ---------------------------------------------------------------------------
// CampaignBuilderScreen
// ---------------------------------------------------------------------------

describe("CampaignBuilderScreen", () => {
  const form: CampaignBuilderInput = {
    tenantId: "t1",
    name: "Test Campaign",
    channel: "email",
    segmentId: "s1",
    segmentName: "All clients",
    subject: "Hello",
    body: "Message body",
    scheduledAt: "2025-09-01T10:00:00Z",
    abEnabled: false,
    abVariantB: "",
    sendTimeOptimization: false,
    createdBy: "user1",
  };

  const baseProps = {
    form,
    complianceItems: [],
    creating: false,
    createError: null,
    createSuccess: false,
    onFormChange: jest.fn(),
    onCreate: jest.fn(),
    onRunCompliance: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders screen testID", () => {
    const { getByTestId } = render(<CampaignBuilderScreen {...baseProps} />);
    expect(getByTestId("campaign-builder-screen")).toBeTruthy();
  });

  it("calls onCreate", () => {
    const onCreate = jest.fn();
    const { getByTestId } = render(<CampaignBuilderScreen {...baseProps} onCreate={onCreate} />);
    fireEvent.press(getByTestId("create-campaign-submit-btn"));
    expect(onCreate).toHaveBeenCalled();
  });

  it("calls onRunCompliance", () => {
    const onRunCompliance = jest.fn();
    const { getByTestId } = render(<CampaignBuilderScreen {...baseProps} onRunCompliance={onRunCompliance} />);
    fireEvent.press(getByTestId("run-compliance-btn"));
    expect(onRunCompliance).toHaveBeenCalled();
  });

  it("renders compliance checklist when items present", () => {
    const items = [{ itemId: "consent", label: "Consent", passed: true }];
    const { getByTestId } = render(
      <CampaignBuilderScreen {...baseProps} complianceItems={items} />,
    );
    expect(getByTestId("compliance-checklist")).toBeTruthy();
    expect(getByTestId("compliance-consent")).toBeTruthy();
  });

  it("shows createSuccess message", () => {
    const { getByText } = render(<CampaignBuilderScreen {...baseProps} createSuccess />);
    expect(getByText("Campaign created successfully.")).toBeTruthy();
  });

  it("shows email subject input for email channel", () => {
    const { getByTestId } = render(<CampaignBuilderScreen {...baseProps} />);
    expect(getByTestId("subject-input")).toBeTruthy();
  });

  it("does not show subject input for sms channel", () => {
    const { queryByTestId } = render(
      <CampaignBuilderScreen {...baseProps} form={{ ...form, channel: "sms" }} />,
    );
    expect(queryByTestId("subject-input")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// CampaignPerformanceScreen
// ---------------------------------------------------------------------------

describe("CampaignPerformanceScreen", () => {
  const detail = {
    campaignId: "cm1",
    name: "Summer Promo",
    channel: "email" as const,
    status: "sent" as const,
    scheduledAt: "2025-07-01T09:00:00Z",
    completedAt: "2025-07-01T11:00:00Z",
    metrics: {
      sent: 1000,
      delivered: 980,
      opened: 350,
      clicked: 120,
      converted: 45,
      failed: 20,
      openRate: 0.357,
      clickRate: 0.122,
      conversionRate: 0.046,
    },
    hourlyDelivery: [{ hour: "09:00", delivered: 500 }],
  };

  const baseProps = {
    loading: false,
    error: null,
    detail,
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders screen testID", () => {
    const { getByTestId } = render(<CampaignPerformanceScreen {...baseProps} />);
    expect(getByTestId("campaign-performance-screen")).toBeTruthy();
  });

  it("renders metrics grid", () => {
    const { getByTestId } = render(<CampaignPerformanceScreen {...baseProps} />);
    expect(getByTestId("metrics-grid")).toBeTruthy();
  });

  it("renders rates section", () => {
    const { getByTestId } = render(<CampaignPerformanceScreen {...baseProps} />);
    expect(getByTestId("rates-section")).toBeTruthy();
  });

  it("renders hourly delivery", () => {
    const { getByTestId } = render(<CampaignPerformanceScreen {...baseProps} />);
    expect(getByTestId("hourly-09:00")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<CampaignPerformanceScreen {...baseProps} loading detail={null} />);
    expect(getByText("Loading performance…")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// TransactionalTemplateScreen
// ---------------------------------------------------------------------------

describe("TransactionalTemplateScreen", () => {
  const defaults = [
    {
      templateType: "booking_confirmation" as const,
      channel: "email" as const,
      subject: "Confirmed",
      body: "Hi {{clientName}}, confirmed.",
      variables: ["clientName"],
    },
  ];

  const baseProps = {
    loading: false,
    error: null,
    defaults,
    overrides: [] as import("../src/domains/campaigns/campaignAdminModel").TransactionalTemplateOverride[],
    activeType: "booking_confirmation" as const,
    activeChannel: "email" as const,
    overrideBody: "",
    overrideSubject: "",
    saving: false,
    saveError: null,
    saveSuccess: false,
    onTypeChange: jest.fn(),
    onChannelChange: jest.fn(),
    onOverrideBodyChange: jest.fn(),
    onOverrideSubjectChange: jest.fn(),
    onSaveOverride: jest.fn(),
    onResetOverride: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders screen testID", () => {
    const { getByTestId } = render(<TransactionalTemplateScreen {...baseProps} />);
    expect(getByTestId("transactional-template-screen")).toBeTruthy();
  });

  it("renders type tabs", () => {
    const { getByTestId } = render(<TransactionalTemplateScreen {...baseProps} />);
    expect(getByTestId("type-tab-booking_confirmation")).toBeTruthy();
  });

  it("renders channel chips", () => {
    const { getByTestId } = render(<TransactionalTemplateScreen {...baseProps} />);
    expect(getByTestId("channel-chips")).toBeTruthy();
  });

  it("renders default preview", () => {
    const { getByTestId } = render(<TransactionalTemplateScreen {...baseProps} />);
    expect(getByTestId("default-preview")).toBeTruthy();
  });

  it("calls onTypeChange when tab pressed", () => {
    const onTypeChange = jest.fn();
    const { getByTestId } = render(<TransactionalTemplateScreen {...baseProps} onTypeChange={onTypeChange} />);
    fireEvent.press(getByTestId("type-tab-no_show"));
    expect(onTypeChange).toHaveBeenCalledWith("no_show");
  });

  it("calls onSaveOverride", () => {
    const onSaveOverride = jest.fn();
    const { getByTestId } = render(<TransactionalTemplateScreen {...baseProps} onSaveOverride={onSaveOverride} />);
    fireEvent.press(getByTestId("save-override-btn"));
    expect(onSaveOverride).toHaveBeenCalled();
  });

  it("shows success message", () => {
    const { getByText } = render(<TransactionalTemplateScreen {...baseProps} saveSuccess />);
    expect(getByText("Override saved.")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PromotionAdminScreen
// ---------------------------------------------------------------------------

describe("PromotionAdminScreen", () => {
  const promoCode = {
    codeId: "pc1",
    tenantId: "t1",
    code: "SUMMER25",
    type: "percent" as const,
    value: 25,
    description: "Summer discount",
    status: "active" as const,
    applicableServiceIds: [],
    validFrom: "2025-06-01",
    validUntil: "2025-08-31",
    maxUses: 500,
    perClientCap: 1,
    usesCount: 120,
    createdBy: "admin1",
    createdAt: "2025-05-01",
  };

  const form: PromoCodeCreateInput = {
    tenantId: "t1",
    code: "",
    type: "percent",
    value: 0,
    description: "",
    validFrom: "",
    validUntil: null,
    maxUses: null,
    perClientCap: null,
    createdBy: "admin1",
  };

  const baseProps = {
    loading: false,
    error: null,
    codes: [promoCode],
    statusFilter: null as import("../src/domains/campaigns/campaignAdminModel").PromoCodeStatus | null,
    showCreateForm: false,
    form,
    creating: false,
    createError: null,
    onStatusFilter: jest.fn(),
    onToggleCreateForm: jest.fn(),
    onFormChange: jest.fn(),
    onCreateCode: jest.fn(),
    onUpdateStatus: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
  };

  it("renders screen testID", () => {
    const { getByTestId } = render(<PromotionAdminScreen {...baseProps} />);
    expect(getByTestId("promotion-admin-screen")).toBeTruthy();
  });

  it("renders promo code item", () => {
    const { getByTestId } = render(<PromotionAdminScreen {...baseProps} />);
    expect(getByTestId("promo-item-pc1")).toBeTruthy();
  });

  it("shows pause button for active code", () => {
    const { getByTestId } = render(<PromotionAdminScreen {...baseProps} />);
    expect(getByTestId("pause-pc1")).toBeTruthy();
  });

  it("calls onUpdateStatus with paused", () => {
    const onUpdateStatus = jest.fn();
    const { getByTestId } = render(<PromotionAdminScreen {...baseProps} onUpdateStatus={onUpdateStatus} />);
    fireEvent.press(getByTestId("pause-pc1"));
    expect(onUpdateStatus).toHaveBeenCalledWith("pc1", "paused");
  });

  it("shows create form when showCreateForm true", () => {
    const { getByTestId } = render(<PromotionAdminScreen {...baseProps} showCreateForm />);
    expect(getByTestId("create-promo-form")).toBeTruthy();
  });

  it("calls onCreateCode", () => {
    const onCreateCode = jest.fn();
    const { getByTestId } = render(
      <PromotionAdminScreen {...baseProps} showCreateForm onCreateCode={onCreateCode} />,
    );
    fireEvent.press(getByTestId("create-code-btn"));
    expect(onCreateCode).toHaveBeenCalled();
  });

  it("calls onToggleCreateForm", () => {
    const onToggleCreateForm = jest.fn();
    const { getByTestId } = render(<PromotionAdminScreen {...baseProps} onToggleCreateForm={onToggleCreateForm} />);
    fireEvent.press(getByTestId("toggle-create-btn"));
    expect(onToggleCreateForm).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// loyaltyAdminService — unit tests
// ---------------------------------------------------------------------------

describe("loyaltyAdminService — no repos", () => {
  const svc = createLoyaltyAdminService();

  it("loadLoyaltyConfig returns not configured", async () => {
    const r = await svc.loadLoyaltyConfig("t1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("not configured");
  });

  it("saveLoyaltyConfig returns not configured", async () => {
    const r = await svc.saveLoyaltyConfig({ tenantId: "t1", enabled: true, pointsPerCurrencyUnit: 10, tiers: [], redemptionOptions: [], pointsExpiryDays: null });
    expect(r.ok).toBe(false);
  });

  it("listRewards returns not configured", async () => {
    const r = await svc.listRewards("t1");
    expect(r.ok).toBe(false);
  });

  it("saveReward returns not configured", async () => {
    const r = await svc.saveReward(null, "t1", { name: "X", pointsCost: 100, type: "discount", description: "", active: true });
    expect(r.ok).toBe(false);
  });

  it("deleteReward returns not configured", async () => {
    const r = await svc.deleteReward("r1", "t1");
    expect(r.ok).toBe(false);
  });

  it("adjustPoints validates points > 0", async () => {
    const r = await svc.adjustPoints({ tenantId: "t1", clientId: "c1", clientName: "A", direction: "credit", points: 0, reason: "goodwill", note: "ok", performedBy: "admin" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("greater than zero");
  });

  it("adjustPoints validates non-empty note", async () => {
    const r = await svc.adjustPoints({ tenantId: "t1", clientId: "c1", clientName: "A", direction: "credit", points: 10, reason: "goodwill", note: "   ", performedBy: "admin" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("note");
  });

  it("adjustPoints no-repo returns not configured after validation passes", async () => {
    const r = await svc.adjustPoints({ tenantId: "t1", clientId: "c1", clientName: "A", direction: "credit", points: 10, reason: "goodwill", note: "valid note", performedBy: "admin" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("not configured");
  });

  it("loadProgramStats returns not configured", async () => {
    const r = await svc.loadProgramStats("t1");
    expect(r.ok).toBe(false);
  });

  it("previewTierMigration returns not configured", async () => {
    const r = await svc.previewTierMigration("t1");
    expect(r.ok).toBe(false);
  });

  it("runTierMigration validates non-empty reason", async () => {
    const r = await svc.runTierMigration({ tenantId: "t1", reason: "", performedBy: "admin" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("reason");
  });

  it("listActivities returns not configured", async () => {
    const r = await svc.listActivities("t1");
    expect(r.ok).toBe(false);
  });

  it("saveActivity returns not configured", async () => {
    const r = await svc.saveActivity("t1", { tenantId: "t1", name: "X", type: "visit_streak", startDate: "2025-01-01", endDate: "2025-06-30", ruleTargetValue: 5, ruleWindowDays: 30, rewardType: "points", rewardValue: 50, rewardDescription: "50 pts", createdBy: "admin" });
    expect(r.ok).toBe(false);
  });

  it("loadActivityStats returns not configured", async () => {
    const r = await svc.loadActivityStats("a1", "t1");
    expect(r.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// campaignAdminService — unit tests
// ---------------------------------------------------------------------------

describe("campaignAdminService — no repos", () => {
  const svc = createCampaignAdminService();

  it("listCampaigns returns not configured", async () => {
    const r = await svc.listCampaigns("t1");
    expect(r.ok).toBe(false);
  });

  it("loadCampaignPerformance returns not configured", async () => {
    const r = await svc.loadCampaignPerformance("cm1", "t1");
    expect(r.ok).toBe(false);
  });

  it("createCampaign validates name", async () => {
    const input: CampaignBuilderInput = { tenantId: "t1", name: "", channel: "email", segmentId: "s1", segmentName: "S", body: "Body", scheduledAt: "", abEnabled: false, sendTimeOptimization: false, createdBy: "u1" };
    const r = await svc.createCampaign(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("name");
  });

  it("createCampaign validates segmentId", async () => {
    const input: CampaignBuilderInput = { tenantId: "t1", name: "Test", channel: "email", segmentId: "", segmentName: "S", body: "Body", scheduledAt: "", abEnabled: false, sendTimeOptimization: false, createdBy: "u1" };
    const r = await svc.createCampaign(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("Segment");
  });

  it("createCampaign validates body", async () => {
    const input: CampaignBuilderInput = { tenantId: "t1", name: "Test", channel: "email", segmentId: "s1", segmentName: "S", body: "", scheduledAt: "", abEnabled: false, sendTimeOptimization: false, createdBy: "u1" };
    const r = await svc.createCampaign(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("body");
  });

  it("updateCampaignStatus returns not configured", async () => {
    const r = await svc.updateCampaignStatus("cm1", "t1", "paused");
    expect(r.ok).toBe(false);
  });

  it("runComplianceCheck passes with valid input", () => {
    const input: CampaignBuilderInput = {
      tenantId: "t1", name: "T", channel: "email", segmentId: "s1", segmentName: "S",
      subject: "Hi", body: "Body", scheduledAt: "", abEnabled: false, sendTimeOptimization: false, createdBy: "u1",
    };
    const r = svc.runComplianceCheck(input);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const allPassed = r.data.every((i) => i.passed);
      expect(allPassed).toBe(true);
    }
  });

  it("runComplianceCheck fails when email lacks subject", () => {
    const input: CampaignBuilderInput = {
      tenantId: "t1", name: "T", channel: "email", segmentId: "s1", segmentName: "S",
      subject: "", body: "Body", scheduledAt: "", abEnabled: false, sendTimeOptimization: false, createdBy: "u1",
    };
    const r = svc.runComplianceCheck(input);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const subjectItem = r.data.find((i) => i.itemId === "subject");
      expect(subjectItem?.passed).toBe(false);
    }
  });

  it("loadTransactionalDefaults returns 18 entries (6 types × 3 channels)", () => {
    const r = svc.loadTransactionalDefaults();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(18);
  });

  it("listTransactionalOverrides returns not configured", async () => {
    const r = await svc.listTransactionalOverrides("t1");
    expect(r.ok).toBe(false);
  });

  it("saveTransactionalOverride validates non-empty body", async () => {
    const r = await svc.saveTransactionalOverride(null, {
      tenantId: "t1", templateType: "booking_confirmation", channel: "email",
      body: "", variables: [], isActive: true, updatedAt: "2025-01-01",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("body");
  });

  it("deleteTransactionalOverride returns not configured", async () => {
    const r = await svc.deleteTransactionalOverride("o1", "t1");
    expect(r.ok).toBe(false);
  });

  it("listPromoCodes returns not configured", async () => {
    const r = await svc.listPromoCodes("t1");
    expect(r.ok).toBe(false);
  });

  it("createPromoCode validates non-empty code", async () => {
    const input: PromoCodeCreateInput = { tenantId: "t1", code: "", type: "percent", value: 25, description: "", validFrom: "2025-01-01", validUntil: null, maxUses: null, perClientCap: null, createdBy: "admin" };
    const r = await svc.createPromoCode(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("empty");
  });

  it("createPromoCode validates value > 0", async () => {
    const input: PromoCodeCreateInput = { tenantId: "t1", code: "PROMO", type: "percent", value: 0, description: "", validFrom: "2025-01-01", validUntil: null, maxUses: null, perClientCap: null, createdBy: "admin" };
    const r = await svc.createPromoCode(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("greater than zero");
  });

  it("updatePromoCodeStatus returns not configured", async () => {
    const r = await svc.updatePromoCodeStatus("pc1", "t1", "paused");
    expect(r.ok).toBe(false);
  });
});
