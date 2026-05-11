/**
 * OtpVerificationScreen.tsx — A.6 Phone OTP.
 *
 * 6-cell OTP input with paste + auto-advance support, 60s resend cooldown.
 */

import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Banner, Button, colors, radius, spacing } from "../../shared/ui";

export type OtpVerificationScreenProps = {
  /** Pretty-formatted destination, e.g. "(555) 555-1234". */
  destination: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChangeDestination?: () => void;
  /** Resend cooldown in seconds. Defaults to 60. */
  cooldownSeconds?: number;
};

const CELL_COUNT = 6;

export function OtpVerificationScreen({
  destination,
  onVerify,
  onResend,
  onChangeDestination,
  cooldownSeconds = 60,
}: OtpVerificationScreenProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(cooldownSeconds);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  function handleChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, CELL_COUNT);
    setCode(digits);
    setError(null);
  }

  async function handleSubmit() {
    if (code.length !== CELL_COUNT) {
      setError("Enter all 6 digits.");
      return;
    }
    setSubmitting(true);
    try {
      await onVerify(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code didn't match.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setResending(true);
    try {
      await onResend();
      setSecondsLeft(cooldownSeconds);
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading} accessibilityRole="header">
        Enter the 6-digit code
      </Text>
      <Text style={styles.body}>
        Sent to <Text style={styles.bold}>{destination}</Text>.{" "}
        {onChangeDestination ? (
          <Text style={styles.linkText} onPress={onChangeDestination}>
            Change number
          </Text>
        ) : null}
      </Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      {/* Hidden underlying input for paste + native autofill. Cells render visually. */}
      <View style={styles.cellsRow} accessible accessibilityLabel="6-digit verification code">
        {Array.from({ length: CELL_COUNT }, (_, idx) => {
          const digit = code[idx] ?? "";
          const isActive = idx === code.length;
          const hasError = Boolean(error);
          return (
            <View
              key={idx}
              style={[
                styles.cell,
                isActive && !hasError && styles.cellActive,
                hasError && styles.cellError,
              ]}
              accessibilityLabel={`Digit ${idx + 1} of ${CELL_COUNT}`}
              accessibilityValue={{ text: digit || "empty" }}
              testID={`otp-cell-${idx + 1}`}
            >
              <Text style={styles.cellText}>{digit}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={code}
        onChangeText={handleChange}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={CELL_COUNT}
        autoFocus
        testID="otp-input"
        accessibilityLabel="Verification code"
      />

      <Button
        label="Verify"
        onPress={handleSubmit}
        disabled={code.length !== CELL_COUNT}
        loading={submitting}
        fullWidth
        testID="otp-submit"
      />

      <View style={styles.resendWrap}>
        <Button
          variant="tertiary"
          size="small"
          label={secondsLeft > 0 ? `Resend code (${secondsLeft}s)` : "Resend code"}
          disabled={secondsLeft > 0}
          loading={resending}
          onPress={handleResend}
          testID="otp-resend"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  heading: { fontSize: 24, lineHeight: 32, fontWeight: "600", color: colors.foreground },
  body: { fontSize: 12, lineHeight: 16, color: colors.textMuted, marginBottom: spacing.s4 },
  bold: { fontWeight: "600", color: colors.foreground },
  linkText: { color: colors.primary, fontWeight: "500" },
  bannerWrap: { marginBottom: spacing.s2 },
  cellsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.s2,
    marginVertical: spacing.s4,
  },
  cell: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cellActive: { borderWidth: 2, borderColor: colors.primary },
  cellError: { borderWidth: 1.5, borderColor: colors.error },
  cellText: { fontSize: 24, lineHeight: 28, fontWeight: "600", color: colors.foreground },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 1,
    width: 1,
  },
  resendWrap: { alignItems: "center", marginTop: spacing.s2 },
});
