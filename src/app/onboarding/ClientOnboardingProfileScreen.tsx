/**
 * ClientOnboardingProfileScreen.tsx — A.7.1.
 *
 * Display name + optional pronouns chips. Avatar upload is presented as a
 * stub (file pickers are platform-specific and out-of-scope for W21).
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, Stepper, colors, radius, spacing } from "../../shared/ui";

export type Pronouns = "she/her" | "he/him" | "they/them" | "prefer-not-to-say";

export type ClientOnboardingProfileScreenProps = {
  totalSteps: number;
  currentStep: number;
  onContinue: (input: { displayName: string; pronouns: Pronouns | null }) => Promise<void>;
  onSkip?: () => void;
};

const PRONOUN_OPTIONS: { value: Pronouns; label: string }[] = [
  { value: "she/her", label: "She/Her" },
  { value: "he/him", label: "He/Him" },
  { value: "they/them", label: "They/Them" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

export function ClientOnboardingProfileScreen({
  totalSteps,
  currentStep,
  onContinue,
  onSkip,
}: ClientOnboardingProfileScreenProps) {
  const [displayName, setDisplayName] = useState("");
  const [pronouns, setPronouns] = useState<Pronouns | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setError(null);
    if (displayName.trim().length === 0) {
      setError("Please enter a display name.");
      return;
    }
    setSubmitting(true);
    try {
      await onContinue({ displayName: displayName.trim(), pronouns });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="profile-stepper" />
      <Text style={styles.heading} accessibilityRole="header">
        About you
      </Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarPlus}>+</Text>
        </View>
        <Text style={styles.avatarLabel}>Add a photo (optional)</Text>
      </View>

      <View style={styles.formCard}>
        <InputField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="What should we call you?"
          disabled={submitting}
          testID="profile-display-name"
        />
      </View>

      <Text style={styles.subLabel}>Pronouns (optional)</Text>
      <View style={styles.chipRow} accessibilityRole="radiogroup">
        {PRONOUN_OPTIONS.map((opt) => {
          const selected = pronouns === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setPronouns(selected ? null : opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={opt.label}
              style={[styles.chip, selected && styles.chipSelected]}
              testID={`profile-pronouns-${opt.value}`}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        {onSkip ? (
          <Button variant="secondary" label="Skip" onPress={onSkip} testID="profile-skip" />
        ) : null}
        <View style={{ flex: 1 }}>
          <Button
            label="Continue"
            onPress={handleContinue}
            loading={submitting}
            fullWidth
            testID="profile-continue"
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
    marginVertical: spacing.s4,
  },
  bannerWrap: { marginBottom: spacing.s2 },
  avatarWrap: { alignItems: "center", marginVertical: spacing.s4 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    backgroundColor: colors.warmOat,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlus: { fontSize: 32, lineHeight: 32, color: colors.white, fontWeight: "600" },
  avatarLabel: { fontSize: 12, lineHeight: 16, color: colors.textMuted, marginTop: spacing.s2 },
  subLabel: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.foreground },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  chip: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 36,
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, lineHeight: 20, color: colors.foreground },
  chipTextSelected: { color: colors.white, fontWeight: "500" },
  footerRow: {
    flexDirection: "row",
    gap: spacing.s3,
    marginTop: spacing.s6,
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
