/**
 * profileScreens.test.tsx — W29 Batch I profile screen tests.
 *
 * Covers: EditProfileScreen, ChangeCredentialsScreen, ConnectedAccountsScreen.
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { EditProfileScreen } from "../EditProfileScreen";
import { ChangeCredentialsScreen } from "../ChangeCredentialsScreen";
import { ConnectedAccountsScreen } from "../ConnectedAccountsScreen";

// ---------------------------------------------------------------------------
// EditProfileScreen
// ---------------------------------------------------------------------------

describe("EditProfileScreen", () => {
  it("renders display name input", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        testID="profile"
      />
    );
    expect(screen.getByTestId("profile-name")).toBeTruthy();
  });

  it("renders bio field and char count", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        initialBio="Hello!"
        onSave={jest.fn()}
        testID="profile"
      />
    );
    expect(screen.getByTestId("profile-bio")).toBeTruthy();
    expect(screen.getByText("6/250")).toBeTruthy();
  });

  it("renders pronoun chips", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        testID="profile"
      />
    );
    expect(screen.getByTestId("profile-pronoun-she-her")).toBeTruthy();
    expect(screen.getByTestId("profile-pronoun-they-them")).toBeTruthy();
  });

  it("save button disabled when no changes", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        testID="profile"
      />
    );
    const saveBtn = screen.getByTestId("profile-save");
    expect(saveBtn.props.accessibilityState?.disabled).toBeTruthy();
  });

  it("shows saved banner on success", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={onSave}
        testID="profile"
      />
    );
    // Change name to make dirty
    fireEvent.changeText(screen.getByTestId("profile-name"), "Alice Updated");
    fireEvent.press(screen.getByTestId("profile-save"));
    await screen.findByTestId("profile-saved-banner");
  });

  it("shows error banner on save failure", async () => {
    const onSave = jest.fn().mockRejectedValue(new Error("fail"));
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={onSave}
        testID="profile"
      />
    );
    fireEvent.changeText(screen.getByTestId("profile-name"), "Alice Updated");
    fireEvent.press(screen.getByTestId("profile-save"));
    await screen.findByTestId("profile-error-banner");
  });

  it("shows profileErrorMessage prop text in error banner", async () => {
    const onSave = jest.fn().mockRejectedValue(new Error("Firebase error"));
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={onSave}
        profileErrorMessage="Custom Firebase error message"
        testID="profile"
      />
    );
    fireEvent.changeText(screen.getByTestId("profile-name"), "Alice Updated");
    fireEvent.press(screen.getByTestId("profile-save"));
    await screen.findByText("Custom Firebase error message");
  });

  it("shows profileSuccessMessage prop text in saved banner", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={onSave}
        profileSuccessMessage="Custom saved message"
        testID="profile"
      />
    );
    fireEvent.changeText(screen.getByTestId("profile-name"), "Alice Updated");
    fireEvent.press(screen.getByTestId("profile-save"));
    await screen.findByText("Custom saved message");
  });
});

// ---------------------------------------------------------------------------
// EditProfileScreen — email section
// ---------------------------------------------------------------------------

describe("EditProfileScreen — email section", () => {
  it("does not render email section when onSaveEmail is absent", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        testID="profile"
      />
    );
    expect(screen.queryByTestId("profile-email")).toBeNull();
    expect(screen.queryByTestId("profile-email-save")).toBeNull();
  });

  it("renders email input pre-filled with initialEmail when onSaveEmail provided", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        initialEmail="alice@example.com"
        onSaveEmail={jest.fn()}
        testID="profile"
      />
    );
    const input = screen.getByTestId("profile-email");
    expect(input).toBeTruthy();
    expect(input.props.value).toBe("alice@example.com");
  });

  it("save email button disabled when email unchanged", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        initialEmail="alice@example.com"
        onSaveEmail={jest.fn()}
        testID="profile"
      />
    );
    const btn = screen.getByTestId("profile-email-save");
    expect(btn.props.accessibilityState?.disabled).toBeTruthy();
  });

  it("save email button enabled after changing email", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        initialEmail="alice@example.com"
        onSaveEmail={jest.fn()}
        testID="profile"
      />
    );
    fireEvent.changeText(screen.getByTestId("profile-email"), "new@example.com");
    const btn = screen.getByTestId("profile-email-save");
    expect(btn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("calls onSaveEmail with the trimmed entered value on press", async () => {
    const onSaveEmail = jest.fn().mockResolvedValue(undefined);
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        initialEmail="alice@example.com"
        onSaveEmail={onSaveEmail}
        testID="profile"
      />
    );
    fireEvent.changeText(screen.getByTestId("profile-email"), "  new@example.com  ");
    fireEvent.press(screen.getByTestId("profile-email-save"));
    expect(onSaveEmail).toHaveBeenCalledWith("new@example.com");
  });

  it("shows emailErrorMessage banner when prop is set", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        initialEmail="alice@example.com"
        onSaveEmail={jest.fn()}
        emailErrorMessage="For security, please log in again before changing your email."
        testID="profile"
      />
    );
    expect(screen.getByTestId("profile-email-error-banner")).toBeTruthy();
    expect(screen.getByText("For security, please log in again before changing your email.")).toBeTruthy();
  });

  it("shows emailSuccessMessage banner when prop is set", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        initialEmail="alice@example.com"
        onSaveEmail={jest.fn()}
        emailSuccessMessage="Email updated."
        testID="profile"
      />
    );
    expect(screen.getByTestId("profile-email-success-banner")).toBeTruthy();
    expect(screen.getByText("Email updated.")).toBeTruthy();
  });

  it("save email button is busy and disabled when emailSaving is true", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        initialEmail="alice@example.com"
        onSaveEmail={jest.fn()}
        emailSaving
        testID="profile"
      />
    );
    const btn = screen.getByTestId("profile-email-save");
    expect(btn.props.accessibilityState?.busy).toBeTruthy();
    expect(btn.props.accessibilityState?.disabled).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// EditProfileScreen — security section
// ---------------------------------------------------------------------------

describe("EditProfileScreen — security section", () => {
  it("does not render security section when onSendPasswordReset is absent", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        testID="profile"
      />
    );
    expect(screen.queryByTestId("profile-password-reset")).toBeNull();
  });

  it("renders password reset button when onSendPasswordReset provided", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        onSendPasswordReset={jest.fn()}
        testID="profile"
      />
    );
    expect(screen.getByTestId("profile-password-reset")).toBeTruthy();
    expect(screen.getByText("Send password reset email")).toBeTruthy();
  });

  it("calls onSendPasswordReset when button is pressed", () => {
    const onSendPasswordReset = jest.fn().mockResolvedValue(undefined);
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        onSendPasswordReset={onSendPasswordReset}
        testID="profile"
      />
    );
    fireEvent.press(screen.getByTestId("profile-password-reset"));
    expect(onSendPasswordReset).toHaveBeenCalledTimes(1);
  });

  it("shows passwordResetErrorMessage banner when prop is set", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        onSendPasswordReset={jest.fn()}
        passwordResetErrorMessage="Unable to send password reset email."
        testID="profile"
      />
    );
    expect(screen.getByTestId("profile-password-reset-error-banner")).toBeTruthy();
    expect(screen.getByText("Unable to send password reset email.")).toBeTruthy();
  });

  it("shows passwordResetSuccessMessage banner when prop is set", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        onSendPasswordReset={jest.fn()}
        passwordResetSuccessMessage="Password reset link sent to your email."
        testID="profile"
      />
    );
    expect(screen.getByTestId("profile-password-reset-success-banner")).toBeTruthy();
    expect(screen.getByText("Password reset link sent to your email.")).toBeTruthy();
  });

  it("reset button is busy and disabled when passwordResetSubmitting is true", () => {
    render(
      <EditProfileScreen
        initialDisplayName="Alice"
        onSave={jest.fn()}
        onSendPasswordReset={jest.fn()}
        passwordResetSubmitting
        testID="profile"
      />
    );
    const btn = screen.getByTestId("profile-password-reset");
    expect(btn.props.accessibilityState?.busy).toBeTruthy();
    expect(btn.props.accessibilityState?.disabled).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ChangeCredentialsScreen
// ---------------------------------------------------------------------------

describe("ChangeCredentialsScreen", () => {
  it("renders step 1 with current password field", () => {
    render(
      <ChangeCredentialsScreen
        credentialType="email"
        step={1}
        currentPassword=""
        newValue=""
        onChangeCurrentPassword={jest.fn()}
        onChangeNewValue={jest.fn()}
        onSubmitStep1={jest.fn()}
        onSubmitStep2={jest.fn()}
        testID="creds"
      />
    );
    expect(screen.getByTestId("creds-current-password")).toBeTruthy();
    expect(screen.getByTestId("creds-step1-submit")).toBeTruthy();
  });

  it("renders step 2 for email with new email field", () => {
    render(
      <ChangeCredentialsScreen
        credentialType="email"
        step={2}
        currentPassword="correctpass"
        newValue=""
        onChangeCurrentPassword={jest.fn()}
        onChangeNewValue={jest.fn()}
        onSubmitStep1={jest.fn()}
        onSubmitStep2={jest.fn()}
        testID="creds"
      />
    );
    expect(screen.getByTestId("creds-new-value")).toBeTruthy();
    expect(screen.getByTestId("creds-step2-submit")).toBeTruthy();
  });

  it("renders confirm field for password type on step 2", () => {
    render(
      <ChangeCredentialsScreen
        credentialType="password"
        step={2}
        currentPassword="old"
        newValue="newpass"
        confirmValue=""
        onChangeCurrentPassword={jest.fn()}
        onChangeNewValue={jest.fn()}
        onChangeConfirmValue={jest.fn()}
        onSubmitStep1={jest.fn()}
        onSubmitStep2={jest.fn()}
        testID="creds"
      />
    );
    expect(screen.getByTestId("creds-confirm-value")).toBeTruthy();
  });

  it("renders mismatch error banner", () => {
    render(
      <ChangeCredentialsScreen
        credentialType="password"
        step={2}
        state="mismatch"
        currentPassword="old"
        newValue="new"
        confirmValue="diff"
        onChangeCurrentPassword={jest.fn()}
        onChangeNewValue={jest.fn()}
        onSubmitStep1={jest.fn()}
        onSubmitStep2={jest.fn()}
        testID="creds"
      />
    );
    expect(screen.getByTestId("creds-error-banner")).toBeTruthy();
  });

  it("renders success state with done button", () => {
    render(
      <ChangeCredentialsScreen
        credentialType="email"
        step={2}
        state="success"
        currentPassword=""
        newValue=""
        onChangeCurrentPassword={jest.fn()}
        onChangeNewValue={jest.fn()}
        onSubmitStep1={jest.fn()}
        onSubmitStep2={jest.fn()}
        testID="creds"
      />
    );
    expect(screen.getByTestId("creds-done")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ConnectedAccountsScreen
// ---------------------------------------------------------------------------

describe("ConnectedAccountsScreen", () => {
  const providers = [
    { provider: "google" as const, connected: true, connectedAs: "alice@gmail.com" },
    { provider: "apple" as const, connected: false },
    { provider: "facebook" as const, connected: false },
  ];

  const calendars = [
    { service: "google-calendar" as const, enabled: true, lastSync: "04/28/2026 10:00 AM" },
    { service: "apple-calendar" as const, enabled: false },
    { service: "outlook" as const, enabled: false },
  ];

  it("renders SSO provider rows", () => {
    render(
      <ConnectedAccountsScreen
        ssoProviders={providers}
        calendarServices={calendars}
        onConnectSso={jest.fn()}
        onDisconnectSso={jest.fn()}
        onToggleCalendar={jest.fn()}
        testID="connected"
      />
    );
    expect(screen.getByTestId("connected-sso-google")).toBeTruthy();
    expect(screen.getByTestId("connected-sso-apple")).toBeTruthy();
  });

  it("renders disconnect button for connected provider", () => {
    render(
      <ConnectedAccountsScreen
        ssoProviders={providers}
        calendarServices={calendars}
        onConnectSso={jest.fn()}
        onDisconnectSso={jest.fn()}
        onToggleCalendar={jest.fn()}
        testID="connected"
      />
    );
    expect(screen.getByTestId("connected-sso-google-disconnect")).toBeTruthy();
  });

  it("renders connect button for unconnected provider", () => {
    render(
      <ConnectedAccountsScreen
        ssoProviders={providers}
        calendarServices={calendars}
        onConnectSso={jest.fn()}
        onDisconnectSso={jest.fn()}
        onToggleCalendar={jest.fn()}
        testID="connected"
      />
    );
    expect(screen.getByTestId("connected-sso-apple-connect")).toBeTruthy();
  });

  it("renders calendar service toggles", () => {
    render(
      <ConnectedAccountsScreen
        ssoProviders={providers}
        calendarServices={calendars}
        onConnectSso={jest.fn()}
        onDisconnectSso={jest.fn()}
        onToggleCalendar={jest.fn()}
        testID="connected"
      />
    );
    expect(screen.getByTestId("connected-cal-google-calendar")).toBeTruthy();
  });

  it("renders error banner when isError is true", () => {
    render(
      <ConnectedAccountsScreen
        ssoProviders={providers}
        calendarServices={calendars}
        isError
        onConnectSso={jest.fn()}
        onDisconnectSso={jest.fn()}
        onToggleCalendar={jest.fn()}
        testID="connected"
      />
    );
    expect(screen.getByTestId("connected-error-banner")).toBeTruthy();
  });

  it("calls onConnectSso when Connect pressed", () => {
    const onConnect = jest.fn();
    render(
      <ConnectedAccountsScreen
        ssoProviders={providers}
        calendarServices={calendars}
        onConnectSso={onConnect}
        onDisconnectSso={jest.fn()}
        onToggleCalendar={jest.fn()}
        testID="connected"
      />
    );
    fireEvent.press(screen.getByTestId("connected-sso-apple-connect"));
    expect(onConnect).toHaveBeenCalledWith("apple");
  });
});
