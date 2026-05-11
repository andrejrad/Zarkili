/**
 * FeeDisclosureSheet.tsx — J.3 Deposits + Fee Disclosures (W30 Batch J).
 *
 * A ModalSheet that presents one of four fee disclosure types:
 *   - deposit         : payment amount + refund policy text
 *   - cancellation    : cancellation fee + cutoff window
 *   - reschedule      : reschedule fee amount
 *   - noShow          : no-show fee (requires explicit acknowledgement checkbox)
 *
 * States: default (unacknowledged), acknowledged, declined.
 * The "Continue" CTA is disabled until the user ticks the checkbox when the
 * `requiresAck` sheet type is "noShow".
 */

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Button,
  ModalSheet,
  colors,
  radius,
  spacing,
} from "../../shared/ui";

export type FeeDisclosureType = "deposit" | "cancellation" | "reschedule" | "noShow";

export type FeeDisclosureSheetProps = {
  visible: boolean;
  type: FeeDisclosureType;
  /** E.g. "$25.00". */
  feeAmount: string;
  /** Cancellation-fee cutoff, e.g. "24 hours before". */
  cutoffWindow?: string;
  /** Refund policy body text for deposit type. */
  refundPolicy?: string;
  onContinue: () => void;
  onDecline: () => void;
  onClose: () => void;
  testID?: string;
};

const TITLES: Record<FeeDisclosureType, string> = {
  deposit:      "Deposit required",
  cancellation: "Cancellation fee",
  reschedule:   "Reschedule fee",
  noShow:       "No-show fee",
};

const DESCRIPTIONS: Record<FeeDisclosureType, (fee: string, cutoff?: string) => string> = {
  deposit:      (fee)         => `A deposit of ${fee} is required to hold your booking. This will be applied to your total.`,
  cancellation: (fee, cutoff) => `If you cancel within ${cutoff ?? "the cancellation window"}, a fee of ${fee} will be charged.`,
  reschedule:   (fee)         => `Rescheduling this appointment incurs a ${fee} fee.`,
  noShow:       (fee)         => `If you miss your appointment without cancelling, you'll be charged a no-show fee of ${fee}.`,
};

export function FeeDisclosureSheet({
  visible,
  type,
  feeAmount,
  cutoffWindow,
  refundPolicy,
  onContinue,
  onDecline,
  onClose,
  testID,
}: FeeDisclosureSheetProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const requiresAck = type === "noShow";
  const continueDisabled = requiresAck && !acknowledged;

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={TITLES[type]}
      testID={testID}
      footer={
        <View style={styles.footer}>
          <Button
            label="Continue"
            variant="primary"
            disabled={continueDisabled}
            onPress={onContinue}
            testID={testID ? `${testID}-continue` : undefined}
          />
          <Button
            label="Decline"
            variant="tertiary"
            onPress={onDecline}
            testID={testID ? `${testID}-decline` : undefined}
          />
        </View>
      }
    >
      <View style={styles.body}>
        {/* Fee amount callout */}
        <View style={styles.feeBox} testID={testID ? `${testID}-fee-box` : undefined}>
          <Text style={styles.feeAmount}>{feeAmount}</Text>
        </View>

        <Text style={styles.description}>
          {DESCRIPTIONS[type](feeAmount, cutoffWindow)}
        </Text>

        {type === "deposit" && refundPolicy && (
          <Text style={styles.policy} testID={testID ? `${testID}-refund-policy` : undefined}>
            {refundPolicy}
          </Text>
        )}

        {requiresAck && (
          <Pressable
            style={styles.ackRow}
            onPress={() => setAcknowledged((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acknowledged }}
            testID={testID ? `${testID}-ack` : undefined}
          >
            <View
              style={[styles.checkbox, acknowledged && styles.checkboxChecked]}
              testID={testID ? `${testID}-ack-checkbox` : undefined}
            >
              {acknowledged && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.ackLabel}>
              I understand and accept the no-show fee policy.
            </Text>
          </Pressable>
        )}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s4,
    gap: spacing.s4,
  },
  feeBox: {
    backgroundColor: colors.primary10,
    borderRadius: radius.md,
    paddingVertical: spacing.s4,
    alignItems: "center",
  },
  feeAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
  },
  description: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  policy: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    padding: spacing.s3,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
  },
  ackRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.s3,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  ackLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s2,
  },
});
