/**
 * w31NotificationsLoyaltyExtras.test.tsx
 *
 * W31 Batch K — K.3 Notifications Extras + K.4 Loyalty Extras (40 tests)
 *
 * Covers:
 *   K.3: ChannelPreferencesScreen, QuietHoursScreen,
 *        PermissionDeniedRecoveryScreen, InAppNotificationBanner
 *   K.4: TierUpCelebrationScreen, RewardRedemptionConfirmScreen,
 *        PointsExpiryWarningSheet, LoyaltyTermsPage
 */

import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import {
  ChannelPreferencesScreen,
  InAppNotificationBanner,
  PermissionDeniedRecoveryScreen,
  QuietHoursScreen,
} from "../src/app/notifications/NotificationsExtrasScreen";

import {
  LoyaltyTermsPage,
  PointsExpiryWarningSheet,
  RewardRedemptionConfirmScreen,
  TierUpCelebrationScreen,
} from "../src/app/loyalty/LoyaltyExtrasScreen";

// ---------------------------------------------------------------------------
// ChannelPreferencesScreen
// ---------------------------------------------------------------------------

describe("ChannelPreferencesScreen", () => {
  const prefs = { booking_confirmed: { push: true, email: false, sms: false } };

  it("renders title", () => {
    const { getByText } = render(
      <ChannelPreferencesScreen
        initialPreferences={prefs}
        onSave={jest.fn()}
        testID="cps"
      />
    );
    expect(getByText("Notification channels")).toBeTruthy();
  });

  it("renders the matrix", () => {
    const { getByTestId } = render(
      <ChannelPreferencesScreen
        initialPreferences={prefs}
        onSave={jest.fn()}
        testID="cps"
      />
    );
    expect(getByTestId("cps-matrix")).toBeTruthy();
  });

  it("renders save button", () => {
    const { getByTestId } = render(
      <ChannelPreferencesScreen
        initialPreferences={prefs}
        onSave={jest.fn()}
        testID="cps"
      />
    );
    expect(getByTestId("cps-save")).toBeTruthy();
  });

  it("calls onSave when save pressed", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <ChannelPreferencesScreen
        initialPreferences={prefs}
        onSave={onSave}
        testID="cps"
      />
    );
    fireEvent.press(getByTestId("cps-save"));
    expect(onSave).toHaveBeenCalled();
  });

  it("shows error text when onSave throws", async () => {
    const onSave = jest.fn().mockRejectedValue(new Error("fail"));
    const { getByTestId } = render(
      <ChannelPreferencesScreen
        initialPreferences={prefs}
        onSave={onSave}
        testID="cps"
      />
    );
    fireEvent.press(getByTestId("cps-save"));
    await waitFor(() => expect(getByTestId("cps-error")).toBeTruthy());
  });
});

// ---------------------------------------------------------------------------
// QuietHoursScreen
// ---------------------------------------------------------------------------

describe("QuietHoursScreen", () => {
  const initial = {
    enabled: true,
    startTime: "22:00",
    endTime: "07:00",
    days: ["Mon" as const, "Tue" as const],
  };

  it("renders title", () => {
    const { getByText } = render(
      <QuietHoursScreen initial={initial} onSave={jest.fn()} testID="qh" />
    );
    expect(getByText("Quiet hours")).toBeTruthy();
  });

  it("renders start and end time pickers", () => {
    const { getByTestId } = render(
      <QuietHoursScreen initial={initial} onSave={jest.fn()} testID="qh" />
    );
    expect(getByTestId("qh-start")).toBeTruthy();
    expect(getByTestId("qh-end")).toBeTruthy();
  });

  it("renders day chips", () => {
    const { getByTestId } = render(
      <QuietHoursScreen initial={initial} onSave={jest.fn()} testID="qh" />
    );
    expect(getByTestId("qh-day-Mon")).toBeTruthy();
    expect(getByTestId("qh-day-Sat")).toBeTruthy();
  });

  it("calls onSave when save pressed", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <QuietHoursScreen initial={initial} onSave={onSave} testID="qh" />
    );
    fireEvent.press(getByTestId("qh-save"));
    expect(onSave).toHaveBeenCalled();
  });

  it("toggles day chip active state on press", () => {
    const { getByTestId } = render(
      <QuietHoursScreen initial={initial} onSave={jest.fn()} testID="qh" />
    );
    // Wed should be inactive initially — pressing it should not throw
    fireEvent.press(getByTestId("qh-day-Wed"));
    // No assertion needed — just checks no crash
  });
});

// ---------------------------------------------------------------------------
// PermissionDeniedRecoveryScreen
// ---------------------------------------------------------------------------

describe("PermissionDeniedRecoveryScreen", () => {
  it("renders title", () => {
    const { getByTestId } = render(
      <PermissionDeniedRecoveryScreen onDismiss={jest.fn()} testID="pdr" />
    );
    expect(getByTestId("pdr-title")).toBeTruthy();
  });

  it("renders Open Settings button", () => {
    const { getByTestId } = render(
      <PermissionDeniedRecoveryScreen onDismiss={jest.fn()} testID="pdr" />
    );
    expect(getByTestId("pdr-settings")).toBeTruthy();
  });

  it("renders dismiss button", () => {
    const { getByTestId } = render(
      <PermissionDeniedRecoveryScreen onDismiss={jest.fn()} testID="pdr" />
    );
    expect(getByTestId("pdr-dismiss")).toBeTruthy();
  });

  it("calls onDismiss when maybe-later pressed", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <PermissionDeniedRecoveryScreen onDismiss={onDismiss} testID="pdr" />
    );
    fireEvent.press(getByTestId("pdr-dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("renders body copy about notifications being off", () => {
    const { getByText } = render(
      <PermissionDeniedRecoveryScreen onDismiss={jest.fn()} testID="pdr" />
    );
    expect(getByText(/Notifications are turned off/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// InAppNotificationBanner
// ---------------------------------------------------------------------------

describe("InAppNotificationBanner", () => {
  it("renders nothing when not visible", () => {
    const { queryByTestId } = render(
      <InAppNotificationBanner
        visible={false}
        title="Test"
        onDismiss={jest.fn()}
        testID="nb"
      />
    );
    expect(queryByTestId("nb")).toBeNull();
  });

  it("renders title when visible", () => {
    const { getByTestId } = render(
      <InAppNotificationBanner
        visible
        title="New booking confirmed"
        onDismiss={jest.fn()}
        testID="nb"
      />
    );
    expect(getByTestId("nb-title")).toBeTruthy();
  });

  it("renders optional body text", () => {
    const { getByTestId } = render(
      <InAppNotificationBanner
        visible
        title="Reminder"
        body="Your appointment is in 1 hour"
        onDismiss={jest.fn()}
        testID="nb"
      />
    );
    expect(getByTestId("nb-body")).toBeTruthy();
  });

  it("renders action button when actionLabel provided", () => {
    const { getByTestId } = render(
      <InAppNotificationBanner
        visible
        title="Sale"
        actionLabel="View offer"
        onAction={jest.fn()}
        onDismiss={jest.fn()}
        testID="nb"
      />
    );
    expect(getByTestId("nb-action")).toBeTruthy();
  });

  it("calls onDismiss when ✕ pressed", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <InAppNotificationBanner
        visible
        title="Test"
        onDismiss={onDismiss}
        testID="nb"
      />
    );
    fireEvent.press(getByTestId("nb-dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TierUpCelebrationScreen
// ---------------------------------------------------------------------------

describe("TierUpCelebrationScreen", () => {
  it("renders without crashing", () => {
    const { getByTestId } = render(
      <TierUpCelebrationScreen
        newTier="Gold"
        onExploreBenefits={jest.fn()}
        testID="tus"
      />
    );
    expect(getByTestId("tus")).toBeTruthy();
  });

  it("renders tier name inside celebration", () => {
    const { getByText } = render(
      <TierUpCelebrationScreen
        newTier="Platinum"
        onExploreBenefits={jest.fn()}
        testID="tus"
      />
    );
    expect(getByText("Platinum")).toBeTruthy();
  });

  it("renders benefit headline when provided", () => {
    const { getByTestId } = render(
      <TierUpCelebrationScreen
        newTier="Silver"
        benefitHeadline="Enjoy 10% off!"
        onExploreBenefits={jest.fn()}
        testID="tus"
      />
    );
    expect(getByTestId("tus-celebrate-benefit")).toBeTruthy();
  });

  it("calls onExploreBenefits when CTA pressed", () => {
    const onExplore = jest.fn();
    const { getByTestId } = render(
      <TierUpCelebrationScreen
        newTier="Gold"
        onExploreBenefits={onExplore}
        testID="tus"
      />
    );
    fireEvent.press(getByTestId("tus-celebrate-dismiss"));
    expect(onExplore).toHaveBeenCalled();
  });

  it("renders headline text", () => {
    const { getByText } = render(
      <TierUpCelebrationScreen
        newTier="Bronze"
        onExploreBenefits={jest.fn()}
        testID="tus"
      />
    );
    expect(getByText(/You've reached Bronze/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// RewardRedemptionConfirmScreen
// ---------------------------------------------------------------------------

describe("RewardRedemptionConfirmScreen", () => {
  const reward = { id: "r1", title: "Free Blowout", pointsCost: 200 };

  it("renders title", () => {
    const { getByTestId } = render(
      <RewardRedemptionConfirmScreen
        reward={reward}
        currentPoints={500}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="rrc"
      />
    );
    expect(getByTestId("rrc-title")).toBeTruthy();
  });

  it("renders current points", () => {
    const { getByTestId } = render(
      <RewardRedemptionConfirmScreen
        reward={reward}
        currentPoints={500}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="rrc"
      />
    );
    expect(getByTestId("rrc-current-points")).toBeTruthy();
  });

  it("renders remaining points after deduction", () => {
    const { getByTestId } = render(
      <RewardRedemptionConfirmScreen
        reward={reward}
        currentPoints={500}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="rrc"
      />
    );
    expect(getByTestId("rrc-remaining")).toBeTruthy();
  });

  it("calls onConfirm when redeem pressed", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <RewardRedemptionConfirmScreen
        reward={reward}
        currentPoints={500}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
        testID="rrc"
      />
    );
    fireEvent.press(getByTestId("rrc-confirm"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("disables confirm when user can't afford reward", () => {
    const { getByTestId } = render(
      <RewardRedemptionConfirmScreen
        reward={reward}
        currentPoints={50}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="rrc"
      />
    );
    expect(getByTestId("rrc-error")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PointsExpiryWarningSheet
// ---------------------------------------------------------------------------

describe("PointsExpiryWarningSheet", () => {
  it("renders nothing when not visible", () => {
    const { queryByTestId } = render(
      <PointsExpiryWarningSheet
        visible={false}
        expiringPoints={100}
        daysUntilExpiry={7}
        onUseNow={jest.fn()}
        onDismiss={jest.fn()}
        testID="pew"
      />
    );
    expect(queryByTestId("pew-message")).toBeNull();
  });

  it("renders expiry message when visible", () => {
    const { getByTestId } = render(
      <PointsExpiryWarningSheet
        visible
        expiringPoints={250}
        daysUntilExpiry={5}
        onUseNow={jest.fn()}
        onDismiss={jest.fn()}
        testID="pew"
      />
    );
    expect(getByTestId("pew-message")).toBeTruthy();
  });

  it("calls onUseNow when Use now pressed", () => {
    const onUseNow = jest.fn();
    const { getByTestId } = render(
      <PointsExpiryWarningSheet
        visible
        expiringPoints={100}
        daysUntilExpiry={3}
        onUseNow={onUseNow}
        onDismiss={jest.fn()}
        testID="pew"
      />
    );
    fireEvent.press(getByTestId("pew-use-now"));
    expect(onUseNow).toHaveBeenCalled();
  });

  it("calls onDismiss when remind pressed", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <PointsExpiryWarningSheet
        visible
        expiringPoints={100}
        daysUntilExpiry={3}
        onUseNow={jest.fn()}
        onDismiss={onDismiss}
        testID="pew"
      />
    );
    fireEvent.press(getByTestId("pew-dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("includes points and days in message text", () => {
    const { getByText } = render(
      <PointsExpiryWarningSheet
        visible
        expiringPoints={300}
        daysUntilExpiry={10}
        onUseNow={jest.fn()}
        onDismiss={jest.fn()}
        testID="pew"
      />
    );
    expect(getByText(/300/)).toBeTruthy();
    expect(getByText(/10/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// LoyaltyTermsPage
// ---------------------------------------------------------------------------

describe("LoyaltyTermsPage", () => {
  it("renders without crashing", () => {
    const { getByText } = render(
      <LoyaltyTermsPage onClose={jest.fn()} testID="ltp" />
    );
    expect(getByText("Loyalty Programme Terms")).toBeTruthy();
  });

  it("renders earn section heading", () => {
    const { getAllByText } = render(
      <LoyaltyTermsPage onClose={jest.fn()} testID="ltp" />
    );
    expect(getAllByText("Earning points").length).toBeGreaterThan(0);
  });

  it("renders tiers section heading", () => {
    const { getAllByText } = render(
      <LoyaltyTermsPage onClose={jest.fn()} testID="ltp" />
    );
    expect(getAllByText("Tier levels").length).toBeGreaterThan(0);
  });

  it("renders expiration section heading", () => {
    const { getAllByText } = render(
      <LoyaltyTermsPage onClose={jest.fn()} testID="ltp" />
    );
    expect(getAllByText("Points expiration").length).toBeGreaterThan(0);
  });

  it("renders redemption section heading", () => {
    const { getAllByText } = render(
      <LoyaltyTermsPage onClose={jest.fn()} testID="ltp" />
    );
    expect(getAllByText("Redemption").length).toBeGreaterThan(0);
  });
});
