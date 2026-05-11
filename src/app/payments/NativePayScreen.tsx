/**
 * NativePayScreen.tsx — J.5 Apple Pay / Google Pay / ACH Sheets (W30 Batch J).
 *
 * Placeholder screens that represent the native payment sheets. On a real
 * device the OS presents the actual Pay sheet; here we render a branded
 * container so the navigator can test the surrounding flow (amount display,
 * status transitions).
 *
 * States: ready | pending | completed | cancelled
 * Methods: apple | google | ach (US ACH bank debit)
 */

import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  Button,
  colors,
  radius,
  spacing,
} from "../../shared/ui";

export type NativePayMethod = "apple" | "google" | "ach";
export type NativePayState = "ready" | "pending" | "completed" | "cancelled";

export type NativePayScreenProps = {
  method: NativePayMethod;
  state?: NativePayState;
  /** Formatted amount string, e.g. "$75.00". */
  amount: string;
  merchantName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
};

const METHOD_META: Record<
  NativePayMethod,
  { label: string; icon: string; brandColor: string }
> = {
  apple:  { label: "Apple Pay",  icon: "🍎", brandColor: "#000000" },
  google: { label: "Google Pay", icon: "G",  brandColor: "#4285F4" },
  ach:    { label: "ACH Bank Debit", icon: "🏦", brandColor: colors.accentForeground },
};

export function NativePayScreen({
  method,
  state = "ready",
  amount,
  merchantName = "Zarkili",
  onConfirm,
  onCancel,
  testID,
}: NativePayScreenProps) {
  const meta = METHOD_META[method];

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.sheet}>
        {/* Brand header */}
        <View style={styles.brandRow}>
          <View style={[styles.brandIcon, { backgroundColor: meta.brandColor }]}>
            <Text style={styles.brandIconText}>{meta.icon}</Text>
          </View>
          <Text style={styles.brandLabel}>{meta.label}</Text>
        </View>

        <Text style={styles.merchant}>Pay {merchantName}</Text>
        <Text style={styles.amount}>{amount}</Text>

        {state === "pending" && (
          <ActivityIndicator
            color={colors.primary}
            size="large"
            testID={testID ? `${testID}-spinner` : undefined}
          />
        )}

        {state === "completed" && (
          <View style={styles.completedRow} testID={testID ? `${testID}-success` : undefined}>
            <Text style={styles.completedIcon}>✓</Text>
            <Text style={styles.completedText}>Payment successful</Text>
          </View>
        )}

        {state === "cancelled" && (
          <Text
            style={styles.cancelledText}
            testID={testID ? `${testID}-cancelled` : undefined}
          >
            Payment cancelled
          </Text>
        )}

        {(state === "ready") && (
          <View style={styles.actions}>
            <Button
              label={`Pay with ${meta.label}`}
              variant="primary"
              onPress={onConfirm}
              testID={testID ? `${testID}-confirm` : undefined}
            />
            <Button
              label="Cancel"
              variant="tertiary"
              onPress={onCancel}
              testID={testID ? `${testID}-cancel` : undefined}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black50,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.pageVertical,
    alignItems: "center",
    gap: spacing.s4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  brandIconText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "700",
  },
  brandLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.foreground,
  },
  merchant: {
    fontSize: 15,
    color: colors.textMuted,
  },
  amount: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.foreground,
  },
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
    backgroundColor: colors.accent,
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.full,
  },
  completedIcon: {
    fontSize: 18,
    color: colors.accentForeground,
    fontWeight: "700",
  },
  completedText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.accentForeground,
  },
  cancelledText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  actions: {
    width: "100%",
    gap: spacing.s3,
  },
});
