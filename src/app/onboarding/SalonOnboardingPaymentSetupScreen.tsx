/**
 * SalonOnboardingPaymentSetupScreen.tsx — Salon onboarding step 3/9.
 *
 * Guides the salon owner to connect a Stripe account for bookings and payouts.
 * Real OAuth redirect is platform-specific; this screen shows instructions and
 * a "I've connected Stripe" acknowledgement that records the intent.
 * W37-DEBT-7 closed.
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, Stepper, colors, radius, spacing } from "../../shared/ui";

export type SalonOnboardingPaymentSetupScreenProps = {
  totalSteps: number;
  currentStep: number;
  onContinue: (data: { stripeConnected: boolean }) => Promise<void>;
  onSkip?: () => void;
  onBack?: () => void;
};

const STEPS = [
  "Go to your Stripe dashboard (stripe.com) and create or log in to your account.",
  `Under "Settings → Connect", enable the Stripe Connect platform for your account.`,
  `Return here and tap "I've connected Stripe" — our team will verify and link it within 24 hours.`,
];

export function SalonOnboardingPaymentSetupScreen({
  totalSteps,
  currentStep,
  onContinue,
  onSkip,
  onBack,
}: SalonOnboardingPaymentSetupScreenProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setError(null);
    if (!confirmed) {
      setError("Please confirm you have connected your Stripe account.");
      return;
    }
    setSubmitting(true);
    try {
      await onContinue({ stripeConnected: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save payment setup.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="salon-payment-stepper" />
      <Text style={styles.heading} accessibilityRole="header">Payment Setup</Text>
      <Text style={styles.body}>
        Connect a Stripe account so your salon can collect bookings and receive payouts.
      </Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <View style={styles.instructionCard}>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.instructionRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{i + 1}</Text>
            </View>
            <Text style={styles.instructionText}>{step}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => setConfirmed((v) => !v)}
        style={styles.checkRow}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: confirmed }}
        accessibilityLabel="I've connected my Stripe account"
        testID="salon-payment-confirm"
      >
        <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
          {confirmed ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={styles.checkLabel}>{"I've connected my Stripe account"}</Text>
      </Pressable>

      <View style={styles.actions}>
        <Button
          label="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          disabled={submitting}
          testID="salon-payment-continue"
        />
        {onSkip ? (
          <Button label="Set up later" onPress={onSkip} variant="secondary" size="large" disabled={submitting} testID="salon-payment-skip" />
        ) : null}
        {onBack ? (
          <Button label="Back" onPress={onBack} variant="secondary" size="large" disabled={submitting} testID="salon-payment-back" />
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
  instructionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    gap: spacing.s3,
    marginBottom: spacing.s4,
  },
  instructionRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.s3 },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepBadgeText: { fontSize: 12, fontWeight: "700", color: colors.foreground },
  instructionText: { flex: 1, fontSize: 14, color: colors.foreground, lineHeight: 20 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: spacing.s3, marginBottom: spacing.s5 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  checkLabel: { fontSize: 14, color: colors.foreground },
  actions: { gap: spacing.s2 },
});
