/**
 * TimeSlotChip.tsx — C.C2 time-slot-chip primitive.
 *
 * Locked spec: design-handoff/components/time-slot-chip.json (Batch C).
 *
 * Height bumped from spec's 40 → 44 to satisfy the 44pt min touch target
 * (recorded in the JSON spec's accessibility.minimumTouchTarget callout).
 */

import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type TimeSlotChipProps = {
  /** US 12h format e.g. "9:00 AM". */
  time: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: (time: string) => void;
  testID?: string;
};

export function TimeSlotChip({
  time,
  selected = false,
  disabled = false,
  onPress,
  testID,
}: TimeSlotChipProps) {
  const a11yLabel = disabled
    ? `${time}, unavailable`
    : selected
      ? `${time}, selected`
      : `${time}, available`;

  return (
    <Pressable
      onPress={disabled ? undefined : () => onPress?.(time)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ disabled, selected }}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.default,
        disabled ? styles.disabled : null,
        pressed && !disabled && !selected ? styles.pressed : null,
        pressed && selected ? styles.selectedPressed : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected ? styles.labelSelected : null,
          disabled ? styles.labelDisabled : null,
        ]}
      >
        {time}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 44,
    minWidth: 80,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.primary,
  },
  selectedPressed: {
    backgroundColor: colors.primaryPressed,
  },
  disabled: {
    backgroundColor: colors.disabledBg,
    borderWidth: 0,
  },
  pressed: {
    backgroundColor: colors.hover,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.foreground,
  },
  labelSelected: {
    color: colors.white,
  },
  labelDisabled: {
    color: colors.disabled,
    textDecorationLine: "line-through",
  },
});
