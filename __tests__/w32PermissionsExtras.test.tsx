/**
 * w32PermissionsExtras.test.tsx
 *
 * Tests for src/app/platform/PermissionsExtrasScreen.tsx
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  CalendarPermissionScreen,
  CameraPermissionScreen,
  ContactsPermissionScreen,
  LocationPermissionScreen,
  PhotosPermissionScreen,
} from "../src/app/platform/PermissionsExtrasScreen";

const openSettings = jest.fn();
const dismiss = jest.fn();

beforeEach(() => {
  openSettings.mockClear();
  dismiss.mockClear();
});

describe("CameraPermissionScreen", () => {
  it("renders", () => {
    const { getByTestId } = render(
      <CameraPermissionScreen onOpenSettings={openSettings} testID="cps" />,
    );
    expect(getByTestId("cps")).toBeTruthy();
    expect(getByTestId("cps-gate")).toBeTruthy();
  });

  it("calls onOpenSettings", () => {
    const { getByTestId } = render(
      <CameraPermissionScreen onOpenSettings={openSettings} testID="cps" />,
    );
    fireEvent.press(getByTestId("cps-gate-open-settings"));
    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when provided", () => {
    const { getByTestId } = render(
      <CameraPermissionScreen
        onOpenSettings={openSettings}
        onDismiss={dismiss}
        testID="cps"
      />,
    );
    fireEvent.press(getByTestId("cps-gate-dismiss"));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});

describe("PhotosPermissionScreen", () => {
  it("renders gate", () => {
    const { getByTestId } = render(
      <PhotosPermissionScreen onOpenSettings={openSettings} testID="pps" />,
    );
    expect(getByTestId("pps-gate")).toBeTruthy();
  });

  it("calls onOpenSettings", () => {
    const { getByTestId } = render(
      <PhotosPermissionScreen onOpenSettings={openSettings} testID="pps" />,
    );
    fireEvent.press(getByTestId("pps-gate-open-settings"));
    expect(openSettings).toHaveBeenCalledTimes(1);
  });
});

describe("ContactsPermissionScreen", () => {
  it("renders gate", () => {
    const { getByTestId } = render(
      <ContactsPermissionScreen onOpenSettings={openSettings} testID="cops" />,
    );
    expect(getByTestId("cops-gate")).toBeTruthy();
  });

  it("calls onOpenSettings", () => {
    const { getByTestId } = render(
      <ContactsPermissionScreen onOpenSettings={openSettings} testID="cops" />,
    );
    fireEvent.press(getByTestId("cops-gate-open-settings"));
    expect(openSettings).toHaveBeenCalledTimes(1);
  });
});

describe("CalendarPermissionScreen", () => {
  it("renders gate", () => {
    const { getByTestId } = render(
      <CalendarPermissionScreen onOpenSettings={openSettings} testID="calps" />,
    );
    expect(getByTestId("calps-gate")).toBeTruthy();
  });

  it("calls onOpenSettings", () => {
    const { getByTestId } = render(
      <CalendarPermissionScreen onOpenSettings={openSettings} testID="calps" />,
    );
    fireEvent.press(getByTestId("calps-gate-open-settings"));
    expect(openSettings).toHaveBeenCalledTimes(1);
  });
});

describe("LocationPermissionScreen", () => {
  it("renders gate", () => {
    const { getByTestId } = render(
      <LocationPermissionScreen onOpenSettings={openSettings} testID="lps" />,
    );
    expect(getByTestId("lps-gate")).toBeTruthy();
  });

  it("calls onOpenSettings", () => {
    const { getByTestId } = render(
      <LocationPermissionScreen onOpenSettings={openSettings} testID="lps" />,
    );
    fireEvent.press(getByTestId("lps-gate-open-settings"));
    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when provided", () => {
    const { getByTestId } = render(
      <LocationPermissionScreen
        onOpenSettings={openSettings}
        onDismiss={dismiss}
        testID="lps"
      />,
    );
    fireEvent.press(getByTestId("lps-gate-dismiss"));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});
