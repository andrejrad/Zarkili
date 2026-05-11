/**
 * SalonOnboardingMarketplaceScreen.tsx — Salon onboarding step 8/9.
 *
 * Toggle marketplace listing visibility and choose listing tier.
 * W37-DEBT-7 closed.
 */

import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { Banner, Button, Stepper, colors, radius, spacing } from "../../shared/ui";

export type SalonOnboardingMarketplaceScreenProps = {
  totalSteps: number;
  currentStep: number;
  initialIsListed?: boolean;
  onContinue: (data: { isListed: boolean }) => Promise<void>;
  onBack?: () => void;
};

export function SalonOnboardingMarketplaceScreen({
  totalSteps,
  currentStep,
  initialIsListed = false,
  onContinue,
  onBack,
}: SalonOnboardingMarketplaceScreenProps) {
  const [isListed, setIsListed] = useState(initialIsListed);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setError(null);
    setSubmitting(true);
    try {
      await onContinue({ isListed });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save marketplace settings.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="salon-marketplace-stepper" />
      <Text style={styles.heading} accessibilityRole="header">Marketplace visibility</Text>
      <Text style={styles.body}>
        List your salon on the Zarkili marketplace so clients can discover and book you.
      </Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardText}>
            <Text style={styles.cardLabel}>List on marketplace</Text>
            <Text style={styles.cardDesc}>
              Your salon will appear in search results and can receive new client bookings.
            </Text>
          </View>
          <Switch
            value={isListed}
            onValueChange={setIsListed}
            disabled={submitting}
            accessibilityLabel="List on marketplace"
            testID="salon-marketplace-toggle"
          />
        </View>
        {!isListed ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              You can enable marketplace listing at any time from Settings → Marketplace.
            </Text>
          </View>
        ) : (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              Your salon will be visible to clients after verification is complete.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          label="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          disabled={submitting}
          testID="salon-marketplace-continue"
        />
        {onBack ? (
          <Button label="Back" onPress={onBack} variant="secondary" size="large" disabled={submitting} testID="salon-marketplace-back" />
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    marginBottom: spacing.s4,
    gap: spacing.s3,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.s3 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: colors.textMuted },
  noteBox: {
    backgroundColor: colors.surfaceMuted ?? colors.background,
    borderRadius: radius.md,
    padding: spacing.s3,
  },
  noteText: { fontSize: 12, color: colors.textMuted },
  successBox: {
    backgroundColor: colors.successSurface ?? "#E8F5E9",
    borderRadius: radius.md,
    padding: spacing.s3,
  },
  successText: { fontSize: 12, color: colors.successText ?? "#2E7D32" },
  actions: { gap: spacing.s2 },
});
