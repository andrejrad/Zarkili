/**
 * ForgotPasswordScreen.tsx — A.4 Forgot Password (request).
 */

import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../providers/AuthProvider";
import {
  Banner,
  Button,
  InputField,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import { isValidEmail } from "../../shared/ui/formatters";

export type ForgotPasswordScreenProps = {
  onSent?: (email: string) => void;
  onBack?: () => void;
};

export function ForgotPasswordScreen({ onSent, onBack }: ForgotPasswordScreenProps) {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setErrorBanner(null);
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError(null);
    setSubmitting(true);
    try {
      await sendPasswordReset({ email: email.trim() });
      setSent(true);
      onSent?.(email.trim());
    } catch (e) {
      setErrorBanner(e instanceof Error ? e.message : "Could not send reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading} accessibilityRole="header">
        Reset your password
      </Text>
      <Text style={styles.body}>
        {"Enter the email associated with your account and we'll send a reset link."}
      </Text>

      {sent ? (
        <View style={styles.bannerWrap}>
          <Banner
            variant="success"
            title="Check your inbox"
            message={`We sent a reset link to ${email.trim()}.`}
          />
        </View>
      ) : null}

      {errorBanner ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={errorBanner} />
        </View>
      ) : null}

      <View style={styles.formCard}>
        <InputField
          label="Email"
          variant="email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          error={emailError ?? undefined}
          disabled={submitting || sent}
          testID="forgot-email"
        />
      </View>

      <Button
        label={sent ? "Resend link" : "Send reset link"}
        onPress={handleSubmit}
        loading={submitting}
        fullWidth
        testID="forgot-submit"
      />

      <View style={styles.footerWrap}>
        <Button variant="tertiary" size="small" label="Back to sign in" onPress={onBack} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
    color: colors.foreground,
  },
  body: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.s4 },
  bannerWrap: { marginBottom: spacing.s2 },
  footerWrap: { alignItems: "center", marginTop: spacing.s4 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.cardPadding,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s5,
    gap: spacing.s4,
  },
});
