/**
 * ShareTargetRow.tsx — W28 Batch H primitive.
 *
 * A contact/app row inside the share sheet.
 * Shows avatar with initials, display name, and a send/checkmark action.
 *
 * States: default (unselected, send icon) | selected (checkmark, bold name)
 *
 * Used in: H.3 ShareSheetScreen
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShareTargetRowProps = {
  name: string;
  /** Pre-computed initials, e.g. "SJ" for "Sarah Johnson". */
  initials: string;
  selected?: boolean;
  onPress?: () => void;
  /** Whether to show the bottom separator line. Default true. */
  showSeparator?: boolean;
  testID?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ShareTargetRow({
  name,
  initials,
  selected = false,
  onPress,
  showSeparator = true,
  testID,
}: ShareTargetRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={selected ? `${name}, selected` : name}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      testID={testID}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarInitials}>{initials}</Text>
      </View>

      {/* Name */}
      <View style={styles.nameContainer}>
        <Text
          style={[styles.name, selected && styles.nameSelected]}
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>

      {/* Send / check action */}
      <View style={styles.actionButton}>
        <Text
          style={[styles.actionIcon, selected && styles.actionIconSelected]}
          accessibilityElementsHidden
        >
          {selected ? "✓" : "➤"}
        </Text>
      </View>

      {showSeparator && <View style={styles.separator} />}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.s4,
    gap: spacing.s3,
    backgroundColor: colors.white,
  },
  rowPressed: {
    backgroundColor: colors.background,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.warmOat,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarInitials: {
    ...textStyles.labelSmall,
    color: colors.foreground,
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...textStyles.label,
    color: colors.foreground,
  },
  nameSelected: {
    fontWeight: "600",
  },
  actionButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionIcon: {
    fontSize: 18,
    color: colors.primary,
  },
  actionIconSelected: {
    color: colors.accent,
  },
  separator: {
    position: "absolute",
    bottom: 0,
    left: spacing.s4,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
