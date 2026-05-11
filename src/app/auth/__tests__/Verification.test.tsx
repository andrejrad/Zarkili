import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";

import { EmailVerificationScreen } from "../EmailVerificationScreen";
import { OtpVerificationScreen } from "../OtpVerificationScreen";

describe("EmailVerificationScreen", () => {
  it("renders email and resend CTA in waiting state", () => {
    const { getByText, getByTestId } = render(
      <EmailVerificationScreen email="you@example.com" onResend={jest.fn().mockResolvedValue(undefined)} />,
    );
    expect(getByText(/Verify your email/i)).toBeTruthy();
    expect(getByText("you@example.com")).toBeTruthy();
    expect(getByTestId("verify-resend")).toBeTruthy();
  });

  it("calls onResend and shows resent banner", async () => {
    const onResend = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, findByText } = render(
      <EmailVerificationScreen email="you@example.com" onResend={onResend} />,
    );
    await act(async () => {
      fireEvent.press(getByTestId("verify-resend"));
    });
    expect(onResend).toHaveBeenCalled();
    expect(await findByText(/Email resent/i)).toBeTruthy();
  });

  it("renders verified state with continue CTA", () => {
    const onContinue = jest.fn();
    const { getByText, getByTestId } = render(
      <EmailVerificationScreen
        email="you@example.com"
        status="verified"
        onResend={jest.fn().mockResolvedValue(undefined)}
        onContinue={onContinue}
      />,
    );
    expect(getByText(/Email verified/i)).toBeTruthy();
    fireEvent.press(getByTestId("verify-continue"));
    expect(onContinue).toHaveBeenCalled();
  });
});

describe("OtpVerificationScreen", () => {
  it("renders 6 cells and disables submit until all 6 digits entered", () => {
    const { getByTestId } = render(
      <OtpVerificationScreen
        destination="(555) 555-1234"
        onVerify={jest.fn().mockResolvedValue(undefined)}
        onResend={jest.fn().mockResolvedValue(undefined)}
      />,
    );
    for (let i = 1; i <= 6; i += 1) {
      expect(getByTestId(`otp-cell-${i}`)).toBeTruthy();
    }
    expect(getByTestId("otp-submit").props.accessibilityState?.disabled).toBe(true);
  });

  it("strips non-digits and supports paste of full 6-digit code", async () => {
    const onVerify = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <OtpVerificationScreen
        destination="(555) 555-1234"
        onVerify={onVerify}
        onResend={jest.fn().mockResolvedValue(undefined)}
      />,
    );
    fireEvent.changeText(getByTestId("otp-input"), "abc 12-3456");
    await waitFor(() => {
      expect(getByTestId("otp-submit").props.accessibilityState?.disabled).toBe(false);
    });
    await act(async () => {
      fireEvent.press(getByTestId("otp-submit"));
    });
    expect(onVerify).toHaveBeenCalledWith("123456");
  });

  it("renders error banner when onVerify rejects", async () => {
    const onVerify = jest.fn().mockRejectedValue(new Error("Code didn't match"));
    const { getByTestId, findByText } = render(
      <OtpVerificationScreen
        destination="(555) 555-1234"
        onVerify={onVerify}
        onResend={jest.fn().mockResolvedValue(undefined)}
      />,
    );
    fireEvent.changeText(getByTestId("otp-input"), "111111");
    await act(async () => {
      fireEvent.press(getByTestId("otp-submit"));
    });
    expect(await findByText(/Code didn't match/)).toBeTruthy();
  });
});
