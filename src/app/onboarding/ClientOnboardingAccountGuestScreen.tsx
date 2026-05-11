/**
 * ClientOnboardingAccountGuestScreen.tsx — client onboarding step: account-guest.
 *
 * Presents email + password sign-up form for new consumers who arrive as
 * guests. On completion, calls `onContinue` which navigates to phone-verify.
 * The "Continue as guest" CTA skips straight to `phone-verify`.
 */

import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, Stepper, colors, radius, spacing } from "../../shared/ui";

export type ClientOnboardingAccountGuestScreenProps = {
  totalSteps: number;
  currentStep: number;
  /** Called with email+password when the user taps "Create account". */
  onContinue: (input: { email: string; password: string }) => Promise<void>;
  /** Skip account creation — continue as guest. */
  onSkip?: () => void;
};

export function ClientOnboardingAccountGuestScreen({
  totalSteps,
  currentStep,
  onContinue,
  onSkip,
}: ClientOnboardingAccountGuestScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setError(null);
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await onContinue({ email: email.trim(), password });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="account-guest-stepper" />

      <Text style={styles.heading} accessibilityRole="header">
        Create your account
      </Text>
      <Text style={styles.subtitle}>
        Save your preferences, bookings and loyalty points across devices.
      </Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <View style={styles.formCard}>
        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          variant="email"
          disabled={submitting}
          testID="account-guest-email"
        />
        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          variant="password"
          disabled={submitting}
          testID="account-guest-password"
        />
        <InputField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat your password"
          variant="password"
          disabled={submitting}
          testID="account-guest-confirm-password"
        />
      </View>

      <View style={styles.actions}>
        <Button
          label={submitting ? "Creating account…" : "Create account"}
          onPress={() => void handleContinue()}
          disabled={submitting}
          testID="account-guest-submit"
        />
        {onSkip ? (
          <Button
            variant="secondary"
            label="Continue as guest"
            onPress={onSkip}
            disabled={submitting}
            testID="account-guest-skip"
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.s6, gap: spacing.s4 },
  heading: { fontSize: 24, fontWeight: "700", color: colors.foreground, marginTop: spacing.s4 },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  bannerWrap: { marginVertical: spacing.s2 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.s4,
    gap: spacing.s3,
  },
  actions: { gap: spacing.s3, marginTop: spacing.s3 },
});
