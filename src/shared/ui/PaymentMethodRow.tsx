/**
 * PaymentMethodRow.tsx — Batch D payment-method-row primitive.
 *
 * Per spec D.1: height 64, padding 16. Left brand icon 32x20, center brand +
 * last4 / expiry, right "Default" mint badge + kebab 24x24.
 *
 * Brand icon: text glyph fallback (caller can pass a leading icon component
 * via `leadingIcon`) — we don't ship raster assets to keep dependency-free.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

import { colors, radius, spacing } from "./tokens";

export type PaymentMethodRowProps = {
  /** Brand display label, e.g. "Visa". */
  brandLabel: string;
  /** "•••• 4242". */
  last4Label: string;
  /** "Expires 12/28". Optional. */
  expiryLabel?: string;
  isDefault?: boolean;
  /** Renders error label + disabled tone for expired cards. */
  expired?: boolean;
  /** Pressing the row body (selection). */
  onPress?: () => void;
  /** Pressing the kebab. */
  onPressMenu?: () => void;
  /** Optional leading icon (svg/image); falls back to a text glyph. */
  leadingIcon?: ReactNode;
  selected?: boolean;
  testID?: string;
};

export function PaymentMethodRow({
  brandLabel,
  last4Label,
  expiryLabel,
  isDefault,
  expired,
  onPress,
  onPressMenu,
  leadingIcon,
  selected,
  testID,
}: PaymentMethodRowProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Pressable
        onPress={onPress}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={`${brandLabel} ${last4Label}${expired ? ", expired" : ""}${
          isDefault ? ", default" : ""
        }`}
        accessibilityState={{ selected: Boolean(selected), disabled: Boolean(expired) }}
        disabled={expired}
        style={[styles.row, selected ? styles.rowSelected : null, expired ? styles.rowDisabled : null]}
        testID={testID ? `${testID}-press` : undefined}
      >
        <View style={styles.iconWrap}>
          {leadingIcon ?? <Text style={styles.iconGlyph}>{glyphFor(brandLabel)}</Text>}
        </View>
        <View style={styles.center}>
          <Text style={[styles.title, expired ? styles.expiredText : null]} numberOfLines={1}>
            {brandLabel} {last4Label}
          </Text>
          {expired ? (
            <Text style={styles.errorLine}>Expired{expiryLabel ? ` — ${expiryLabel}` : ""}</Text>
          ) : expiryLabel ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {expiryLabel}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>
          {isDefault ? (
            <View style={styles.defaultBadge} testID={testID ? `${testID}-default` : undefined}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      {onPressMenu ? (
        <Pressable
          onPress={onPressMenu}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${brandLabel} ${last4Label}`}
          style={styles.kebab}
          hitSlop={8}
          testID={testID ? `${testID}-menu` : undefined}
        >
          <Text style={styles.kebabGlyph}>{"\u22EE"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function glyphFor(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("visa")) return "VISA";
  if (l.includes("master")) return "MC";
  if (l.includes("amex") || l.includes("american")) return "AMEX";
  if (l.includes("discover")) return "DISC";
  if (l.includes("diners")) return "DC";
  if (l.includes("jcb")) return "JCB";
  if (l.includes("union")) return "UP";
  return "CARD";
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 64,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    gap: spacing.s3,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 64,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary10,
  },
  rowDisabled: {
    backgroundColor: colors.disabledBg,
    borderColor: colors.border,
    opacity: 0.7,
  },
  iconWrap: {
    width: 40,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlyph: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.foreground,
  },
  center: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.foreground,
  },
  expiredText: {
    color: colors.textMuted,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: 2,
  },
  errorLine: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.error,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
  },
  defaultBadge: {
    paddingHorizontal: spacing.s2,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.mintFresh,
  },
  defaultBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: colors.accentForeground,
  },
  kebab: {
    width: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  kebabGlyph: {
    fontSize: 22,
    lineHeight: 24,
    color: colors.textMuted,
  },
});
