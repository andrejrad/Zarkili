/**
 * ChangeCredentialsScreen.tsx — I.7 Change Email / Phone / Password.
 *
 * Two-step flow per credential type:
 *  Step 1: re-auth (current password)
 *  Step 2: enter new value + verify (email/phone trigger verification)
 *
 * credentialType: "email" | "phone" | "password"
 * step:          1 | 2
 * States per step: default | validating | mismatch | success
 */

import { StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, colors, radius, spacing, textStyles } from "../../shared/ui";

export type CredentialType = "email" | "phone" | "password";
export type ChangeCredentialStep = 1 | 2;
export type ChangeCredentialState = "default" | "validating" | "mismatch" | "success";

export type ChangeCredentialsScreenProps = {
  credentialType: CredentialType;
  step?: ChangeCredentialStep;
  state?: ChangeCredentialState;
  currentPassword: string;
  newValue: string;
  confirmValue?: string;
  onChangeCurrentPassword: (value: string) => void;
  onChangeNewValue: (value: string) => void;
  onChangeConfirmValue?: (value: string) => void;
  onSubmitStep1: () => void;
  onSubmitStep2: () => void;
  onBack?: () => void;
  testID?: string;
};

const CREDENTIAL_LABELS: Record<CredentialType, string> = {
  email: "Email address",
  phone: "Phone number",
  password: "Password",
};

const STEP1_HEADING = "Confirm your identity";
const STEP2_HEADINGS: Record<CredentialType, string> = {
  email: "New email address",
  phone: "New phone number",
  password: "New password",
};

export function ChangeCredentialsScreen({
  credentialType,
  step = 1,
  state = "default",
  currentPassword,
  newValue,
  confirmValue = "",
  onChangeCurrentPassword,
  onChangeNewValue,
  onChangeConfirmValue,
  onSubmitStep1,
  onSubmitStep2,
  onBack,
  testID,
}: ChangeCredentialsScreenProps) {
  const label = CREDENTIAL_LABELS[credentialType];

  const isMismatch = state === "mismatch";
  const isSuccess = state === "success";
  const isValidating = state === "validating";

  if (isSuccess) {
    return (
      <View style={styles.centered} testID={testID}>
        <Text style={styles.successIcon}>{"✓"}</Text>
        <Text style={styles.successTitle}>{label} updated</Text>
        {(credentialType === "email" || credentialType === "phone") ? (
          <Text style={styles.successBody}>
            A verification link has been sent. Please verify your new {label.toLowerCase()}.
          </Text>
        ) : null}
        <Button
          label="Done"
          onPress={onBack}
          testID={testID ? `${testID}-done` : undefined}
        />
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step >= 1 ? styles.stepDotActive : null]} />
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, step >= 2 ? styles.stepDotActive : null]} />
      </View>

      <Text style={styles.heading}>
        {step === 1 ? STEP1_HEADING : STEP2_HEADINGS[credentialType]}
      </Text>

      {isMismatch ? (
        <Banner
          variant="error"
          message={
            step === 1
              ? "Incorrect password. Please try again."
              : `${label}s do not match.`
          }
          testID={testID ? `${testID}-error-banner` : undefined}
        />
      ) : null}

      {step === 1 ? (
        <>
          <View style={styles.formCard}>
            <InputField
              label="Current password"
              value={currentPassword}
              onChangeText={onChangeCurrentPassword}
              variant="password"
              error={isMismatch ? "Incorrect password" : undefined}
              testID={testID ? `${testID}-current-password` : undefined}
            />
          </View>
          <Button
            label={isValidating ? "Verifying..." : "Continue"}
            variant="primary"
            disabled={!currentPassword || isValidating}
            loading={isValidating}
            onPress={onSubmitStep1}
            testID={testID ? `${testID}-step1-submit` : undefined}
          />
        </>
      ) : (
        <>
          <View style={styles.formCard}>
            <InputField
              label={`New ${label.toLowerCase()}`}
              value={newValue}
              onChangeText={onChangeNewValue}
              variant={
                credentialType === "email"
                  ? "email"
                  : credentialType === "phone"
                  ? "phone"
                  : "password"
              }
              testID={testID ? `${testID}-new-value` : undefined}
            />
            {credentialType === "password" ? (
              <InputField
                label="Confirm new password"
                value={confirmValue}
                onChangeText={onChangeConfirmValue ?? (() => {})}
                variant="password"
                error={isMismatch ? "Passwords do not match" : undefined}
                testID={testID ? `${testID}-confirm-value` : undefined}
              />
            ) : null}
          </View>
          <Button
            label={isValidating ? "Saving..." : "Save"}
            variant="primary"
            disabled={!newValue || isValidating}
            loading={isValidating}
            onPress={onSubmitStep2}
            testID={testID ? `${testID}-step2-submit` : undefined}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.pageHorizontal,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s4,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 0,
    marginBottom: spacing.s2,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: colors.border,
  },
  heading: {
    ...textStyles.heading2,
    color: colors.foreground,
  },
  successIcon: {
    fontSize: 48,
    color: colors.success,
  },
  successTitle: {
    ...textStyles.heading3,
    color: colors.foreground,
    textAlign: "center",
  },
  successBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.cardPadding,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s5,
    gap: spacing.s4,
  },
});
