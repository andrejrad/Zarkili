/**
 * Banner.tsx — A.C6 primitive.
 *
 * Variants: info | success | warning | error
 */

import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

import { colors, radius, spacing } from "./tokens";

export type BannerVariant = "info" | "success" | "warning" | "error";

export type BannerProps = {
  variant?: BannerVariant;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  leftIcon?: ReactNode;
  testID?: string;
};

const VARIANT_STYLES: Record<
  BannerVariant,
  { background: string; foreground: string; border: string }
> = {
  info: { background: "rgba(33, 150, 243, 0.08)", foreground: colors.info, border: colors.info },
  success: { background: colors.mintFresh, foreground: colors.accentForeground, border: colors.mintFresh },
  warning: { background: "rgba(255, 152, 0, 0.12)", foreground: colors.warning, border: colors.warning },
  error: { background: "rgba(244, 67, 54, 0.08)", foreground: colors.error, border: colors.error },
};

export function Banner({
  variant = "info",
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
  leftIcon,
  testID,
}: BannerProps) {
  const v = VARIANT_STYLES[variant];
  const isAlert = variant === "error" || variant === "warning";
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: v.background, borderColor: v.border },
      ]}
      accessibilityRole={isAlert ? "alert" : "text"}
      accessibilityLiveRegion={isAlert ? "polite" : "none"}
      testID={testID}
    >
      {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
      <View style={styles.body}>
        {title ? (
          <Text style={[styles.title, { color: v.foreground }]}>{title}</Text>
        ) : null}
        <Text style={[styles.message, { color: v.foreground }]}>{message}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={styles.action}
          hitSlop={8}
        >
          <Text style={[styles.actionText, { color: v.foreground }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={styles.dismiss}
          hitSlop={8}
        >
          <Text style={[styles.dismissText, { color: v.foreground }]}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.s4,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  leftIcon: {
    marginRight: spacing.s3,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    marginLeft: spacing.s3,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  dismiss: {
    marginLeft: spacing.s2,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: "500",
  },
});
