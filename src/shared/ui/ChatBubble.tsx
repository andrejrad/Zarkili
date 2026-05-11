/**
 * ChatBubble.tsx — W26 Batch F messaging primitive.
 *
 * Incoming: warm-oat background, foreground text, radius.lg with bottom-left 4.
 * Outgoing: surface white with 1px coral-blossom border, radius.lg with bottom-right 4.
 * Below the bubble: formatted time + optional status indicator (sent/delivered/read).
 *
 * Usage:
 *   <ChatBubble
 *     direction="incoming"
 *     message="Hey, your appointment is confirmed!"
 *     formattedTime="10:32 AM"
 *   />
 */

import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";

export type ChatBubbleDirection = "incoming" | "outgoing";
export type ChatBubbleStatus = "sent" | "delivered" | "read";

export type ChatBubbleProps = {
  direction: ChatBubbleDirection;
  message: string;
  formattedTime: string;
  status?: ChatBubbleStatus;
  testID?: string;
};

const STATUS_ICONS: Record<ChatBubbleStatus, string> = {
  sent: "✓",
  delivered: "✓✓",
  read: "✓✓",
};

export function ChatBubble({
  direction,
  message,
  formattedTime,
  status,
  testID,
}: ChatBubbleProps) {
  const isOutgoing = direction === "outgoing";

  return (
    <View
      style={[styles.wrapper, isOutgoing ? styles.wrapperOut : styles.wrapperIn]}
      testID={testID}
    >
      <View
        style={[
          styles.bubble,
          isOutgoing ? styles.bubbleOut : styles.bubbleIn,
        ]}
      >
        <Text
          style={[styles.messageText, isOutgoing ? styles.messageTextOut : styles.messageTextIn]}
          testID={testID ? `${testID}-message` : undefined}
        >
          {message}
        </Text>
      </View>
      <View
        style={[styles.meta, isOutgoing ? styles.metaOut : styles.metaIn]}
      >
        <Text style={styles.timeText}>{formattedTime}</Text>
        {isOutgoing && status ? (
          <Text
            style={[
              styles.statusText,
              status === "read" ? styles.statusRead : null,
            ]}
            testID={testID ? `${testID}-status` : undefined}
          >
            {STATUS_ICONS[status]}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: "75%",
    marginBottom: spacing.s2,
  },
  wrapperIn: {
    alignSelf: "flex-start",
  },
  wrapperOut: {
    alignSelf: "flex-end",
  },
  bubble: {
    padding: spacing.s3,
    borderRadius: radius.lg,
  },
  bubbleIn: {
    backgroundColor: colors.warmOat,
    borderBottomLeftRadius: 4,
  },
  bubbleOut: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.coralBlossom,
    borderBottomRightRadius: 4,
  },
  messageText: {
    ...textStyles.body,
  },
  messageTextIn: {
    color: colors.foreground,
  },
  messageTextOut: {
    color: colors.foreground,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.s1,
    gap: spacing.s1,
  },
  metaIn: {
    justifyContent: "flex-start",
  },
  metaOut: {
    justifyContent: "flex-end",
  },
  timeText: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },
  statusText: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },
  statusRead: {
    color: colors.primary,
  },
});
