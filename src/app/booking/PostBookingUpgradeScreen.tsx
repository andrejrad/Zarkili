/**
 * PostBookingUpgradeScreen.tsx — C.11 Post-booking upgrade prompt.
 *
 * Modal sheet shown after a guest booking finishes, offering to create an
 * account so they can manage their booking. Caller controls visibility.
 */

import { StyleSheet, Text, View } from "react-native";

import { Button, ModalSheet, colors, spacing } from "../../shared/ui";

export type PostBookingUpgradeScreenProps = {
  visible: boolean;
  /** Pre-fill email shown next to the offer. */
  email?: string;
  loading?: boolean;
  errorMessage?: string;
  onPressCreateAccount: () => void;
  onPressDismiss: () => void;
  testID?: string;
};

const BENEFITS = [
  "Track and manage your bookings",
  "Save favorite salons and stylists",
  "Faster checkout next time",
] as const;

export function PostBookingUpgradeScreen({
  visible,
  email,
  loading,
  errorMessage,
  onPressCreateAccount,
  onPressDismiss,
  testID,
}: PostBookingUpgradeScreenProps) {
  return (
    <ModalSheet
      visible={visible}
      onClose={onPressDismiss}
      title="Create your account?"
      testID={testID}
      footer={
        <View>
          <Button
            label="Create account"
            onPress={onPressCreateAccount}
            fullWidth
            loading={loading}
            disabled={loading}
            testID={testID ? `${testID}-create` : undefined}
          />
          <View style={{ height: spacing.s2 }} />
          <Button
            label="Not now"
            variant="secondary"
            onPress={onPressDismiss}
            fullWidth
            disabled={loading}
            testID={testID ? `${testID}-dismiss` : undefined}
          />
        </View>
      }
    >
      <View style={styles.body}>
        {email ? (
          <Text style={styles.email} testID={testID ? `${testID}-email` : undefined}>
            We'll use {email}
          </Text>
        ) : null}
        <Text style={styles.lead}>
          Save your booking and unlock faster checkout next time.
        </Text>
        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefitRow}>
              <Text style={styles.bullet}>{"\u2713"}</Text>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
        {errorMessage ? (
          <Text style={styles.error} testID={testID ? `${testID}-error` : undefined}>
            {errorMessage}
          </Text>
        ) : null}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.pageHorizontal, gap: spacing.s3 },
  email: { fontSize: 12, color: colors.textMuted },
  lead: { fontSize: 14, lineHeight: 20, color: colors.foreground },
  benefits: { gap: spacing.s2, marginTop: spacing.s2 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: spacing.s2 },
  bullet: { color: colors.accentForeground, fontSize: 16, fontWeight: "700" },
  benefitText: { fontSize: 14, color: colors.foreground },
  error: { color: colors.error, fontSize: 12 },
});
