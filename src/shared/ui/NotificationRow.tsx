/**
 * NotificationRow.tsx — W26 Batch F notification center primitive.
 *
 * Layout: leading tinted icon 32 | title body + preview body-small muted |
 *         right column: time label-small + unread dot 8 mint-fresh.
 * Full row is pressable; supports swipe-to-dismiss via onDismiss prop
 * (visual dismissal handled by caller — this component exposes the callback).
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";

export type NotificationRowTone = "booking" | "loyalty" | "promo" | "system" | "message";

export type NotificationRowProps = {
  tone?: NotificationRowTone;
  title: string;
  preview?: string;
  formattedTime: string;
  isUnread?: boolean;
  onPress?: () => void;
  onDismiss?: () => void;
  testID?: string;
};

const TONE_ICONS: Record<NotificationRowTone, string> = {
  booking: "📅",
  loyalty: "⭐",
  promo: "🏷",
  system: "🔔",
  message: "💬",
};

const TONE_BG: Record<NotificationRowTone, string> = {
  booking: "rgba(33, 150, 243, 0.12)",
  loyalty: "rgba(255, 193, 7, 0.15)",
  promo: "rgba(227, 169, 160, 0.18)",
  system: "rgba(107, 107, 107, 0.12)",
  message: "rgba(187, 237, 218, 0.35)",
};

export function NotificationRow({
  tone = "system",
  title,
  preview,
  formattedTime,
  isUnread,
  onPress,
  onDismiss,
  testID,
}: NotificationRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        isUnread && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected: isUnread }}
      testID={testID}
    >
      {/* Leading icon */}
      <View style={[styles.iconWrap, { backgroundColor: TONE_BG[tone] }]}>
        <Text style={styles.iconGlyph}>{TONE_ICONS[tone]}</Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text
          style={[styles.title, isUnread && styles.titleUnread]}
          numberOfLines={2}
          testID={testID ? `${testID}-title` : undefined}
        >
          {title}
        </Text>
        {preview ? (
          <Text style={styles.preview} numberOfLines={2}>
            {preview}
          </Text>
        ) : null}
      </View>

      {/* Right meta */}
      <View style={styles.rightMeta}>
        <Text style={styles.time}>{formattedTime}</Text>
        {isUnread ? (
          <View
            style={styles.unreadDot}
            accessibilityLabel="Unread"
            testID={testID ? `${testID}-unread-dot` : undefined}
          />
        ) : onDismiss ? (
          <Pressable
            onPress={onDismiss}
            style={styles.dismissBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            testID={testID ? `${testID}-dismiss` : undefined}
          >
            <Text style={styles.dismissIcon}>✕</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    backgroundColor: colors.background,
    gap: spacing.s3,
    minHeight: spacing.touchTarget,
  },
  rowUnread: {
    backgroundColor: colors.primary10,
  },
  rowPressed: {
    backgroundColor: colors.hover,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconGlyph: {
    fontSize: 16,
  },
  body: {
    flex: 1,
    gap: spacing.s1,
  },
  title: {
    ...textStyles.body,
    color: colors.foreground,
  },
  titleUnread: {
    fontWeight: "600",
  },
  preview: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  rightMeta: {
    alignItems: "flex-end",
    gap: spacing.s1,
    flexShrink: 0,
  },
  time: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.mintFresh,
  },
  dismissBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissIcon: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
