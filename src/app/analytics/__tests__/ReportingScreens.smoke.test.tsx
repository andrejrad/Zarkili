import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ReportingDashboardScreen } from "../ReportingScreens";
import { CampaignAnalyticsScreen } from "../ReportingScreens";
import type { TenantAnalyticsContext, ClientRiskEntry, CampaignKpis, ChallengeKpis } from "../../../domains/analytics/model";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROFESSIONAL_CONTEXT: TenantAnalyticsContext = {
  tenantId: "t1",
  subscriptionTier: "professional",
  accessibleReports: [
    "retention",
    "rebooking",
    "at_risk",
    "visit_interval",
    "staff_performance",
    "service_performance",
    "campaign_analytics",
    "challenge_analytics",
  ],
};

const BASE_DASHBOARD_PROPS = {
  analyticsContext: PROFESSIONAL_CONTEXT,
  retention: { totalUniqueClients: 20, retainedClients: 14, retentionRate: 0.7 },
  rebooking: { totalUniqueClients: 20, rebookedClients: 12, rebookingRate: 0.6 },
  atRisk: { atRiskClients: 3, thresholdDays: 60 },
  visitInterval: { avgDaysBetweenVisits: 28, medianDaysBetweenVisits: 25 },
  staffPerformance: [
    { staffId: "s1", completedBookings: 40, noShowCount: 2, cancellationCount: 1, noShowRate: 0.047 },
  ],
  servicePerformance: [
    { serviceId: "svc1", completedBookings: 30, cancellationCount: 2, popularityRank: 1 },
  ],
  clientAttentionList: [] as ClientRiskEntry[],
  isLoading: false,
  errorMessage: null,
  dateRangeLabel: "Jan–Apr 2026",
  onChangeDateRange: jest.fn(),
  locationLabel: "All Locations",
  onChangeLocation: jest.fn(),
  onRetry: jest.fn(),
  onBack: jest.fn(),
  onClientAction: jest.fn(),
};

// ---------------------------------------------------------------------------
// ReportingDashboardScreen
// ---------------------------------------------------------------------------

describe("ReportingDashboardScreen", () => {
  it("renders loading state", () => {
    const { getByText } = render(
      <ReportingDashboardScreen {...BASE_DASHBOARD_PROPS} isLoading />,
    );
    expect(getByText(/loading analytics/i)).toBeTruthy();
  });

  it("renders error message with Retry button", () => {
    const { getByText } = render(
      <ReportingDashboardScreen
        {...BASE_DASHBOARD_PROPS}
        errorMessage="Failed to load data"
      />,
    );
    expect(getByText("Failed to load data")).toBeTruthy();
    expect(getByText("Retry")).toBeTruthy();
  });

  it("calls onRetry when Retry pressed", () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ReportingDashboardScreen
        {...BASE_DASHBOARD_PROPS}
        errorMessage="Error"
        onRetry={onRetry}
      />,
    );
    fireEvent.press(getByText("Retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when Back pressed", () => {
    const onBack = jest.fn();
    const { getByText } = render(
      <ReportingDashboardScreen {...BASE_DASHBOARD_PROPS} onBack={onBack} />,
    );
    fireEvent.press(getByText("← Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders KPI cards for retention and rebooking", () => {
    const { getByText } = render(
      <ReportingDashboardScreen {...BASE_DASHBOARD_PROPS} />,
    );
    expect(getByText("Retention Rate")).toBeTruthy();
    expect(getByText("70%")).toBeTruthy();
    expect(getByText("Rebooking Rate")).toBeTruthy();
    expect(getByText("60%")).toBeTruthy();
  });

  it("renders at-risk KPI", () => {
    const { getByText } = render(
      <ReportingDashboardScreen {...BASE_DASHBOARD_PROPS} />,
    );
    expect(getByText("At-Risk Clients")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
  });

  it("renders avg visit interval", () => {
    const { getByText } = render(
      <ReportingDashboardScreen {...BASE_DASHBOARD_PROPS} />,
    );
    expect(getByText("Avg Visit Interval")).toBeTruthy();
    expect(getByText("28d")).toBeTruthy();
  });

  it("renders staff performance section", () => {
    const { getByText } = render(
      <ReportingDashboardScreen {...BASE_DASHBOARD_PROPS} />,
    );
    expect(getByText("Staff Performance")).toBeTruthy();
    expect(getByText("40 completed")).toBeTruthy();
  });

  it("renders service performance section", () => {
    const { getByText } = render(
      <ReportingDashboardScreen {...BASE_DASHBOARD_PROPS} />,
    );
    expect(getByText("Service Performance")).toBeTruthy();
    expect(getByText("30 bookings")).toBeTruthy();
  });

  it("renders client attention list entries", () => {
    const clients: ClientRiskEntry[] = [
      {
        userId: "user-abc",
        lastVisitDate: "2026-01-01",
        daysSinceLastVisit: 91,
        riskLevel: "high",
        totalVisits: 3,
      },
    ];
    const { getByText } = render(
      <ReportingDashboardScreen
        {...BASE_DASHBOARD_PROPS}
        clientAttentionList={clients}
      />,
    );
    expect(getByText("user-abc")).toBeTruthy();
    expect(getByText("HIGH")).toBeTruthy();
  });

  it("calls onClientAction with userId when Contact pressed", () => {
    const onClientAction = jest.fn();
    const clients: ClientRiskEntry[] = [
      {
        userId: "user-xyz",
        lastVisitDate: "2026-01-01",
        daysSinceLastVisit: 91,
        riskLevel: "high",
        totalVisits: 2,
      },
    ];
    const { getByText } = render(
      <ReportingDashboardScreen
        {...BASE_DASHBOARD_PROPS}
        clientAttentionList={clients}
        onClientAction={onClientAction}
      />,
    );
    fireEvent.press(getByText("Contact"));
    expect(onClientAction).toHaveBeenCalledWith("user-xyz");
  });

  it("shows date range label and Change button", () => {
    const { getByText } = render(
      <ReportingDashboardScreen {...BASE_DASHBOARD_PROPS} />,
    );
    expect(getByText(/Jan–Apr 2026/)).toBeTruthy();
  });

  it("calls onChangeDateRange when date Change pressed", () => {
    const onChangeDateRange = jest.fn();
    const { getByTestId } = render(
      <ReportingDashboardScreen
        {...BASE_DASHBOARD_PROPS}
        onChangeDateRange={onChangeDateRange}
      />,
    );
    fireEvent.press(getByTestId("date-filter-change"));
    expect(onChangeDateRange).toHaveBeenCalledTimes(1);
  });

  it("renders location filter label", () => {
    const { getByText } = render(
      <ReportingDashboardScreen {...BASE_DASHBOARD_PROPS} locationLabel="Salon HQ" />,
    );
    expect(getByText(/Location: Salon HQ/)).toBeTruthy();
  });

  it("calls onChangeLocation when location Change pressed", () => {
    const onChangeLocation = jest.fn();
    const { getByTestId } = render(
      <ReportingDashboardScreen
        {...BASE_DASHBOARD_PROPS}
        onChangeLocation={onChangeLocation}
      />,
    );
    fireEvent.press(getByTestId("location-filter-change"));
    expect(onChangeLocation).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// CampaignAnalyticsScreen
// ---------------------------------------------------------------------------

const CAMPAIGN_KPI: CampaignKpis = {
  campaignId: "cmp1",
  name: "Spring promo",
  channel: "email",
  sent: 100,
  delivered: 90,
  opened: 45,
  clicked: 20,
  converted: 5,
  failed: 10,
  openRate: 0.5,
  clickRate: 0.22,
  conversionRate: 0.2,
};

const CHALLENGE_KPI: ChallengeKpis = {
  activityId: "act1",
  name: "3-visit streak",
  participants: 50,
  completed: 20,
  completionRate: 0.4,
  rewardsAwarded: 18,
};

const BASE_CAMPAIGN_PROPS = {
  campaignKpis: [] as CampaignKpis[],
  challengeKpis: [] as ChallengeKpis[],
  isLoading: false,
  errorMessage: null,
  onRetry: jest.fn(),
  onBack: jest.fn(),
};

describe("CampaignAnalyticsScreen", () => {
  it("renders loading state", () => {
    const { getByText } = render(
      <CampaignAnalyticsScreen {...BASE_CAMPAIGN_PROPS} isLoading />,
    );
    expect(getByText(/loading campaign data/i)).toBeTruthy();
  });

  it("renders empty campaign message when no campaigns", () => {
    const { getByText } = render(
      <CampaignAnalyticsScreen {...BASE_CAMPAIGN_PROPS} />,
    );
    expect(getByText(/no campaigns found/i)).toBeTruthy();
  });

  it("renders campaign name and open rate", () => {
    const { getByText } = render(
      <CampaignAnalyticsScreen
        {...BASE_CAMPAIGN_PROPS}
        campaignKpis={[CAMPAIGN_KPI]}
      />,
    );
    expect(getByText("Spring promo")).toBeTruthy();
    expect(getByText("50%")).toBeTruthy(); // openRate
  });

  it("renders challenge name and completion rate", () => {
    const { getByText } = render(
      <CampaignAnalyticsScreen
        {...BASE_CAMPAIGN_PROPS}
        challengeKpis={[CHALLENGE_KPI]}
      />,
    );
    expect(getByText("3-visit streak")).toBeTruthy();
    expect(getByText("40%")).toBeTruthy(); // completionRate
  });

  it("calls onBack when Back pressed", () => {
    const onBack = jest.fn();
    const { getByText } = render(
      <CampaignAnalyticsScreen {...BASE_CAMPAIGN_PROPS} onBack={onBack} />,
    );
    fireEvent.press(getByText("← Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders error and calls onRetry", () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <CampaignAnalyticsScreen
        {...BASE_CAMPAIGN_PROPS}
        errorMessage="Load failed"
        onRetry={onRetry}
      />,
    );
    expect(getByText("Load failed")).toBeTruthy();
    fireEvent.press(getByText("Retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
