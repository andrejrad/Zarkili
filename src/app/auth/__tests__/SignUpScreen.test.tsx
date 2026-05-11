import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

import { SignUpScreen } from "../SignUpScreen";
import { AuthProvider } from "../../providers/AuthProvider";
import type { AuthRepository } from "../../../domains/auth";

function makeStubAuthRepository(overrides: Partial<AuthRepository> = {}): AuthRepository {
  const session = {
    userId: "u1",
    email: "you@example.com",
    firstName: "You",
    lastName: "Doe",
  };
  return {
    signIn: jest.fn().mockResolvedValue(session),
    createAccount: jest.fn().mockResolvedValue(session),
    updateProfile: jest.fn().mockResolvedValue(session),
    updateEmailAddress: jest.fn().mockResolvedValue(session),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    signOutCurrentUser: jest.fn().mockResolvedValue(undefined),
    getCurrentSession: jest.fn().mockResolvedValue(null),
    ...overrides,
  } as AuthRepository;
}

function renderWithAuth(repo: AuthRepository, ui: React.ReactElement) {
  return render(<AuthProvider authRepository={repo}>{ui}</AuthProvider>);
}

describe("SignUpScreen", () => {
  it("renders all required fields", () => {
    const repo = makeStubAuthRepository();
    const { getByTestId } = renderWithAuth(repo, <SignUpScreen />);
    expect(getByTestId("signup-first-name")).toBeTruthy();
    expect(getByTestId("signup-last-name")).toBeTruthy();
    expect(getByTestId("signup-identifier")).toBeTruthy();
    expect(getByTestId("signup-password")).toBeTruthy();
    expect(getByTestId("signup-terms")).toBeTruthy();
    expect(getByTestId("signup-marketing")).toBeTruthy();
  });

  it("disables submit until terms agreed", () => {
    const repo = makeStubAuthRepository();
    const { getByTestId } = renderWithAuth(repo, <SignUpScreen />);
    const submit = getByTestId("signup-submit");
    expect(submit.props.accessibilityState?.disabled).toBe(true);
  });

  it("marketing toggle is OFF by default (TCPA/CAN-SPAM safe)", () => {
    const repo = makeStubAuthRepository();
    const { getByTestId } = renderWithAuth(repo, <SignUpScreen />);
    const marketing = getByTestId("signup-marketing");
    expect(marketing.props.accessibilityState?.checked).toBe(false);
  });

  it("blocks submit with invalid password and shows policy error", async () => {
    const repo = makeStubAuthRepository();
    const { getByTestId, findByText } = renderWithAuth(repo, <SignUpScreen />);
    fireEvent.changeText(getByTestId("signup-first-name"), "Andre");
    fireEvent.changeText(getByTestId("signup-last-name"), "Doe");
    fireEvent.changeText(getByTestId("signup-identifier"), "you@example.com");
    fireEvent.changeText(getByTestId("signup-password"), "weak");
    fireEvent.press(getByTestId("signup-terms"));
    await act(async () => {
      fireEvent.press(getByTestId("signup-submit"));
    });
    expect(await findByText(/8\+ chars/i)).toBeTruthy();
    expect(repo.createAccount).not.toHaveBeenCalled();
  });

  it("calls createAccount when valid", async () => {
    const repo = makeStubAuthRepository();
    const onSignedUp = jest.fn();
    const { getByTestId } = renderWithAuth(
      repo,
      <SignUpScreen onSignedUp={onSignedUp} />,
    );
    fireEvent.changeText(getByTestId("signup-first-name"), "Andre");
    fireEvent.changeText(getByTestId("signup-last-name"), "Doe");
    fireEvent.changeText(getByTestId("signup-identifier"), "you@example.com");
    fireEvent.changeText(getByTestId("signup-password"), "abcdef1!");
    fireEvent.press(getByTestId("signup-terms"));
    await act(async () => {
      fireEvent.press(getByTestId("signup-submit"));
    });
    expect(repo.createAccount).toHaveBeenCalledWith({
      email: "you@example.com",
      password: "abcdef1!",
    });
    expect(onSignedUp).toHaveBeenCalled();
  });
});
