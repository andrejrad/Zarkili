import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

import { ClientOnboardingProfileScreen } from "../ClientOnboardingProfileScreen";
import { ClientOnboardingPreferencesScreen } from "../ClientOnboardingPreferencesScreen";
import {
  ClientOnboardingNotificationsScreen,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "../ClientOnboardingNotificationsScreen";
import { ClientOnboardingLocationScreen } from "../ClientOnboardingLocationScreen";
import { ClientOnboardingPaymentScreen } from "../ClientOnboardingPaymentScreen";

describe("ClientOnboardingProfileScreen", () => {
  it("requires a display name", async () => {
    const onContinue = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, findByText } = render(
      <ClientOnboardingProfileScreen
        totalSteps={5}
        currentStep={1}
        onContinue={onContinue}
      />,
    );
    await act(async () => {
      fireEvent.press(getByTestId("profile-continue"));
    });
    expect(await findByText(/please enter a display name/i)).toBeTruthy();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("submits with display name and pronouns", async () => {
    const onContinue = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <ClientOnboardingProfileScreen
        totalSteps={5}
        currentStep={1}
        onContinue={onContinue}
      />,
    );
    fireEvent.changeText(getByTestId("profile-display-name"), "Andre");
    fireEvent.press(getByTestId("profile-pronouns-they/them"));
    await act(async () => {
      fireEvent.press(getByTestId("profile-continue"));
    });
    expect(onContinue).toHaveBeenCalledWith({
      displayName: "Andre",
      pronouns: "they/them",
    });
  });
});

describe("ClientOnboardingPreferencesScreen", () => {
  it("requires at least one category", async () => {
    const onContinue = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, findByText } = render(
      <ClientOnboardingPreferencesScreen
        totalSteps={5}
        currentStep={2}
        onContinue={onContinue}
      />,
    );
    await act(async () => {
      fireEvent.press(getByTestId("prefs-continue"));
    });
    expect(await findByText(/at least one/i)).toBeTruthy();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("toggles selection and submits", async () => {
    const onContinue = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <ClientOnboardingPreferencesScreen
        totalSteps={5}
        currentStep={2}
        onContinue={onContinue}
      />,
    );
    fireEvent.press(getByTestId("prefs-nails"));
    fireEvent.press(getByTestId("prefs-hair"));
    fireEvent.press(getByTestId("prefs-hair")); // toggle off
    await act(async () => {
      fireEvent.press(getByTestId("prefs-continue"));
    });
    expect(onContinue).toHaveBeenCalledWith(["nails"]);
  });
});

describe("ClientOnboardingNotificationsScreen", () => {
  it("defaults all toggles to OFF (TCPA/CAN-SPAM safe)", () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES).toEqual({
      bookingReminders: false,
      promotionsSms: false,
      promotionsEmail: false,
      newSalonsNearby: false,
    });
  });

  it("submits the current preferences", async () => {
    const onContinue = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <ClientOnboardingNotificationsScreen
        totalSteps={5}
        currentStep={3}
        onContinue={onContinue}
      />,
    );
    fireEvent(getByTestId("notif-bookingReminders"), "valueChange", true);
    await act(async () => {
      fireEvent.press(getByTestId("notif-continue"));
    });
    expect(onContinue).toHaveBeenCalledWith({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      bookingReminders: true,
    });
  });
});

describe("ClientOnboardingLocationScreen", () => {
  it("uses device location when permission granted", async () => {
    const coords = { lat: 40, lng: -74 };
    const onUseMyLocation = jest.fn().mockResolvedValue(coords);
    const onContinue = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <ClientOnboardingLocationScreen
        totalSteps={5}
        currentStep={4}
        onUseMyLocation={onUseMyLocation}
        onContinue={onContinue}
      />,
    );
    await act(async () => {
      fireEvent.press(getByTestId("location-device"));
    });
    expect(onContinue).toHaveBeenCalledWith({ kind: "device", coords });
  });

  it("falls back to ZIP when permission denied", async () => {
    const onUseMyLocation = jest.fn().mockRejectedValue(new Error("Permission denied"));
    const onContinue = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, findByText } = render(
      <ClientOnboardingLocationScreen
        totalSteps={5}
        currentStep={4}
        onUseMyLocation={onUseMyLocation}
        onContinue={onContinue}
      />,
    );
    await act(async () => {
      fireEvent.press(getByTestId("location-device"));
    });
    expect(await findByText(/Location permission denied/i)).toBeTruthy();
    fireEvent.changeText(getByTestId("location-zip"), "90210");
    await act(async () => {
      fireEvent.press(getByTestId("location-zip-continue"));
    });
    expect(onContinue).toHaveBeenCalledWith({ kind: "zip", zip: "90210" });
  });
});

describe("ClientOnboardingPaymentScreen", () => {
  it("renders Add card and Skip", () => {
    const { getByTestId } = render(
      <ClientOnboardingPaymentScreen
        totalSteps={5}
        currentStep={5}
        onAddCard={jest.fn().mockResolvedValue(undefined)}
        onSkip={jest.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(getByTestId("payment-add")).toBeTruthy();
    expect(getByTestId("payment-skip")).toBeTruthy();
  });

  it("calls onSkip when Skip pressed", async () => {
    const onSkip = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <ClientOnboardingPaymentScreen
        totalSteps={5}
        currentStep={5}
        onAddCard={jest.fn().mockResolvedValue(undefined)}
        onSkip={onSkip}
      />,
    );
    await act(async () => {
      fireEvent.press(getByTestId("payment-skip"));
    });
    expect(onSkip).toHaveBeenCalled();
  });
});
