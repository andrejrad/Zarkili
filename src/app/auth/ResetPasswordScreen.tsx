/**
 * ResetPasswordScreen.tsx — A.4 Reset Password (from deep link).
 *
 * The actual reset call is delegated via the `onSubmit` prop because the
 * reset flow uses an out-of-band code (`oobCode`) that is platform-routed
 * and not part of the AuthProvider surface.
 */

import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, colors, radius, spacing } from "../../shared/ui";
import { meetsPasswordPolicy, passwordStrength } from "../../shared/ui/formatters";

export type ResetPasswordScreenProps = {
  /** Called with the new password once both fields validate locally. */
  onSubmit: (newPassword: string) => Promise<void>;
  onRequestNewLink?: () => void;
  /** Set when the deep link is known to be expired up-front. */
  expired?: boolean;
};

export function ResetPasswordScreen({
  onSubmit,
  onRequestNewLink,
  expired = false,
}: ResetPasswordScreenProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    let ok = true;
    if (!meetsPasswordPolicy(password)) {
      setPasswordError("Password must be 8+ chars with 1 number and 1 symbol.");
      ok = false;
    } else {
      setPasswordError(null);
    }
    if (password !== confirm) {
      setConfirmError("Passwords don't match.");
      ok = false;
    } else {
      setConfirmError(null);
    }
    return ok;
  }

  async function handleSubmit() {
    setErrorBanner(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(password);
      setSuccess(true);
    } catch (e) {
      setErrorBanner(e instanceof Error ? e.message : "Could not update password.");
    } finally {
      setSubmitting(false);
    }
  }

  if (expired) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading} accessibilityRole="header">
          Link expired
        </Text>
        <View style={styles.bannerWrap}>
          <Banner
            variant="error"
            message="This reset link has expired. Request a new one to continue."
          />
        </View>
        <Button
          label="Request new link"
          onPress={onRequestNewLink}
          fullWidth
          testID="reset-new-link"
        />
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.kvContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.heading} accessibilityRole="header">
        Set a new password
      </Text>

      {success ? (
        <View style={styles.bannerWrap}>
          <Banner variant="success" message="Password updated. You can sign in now." />
        </View>
      ) : null}
      {errorBanner ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={errorBanner} />
        </View>
      ) : null}

      <View style={styles.formCard}>
        <InputField
          label="New password"
          variant="password"
          value={password}
          onChangeText={setPassword}
          helper="8+ chars, 1 number, 1 symbol"
          error={passwordError ?? undefined}
          disabled={submitting || success}
          testID="reset-password"
        />
        {password.length > 0 ? (
          <Text style={styles.strength} testID="reset-strength">
            Strength: {passwordStrength(password)}
          </Text>
        ) : null}
        <InputField
          label="Confirm password"
          variant="password"
          value={confirm}
          onChangeText={setConfirm}
          error={confirmError ?? undefined}
          disabled={submitting || success}
          testID="reset-confirm"
        />
      </View>

      <Button
        label="Update password"
        onPress={handleSubmit}
        loading={submitting}
        disabled={success}
        fullWidth
        testID="reset-submit"
      />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kvContainer: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  heading: { fontSize: 24, lineHeight: 32, fontWeight: "600", color: colors.foreground },
  bannerWrap: { marginBottom: spacing.s2 },
  strength: { fontSize: 12, lineHeight: 16, color: colors.textMuted, marginTop: spacing.s1 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.cardPadding,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s5,
    gap: spacing.s4,
  },
});
