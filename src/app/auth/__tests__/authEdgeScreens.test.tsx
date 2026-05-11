/**
 * authEdgeScreens.test.tsx — W29 Batch I auth edge case screens tests.
 *
 * Covers: AuthEdgeScreen (all 9 views).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { AuthEdgeScreen } from "../AuthEdgeScreen";

// ---------------------------------------------------------------------------
// locked
// ---------------------------------------------------------------------------

describe("AuthEdgeScreen — locked", () => {
  it("renders locked screen with countdown", () => {
    render(
      <AuthEdgeScreen
        view="locked"
        lockedCountdownSeconds={120}
        onContactSupport={jest.fn()}
        testID="auth-edge"
      />
    );
    expect(screen.getByTestId("auth-edge-countdown")).toBeTruthy();
    expect(screen.getByText("Try again in 120s")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-contact")).toBeTruthy();
  });

  it("calls onContactSupport when button pressed", () => {
    const onContactSupport = jest.fn();
    render(
      <AuthEdgeScreen
        view="locked"
        onContactSupport={onContactSupport}
        testID="auth-edge"
      />
    );
    fireEvent.press(screen.getByTestId("auth-edge-contact"));
    expect(onContactSupport).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// mfa-setup
// ---------------------------------------------------------------------------

describe("AuthEdgeScreen — mfa-setup", () => {
  it("renders step 1 with method options", () => {
    render(
      <AuthEdgeScreen
        view="mfa-setup"
        mfaSetupStep={1}
        testID="auth-edge"
      />
    );
    expect(screen.getByTestId("auth-edge-method-authenticator")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-method-sms")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-method-email")).toBeTruthy();
  });

  it("renders step 2 with OTP input", () => {
    render(
      <AuthEdgeScreen
        view="mfa-setup"
        mfaSetupStep={2}
        otpValue=""
        onOtpChange={jest.fn()}
        testID="auth-edge"
      />
    );
    expect(screen.getByTestId("auth-edge-otp")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-otp-submit")).toBeTruthy();
  });

  it("calls onSelectMfaMethod when method pressed", () => {
    const onSelect = jest.fn();
    render(
      <AuthEdgeScreen
        view="mfa-setup"
        mfaSetupStep={1}
        onSelectMfaMethod={onSelect}
        testID="auth-edge"
      />
    );
    fireEvent.press(screen.getByTestId("auth-edge-method-sms"));
    expect(onSelect).toHaveBeenCalledWith("sms");
  });
});

// ---------------------------------------------------------------------------
// mfa-challenge
// ---------------------------------------------------------------------------

describe("AuthEdgeScreen — mfa-challenge", () => {
  it("renders OTP input and verify button", () => {
    render(
      <AuthEdgeScreen
        view="mfa-challenge"
        otpValue=""
        onOtpChange={jest.fn()}
        testID="auth-edge"
      />
    );
    expect(screen.getByTestId("auth-edge-otp")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-verify")).toBeTruthy();
  });

  it("renders use-recovery-code button", () => {
    render(
      <AuthEdgeScreen
        view="mfa-challenge"
        otpValue=""
        onOtpChange={jest.fn()}
        testID="auth-edge"
      />
    );
    expect(screen.getByTestId("auth-edge-use-recovery")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// recovery-codes
// ---------------------------------------------------------------------------

describe("AuthEdgeScreen — recovery-codes", () => {
  const codes = [
    "AAAA-BBBB",
    "CCCC-DDDD",
    "EEEE-FFFF",
    "GGGG-HHHH",
    "IIII-JJJJ",
    "KKKK-LLLL",
    "MMMM-NNNN",
    "OOOO-PPPP",
    "QQQQ-RRRR",
    "SSSS-TTTT",
  ];

  it("renders recovery codes list", () => {
    render(
      <AuthEdgeScreen
        view="recovery-codes"
        recoveryCodes={codes}
        onCopyRecoveryCodes={jest.fn()}
        onDownloadRecoveryCodes={jest.fn()}
        testID="auth-edge"
      />
    );
    expect(screen.getByTestId("auth-edge-codes")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-codes-copy-all")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-codes-download")).toBeTruthy();
  });

  it("calls onCopyRecoveryCodes when Copy all pressed", () => {
    const onCopy = jest.fn();
    render(
      <AuthEdgeScreen
        view="recovery-codes"
        recoveryCodes={codes}
        onCopyRecoveryCodes={onCopy}
        testID="auth-edge"
      />
    );
    fireEvent.press(screen.getByTestId("auth-edge-codes-copy-all"));
    expect(onCopy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// devices
// ---------------------------------------------------------------------------

describe("AuthEdgeScreen — devices", () => {
  const devices = [
    { id: "d1", deviceName: "iPhone 14", lastActive: "04/28/2026 9:00 AM", isCurrent: true },
    { id: "d2", deviceName: "MacBook Pro", lastActive: "04/27/2026 5:00 PM", isCurrent: false },
  ];

  it("renders device rows", () => {
    render(
      <AuthEdgeScreen
        view="devices"
        devices={devices}
        onRevokeDevice={jest.fn()}
        testID="auth-edge"
      />
    );
    expect(screen.getByTestId("auth-edge-device-d1")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-device-d2")).toBeTruthy();
  });

  it("renders revoke button for non-current device", () => {
    render(
      <AuthEdgeScreen
        view="devices"
        devices={devices}
        onRevokeDevice={jest.fn()}
        testID="auth-edge"
      />
    );
    expect(screen.getByTestId("auth-edge-device-d2-revoke")).toBeTruthy();
  });

  it("calls onRevokeDevice with device id", () => {
    const onRevoke = jest.fn();
    render(
      <AuthEdgeScreen
        view="devices"
        devices={devices}
        onRevokeDevice={onRevoke}
        testID="auth-edge"
      />
    );
    fireEvent.press(screen.getByTestId("auth-edge-device-d2-revoke"));
    expect(onRevoke).toHaveBeenCalledWith("d2");
  });
});

// ---------------------------------------------------------------------------
// sign-out-all
// ---------------------------------------------------------------------------

describe("AuthEdgeScreen — sign-out-all", () => {
  it("renders confirm and cancel buttons", () => {
    render(
      <AuthEdgeScreen
        view="sign-out-all"
        onSignOutAll={jest.fn()}
        onCancelSignOutAll={jest.fn()}
        testID="auth-edge"
      />
    );
    expect(screen.getByTestId("auth-edge-confirm")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-cancel")).toBeTruthy();
  });

  it("calls onSignOutAll when confirm pressed", () => {
    const onSignOutAll = jest.fn();
    render(
      <AuthEdgeScreen
        view="sign-out-all"
        onSignOutAll={onSignOutAll}
        onCancelSignOutAll={jest.fn()}
        testID="auth-edge"
      />
    );
    fireEvent.press(screen.getByTestId("auth-edge-confirm"));
    expect(onSignOutAll).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// re-auth
// ---------------------------------------------------------------------------

describe("AuthEdgeScreen — re-auth", () => {
  it("renders re-auth modal when visible", () => {
    render(
      <AuthEdgeScreen
        view="re-auth"
        reAuthVisible
        reAuthPassword=""
        onReAuthPasswordChange={jest.fn()}
        onSubmitReAuth={jest.fn()}
        onCancelReAuth={jest.fn()}
        testID="auth-edge"
      />
    );
    expect(screen.getByTestId("auth-edge-password")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-submit")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// magic-link
// ---------------------------------------------------------------------------

describe("AuthEdgeScreen — magic-link", () => {
  it("renders success state", () => {
    render(
      <AuthEdgeScreen
        view="magic-link"
        magicLinkResult="success"
        onMagicLinkContinue={jest.fn()}
        testID="auth-edge"
      />
    );
    expect(screen.getByText("You're signed in")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-cta")).toBeTruthy();
  });

  it("renders error state", () => {
    render(
      <AuthEdgeScreen
        view="magic-link"
        magicLinkResult="error"
        onMagicLinkContinue={jest.fn()}
        testID="auth-edge"
      />
    );
    expect(screen.getByText("Link expired or invalid")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// sso-conflict
// ---------------------------------------------------------------------------

describe("AuthEdgeScreen — sso-conflict", () => {
  it("renders conflict banner with switch CTA", () => {
    render(
      <AuthEdgeScreen
        view="sso-conflict"
        ssoConflictEmail="alice@example.com"
        ssoConflictProvider="Google"
        onSwitchProvider={jest.fn()}
        onDismissSsoConflict={jest.fn()}
        testID="auth-edge"
      />
    );
    expect(screen.getByTestId("auth-edge-banner")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-switch")).toBeTruthy();
    expect(screen.getByTestId("auth-edge-dismiss")).toBeTruthy();
  });

  it("calls onSwitchProvider when switch CTA pressed", () => {
    const onSwitch = jest.fn();
    render(
      <AuthEdgeScreen
        view="sso-conflict"
        ssoConflictProvider="Google"
        onSwitchProvider={onSwitch}
        onDismissSsoConflict={jest.fn()}
        testID="auth-edge"
      />
    );
    fireEvent.press(screen.getByTestId("auth-edge-switch"));
    expect(onSwitch).toHaveBeenCalled();
  });
});
