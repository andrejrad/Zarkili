/**
 * SignInScreen.tsx — A.1 Sign In.
 *
 * Email or phone segmented control + password.
 * Wired to AuthProvider.signIn() with friendly error messaging.
 */

import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../providers/AuthProvider";
import {
  Banner,
  Button,
  InputField,
  SegmentedControl,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import { formatUsPhone, isValidEmail } from "../../shared/ui/formatters";

export type SignInScreenProps = {
  onSignedIn?: () => void;
  onForgotPassword?: () => void;
  onCreateAccount?: () => void;
  onSocialSignIn?: () => void;
  onDevAction?: () => void;
  onBack?: () => void;
};

type Mode = "email" | "phone";

export function SignInScreen({
  onSignedIn,
  onForgotPassword,
  onCreateAccount,
  onSocialSignIn,
  onDevAction,
  onBack,
}: SignInScreenProps) {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    let ok = true;
    if (mode === "email") {
      if (!isValidEmail(identifier)) {
        setIdentifierError("Please enter a valid email address.");
        ok = false;
      } else {
        setIdentifierError(null);
      }
    } else {
      if (identifier.replace(/\D/g, "").length !== 10) {
        setIdentifierError("Please enter a 10-digit US phone number.");
        ok = false;
      } else {
        setIdentifierError(null);
      }
    }
    if (password.length === 0) {
      setPasswordError("Password is required.");
      ok = false;
    } else {
      setPasswordError(null);
    }
    return ok;
  }

  async function handleSubmit() {
    setErrorBanner(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await signIn({
        email: mode === "email" ? identifier.trim() : "",
        password,
      });
      onSignedIn?.();
    } catch (e) {
      setErrorBanner(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.kvContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.heading} accessibilityRole="header">
        Sign in
      </Text>

      {errorBanner ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={errorBanner} />
        </View>
      ) : null}

      <View style={styles.segmentWrap}>
        <SegmentedControl
          options={[
            { value: "email", label: "Email" },
            { value: "phone", label: "Phone" },
          ]}
          value={mode}
          onChange={(v) => {
            setMode(v);
            setIdentifier("");
            setIdentifierError(null);
          }}
          testID="signin-mode"
        />
      </View>

      <View style={styles.formCard}>
        <InputField
          label={mode === "email" ? "Email" : "Phone"}
          variant={mode === "email" ? "email" : "phone"}
          value={identifier}
          onChangeText={(v) => setIdentifier(mode === "phone" ? formatUsPhone(v) : v)}
          placeholder={mode === "email" ? "you@example.com" : "(555) 555-1234"}
          error={identifierError ?? undefined}
          disabled={submitting}
          testID="signin-identifier"
        />
        <InputField
          label="Password"
          variant="password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          error={passwordError ?? undefined}
          disabled={submitting}
          testID="signin-password"
        />
      </View>

      <View style={styles.forgotWrap}>
        <Button
          variant="tertiary"
          size="small"
          label="Forgot password?"
          onPress={onForgotPassword}
        />
      </View>

      <Button
        label="Sign in"
        onPress={handleSubmit}
        loading={submitting}
        fullWidth
        testID="signin-submit"
      />

      {onSocialSignIn ? (
        <View style={styles.dividerWrap}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>
      ) : null}

      {onSocialSignIn ? (
        <Button
          variant="secondary"
          label="Continue with social"
          onPress={onSocialSignIn}
          fullWidth
          testID="signin-social"
        />
      ) : null}

      {onDevAction ? (
        <Button
          variant="secondary"
          label="Sign in as dev user"
          onPress={onDevAction}
          fullWidth
          testID="signin-dev"
        />
      ) : null}

      {onBack ? (
        <Button
          variant="tertiary"
          label="Back"
          onPress={onBack}
          fullWidth
          testID="signin-back"
        />
      ) : null}

      <View style={styles.footerWrap}>
        <Text style={styles.footerText}>New here?</Text>
        <Button
          variant="tertiary"
          size="small"
          label="Create account"
          onPress={onCreateAccount}
        />
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kvContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.pageVertical,
    gap: spacing.s4,
  },
  heading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: spacing.s4,
  },
  bannerWrap: {
    marginBottom: spacing.s2,
  },
  segmentWrap: {
    marginBottom: spacing.s2,
  },
  forgotWrap: {
    alignItems: "flex-end",
    marginVertical: spacing.s2,
  },
  footerWrap: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.s4,
    gap: spacing.s2,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  dividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    marginVertical: spacing.s2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
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
