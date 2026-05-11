/**
 * bookingEdgeScreens.test.tsx — W30 Batch J booking edge screens.
 * J.1 SlotConflictScreen, J.2 MultiServiceBookingScreen / RecurringBookingSheet /
 * OnBehalfBookingScreen, J.3 FeeDisclosureSheet.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { SlotConflictScreen } from "../SlotConflictScreen";
import {
  MultiServiceBookingScreen,
  RecurringBookingSheet,
  OnBehalfBookingScreen,
} from "../MultiServiceBookingScreen";
import { FeeDisclosureSheet } from "../FeeDisclosureSheet";

// ---------------------------------------------------------------------------
// J.1 — SlotConflictScreen
// ---------------------------------------------------------------------------

const ALT_TIMES = ["10:00 AM", "10:30 AM", "11:00 AM"];

describe("SlotConflictScreen", () => {
  it("renders heading and alternatives in default state", () => {
    const { getByText, getByTestId } = render(
      <SlotConflictScreen
        alternatives={ALT_TIMES}
        onPickTime={jest.fn()}
        onSeeMoreTimes={jest.fn()}
        testID="slot-conflict"
      />,
    );
    expect(getByText(/that time was just taken/i)).toBeTruthy();
    expect(getByTestId("slot-conflict-chip-10:00 AM")).toBeTruthy();
    expect(getByTestId("slot-conflict-chip-10:30 AM")).toBeTruthy();
    expect(getByTestId("slot-conflict-chip-11:00 AM")).toBeTruthy();
  });

  it("enables 'Pick this time' only after selecting an alternative", () => {
    const onPickTime = jest.fn();
    const { getByTestId } = render(
      <SlotConflictScreen
        alternatives={ALT_TIMES}
        onPickTime={onPickTime}
        onSeeMoreTimes={jest.fn()}
        testID="sc"
      />,
    );
    // CTA initially disabled — pressing should be no-op
    fireEvent.press(getByTestId("sc-pick"));
    expect(onPickTime).not.toHaveBeenCalled();

    // Select a time
    fireEvent.press(getByTestId("sc-chip-10:30 AM"));
    fireEvent.press(getByTestId("sc-pick"));
    expect(onPickTime).toHaveBeenCalledWith("10:30 AM");
  });

  it("calls onSeeMoreTimes", () => {
    const onSeeMoreTimes = jest.fn();
    const { getByTestId } = render(
      <SlotConflictScreen
        alternatives={ALT_TIMES}
        onPickTime={jest.fn()}
        onSeeMoreTimes={onSeeMoreTimes}
        testID="sc"
      />,
    );
    fireEvent.press(getByTestId("sc-see-more"));
    expect(onSeeMoreTimes).toHaveBeenCalled();
  });

  it("renders no-alternatives state", () => {
    const { getByTestId } = render(
      <SlotConflictScreen
        alternatives={[]}
        state="no-alternatives"
        onPickTime={jest.fn()}
        onSeeMoreTimes={jest.fn()}
        testID="sc"
      />,
    );
    expect(getByTestId("sc-no-alts")).toBeTruthy();
  });

  it("renders error state with retry button", () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <SlotConflictScreen
        alternatives={[]}
        state="error"
        onPickTime={jest.fn()}
        onSeeMoreTimes={jest.fn()}
        onRetry={onRetry}
        testID="sc"
      />,
    );
    expect(getByTestId("sc-error")).toBeTruthy();
    fireEvent.press(getByTestId("sc-retry"));
    expect(onRetry).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// J.2 — MultiServiceBookingScreen
// ---------------------------------------------------------------------------

const GROUPS = [
  {
    category: "hair",
    label: "Hair",
    services: [
      { id: "s1", name: "Haircut", durationMinutes: 45, priceUsd: 65 },
      { id: "s2", name: "Coloring", durationMinutes: 90, priceUsd: 120 },
    ],
  },
];

describe("MultiServiceBookingScreen", () => {
  it("renders services and shows totalizer when services selected", () => {
    const { getByTestId, queryByTestId } = render(
      <MultiServiceBookingScreen
        groups={GROUPS}
        selectedServiceIds={[]}
        onToggleService={jest.fn()}
        onPressContinue={jest.fn()}
        testID="msb"
      />,
    );
    // No totalizer when nothing selected
    expect(queryByTestId("msb-totalizer")).toBeNull();
    expect(getByTestId("msb-svc-s1")).toBeTruthy();
  });

  it("shows totalizer when service is selected", () => {
    const { getByTestId } = render(
      <MultiServiceBookingScreen
        groups={GROUPS}
        selectedServiceIds={["s1"]}
        onToggleService={jest.fn()}
        onPressContinue={jest.fn()}
        testID="msb"
      />,
    );
    expect(getByTestId("msb-totalizer")).toBeTruthy();
  });

  it("shows max-reached banner", () => {
    const { getByTestId } = render(
      <MultiServiceBookingScreen
        groups={GROUPS}
        selectedServiceIds={["s1", "s2"]}
        maxReachedMessage="Maximum 2 services"
        onToggleService={jest.fn()}
        onPressContinue={jest.fn()}
        testID="msb"
      />,
    );
    expect(getByTestId("msb-max-banner")).toBeTruthy();
  });

  it("calls onToggleService when a row is pressed", () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <MultiServiceBookingScreen
        groups={GROUPS}
        selectedServiceIds={[]}
        onToggleService={onToggle}
        onPressContinue={jest.fn()}
        testID="msb"
      />,
    );
    fireEvent.press(getByTestId("msb-svc-s1"));
    expect(onToggle).toHaveBeenCalledWith("s1");
  });
});

describe("RecurringBookingSheet", () => {
  it("renders frequency options", () => {
    const { getByTestId } = render(
      <RecurringBookingSheet
        visible
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        testID="rbs"
      />,
    );
    expect(getByTestId("rbs-freq-weekly")).toBeTruthy();
    expect(getByTestId("rbs-freq-biweekly")).toBeTruthy();
    expect(getByTestId("rbs-freq-monthly")).toBeTruthy();
  });

  it("calls onConfirm with selected frequency", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <RecurringBookingSheet
        visible
        onClose={jest.fn()}
        onConfirm={onConfirm}
        testID="rbs"
      />,
    );
    fireEvent.press(getByTestId("rbs-freq-monthly"));
    fireEvent.press(getByTestId("rbs-confirm"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: "monthly" }),
    );
  });

  it("shows conflict warning banner", () => {
    const { getByTestId } = render(
      <RecurringBookingSheet
        visible
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        conflictWarning="Conflict on Nov 29"
        testID="rbs"
      />,
    );
    expect(getByTestId("rbs-conflict-warning")).toBeTruthy();
  });
});

describe("OnBehalfBookingScreen", () => {
  it("renders the on-behalf toggle", () => {
    const { getByTestId } = render(
      <OnBehalfBookingScreen
        onBehalfEnabled={false}
        onToggleOnBehalf={jest.fn()}
        name=""
        phone=""
        onChangeName={jest.fn()}
        onChangePhone={jest.fn()}
        onPressContinue={jest.fn()}
        testID="ob"
      />,
    );
    expect(getByTestId("ob-toggle")).toBeTruthy();
  });

  it("shows fields when on-behalf is enabled", () => {
    const { getByTestId } = render(
      <OnBehalfBookingScreen
        onBehalfEnabled
        onToggleOnBehalf={jest.fn()}
        name=""
        phone=""
        onChangeName={jest.fn()}
        onChangePhone={jest.fn()}
        onPressContinue={jest.fn()}
        testID="ob"
      />,
    );
    expect(getByTestId("ob-fields")).toBeTruthy();
    expect(getByTestId("ob-name")).toBeTruthy();
    expect(getByTestId("ob-phone")).toBeTruthy();
  });

  it("shows required-fields error banner", () => {
    const { getByTestId } = render(
      <OnBehalfBookingScreen
        onBehalfEnabled
        onToggleOnBehalf={jest.fn()}
        name=""
        phone=""
        onChangeName={jest.fn()}
        onChangePhone={jest.fn()}
        requiredFieldsError="Name and phone are required"
        onPressContinue={jest.fn()}
        testID="ob"
      />,
    );
    expect(getByTestId("ob-required-error")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// J.3 — FeeDisclosureSheet
// ---------------------------------------------------------------------------

describe("FeeDisclosureSheet", () => {
  it("renders deposit sheet without ack checkbox", () => {
    const { getByTestId, queryByTestId } = render(
      <FeeDisclosureSheet
        visible
        type="deposit"
        feeAmount="$25.00"
        refundPolicy="Refundable up to 24h before."
        onContinue={jest.fn()}
        onDecline={jest.fn()}
        onClose={jest.fn()}
        testID="fee"
      />,
    );
    expect(getByTestId("fee-fee-box")).toBeTruthy();
    expect(getByTestId("fee-refund-policy")).toBeTruthy();
    expect(queryByTestId("fee-ack")).toBeNull();
  });

  it("requires acknowledgement for noShow type", () => {
    const onContinue = jest.fn();
    const { getByTestId } = render(
      <FeeDisclosureSheet
        visible
        type="noShow"
        feeAmount="$50.00"
        onContinue={onContinue}
        onDecline={jest.fn()}
        onClose={jest.fn()}
        testID="fee"
      />,
    );
    // Ack checkbox exists
    expect(getByTestId("fee-ack")).toBeTruthy();
    // Continue disabled until checked
    fireEvent.press(getByTestId("fee-continue"));
    expect(onContinue).not.toHaveBeenCalled();

    // Check ack
    fireEvent.press(getByTestId("fee-ack"));
    fireEvent.press(getByTestId("fee-continue"));
    expect(onContinue).toHaveBeenCalled();
  });

  it("calls onDecline", () => {
    const onDecline = jest.fn();
    const { getByTestId } = render(
      <FeeDisclosureSheet
        visible
        type="cancellation"
        feeAmount="$15.00"
        cutoffWindow="24 hours"
        onContinue={jest.fn()}
        onDecline={onDecline}
        onClose={jest.fn()}
        testID="fee"
      />,
    );
    fireEvent.press(getByTestId("fee-decline"));
    expect(onDecline).toHaveBeenCalled();
  });
});
