/**
 * w32FirstRunExtras.test.tsx
 *
 * Tests for src/app/onboarding/FirstRunExtrasScreen.tsx
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  CoachMarkTutorialOverlay,
  InviteFriendsSheet,
  RateTheAppScreen,
  WhatsNewSheet,
} from "../src/app/onboarding/FirstRunExtrasScreen";

// ---------------------------------------------------------------------------
// CoachMarkTutorialOverlay
// ---------------------------------------------------------------------------

describe("CoachMarkTutorialOverlay", () => {
  it("renders when visible", () => {
    const { getByTestId } = render(
      <CoachMarkTutorialOverlay
        visible
        onComplete={jest.fn()}
        testID="cmto"
      />,
    );
    expect(getByTestId("cmto-card")).toBeTruthy();
  });

  it("advances through steps on next press", () => {
    const { getByTestId, getByText } = render(
      <CoachMarkTutorialOverlay
        visible
        onComplete={jest.fn()}
        testID="cmto"
      />,
    );
    // First step title should be visible
    const initialTitle = getByTestId("cmto-title").props.children;
    fireEvent.press(getByTestId("cmto-next"));
    const nextTitle = getByTestId("cmto-title").props.children;
    expect(nextTitle).not.toBe(initialTitle);
  });

  it("calls onComplete when skip pressed", () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <CoachMarkTutorialOverlay
        visible
        onComplete={onComplete}
        testID="cmto"
      />,
    );
    fireEvent.press(getByTestId("cmto-skip"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("calls onComplete after last step", () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <CoachMarkTutorialOverlay
        visible
        onComplete={onComplete}
        testID="cmto"
      />,
    );
    // 5 steps → press next 5 times
    for (let i = 0; i < 5; i++) {
      fireEvent.press(getByTestId("cmto-next"));
    }
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// WhatsNewSheet
// ---------------------------------------------------------------------------

const FEATURES = [
  { id: "f1", emoji: "🎉", title: "New booking flow", description: "Faster and simpler." },
  { id: "f2", emoji: "💳", title: "Pay in app", description: "Secure in-app payments." },
];

describe("WhatsNewSheet", () => {
  it("renders feature rows", () => {
    const { getByTestId } = render(
      <WhatsNewSheet
        visible
        version="2.5"
        features={FEATURES}
        onDismiss={jest.fn()}
        testID="wns"
      />,
    );
    expect(getByTestId("wns-feature-f1")).toBeTruthy();
    expect(getByTestId("wns-feature-f2")).toBeTruthy();
  });

  it("shows version", () => {
    const { getByText } = render(
      <WhatsNewSheet
        visible
        version="2.5"
        features={FEATURES}
        onDismiss={jest.fn()}
        testID="wns"
      />,
    );
    expect(getByText(/2\.5/)).toBeTruthy();
  });

  it("calls onDismiss from continue button", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <WhatsNewSheet
        visible
        version="2.5"
        features={FEATURES}
        onDismiss={onDismiss}
        testID="wns"
      />,
    );
    fireEvent.press(getByTestId("wns-continue"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// RateTheAppScreen
// ---------------------------------------------------------------------------

describe("RateTheAppScreen", () => {
  it("renders when visible", () => {
    const { getByTestId } = render(
      <RateTheAppScreen
        visible
        onRateOnStore={jest.fn()}
        onDismiss={jest.fn()}
        testID="ras"
      />,
    );
    expect(getByTestId("ras-stars")).toBeTruthy();
  });

  it("calls onDismiss from not-now", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <RateTheAppScreen
        visible
        onRateOnStore={jest.fn()}
        onDismiss={onDismiss}
        testID="ras"
      />,
    );
    fireEvent.press(getByTestId("ras-not-now"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// InviteFriendsSheet
// ---------------------------------------------------------------------------

describe("InviteFriendsSheet", () => {
  it("renders referral code", () => {
    const { getByTestId } = render(
      <InviteFriendsSheet
        visible
        referralCode="ZRK123"
        referralUrl="https://zarkili.app/invite/ZRK123"
        onDismiss={jest.fn()}
        testID="ifs"
      />,
    );
    expect(getByTestId("ifs-code")).toBeTruthy();
    const codeText = getByTestId("ifs-code").props.children;
    expect(codeText).toBe("ZRK123");
  });

  it("renders share targets", () => {
    const { getByTestId } = render(
      <InviteFriendsSheet
        visible
        referralCode="ZRK123"
        referralUrl="https://zarkili.app/invite/ZRK123"
        onDismiss={jest.fn()}
        testID="ifs"
      />,
    );
    expect(getByTestId("ifs-target-message")).toBeTruthy();
    expect(getByTestId("ifs-target-copy")).toBeTruthy();
  });

  it("calls onDismiss when dismiss pressed", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <InviteFriendsSheet
        visible
        referralCode="ZRK123"
        referralUrl="https://zarkili.app/invite/ZRK123"
        onDismiss={onDismiss}
        testID="ifs"
      />,
    );
    fireEvent.press(getByTestId("ifs-dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
