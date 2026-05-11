/**
 * legalScreens.test.tsx — W29 Batch I legal screens tests.
 *
 * Covers: LegalPageScreen, MarketingConsentScreen, DataExportScreen, DeleteAccountScreen.
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { LegalPageScreen } from "../LegalPageScreen";
import { MarketingConsentScreen } from "../MarketingConsentScreen";
import { DataExportScreen } from "../DataExportScreen";
import { DeleteAccountScreen } from "../DeleteAccountScreen";

// ---------------------------------------------------------------------------
// LegalPageScreen
// ---------------------------------------------------------------------------

describe("LegalPageScreen", () => {
  it("renders ToS title", () => {
    render(
      <LegalPageScreen pageType="terms" testID="legal" />
    );
    expect(screen.getByTestId("legal-title")).toBeTruthy();
    expect(screen.getByText("Terms of Service")).toBeTruthy();
  });

  it("renders loading state", () => {
    render(<LegalPageScreen pageType="privacy" state="loading" testID="legal" />);
    // Loading: no title rendered in layout
    expect(screen.queryByTestId("legal-title")).toBeNull();
  });

  it("renders error state with retry button", () => {
    render(<LegalPageScreen pageType="privacy" state="error" testID="legal" />);
    expect(screen.getByTestId("legal-retry")).toBeTruthy();
  });

  it("renders sections as headings", () => {
    render(
      <LegalPageScreen
        pageType="terms"
        sections={[{ id: "s1", heading: "Introduction", body: "Welcome." }]}
        testID="legal"
      />
    );
    expect(screen.getByTestId("legal-heading-s1")).toBeTruthy();
    // Section heading AND jump-link chip both render the heading text
    expect(screen.getAllByText("Introduction").length).toBeGreaterThanOrEqual(1);
  });

  it("renders CCPA Do Not Sell toggle for CA residents on cookies page", () => {
    render(
      <LegalPageScreen
        pageType="cookies"
        isCaResident
        doNotSell={false}
        testID="legal"
      />
    );
    expect(screen.getByTestId("legal-do-not-sell")).toBeTruthy();
  });

  it("does not render CCPA toggle for non-CA residents", () => {
    render(
      <LegalPageScreen pageType="cookies" isCaResident={false} testID="legal" />
    );
    expect(screen.queryByTestId("legal-do-not-sell")).toBeNull();
  });

  it("renders accept-required banner", () => {
    render(
      <LegalPageScreen
        pageType="cookies"
        state="accept-required"
        testID="legal"
      />
    );
    expect(screen.getByTestId("legal-accept-banner")).toBeTruthy();
  });

  it("renders jump links when sections are provided", () => {
    render(
      <LegalPageScreen
        pageType="terms"
        sections={[{ id: "j1", heading: "Section 1", body: "Body text." }]}
        testID="legal"
      />
    );
    // LegalPageLayout receives jump links derived from sections
    expect(screen.getByTestId("legal-jump-links")).toBeTruthy();
  });

  it("renders lastUpdated label", () => {
    render(
      <LegalPageScreen
        pageType="terms"
        lastUpdated="01/01/2026"
        testID="legal"
      />
    );
    expect(screen.getByText("Updated 01/01/2026")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// MarketingConsentScreen
// ---------------------------------------------------------------------------

describe("MarketingConsentScreen", () => {
  const defaults = {
    "marketing-email": true,
    "marketing-sms": true,
    "push-promotions": true,
    personalized: true,
  };

  it("renders consent list and save button", () => {
    render(
      <MarketingConsentScreen
        initialConsents={defaults}
        onSave={jest.fn()}
        testID="consent"
      />
    );
    expect(screen.getByTestId("consent-save")).toBeTruthy();
    expect(screen.getByTestId("consent-list")).toBeTruthy();
  });

  it("renders TCPA disclosure for SMS consent", () => {
    render(
      <MarketingConsentScreen
        initialConsents={defaults}
        onSave={jest.fn()}
        testID="consent"
      />
    );
    expect(screen.getByTestId("consent-list-disclosure-marketing-sms")).toBeTruthy();
  });

  it("renders CCPA third-party row for CA residents", () => {
    render(
      <MarketingConsentScreen
        isCaResident
        initialConsents={{ ...defaults, "third-party": false }}
        onSave={jest.fn()}
        testID="consent"
      />
    );
    expect(screen.getByTestId("consent-list-third-party")).toBeTruthy();
  });

  it("does not render third-party for non-CA residents", () => {
    render(
      <MarketingConsentScreen
        isCaResident={false}
        initialConsents={defaults}
        onSave={jest.fn()}
        testID="consent"
      />
    );
    expect(screen.queryByTestId("consent-list-third-party")).toBeNull();
  });

  it("shows saved banner on successful save", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <MarketingConsentScreen
        initialConsents={defaults}
        onSave={onSave}
        testID="consent"
      />
    );
    fireEvent.press(screen.getByTestId("consent-save"));
    await screen.findByTestId("consent-saved-banner");
  });

  it("shows error banner on failed save", async () => {
    const onSave = jest.fn().mockRejectedValue(new Error("fail"));
    render(
      <MarketingConsentScreen
        initialConsents={defaults}
        onSave={onSave}
        testID="consent"
      />
    );
    fireEvent.press(screen.getByTestId("consent-save"));
    await screen.findByTestId("consent-error-banner");
  });
});

// ---------------------------------------------------------------------------
// DataExportScreen
// ---------------------------------------------------------------------------

describe("DataExportScreen", () => {
  it("renders request form in default state", () => {
    render(
      <DataExportScreen onRequestExport={jest.fn()} testID="export" />
    );
    expect(screen.getByTestId("export-request")).toBeTruthy();
  });

  it("renders building state with status card", () => {
    render(
      <DataExportScreen
        exportState="building"
        buildStatus="Building"
        onRequestExport={jest.fn()}
        testID="export"
      />
    );
    expect(screen.getByTestId("export-status-card")).toBeTruthy();
  });

  it("renders ready state with download button", () => {
    render(
      <DataExportScreen
        exportState="ready"
        fileSize="12.4 MB"
        expiresAt="05/15/2026"
        onRequestExport={jest.fn()}
        onDownload={jest.fn()}
        testID="export"
      />
    );
    expect(screen.getByTestId("export-download")).toBeTruthy();
    expect(screen.getByTestId("export-file-card")).toBeTruthy();
  });

  it("renders expired state with request new button", () => {
    render(
      <DataExportScreen
        exportState="expired"
        onRequestExport={jest.fn()}
        onRequestNew={jest.fn()}
        testID="export"
      />
    );
    expect(screen.getByTestId("export-expired-banner")).toBeTruthy();
    expect(screen.getByTestId("export-request-new")).toBeTruthy();
  });

  it("renders error state with retry button", () => {
    render(
      <DataExportScreen
        exportState="error"
        onRequestExport={jest.fn()}
        onRequestNew={jest.fn()}
        testID="export"
      />
    );
    expect(screen.getByTestId("export-retry")).toBeTruthy();
  });

  it("calls onRequestExport with selected category ids", () => {
    const onRequestExport = jest.fn();
    render(
      <DataExportScreen onRequestExport={onRequestExport} testID="export" />
    );
    fireEvent.press(screen.getByTestId("export-request"));
    expect(onRequestExport).toHaveBeenCalledWith(expect.arrayContaining(["profile"]));
  });
});

// ---------------------------------------------------------------------------
// DeleteAccountScreen
// ---------------------------------------------------------------------------

describe("DeleteAccountScreen", () => {
  it("renders delete button in default state", () => {
    render(
      <DeleteAccountScreen onDelete={jest.fn()} testID="delete" />
    );
    expect(screen.getByTestId("delete-delete-btn")).toBeTruthy();
  });

  it("renders cooldown state with days remaining", () => {
    render(
      <DeleteAccountScreen
        state="cooldown"
        cooldownDaysRemaining={14}
        onDelete={jest.fn()}
        onCancelDeletion={jest.fn()}
        testID="delete"
      />
    );
    expect(screen.getByTestId("delete-cooldown-card")).toBeTruthy();
    expect(screen.getByText("14 days remaining")).toBeTruthy();
    expect(screen.getByTestId("delete-cancel-deletion")).toBeTruthy();
  });

  it("renders error banner", () => {
    render(
      <DeleteAccountScreen
        state="error"
        deleteError="Deletion failed"
        onDelete={jest.fn()}
        testID="delete"
      />
    );
    expect(screen.getByTestId("delete-error-banner")).toBeTruthy();
  });

  it("opens deletion confirmation modal when delete button pressed", () => {
    render(
      <DeleteAccountScreen onDelete={jest.fn()} testID="delete" />
    );
    fireEvent.press(screen.getByTestId("delete-delete-btn"));
    expect(screen.getByTestId("delete-modal")).toBeTruthy();
  });
});
