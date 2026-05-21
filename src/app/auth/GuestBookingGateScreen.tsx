/**
 * GuestBookingGateScreen.tsx
 *
 * Contextualised sign-up gate shown when a guest user reaches the payment
 * step. Social sign-in (Apple, Google) is the primary path — one tap to
 * continue. Email is the tertiary fallback.
 *
 * After sign-in / account creation the navigator sends the user directly
 * to BookingPayment — never to Home.
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { SocialProvider } from "../../domains/auth";
import { Banner, Button, colors, spacing } from "../../shared/ui";

export type { SocialProvider };

export type GuestBookingGateScreenProps = {
  /** Service name shown in the contextual subtitle, e.g. "Gel manicure". */
  serviceName: string;
  /** Location display name shown in the contextual subtitle, e.g. "Luna Studio". */
  locationName: string;
  /** Async handler for Apple / Google — resolves after sign-in completes. */
  onSocialProvider: (provider: SocialProvider) => Promise<void>;
  /** Navigate to the email sign-up screen. */
  onUseEmail: () => void;
  /** Navigate to the sign-in screen (returning user). */
  onSignIn: () => void;
  /** Go back to the previous booking step. */
  onBack: () => void;
  testID?: string;
};

export function GuestBookingGateScreen({
  serviceName,
  locationName,
  onSocialProvider,
  onUseEmail,
  onSignIn,
  onBack,
  testID,
}: GuestBookingGateScreenProps) {
  const [loading, setLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSocial(provider: SocialProvider) {
    setError(null);
    setLoading(provider);
    try {
      await onSocialProvider(provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not continue with ${provider}.`);
    } finally {
      setLoading(null);
    }
  }

  const isLoading = loading !== null;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      testID={testID}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
          testID={testID ? `${testID}-back` : undefined}
        >
          <Text style={styles.backGlyph}>{"\u2190"}</Text>
        </Pressable>
      </View>

      {/* Context */}
      <View style={styles.heroSection}>
        <Text style={styles.heading} accessibilityRole="header">
          Almost there
        </Text>
        <Text style={styles.subheading}>
          Create your account to confirm your{" "}
          <Text style={styles.emphasis}>{serviceName}</Text>
          {" at "}
          <Text style={styles.emphasis}>{locationName}</Text>
        </Text>
      </View>

      {error ? (
        <View style={styles.bannerWrap} testID={testID ? `${testID}-error` : undefined}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      {/* Primary: Apple */}
      <Button
        label="Continue with Apple"
        onPress={() => handleSocial("apple")}
        loading={loading === "apple"}
        disabled={isLoading}
        fullWidth
        accessibilityLabel="Continue with Apple"
        testID={testID ? `${testID}-apple` : undefined}
      />

      <View style={styles.gap} />

      {/* Secondary: Google */}
      <Button
        label="Continue with Google"
        variant="secondary"
        onPress={() => handleSocial("google")}
        loading={loading === "google"}
        disabled={isLoading}
        fullWidth
        accessibilityLabel="Continue with Google"
        testID={testID ? `${testID}-google` : undefined}
      />

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Tertiary: email sign-up */}
      <Button
        label="Use email instead"
        variant="tertiary"
        onPress={onUseEmail}
        disabled={isLoading}
        fullWidth
        testID={testID ? `${testID}-email` : undefined}
      />

      {/* Already have an account */}
      <View style={styles.signInRow}>
        <Text style={styles.signInLabel}>Already have an account?</Text>
        <Pressable
          onPress={onSignIn}
          accessibilityRole="button"
          disabled={isLoading}
          testID={testID ? `${testID}-signin` : undefined}
        >
          <Text style={styles.signInLink}> Sign in</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageHorizontal, paddingTop: spacing.s2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.s4,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backGlyph: { fontSize: 22, lineHeight: 24, color: colors.foreground },
  heroSection: { marginBottom: spacing.s6 },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: spacing.s2,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  emphasis: {
    color: colors.foreground,
    fontWeight: "500",
  },
  bannerWrap: { marginBottom: spacing.s3 },
  gap: { height: spacing.s2 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    marginVertical: spacing.s4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.s4,
  },
  signInLabel: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  signInLink: { fontSize: 14, lineHeight: 20, color: colors.primary, fontWeight: "500" },
});
