/**
 * SignUpScreen.tsx — A.2 Sign Up.
 *
 * Email or phone + first/last name + password (with strength meter) + ToS.
 * Marketing opt-in defaults to OFF (TCPA / CAN-SPAM safe).
 */

import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../providers/AuthProvider";
import {
  Banner,
  Button,
  InputField,
  SegmentedControl,
  Stepper,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import {
  formatUsPhone,
  isValidEmail,
  meetsPasswordPolicy,
  passwordStrength,
} from "../../shared/ui/formatters";

export type SignUpScreenProps = {
  onSignedUp?: () => void;
  onSignIn?: () => void;
};

type Mode = "email" | "phone";

export function SignUpScreen({ onSignedUp, onSignIn }: SignUpScreenProps) {
  const { createAccount } = useAuth();
  const [mode, setMode] = useState<Mode>("email");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  /** TCPA / CAN-SPAM: marketing default OFF. */
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(password);

  function validate(): boolean {
    const next: { [k: string]: string } = {};
    if (firstName.trim().length === 0) next.firstName = "First name is required.";
    if (lastName.trim().length === 0) next.lastName = "Last name is required.";
    if (mode === "email" && !isValidEmail(identifier)) {
      next.identifier = "Please enter a valid email address.";
    }
    if (mode === "phone" && identifier.replace(/\D/g, "").length !== 10) {
      next.identifier = "Please enter a 10-digit US phone number.";
    }
    if (!meetsPasswordPolicy(password)) {
      next.password = "Password must be 8+ chars with 1 number and 1 symbol.";
    }
    if (!agreedToTerms) {
      next.terms = "You must agree to Terms and Privacy Policy.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    setErrorBanner(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createAccount({
        email: mode === "email" ? identifier.trim() : `${identifier.replace(/\D/g, "")}@phone.zarkili.local`,
        password,
      });
      onSignedUp?.();
    } catch (e) {
      setErrorBanner(e instanceof Error ? e.message : "Sign-up failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.kvContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <Text style={styles.heading} accessibilityRole="header">
          Create account
        </Text>
        <Stepper totalSteps={4} currentStep={1} testID="signup-stepper" />
      </View>

      {errorBanner ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={errorBanner} />
        </View>
      ) : null}

      <View style={styles.formCard}>
        <SegmentedControl
          options={[
            { value: "email", label: "Email" },
            { value: "phone", label: "Phone" },
          ]}
          value={mode}
          onChange={(v) => {
            setMode(v);
            setIdentifier("");
          }}
          testID="signup-mode"
        />

        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <InputField
              flat
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
              disabled={submitting}
              testID="signup-first-name"
            />
          </View>
          <View style={styles.nameDivider} />
          <View style={styles.nameField}>
            <InputField
              flat
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
              disabled={submitting}
              testID="signup-last-name"
            />
          </View>
        </View>

        <InputField
          flat
          label={mode === "email" ? "Email" : "Phone"}
          variant={mode === "email" ? "email" : "phone"}
          value={identifier}
          onChangeText={(v) => setIdentifier(mode === "phone" ? formatUsPhone(v) : v)}
          placeholder={mode === "email" ? "you@example.com" : "(555) 555-1234"}
          error={errors.identifier}
          disabled={submitting}
          testID="signup-identifier"
        />

        <InputField
          flat
          label="Password"
          variant="password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          helper="8+ chars, 1 number, 1 symbol"
          error={errors.password}
          disabled={submitting}
          testID="signup-password"
        />
        {password.length > 0 ? (
          <View
            style={styles.strengthRow}
            accessibilityRole="text"
            accessibilityValue={{ text: strength }}
            testID="signup-strength"
          >
            <Text style={styles.strengthLabel}>Strength: {strength}</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => setAgreedToTerms((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreedToTerms }}
        accessibilityLabel="I agree to Terms and Privacy Policy"
        style={styles.checkboxRow}
        hitSlop={8}
        testID="signup-terms"
      >
        <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
          {agreedToTerms ? <Text style={styles.checkboxMark}>✓</Text> : null}
        </View>
        <Text style={styles.checkboxLabel}>
          I agree to Terms and Privacy Policy
        </Text>
      </Pressable>
      {errors.terms ? <Text style={styles.checkboxError}>{errors.terms}</Text> : null}

      <Pressable
        onPress={() => setMarketingOptIn((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marketingOptIn }}
        accessibilityLabel="Send me marketing emails"
        style={styles.checkboxRow}
        hitSlop={8}
        testID="signup-marketing"
      >
        <View style={[styles.checkbox, marketingOptIn && styles.checkboxChecked]}>
          {marketingOptIn ? <Text style={styles.checkboxMark}>✓</Text> : null}
        </View>
        <Text style={styles.checkboxLabel}>Send me marketing emails (optional)</Text>
      </Pressable>

      <Button
        label="Continue"
        onPress={handleSubmit}
        loading={submitting}
        disabled={!agreedToTerms}
        fullWidth
        testID="signup-submit"
      />

      <View style={styles.footerWrap}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Button variant="tertiary" size="small" label="Sign in" onPress={onSignIn} />
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kvContainer: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s4 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: "600", color: colors.foreground },
  bannerWrap: { marginBottom: spacing.s1 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.cardPadding,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s5,
    gap: spacing.s4,
  },
  nameRow: { flexDirection: "row", alignItems: "flex-start" },
  nameField: { flex: 1 },
  nameDivider: { width: spacing.s3 },
  strengthRow: { marginTop: -spacing.s2 },
  strengthLabel: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    gap: spacing.s2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: colors.white, fontSize: 14, lineHeight: 14, fontWeight: "600" },
  checkboxLabel: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.foreground },
  checkboxError: { fontSize: 12, lineHeight: 16, color: colors.error, marginTop: -spacing.s2 },
  footerWrap: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.s4,
    gap: spacing.s2,
  },
  footerText: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
});
