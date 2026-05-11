/**
 * SalonOnboardingPoliciesScreen.tsx — Salon onboarding step 6/9.
 *
 * Choose a cancellation policy (flexible / moderate / strict).
 * W37-DEBT-7 closed.
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, Stepper, colors, radius, spacing } from "../../shared/ui";

export type CancellationPolicy = "flexible" | "moderate" | "strict";

export type SalonOnboardingPoliciesScreenProps = {
  totalSteps: number;
  currentStep: number;
  initialPolicy?: CancellationPolicy;
  onContinue: (data: { cancellationPolicy: CancellationPolicy }) => Promise<void>;
  onBack?: () => void;
};

const POLICIES: { value: CancellationPolicy; label: string; description: string }[] = [
  {
    value: "flexible",
    label: "Flexible",
    description: "Clients may cancel up to 2 hours before their appointment at no charge.",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "Clients may cancel up to 24 hours before their appointment at no charge.",
  },
  {
    value: "strict",
    label: "Strict",
    description: "Clients may cancel up to 48 hours before. Late cancellations may incur a fee.",
  },
];

export function SalonOnboardingPoliciesScreen({
  totalSteps,
  currentStep,
  initialPolicy,
  onContinue,
  onBack,
}: SalonOnboardingPoliciesScreenProps) {
  const [selected, setSelected] = useState<CancellationPolicy | null>(initialPolicy ?? null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setError(null);
    if (!selected) {
      setError("Please select a cancellation policy.");
      return;
    }
    setSubmitting(true);
    try {
      await onContinue({ cancellationPolicy: selected });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save policies.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="salon-policies-stepper" />
      <Text style={styles.heading} accessibilityRole="header">Cancellation policy</Text>
      <Text style={styles.body}>
        Choose how far in advance clients must cancel to avoid a charge.
      </Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <View style={styles.chips}>
        {POLICIES.map((p) => {
          const active = selected === p.value;
          return (
            <Pressable
              key={p.value}
              onPress={() => !submitting && setSelected(p.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active, disabled: submitting }}
              style={[styles.chip, active && styles.chipActive]}
              testID={`salon-policies-chip-${p.value}`}
            >
              <View style={styles.chipRow}>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{p.label}</Text>
              </View>
              <Text style={[styles.chipDesc, active && styles.chipDescActive]}>{p.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button
          label="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          disabled={submitting}
          testID="salon-policies-continue"
        />
        {onBack ? (
          <Button label="Back" onPress={onBack} variant="secondary" size="large" disabled={submitting} testID="salon-policies-back" />
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
  chips: { gap: spacing.s3, marginBottom: spacing.s5 },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
  },
  chipActive: { borderColor: colors.primary ?? "#6C63FF" },
  chipRow: { flexDirection: "row", alignItems: "center", gap: spacing.s2, marginBottom: spacing.s1 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: colors.primary ?? "#6C63FF" },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary ?? "#6C63FF",
  },
  chipLabel: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  chipLabelActive: { color: colors.primary ?? "#6C63FF" },
  chipDesc: { fontSize: 13, color: colors.textMuted, marginLeft: 28 },
  chipDescActive: { color: colors.foreground },
  actions: { gap: spacing.s2 },
});
