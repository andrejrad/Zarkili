/**
 * MfaOtpInput.tsx — W29 Batch I MFA OTP code entry primitive.
 *
 * 6-cell (or N-cell) digit entry with paste + auto-advance support.
 * Shared by MFA challenge, MFA setup verify, and any OTP-style flow.
 */

import { useRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";

export type MfaOtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  cellCount?: number;
  error?: string | null;
  disabled?: boolean;
  testID?: string;
};

const DEFAULT_CELL_COUNT = 6;

export function MfaOtpInput({
  value,
  onChange,
  cellCount = DEFAULT_CELL_COUNT,
  error,
  disabled,
  testID,
}: MfaOtpInputProps) {
  const inputRef = useRef<TextInput>(null);

  function handleChange(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, cellCount);
    onChange(digits);
  }

  const cells = Array.from({ length: cellCount }, (_, i) => value[i] ?? "");

  return (
    <View testID={testID}>
      <View style={styles.cells}>
        {cells.map((digit, i) => (
          <View
            key={i}
            style={[
              styles.cell,
              digit ? styles.cellFilled : null,
              error ? styles.cellError : null,
            ]}
            accessible={false}
          >
            <Text style={styles.cellText}>{digit}</Text>
          </View>
        ))}
        {/* Invisible full-width input captures typing and paste */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={cellCount}
          style={styles.hiddenInput}
          accessible={false}
          importantForAccessibility="no"
          editable={!disabled}
          testID={testID ? `${testID}-input` : undefined}
        />
      </View>
      {error ? (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          testID={testID ? `${testID}-error` : undefined}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cells: {
    flexDirection: "row",
    gap: spacing.s2,
    justifyContent: "center",
    position: "relative",
  },
  cell: {
    width: 44,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cellFilled: {
    borderColor: colors.primary,
  },
  cellError: {
    borderColor: colors.error,
  },
  cellText: {
    ...textStyles.heading3,
    color: colors.foreground,
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
  },
  error: {
    ...textStyles.bodySmall,
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.s2,
  },
});
