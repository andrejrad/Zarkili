/**
 * w32StoreAndLegalExtras.test.tsx
 *
 * Tests for:
 *   src/app/settings/StoreReadinessScreens.tsx
 *   src/app/legal/LegalExtrasScreen.tsx
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  AppInfoScreen,
  DataSafetyScreen,
  PrivacyNutritionLabelScreen,
  ReleaseNotesScreen,
} from "../src/app/settings/StoreReadinessScreens";
import {
  AccessibilityStatementScreen,
  AttributionsScreen,
  CookiePolicyScreen,
  OpenSourceLicensesScreen,
} from "../src/app/legal/LegalExtrasScreen";

// ---------------------------------------------------------------------------
// PrivacyNutritionLabelScreen
// ---------------------------------------------------------------------------

describe("PrivacyNutritionLabelScreen", () => {
  it("renders table", () => {
    const { getByTestId } = render(
      <PrivacyNutritionLabelScreen testID="pnls" />,
    );
    expect(getByTestId("pnls-table")).toBeTruthy();
  });

  it("renders contact info row", () => {
    const { getByTestId } = render(
      <PrivacyNutritionLabelScreen testID="pnls" />,
    );
    expect(getByTestId("pnls-row-contact")).toBeTruthy();
  });

  it("renders app name in subtitle", () => {
    const { getByText } = render(
      <PrivacyNutritionLabelScreen appName="TestApp" testID="pnls" />,
    );
    expect(getByText(/TestApp/)).toBeTruthy();
  });

  it("calls onPrivacyPolicy when link pressed", () => {
    const onPolicy = jest.fn();
    const { getByTestId } = render(
      <PrivacyNutritionLabelScreen onPrivacyPolicy={onPolicy} testID="pnls" />,
    );
    fireEvent.press(getByTestId("pnls-policy-link"));
    expect(onPolicy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// DataSafetyScreen
// ---------------------------------------------------------------------------

describe("DataSafetyScreen", () => {
  it("renders account entry", () => {
    const { getByTestId } = render(<DataSafetyScreen testID="dss" />);
    expect(getByTestId("dss-entry-account")).toBeTruthy();
  });

  it("renders location entry", () => {
    const { getByTestId } = render(<DataSafetyScreen testID="dss" />);
    expect(getByTestId("dss-entry-location")).toBeTruthy();
  });

  it("calls onLearnMore when pressed", () => {
    const onLearnMore = jest.fn();
    const { getByTestId } = render(
      <DataSafetyScreen onLearnMore={onLearnMore} testID="dss" />,
    );
    fireEvent.press(getByTestId("dss-learn-more"));
    expect(onLearnMore).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// AppInfoScreen
// ---------------------------------------------------------------------------

describe("AppInfoScreen", () => {
  it("renders version and build", () => {
    const { getByTestId } = render(
      <AppInfoScreen
        version="2.5.1"
        buildNumber="412"
        testID="ais"
      />,
    );
    expect(getByTestId("ais-version")).toBeTruthy();
    expect(getByTestId("ais-build")).toBeTruthy();
  });

  it("renders channel", () => {
    const { getByTestId } = render(
      <AppInfoScreen
        version="2.5.1"
        buildNumber="412"
        channel="staging"
        testID="ais"
      />,
    );
    expect(getByTestId("ais-channel")).toBeTruthy();
  });

  it("renders commit hash when provided", () => {
    const { getByTestId } = render(
      <AppInfoScreen
        version="2.5.1"
        buildNumber="412"
        commitHash="abc1234def"
        testID="ais"
      />,
    );
    expect(getByTestId("ais-commit")).toBeTruthy();
  });

  it("calls onCopyDiagnostics when pressed", () => {
    const onCopy = jest.fn();
    const { getByTestId } = render(
      <AppInfoScreen
        version="2.5.1"
        buildNumber="412"
        onCopyDiagnostics={onCopy}
        testID="ais"
      />,
    );
    fireEvent.press(getByTestId("ais-diagnostics"));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// ReleaseNotesScreen
// ---------------------------------------------------------------------------

const NOTES = [
  { version: "2.5", date: "2025-04-01", highlights: ["New booking flow", "In-app payments"] },
  { version: "2.4", date: "2025-03-01", highlights: ["Bug fixes"] },
];

describe("ReleaseNotesScreen", () => {
  it("renders release blocks", () => {
    const { getByTestId } = render(
      <ReleaseNotesScreen notes={NOTES} testID="rns" />,
    );
    expect(getByTestId("rns-release-2.5")).toBeTruthy();
    expect(getByTestId("rns-release-2.4")).toBeTruthy();
  });

  it("shows latest badge on first release", () => {
    const { getByTestId } = render(
      <ReleaseNotesScreen notes={NOTES} testID="rns" />,
    );
    expect(getByTestId("rns-latest-badge")).toBeTruthy();
  });

  it("renders highlight text", () => {
    const { getByTestId } = render(
      <ReleaseNotesScreen notes={NOTES} testID="rns" />,
    );
    expect(getByTestId("rns-highlight-2.5-0")).toBeTruthy();
    expect(getByTestId("rns-highlight-2.5-1")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// OpenSourceLicensesScreen
// ---------------------------------------------------------------------------

const LICENSES = [
  { id: "react", package: "react", version: "18.0.0", license: "MIT", url: "https://reactjs.org" },
  { id: "rn", package: "react-native", version: "0.73.0", license: "MIT" },
  { id: "expo", package: "expo", version: "54.0.0", license: "MIT" },
];

describe("OpenSourceLicensesScreen", () => {
  it("renders all packages", () => {
    const { getByTestId } = render(
      <OpenSourceLicensesScreen licenses={LICENSES} testID="osls" />,
    );
    expect(getByTestId("osls-package-react")).toBeTruthy();
    expect(getByTestId("osls-package-rn")).toBeTruthy();
  });

  it("filters by search query", () => {
    const { getByTestId, queryByTestId } = render(
      <OpenSourceLicensesScreen licenses={LICENSES} testID="osls" />,
    );
    fireEvent.changeText(getByTestId("osls-search"), "expo");
    expect(getByTestId("osls-package-expo")).toBeTruthy();
    expect(queryByTestId("osls-package-react")).toBeNull();
  });

  it("shows empty state for no matches", () => {
    const { getByTestId } = render(
      <OpenSourceLicensesScreen licenses={LICENSES} testID="osls" />,
    );
    fireEvent.changeText(getByTestId("osls-search"), "zzznomatch");
    expect(getByTestId("osls-empty")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AttributionsScreen
// ---------------------------------------------------------------------------

const ATTRIBUTIONS = [
  { id: "ic1", type: "icon" as const, name: "Feather Icons", author: "Cole Bemis", source: "feathericons.com", license: "MIT" },
  { id: "fo1", type: "font" as const, name: "Inter", author: "Rasmus Andersson", source: "rsms.me/inter", license: "OFL" },
];

describe("AttributionsScreen", () => {
  it("renders attribution cards", () => {
    const { getByTestId } = render(
      <AttributionsScreen attributions={ATTRIBUTIONS} testID="as" />,
    );
    expect(getByTestId("as-attr-ic1")).toBeTruthy();
    expect(getByTestId("as-attr-fo1")).toBeTruthy();
  });

  it("groups by type", () => {
    const { getByTestId } = render(
      <AttributionsScreen attributions={ATTRIBUTIONS} testID="as" />,
    );
    expect(getByTestId("as-group-icon")).toBeTruthy();
    expect(getByTestId("as-group-font")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AccessibilityStatementScreen
// ---------------------------------------------------------------------------

describe("AccessibilityStatementScreen", () => {
  it("renders WCAG badge", () => {
    const { getByTestId } = render(
      <AccessibilityStatementScreen testID="acc" />,
    );
    expect(getByTestId("acc-wcag-badge")).toBeTruthy();
  });

  it("renders commitment section", () => {
    const { getByTestId } = render(
      <AccessibilityStatementScreen testID="acc" />,
    );
    expect(getByTestId("acc-commitment")).toBeTruthy();
  });

  it("calls onContactAccessibility when pressed", () => {
    const onContact = jest.fn();
    const { getByTestId } = render(
      <AccessibilityStatementScreen
        onContactAccessibility={onContact}
        testID="acc"
      />,
    );
    fireEvent.press(getByTestId("acc-contact-btn"));
    expect(onContact).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// CookiePolicyScreen
// ---------------------------------------------------------------------------

const COOKIES = [
  { id: "session", name: "Session cookie", purpose: "Keeps you logged in.", essential: true, thirdParty: false },
  { id: "analytics", name: "Analytics", purpose: "Usage analytics.", essential: false, thirdParty: true },
];

describe("CookiePolicyScreen", () => {
  it("renders essential heading", () => {
    const { getByTestId } = render(
      <CookiePolicyScreen cookies={COOKIES} testID="cps" />,
    );
    expect(getByTestId("cps-essential-heading")).toBeTruthy();
  });

  it("renders optional heading", () => {
    const { getByTestId } = render(
      <CookiePolicyScreen cookies={COOKIES} testID="cps" />,
    );
    expect(getByTestId("cps-optional-heading")).toBeTruthy();
  });

  it("renders cookie cards", () => {
    const { getByTestId } = render(
      <CookiePolicyScreen cookies={COOKIES} testID="cps" />,
    );
    expect(getByTestId("cps-cookie-session")).toBeTruthy();
    expect(getByTestId("cps-cookie-analytics")).toBeTruthy();
  });

  it("calls onPrivacyPolicy when link pressed", () => {
    const onPrivacy = jest.fn();
    const { getByTestId } = render(
      <CookiePolicyScreen
        cookies={COOKIES}
        onPrivacyPolicy={onPrivacy}
        testID="cps"
      />,
    );
    fireEvent.press(getByTestId("cps-privacy-link"));
    expect(onPrivacy).toHaveBeenCalledTimes(1);
  });
});
