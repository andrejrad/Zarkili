/**
 * ClaimActivityRewardScreen.tsx — E.6 Claim Activity Reward.
 *
 * Bottom ModalSheet: celebration + heading-2 "Reward earned" + reward summary +
 * primary "Add to my rewards" + tertiary "Done".
 * States: default | claiming | claimed | already-claimed | error.
 */

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Banner, ModalSheet, colors, radius, spacing, textStyles } from "../../shared/ui";

export type ClaimState = "default" | "claiming" | "claimed" | "already-claimed" | "error";

export type ClaimActivityRewardScreenProps = {
  visible: boolean;
  activityTitle: string;
  pointsReward: number;
  bonusPoints?: number;
  claimState?: ClaimState;
  errorMessage?: string;
  reduceMotion?: boolean;
  onClaim: () => void;
  onDone: () => void;
  onDismiss?: () => void;
  testID?: string;
};

export function ClaimActivityRewardScreen({
  visible,
  activityTitle,
  pointsReward,
  bonusPoints,
  claimState = "default",
  errorMessage,
  reduceMotion,
  onClaim,
  onDone,
  onDismiss,
  testID,
}: ClaimActivityRewardScreenProps) {
  const totalPoints = pointsReward + (bonusPoints ?? 0);
  const alreadyClaimed = claimState === "already-claimed";
  const isClaiming = claimState === "claiming";
  const isClaimed = claimState === "claimed";
  const isError = claimState === "error";

  return (
    <ModalSheet
      visible={visible}
      onClose={onDismiss ?? (() => {})}
      testID={testID}
    >
      <View style={styles.content}>
        {/* Celebration glyph */}
        {!reduceMotion ? (
          <Text style={styles.celebration} accessible={false}>
            🎉
          </Text>
        ) : (
          <Text style={styles.celebration} accessible={false}>
            ✓
          </Text>
        )}

        <Text style={styles.heading}>Reward earned!</Text>
        <Text style={styles.subtitle}>{activityTitle}</Text>

        {/* Reward summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Points earned</Text>
            <Text style={styles.summaryValue}>+{pointsReward} pts</Text>
          </View>
          {bonusPoints ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Bonus</Text>
              <Text style={[styles.summaryValue, styles.bonusValue]}>+{bonusPoints} pts</Text>
            </View>
          ) : null}
          {bonusPoints ? (
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>+{totalPoints} pts</Text>
            </View>
          ) : null}
        </View>

        {/* Banners */}
        {alreadyClaimed && (
          <Banner variant="info" message="You've already claimed this reward." />
        )}
        {isError && (
          <Banner variant="error" message={errorMessage ?? "Unable to claim reward. Try again."} />
        )}

        {/* Primary CTA */}
        {!alreadyClaimed && !isClaimed && (
          <Pressable
            onPress={isClaiming ? undefined : onClaim}
            disabled={isClaiming}
            style={[styles.primaryBtn, isClaiming ? styles.primaryBtnDisabled : null]}
            accessibilityRole="button"
            accessibilityLabel="Add to my rewards"
            accessibilityState={{ disabled: isClaiming, busy: isClaiming }}
            testID={testID ? `${testID}-claim` : undefined}
          >
            {isClaiming ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Add to my rewards</Text>
            )}
          </Pressable>
        )}

        {/* Done CTA */}
        <Pressable
          onPress={onDone}
          style={styles.doneBtn}
          accessibilityRole="button"
          accessibilityLabel="Done"
          testID={testID ? `${testID}-done` : undefined}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: "center", gap: spacing.s4, paddingBottom: spacing.s6 },
  celebration: { fontSize: 64, textAlign: "center" },
  heading: { ...textStyles.heading2, color: colors.foreground, textAlign: "center" },
  subtitle: { ...textStyles.body, color: colors.textMuted, textAlign: "center" },
  summaryCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    gap: spacing.s2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { ...textStyles.body, color: colors.textMuted },
  summaryValue: { ...textStyles.label, color: colors.foreground },
  bonusValue: { color: colors.accentForeground },
  totalRow: { paddingTop: spacing.s2, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { ...textStyles.label, color: colors.foreground },
  totalValue: { ...textStyles.heading4, color: colors.foreground },
  primaryBtn: {
    width: "100%",
    height: spacing.touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: { backgroundColor: colors.disabledBg },
  primaryBtnText: { ...textStyles.labelLarge, color: colors.white },
  doneBtn: {
    width: "100%",
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: { ...textStyles.label, color: colors.textMuted },
});
