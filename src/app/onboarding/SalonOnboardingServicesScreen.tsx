/**
 * SalonOnboardingServicesScreen.tsx — Salon onboarding step 4/9.
 *
 * Add at least one bookable service with name, duration and price.
 * Services are stored locally and submitted on continue.
 * W37-DEBT-7 closed.
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, Stepper, colors, radius, spacing } from "../../shared/ui";

export type ServiceEntry = {
  name: string;
  durationMinutes: number;
  priceCents: number;
};

export type SalonOnboardingServicesScreenProps = {
  totalSteps: number;
  currentStep: number;
  onContinue: (data: { services: ServiceEntry[] }) => Promise<void>;
  onBack?: () => void;
};

function emptyService(): ServiceEntry {
  return { name: "", durationMinutes: 60, priceCents: 0 };
}

export function SalonOnboardingServicesScreen({
  totalSteps,
  currentStep,
  onContinue,
  onBack,
}: SalonOnboardingServicesScreenProps) {
  const [services, setServices] = useState<ServiceEntry[]>([emptyService()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateService(index: number, field: keyof ServiceEntry, raw: string) {
    setServices((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        if (field === "name") return { ...s, name: raw };
        const num = parseInt(raw, 10);
        if (field === "durationMinutes") return { ...s, durationMinutes: isNaN(num) ? 0 : num };
        if (field === "priceCents") return { ...s, priceCents: isNaN(num) ? 0 : Math.round(num * 100) };
        return s;
      }),
    );
  }

  function addService() {
    setServices((prev) => [...prev, emptyService()]);
  }

  function removeService(index: number) {
    if (services.length === 1) return;
    setServices((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleContinue() {
    setError(null);
    const valid = services.filter((s) => s.name.trim().length > 0);
    if (valid.length === 0) {
      setError("Add at least one service with a name.");
      return;
    }
    for (const s of valid) {
      if (s.durationMinutes <= 0) {
        setError(`Duration for "${s.name}" must be greater than 0.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await onContinue({ services: valid });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save services.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="salon-services-stepper" />
      <Text style={styles.heading} accessibilityRole="header">Services</Text>
      <Text style={styles.body}>Publish at least one bookable service with duration and price.</Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      {services.map((svc, i) => (
        <View key={i} style={styles.serviceCard}>
          <View style={styles.serviceCardHeader}>
            <Text style={styles.serviceCardTitle}>Service {i + 1}</Text>
            {services.length > 1 ? (
              <Pressable
                onPress={() => removeService(i)}
                accessibilityRole="button"
                accessibilityLabel={`Remove service ${i + 1}`}
                testID={`salon-services-remove-${i}`}
              >
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
          <InputField
            label="Service name *"
            value={svc.name}
            onChangeText={(v) => updateService(i, "name", v)}
            placeholder="e.g. Classic Manicure"
            disabled={submitting}
            testID={`salon-services-name-${i}`}
          />
          <View style={styles.row}>
            <View style={styles.halfField}>
              <InputField
                label="Duration (min) *"
                value={svc.durationMinutes > 0 ? String(svc.durationMinutes) : ""}
                onChangeText={(v) => updateService(i, "durationMinutes", v)}
                placeholder="60"
                keyboardType="number-pad"
                disabled={submitting}
                testID={`salon-services-duration-${i}`}
              />
            </View>
            <View style={styles.halfField}>
              <InputField
                label="Price (USD)"
                value={svc.priceCents > 0 ? String(svc.priceCents / 100) : ""}
                onChangeText={(v) => updateService(i, "priceCents", v)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                disabled={submitting}
                testID={`salon-services-price-${i}`}
              />
            </View>
          </View>
        </View>
      ))}

      <Pressable
        onPress={addService}
        style={styles.addBtn}
        accessibilityRole="button"
        accessibilityLabel="Add another service"
        testID="salon-services-add"
      >
        <Text style={styles.addBtnText}>+ Add another service</Text>
      </Pressable>

      <View style={styles.actions}>
        <Button
          label="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          disabled={submitting}
          testID="salon-services-continue"
        />
        {onBack ? (
          <Button label="Back" onPress={onBack} variant="secondary" size="large" disabled={submitting} testID="salon-services-back" />
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
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    marginBottom: spacing.s3,
    gap: spacing.s3,
  },
  serviceCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  serviceCardTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  removeText: { fontSize: 13, color: colors.error ?? "#F44336" },
  row: { flexDirection: "row", gap: spacing.s3 },
  halfField: { flex: 1 },
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
