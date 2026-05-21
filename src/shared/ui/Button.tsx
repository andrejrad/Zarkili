/**
 * Button.tsx — A.C2 button primitive.
 *
 * Variants: primary | secondary | tertiary | destructive | iconOnly
 * Sizes:    large (48) | medium (40) | small (32)
 *
 * Tokens: src/shared/ui/tokens.ts (locked W21).
 */

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

import { colors, radius, spacing } from "./tokens";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "destructive"
  | "ghost"
  | "iconOnly";

export type ButtonSize = "large" | "medium" | "small";

export type ButtonProps = {
  label?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Required for iconOnly. Falls back to label otherwise. */
  accessibilityLabel?: string;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "large",
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sizeStyle = SIZE_STYLES[size];
  const variantStyle = VARIANT_STYLES[variant];
  const isIconOnly = variant === "iconOnly";

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        sizeStyle.container,
        isIconOnly && styles.iconOnlyContainer,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && variantStyle.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "destructive" ? colors.white : colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          {label && !isIconOnly ? (
            <Text
              style={[
                styles.label,
                { fontSize: sizeStyle.fontSize, lineHeight: sizeStyle.lineHeight },
                variantStyle.label,
                isDisabled && styles.disabledLabel,
              ]}
            >
              {label}
            </Text>
          ) : null}
          {isIconOnly && leftIcon ? null : null}
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const SIZE_STYLES: Record<ButtonSize, {
  container: { height: number; paddingHorizontal: number };
  fontSize: number;
  lineHeight: number;
}> = {
  large: { container: { height: 48, paddingHorizontal: spacing.s6 }, fontSize: 14, lineHeight: 20 },
  medium: { container: { height: 40, paddingHorizontal: spacing.s5 }, fontSize: 14, lineHeight: 20 },
  small: { container: { height: 32, paddingHorizontal: spacing.s4 }, fontSize: 12, lineHeight: 16 },
};

const VARIANT_STYLES: Record<ButtonVariant, {
  container: object;
  label: object;
  pressed: object;
}> = {
  primary: {
    container: { backgroundColor: colors.primary },
    label: { color: colors.white },
    pressed: { backgroundColor: colors.primaryPressed },
  },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    label: { color: colors.foreground },
    pressed: { backgroundColor: colors.hover },
  },
  tertiary: {
    container: { backgroundColor: "transparent" },
    label: { color: colors.primary },
    pressed: { backgroundColor: colors.primary10 },
  },
  destructive: {
    container: { backgroundColor: colors.error },
    label: { color: colors.white },
    pressed: { opacity: 0.85 },
  },
  iconOnly: {
    container: { backgroundColor: "transparent", minWidth: 44, minHeight: 44 },
    label: { color: colors.foreground },
    pressed: { backgroundColor: colors.hover },
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    label: { color: colors.primary },
    pressed: { backgroundColor: colors.primary10 },
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconOnlyContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
  },
  fullWidth: { alignSelf: "stretch" },
  row: { flexDirection: "row", alignItems: "center" },
  iconLeft: { marginRight: spacing.s2 },
  iconRight: { marginLeft: spacing.s2 },
  label: { fontWeight: "500" },
  disabled: { backgroundColor: colors.disabledBg, borderColor: colors.disabledBg },
  disabledLabel: { color: colors.disabled },
});
