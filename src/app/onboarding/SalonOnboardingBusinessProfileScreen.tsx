/**
 * SalonOnboardingBusinessProfileScreen.tsx — Salon onboarding step 2/9.
 *
 * Collects legal name, brand name, address and primary contact details.
 * W37-DEBT-7 closed.
 */

import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, Stepper, colors, spacing } from "../../shared/ui";

export type BusinessProfileData = {
  legalName: string;
  brandName: string;
  addressLine1: string;
  city: string;
  country: string;
  postCode: string;
};

export type SalonOnboardingBusinessProfileScreenProps = {
  totalSteps: number;
  currentStep: number;
  initial?: Partial<BusinessProfileData>;
  onContinue: (data: BusinessProfileData) => Promise<void>;
  onBack?: () => void;
};

export function SalonOnboardingBusinessProfileScreen({
  totalSteps,
  currentStep,
  initial = {},
  onContinue,
  onBack,
}: SalonOnboardingBusinessProfileScreenProps) {
  const [legalName, setLegalName] = useState(initial.legalName ?? "");
  const [brandName, setBrandName] = useState(initial.brandName ?? "");
  const [addressLine1, setAddressLine1] = useState(initial.addressLine1 ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [country, setCountry] = useState(initial.country ?? "");
  const [postCode, setPostCode] = useState(initial.postCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setError(null);
    if (!legalName.trim()) { setError("Legal name is required."); return; }
    if (!addressLine1.trim()) { setError("Address is required."); return; }
    if (!city.trim()) { setError("City is required."); return; }
    if (!country.trim()) { setError("Country is required."); return; }
    setSubmitting(true);
    try {
      await onContinue({
        legalName: legalName.trim(),
        brandName: brandName.trim() || legalName.trim(),
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        country: country.trim(),
        postCode: postCode.trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save business profile.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="salon-bizprofile-stepper" />
      <Text style={styles.heading} accessibilityRole="header">Business Profile</Text>
      <Text style={styles.body}>{"Add the salon's business name, brand name, address and primary contact details."}</Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <View style={styles.form}>
        <InputField
          label="Legal business name *"
          value={legalName}
          onChangeText={setLegalName}
          placeholder="Registered legal name"
          disabled={submitting}
          testID="salon-bizprofile-legal-name"
        />
        <InputField
          label="Brand / trading name (optional)"
          value={brandName}
          onChangeText={setBrandName}
          placeholder="Name customers will see"
          disabled={submitting}
          testID="salon-bizprofile-brand-name"
        />
        <InputField
          label="Address line 1 *"
          value={addressLine1}
          onChangeText={setAddressLine1}
          placeholder="Street address"
          disabled={submitting}
          testID="salon-bizprofile-address"
        />
        <InputField
          label="City *"
          value={city}
          onChangeText={setCity}
          placeholder="City"
          disabled={submitting}
          testID="salon-bizprofile-city"
        />
        <InputField
          label="Post / ZIP code"
          value={postCode}
          onChangeText={setPostCode}
          placeholder="Postal code"
          disabled={submitting}
          testID="salon-bizprofile-postcode"
        />
        <InputField
          label="Country *"
          value={country}
          onChangeText={setCountry}
          placeholder="Country"
          disabled={submitting}
          testID="salon-bizprofile-country"
        />
      </View>

      <View style={styles.actions}>
        <Button
          label="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          disabled={submitting}
          testID="salon-bizprofile-continue"
        />
        {onBack ? (
          <Button label="Back" onPress={onBack} variant="secondary" size="large" disabled={submitting} testID="salon-bizprofile-back" />
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
  form: { gap: spacing.s3, marginBottom: spacing.s5 },
  actions: { gap: spacing.s2 },
});
