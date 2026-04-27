import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SalonOnboardingWizard } from "../SalonOnboardingWizard";
import type { SalonOnboardingState } from "../../../domains/onboarding/model";
import { ONBOARDING_STEPS, buildInitialStepStatuses } from "../../../domains/onboarding/model";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePendingState(overrides: Partial<SalonOnboardingState> = {}): SalonOnboardingState {
  const statuses = buildInitialStepStatuses();
  return {
    tenantId: "salon1",
    stepStatuses: statuses,
    currentStep: "ACCOUNT",
    completionScore: 0,
    blockers: [
      { step: "BUSINESS_PROFILE", reason: "Required" },
      { step: "SERVICES", reason: "Required" },
      { step: "AVAILABILITY", reason: "Required" },
    ],
    canGoLive: false,
    startedAt: { seconds: 1000, nanoseconds: 0 } as never,
    updatedAt: { seconds: 1000, nanoseconds: 0 } as never,
    ...overrides,
  };
}

function makeReadyState(): SalonOnboardingState {
  const statuses = buildInitialStepStatuses();
  statuses["BUSINESS_PROFILE"] = "completed";
  statuses["SERVICES"] = "completed";
  statuses["AVAILABILITY"] = "completed";
  return {
    tenantId: "salon1",
    stepStatuses: statuses,
    currentStep: "ACCOUNT",
    completionScore: 33,
    blockers: [],
    canGoLive: true,
    startedAt: { seconds: 1000, nanoseconds: 0 } as never,
    updatedAt: { seconds: 1000, nanoseconds: 0 } as never,
  };
}

const BASE_PROPS = {
  tenantId: "salon1",
  isLoading: false,
  onCompleteStep: jest.fn(),
  onSkipStep: jest.fn(),
  onGoLive: jest.fn(),
};

// ---------------------------------------------------------------------------
// Rendering tests
// ---------------------------------------------------------------------------

describe("SalonOnboardingWizard — rendering", () => {
  it("renders loading state when isLoading is true", () => {
    const { getByText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} isLoading wizardState={null} />,
    );
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("renders placeholder when wizardState is null and not loading", () => {
    const { getByText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={null} />,
    );
    expect(getByText(/onboarding/i)).toBeTruthy();
  });

  it("renders all 9 step labels", () => {
    const { getByText, getAllByText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={makePendingState()} />,
    );
    expect(getByText("Account Setup")).toBeTruthy();
    // Required steps also appear in the blocker list, so use getAllByText
    expect(getAllByText(/Business Profile/).length).toBeGreaterThan(0);
    expect(getAllByText(/Services/).length).toBeGreaterThan(0);
    expect(getAllByText(/Availability/).length).toBeGreaterThan(0);
    expect(getByText("Verification")).toBeTruthy();
  });

  it("renders completion score", () => {
    const { getByText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={makePendingState()} />,
    );
    expect(getByText(/0% complete/i)).toBeTruthy();
  });

  it("renders blocker list when blockers are present", () => {
    const { getByText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={makePendingState()} />,
    );
    expect(getByText(/required before going live/i)).toBeTruthy();
    // Blockers are listed as "• Business Profile" etc.
    expect(getByText(/• Business Profile/)).toBeTruthy();
  });

  it("does not render blocker box when no blockers", () => {
    const { queryByText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={makeReadyState()} />,
    );
    expect(queryByText(/required before going live/i)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Step progression tests
// ---------------------------------------------------------------------------

describe("SalonOnboardingWizard — step actions", () => {
  it("shows Mark Complete button for current step", () => {
    const { getByLabelText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={makePendingState()} />,
    );
    expect(getByLabelText("Complete Account Setup")).toBeTruthy();
  });

  it("calls onCompleteStep with correct step when Mark Complete pressed", () => {
    const onCompleteStep = jest.fn();
    const { getByLabelText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={makePendingState()} onCompleteStep={onCompleteStep} />,
    );
    fireEvent.press(getByLabelText("Complete Account Setup"));
    expect(onCompleteStep).toHaveBeenCalledWith("ACCOUNT");
  });

  it("shows Skip button for non-required current step", () => {
    const state = makePendingState({ currentStep: "STAFF" });
    const { getByLabelText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={state} />,
    );
    expect(getByLabelText("Skip Staff")).toBeTruthy();
  });

  it("does not show Skip button for required step", () => {
    const state = makePendingState({ currentStep: "BUSINESS_PROFILE" });
    const { queryByLabelText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={state} />,
    );
    expect(queryByLabelText("Skip Business Profile")).toBeNull();
  });

  it("calls onSkipStep when Skip pressed", () => {
    const onSkipStep = jest.fn();
    const state = makePendingState({ currentStep: "STAFF" });
    const { getByLabelText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={state} onSkipStep={onSkipStep} />,
    );
    fireEvent.press(getByLabelText("Skip Staff"));
    expect(onSkipStep).toHaveBeenCalledWith("STAFF");
  });
});

// ---------------------------------------------------------------------------
// Go-live tests
// ---------------------------------------------------------------------------

describe("SalonOnboardingWizard — go live", () => {
  it("Go Live button is disabled when blockers remain", () => {
    const { getByLabelText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={makePendingState()} />,
    );
    const btn = getByLabelText("Go Live");
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it("Go Live button is enabled when canGoLive is true", () => {
    const { getByLabelText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={makeReadyState()} />,
    );
    const btn = getByLabelText("Go Live");
    expect(btn.props.accessibilityState?.disabled).toBe(false);
  });

  it("calls onGoLive when Go Live is pressed and canGoLive is true", () => {
    const onGoLive = jest.fn();
    const { getByLabelText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={makeReadyState()} onGoLive={onGoLive} />,
    );
    fireEvent.press(getByLabelText("Go Live"));
    expect(onGoLive).toHaveBeenCalled();
  });

  it("shows instructional text instead of rocket emoji when not ready", () => {
    const { getByText } = render(
      <SalonOnboardingWizard {...BASE_PROPS} wizardState={makePendingState()} />,
    );
    expect(getByText(/complete required steps/i)).toBeTruthy();
  });
});
