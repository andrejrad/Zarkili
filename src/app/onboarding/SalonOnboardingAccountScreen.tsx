/**
 * SalonOnboardingAccountScreen.tsx — Salon onboarding step 1/9: Account Setup.
 *
 * Confirms the owner email and contact phone for the salon account.
 * W37-DEBT-7 closed.
 */

import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, Stepper, colors, spacing } from "../../shared/ui";

export type SalonOnboardingAccountScreenProps = {
  totalSteps: number;
  currentStep: number;
  initialOwnerEmail?: string;
  onContinue: (data: { ownerEmail: string; contactPhone: string }) => Promise<void>;
  onBack?: () => void;
};

export function SalonOnboardingAccountScreen({
  totalSteps,
  currentStep,
  initialOwnerEmail = "",
  onContinue,
  onBack,
}: SalonOnboardingAccountScreenProps) {
  const [ownerEmail, setOwnerEmail] = useState(initialOwnerEmail);
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setError(null);
    if (!ownerEmail.trim().includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      await onContinue({ ownerEmail: ownerEmail.trim(), contactPhone: contactPhone.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save account details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="salon-account-stepper" />
      <Text style={styles.heading} accessibilityRole="header">Account Setup</Text>
      <Text style={styles.body}>Confirm the owner email and contact phone for your salon account.</Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <View style={styles.form}>
        <InputField
          label="Owner email"
          value={ownerEmail}
          onChangeText={setOwnerEmail}
          placeholder="owner@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          disabled={submitting}
          testID="salon-account-email"
        />
        <InputField
          label="Contact phone (optional)"
          value={contactPhone}
          onChangeText={setContactPhone}
          placeholder="+1 555 000 0000"
          keyboardType="phone-pad"
          disabled={submitting}
          testID="salon-account-phone"
        />
      </View>

      <View style={styles.actions}>
        <Button
          label="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          disabled={submitting}
          testID="salon-account-continue"
        />
        {onBack ? (
          <Button
            label="Back"
            onPress={onBack}
            variant="secondary"
            size="large"
            disabled={submitting}
            testID="salon-account-back"
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: "800", color: colors.foreground, marginBottom: spacing.s2 },
  body: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.s4 },
  bannerWrap: { marginBottom: spacing.s3 },
  form: { gap: spacing.s3, marginBottom: spacing.s5 },
  actions: { gap: spacing.s2 },
});
