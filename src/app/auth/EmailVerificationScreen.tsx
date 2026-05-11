/**
 * EmailVerificationScreen.tsx — A.5.
 *
 * Waiting / Resent / Verified / Bounce-error states.
 * Resend has 60s cooldown countdown.
 */

import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, colors, spacing } from "../../shared/ui";

export type EmailVerificationStatus = "waiting" | "verified" | "bounced";

export type EmailVerificationScreenProps = {
  email: string;
  status?: EmailVerificationStatus;
  onResend: () => Promise<void>;
  onChangeEmail?: () => void;
  onContinue?: () => void;
  /** Resend cooldown in seconds. Defaults to 60. */
  cooldownSeconds?: number;
};

export function EmailVerificationScreen({
  email,
  status = "waiting",
  onResend,
  onChangeEmail,
  onContinue,
  cooldownSeconds = 60,
}: EmailVerificationScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resending, setResending] = useState(false);
  const [resentBanner, setResentBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  async function handleResend() {
    setError(null);
    setResending(true);
    try {
      await onResend();
      setResentBanner(true);
      setSecondsLeft(cooldownSeconds);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>✉️</Text>
        </View>
      </View>
      <Text style={styles.heading} accessibilityRole="header">
        Verify your email
      </Text>
      <Text style={styles.body}>
        We sent a link to <Text style={styles.bold}>{email}</Text>. Tap it to continue.
      </Text>

      {status === "verified" ? (
        <View style={styles.bannerWrap}>
          <Banner variant="success" message="Email verified! You're all set." />
        </View>
      ) : null}
      {status === "bounced" ? (
        <View style={styles.bannerWrap}>
          <Banner
            variant="error"
            message="We couldn't deliver to that address. Double-check or change email."
          />
        </View>
      ) : null}
      {resentBanner && status === "waiting" ? (
        <View style={styles.bannerWrap}>
          <Banner variant="info" message="Email resent. Please check your inbox." />
        </View>
      ) : null}
      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      {status === "verified" ? (
        <Button label="Continue" onPress={onContinue} fullWidth testID="verify-continue" />
      ) : (
        <>
          <Button
            label={
              secondsLeft > 0 ? `Resend email (${secondsLeft}s)` : "Resend email"
            }
            variant="secondary"
            onPress={handleResend}
            disabled={secondsLeft > 0}
            loading={resending}
            fullWidth
            testID="verify-resend"
          />
          <View style={styles.footerWrap}>
            <Button
              variant="tertiary"
              size="small"
              label="Change email"
              onPress={onChangeEmail}
              testID="verify-change-email"
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3, alignItems: "stretch" },
  iconWrap: { alignItems: "center", marginVertical: spacing.s6 },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    backgroundColor: colors.mintFresh,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlyph: { fontSize: 40 },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
    color: colors.foreground,
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.s4,
  },
  bold: { fontWeight: "600", color: colors.foreground },
  bannerWrap: { marginBottom: spacing.s2 },
  footerWrap: { alignItems: "center", marginTop: spacing.s2 },
});
