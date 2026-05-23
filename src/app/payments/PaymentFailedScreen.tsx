/**
 * PaymentFailedScreen.tsx — J.4 3DS / Payment Failed / Retry (W30 Batch J).
 *
 * J.4.1 ThreeDsScreen    — thin wrapper that mounts <ThreeDsOverlay> at full-
 *                           screen level. The overlay is exported from shared/ui;
 *                           this file just supplies an app-level container with
 *                           back-button semantics when the user dismisses.
 *
 * J.4.2 PaymentFailedScreen — "Payment didn't go through" screen with reason
 *                              body and three action buttons:
 *                                - Retry payment
 *                                - Use another method
 *                                - Contact support
 *
 * Both are exported from this file.
 *
 * States for PaymentFailedScreen:
 *   declined | insufficient-funds | network | error
 */

import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Button,
  ThreeDsOverlay,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import type { ThreeDsState } from "../../shared/ui";

// ---------------------------------------------------------------------------
// J.4.1 — 3DS wrapper screen
// ---------------------------------------------------------------------------

export type ThreeDsScreenProps = {
  state?: ThreeDsState;
  declineReason?: string;
  onCancel: () => void;
  onRetry?: () => void;
  testID?: string;
};

export function ThreeDsScreen({
  state = "pending",
  declineReason,
  onCancel,
  onRetry,
  testID,
}: ThreeDsScreenProps) {
  // The overlay is always visible when this screen is mounted
  return (
    <View style={styles.root} testID={testID}>
      <ThreeDsOverlay
        visible
        state={state}
        declineReason={declineReason}
        onCancel={onCancel}
        onRetry={onRetry}
        testID={testID ? `${testID}-overlay` : undefined}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// J.4.2 — Payment failed
// ---------------------------------------------------------------------------

export type PaymentFailedReason =
  | "declined"
  | "insufficient-funds"
  | "network"
  | "error";

const REASON_MESSAGES: Record<PaymentFailedReason, string> = {
  declined:            "Your card issuer declined this payment. Please try a different card or contact your bank.",
  "insufficient-funds":"Your card has insufficient funds for this transaction.",
  network:             "We couldn't connect to your payment provider. Check your internet connection and try again.",
  error:               "Something went wrong processing your payment. Please try again.",
};

export type PaymentFailedScreenProps = {
  reason?: PaymentFailedReason;
  onRetry: () => void;
  onUseAnotherMethod: () => void;
  onContactSupport: () => void;
  testID?: string;
};

export function PaymentFailedScreen({
  reason = "error",
  onRetry,
  onUseAnotherMethod,
  onContactSupport,
  testID,
}: PaymentFailedScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      testID={testID}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>💳</Text>
      </View>

      <Text style={styles.heading}>{"Payment didn't go through"}</Text>

      <View
        style={styles.reasonBox}
        testID={testID ? `${testID}-reason` : undefined}
      >
        <Text style={styles.reasonText}>{REASON_MESSAGES[reason]}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Retry payment"
          variant="primary"
          onPress={onRetry}
          testID={testID ? `${testID}-retry` : undefined}
        />
        <Button
          label="Use another method"
          variant="secondary"
          onPress={onUseAnotherMethod}
          testID={testID ? `${testID}-use-other` : undefined}
        />
        <Button
          label="Contact support"
          variant="tertiary"
          onPress={onContactSupport}
          testID={testID ? `${testID}-contact` : undefined}
        />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.pageVertical,
    backgroundColor: colors.background,
    gap: spacing.s4,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: "rgba(244,67,54,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 36,
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.foreground,
    textAlign: "center",
  },
  reasonBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.s4,
    width: "100%",
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  reasonText: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  actions: {
    width: "100%",
    gap: spacing.s3,
  },
});
