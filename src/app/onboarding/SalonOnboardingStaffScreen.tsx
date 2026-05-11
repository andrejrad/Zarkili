/**
 * SalonOnboardingStaffScreen.tsx — Salon onboarding step 5/9.
 *
 * Invite staff members by name and email.
 * W37-DEBT-7 closed.
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, Stepper, colors, radius, spacing } from "../../shared/ui";

export type StaffEntry = {
  name: string;
  email: string;
};

export type SalonOnboardingStaffScreenProps = {
  totalSteps: number;
  currentStep: number;
  onContinue: (data: { staff: StaffEntry[] }) => Promise<void>;
  onSkip?: () => void;
  onBack?: () => void;
};

function emptyMember(): StaffEntry {
  return { name: "", email: "" };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SalonOnboardingStaffScreen({
  totalSteps,
  currentStep,
  onContinue,
  onSkip,
  onBack,
}: SalonOnboardingStaffScreenProps) {
  const [members, setMembers] = useState<StaffEntry[]>([emptyMember()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateMember(index: number, field: keyof StaffEntry, value: string) {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function addMember() {
    setMembers((prev) => [...prev, emptyMember()]);
  }

  function removeMember(index: number) {
    if (members.length === 1) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleContinue() {
    setError(null);
    const filled = members.filter((m) => m.name.trim() || m.email.trim());
    if (filled.length === 0) {
      // Allowed to have no staff initially — treat as skip.
      if (onSkip) { onSkip(); return; }
    }
    for (const m of filled) {
      if (!m.name.trim()) { setError("Each staff member needs a name."); return; }
      if (m.email && !EMAIL_RE.test(m.email)) {
        setError(`"${m.email}" is not a valid email address.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await onContinue({ staff: filled });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save staff.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="salon-staff-stepper" />
      <Text style={styles.heading} accessibilityRole="header">Your team</Text>
      <Text style={styles.body}>
        Add the staff who will be available for bookings. You can invite more after launch.
      </Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      {members.map((m, i) => (
        <View key={i} style={styles.memberCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Team member {i + 1}</Text>
            {members.length > 1 ? (
              <Pressable
                onPress={() => removeMember(i)}
                accessibilityRole="button"
                accessibilityLabel={`Remove team member ${i + 1}`}
                testID={`salon-staff-remove-${i}`}
              >
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
          <InputField
            label="Full name *"
            value={m.name}
            onChangeText={(v) => updateMember(i, "name", v)}
            placeholder="e.g. Maria Santos"
            autoCapitalize="words"
            disabled={submitting}
            testID={`salon-staff-name-${i}`}
          />
          <InputField
            label="Email (optional)"
            value={m.email}
            onChangeText={(v) => updateMember(i, "email", v)}
            placeholder="staff@salon.com"
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={submitting}
            testID={`salon-staff-email-${i}`}
          />
        </View>
      ))}

      <Pressable
        onPress={addMember}
        style={styles.addBtn}
        accessibilityRole="button"
        accessibilityLabel="Add another team member"
        testID="salon-staff-add"
      >
        <Text style={styles.addBtnText}>+ Add team member</Text>
      </Pressable>

      <View style={styles.actions}>
        <Button
          label="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          disabled={submitting}
          testID="salon-staff-continue"
        />
        {onSkip ? (
          <Button label="Skip for now" onPress={onSkip} variant="ghost" size="large" disabled={submitting} testID="salon-staff-skip" />
        ) : null}
        {onBack ? (
          <Button label="Back" onPress={onBack} variant="secondary" size="large" disabled={submitting} testID="salon-staff-back" />
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
  memberCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    marginBottom: spacing.s3,
    gap: spacing.s3,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  removeText: { fontSize: 13, color: colors.error ?? "#F44336" },
  addBtn: {
    alignItems: "center",
    paddingVertical: spacing.s3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    marginBottom: spacing.s4,
  },
  addBtnText: { fontSize: 14, color: colors.textMuted },
  actions: { gap: spacing.s2 },
});
