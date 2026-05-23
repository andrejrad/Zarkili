/**
 * SocialSignInSelectorScreen.tsx — A.3.
 *
 * Provider buttons (Apple, Google, Facebook) + fallback to email/phone sign-in.
 * Apple button is required to follow Apple HIG on iOS — the prop can be
 * disabled by callers when running on Android to honor platform conventions.
 */

import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";

import type { SocialProvider } from "../../domains/auth";
import { Banner, Button, colors, spacing } from "../../shared/ui";

// Required on Android: closes the custom tab after the OAuth redirect fires.
WebBrowser.maybeCompleteAuthSession();

export type { SocialProvider };

export type SocialSignInSelectorScreenProps = {
  /** Async sign-in handler per provider. */
  onProvider: (provider: SocialProvider) => Promise<void>;
  onUseEmailInstead?: () => void;
  onClose?: () => void;
  showApple?: boolean;
};

const PROVIDER_LABELS: Record<SocialProvider, string> = {
  apple: "Continue with Apple",
  google: "Continue with Google",
  facebook: "Continue with Facebook",
};

export function SocialSignInSelectorScreen({
  onProvider,
  onUseEmailInstead,
  onClose,
  showApple = true,
}: SocialSignInSelectorScreenProps) {
  const [loading, setLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePress(provider: SocialProvider) {
    setError(null);
    setLoading(provider);
    try {
      await onProvider(provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not continue with ${provider}.`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.heading} accessibilityRole="header">
          Continue with
        </Text>
        {onClose ? (
          <Button
            variant="iconOnly"
            accessibilityLabel="Close"
            leftIcon={<Text style={styles.closeText}>✕</Text>}
            onPress={onClose}
          />
        ) : null}
      </View>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      {showApple ? (
        <View style={styles.providerWrap}>
          <Button
            label={PROVIDER_LABELS.apple}
            onPress={() => handlePress("apple")}
            loading={loading === "apple"}
            fullWidth
            accessibilityLabel="Continue with Apple"
            testID="social-apple"
          />
        </View>
      ) : null}

      <View style={styles.providerWrap}>
        <Button
          label={PROVIDER_LABELS.google}
          variant="secondary"
          onPress={() => handlePress("google")}
          loading={loading === "google"}
          fullWidth
          accessibilityLabel="Continue with Google"
          testID="social-google"
        />
      </View>

      <View style={styles.providerWrap}>
        <Button
          label={PROVIDER_LABELS.facebook}
          variant="secondary"
          onPress={() => handlePress("facebook")}
          loading={loading === "facebook"}
          fullWidth
          accessibilityLabel="Continue with Facebook"
          testID="social-facebook"
        />
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Button
        label="Use email or phone instead"
        variant="tertiary"
        onPress={onUseEmailInstead}
        fullWidth
        testID="social-fallback"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.s4,
  },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: "600", color: colors.foreground },
  closeText: { fontSize: 18, lineHeight: 18, color: colors.foreground },
  bannerWrap: { marginBottom: spacing.s2 },
  providerWrap: { marginBottom: spacing.s2 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    marginVertical: spacing.s3,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
});
