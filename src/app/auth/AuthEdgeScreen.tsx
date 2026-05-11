/**
 * AuthEdgeScreen.tsx — I.11 Auth Edge Cases (9 views).
 *
 * view prop selects the edge case:
 *  - "locked"        → Account locked screen with countdown + contact support
 *  - "mfa-setup"     → Choose MFA method (Authenticator / SMS / Email) + OTP verify step
 *  - "mfa-challenge" → Enter 6-digit code
 *  - "recovery-codes"→ List of 10 one-time codes
 *  - "devices"       → Device manager list
 *  - "sign-out-all"  → Destructive confirm modal sheet
 *  - "re-auth"       → Password re-entry prompt (modal sheet)
 *  - "magic-link"    → Full-screen success / error landing
 *  - "sso-conflict"  → Banner with switch provider CTA
 */

import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Banner,
  Button,
  DeviceRow,
  InputField,
  MfaOtpInput,
  ModalSheet,
  RecoveryCodesList,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import type { DeviceRowProps } from "../../shared/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthEdgeView =
  | "locked"
  | "mfa-setup"
  | "mfa-challenge"
  | "recovery-codes"
  | "devices"
  | "sign-out-all"
  | "re-auth"
  | "magic-link"
  | "sso-conflict";

export type MfaMethod = "authenticator" | "sms" | "email";

export type MagicLinkResult = "success" | "error";

export type AuthEdgeDevice = Omit<DeviceRowProps, "testID" | "onRevoke"> & {
  id: string;
};

export type AuthEdgeScreenProps = {
  view: AuthEdgeView;

  // locked
  lockedCountdownSeconds?: number;

  // mfa-setup
  mfaSetupStep?: 1 | 2;
  selectedMfaMethod?: MfaMethod;
  mfaQrDataUrl?: string;
  onSelectMfaMethod?: (method: MfaMethod) => void;
  onConfirmMfaSetup?: () => void;

  // mfa-challenge / mfa-setup step 2
  otpValue?: string;
  onOtpChange?: (value: string) => void;
  onSubmitOtp?: () => void;
  otpError?: string | null;

  // recovery-codes
  recoveryCodes?: string[];
  onCopyRecoveryCodes?: () => void;
  onDownloadRecoveryCodes?: () => void;

  // devices
  devices?: AuthEdgeDevice[];
  onRevokeDevice?: (id: string) => void;

  // sign-out-all
  signOutAllVisible?: boolean;
  onSignOutAll?: () => void;
  onCancelSignOutAll?: () => void;

  // re-auth
  reAuthVisible?: boolean;
  reAuthPassword?: string;
  reAuthError?: string | null;
  onReAuthPasswordChange?: (value: string) => void;
  onSubmitReAuth?: () => void;
  onCancelReAuth?: () => void;

  // magic-link
  magicLinkResult?: MagicLinkResult;
  onMagicLinkContinue?: () => void;

  // sso-conflict
  ssoConflictEmail?: string;
  ssoConflictProvider?: string;
  onSwitchProvider?: () => void;
  onDismissSsoConflict?: () => void;

  // contact support (locked / error states)
  onContactSupport?: () => void;

  isLoading?: boolean;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuthEdgeScreen({
  view,
  lockedCountdownSeconds,
  mfaSetupStep = 1,
  selectedMfaMethod,
  mfaQrDataUrl,
  onSelectMfaMethod,
  onConfirmMfaSetup,
  otpValue = "",
  onOtpChange,
  onSubmitOtp,
  otpError,
  recoveryCodes = [],
  onCopyRecoveryCodes,
  onDownloadRecoveryCodes,
  devices = [],
  onRevokeDevice,
  signOutAllVisible = false,
  onSignOutAll,
  onCancelSignOutAll,
  reAuthVisible = false,
  reAuthPassword = "",
  reAuthError,
  onReAuthPasswordChange,
  onSubmitReAuth,
  onCancelReAuth,
  magicLinkResult = "success",
  onMagicLinkContinue,
  ssoConflictEmail,
  ssoConflictProvider,
  onSwitchProvider,
  onDismissSsoConflict,
  onContactSupport,
  isLoading,
  testID,
}: AuthEdgeScreenProps) {
  const [localMfaMethod, setLocalMfaMethod] = useState<MfaMethod | undefined>(
    selectedMfaMethod
  );

  if (isLoading) {
    return (
      <View style={styles.centered} testID={testID}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // ------------------------------------------------------------------
  if (view === "locked") {
    return (
      <View style={styles.centered} testID={testID}>
        <Text style={styles.lockIcon}>{"🔒"}</Text>
        <Text style={styles.title}>Account locked</Text>
        <Text style={styles.body}>
          Too many failed sign-in attempts. Your account has been temporarily
          locked for security.
        </Text>
        {lockedCountdownSeconds !== undefined ? (
          <Text
            style={styles.countdown}
            testID={testID ? `${testID}-countdown` : undefined}
          >
            {`Try again in ${lockedCountdownSeconds}s`}
          </Text>
        ) : null}
        <Button
          label="Contact support"
          variant="tertiary"
          onPress={onContactSupport}
          testID={testID ? `${testID}-contact` : undefined}
        />
      </View>
    );
  }

  // ------------------------------------------------------------------
  if (view === "mfa-setup") {
    const MFA_METHODS: { value: MfaMethod; label: string; desc: string }[] = [
      {
        value: "authenticator",
        label: "Authenticator app",
        desc: "Use Google Authenticator, Authy, or similar",
      },
      { value: "sms", label: "SMS", desc: "Receive a code by text message" },
      { value: "email", label: "Email", desc: "Receive a code by email" },
    ];

    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        testID={testID}
      >
        <Text style={styles.title}>
          {mfaSetupStep === 1 ? "Set up two-step verification" : "Enter verification code"}
        </Text>
        {mfaSetupStep === 1 ? (
          <>
            <Text style={styles.body}>Choose how to receive your sign-in codes.</Text>
            {MFA_METHODS.map((m) => (
              <Pressable
                key={m.value}
                style={[
                  styles.methodRow,
                  localMfaMethod === m.value ? styles.methodRowSelected : null,
                ]}
                onPress={() => {
                  setLocalMfaMethod(m.value);
                  onSelectMfaMethod?.(m.value);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: localMfaMethod === m.value }}
                testID={testID ? `${testID}-method-${m.value}` : undefined}
              >
                <View style={styles.methodInfo}>
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Text style={styles.methodDesc}>{m.desc}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    localMfaMethod === m.value ? styles.radioSelected : null,
                  ]}
                >
                  {localMfaMethod === m.value ? (
                    <View style={styles.radioDot} />
                  ) : null}
                </View>
              </Pressable>
            ))}
            {localMfaMethod === "authenticator" && mfaQrDataUrl ? (
              <View
                style={styles.qrPlaceholder}
                testID={testID ? `${testID}-qr` : undefined}
              >
                <Text style={styles.qrLabel}>Scan this QR code</Text>
              </View>
            ) : null}
            <Button
              label="Continue"
              variant="primary"
              disabled={!localMfaMethod}
              onPress={onConfirmMfaSetup}
              testID={testID ? `${testID}-setup-continue` : undefined}
            />
          </>
        ) : (
          <>
            <Text style={styles.body}>
              Enter the 6-digit code to verify your setup.
            </Text>
            <MfaOtpInput
              value={otpValue}
              onChange={onOtpChange ?? (() => {})}
              error={otpError}
              testID={testID ? `${testID}-otp` : undefined}
            />
            <Button
              label="Verify"
              variant="primary"
              disabled={otpValue.length < 6}
              onPress={onSubmitOtp}
              testID={testID ? `${testID}-otp-submit` : undefined}
            />
          </>
        )}
      </ScrollView>
    );
  }

  // ------------------------------------------------------------------
  if (view === "mfa-challenge") {
    return (
      <View style={styles.content} testID={testID}>
        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.body}>
          Enter the 6-digit code from your authenticator app or your SMS/email.
        </Text>
        <MfaOtpInput
          value={otpValue}
          onChange={onOtpChange ?? (() => {})}
          error={otpError}
          testID={testID ? `${testID}-otp` : undefined}
        />
        <Button
          label="Verify"
          variant="primary"
          disabled={otpValue.length < 6}
          onPress={onSubmitOtp}
          testID={testID ? `${testID}-verify` : undefined}
        />
        <Button
          label="Use a recovery code"
          variant="tertiary"
          onPress={() => {}}
          testID={testID ? `${testID}-use-recovery` : undefined}
        />
      </View>
    );
  }

  // ------------------------------------------------------------------
  if (view === "recovery-codes") {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        testID={testID}
      >
        <Text style={styles.title}>Recovery codes</Text>
        <Text style={styles.body}>
          Recovery codes let you sign in if you lose access to your authenticator.
          Each code can only be used once.
        </Text>
        <RecoveryCodesList
          codes={recoveryCodes}
          onCopyAll={onCopyRecoveryCodes}
          onDownload={onDownloadRecoveryCodes}
          testID={testID ? `${testID}-codes` : undefined}
        />
      </ScrollView>
    );
  }

  // ------------------------------------------------------------------
  if (view === "devices") {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        testID={testID}
      >
        <Text style={styles.title}>Active devices</Text>
        <Text style={styles.body}>
          These devices are currently signed in to your account.
        </Text>
        {devices.map((device, idx) => (
          <DeviceRow
            key={device.id}
            deviceName={device.deviceName}
            lastActive={device.lastActive}
            isCurrent={device.isCurrent}
            onRevoke={() => onRevokeDevice?.(device.id)}
            showSeparator={idx < devices.length - 1}
            testID={testID ? `${testID}-device-${device.id}` : undefined}
          />
        ))}
        <Button
          label="Sign out of all devices"
          variant="destructive"
          onPress={onSignOutAll}
          testID={testID ? `${testID}-sign-out-all-btn` : undefined}
        />

        {/* Sign out all confirm modal */}
        <ModalSheet
          visible={signOutAllVisible}
          onClose={onCancelSignOutAll ?? (() => {})}
          title="Sign out everywhere?"
          testID={testID ? `${testID}-sign-out-all-modal` : undefined}
          footer={
            <>
              <Button
                label="Sign out of all devices"
                variant="destructive"
                onPress={onSignOutAll}
                testID={testID ? `${testID}-sign-out-all-confirm` : undefined}
              />
              <Button
                label="Cancel"
                variant="tertiary"
                onPress={onCancelSignOutAll}
                testID={testID ? `${testID}-sign-out-all-cancel` : undefined}
              />
            </>
          }
        >
          <Text style={styles.body}>
            You will be signed out from all devices. You'll need to sign in again
            everywhere.
          </Text>
        </ModalSheet>
      </ScrollView>
    );
  }

  // ------------------------------------------------------------------
  if (view === "sign-out-all") {
    return (
      <View style={styles.centered} testID={testID}>
        <Text style={styles.title}>Sign out everywhere?</Text>
        <Text style={styles.body}>
          You will be signed out from all devices. You'll need to sign in again
          everywhere.
        </Text>
        <Button
          label="Sign out of all devices"
          variant="destructive"
          onPress={onSignOutAll}
          testID={testID ? `${testID}-confirm` : undefined}
        />
        <Button
          label="Cancel"
          variant="tertiary"
          onPress={onCancelSignOutAll}
          testID={testID ? `${testID}-cancel` : undefined}
        />
      </View>
    );
  }

  // ------------------------------------------------------------------
  if (view === "re-auth") {
    return (
      <ModalSheet
        visible={reAuthVisible}
        onClose={onCancelReAuth ?? (() => {})}
        title="Confirm your identity"
        testID={testID}
        footer={
          <Button
            label="Continue"
            variant="primary"
            disabled={!reAuthPassword}
            onPress={onSubmitReAuth}
            testID={testID ? `${testID}-submit` : undefined}
          />
        }
      >
        <View style={styles.reAuthBody}>
          <Text style={styles.body}>
            Enter your password to continue with this action.
          </Text>
          <InputField
            label="Password"
            value={reAuthPassword}
            onChangeText={onReAuthPasswordChange ?? (() => {})}
            variant="password"
            error={reAuthError ?? undefined}
            testID={testID ? `${testID}-password` : undefined}
          />
        </View>
      </ModalSheet>
    );
  }

  // ------------------------------------------------------------------
  if (view === "magic-link") {
    const isSuccess = magicLinkResult === "success";
    return (
      <View style={styles.centered} testID={testID}>
        <Text style={styles.linkIcon}>{isSuccess ? "✅" : "❌"}</Text>
        <Text style={styles.title}>
          {isSuccess ? "You're signed in" : "Link expired or invalid"}
        </Text>
        <Text style={styles.body}>
          {isSuccess
            ? "Your magic link was verified. Welcome back!"
            : "This magic link has expired or already been used. Request a new one."}
        </Text>
        <Button
          label={isSuccess ? "Continue" : "Request new link"}
          variant="primary"
          onPress={onMagicLinkContinue}
          testID={testID ? `${testID}-cta` : undefined}
        />
      </View>
    );
  }

  // ------------------------------------------------------------------
  if (view === "sso-conflict") {
    return (
      <View style={styles.content} testID={testID}>
        <Banner
          variant="warning"
          message={
            ssoConflictEmail && ssoConflictProvider
              ? `${ssoConflictEmail} is linked to ${ssoConflictProvider}. Sign in with ${ssoConflictProvider}?`
              : "This email is linked to another sign-in method."
          }
          testID={testID ? `${testID}-banner` : undefined}
        />
        <Button
          label={`Switch to ${ssoConflictProvider ?? "other sign-in"}`}
          variant="primary"
          onPress={onSwitchProvider}
          testID={testID ? `${testID}-switch` : undefined}
        />
        <Button
          label="Dismiss"
          variant="tertiary"
          onPress={onDismissSsoConflict}
          testID={testID ? `${testID}-dismiss` : undefined}
        />
      </View>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.pageHorizontal,
    paddingBottom: spacing.s12,
    gap: spacing.s4,
  },
  title: {
    ...textStyles.heading2,
    color: colors.foreground,
    textAlign: "center",
  },
  body: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  lockIcon: {
    fontSize: 48,
  },
  linkIcon: {
    fontSize: 48,
  },
  countdown: {
    ...textStyles.labelLarge,
    color: colors.error,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.s4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.s3,
  },
  methodRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary10,
  },
  methodInfo: {
    flex: 1,
    gap: spacing.s1,
  },
  methodLabel: {
    ...textStyles.label,
    color: colors.foreground,
  },
  methodDesc: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  qrPlaceholder: {
    height: 160,
    backgroundColor: colors.disabledBg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  qrLabel: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  reAuthBody: {
    paddingBottom: spacing.s4,
    gap: spacing.s4,
  },
});
