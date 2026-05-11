/**
 * TierBadge.tsx — Batch E tier-badge primitive.
 *
 * Pill height 24, label-small uppercase, letter-spacing 0.5.
 * Per WCAG 1.4.1 color MUST be paired with label text — never color-alone.
 *
 * Variants: bronze | silver | gold | platinum | locked
 * States: default | pressed | selected
 * Visual size 24px × dynamic width; hitSlop 44 when interactive.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, textStyles } from "./tokens";

export type TierVariant = "bronze" | "silver" | "gold" | "platinum" | "locked";

const TIER_COLORS: Record<TierVariant, { bg: string; fg: string }> = {
  bronze: { bg: "#C77A50", fg: colors.white },
  silver: { bg: "#9AA3A8", fg: colors.white },
  gold: { bg: "#D4A24C", fg: colors.foreground },
  platinum: { bg: "#5E6B6E", fg: colors.white },
  locked: { bg: colors.disabledBg, fg: colors.textMuted },
};

const TIER_LABELS: Record<TierVariant, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  locked: "Locked",
};

export type TierBadgeProps = {
  tier: TierVariant;
  /** Custom label override — if omitted the canonical tier name is used. */
  label?: string;
  /** When true, renders as interactive (Pressable + 44pt hit area). */
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

export function TierBadge({
  tier,
  label,
  interactive = false,
  selected = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  testID,
}: TierBadgeProps) {
  const { bg, fg } = TIER_COLORS[tier];
  const displayLabel = label ?? TIER_LABELS[tier];

  const badge = (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        selected ? styles.selected : null,
        disabled ? styles.disabled : null,
      ]}
      testID={interactive ? undefined : testID}
    >
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {displayLabel}
      </Text>
    </View>
  );

  if (interactive) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={styles.hitSlop}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
        accessibilityLabel={accessibilityLabel ?? `${displayLabel} tier`}
        testID={testID}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.badge,
              { backgroundColor: bg },
              pressed ? styles.pressed : null,
              selected ? styles.selected : null,
              disabled ? styles.disabled : null,
            ]}
          >
            <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
              {displayLabel}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? `${displayLabel} tier`}
      testID={testID}
    >
      {badge}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  label: {
    ...textStyles.labelSmall,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.84,
  },
  selected: {
    borderWidth: 1,
    borderColor: colors.foreground,
  },
  disabled: {
    opacity: 0.6,
  },
  hitSlop: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
});
