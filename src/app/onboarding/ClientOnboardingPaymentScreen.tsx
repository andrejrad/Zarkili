/**
 * ClientOnboardingPaymentScreen.tsx — A.7.5.
 *
 * Payment is OPTIONAL. The actual card capture is left to the W23 payment
 * batch (D.2). This screen surfaces a stub "Add card" CTA + an explicit
 * "Skip for now" tertiary action.
 */

import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, Stepper, colors, radius, spacing } from "../../shared/ui";

export type ClientOnboardingPaymentScreenProps = {
  totalSteps: number;
  currentStep: number;
  /** Triggers card-add flow (W23). Resolves when card is saved. */
  onAddCard: () => Promise<void>;
  /** Skip for now — no card on file. */
  onSkip: () => Promise<void>;
};

export function ClientOnboardingPaymentScreen({
  totalSteps,
  currentStep,
  onAddCard,
  onSkip,
}: ClientOnboardingPaymentScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [skipping, setSkipping] = useState(false);

  async function handleAdd() {
    setError(null);
    setAdding(true);
    try {
      await onAddCard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save card.");
    } finally {
      setAdding(false);
    }
  }

  async function handleSkip() {
    setError(null);
    setSkipping(true);
    try {
      await onSkip();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not skip step.");
    } finally {
      setSkipping(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="payment-stepper" />
      <Text style={styles.heading} accessibilityRole="header">
        Faster checkout (optional)
      </Text>
      <Text style={styles.body}>
        Save a card now to book in one tap. You can always add it later from your profile.
      </Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <View style={styles.cardPreview}>
        <Text style={styles.cardLabel}>Add payment method</Text>
        <Text style={styles.cardSub}>Visa, Mastercard, Amex, Apple Pay, Google Pay</Text>
      </View>

      <Button
        label="Add card"
        onPress={handleAdd}
        loading={adding}
        disabled={skipping}
        fullWidth
        testID="payment-add"
      />

      <View style={styles.footerWrap}>
        <Button
          variant="tertiary"
          size="small"
          label="Skip for now"
          onPress={handleSkip}
          loading={skipping}
          disabled={adding}
          testID="payment-skip"
        />
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
    marginTop: spacing.s4,
  },
  body: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.s4 },
  bannerWrap: { marginBottom: spacing.s2 },
  cardPreview: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s5,
    marginBottom: spacing.s4,
  },
  cardLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: spacing.s1,
  },
  cardSub: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
  footerWrap: { alignItems: "center", marginTop: spacing.s4 },
});
