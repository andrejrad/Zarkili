/**
 * QuickReplyChip.tsx — W26 Batch F messaging primitive.
 *
 * Horizontally-scrolling chip that inserts a suggested reply text into the
 * composer. Tap calls onPress with the suggestion label.
 * Reuses the chip visual language (coral-blossom outline, body-small label).
 */

import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";

export type QuickReplyChipProps = {
  label: string;
  onPress: () => void;
  testID?: string;
};

export function QuickReplyChip({ label, onPress, testID }: QuickReplyChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.coralBlossom,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipPressed: {
    backgroundColor: colors.primary10,
  },
  label: {
    ...textStyles.bodySmall,
    color: colors.primary,
    fontWeight: "500",
  },
});
