/**
 * CurrencyInput.tsx — Batch D currency-input primitive.
 *
 * Per spec D.3: fixed leading "$" in label-large, numeric keyboard, 2-decimal
 * mask, right-aligned amount. Min/max validation with helper text.
 *
 * Owns light formatting only (strip non-digits/dot, clamp to 2 decimals).
 * Caller controls value as a numeric or formatted string per their preference;
 * we accept a string for flexibility and emit `onChangeValue(numericValue)`.
 */

import { StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo } from "react";

import { colors, radius, spacing } from "./tokens";

export type CurrencyInputProps = {
  /** Display value (already-formatted free-form string the user has typed). */
  value: string;
  onChangeText: (next: string) => void;
  /** Emitted with the numeric interpretation of `value`. NaN if unparseable. */
  onChangeValue?: (numericValue: number) => void;
  placeholder?: string;
  /** Helper / error message under the field. */
  helperText?: string;
  errorText?: string;
  /** Optional min / max bounds for caller-side validation messaging. */
  minUsd?: number;
  maxUsd?: number;
  autoFocus?: boolean;
  testID?: string;
};

const ALLOWED = /[0-9.]/;

export function CurrencyInput({
  value,
  onChangeText,
  onChangeValue,
  placeholder,
  helperText,
  errorText,
  autoFocus,
  testID,
}: CurrencyInputProps) {
  const showError = Boolean(errorText);
  const numericValue = useMemo(() => parseToNumber(value), [value]);

  const handleChange = (next: string) => {
    const sanitized = sanitize(next);
    onChangeText(sanitized);
    onChangeValue?.(parseToNumber(sanitized));
  };

  return (
    <View testID={testID}>
      <View
        style={[
          styles.field,
          showError ? styles.fieldError : null,
        ]}
      >
        <Text style={styles.dollar}>$</Text>
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder ?? "0.00"}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          autoFocus={autoFocus}
          accessibilityLabel="Amount in US dollars"
          accessibilityValue={Number.isFinite(numericValue) ? { text: `$${numericValue.toFixed(2)}` } : undefined}
          style={styles.input}
          testID={testID ? `${testID}-input` : undefined}
        />
      </View>
      {errorText ? (
        <Text style={styles.errorHelper} testID={testID ? `${testID}-error` : undefined}>
          {errorText}
        </Text>
      ) : helperText ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
}

function sanitize(raw: string): string {
  let s = "";
  let dotSeen = false;
  for (const ch of raw) {
    if (!ALLOWED.test(ch)) continue;
    if (ch === ".") {
      if (dotSeen) continue;
      dotSeen = true;
    }
    s += ch;
  }
  // Clamp to 2 decimal places.
  const dot = s.indexOf(".");
  if (dot >= 0 && s.length - dot - 1 > 2) {
    s = s.slice(0, dot + 3);
  }
  return s;
}

function parseToNumber(s: string): number {
  if (!s || s === "." || s === "-") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s4,
  },
  fieldError: {
    borderColor: colors.error,
  },
  dollar: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: colors.textMuted,
    marginRight: spacing.s2,
  },
  input: {
    flex: 1,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
    color: colors.foreground,
    textAlign: "right",
    paddingVertical: 0,
  },
  helper: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: spacing.s1,
  },
  errorHelper: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.error,
    marginTop: spacing.s1,
  },
});
