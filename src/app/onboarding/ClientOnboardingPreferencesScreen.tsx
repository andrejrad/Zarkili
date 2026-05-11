/**
 * ClientOnboardingPreferencesScreen.tsx — A.7.2.
 *
 * Multi-select category pills. Min 1 to continue.
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, Stepper, colors, radius, spacing } from "../../shared/ui";

export type ServiceCategory =
  | "nails"
  | "hair"
  | "skin"
  | "lashes"
  | "brows"
  | "massage"
  | "makeup"
  | "barber"
  | "waxing"
  | "spa";

export type ClientOnboardingPreferencesScreenProps = {
  totalSteps: number;
  currentStep: number;
  onContinue: (categories: ServiceCategory[]) => Promise<void>;
  onSkip?: () => void;
};

const CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: "nails", label: "Nails" },
  { value: "hair", label: "Hair" },
  { value: "skin", label: "Skin" },
  { value: "lashes", label: "Lashes" },
  { value: "brows", label: "Brows" },
  { value: "massage", label: "Massage" },
  { value: "makeup", label: "Makeup" },
  { value: "barber", label: "Barber" },
  { value: "waxing", label: "Waxing" },
  { value: "spa", label: "Spa" },
];

export function ClientOnboardingPreferencesScreen({
  totalSteps,
  currentStep,
  onContinue,
  onSkip,
}: ClientOnboardingPreferencesScreenProps) {
  const [selected, setSelected] = useState<Set<ServiceCategory>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggle(c: ServiceCategory) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(c)) {
        next.delete(c);
      } else {
        next.add(c);
      }
      return next;
    });
  }

  async function handleContinue() {
    setError(null);
    if (selected.size === 0) {
      setError("Pick at least one category.");
      return;
    }
    setSubmitting(true);
    try {
      await onContinue(Array.from(selected));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save preferences.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="prefs-stepper" />
      <Text style={styles.heading} accessibilityRole="header">
        What are you into?
      </Text>
      <Text style={styles.body}>Pick all that apply. You can change this later.</Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <View style={styles.grid}>
        {CATEGORIES.map((c) => {
          const isSelected = selected.has(c.value);
          return (
            <Pressable
              key={c.value}
              onPress={() => toggle(c.value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={c.label}
              style={[styles.pill, isSelected && styles.pillSelected]}
              testID={`prefs-${c.value}`}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        {onSkip ? (
          <Button variant="secondary" label="Skip" onPress={onSkip} testID="prefs-skip" />
        ) : null}
        <View style={{ flex: 1 }}>
          <Button
            label="Continue"
            onPress={handleContinue}
            loading={submitting}
            fullWidth
            testID="prefs-continue"
          />
        </View>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  pill: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 44,
    justifyContent: "center",
  },
  pillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 14, lineHeight: 20, color: colors.foreground },
  pillTextSelected: { color: colors.white, fontWeight: "500" },
  footerRow: { flexDirection: "row", gap: spacing.s3, marginTop: spacing.s6 },
});
