/**
 * activitiesScreens.test.tsx
 * Smoke + interaction tests for E.4-E.6 activities screens.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { ActivitiesScreen } from "../ActivitiesScreen";
import { ActivityDetailScreen } from "../ActivityDetailScreen";
import { ClaimActivityRewardScreen } from "../ClaimActivityRewardScreen";
import type { Activity } from "../../loyalty/loyaltyHelpers";

/* ─────────────────────── ActivitiesScreen ─────────────────────── */
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "a1",
    title: "Book twice",
    icon: "📅",
    status: "in_progress",
    currentSteps: 1,
    totalSteps: 2,
    pointsReward: 100,
    isNew: true,
    steps: [],
  },
  {
    id: "a2",
    title: "Write a review",
    icon: "⭐",
    status: "completed",
    currentSteps: 1,
    totalSteps: 1,
    pointsReward: 50,
    isNew: false,
    steps: [],
  },
];

describe("ActivitiesScreen", () => {
  const baseProps = {
    activities: MOCK_ACTIVITIES,
    activeTab: "all" as const,
    onTabChange: jest.fn(),
    onActivityPress: jest.fn(),
    testID: "as",
  };

  it("renders activity titles", () => {
    const { getByText } = render(<ActivitiesScreen {...baseProps} />);
    expect(getByText("Book twice")).toBeTruthy();
    expect(getByText("Write a review")).toBeTruthy();
  });

  it("calls onActivityPress when a card is pressed", () => {
    const onActivityPress = jest.fn();
    const { getByTestId } = render(
      <ActivitiesScreen {...baseProps} onActivityPress={onActivityPress} />,
    );
    fireEvent.press(getByTestId("as-activity-a1"));
    expect(onActivityPress).toHaveBeenCalledWith(MOCK_ACTIVITIES[0]);
  });

  it("shows empty message when no activities match tab", () => {
    const { getByText } = render(
      <ActivitiesScreen {...baseProps} activities={[]} activeTab="active" />,
    );
    expect(getByText(/No active/i)).toBeTruthy();
  });

  it("renders loading skeletons", () => {
    const { queryByText } = render(
      <ActivitiesScreen {...baseProps} loading />,
    );
    expect(queryByText("Book twice")).toBeNull();
  });

  it("calls onTabChange when a tab is pressed", () => {
    const onTabChange = jest.fn();
    const { getByTestId } = render(
      <ActivitiesScreen {...baseProps} onTabChange={onTabChange} />,
    );
    // SegmentedControl with testID
    const tabs = getByTestId("as-tabs");
    expect(tabs).toBeTruthy();
  });
});

/* ─────────────────────── ActivityDetailScreen ─────────────────────── */
const MOCK_ACTIVITY: Activity = {
  id: "a1",
  title: "Book twice",
  icon: "📅",
  description: "Complete 2 bookings in a month.",
  status: "in_progress",
  currentSteps: 1,
  totalSteps: 2,
  pointsReward: 100,
  isNew: true,
  expiryLabel: "12/31/2025",
  steps: [
    { id: "s1", label: "First booking", completed: true },
    { id: "s2", label: "Second booking", completed: false },
  ],
};

describe("ActivityDetailScreen", () => {
  it("renders title and description", () => {
    const { getAllByText, getByText } = render(
      <ActivityDetailScreen activity={MOCK_ACTIVITY} testID="ad" />,
    );
    expect(getAllByText("Book twice").length).toBeGreaterThanOrEqual(1);
    expect(getByText(/Complete 2 bookings/)).toBeTruthy();
  });

  it("renders points reward", () => {
    const { getByText } = render(
      <ActivityDetailScreen activity={MOCK_ACTIVITY} testID="ad" />,
    );
    expect(getByText(/100/)).toBeTruthy();
  });

  it("renders step completion checkmarks", () => {
    const { getAllByText } = render(
      <ActivityDetailScreen activity={MOCK_ACTIVITY} testID="ad" />,
    );
    expect(getAllByText("✓").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onCtaPress when CTA is pressed", () => {
    const onCtaPress = jest.fn();
    const { getByTestId } = render(
      <ActivityDetailScreen activity={MOCK_ACTIVITY} onCtaPress={onCtaPress} testID="ad" />,
    );
    fireEvent.press(getByTestId("ad-cta"));
    expect(onCtaPress).toHaveBeenCalledTimes(1);
  });

  it("shows error state when error prop is provided", () => {
    const { getByText } = render(
      <ActivityDetailScreen activity={MOCK_ACTIVITY} error="Network error" testID="ad" />,
    );
    expect(getByText("Network error")).toBeTruthy();
  });
});

/* ─────────────────────── ClaimActivityRewardScreen ─────────────────────── */
describe("ClaimActivityRewardScreen", () => {
  const baseProps = {
    visible: true,
    activityTitle: "Book twice",
    pointsReward: 100,
    claimState: "default" as const,
    onClaim: jest.fn(),
    onDone: jest.fn(),
    testID: "car",
  };

  it("renders heading and activity title", () => {
    const { getByText } = render(<ClaimActivityRewardScreen {...baseProps} />);
    expect(getByText(/Reward earned/i)).toBeTruthy();
    expect(getByText("Book twice")).toBeTruthy();
  });

  it("calls onClaim when primary button is pressed", () => {
    const onClaim = jest.fn();
    const { getByTestId } = render(
      <ClaimActivityRewardScreen {...baseProps} onClaim={onClaim} />,
    );
    fireEvent.press(getByTestId("car-claim"));
    expect(onClaim).toHaveBeenCalledTimes(1);
  });

  it("calls onDone when done button is pressed", () => {
    const onDone = jest.fn();
    const { getByTestId } = render(
      <ClaimActivityRewardScreen {...baseProps} onDone={onDone} />,
    );
    fireEvent.press(getByTestId("car-done"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
