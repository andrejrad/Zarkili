/**
 * w32I18nSettings.test.tsx
 *
 * Tests for src/app/settings/I18nSettingsScreen.tsx
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  LanguagePickerScreen,
  LanguageSwitchConfirmSheet,
  LocaleFormatsScreen,
} from "../src/app/settings/I18nSettingsScreen";

// ---------------------------------------------------------------------------
// LanguagePickerScreen
// ---------------------------------------------------------------------------

describe("LanguagePickerScreen", () => {
  it("renders the locale picker", () => {
    const { getByTestId } = render(
      <LanguagePickerScreen
        currentLocale="en-US"
        onApply={jest.fn()}
        testID="lps"
      />,
    );
    expect(getByTestId("lps")).toBeTruthy();
    expect(getByTestId("lps-picker")).toBeTruthy();
  });

  it("shows English (US) locale", () => {
    const { getByTestId } = render(
      <LanguagePickerScreen
        currentLocale="en-US"
        onApply={jest.fn()}
        testID="lps"
      />,
    );
    // en-US should be in the list
    expect(getByTestId("lps-picker-locale-en-US")).toBeTruthy();
  });

  it("calls onApply with selected locale code", () => {
    const onApply = jest.fn();
    const { getByTestId } = render(
      <LanguagePickerScreen
        currentLocale="en-US"
        onApply={onApply}
        testID="lps"
      />,
    );
    fireEvent.press(getByTestId("lps-picker-locale-de-DE"));
    fireEvent.press(getByTestId("lps-picker-confirm"));
    expect(onApply).toHaveBeenCalledWith("de-DE");
  });
});

// ---------------------------------------------------------------------------
// LocaleFormatsScreen
// ---------------------------------------------------------------------------

describe("LocaleFormatsScreen", () => {
  it("renders date and time format selectors", () => {
    const { getByTestId } = render(
      <LocaleFormatsScreen
        currentLocale="en-US"
        onSave={jest.fn()}
        testID="lfs"
      />,
    );
    expect(getByTestId("lfs-date-format")).toBeTruthy();
    expect(getByTestId("lfs-time-format")).toBeTruthy();
  });

  it("shows preview section", () => {
    const { getByTestId } = render(
      <LocaleFormatsScreen
        currentLocale="en-US"
        onSave={jest.fn()}
        testID="lfs"
      />,
    );
    expect(getByTestId("lfs-preview")).toBeTruthy();
    expect(getByTestId("lfs-preview-date")).toBeTruthy();
    expect(getByTestId("lfs-preview-time")).toBeTruthy();
  });

  it("calls onSave when save pressed", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <LocaleFormatsScreen
        currentLocale="en-US"
        onSave={onSave}
        testID="lfs"
      />,
    );
    fireEvent.press(getByTestId("lfs-save"));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ dateFormat: expect.any(String), timeFormat: expect.any(String) }),
    );
  });
});

// ---------------------------------------------------------------------------
// LanguageSwitchConfirmSheet
// ---------------------------------------------------------------------------

describe("LanguageSwitchConfirmSheet", () => {
  it("renders when visible", () => {
    const { getByTestId } = render(
      <LanguageSwitchConfirmSheet
        visible
        fromLocale="en-US"
        toLocale="de-DE"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="lscs"
      />,
    );
    expect(getByTestId("lscs")).toBeTruthy();
  });

  it("shows locale names in body", () => {
    const { getByText } = render(
      <LanguageSwitchConfirmSheet
        visible
        fromLocale="en-US"
        toLocale="de-DE"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="lscs"
      />,
    );
    expect(getByText(/English/)).toBeTruthy();
    expect(getByText(/German/)).toBeTruthy();
  });

  it("calls onConfirm when confirm pressed", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <LanguageSwitchConfirmSheet
        visible
        fromLocale="en-US"
        toLocale="de-DE"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
        testID="lscs"
      />,
    );
    fireEvent.press(getByTestId("lscs-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel pressed", () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <LanguageSwitchConfirmSheet
        visible
        fromLocale="en-US"
        toLocale="de-DE"
        onConfirm={jest.fn()}
        onCancel={onCancel}
        testID="lscs"
      />,
    );
    fireEvent.press(getByTestId("lscs-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
