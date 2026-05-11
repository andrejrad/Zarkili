/**
 * PreferenceToggleRow.tsx — W26 Batch F notification preferences primitive.
 *
 * Layout: left optional icon + label body | right React Native Switch (44×26 track, 20 thumb).
 * Optional helper body-small muted below the label.
 * The full row touch target is 44pt minimum height (WCAG 2.1 AA).
 */

import { StyleSheet, Switch, Text, View } from "react-native";

import { colors, spacing, textStyles } from "./tokens";

export type PreferenceToggleRowProps = {
  label: string;
  helperText?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  testID?: string;
};

export function PreferenceToggleRow({
  label,
  helperText,
  value,
  onValueChange,
  disabled,
  testID,
}: PreferenceToggleRowProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole="none"
      testID={testID}
    >
      <View style={styles.labelBlock}>
        <Text
          style={[styles.label, disabled && styles.labelDisabled]}
          testID={testID ? `${testID}-label` : undefined}
        >
          {label}
        </Text>
        {helperText ? (
          <Text style={styles.helper}>{helperText}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.border}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled }}
        testID={testID ? `${testID}-toggle` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: spacing.touchTarget,
    paddingVertical: spacing.s2,
    gap: spacing.s4,
  },
  labelBlock: {
    flex: 1,
    gap: spacing.s1,
  },
  label: {
    ...textStyles.body,
    color: colors.foreground,
  },
  labelDisabled: {
    color: colors.disabled,
  },
  helper: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
});
