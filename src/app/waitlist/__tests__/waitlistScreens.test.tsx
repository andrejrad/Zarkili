/**
 * waitlistScreens.test.tsx — W26 Batch F screen tests.
 * Covers: WaitlistJoinSheet (F.6), WaitlistPositionScreen (F.7).
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { WaitlistJoinSheet } from "../WaitlistJoinSheet";
import { WaitlistPositionScreen } from "../WaitlistPositionScreen";
import type { WaitlistPositionData, WaitlistSlotOffer } from "../../messaging/messagingHelpers";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeSlotOffer = (overrides: Partial<WaitlistSlotOffer> = {}): WaitlistSlotOffer => ({
  offerId: "offer1",
  slotAt: new Date(Date.now() + 86400_000).toISOString(),
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  ...overrides,
});

const makePosition = (overrides: Partial<WaitlistPositionData> = {}): WaitlistPositionData => ({
  positionNumber: 3,
  serviceName: "Balayage",
  salonName: "Glow Studio",
  salonAddress: "123 Main St",
  estimatedWait: "2–5 days",
  ...overrides,
});

// ---------------------------------------------------------------------------
// WaitlistJoinSheet
// ---------------------------------------------------------------------------

describe("WaitlistJoinSheet", () => {
  function defaultSheetProps(overrides = {}) {
    return {
      visible: true,
      onClose: jest.fn(),
      serviceName: "Balayage",
      dateRangeStart: "",
      dateRangeEnd: "",
      onDateRangeStartChange: jest.fn(),
      onDateRangeEndChange: jest.fn(),
      timePreference: "anytime" as const,
      onTimePreferenceChange: jest.fn(),
      staffPreference: "any" as const,
      onStaffPreferenceChange: jest.fn(),
      notifyByPush: false,
      onTogglePush: jest.fn(),
      notifyBySms: false,
      onToggleSms: jest.fn(),
      onJoin: jest.fn(),
      testID: "join",
      ...overrides,
    };
  }

  it("renders when visible is true", () => {
    const { getByTestId } = render(<WaitlistJoinSheet {...defaultSheetProps()} />);
    expect(getByTestId("join")).toBeTruthy();
  });

  it("renders join CTA with testID", () => {
    const { getByTestId } = render(<WaitlistJoinSheet {...defaultSheetProps()} />);
    expect(getByTestId("join-join-cta")).toBeTruthy();
  });

  it("SMS notify toggle is accessible", () => {
    const { getByTestId } = render(<WaitlistJoinSheet {...defaultSheetProps()} />);
    expect(getByTestId("join-notify-sms-toggle")).toBeTruthy();
  });

  it("SMS toggle value defaults to false (TCPA)", () => {
    const { getByTestId } = render(
      <WaitlistJoinSheet {...defaultSheetProps({ notifyBySms: false })} />,
    );
    const toggle = getByTestId("join-notify-sms-toggle");
    expect(toggle.props.value).toBe(false);
  });

  it("shows 'already on waitlist' banner when isAlreadyOnWaitlist", () => {
    const { getByTestId } = render(
      <WaitlistJoinSheet {...defaultSheetProps({ isAlreadyOnWaitlist: true })} />,
    );
    expect(getByTestId("join-already-banner")).toBeTruthy();
  });

  it("calls onJoin when join CTA pressed", () => {
    const onJoin = jest.fn();
    const { getByTestId } = render(
      <WaitlistJoinSheet {...defaultSheetProps({ onJoin })} />,
    );
    fireEvent.press(getByTestId("join-join-cta"));
    expect(onJoin).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// WaitlistPositionScreen
// ---------------------------------------------------------------------------

describe("WaitlistPositionScreen", () => {
  function defaultPositionProps(overrides = {}) {
    return {
      position: makePosition(),
      onUpdatePreferences: jest.fn(),
      onLeaveWaitlist: jest.fn(),
      testID: "pos",
      ...overrides,
    };
  }

  it("renders position number with testID", () => {
    const { getByTestId } = render(<WaitlistPositionScreen {...defaultPositionProps()} />);
    expect(getByTestId("pos-position")).toBeTruthy();
  });

  it("renders position number as '#3'", () => {
    const { getByText } = render(<WaitlistPositionScreen {...defaultPositionProps()} />);
    expect(getByText("#3")).toBeTruthy();
  });

  it("renders service name", () => {
    const { getByText } = render(<WaitlistPositionScreen {...defaultPositionProps()} />);
    expect(getByText("Balayage")).toBeTruthy();
  });

  it("renders slot offer banner when slotOffer present", () => {
    const { getByTestId } = render(
      <WaitlistPositionScreen
        {...defaultPositionProps({
          position: makePosition({ slotOffer: makeSlotOffer() }),
        })}
      />,
    );
    expect(getByTestId("pos-slot-offer")).toBeTruthy();
  });

  it("does not render slot offer banner when no slotOffer", () => {
    const { queryByTestId } = render(
      <WaitlistPositionScreen {...defaultPositionProps()} />,
    );
    expect(queryByTestId("pos-slot-offer")).toBeNull();
  });

  it("renders leave waitlist button with testID", () => {
    const { getByTestId } = render(<WaitlistPositionScreen {...defaultPositionProps()} />);
    expect(getByTestId("pos-leave")).toBeTruthy();
  });

  it("calls onLeaveWaitlist when leave button pressed", () => {
    const onLeaveWaitlist = jest.fn();
    const { getByTestId } = render(
      <WaitlistPositionScreen {...defaultPositionProps({ onLeaveWaitlist })} />,
    );
    fireEvent.press(getByTestId("pos-leave"));
    expect(onLeaveWaitlist).toHaveBeenCalledTimes(1);
  });
});
