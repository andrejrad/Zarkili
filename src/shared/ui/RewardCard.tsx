/**
 * RewardCard.tsx — Batch E reward-card primitive.
 *
 * 343×auto card. Image top (16:10 ratio, height 214). Body padding 12.
 * Title: heading-4 (compact) or heading-3 (default). Points: label-small.
 *
 * States: unlocked | pressed | locked | redeemed | expired | loading | error | compact
 * Compact variant uses 4:3 image height (257 at 343w).
 *
 * #FFF5F5 is not in the locked token palette — error bg uses rgba(244,67,54,0.04).
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";

export type RewardCardState =
  | "unlocked"
  | "locked"
  | "redeemed"
  | "expired"
  | "loading"
  | "error";

export type RewardCardProps = {
  title: string;
  points: number;
  /** Optional image placeholder description (used as accessibility label). */
  imageAlt?: string;
  state?: RewardCardState;
  /** When true, renders the compact 4:3 variant. */
  compact?: boolean;
  onPress?: () => void;
  testID?: string;
};

export function RewardCard({
  title,
  points,
  imageAlt,
  state = "unlocked",
  compact = false,
  onPress,
  testID,
}: RewardCardProps) {
  const imageHeight = compact ? 128 : 214;
  const isLocked = state === "locked" || state === "expired";
  const isDisabled = state === "locked" || state === "expired" || state === "loading";
  const stateLabel =
    state === "locked"
      ? "Locked"
      : state === "redeemed"
      ? "Redeemed"
      : state === "expired"
      ? "Expired"
      : null;

  const content = (
    <View
      style={[
        styles.card,
        state === "error" ? styles.cardError : null,
        state === "expired" ? styles.cardExpired : null,
      ]}
    >
      {/* Image area */}
      <View
        style={[styles.imagePlaceholder, { height: imageHeight }]}
        accessibilityLabel={imageAlt ?? title}
      >
        {state === "loading" ? (
          <View style={styles.shimmer} />
        ) : isLocked ? (
          <View
            style={styles.lockOverlay}
            testID={testID ? `${testID}-locked-overlay` : undefined}
          >
            <Text style={styles.lockGlyph}>🔒</Text>
          </View>
        ) : state === "redeemed" ? (
          <View
            style={styles.redeemedRibbon}
            testID={testID ? `${testID}-redeemed-badge` : undefined}
          />
        ) : null}
      </View>

      {/* Body */}
      <View style={styles.body}>
        {state === "loading" ? (
          <>
            <View style={[styles.shimmerLine, { width: "70%", height: 16, marginBottom: 8 }]} />
            <View style={[styles.shimmerLine, { width: "40%", height: 12 }]} />
          </>
        ) : state === "error" ? (
          <View style={styles.errorBody}>
            <Text style={styles.errorGlyph}>⚠</Text>
            <Text style={styles.errorText}>{"Couldn't load reward"}</Text>
          </View>
        ) : (
          <>
            <Text
              style={compact ? styles.titleCompact : styles.title}
              numberOfLines={2}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.points,
                isLocked ? styles.pointsMuted : null,
              ]}
            >
              {points.toLocaleString()} PTS
            </Text>
            {stateLabel ? (
              <View style={[styles.statePill, state === "redeemed" ? styles.pillRedeemed : null]}>
                <Text style={styles.statePillText}>{stateLabel.toUpperCase()}</Text>
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );

  if (onPress && !isDisabled) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${points} points${stateLabel ? `, ${stateLabel}` : ""}`}
        accessibilityState={{ disabled: isDisabled }}
        testID={testID}
      >
        {({ pressed }) => (
          <View style={pressed ? styles.pressed : undefined}>{content}</View>
        )}
      </Pressable>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${points} points${stateLabel ? `, ${stateLabel}` : ""}`}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardError: {
    backgroundColor: "rgba(244,67,54,0.04)",
    borderColor: colors.error,
  },
  cardExpired: {
    opacity: 0.6,
  },
  imagePlaceholder: {
    width: "100%",
    backgroundColor: colors.border,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  lockGlyph: {
    fontSize: 32,
  },
  redeemedRibbon: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 64,
    height: 64,
    backgroundColor: colors.mintFresh,
  },
  body: {
    padding: spacing.s3,
    gap: spacing.s1,
  },
  title: {
    ...textStyles.heading3,
    color: colors.foreground,
  },
  titleCompact: {
    ...textStyles.heading4,
    color: colors.foreground,
  },
  points: {
    ...textStyles.labelSmall,
    color: colors.primary,
  },
  pointsMuted: {
    color: colors.textMuted,
  },
  statePill: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.s2,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.disabledBg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 2,
  },
  pillRedeemed: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  statePillText: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.disabledBg,
  },
  shimmerLine: {
    borderRadius: radius.sm,
    backgroundColor: colors.disabledBg,
  },
  pressed: {
    opacity: 0.88,
  },
  errorBody: {
    alignItems: "center",
    paddingVertical: spacing.s4,
    gap: spacing.s2,
  },
  errorGlyph: {
    fontSize: 32,
  },
  errorText: {
    ...textStyles.body,
    color: colors.textMuted,
  },
});
