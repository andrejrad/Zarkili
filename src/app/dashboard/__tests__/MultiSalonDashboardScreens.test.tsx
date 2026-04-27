import { fireEvent, render, screen } from "@testing-library/react-native";

import { MultiSalonDashboardScreen } from "../MultiSalonDashboardScreens";
import type { SalonSummary } from "../unreadAggregationService";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSummary(overrides: Partial<SalonSummary> = {}): SalonSummary {
  return {
    tenantId: "tA",
    tenantName: "Alpha Salon",
    logoUrl: null,
    unreadMessageCount: 0,
    subscriptionStatus: "active",
    accessLevel: "owner",
    nextAppointmentAt: null,
    nextAppointmentServiceName: null,
    ...overrides,
  };
}

function defaultProps(overrides: Record<string, unknown> = {}) {
  return {
    summaries: [],
    isLoading: false,
    error: null,
    unreadFailed: false,
    onRetry: jest.fn(),
    onOpenMarketplace: jest.fn(),
    onSelectSalon: jest.fn(),
    onQuickAction: jest.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Root + loading state
// ---------------------------------------------------------------------------

describe("MultiSalonDashboardScreen — root", () => {
  it("renders screen root testID", () => {
    render(<MultiSalonDashboardScreen {...defaultProps()} />);
    expect(screen.getByTestId("multi-salon-dashboard")).toBeTruthy();
  });

  it("renders scroll view", () => {
    render(<MultiSalonDashboardScreen {...defaultProps()} />);
    expect(screen.getByTestId("dashboard-scroll")).toBeTruthy();
  });
});

describe("MultiSalonDashboardScreen — loading state", () => {
  it("shows loading indicator when isLoading is true", () => {
    render(<MultiSalonDashboardScreen {...defaultProps({ isLoading: true })} />);
    expect(screen.getByTestId("dashboard-loading")).toBeTruthy();
  });

  it("hides content while loading", () => {
    render(<MultiSalonDashboardScreen {...defaultProps({ isLoading: true })} />);
    expect(screen.queryByTestId("dashboard-empty")).toBeNull();
    expect(screen.queryByTestId("dashboard-error")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

describe("MultiSalonDashboardScreen — error state", () => {
  it("shows error message when not loading and error is set", () => {
    render(
      <MultiSalonDashboardScreen
        {...defaultProps({ error: "Something went wrong", isLoading: false })}
      />,
    );
    expect(screen.getByTestId("dashboard-error")).toBeTruthy();
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });

  it("shows retry button on error", () => {
    const onRetry = jest.fn();
    render(
      <MultiSalonDashboardScreen
        {...defaultProps({ error: "Network error", onRetry, isLoading: false })}
      />,
    );
    expect(screen.getByTestId("dashboard-retry-button")).toBeTruthy();
  });

  it("calls onRetry when retry button is pressed", () => {
    const onRetry = jest.fn();
    render(
      <MultiSalonDashboardScreen
        {...defaultProps({ error: "Network error", onRetry, isLoading: false })}
      />,
    );
    fireEvent.press(screen.getByTestId("dashboard-retry-button"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not show error state while loading", () => {
    render(
      <MultiSalonDashboardScreen
        {...defaultProps({ error: "err", isLoading: true })}
      />,
    );
    expect(screen.queryByTestId("dashboard-error")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe("MultiSalonDashboardScreen — empty state", () => {
  it("shows empty state when no summaries and no error", () => {
    render(<MultiSalonDashboardScreen {...defaultProps({ summaries: [] })} />);
    expect(screen.getByTestId("dashboard-empty")).toBeTruthy();
  });

  it("shows marketplace CTA in empty state", () => {
    render(<MultiSalonDashboardScreen {...defaultProps({ summaries: [] })} />);
    expect(screen.getByTestId("marketplace-cta")).toBeTruthy();
  });

  it("calls onOpenMarketplace when marketplace CTA is pressed", () => {
    const onOpenMarketplace = jest.fn();
    render(
      <MultiSalonDashboardScreen {...defaultProps({ summaries: [], onOpenMarketplace })} />,
    );
    fireEvent.press(screen.getByTestId("marketplace-cta"));
    expect(onOpenMarketplace).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Salon cards
// ---------------------------------------------------------------------------

describe("MultiSalonDashboardScreen — salon cards", () => {
  it("renders a card for each salon summary", () => {
    const summaries = [
      makeSummary({ tenantId: "tA" }),
      makeSummary({ tenantId: "tB", tenantName: "Beta Salon" }),
    ];
    render(<MultiSalonDashboardScreen {...defaultProps({ summaries })} />);
    expect(screen.getByTestId("salon-card-tA")).toBeTruthy();
    expect(screen.getByTestId("salon-card-tB")).toBeTruthy();
  });

  it("shows tenant name on each card", () => {
    const summaries = [makeSummary({ tenantId: "tA", tenantName: "Alpha Salon" })];
    render(<MultiSalonDashboardScreen {...defaultProps({ summaries })} />);
    expect(screen.getByText("Alpha Salon")).toBeTruthy();
  });

  it("calls onSelectSalon with tenantId when card is pressed", () => {
    const onSelectSalon = jest.fn();
    const summaries = [makeSummary({ tenantId: "tA" })];
    render(<MultiSalonDashboardScreen {...defaultProps({ summaries, onSelectSalon })} />);
    fireEvent.press(screen.getByTestId("salon-card-tA"));
    expect(onSelectSalon).toHaveBeenCalledWith("tA");
  });
});

// ---------------------------------------------------------------------------
// Unread badge
// ---------------------------------------------------------------------------

describe("MultiSalonDashboardScreen — unread badge", () => {
  it("shows badge when unreadMessageCount > 0", () => {
    const summaries = [makeSummary({ tenantId: "tA", unreadMessageCount: 5 })];
    render(<MultiSalonDashboardScreen {...defaultProps({ summaries })} />);
    expect(screen.getByTestId("unread-badge-tA")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("does not show badge when count is 0 and unreadFailed is false", () => {
    const summaries = [makeSummary({ tenantId: "tA", unreadMessageCount: 0 })];
    render(<MultiSalonDashboardScreen {...defaultProps({ summaries, unreadFailed: false })} />);
    expect(screen.queryByTestId("unread-badge-tA")).toBeNull();
  });

  it("shows '?' badge when unreadFailed is true", () => {
    const summaries = [makeSummary({ tenantId: "tA", unreadMessageCount: 0 })];
    render(<MultiSalonDashboardScreen {...defaultProps({ summaries, unreadFailed: true })} />);
    expect(screen.getByTestId("unread-badge-tA")).toBeTruthy();
    expect(screen.getByText("?")).toBeTruthy();
  });

  it("caps badge text at '99+' when count exceeds 99", () => {
    const summaries = [makeSummary({ tenantId: "tA", unreadMessageCount: 150 })];
    render(<MultiSalonDashboardScreen {...defaultProps({ summaries })} />);
    expect(screen.getByText("99+")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Quick-action buttons
// ---------------------------------------------------------------------------

describe("MultiSalonDashboardScreen — quick-action buttons", () => {
  const actions = ["book", "messages", "loyalty", "profile"] as const;

  it.each(actions)("renders %s action button", (action) => {
    const summaries = [makeSummary({ tenantId: "tA" })];
    render(<MultiSalonDashboardScreen {...defaultProps({ summaries })} />);
    expect(screen.getByTestId(`action-${action}-tA`)).toBeTruthy();
  });

  it.each(actions)("calls onQuickAction with tenantId and '%s' action", (action) => {
    const onQuickAction = jest.fn();
    const summaries = [makeSummary({ tenantId: "tA" })];
    render(<MultiSalonDashboardScreen {...defaultProps({ summaries, onQuickAction })} />);
    fireEvent.press(screen.getByTestId(`action-${action}-tA`));
    expect(onQuickAction).toHaveBeenCalledWith("tA", action);
  });
});
