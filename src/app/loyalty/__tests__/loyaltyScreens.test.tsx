/**
 * loyaltyScreens.test.tsx
 * Smoke + interaction tests for E.1-E.3 + E.9 loyalty screens.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { LoyaltyLandingScreen } from "../LoyaltyLandingScreen";
import { RewardCatalogScreen } from "../RewardCatalogScreen";
import { RewardRedemptionScreen } from "../RewardRedemptionScreen";
import { ReferralScreen } from "../ReferralScreen";
import type { Reward } from "../loyaltyHelpers";

/* ─────────────────────── LoyaltyLandingScreen ─────────────────────── */
describe("LoyaltyLandingScreen", () => {
  const baseProps = {
    points: 650,
    historyEntries: [],
    earnActions: [],
    screenState: "default" as const,
    onPressEarnAction: jest.fn(),
    onPressBrowseRewards: jest.fn(),
    testID: "ll",
  };

  it("renders balance", () => {
    const { getByText } = render(<LoyaltyLandingScreen {...baseProps} />);
    expect(getByText(/650/)).toBeTruthy();
  });

  it("calls onViewRewards when CTA is pressed", () => {
    const onPressBrowseRewards = jest.fn();
    const { getByTestId } = render(
      <LoyaltyLandingScreen {...baseProps} onPressBrowseRewards={onPressBrowseRewards} />,
    );
    fireEvent.press(getByTestId("ll-view-rewards"));
    expect(onPressBrowseRewards).toHaveBeenCalledTimes(1);
  });

  it("renders loading state", () => {
    const { getByTestId } = render(
      <LoyaltyLandingScreen {...baseProps} screenState="loading" />,
    );
    expect(getByTestId("ll-loading")).toBeTruthy();
  });

  it("renders error state with retry button", () => {
    const onPressRetry = jest.fn();
    const { getByTestId } = render(
      <LoyaltyLandingScreen
        {...baseProps}
        screenState="error"
        errorMessage="Network error"
        onPressRetry={onPressRetry}
      />,
    );
    fireEvent.press(getByTestId("ll-retry"));
    expect(onPressRetry).toHaveBeenCalled();
  });
});

/* ─────────────────────── RewardCatalogScreen ─────────────────────── */
const MOCK_REWARDS: Reward[] = [
  { id: "r1", title: "Free Coffee", points: 100, type: "Free", redeemed: false, locked: false, imageAlt: "coffee" },
  { id: "r2", title: "10% Off", points: 200, type: "Discount", redeemed: false, locked: false, imageAlt: "discount" },
];

describe("RewardCatalogScreen", () => {
  const baseProps = {
    userPoints: 300,
    rewards: MOCK_REWARDS,
    activeTab: "All" as const,
    sortOption: "lowest-points" as const,
    onTabChange: jest.fn(),
    onSortPress: jest.fn(),
    onRewardPress: jest.fn(),
    testID: "rc",
  };

  it("renders reward titles", () => {
    const { getByText } = render(<RewardCatalogScreen {...baseProps} />);
    expect(getByText("Free Coffee")).toBeTruthy();
    expect(getByText("10% Off")).toBeTruthy();
  });

  it("calls onTabChange when a tab is pressed", () => {
    const onTabChange = jest.fn();
    const { getByTestId } = render(
      <RewardCatalogScreen {...baseProps} onTabChange={onTabChange} />,
    );
    fireEvent.press(getByTestId("rc-tab-Free"));
    expect(onTabChange).toHaveBeenCalledWith("Free");
  });

  it("shows empty state message when no rewards in tab", () => {
    const { getByText } = render(
      <RewardCatalogScreen {...baseProps} rewards={[]} />,
    );
    expect(getByText(/No rewards/i)).toBeTruthy();
  });

  it("shows loading skeletons when loading=true", () => {
    const { queryByText } = render(
      <RewardCatalogScreen {...baseProps} loading />,
    );
    expect(queryByText("Free Coffee")).toBeNull();
  });
});

/* ─────────────────────── RewardRedemptionScreen ─────────────────────── */
describe("RewardRedemptionScreen", () => {
  const baseProps = {
    title: "Free Coffee",
    description: "Enjoy a complimentary beverage.",
    pointsCost: 100,
    userPoints: 300,
    onRedeem: jest.fn(),
    testID: "rr",
  };

  it("renders title and point cost", () => {
    const { getAllByText, getByText } = render(<RewardRedemptionScreen {...baseProps} />);
    expect(getAllByText("Free Coffee").length).toBeGreaterThanOrEqual(1);
    expect(getByText("100 pts")).toBeTruthy();
  });

  it("calls onRedeem when CTA pressed and user has enough points", () => {
    const onRedeem = jest.fn();
    const { getByTestId } = render(
      <RewardRedemptionScreen {...baseProps} onRedeem={onRedeem} />,
    );
    fireEvent.press(getByTestId("rr-cta"));
    expect(onRedeem).toHaveBeenCalledTimes(1);
  });

  it("disables CTA when user has insufficient points", () => {
    const { getByTestId } = render(
      <RewardRedemptionScreen {...baseProps} userPoints={50} />,
    );
    expect(getByTestId("rr-cta").props.accessibilityState?.disabled).toBe(true);
  });
});

/* ─────────────────────── ReferralScreen ─────────────────────── */
describe("ReferralScreen", () => {
  const baseProps = {
    rawCode: "zark12ab",
    stats: { invited: 3, joined: 1, earned: 10 },
    onCopy: jest.fn(),
    testID: "ref",
  };

  it("renders formatted code with dashes", () => {
    const { getByText } = render(<ReferralScreen {...baseProps} />);
    expect(getByText(/ZARK-12AB/)).toBeTruthy();
  });

  it("calls onCopy when copy button is pressed", () => {
    const onCopy = jest.fn();
    const { getByTestId } = render(<ReferralScreen {...baseProps} onCopy={onCopy} />);
    fireEvent.press(getByTestId("ref-copy"));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("renders stats values", () => {
    const { getByText } = render(<ReferralScreen {...baseProps} />);
    expect(getByText("3")).toBeTruthy();
    expect(getByText("1")).toBeTruthy();
    expect(getByText("$10")).toBeTruthy();
  });
});
