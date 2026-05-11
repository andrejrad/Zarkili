/**
 * settingsAndSupportScreens.test.tsx — W29 Batch I settings + support tests.
 *
 * Covers: AccessibilitySettingsScreen, HelpScreen, AgeGateScreen.
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccessibilitySettingsScreen } from "../../settings/AccessibilitySettingsScreen";
import { HelpScreen } from "../../support/HelpScreen";
import { AgeGateScreen } from "../../auth/AgeGateScreen";

// ---------------------------------------------------------------------------
// AccessibilitySettingsScreen
// ---------------------------------------------------------------------------

describe("AccessibilitySettingsScreen", () => {
  const baseProps = {
    textSize: "M" as const,
    reduceMotion: false,
    highContrast: false,
    voiceOverHints: false,
    theme: "system" as const,
    onChangeTextSize: jest.fn(),
    onChangeReduceMotion: jest.fn(),
    onChangeHighContrast: jest.fn(),
    onChangeVoiceOverHints: jest.fn(),
    onChangeTheme: jest.fn(),
    onSave: jest.fn(),
    testID: "a11y",
  };

  it("renders text size buttons", () => {
    render(<AccessibilitySettingsScreen {...baseProps} />);
    expect(screen.getByTestId("a11y-size-S")).toBeTruthy();
    expect(screen.getByTestId("a11y-size-M")).toBeTruthy();
    expect(screen.getByTestId("a11y-size-L")).toBeTruthy();
    expect(screen.getByTestId("a11y-size-XL")).toBeTruthy();
  });

  it("renders preview block", () => {
    render(<AccessibilitySettingsScreen {...baseProps} />);
    expect(screen.getByTestId("a11y-preview")).toBeTruthy();
  });

  it("calls onChangeTextSize when size pressed", () => {
    const onChangeTextSize = jest.fn();
    render(<AccessibilitySettingsScreen {...baseProps} onChangeTextSize={onChangeTextSize} />);
    fireEvent.press(screen.getByTestId("a11y-size-L"));
    expect(onChangeTextSize).toHaveBeenCalledWith("L");
  });

  it("renders toggle controls", () => {
    render(<AccessibilitySettingsScreen {...baseProps} />);
    expect(screen.getByTestId("a11y-reduce-motion")).toBeTruthy();
    expect(screen.getByTestId("a11y-high-contrast")).toBeTruthy();
    expect(screen.getByTestId("a11y-voiceover-hints")).toBeTruthy();
  });

  it("renders theme cards", () => {
    render(<AccessibilitySettingsScreen {...baseProps} />);
    expect(screen.getByTestId("a11y-theme-system")).toBeTruthy();
    expect(screen.getByTestId("a11y-theme-light")).toBeTruthy();
    expect(screen.getByTestId("a11y-theme-dark")).toBeTruthy();
  });

  it("calls onChangeTheme when theme pressed", () => {
    const onChangeTheme = jest.fn();
    render(<AccessibilitySettingsScreen {...baseProps} onChangeTheme={onChangeTheme} />);
    fireEvent.press(screen.getByTestId("a11y-theme-dark"));
    expect(onChangeTheme).toHaveBeenCalledWith("dark");
  });

  it("renders save button", () => {
    render(<AccessibilitySettingsScreen {...baseProps} />);
    expect(screen.getByTestId("a11y-save")).toBeTruthy();
  });

  it("renders error banner on error state", () => {
    render(<AccessibilitySettingsScreen {...baseProps} state="error" />);
    expect(screen.getByTestId("a11y-error-banner")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// HelpScreen
// ---------------------------------------------------------------------------

describe("HelpScreen", () => {
  it("renders search bar and category grid", () => {
    render(
      <HelpScreen
        onSearchChange={jest.fn()}
        onSelectArticle={jest.fn()}
        onSelectCategory={jest.fn()}
        onSubmitContact={jest.fn()}
        testID="help"
      />
    );
    expect(screen.getByTestId("help-search")).toBeTruthy();
    expect(screen.getByTestId("help-category-bookings")).toBeTruthy();
    expect(screen.getByTestId("help-category-payments")).toBeTruthy();
  });

  it("renders featured articles when provided", () => {
    render(
      <HelpScreen
        articles={[{ id: "a1", title: "How to book", category: "Bookings" }]}
        onSearchChange={jest.fn()}
        onSelectArticle={jest.fn()}
        onSelectCategory={jest.fn()}
        onSubmitContact={jest.fn()}
        testID="help"
      />
    );
    expect(screen.getByTestId("help-article-a1")).toBeTruthy();
  });

  it("renders search results when in search-results state", () => {
    render(
      <HelpScreen
        state="search-results"
        articles={[{ id: "a2", title: "Cancel booking", category: "Bookings" }]}
        onSearchChange={jest.fn()}
        onSelectArticle={jest.fn()}
        onSelectCategory={jest.fn()}
        onSubmitContact={jest.fn()}
        testID="help"
      />
    );
    expect(screen.getByTestId("help-article-a2")).toBeTruthy();
  });

  it("renders no-results state", () => {
    render(
      <HelpScreen
        state="no-results"
        onSearchChange={jest.fn()}
        onSelectArticle={jest.fn()}
        onSelectCategory={jest.fn()}
        onSubmitContact={jest.fn()}
        testID="help"
      />
    );
    expect(screen.getByTestId("help-no-results")).toBeTruthy();
  });

  it("renders sent state with ticket number", () => {
    render(
      <HelpScreen
        state="sent"
        ticketNumber="12345"
        onSearchChange={jest.fn()}
        onSelectArticle={jest.fn()}
        onSelectCategory={jest.fn()}
        onSubmitContact={jest.fn()}
        testID="help"
      />
    );
    expect(screen.getByTestId("help-ticket")).toBeTruthy();
    expect(screen.getByText("Ticket #12345")).toBeTruthy();
  });

  it("renders contact support CTA", () => {
    render(
      <HelpScreen
        onSearchChange={jest.fn()}
        onSelectArticle={jest.fn()}
        onSelectCategory={jest.fn()}
        onSubmitContact={jest.fn()}
        testID="help"
      />
    );
    expect(screen.getByTestId("help-contact-cta")).toBeTruthy();
  });

  it("calls onSelectCategory when category pressed", () => {
    const onSelectCategory = jest.fn();
    render(
      <HelpScreen
        onSearchChange={jest.fn()}
        onSelectArticle={jest.fn()}
        onSelectCategory={onSelectCategory}
        onSubmitContact={jest.fn()}
        testID="help"
      />
    );
    fireEvent.press(screen.getByTestId("help-category-bookings"));
    expect(onSelectCategory).toHaveBeenCalledWith("bookings");
  });
});

// ---------------------------------------------------------------------------
// AgeGateScreen
// ---------------------------------------------------------------------------

describe("AgeGateScreen", () => {
  it("renders DOB and region inputs", () => {
    render(
      <AgeGateScreen onContinue={jest.fn()} testID="age" />
    );
    expect(screen.getByTestId("age-dob")).toBeTruthy();
    expect(screen.getByTestId("age-region")).toBeTruthy();
  });

  it("continue button disabled with empty DOB", () => {
    render(
      <AgeGateScreen onContinue={jest.fn()} testID="age" />
    );
    const btn = screen.getByTestId("age-continue");
    expect(btn.props.accessibilityState?.disabled).toBeTruthy();
  });

  it("renders blocked state", () => {
    render(
      <AgeGateScreen state="blocked" onContinue={jest.fn()} testID="age" />
    );
    expect(screen.getByTestId("age-blocked-msg")).toBeTruthy();
  });

  it("renders error banner", () => {
    render(
      <AgeGateScreen state="error" error="Invalid date" onContinue={jest.fn()} testID="age" />
    );
    expect(screen.getByTestId("age-error-banner")).toBeTruthy();
  });

  it("calls onContinue with DOB and region", () => {
    const onContinue = jest.fn();
    render(<AgeGateScreen onContinue={onContinue} testID="age" />);
    fireEvent.changeText(screen.getByTestId("age-dob"), "01/01/2000");
    fireEvent.changeText(screen.getByTestId("age-region"), "California");
    fireEvent.press(screen.getByTestId("age-continue"));
    expect(onContinue).toHaveBeenCalledWith("01/01/2000", "California");
  });
});
