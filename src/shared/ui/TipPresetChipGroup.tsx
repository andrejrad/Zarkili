/**
 * TipPresetChipGroup.tsx — Batch D tip-preset-chip-group primitive.
 *
 * Per spec D.3: chip variants based on existing chip aesthetic. Selected
 * chip uses coral-blossom; "No tip" chip uses destructive-tone outline
 * (rendered as a muted-error border with foreground text).
 *
 * Layout: wraps; min-height 44 per chip (WCAG 44pt min touch target).
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type TipPresetChipItem = {
  id: string;
  label: string;
  /** When true, renders the "destructive-tone outline" variant per spec. */
  destructive?: boolean;
  /** Optional accessibilityLabel override (e.g. "20 percent tip, $4.50"). */
  accessibilityLabel?: string;
};

export type TipPresetChipGroupProps = {
  options: readonly TipPresetChipItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  testID?: string;
};

export function TipPresetChipGroup({
  options,
  selectedId,
  onSelect,
  testID,
}: TipPresetChipGroupProps) {
  return (
    <View style={styles.row} testID={testID} accessibilityRole="radiogroup">
      {options.map((opt) => {
        const isSelected = opt.id === selectedId;
        const baseStyle = opt.destructive
          ? styles.destructive
          : isSelected
          ? styles.selected
          : styles.unselected;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={opt.accessibilityLabel ?? opt.label}
            testID={testID ? `${testID}-${opt.id}` : undefined}
            style={[styles.chip, baseStyle]}
          >
            <Text
              style={[
                styles.chipText,
                isSelected && !opt.destructive ? styles.chipTextSelected : null,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s2,
  },
  chip: {
    minHeight: spacing.touchTarget,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  unselected: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  destructive: {
    borderColor: colors.error,
    backgroundColor: colors.surface,
    borderStyle: "dashed",
  },
  chipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.foreground,
  },
  chipTextSelected: {
    color: colors.white,
  },
});
