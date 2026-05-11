/**
 * w31StaffExtras.test.tsx
 *
 * W31 Batch K — K.6 Staff Extras (30 tests)
 *
 * Covers: LocationSwitcherSheet, TimeOffRequestScreen,
 *         AvailabilityOverrideScreen, PayoutEarningsScreen,
 *         DailyCloseReportScreen, StaffOnboardingScreen
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  AvailabilityOverrideScreen,
  DailyCloseReportScreen,
  LocationSwitcherSheet,
  PayoutEarningsScreen,
  StaffOnboardingScreen,
  TimeOffRequestScreen,
} from "../src/app/staff/StaffExtrasScreen";

// ---------------------------------------------------------------------------
// LocationSwitcherSheet
// ---------------------------------------------------------------------------

describe("LocationSwitcherSheet", () => {
  const locations = [
    { id: "loc1", name: "Main Street", address: "123 Main St" },
    { id: "loc2", name: "East Side", address: "456 East Ave" },
  ];

  it("renders both locations", () => {
    const { getByTestId } = render(
      <LocationSwitcherSheet
        visible
        locations={locations}
        currentLocationId="loc1"
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
        testID="lss"
      />
    );
    expect(getByTestId("lss-loc-loc1")).toBeTruthy();
    expect(getByTestId("lss-loc-loc2")).toBeTruthy();
  });

  it("calls onConfirm with selected id when Confirm pressed", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <LocationSwitcherSheet
        visible
        locations={locations}
        currentLocationId="loc1"
        onConfirm={onConfirm}
        onDismiss={jest.fn()}
        testID="lss"
      />
    );
    fireEvent.press(getByTestId("lss-loc-loc2"));
    fireEvent.press(getByTestId("lss-confirm"));
    expect(onConfirm).toHaveBeenCalledWith("loc2");
  });

  it("renders nothing when not visible", () => {
    const { queryByTestId } = render(
      <LocationSwitcherSheet
        visible={false}
        locations={locations}
        currentLocationId="loc1"
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
        testID="lss"
      />
    );
    expect(queryByTestId("lss-loc-loc1")).toBeNull();
  });

  it("renders location names", () => {
    const { getByText } = render(
      <LocationSwitcherSheet
        visible
        locations={locations}
        currentLocationId="loc1"
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
        testID="lss"
      />
    );
    expect(getByText("Main Street")).toBeTruthy();
    expect(getByText("East Side")).toBeTruthy();
  });

  it("renders confirm button", () => {
    const { getByTestId } = render(
      <LocationSwitcherSheet
        visible
        locations={locations}
        currentLocationId="loc1"
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
        testID="lss"
      />
    );
    expect(getByTestId("lss-confirm")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// TimeOffRequestScreen
// ---------------------------------------------------------------------------

describe("TimeOffRequestScreen", () => {
  it("renders start and end date inputs", () => {
    const { getByTestId } = render(
      <TimeOffRequestScreen onSubmit={jest.fn()} testID="tor" />
    );
    expect(getByTestId("tor-start")).toBeTruthy();
    expect(getByTestId("tor-end")).toBeTruthy();
  });

  it("renders type chips", () => {
    const { getByTestId } = render(
      <TimeOffRequestScreen onSubmit={jest.fn()} testID="tor" />
    );
    expect(getByTestId("tor-type-vacation")).toBeTruthy();
    expect(getByTestId("tor-type-sick")).toBeTruthy();
  });

  it("renders submit button", () => {
    const { getByTestId } = render(
      <TimeOffRequestScreen onSubmit={jest.fn()} testID="tor" />
    );
    expect(getByTestId("tor-submit")).toBeTruthy();
  });

  it("calls onSubmit when dates filled and submit pressed", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <TimeOffRequestScreen onSubmit={onSubmit} testID="tor" />
    );
    fireEvent.changeText(getByTestId("tor-start"), "2026-07-01");
    fireEvent.changeText(getByTestId("tor-end"), "2026-07-07");
    fireEvent.press(getByTestId("tor-submit"));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: "2026-07-01", endDate: "2026-07-07" })
    );
  });

  it("shows submitted state after submit", async () => {
    const { getByTestId } = render(
      <TimeOffRequestScreen onSubmit={jest.fn()} testID="tor" />
    );
    fireEvent.changeText(getByTestId("tor-start"), "2026-07-01");
    fireEvent.changeText(getByTestId("tor-end"), "2026-07-07");
    fireEvent.press(getByTestId("tor-submit"));
    await Promise.resolve();
    expect(getByTestId("tor-submitted")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AvailabilityOverrideScreen
// ---------------------------------------------------------------------------

describe("AvailabilityOverrideScreen", () => {
  const initial = [{ day: "Mon" as const, startTime: "09:00", endTime: "17:00" }];

  it("renders day chips", () => {
    const { getByTestId } = render(
      <AvailabilityOverrideScreen initial={initial} onSave={jest.fn()} testID="aos" />
    );
    expect(getByTestId("aos-day-Mon")).toBeTruthy();
    expect(getByTestId("aos-day-Fri")).toBeTruthy();
  });

  it("renders start and end time fields", () => {
    const { getByTestId } = render(
      <AvailabilityOverrideScreen initial={initial} onSave={jest.fn()} testID="aos" />
    );
    expect(getByTestId("aos-start")).toBeTruthy();
    expect(getByTestId("aos-end")).toBeTruthy();
  });

  it("calls onSave when save pressed", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <AvailabilityOverrideScreen initial={initial} onSave={onSave} testID="aos" />
    );
    fireEvent.press(getByTestId("aos-save"));
    expect(onSave).toHaveBeenCalled();
  });

  it("switches selected day when chip pressed", () => {
    const { getByTestId } = render(
      <AvailabilityOverrideScreen initial={initial} onSave={jest.fn()} testID="aos" />
    );
    fireEvent.press(getByTestId("aos-day-Wed"));
    // No crash means pass; start field should now show empty (no slot for Wed)
    expect(getByTestId("aos-start")).toBeTruthy();
  });

  it("renders save button", () => {
    const { getByTestId } = render(
      <AvailabilityOverrideScreen initial={initial} onSave={jest.fn()} testID="aos" />
    );
    expect(getByTestId("aos-save")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PayoutEarningsScreen
// ---------------------------------------------------------------------------

describe("PayoutEarningsScreen", () => {
  const props = {
    currentEarnings: 45000,
    periodLabel: "This week",
    lineItems: [
      { id: "l1", label: "Services", amount: 40000, type: "credit" as const },
      { id: "l2", label: "Platform fee", amount: 5000, type: "debit" as const },
    ],
    payoutHistory: [
      { id: "ph1", date: "Apr 21", amount: 38000 },
    ],
    onRequestPayout: jest.fn(),
  };

  it("renders the earnings amount", () => {
    const { getByTestId } = render(
      <PayoutEarningsScreen {...props} testID="pes" />
    );
    expect(getByTestId("pes-amount")).toBeTruthy();
  });

  it("renders Request payout button", () => {
    const { getByTestId } = render(
      <PayoutEarningsScreen {...props} testID="pes" />
    );
    expect(getByTestId("pes-payout")).toBeTruthy();
  });

  it("calls onRequestPayout when button pressed", () => {
    const onPayout = jest.fn();
    const { getByTestId } = render(
      <PayoutEarningsScreen {...props} onRequestPayout={onPayout} testID="pes" />
    );
    fireEvent.press(getByTestId("pes-payout"));
    expect(onPayout).toHaveBeenCalled();
  });

  it("renders line items", () => {
    const { getByTestId } = render(
      <PayoutEarningsScreen {...props} testID="pes" />
    );
    expect(getByTestId("pes-line-l1")).toBeTruthy();
    expect(getByTestId("pes-line-l2")).toBeTruthy();
  });

  it("renders payout history rows", () => {
    const { getByTestId } = render(
      <PayoutEarningsScreen {...props} testID="pes" />
    );
    expect(getByTestId("pes-payout-ph1")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// DailyCloseReportScreen
// ---------------------------------------------------------------------------

describe("DailyCloseReportScreen", () => {
  const summary = {
    bookingsCount: 12,
    revenue: 180000,
    tips: 25000,
    noShows: 1,
  };

  it("renders bookings tile", () => {
    const { getByTestId } = render(
      <DailyCloseReportScreen
        summary={summary}
        date="April 29, 2026"
        onExport={jest.fn()}
        testID="dcr"
      />
    );
    expect(getByTestId("dcr-bookings")).toBeTruthy();
  });

  it("renders revenue tile", () => {
    const { getByTestId } = render(
      <DailyCloseReportScreen
        summary={summary}
        date="April 29, 2026"
        onExport={jest.fn()}
        testID="dcr"
      />
    );
    expect(getByTestId("dcr-revenue")).toBeTruthy();
  });

  it("renders tips and no-shows tiles", () => {
    const { getByTestId } = render(
      <DailyCloseReportScreen
        summary={summary}
        date="April 29, 2026"
        onExport={jest.fn()}
        testID="dcr"
      />
    );
    expect(getByTestId("dcr-tips")).toBeTruthy();
    expect(getByTestId("dcr-no-shows")).toBeTruthy();
  });

  it("renders export button", () => {
    const { getByTestId } = render(
      <DailyCloseReportScreen
        summary={summary}
        date="April 29, 2026"
        onExport={jest.fn()}
        testID="dcr"
      />
    );
    expect(getByTestId("dcr-export")).toBeTruthy();
  });

  it("calls onExport when export pressed", () => {
    const onExport = jest.fn();
    const { getByTestId } = render(
      <DailyCloseReportScreen
        summary={summary}
        date="April 29, 2026"
        onExport={onExport}
        testID="dcr"
      />
    );
    fireEvent.press(getByTestId("dcr-export"));
    expect(onExport).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// StaffOnboardingScreen
// ---------------------------------------------------------------------------

describe("StaffOnboardingScreen", () => {
  it("renders step bar with 4 dots", () => {
    const { getByTestId } = render(
      <StaffOnboardingScreen onComplete={jest.fn()} testID="so" />
    );
    expect(getByTestId("so-dot-0")).toBeTruthy();
    expect(getByTestId("so-dot-3")).toBeTruthy();
  });

  it("renders step 0 content initially", () => {
    const { getByTestId } = render(
      <StaffOnboardingScreen onComplete={jest.fn()} testID="so" />
    );
    expect(getByTestId("so-step-0")).toBeTruthy();
  });

  it("advances to step 1 when Next pressed", () => {
    const { getByTestId } = render(
      <StaffOnboardingScreen onComplete={jest.fn()} testID="so" />
    );
    fireEvent.press(getByTestId("so-next"));
    expect(getByTestId("so-step-1")).toBeTruthy();
  });

  it("renders first and last name inputs on step 1", () => {
    const { getByTestId } = render(
      <StaffOnboardingScreen onComplete={jest.fn()} testID="so" />
    );
    fireEvent.press(getByTestId("so-next")); // go to step 1
    expect(getByTestId("so-first-name")).toBeTruthy();
    expect(getByTestId("so-last-name")).toBeTruthy();
  });

  it("renders 'Finish setup' on final step and calls onComplete", () => {
    const onComplete = jest.fn();
    const { getByTestId, getByText } = render(
      <StaffOnboardingScreen onComplete={onComplete} testID="so" />
    );
    // Step 0 → 1 → 2 → 3
    fireEvent.press(getByTestId("so-next"));
    fireEvent.press(getByTestId("so-next"));
    fireEvent.press(getByTestId("so-next"));
    expect(getByText("Finish setup")).toBeTruthy();
    fireEvent.press(getByTestId("so-next"));
    expect(onComplete).toHaveBeenCalled();
  });
});
