import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ActivityListScreen } from "../AdminActivityScreen";
import { CreateActivityScreen } from "../AdminActivityScreen";
import type { Activity } from "../../../domains/activities/model";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_DRAFT: Activity = {
  activityId: "act-1",
  tenantId: "t1",
  type: "visit_streak",
  name: "Visit 3 times",
  status: "draft",
  startDate: "2026-05-01",
  endDate: "2026-07-31",
  rule: { type: "visit_streak", targetValue: 3 },
  reward: { type: "discount_percent", value: 15, description: "15% off next visit" },
  createdBy: "admin",
  createdAt: { seconds: 1000, nanoseconds: 0 } as never,
  updatedAt: { seconds: 1000, nanoseconds: 0 } as never,
};

const MOCK_ACTIVE: Activity = { ...MOCK_DRAFT, activityId: "act-2", name: "Spend 200", status: "active" };

// ---------------------------------------------------------------------------
// ActivityListScreen smoke tests
// ---------------------------------------------------------------------------

describe("ActivityListScreen", () => {
  const baseListProps = {
    activities: [],
    isLoading: false,
    errorMessage: null,
    actionError: null,
    activatingId: null,
    deactivatingId: null,
    onActivate: jest.fn(),
    onDeactivate: jest.fn(),
    onCreateNew: jest.fn(),
    onRetry: jest.fn(),
  };

  it("renders loading indicator while fetching", () => {
    const { getByText } = render(<ActivityListScreen {...baseListProps} isLoading />);
    expect(getByText(/loading challenges/i)).toBeTruthy();
  });

  it("renders empty state when no activities exist", () => {
    const { getByText } = render(<ActivityListScreen {...baseListProps} />);
    expect(getByText(/no challenges yet/i)).toBeTruthy();
  });

  it("renders error message and retry button", () => {
    const { getByText } = render(
      <ActivityListScreen {...baseListProps} errorMessage="Failed to load" />,
    );
    expect(getByText("Failed to load")).toBeTruthy();
    expect(getByText("Retry")).toBeTruthy();
  });

  it("renders action error banner", () => {
    const { getByText } = render(
      <ActivityListScreen {...baseListProps} activities={[MOCK_DRAFT]} actionError="Could not activate" />,
    );
    expect(getByText("Could not activate")).toBeTruthy();
  });

  it("renders activity name and status badge", () => {
    const { getByText } = render(
      <ActivityListScreen {...baseListProps} activities={[MOCK_DRAFT]} />,
    );
    expect(getByText("Visit 3 times")).toBeTruthy();
    expect(getByText("DRAFT")).toBeTruthy();
  });

  it("renders Activate button for draft activity", () => {
    const { getByText } = render(
      <ActivityListScreen {...baseListProps} activities={[MOCK_DRAFT]} />,
    );
    expect(getByText("Activate")).toBeTruthy();
  });

  it("calls onActivate when Activate is pressed", () => {
    const onActivate = jest.fn();
    const { getByText } = render(
      <ActivityListScreen {...baseListProps} activities={[MOCK_DRAFT]} onActivate={onActivate} />,
    );
    fireEvent.press(getByText("Activate"));
    expect(onActivate).toHaveBeenCalledWith("act-1");
  });

  it("renders Deactivate button for active activity", () => {
    const { getByText } = render(
      <ActivityListScreen {...baseListProps} activities={[MOCK_ACTIVE]} />,
    );
    expect(getByText("Deactivate")).toBeTruthy();
  });

  it("calls onDeactivate when Deactivate is pressed", () => {
    const onDeactivate = jest.fn();
    const { getByText } = render(
      <ActivityListScreen {...baseListProps} activities={[MOCK_ACTIVE]} onDeactivate={onDeactivate} />,
    );
    fireEvent.press(getByText("Deactivate"));
    expect(onDeactivate).toHaveBeenCalledWith("act-2");
  });

  it("shows Activating… label while activating is in progress", () => {
    const { getByText } = render(
      <ActivityListScreen {...baseListProps} activities={[MOCK_DRAFT]} activatingId="act-1" />,
    );
    expect(getByText("Activating…")).toBeTruthy();
  });

  it("renders + New challenge button and fires onCreateNew", () => {
    const onCreateNew = jest.fn();
    const { getByText } = render(
      <ActivityListScreen {...baseListProps} onCreateNew={onCreateNew} />,
    );
    fireEvent.press(getByText("+ New challenge"));
    expect(onCreateNew).toHaveBeenCalled();
  });

  it("renders multiple activities", () => {
    const { getByText } = render(
      <ActivityListScreen {...baseListProps} activities={[MOCK_DRAFT, MOCK_ACTIVE]} />,
    );
    expect(getByText("Visit 3 times")).toBeTruthy();
    expect(getByText("Spend 200")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// CreateActivityScreen smoke tests
// ---------------------------------------------------------------------------

describe("CreateActivityScreen", () => {
  const baseCreateProps = {
    name: "",
    type: "visit_streak" as const,
    startDate: "",
    endDate: "",
    targetValue: "",
    windowDays: "",
    rewardType: "discount_percent" as const,
    rewardValue: "",
    rewardDescription: "",
    onNameChange: jest.fn(),
    onTypeChange: jest.fn(),
    onStartDateChange: jest.fn(),
    onEndDateChange: jest.fn(),
    onTargetValueChange: jest.fn(),
    onWindowDaysChange: jest.fn(),
    onRewardTypeChange: jest.fn(),
    onRewardValueChange: jest.fn(),
    onRewardDescriptionChange: jest.fn(),
    onSubmit: jest.fn(),
    submitting: false,
    formError: null,
    successMessage: null,
    onBack: jest.fn(),
  };

  it("renders form title", () => {
    const { getByText } = render(<CreateActivityScreen {...baseCreateProps} />);
    expect(getByText("New Challenge")).toBeTruthy();
  });

  it("renders Create challenge button", () => {
    const { getByText } = render(<CreateActivityScreen {...baseCreateProps} />);
    expect(getByText("Create challenge")).toBeTruthy();
  });

  it("calls onSubmit when Create challenge is pressed", () => {
    const onSubmit = jest.fn();
    const { getByText } = render(<CreateActivityScreen {...baseCreateProps} onSubmit={onSubmit} />);
    fireEvent.press(getByText("Create challenge"));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("shows Creating… label while submitting", () => {
    const { getByText } = render(<CreateActivityScreen {...baseCreateProps} submitting />);
    expect(getByText("Creating…")).toBeTruthy();
  });

  it("renders form error message", () => {
    const { getByText } = render(
      <CreateActivityScreen {...baseCreateProps} formError="Name is required" />,
    );
    expect(getByText("Name is required")).toBeTruthy();
  });

  it("renders success message after creation", () => {
    const { getByText } = render(
      <CreateActivityScreen {...baseCreateProps} successMessage="Challenge created!" />,
    );
    expect(getByText("Challenge created!")).toBeTruthy();
  });

  it("fires onNameChange when name field changes", () => {
    const onNameChange = jest.fn();
    const { getByLabelText } = render(<CreateActivityScreen {...baseCreateProps} onNameChange={onNameChange} />);
    fireEvent.changeText(getByLabelText("Challenge name"), "My Challenge");
    expect(onNameChange).toHaveBeenCalledWith("My Challenge");
  });

  it("fires onBack when Back is pressed", () => {
    const onBack = jest.fn();
    const { getByText } = render(<CreateActivityScreen {...baseCreateProps} onBack={onBack} />);
    fireEvent.press(getByText("Back"));
    expect(onBack).toHaveBeenCalled();
  });
});
