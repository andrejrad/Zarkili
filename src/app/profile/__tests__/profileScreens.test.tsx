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
