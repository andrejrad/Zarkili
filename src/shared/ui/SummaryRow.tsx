/**
 * SummaryRow.tsx — Batch C summary-row primitive.
 *
 * Left label muted body / right value foreground body. Optional trailing
 * chevron + onPress for editable rows. Optional sub-label below the value.
 * Bottom 1px border by default; can be disabled for the last row in a group.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

import { colors, spacing } from "./tokens";

export type SummaryRowProps = {
  label: string;
  value?: string;
  /** Optional second line shown beneath the value. */
  subValue?: string;
  /** Right-side trailing content (overrides value when provided). */
  trailing?: ReactNode;
  onPress?: () => void;
  /** Hide the bottom divider (useful for last row in a group). */
  noDivider?: boolean;
  /** Show a chevron icon glyph on the right. */
  editable?: boolean;
  testID?: string;
};

export function SummaryRow({
  label,
  value,
  subValue,
  trailing,
  onPress,
  noDivider,
  editable,
  testID,
}: SummaryRowProps) {
  const Container: typeof Pressable | typeof View = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `${label}, ${value ?? ""}` : undefined}
      testID={testID}
      style={[styles.row, noDivider ? null : styles.divider]}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.rightWrap}>
        {trailing ?? (
          <View style={styles.valueColumn}>
            {value ? <Text style={styles.value}>{value}</Text> : null}
            {subValue ? <Text style={styles.subValue}>{subValue}</Text> : null}
          </View>
        )}
        {editable ? <Text style={styles.chevron}>{"›"}</Text> : null}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.s3,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    color: colors.textMuted,
    flexShrink: 0,
  },
  rightWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
    flexShrink: 1,
  },
  valueColumn: {
    alignItems: "flex-end",
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    color: colors.foreground,
    textAlign: "right",
  },
  subValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    color: colors.textMuted,
    textAlign: "right",
  },
  chevron: {
    fontSize: 18,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
