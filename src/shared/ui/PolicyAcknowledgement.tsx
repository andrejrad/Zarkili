/**
 * PolicyAcknowledgement.tsx — Batch C policy-acknowledgement primitive.
 *
 * Full-width tappable row with checkbox + wrapping label. Required state shows
 * an error message below the row when `errorMessage` is provided.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type PolicyAcknowledgementProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  errorMessage?: string;
  testID?: string;
};

export function PolicyAcknowledgement({
  checked,
  onChange,
  label,
  errorMessage,
  testID,
}: PolicyAcknowledgementProps) {
  return (
    <View testID={testID}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        testID={testID ? `${testID}-toggle` : undefined}
        hitSlop={8}
        style={styles.row}
      >
        <View style={[styles.box, checked ? styles.boxChecked : null]}>
          {checked ? <Text style={styles.check}>{"\u2713"}</Text> : null}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {errorMessage ? (
        <Text
          style={styles.error}
          testID={testID ? `${testID}-error` : undefined}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.s3,
    paddingVertical: spacing.s2,
  },
  box: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  check: {
    fontSize: 16,
    lineHeight: 18,
    color: colors.white,
    fontWeight: "600",
  },
  label: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.foreground,
  },
  error: {
    marginTop: spacing.s1,
    marginLeft: 24 + spacing.s3,
    fontSize: 12,
    lineHeight: 16,
    color: colors.error,
    fontWeight: "500",
  },
});
