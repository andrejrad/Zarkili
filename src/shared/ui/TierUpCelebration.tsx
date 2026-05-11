/**
 * TierUpCelebration.tsx — W31 Batch K primitive.
 *
 * Full-screen Modal overlay shown when a loyalty member reaches a new tier.
 * Contains an animated confetti placeholder, new-tier badge, congratulatory
 * copy, and a dismiss CTA.
 */

import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type LoyaltyTier = "Bronze" | "Silver" | "Gold" | "Platinum";

const TIER_COLOR: Record<LoyaltyTier, string> = {
  Bronze: "#CD7F32",
  Silver: "#A8A9AD",
  Gold: "#FFD700",
  Platinum: "#E5E4E2",
};

export type TierUpCelebrationProps = {
  visible: boolean;
  newTier: LoyaltyTier;
  /** Optional benefit headline shown below new tier badge. */
  benefitHeadline?: string;
  onDismiss: () => void;
  testID?: string;
};

export function TierUpCelebration({
  visible,
  newTier,
  benefitHeadline,
  onDismiss,
  testID,
}: TierUpCelebrationProps) {
  const tierColor = TIER_COLOR[newTier] ?? colors.primary;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      testID={testID}
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View
          style={styles.card}
          testID={testID ? `${testID}-card` : undefined}
        >
          {/* Confetti placeholder — replaced by Lottie in production */}
          <View
            style={styles.confettiPlaceholder}
            testID={testID ? `${testID}-confetti` : undefined}
          >
            <Text style={styles.confettiEmoji}>🎉🎊✨</Text>
          </View>

          {/* Tier badge */}
          <View
            style={[styles.badge, { borderColor: tierColor }]}
            testID={testID ? `${testID}-badge` : undefined}
          >
            <Text style={[styles.badgeText, { color: tierColor }]}>
              {newTier}
            </Text>
          </View>

          <Text
            style={styles.headline}
            testID={testID ? `${testID}-headline` : undefined}
          >
            You've reached {newTier}!
          </Text>

          {benefitHeadline ? (
            <Text
              style={styles.subHeadline}
              testID={testID ? `${testID}-benefit` : undefined}
            >
              {benefitHeadline}
            </Text>
          ) : null}

          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            style={styles.ctaBtn}
            testID={testID ? `${testID}-dismiss` : undefined}
          >
            <Text style={styles.ctaText}>Explore your new benefits</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.pageHorizontal,
  },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    paddingTop: spacing.s8,
    paddingHorizontal: spacing.s6,
    paddingBottom: spacing.s6,
    alignItems: "center",
    gap: spacing.s4,
  },
  confettiPlaceholder: {
    position: "absolute",
    top: -spacing.s6,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  confettiEmoji: {
    fontSize: 40,
    letterSpacing: 4,
  },
  badge: {
    paddingHorizontal: spacing.s6,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 2,
    marginTop: spacing.s8,
  },
  badgeText: {
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  headline: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  subHeadline: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  ctaBtn: {
    width: "100%",
    height: spacing.touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.s2,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface,
  },
});
