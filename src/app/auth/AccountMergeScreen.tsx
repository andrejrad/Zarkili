/**
 * AccountMergeScreen.tsx — A.8 Guest → Full upgrade / merge.
 *
 * Surfaced when a guest user wants to persist their booking and either
 * sign in to an existing account (merge) or create a new one (upgrade).
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, colors, radius, spacing } from "../../shared/ui";

export type AccountMergeChoice = "signIn" | "createAccount";

export type AccountMergeScreenProps = {
  bookingCount: number;
  loyaltyPoints?: number;
  /** When true, displays "email already exists, sign in to merge" warning. */
  emailExists?: boolean;
  onChoose: (choice: AccountMergeChoice) => Promise<void>;
};

export function AccountMergeScreen({
  bookingCount,
  loyaltyPoints,
  emailExists = false,
  onChoose,
}: AccountMergeScreenProps) {
  const [submitting, setSubmitting] = useState<AccountMergeChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [merged, setMerged] = useState(false);

  async function handleChoose(choice: AccountMergeChoice) {
    setError(null);
    setSubmitting(choice);
    try {
      await onChoose(choice);
      setMerged(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not link account.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading} accessibilityRole="header">
        Save your bookings
      </Text>
      <Text style={styles.body}>
        You have {bookingCount} {bookingCount === 1 ? "booking" : "bookings"}
        {typeof loyaltyPoints === "number" ? ` and ${loyaltyPoints} loyalty points` : ""}{" "}
        we can carry over to your account.
      </Text>

      {emailExists ? (
        <View style={styles.bannerWrap}>
          <Banner
            variant="warning"
            message="This email is already registered. Sign in to merge your bookings."
          />
        </View>
      ) : null}
      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}
      {merged ? (
        <View style={styles.bannerWrap}>
          <Banner variant="success" message="Bookings linked to your account." />
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.choiceCard, pressed && styles.choiceCardPressed]}
        onPress={() => handleChoose("signIn")}
        accessibilityRole="button"
        accessibilityLabel="Sign in to existing account"
        disabled={submitting !== null || merged}
        testID="merge-signin"
      >
        <Text style={styles.choiceTitle}>Sign in (existing account)</Text>
        <Text style={styles.choiceSubtitle}>
          {"Best when you've used Zarkili before."}
        </Text>
        {submitting === "signIn" ? (
          <Text style={styles.loadingText}>Linking…</Text>
        ) : null}
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.choiceCard, pressed && styles.choiceCardPressed]}
        onPress={() => handleChoose("createAccount")}
        accessibilityRole="button"
        accessibilityLabel="Create new account"
        disabled={submitting !== null || merged || emailExists}
        testID="merge-create"
      >
        <Text style={styles.choiceTitle}>Create new account</Text>
        <Text style={styles.choiceSubtitle}>
          Quick sign-up with email or phone.
        </Text>
        {submitting === "createAccount" ? (
          <Text style={styles.loadingText}>Creating…</Text>
        ) : null}
      </Pressable>

      <View style={styles.footerWrap}>
        <Button
          variant="tertiary"
          size="small"
          label="Continue as guest"
          onPress={() => undefined}
          testID="merge-skip"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  heading: { fontSize: 24, lineHeight: 32, fontWeight: "600", color: colors.foreground },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: spacing.s4,
  },
  bannerWrap: { marginBottom: spacing.s2 },
  choiceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s5,
    marginBottom: spacing.s3,
  },
  choiceCardPressed: { backgroundColor: colors.hover },
  choiceTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: spacing.s1,
  },
  choiceSubtitle: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  loadingText: {
    marginTop: spacing.s2,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  footerWrap: { alignItems: "center", marginTop: spacing.s4 },
});
