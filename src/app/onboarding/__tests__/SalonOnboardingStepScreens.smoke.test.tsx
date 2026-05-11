/**
 * SalonOnboardingStepScreens.smoke.test.tsx
 *
 * Smoke tests for all 9 salon onboarding step form screens.
 * Each screen is rendered and its key UI elements and interactions are verified.
 * W37-DEBT-7 closed.
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

import { SalonOnboardingAccountScreen } from "../SalonOnboardingAccountScreen";
import { SalonOnboardingBusinessProfileScreen } from "../SalonOnboardingBusinessProfileScreen";
import { SalonOnboardingPaymentSetupScreen } from "../SalonOnboardingPaymentSetupScreen";
import { SalonOnboardingServicesScreen } from "../SalonOnboardingServicesScreen";
import { SalonOnboardingStaffScreen } from "../SalonOnboardingStaffScreen";
import { SalonOnboardingPoliciesScreen } from "../SalonOnboardingPoliciesScreen";
import { SalonOnboardingAvailabilityScreen } from "../SalonOnboardingAvailabilityScreen";
import { SalonOnboardingMarketplaceScreen } from "../SalonOnboardingMarketplaceScreen";
import { SalonOnboardingVerificationScreen } from "../SalonOnboardingVerificationScreen";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const noop = jest.fn(() => Promise.resolve());

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// 1. Account
// ---------------------------------------------------------------------------

describe("SalonOnboardingAccountScreen", () => {
  it("renders stepper and email field", () => {
    const { getByTestId } = render(
      <SalonOnboardingAccountScreen totalSteps={9} currentStep={1} onContinue={noop} />,
    );
    expect(getByTestId("salon-account-stepper")).toBeTruthy();
    expect(getByTestId("salon-account-email")).toBeTruthy();
  });

  it("shows error when email is empty", async () => {
    const { getByTestId, getByText } = render(
      <SalonOnboardingAccountScreen totalSteps={9} currentStep={1} onContinue={noop} />,
    );
    fireEvent.press(getByTestId("salon-account-continue"));
    await waitFor(() => expect(getByText(/email/i)).toBeTruthy());
  });

  it("shows error for invalid email", async () => {
    const { getByTestId, getByText } = render(
      <SalonOnboardingAccountScreen totalSteps={9} currentStep={1} onContinue={noop} />,
    );
    fireEvent.changeText(getByTestId("salon-account-email"), "not-an-email");
    fireEvent.press(getByTestId("salon-account-continue"));
    await waitFor(() => expect(getByText(/valid email/i)).toBeTruthy());
  });

  it("calls onContinue with valid email", async () => {
    const onContinue = jest.fn(() => Promise.resolve());
    const { getByTestId } = render(
      <SalonOnboardingAccountScreen totalSteps={9} currentStep={1} onContinue={onContinue} />,
    );
    fireEvent.changeText(getByTestId("salon-account-email"), "owner@salon.com");
    await act(async () => { fireEvent.press(getByTestId("salon-account-continue")); });
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ ownerEmail: "owner@salon.com" }),
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Business Profile
// ---------------------------------------------------------------------------

describe("SalonOnboardingBusinessProfileScreen", () => {
  const BASE = { totalSteps: 9, currentStep: 2, onContinue: noop };

  it("renders stepper and legal name field", () => {
    const { getByTestId } = render(<SalonOnboardingBusinessProfileScreen {...BASE} />);
    expect(getByTestId("salon-bizprofile-stepper")).toBeTruthy();
    expect(getByTestId("salon-bizprofile-legal-name")).toBeTruthy();
  });

  it("shows error when required fields are missing", async () => {
    const { getByTestId, getByText } = render(<SalonOnboardingBusinessProfileScreen {...BASE} />);
    fireEvent.press(getByTestId("salon-bizprofile-continue"));
    await waitFor(() => expect(getByText(/legal name/i)).toBeTruthy());
  });

  it("calls onContinue with all required fields filled", async () => {
    const onContinue = jest.fn(() => Promise.resolve());
    const { getByTestId } = render(
      <SalonOnboardingBusinessProfileScreen totalSteps={9} currentStep={2} onContinue={onContinue} />,
    );
    fireEvent.changeText(getByTestId("salon-bizprofile-legal-name"), "Salon LLC");
    fireEvent.changeText(getByTestId("salon-bizprofile-address"), "123 Main St");
    fireEvent.changeText(getByTestId("salon-bizprofile-city"), "London");
    fireEvent.changeText(getByTestId("salon-bizprofile-country"), "GB");
    await act(async () => { fireEvent.press(getByTestId("salon-bizprofile-continue")); });
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ legalName: "Salon LLC", city: "London" }),
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Payment Setup
// ---------------------------------------------------------------------------

describe("SalonOnboardingPaymentSetupScreen", () => {
  const BASE = { totalSteps: 9, currentStep: 3, onContinue: noop, onSkip: noop };

  it("renders stepper and confirm checkbox", () => {
    const { getByTestId } = render(<SalonOnboardingPaymentSetupScreen {...BASE} />);
    expect(getByTestId("salon-payment-stepper")).toBeTruthy();
    expect(getByTestId("salon-payment-confirm")).toBeTruthy();
  });

  it("shows error when checkbox not checked", async () => {
    const { getByTestId, getByText } = render(<SalonOnboardingPaymentSetupScreen {...BASE} />);
    fireEvent.press(getByTestId("salon-payment-continue"));
    await waitFor(() => expect(getByText(/confirm/i)).toBeTruthy());
  });

  it("calls onSkip when skip pressed", () => {
    const onSkip = jest.fn();
    const { getByTestId } = render(
      <SalonOnboardingPaymentSetupScreen totalSteps={9} currentStep={3} onContinue={noop} onSkip={onSkip} />,
    );
    fireEvent.press(getByTestId("salon-payment-skip"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 4. Services
// ---------------------------------------------------------------------------

describe("SalonOnboardingServicesScreen", () => {
  const BASE = { totalSteps: 9, currentStep: 4, onContinue: noop };

  it("renders stepper and first service name field", () => {
    const { getByTestId } = render(<SalonOnboardingServicesScreen {...BASE} />);
    expect(getByTestId("salon-services-stepper")).toBeTruthy();
    expect(getByTestId("salon-services-name-0")).toBeTruthy();
  });

  it("shows error when no service name is entered", async () => {
    const { getByTestId, getByText } = render(<SalonOnboardingServicesScreen {...BASE} />);
    fireEvent.press(getByTestId("salon-services-continue"));
    await waitFor(() => expect(getByText(/at least one service/i)).toBeTruthy());
  });

  it("adds a second service row when add is pressed", () => {
    const { getByTestId } = render(<SalonOnboardingServicesScreen {...BASE} />);
    fireEvent.press(getByTestId("salon-services-add"));
    expect(getByTestId("salon-services-name-1")).toBeTruthy();
  });

  it("calls onContinue with valid service", async () => {
    const onContinue = jest.fn(() => Promise.resolve());
    const { getByTestId } = render(
      <SalonOnboardingServicesScreen totalSteps={9} currentStep={4} onContinue={onContinue} />,
    );
    fireEvent.changeText(getByTestId("salon-services-name-0"), "Haircut");
    fireEvent.changeText(getByTestId("salon-services-duration-0"), "45");
    await act(async () => { fireEvent.press(getByTestId("salon-services-continue")); });
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ services: expect.arrayContaining([expect.objectContaining({ name: "Haircut" })]) }),
    );
  });
});

// ---------------------------------------------------------------------------
// 5. Staff
// ---------------------------------------------------------------------------

describe("SalonOnboardingStaffScreen", () => {
  const BASE = { totalSteps: 9, currentStep: 5, onContinue: noop };

  it("renders stepper and name field", () => {
    const { getByTestId } = render(<SalonOnboardingStaffScreen {...BASE} />);
    expect(getByTestId("salon-staff-stepper")).toBeTruthy();
    expect(getByTestId("salon-staff-name-0")).toBeTruthy();
  });

  it("shows error for invalid email", async () => {
    const { getByTestId, getByText } = render(<SalonOnboardingStaffScreen {...BASE} />);
    fireEvent.changeText(getByTestId("salon-staff-name-0"), "Jane");
    fireEvent.changeText(getByTestId("salon-staff-email-0"), "not-email");
    await act(async () => { fireEvent.press(getByTestId("salon-staff-continue")); });
    await waitFor(() => expect(getByText(/not a valid email/i)).toBeTruthy());
  });

  it("calls onContinue with valid staff", async () => {
    const onContinue = jest.fn(() => Promise.resolve());
    const { getByTestId } = render(
      <SalonOnboardingStaffScreen totalSteps={9} currentStep={5} onContinue={onContinue} />,
    );
    fireEvent.changeText(getByTestId("salon-staff-name-0"), "Maria");
    fireEvent.changeText(getByTestId("salon-staff-email-0"), "maria@salon.com");
    await act(async () => { fireEvent.press(getByTestId("salon-staff-continue")); });
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ staff: expect.arrayContaining([expect.objectContaining({ name: "Maria" })]) }),
    );
  });
});

// ---------------------------------------------------------------------------
// 6. Policies
// ---------------------------------------------------------------------------

describe("SalonOnboardingPoliciesScreen", () => {
  const BASE = { totalSteps: 9, currentStep: 6, onContinue: noop };

  it("renders stepper and policy chips", () => {
    const { getByTestId } = render(<SalonOnboardingPoliciesScreen {...BASE} />);
    expect(getByTestId("salon-policies-stepper")).toBeTruthy();
    expect(getByTestId("salon-policies-chip-flexible")).toBeTruthy();
    expect(getByTestId("salon-policies-chip-moderate")).toBeTruthy();
    expect(getByTestId("salon-policies-chip-strict")).toBeTruthy();
  });

  it("shows error when no policy is selected", async () => {
    const { getByTestId, getByText } = render(<SalonOnboardingPoliciesScreen {...BASE} />);
    fireEvent.press(getByTestId("salon-policies-continue"));
    await waitFor(() => expect(getByText(/cancellation policy/i)).toBeTruthy());
  });

  it("calls onContinue with selected policy", async () => {
    const onContinue = jest.fn(() => Promise.resolve());
    const { getByTestId } = render(
      <SalonOnboardingPoliciesScreen totalSteps={9} currentStep={6} onContinue={onContinue} />,
    );
    fireEvent.press(getByTestId("salon-policies-chip-moderate"));
    await act(async () => { fireEvent.press(getByTestId("salon-policies-continue")); });
    expect(onContinue).toHaveBeenCalledWith({ cancellationPolicy: "moderate" });
  });
});

// ---------------------------------------------------------------------------
// 7. Availability
// ---------------------------------------------------------------------------

describe("SalonOnboardingAvailabilityScreen", () => {
  const BASE = { totalSteps: 9, currentStep: 7, onContinue: noop };

  it("renders stepper and day toggles", () => {
    const { getByTestId } = render(<SalonOnboardingAvailabilityScreen {...BASE} />);
    expect(getByTestId("salon-availability-stepper")).toBeTruthy();
    expect(getByTestId("salon-availability-toggle-mon")).toBeTruthy();
  });

  it("shows error when all days disabled", async () => {
    const { getByTestId, getByText } = render(
      <SalonOnboardingAvailabilityScreen
        {...BASE}
        initialWeekTemplate={{
          mon: { open: false, openTime: "09:00", closeTime: "18:00" },
          tue: { open: false, openTime: "09:00", closeTime: "18:00" },
          wed: { open: false, openTime: "09:00", closeTime: "18:00" },
          thu: { open: false, openTime: "09:00", closeTime: "18:00" },
          fri: { open: false, openTime: "09:00", closeTime: "18:00" },
          sat: { open: false, openTime: "09:00", closeTime: "18:00" },
          sun: { open: false, openTime: "09:00", closeTime: "18:00" },
        }}
      />,
    );
    fireEvent.press(getByTestId("salon-availability-continue"));
    await waitFor(() => expect(getByText(/at least one open day/i)).toBeTruthy());
  });

  it("calls onContinue when at least one day is open (default)", async () => {
    const onContinue = jest.fn(() => Promise.resolve());
    const { getByTestId } = render(
      <SalonOnboardingAvailabilityScreen totalSteps={9} currentStep={7} onContinue={onContinue} />,
    );
    await act(async () => { fireEvent.press(getByTestId("salon-availability-continue")); });
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ weekTemplate: expect.any(Object) }),
    );
  });
});

// ---------------------------------------------------------------------------
// 8. Marketplace
// ---------------------------------------------------------------------------

describe("SalonOnboardingMarketplaceScreen", () => {
  const BASE = { totalSteps: 9, currentStep: 8, onContinue: noop };

  it("renders stepper and toggle", () => {
    const { getByTestId } = render(<SalonOnboardingMarketplaceScreen {...BASE} />);
    expect(getByTestId("salon-marketplace-stepper")).toBeTruthy();
    expect(getByTestId("salon-marketplace-toggle")).toBeTruthy();
  });

  it("calls onContinue with isListed=false by default", async () => {
    const onContinue = jest.fn(() => Promise.resolve());
    const { getByTestId } = render(
      <SalonOnboardingMarketplaceScreen totalSteps={9} currentStep={8} onContinue={onContinue} />,
    );
    await act(async () => { fireEvent.press(getByTestId("salon-marketplace-continue")); });
    expect(onContinue).toHaveBeenCalledWith({ isListed: false });
  });

  it("calls onContinue with isListed=true when toggled on", async () => {
    const onContinue = jest.fn(() => Promise.resolve());
    const { getByTestId } = render(
      <SalonOnboardingMarketplaceScreen totalSteps={9} currentStep={8} onContinue={onContinue} />,
    );
    fireEvent(getByTestId("salon-marketplace-toggle"), "valueChange", true);
    await act(async () => { fireEvent.press(getByTestId("salon-marketplace-continue")); });
    expect(onContinue).toHaveBeenCalledWith({ isListed: true });
  });
});

// ---------------------------------------------------------------------------
// 9. Verification
// ---------------------------------------------------------------------------

describe("SalonOnboardingVerificationScreen", () => {
  const BASE = { totalSteps: 9, currentStep: 9, onContinue: noop };

  it("renders stepper and document chips", () => {
    const { getByTestId } = render(<SalonOnboardingVerificationScreen {...BASE} />);
    expect(getByTestId("salon-verification-stepper")).toBeTruthy();
    expect(getByTestId("salon-verification-chip-passport")).toBeTruthy();
  });

  it("shows error when no document selected", async () => {
    const { getByTestId, getByText } = render(<SalonOnboardingVerificationScreen {...BASE} />);
    fireEvent.press(getByTestId("salon-verification-continue"));
    await waitFor(() => expect(getByText(/document type/i)).toBeTruthy());
  });

  it("shows error when confirmed not checked", async () => {
    const { getByTestId, getByText } = render(<SalonOnboardingVerificationScreen {...BASE} />);
    fireEvent.press(getByTestId("salon-verification-chip-passport"));
    fireEvent.press(getByTestId("salon-verification-continue"));
    await waitFor(() => expect(getByText(/confirm/i)).toBeTruthy());
  });

  it("calls onContinue when document selected and confirmed", async () => {
    const onContinue = jest.fn(() => Promise.resolve());
    const { getByTestId } = render(
      <SalonOnboardingVerificationScreen totalSteps={9} currentStep={9} onContinue={onContinue} />,
    );
    fireEvent.press(getByTestId("salon-verification-chip-national-id"));
    fireEvent.press(getByTestId("salon-verification-confirm"));
    await act(async () => { fireEvent.press(getByTestId("salon-verification-continue")); });
    expect(onContinue).toHaveBeenCalledWith({
      documentType: "national-id",
      confirmed: true,
    });
  });
});
