/**
 * w32PlatformCrossScreens.test.tsx
 *
 * Tests for src/app/platform/PlatformCrossScreens.tsx
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  DeepLinkFallbackScreen,
  FeatureFlagDisabledScreen,
  ForceUpdateScreen,
  MaintenanceModeScreen,
  OfflineScreen,
  ServerErrorFallbackScreen,
} from "../src/app/platform/PlatformCrossScreens";

// ---------------------------------------------------------------------------
// ForceUpdateScreen
// ---------------------------------------------------------------------------

describe("ForceUpdateScreen", () => {
  it("renders with update button", () => {
    const { getByTestId } = render(
      <ForceUpdateScreen
        currentVersion="1.0.0"
        minVersion="2.0.0"
        onUpdatePress={jest.fn()}
        testID="fus"
      />,
    );
    expect(getByTestId("fus")).toBeTruthy();
  });

  it("calls onUpdatePress", () => {
    const onUpdate = jest.fn();
    const { getByTestId } = render(
      <ForceUpdateScreen
        currentVersion="1.0.0"
        minVersion="2.0.0"
        onUpdatePress={onUpdate}
        testID="fus"
      />,
    );
    fireEvent.press(getByTestId("fus-update"));
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// MaintenanceModeScreen
// ---------------------------------------------------------------------------

describe("MaintenanceModeScreen", () => {
  it("renders title", () => {
    const { getByText } = render(
      <MaintenanceModeScreen onRefresh={jest.fn()} testID="mms" />,
    );
    expect(getByText(/maintenance/i)).toBeTruthy();
  });

  it("shows estimated time when provided", () => {
    const { getByText } = render(
      <MaintenanceModeScreen estimatedEndTime="3:00 PM" onRefresh={jest.fn()} testID="mms" />,
    );
    expect(getByText(/3:00 PM/)).toBeTruthy();
  });

  it("calls onRefresh when button pressed", () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(
      <MaintenanceModeScreen onRefresh={onRefresh} testID="mms" />,
    );
    fireEvent.press(getByTestId("mms-refresh"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// OfflineScreen
// ---------------------------------------------------------------------------

describe("OfflineScreen", () => {
  it("renders offline banner", () => {
    const { getByTestId } = render(
      <OfflineScreen onRetry={jest.fn()} testID="ofs" />,
    );
    expect(getByTestId("ofs-banner")).toBeTruthy();
  });

  it("calls onRetry when retry tapped", () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <OfflineScreen onRetry={onRetry} testID="ofs" />,
    );
    fireEvent.press(getByTestId("ofs-banner-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// ServerErrorFallbackScreen
// ---------------------------------------------------------------------------

describe("ServerErrorFallbackScreen", () => {
  it("renders title", () => {
    const { getByText } = render(
      <ServerErrorFallbackScreen onRetry={jest.fn()} testID="sefs" />,
    );
    expect(getByText(/something went wrong/i)).toBeTruthy();
  });

  it("calls onRetry when retry pressed", () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <ServerErrorFallbackScreen onRetry={onRetry} testID="sefs" />,
    );
    fireEvent.press(getByTestId("sefs-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows error code when provided", () => {
    const { getByText } = render(
      <ServerErrorFallbackScreen errorCode="ERR_500" onRetry={jest.fn()} testID="sefs" />,
    );
    expect(getByText(/ERR_500/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// FeatureFlagDisabledScreen
// ---------------------------------------------------------------------------

describe("FeatureFlagDisabledScreen", () => {
  it("renders region reason", () => {
    const { getByText } = render(
      <FeatureFlagDisabledScreen featureName="Rewards" reason="region" onGoBack={jest.fn()} testID="ffds" />,
    );
    expect(getByText(/region/i)).toBeTruthy();
  });

  it("renders version reason", () => {
    const { getByTestId } = render(
      <FeatureFlagDisabledScreen featureName="Rewards" reason="version" onGoBack={jest.fn()} testID="ffds" />,
    );
    expect(getByTestId("ffds-reason")).toBeTruthy();
  });

  it("renders beta reason", () => {
    const { getByText } = render(
      <FeatureFlagDisabledScreen featureName="Rewards" reason="beta" onGoBack={jest.fn()} testID="ffds" />,
    );
    expect(getByText(/beta/i)).toBeTruthy();
  });

  it("calls onGoBack when pressed", () => {
    const onGoBack = jest.fn();
    const { getByTestId } = render(
      <FeatureFlagDisabledScreen featureName="Rewards" onGoBack={onGoBack} testID="ffds" />,
    );
    fireEvent.press(getByTestId("ffds-back"));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// DeepLinkFallbackScreen
// ---------------------------------------------------------------------------

describe("DeepLinkFallbackScreen", () => {
  it("renders title", () => {
    const { getByTestId } = render(
      <DeepLinkFallbackScreen onGoHome={jest.fn()} testID="dlfs" />,
    );
    expect(getByTestId("dlfs-title")).toBeTruthy();
  });

  it("shows deep link when provided", () => {
    const { getByText } = render(
      <DeepLinkFallbackScreen deepLink="zarkili://booking/123" onGoHome={jest.fn()} testID="dlfs" />,
    );
    expect(getByText(/zarkili:\/\/booking\/123/)).toBeTruthy();
  });

  it("calls onGoHome when pressed", () => {
    const onGoHome = jest.fn();
    const { getByTestId } = render(
      <DeepLinkFallbackScreen onGoHome={onGoHome} testID="dlfs" />,
    );
    fireEvent.press(getByTestId("dlfs-home"));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });
});
