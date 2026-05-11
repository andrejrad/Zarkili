/**
 * ClientOnboardingLocationScreen.tsx — A.7.4.
 *
 * Location permission CTA + 5-digit ZIP fallback.
 */

import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, Stepper, colors, radius, spacing } from "../../shared/ui";
import { normalizeUsZip } from "../../shared/ui/formatters";

export type LocationResult =
  | { kind: "device"; coords: { lat: number; lng: number } }
  | { kind: "zip"; zip: string };

export type ClientOnboardingLocationScreenProps = {
  totalSteps: number;
  currentStep: number;
  /** Triggers the system permission prompt and resolves with coords. */
  onUseMyLocation: () => Promise<{ lat: number; lng: number }>;
  onContinue: (result: LocationResult) => Promise<void>;
  onSkip?: () => void;
};

export function ClientOnboardingLocationScreen({
  totalSteps,
  currentStep,
  onUseMyLocation,
  onContinue,
  onSkip,
}: ClientOnboardingLocationScreenProps) {
  const [zip, setZip] = useState("");
  const [zipError, setZipError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [resolvingDevice, setResolvingDevice] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleUseDevice() {
    setError(null);
    setPermissionDenied(false);
    setResolvingDevice(true);
    try {
      const coords = await onUseMyLocation();
      await onContinue({ kind: "device", coords });
    } catch (e) {
      setPermissionDenied(true);
      setError(e instanceof Error ? e.message : "Location permission denied.");
    } finally {
      setResolvingDevice(false);
    }
  }

  async function handleZipSubmit() {
    setError(null);
    const normalized = normalizeUsZip(zip);
    if (!normalized) {
      setZipError("Please enter a 5-digit ZIP code.");
      return;
    }
    setZipError(null);
    setSubmitting(true);
    try {
      await onContinue({ kind: "zip", zip: normalized });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not set location.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="location-stepper" />
      <Text style={styles.heading} accessibilityRole="header">
        Where are you?
      </Text>
      <Text style={styles.body}>
        We use your location to show nearby salons and accurate booking times.
      </Text>

      {permissionDenied ? (
        <View style={styles.bannerWrap}>
          <Banner
            variant="warning"
            title="Location permission denied"
            message="No problem — enter your ZIP code instead."
          />
        </View>
      ) : null}
      {error && !permissionDenied ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <View style={styles.mapPlaceholder} accessibilityLabel="Map preview">
        <Text style={styles.mapText}>Map preview</Text>
      </View>

      <Button
        label="Use my location"
        onPress={handleUseDevice}
        loading={resolvingDevice}
        fullWidth
        testID="location-device"
      />

      <View style={styles.formCard}>
        <InputField
          label="Or enter ZIP code"
          variant="text"
          value={zip}
          onChangeText={(v) => setZip(v.replace(/\D/g, "").slice(0, 5))}
          placeholder="90210"
          maxLength={5}
          error={zipError ?? undefined}
          disabled={submitting}
          testID="location-zip"
        />
      </View>

      <View style={styles.footerRow}>
        {onSkip ? (
          <Button variant="secondary" label="Skip" onPress={onSkip} testID="location-skip" />
        ) : null}
        <View style={{ flex: 1 }}>
          <Button
            label="Continue with ZIP"
            onPress={handleZipSubmit}
            loading={submitting}
            disabled={zip.length !== 5}
            fullWidth
            testID="location-zip-continue"
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
  mapPlaceholder: {
    height: 160,
    borderRadius: radius.lg,
    backgroundColor: colors.warmOat,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.s3,
  },
  mapText: { color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  footerRow: { flexDirection: "row", gap: spacing.s3, marginTop: spacing.s4 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.cardPadding,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s5,
    gap: spacing.s4,
  },
});
