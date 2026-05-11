/**
 * ClientOnboardingPhoneVerifyScreen.tsx — client onboarding step: phone-verify.
 *
 * Collects a mobile phone number and a 6-digit SMS OTP.
 * Two-phase flow:
 *   Phase 1: Enter phone number → tap "Send code"
 *   Phase 2: Enter 6-digit OTP  → tap "Verify"
 *
 * Business logic (Firebase `linkWithPhoneNumber` + RecaptchaVerifier) is
 * injected via `onSendCode` / `onVerify` so this component stays pure/testable.
 */

import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, Stepper, colors, radius, spacing } from "../../shared/ui";

export type ClientOnboardingPhoneVerifyScreenProps = {
  totalSteps: number;
  currentStep: number;
  /**
   * Called with the E.164 phone number. Should trigger an SMS and resolve
   * with a verification ID (or throw on failure).
   */
  onSendCode: (phoneE164: string) => Promise<string>;
  /**
   * Called with the verification ID + OTP code. Should link the phone to the
   * Firebase account (linkWithPhoneNumber) and resolve on success.
   */
  onVerify: (verificationId: string, otp: string) => Promise<void>;
  onSkip?: () => void;
};

export function ClientOnboardingPhoneVerifyScreen({
  totalSteps,
  currentStep,
  onSendCode,
  onVerify,
  onSkip,
}: ClientOnboardingPhoneVerifyScreenProps) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const phase = verificationId ? "otp" : "phone";

  async function handleSendCode() {
    setError(null);
    // Accept digits only; require 7+ digits as a minimal sanity check.
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }
    // Normalise to E.164 — prepend +1 if no country code present.
    const e164 = phone.startsWith("+") ? phone : `+1${digits}`;
    setSubmitting(true);
    try {
      const id = await onSendCode(e164);
      setVerificationId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send SMS. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify() {
    setError(null);
    if (otp.replace(/\D/g, "").length !== 6) {
      setError("Please enter the 6-digit code from your SMS.");
      return;
    }
    setSubmitting(true);
    try {
      await onVerify(verificationId!, otp.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed. Check the code and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="phone-verify-stepper" />

      <Text style={styles.heading} accessibilityRole="header">
        {phase === "phone" ? "Add your phone number" : "Enter the code"}
      </Text>
      <Text style={styles.subtitle}>
        {phase === "phone"
          ? "We'll text you a one-time code to verify your number."
          : `We sent a 6-digit code to ${phone}. It expires in 10 minutes.`}
      </Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <View style={styles.formCard}>
        {phase === "phone" ? (
          <InputField
            label="Mobile number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 000-0000"
            variant="phone"
            disabled={submitting}
            testID="phone-verify-phone"
          />
        ) : (
          <InputField
            label="6-digit code"
            value={otp}
            onChangeText={setOtp}
            placeholder="123456"
            variant="otpCell"
            maxLength={6}
            disabled={submitting}
            testID="phone-verify-otp"
          />
        )}
      </View>

      <View style={styles.actions}>
        {phase === "phone" ? (
          <Button
            label={submitting ? "Sending…" : "Send code"}
            onPress={() => void handleSendCode()}
            disabled={submitting}
            testID="phone-verify-send"
          />
        ) : (
          <Button
            label={submitting ? "Verifying…" : "Verify"}
            onPress={() => void handleVerify()}
            disabled={submitting}
            testID="phone-verify-confirm"
          />
        )}
        {onSkip ? (
          <Button
            variant="secondary"
            label="Skip for now"
            onPress={onSkip}
            disabled={submitting}
            testID="phone-verify-skip"
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
