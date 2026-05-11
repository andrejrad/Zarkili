/**
 * SegmentedControl.tsx — A.C4 primitive.
 *
 * Surface 1px border, radius medium, height 44, internal padding 4.
 * Selected segment: bg coral-blossom, fg white, radius small.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  testID?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  testID,
}: SegmentedControlProps<T>) {
  return (
    <View
      style={[styles.container, disabled && styles.containerDisabled]}
      accessibilityRole="tablist"
      testID={testID}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={disabled ? undefined : () => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={opt.label}
            style={[styles.segment, selected && styles.segmentSelected]}
            testID={`${testID ?? "segment"}-${opt.value}`}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 4,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  segmentSelected: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.foreground,
    paddingHorizontal: spacing.s2,
  },
  segmentTextSelected: {
    color: colors.white,
  },
});
