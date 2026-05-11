import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

import { ForgotPasswordScreen } from "../ForgotPasswordScreen";
import { ResetPasswordScreen } from "../ResetPasswordScreen";
import { AuthProvider } from "../../providers/AuthProvider";
import type { AuthRepository } from "../../../domains/auth";

function makeStubAuthRepository(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    signIn: jest.fn(),
    createAccount: jest.fn(),
    updateProfile: jest.fn(),
    updateEmailAddress: jest.fn(),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    signOutCurrentUser: jest.fn().mockResolvedValue(undefined),
    getCurrentSession: jest.fn().mockResolvedValue(null),
    ...overrides,
  } as unknown as AuthRepository;
}

describe("ForgotPasswordScreen", () => {
  it("validates email before submitting", async () => {
    const repo = makeStubAuthRepository();
    const { getByTestId, findByText } = render(
      <AuthProvider authRepository={repo}>
        <ForgotPasswordScreen />
      </AuthProvider>,
    );
    fireEvent.changeText(getByTestId("forgot-email"), "x");
    await act(async () => {
      fireEvent.press(getByTestId("forgot-submit"));
    });
    expect(await findByText(/valid email/i)).toBeTruthy();
    expect(repo.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("calls sendPasswordReset on valid email and shows success banner", async () => {
    const repo = makeStubAuthRepository();
    const { getByTestId, findByText } = render(
      <AuthProvider authRepository={repo}>
        <ForgotPasswordScreen />
      </AuthProvider>,
    );
    fireEvent.changeText(getByTestId("forgot-email"), "you@example.com");
    await act(async () => {
      fireEvent.press(getByTestId("forgot-submit"));
    });
    expect(repo.sendPasswordReset).toHaveBeenCalledWith({ email: "you@example.com" });
    expect(await findByText(/Check your inbox/i)).toBeTruthy();
  });
});

describe("ResetPasswordScreen", () => {
  it("rejects mismatched passwords", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, findByText } = render(<ResetPasswordScreen onSubmit={onSubmit} />);
    fireEvent.changeText(getByTestId("reset-password"), "abcdef1!");
    fireEvent.changeText(getByTestId("reset-confirm"), "different1!");
    await act(async () => {
      fireEvent.press(getByTestId("reset-submit"));
    });
    expect(await findByText(/Passwords don't match/i)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the new password when valid", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<ResetPasswordScreen onSubmit={onSubmit} />);
    fireEvent.changeText(getByTestId("reset-password"), "abcdef1!");
    fireEvent.changeText(getByTestId("reset-confirm"), "abcdef1!");
    await act(async () => {
      fireEvent.press(getByTestId("reset-submit"));
    });
    expect(onSubmit).toHaveBeenCalledWith("abcdef1!");
  });

  it("renders expired link state with request-new CTA", () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onNewLink = jest.fn();
    const { getByTestId, getByText } = render(
      <ResetPasswordScreen onSubmit={onSubmit} expired onRequestNewLink={onNewLink} />,
    );
    expect(getByText(/Link expired/i)).toBeTruthy();
    fireEvent.press(getByTestId("reset-new-link"));
    expect(onNewLink).toHaveBeenCalled();
  });
});
