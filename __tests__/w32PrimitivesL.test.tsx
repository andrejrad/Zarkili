/**
 * w32PrimitivesL.test.tsx
 *
 * Unit tests for W32 Batch L primitives:
 *   ForceUpdateGate, OfflineBanner, CoachMark,
 *   RateTheAppPrompt, LanguagePicker, PermissionsGate
 */

import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";

import { CoachMark } from "../src/shared/ui/CoachMark";
import { ForceUpdateGate } from "../src/shared/ui/ForceUpdateGate";
import { LanguagePicker } from "../src/shared/ui/LanguagePicker";
import { OfflineBanner } from "../src/shared/ui/OfflineBanner";
import { PermissionsGate } from "../src/shared/ui/PermissionsGate";
import { RateTheAppPrompt } from "../src/shared/ui/RateTheAppPrompt";

// ---------------------------------------------------------------------------
// ForceUpdateGate
// ---------------------------------------------------------------------------

describe("ForceUpdateGate", () => {
  it("renders when visible=true", () => {
    const { getByTestId } = render(
      <ForceUpdateGate
        visible
        currentVersion="1.0.0"
        minVersion="2.0.0"
        onUpdatePress={jest.fn()}
        testID="fug"
      />,
    );
    expect(getByTestId("fug-title")).toBeTruthy();
    expect(getByTestId("fug-update")).toBeTruthy();
  });

  it("calls onUpdatePress when button pressed", () => {
    const onUpdate = jest.fn();
    const { getByTestId } = render(
      <ForceUpdateGate
        visible
        currentVersion="1.0.0"
        minVersion="2.0.0"
        onUpdatePress={onUpdate}
        testID="fug"
      />,
    );
    fireEvent.press(getByTestId("fug-update"));
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it("shows version info", () => {
    const { getByTestId } = render(
      <ForceUpdateGate
        visible
        currentVersion="1.2.3"
        minVersion="2.0.0"
        onUpdatePress={jest.fn()}
        testID="fug"
      />,
    );
    expect(getByTestId("fug-version")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// OfflineBanner
// ---------------------------------------------------------------------------

describe("OfflineBanner", () => {
  it("renders offline state with retry button", () => {
    const retry = jest.fn();
    const { getByTestId } = render(
      <OfflineBanner status="offline" onRetry={retry} testID="ob" />,
    );
    expect(getByTestId("ob-status-offline")).toBeTruthy();
    fireEvent.press(getByTestId("ob-retry"));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("renders reconnecting state without retry", () => {
    const { getByTestId, queryByTestId } = render(
      <OfflineBanner status="reconnecting" testID="ob" />,
    );
    expect(getByTestId("ob-status-reconnecting")).toBeTruthy();
    expect(queryByTestId("ob-retry")).toBeNull();
  });

  it("renders restored state", () => {
    const { getByTestId } = render(
      <OfflineBanner status="restored" testID="ob" />,
    );
    expect(getByTestId("ob-status-restored")).toBeTruthy();
  });

  it("renders label text", () => {
    const { getByTestId } = render(
      <OfflineBanner status="offline" testID="ob" />,
    );
    expect(getByTestId("ob-label")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// CoachMark
// ---------------------------------------------------------------------------

describe("CoachMark", () => {
  it("renders when visible with title and body", () => {
    const { getByTestId } = render(
      <CoachMark
        visible
        step={1}
        totalSteps={5}
        title="Welcome"
        body="This is step one."
        onNext={jest.fn()}
        testID="cm"
      />,
    );
    expect(getByTestId("cm-title")).toBeTruthy();
    expect(getByTestId("cm-body")).toBeTruthy();
    expect(getByTestId("cm-next")).toBeTruthy();
  });

  it("calls onNext when next button pressed", () => {
    const onNext = jest.fn();
    const { getByTestId } = render(
      <CoachMark
        visible
        step={1}
        totalSteps={5}
        title="Step 1"
        body="Body"
        onNext={onNext}
        testID="cm"
      />,
    );
    fireEvent.press(getByTestId("cm-next"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("shows skip button when onSkip provided", () => {
    const { getByTestId } = render(
      <CoachMark
        visible
        step={2}
        totalSteps={5}
        title="Step"
        body="Body"
        onNext={jest.fn()}
        onSkip={jest.fn()}
        testID="cm"
      />,
    );
    expect(getByTestId("cm-skip")).toBeTruthy();
  });

  it("renders step dots", () => {
    const { getByTestId } = render(
      <CoachMark
        visible
        step={1}
        totalSteps={3}
        title="Step"
        body="Body"
        onNext={jest.fn()}
        testID="cm"
      />,
    );
    expect(getByTestId("cm-dot-0")).toBeTruthy();
    expect(getByTestId("cm-dot-1")).toBeTruthy();
    expect(getByTestId("cm-dot-2")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// RateTheAppPrompt
// ---------------------------------------------------------------------------

describe("RateTheAppPrompt", () => {
  it("renders star picker in initial state", () => {
    const { getByTestId } = render(
      <RateTheAppPrompt
        visible
        onRateOnStore={jest.fn()}
        onDismiss={jest.fn()}
        testID="rap"
      />,
    );
    expect(getByTestId("rap-stars")).toBeTruthy();
    expect(getByTestId("rap-star-1")).toBeTruthy();
    expect(getByTestId("rap-star-5")).toBeTruthy();
  });

  it("calls onDismiss from not-now", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <RateTheAppPrompt
        visible
        onRateOnStore={jest.fn()}
        onDismiss={onDismiss}
        testID="rap"
      />,
    );
    fireEvent.press(getByTestId("rap-not-now"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("advances to feedback stage after selecting 5 stars", () => {
    const { getByTestId } = render(
      <RateTheAppPrompt
        visible
        onRateOnStore={jest.fn()}
        onDismiss={jest.fn()}
        testID="rap"
      />,
    );
    fireEvent.press(getByTestId("rap-star-5"));
    expect(getByTestId("rap-feedback-title")).toBeTruthy();
  });

  it("shows thanks stage after submitting feedback", () => {
    const { getByTestId } = render(
      <RateTheAppPrompt
        visible
        onRateOnStore={jest.fn()}
        onDismiss={jest.fn()}
        testID="rap"
      />,
    );
    fireEvent.press(getByTestId("rap-star-5"));
    // Submit without selecting chips
    fireEvent.press(getByTestId("rap-submit"));
    expect(getByTestId("rap-thanks")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// LanguagePicker
// ---------------------------------------------------------------------------

const LOCALES = [
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "de-DE", name: "German", flag: "🇩🇪" },
  { code: "fr-FR", name: "French", flag: "🇫🇷" },
];

describe("LanguagePicker", () => {
  it("renders locale rows when visible", () => {
    const { getByTestId } = render(
      <LanguagePicker
        visible
        locales={LOCALES}
        currentLocale="en-US"
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
        testID="lp"
      />,
    );
    expect(getByTestId("lp-locale-en-US")).toBeTruthy();
    expect(getByTestId("lp-locale-de-DE")).toBeTruthy();
  });

  it("filters locales by search query", () => {
    const { getByTestId, queryByTestId } = render(
      <LanguagePicker
        visible
        locales={LOCALES}
        currentLocale="en-US"
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
        testID="lp"
      />,
    );
    fireEvent.changeText(getByTestId("lp-search"), "German");
    expect(getByTestId("lp-locale-de-DE")).toBeTruthy();
    expect(queryByTestId("lp-locale-fr-FR")).toBeNull();
  });

  it("calls onConfirm with selected locale", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <LanguagePicker
        visible
        locales={LOCALES}
        currentLocale="en-US"
        onConfirm={onConfirm}
        onDismiss={jest.fn()}
        testID="lp"
      />,
    );
    fireEvent.press(getByTestId("lp-locale-de-DE"));
    fireEvent.press(getByTestId("lp-confirm"));
    expect(onConfirm).toHaveBeenCalledWith("de-DE");
  });

  it("shows empty state when search has no matches", () => {
    const { getByTestId } = render(
      <LanguagePicker
        visible
        locales={LOCALES}
        currentLocale="en-US"
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
        testID="lp"
      />,
    );
    fireEvent.changeText(getByTestId("lp-search"), "Klingon");
    expect(getByTestId("lp-empty")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PermissionsGate
// ---------------------------------------------------------------------------

describe("PermissionsGate", () => {
  it("renders title and reason for camera", () => {
    const { getByTestId } = render(
      <PermissionsGate
        permissionType="camera"
        onOpenSettings={jest.fn()}
        testID="pg"
      />,
    );
    expect(getByTestId("pg-title")).toBeTruthy();
    expect(getByTestId("pg-reason")).toBeTruthy();
  });

  it("calls onOpenSettings when button pressed", () => {
    const onOpen = jest.fn();
    const { getByTestId } = render(
      <PermissionsGate
        permissionType="location"
        onOpenSettings={onOpen}
        testID="pg"
      />,
    );
    fireEvent.press(getByTestId("pg-open-settings"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("shows dismiss button when onDismiss provided", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <PermissionsGate
        permissionType="notifications"
        onOpenSettings={jest.fn()}
        onDismiss={onDismiss}
        testID="pg"
      />,
    );
    fireEvent.press(getByTestId("pg-dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders icon", () => {
    const { getByTestId } = render(
      <PermissionsGate
        permissionType="photos"
        onOpenSettings={jest.fn()}
        testID="pg"
      />,
    );
    expect(getByTestId("pg-icon")).toBeTruthy();
  });
});
