/**
 * AgeGateScreen.tsx — I.5 Age / Region Gate.
 *
 * States:
 *  - "default"   → DOB picker + state picker + Continue CTA
 *  - "blocked"   → Under-13 COPPA-compliant blocked screen
 *  - "error"     → Validation / submission error
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, colors, radius, spacing, textStyles } from "../../shared/ui";

export type AgeGateState = "default" | "blocked" | "error";

export type AgeGateScreenProps = {
  state?: AgeGateState;
  error?: string | null;
  onContinue: (dateOfBirth: string, region: string) => void;
  testID?: string;
};

export function AgeGateScreen({
  state = "default",
  error,
  onContinue,
  testID,
}: AgeGateScreenProps) {
  const [dob, setDob] = useState("");
  const [region, setRegion] = useState("");
  const [dobError, setDobError] = useState<string | null>(null);

  function handleDobChange(value: string) {
    // Auto-insert slashes: MM/DD/YYYY
    const digits = value.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setDob(formatted);
    setDobError(null);
  }

  function handleContinue() {
    if (dob.length < 10) {
      setDobError("Please enter a valid date of birth (MM/DD/YYYY).");
      return;
    }
    onContinue(dob, region);
  }

  if (state === "blocked") {
    return (
      <View style={styles.blocked} testID={testID}>
        <Text style={styles.blockedTitle}>Sorry, you must be 13 or older</Text>
        <Text style={styles.blockedBody}>
          Zarkili is not directed to children under 13. In accordance with the
          {"Children's Online Privacy Protection Act (COPPA), we cannot create an"}
          account for you at this time.
        </Text>
        <Text style={styles.blockedCta} testID={testID ? `${testID}-blocked-msg` : undefined}>
          If you believe this is an error, please contact support.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      <Text style={styles.heading}>Confirm your age</Text>
      <Text style={styles.body}>
        We need to verify your age to comply with applicable laws.
      </Text>

      {(state === "error" || error) ? (
        <Banner
          variant="error"
          message={error ?? "Please check your entries and try again."}
          testID={testID ? `${testID}-error-banner` : undefined}
        />
      ) : null}

      <View style={styles.formCard}>
        <InputField
          label="Date of birth"
          value={dob}
          onChangeText={handleDobChange}
          placeholder="MM/DD/YYYY"
          error={dobError ?? undefined}
          testID={testID ? `${testID}-dob` : undefined}
        />

        <InputField
          label="State / region"
          value={region}
          onChangeText={setRegion}
          placeholder="e.g., California"
          testID={testID ? `${testID}-region` : undefined}
        />
      </View>

      <Button
        label="Continue"
        variant="primary"
        disabled={dob.length < 10}
        onPress={handleContinue}
        testID={testID ? `${testID}-continue` : undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.pageHorizontal,
    paddingBottom: spacing.s12,
    gap: spacing.s4,
  },
  heading: {
    ...textStyles.heading2,
    color: colors.foreground,
  },
  body: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  blocked: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.pageHorizontal,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s5,
  },
  blockedTitle: {
    ...textStyles.heading2,
    color: colors.foreground,
    textAlign: "center",
  },
  blockedBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  blockedCta: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
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
