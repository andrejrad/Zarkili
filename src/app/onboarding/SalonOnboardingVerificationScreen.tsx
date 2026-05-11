/**
 * SalonOnboardingVerificationScreen.tsx — Salon onboarding step 9/9.
 *
 * Specify document type for salon identity/business verification and
 * confirm submission intent.  Actual document upload is handled by
 * the backend / Stripe Identity flow; this screen captures intent and
 * the confirmed document type.
 * W37-DEBT-7 closed.
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, Stepper, colors, radius, spacing } from "../../shared/ui";

export type DocumentType =
  | "business-license"
  | "passport"
  | "national-id"
  | "tax-certificate"
  | "utility-bill";

export type SalonOnboardingVerificationScreenProps = {
  totalSteps: number;
  currentStep: number;
  onContinue: (data: { documentType: DocumentType; confirmed: boolean }) => Promise<void>;
  onBack?: () => void;
};

const DOCUMENT_TYPES: { value: DocumentType; label: string; description: string }[] = [
  {
    value: "business-license",
    label: "Business license",
    description: "Official registration or trading licence issued by your local authority.",
  },
  {
    value: "passport",
    label: "Passport",
    description: "A valid government-issued passport for the account holder.",
  },
  {
    value: "national-id",
    label: "National ID card",
    description: "Government-issued national identity card.",
  },
  {
    value: "tax-certificate",
    label: "Tax certificate",
    description: "VAT or tax registration certificate.",
  },
  {
    value: "utility-bill",
    label: "Utility bill",
    description: "Recent utility bill (less than 3 months old) showing business address.",
  },
];

export function SalonOnboardingVerificationScreen({
  totalSteps,
  currentStep,
  onContinue,
  onBack,
}: SalonOnboardingVerificationScreenProps) {
  const [docType, setDocType] = useState<DocumentType | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setError(null);
    if (!docType) {
      setError("Please select a document type to submit.");
      return;
    }
    if (!confirmed) {
      setError("Confirm that you will provide the document before going live.");
      return;
    }
    setSubmitting(true);
    try {
      await onContinue({ documentType: docType, confirmed: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save verification intent.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="salon-verification-stepper" />
      <Text style={styles.heading} accessibilityRole="header">Verification documents</Text>
      <Text style={styles.body}>
        Zarkili requires identity or business verification before your salon can go live.
        Choose the document type you will provide.
      </Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Document type *</Text>
      <View style={styles.chips}>
        {DOCUMENT_TYPES.map((d) => {
          const active = docType === d.value;
          return (
            <Pressable
              key={d.value}
              onPress={() => !submitting && setDocType(d.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active, disabled: submitting }}
              style={[styles.chip, active && styles.chipActive]}
              testID={`salon-verification-chip-${d.value}`}
            >
              <View style={styles.chipRow}>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{d.label}</Text>
              </View>
              <Text style={[styles.chipDesc, active && styles.chipDescActive]}>{d.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => !submitting && setConfirmed((v) => !v)}
        style={styles.confirmRow}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: confirmed, disabled: submitting }}
        testID="salon-verification-confirm"
      >
        <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
          {confirmed ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={styles.confirmText}>
          I understand that I will need to provide this document before my salon can go live.
        </Text>
      </Pressable>

      <View style={styles.actions}>
        <Button
          label="Submit and finish"
          onPress={handleContinue}
          variant="primary"
          size="large"
          disabled={submitting}
          testID="salon-verification-continue"
        />
        {onBack ? (
          <Button label="Back" onPress={onBack} variant="secondary" size="large" disabled={submitting} testID="salon-verification-back" />
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
  sectionLabel: { fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: spacing.s2 },
  chips: { gap: spacing.s2, marginBottom: spacing.s4 },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s3,
  },
  chipActive: { borderColor: colors.primary ?? "#6C63FF" },
  chipRow: { flexDirection: "row", alignItems: "center", gap: spacing.s2, marginBottom: 4 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: colors.primary ?? "#6C63FF" },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary ?? "#6C63FF",
  },
  chipLabel: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  chipLabelActive: { color: colors.primary ?? "#6C63FF" },
  chipDesc: { fontSize: 12, color: colors.textMuted, marginLeft: 26 },
  chipDescActive: { color: colors.foreground },
  confirmRow: {
    flexDirection: "row",
    gap: spacing.s3,
    padding: spacing.s3,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s4,
    alignItems: "flex-start",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.primary ?? "#6C63FF", borderColor: colors.primary ?? "#6C63FF" },
  checkmark: { fontSize: 13, color: "#fff", fontWeight: "700" },
  confirmText: { flex: 1, fontSize: 14, color: colors.foreground },
  actions: { gap: spacing.s2 },
});
