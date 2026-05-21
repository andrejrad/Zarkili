import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

import { GuestBookingGateScreen } from "../GuestBookingGateScreen";

const defaultProps = {
  serviceName: "Gel manicure",
  locationName: "Luna Studio",
  onSocialProvider: jest.fn().mockResolvedValue(undefined),
  onUseEmail: jest.fn(),
  onSignIn: jest.fn(),
  onBack: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GuestBookingGateScreen", () => {
  it("renders contextual heading with service and location names", () => {
    const { getByText } = render(
      <GuestBookingGateScreen {...defaultProps} testID="gate" />,
    );
    expect(getByText("Almost there")).toBeTruthy();
    expect(getByText("Gel manicure")).toBeTruthy();
    expect(getByText("Luna Studio")).toBeTruthy();
  });

  it("renders Apple and Google primary buttons", () => {
    const { getByTestId } = render(
      <GuestBookingGateScreen {...defaultProps} testID="gate" />,
    );
    expect(getByTestId("gate-apple")).toBeTruthy();
    expect(getByTestId("gate-google")).toBeTruthy();
  });

  it("renders Use email and Sign in secondary CTAs", () => {
    const { getByTestId } = render(
      <GuestBookingGateScreen {...defaultProps} testID="gate" />,
    );
    expect(getByTestId("gate-email")).toBeTruthy();
    expect(getByTestId("gate-signin")).toBeTruthy();
  });

  it("calls onSocialProvider('apple') when Apple button pressed", async () => {
    const onSocialProvider = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <GuestBookingGateScreen
        {...defaultProps}
        onSocialProvider={onSocialProvider}
        testID="gate"
      />,
    );
    await act(async () => {
      fireEvent.press(getByTestId("gate-apple"));
    });
    expect(onSocialProvider).toHaveBeenCalledWith("apple");
  });

  it("calls onSocialProvider('google') when Google button pressed", async () => {
    const onSocialProvider = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <GuestBookingGateScreen
        {...defaultProps}
        onSocialProvider={onSocialProvider}
        testID="gate"
      />,
    );
    await act(async () => {
      fireEvent.press(getByTestId("gate-google"));
    });
    expect(onSocialProvider).toHaveBeenCalledWith("google");
  });

  it("shows error banner when social provider rejects", async () => {
    const onSocialProvider = jest.fn().mockRejectedValue(new Error("Cancelled"));
    const { getByTestId, findByText } = render(
      <GuestBookingGateScreen
        {...defaultProps}
        onSocialProvider={onSocialProvider}
        testID="gate"
      />,
    );
    await act(async () => {
      fireEvent.press(getByTestId("gate-apple"));
    });
    expect(await findByText(/Cancelled/)).toBeTruthy();
  });

  it("calls onUseEmail when Use email button pressed", () => {
    const onUseEmail = jest.fn();
    const { getByTestId } = render(
      <GuestBookingGateScreen
        {...defaultProps}
        onUseEmail={onUseEmail}
        testID="gate"
      />,
    );
    fireEvent.press(getByTestId("gate-email"));
    expect(onUseEmail).toHaveBeenCalledTimes(1);
  });

  it("calls onSignIn when Sign in link pressed", () => {
    const onSignIn = jest.fn();
    const { getByTestId } = render(
      <GuestBookingGateScreen
        {...defaultProps}
        onSignIn={onSignIn}
        testID="gate"
      />,
    );
    fireEvent.press(getByTestId("gate-signin"));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when back button pressed", () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <GuestBookingGateScreen
        {...defaultProps}
        onBack={onBack}
        testID="gate"
      />,
    );
    fireEvent.press(getByTestId("gate-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
