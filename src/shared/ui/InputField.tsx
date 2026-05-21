/**
 * InputField.tsx — A.C1 input-field primitive.
 *
 * Variants: text | email | phone | password | otpCell
 * States:   default | focused | filled | disabled | error | loading
 *
 * Tokens: src/shared/ui/tokens.ts.
 */

import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ReactNode } from "react";
import type { TextInputProps } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type InputFieldVariant = "text" | "email" | "phone" | "password" | "otpCell";

export type InputFieldProps = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  variant?: InputFieldVariant;
  placeholder?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightAdornment?: ReactNode;
  maxLength?: number;
  autoFocus?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  onSubmitEditing?: () => void;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Removes the bordered box; renders label + input with only a bottom separator line. */
  flat?: boolean;
};

const KEYBOARD_TYPES: Record<InputFieldVariant, TextInputProps["keyboardType"]> = {
  text: "default",
  email: "email-address",
  phone: "phone-pad",
  password: "default",
  otpCell: "number-pad",
};

const AUTO_COMPLETE: Record<InputFieldVariant, TextInputProps["autoComplete"]> = {
  text: "off",
  email: "email",
  phone: "tel",
  password: "current-password",
  otpCell: "one-time-code",
};

export function InputField({
  label,
  value,
  onChangeText,
  variant = "text",
  placeholder,
  helper,
  error,
  disabled = false,
  loading = false,
  leftIcon,
  rightAdornment,
  maxLength,
  autoFocus,
  keyboardType,
  autoCapitalize,
  onSubmitEditing,
  testID,
  accessibilityLabel,
  accessibilityHint,
  flat = true,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = variant === "password";
  const secure = isPassword && !showPassword;
  const hasError = Boolean(error);
  const a11yLabel = accessibilityLabel ?? label ?? placeholder;

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      ) : null}
      <View
        style={[
          flat ? styles.inputRowFlat : styles.inputRow,
          focused && !hasError && (flat ? styles.inputRowFlatFocused : styles.inputRowFocused),
          hasError && (flat ? styles.inputRowFlatError : styles.inputRowError),
          disabled && (flat ? styles.inputRowFlatDisabled : styles.inputRowDisabled),
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          style={[
            styles.input,
            flat && styles.inputFlat,
            disabled && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          editable={!disabled && !loading}
          keyboardType={keyboardType ?? KEYBOARD_TYPES[variant]}
          autoComplete={AUTO_COMPLETE[variant]}
          autoCapitalize={autoCapitalize ?? (variant === "email" || variant === "password" ? "none" : "sentences")}
          secureTextEntry={secure}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          testID={testID}
          accessibilityLabel={a11yLabel}
          accessibilityHint={accessibilityHint ?? helper}
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.trailing} />
        ) : isPassword ? (
          <Pressable
            onPress={() => setShowPassword((s) => !s)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            style={styles.trailing}
            hitSlop={8}
          >
            <Text style={styles.trailingText}>{showPassword ? "Hide" : "Show"}</Text>
          </Pressable>
        ) : rightAdornment ? (
          <View style={styles.trailing}>{rightAdornment}</View>
        ) : null}
      </View>
      {hasError ? (
        <Text
          style={styles.errorText}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.foreground,
    marginBottom: spacing.s1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s4,
  },
  inputRowFocused: {
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: spacing.s4 - 1,
  },
  inputRowError: {
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  inputRowDisabled: {
    backgroundColor: colors.disabledBg,
    borderColor: colors.disabledBg,
  },
  inputRowFlat: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
  },
  inputRowFlatFocused: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  inputRowFlatError: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.error,
  },
  inputRowFlatDisabled: {
    borderBottomColor: colors.disabledBg,
  },
  leftIcon: {
    marginRight: spacing.s2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.foreground,
    padding: 0,
  },
  // Flat mode: strip every browser-applied visual from the <input> element so
  // only the parent container's bottom-line separator is visible.
  // - outline/border: remove focus ring and default border
  // - transition trick: delays browser-autofill background-color from ever
  //   painting (9999 seconds >> any session length), which is the only
  //   reliable way to suppress Webkit/Chrome autofill highlighting
  // - WebkitTextFillColor: keeps text readable after autofill overrides `color`
  // - WebkitBoxShadow inset: belt-and-suspenders fallback for older Safari
  // All keys are web-only; React Native ignores unknown style props.
  inputFlat: {
    backgroundColor: "transparent",
    ...({
      outline: "none",
      border: "none",
      appearance: "none",
      WebkitAppearance: "none",
      WebkitBoxShadow: "0 0 0 1000px transparent inset",
      boxShadow: "0 0 0 1000px transparent inset",
      WebkitTextFillColor: colors.foreground,
      transition: "background-color 9999s ease-in-out 0s, color 9999s ease-in-out 0s",
    } as object),
  },
  inputDisabled: {
    color: colors.disabled,
  },
  trailing: {
    marginLeft: spacing.s2,
  },
  trailingText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: colors.primary,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: spacing.s1,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: colors.error,
    marginTop: spacing.s1,
  },
});
