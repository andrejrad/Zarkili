import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

import { SignInScreen } from "../SignInScreen";
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

describe("SignInScreen", () => {
  it("renders email and password inputs by default", async () => {
    const repo = makeStubAuthRepository();
    const { getAllByText, getByTestId } = renderWithAuth(repo, <SignInScreen />);
    expect(getAllByText("Sign in").length).toBeGreaterThan(0);
    expect(getByTestId("signin-identifier")).toBeTruthy();
    expect(getByTestId("signin-password")).toBeTruthy();
  });

  it("validates email before submitting", async () => {
    const repo = makeStubAuthRepository();
    const { getByTestId, findByText } = renderWithAuth(repo, <SignInScreen />);
    fireEvent.changeText(getByTestId("signin-identifier"), "not-an-email");
    fireEvent.changeText(getByTestId("signin-password"), "secret");
    await act(async () => {
      fireEvent.press(getByTestId("signin-submit"));
    });
    expect(await findByText(/valid email/i)).toBeTruthy();
    expect(repo.signIn).not.toHaveBeenCalled();
  });

  it("calls signIn with email + password", async () => {
    const repo = makeStubAuthRepository();
    const onSignedIn = jest.fn();
    const { getByTestId } = renderWithAuth(
      repo,
      <SignInScreen onSignedIn={onSignedIn} />,
    );
    fireEvent.changeText(getByTestId("signin-identifier"), "you@example.com");
    fireEvent.changeText(getByTestId("signin-password"), "secretz");
    await act(async () => {
      fireEvent.press(getByTestId("signin-submit"));
    });
    expect(repo.signIn).toHaveBeenCalledWith({
      email: "you@example.com",
      password: "secretz",
    });
    expect(onSignedIn).toHaveBeenCalled();
  });

  it("renders error banner when signIn rejects", async () => {
    const repo = makeStubAuthRepository({
      signIn: jest.fn().mockRejectedValue(new Error("Incorrect password")),
    });
    const { getByTestId, findByText } = renderWithAuth(repo, <SignInScreen />);
    fireEvent.changeText(getByTestId("signin-identifier"), "you@example.com");
    fireEvent.changeText(getByTestId("signin-password"), "wrong");
    await act(async () => {
      fireEvent.press(getByTestId("signin-submit"));
    });
    expect(await findByText(/incorrect password/i)).toBeTruthy();
  });

  it("switches to phone mode and validates US phone format", async () => {
    const repo = makeStubAuthRepository();
    const { getByTestId, findByText } = renderWithAuth(repo, <SignInScreen />);
    fireEvent.press(getByTestId("signin-mode-phone"));
    fireEvent.changeText(getByTestId("signin-identifier"), "555");
    fireEvent.changeText(getByTestId("signin-password"), "secretz");
    await act(async () => {
      fireEvent.press(getByTestId("signin-submit"));
    });
    expect(await findByText(/10-digit US phone/i)).toBeTruthy();
  });
});
