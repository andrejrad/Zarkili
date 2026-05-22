/**
 * ThreadScreen.tsx — F.2 Message Thread View.
 *
 * Header: avatar + salon name + presence dot + kebab (mute/archive/block).
 * FlatList: date separators + ChatBubble stack + AttachmentTile inline.
 * Typing indicator (3 dots or "typing…" for reduce-motion).
 * QuickReplyChip horizontal scroll above composer.
 * Composer: multiline TextInput (max 6 lines) + attach button + send button.
 * States: loading, error, no-messages-yet, blocked-banner, send-failed.
 */

import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  AttachmentTile,
  Banner,
  ChatBubble,
  QuickReplyChip,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";

import { formatMessageTime, type ConsumerMessage, type ThreadSummary } from "./messagingHelpers";

export type ThreadScreenProps = {
  thread: ThreadSummary;
  messages: ConsumerMessage[];
  quickReplies?: string[];
  composerText: string;
  onComposerChange: (text: string) => void;
  onPressSend: () => void;
  onPressAttach?: () => void;
  onPressQuickReply: (text: string) => void;
  onPressMore?: () => void;
  onPressBack: () => void;
  isTyping?: boolean;
  isSending?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onPressRetry?: () => void;
  testID?: string;
};

export function ThreadScreen({
  thread,
  messages,
  quickReplies = [],
  composerText,
  onComposerChange,
  onPressSend,
  onPressAttach,
  onPressQuickReply,
  onPressMore,
  onPressBack,
  isTyping,
  isSending,
  isLoading,
  isError,
  onPressRetry,
  testID,
}: ThreadScreenProps) {
  const canSend = composerText.trim().length > 0 && !isSending;

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onPressBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          testID={testID ? `${testID}-back` : undefined}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {thread.salonName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.headerName} numberOfLines={1}>
          {thread.salonName}
        </Text>
        {onPressMore ? (
          <Pressable
            onPress={onPressMore}
            style={styles.moreBtn}
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={8}
            testID={testID ? `${testID}-more` : undefined}
          >
            <Text style={styles.moreBtnText}>⋮</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Blocked banner */}
      {thread.isBlocked ? (
        <Banner
          variant="warning"
          message="You have blocked this conversation."
          testID={testID ? `${testID}-blocked-banner` : undefined}
        />
      ) : null}

      {/* Body */}
      {isError ? (
        <View style={styles.centeredFill}>
          <Text style={styles.errorGlyph}>⚠</Text>
          <Text style={styles.bodyMuted}>Unable to load messages</Text>
          {onPressRetry ? (
            <Pressable
              onPress={onPressRetry}
              style={styles.retryBtn}
              accessibilityRole="button"
              accessibilityLabel="Retry"
              testID={testID ? `${testID}-retry` : undefined}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : isLoading ? (
        <View style={styles.centeredFill} testID={testID ? `${testID}-loading` : undefined}>
          <Text style={styles.bodyMuted}>Loading…</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centeredFill}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.bodyMuted}>No messages yet. Say hi!</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          inverted
          renderItem={({ item }) => {
            const direction = item.sender === "user" ? "outgoing" : "incoming";
            return (
              <View key={item.id}>
                {item.attachments?.map((att) => (
                  <View
                    key={att.id}
                    style={direction === "outgoing" ? styles.attachOut : styles.attachIn}
                  >
                    <AttachmentTile
                      type={att.type}
                      uri={att.uri}
                      filename={att.filename}
                      fileSize={att.fileSize}
                      testID={testID ? `${testID}-attach-${att.id}` : undefined}
                    />
                  </View>
                ))}
                <ChatBubble
                  direction={direction}
                  message={item.text}
                  formattedTime={formatMessageTime(item.sentAt)}
                  status={item.status === "failed" ? undefined : item.status}
                  testID={testID ? `${testID}-msg-${item.id}` : undefined}
                />
              </View>
            );
          }}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingIndicator} accessibilityLabel="Salon is typing">
                <Text style={styles.typingText}>typing…</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Quick replies */}
      {quickReplies.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickReplies}
          testID={testID ? `${testID}-quick-replies` : undefined}
        >
          {quickReplies.map((label) => (
            <QuickReplyChip
              key={label}
              label={label}
              onPress={() => onPressQuickReply(label)}
              testID={testID ? `${testID}-qr-${label}` : undefined}
            />
          ))}
        </ScrollView>
      ) : null}

      {/* Composer */}
      {!thread.isBlocked ? (
        <View style={styles.composer}>
          {onPressAttach ? (
            <Pressable
              onPress={onPressAttach}
              style={styles.attachBtn}
              accessibilityRole="button"
              accessibilityLabel="Attach file"
              hitSlop={8}
              testID={testID ? `${testID}-attach-btn` : undefined}
            >
              <Text style={styles.attachBtnText}>+</Text>
            </Pressable>
          ) : null}
          <TextInput
            style={styles.composerInput}
            placeholder="Type a message"
            placeholderTextColor={colors.textMuted}
            value={composerText}
            onChangeText={onComposerChange}
            multiline
            numberOfLines={1}
            maxFontSizeMultiplier={1.5}
            accessibilityLabel="Type a message"
            testID={testID ? `${testID}-composer` : undefined}
          />
          <Pressable
            onPress={onPressSend}
            disabled={!canSend}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSend }}
            testID={testID ? `${testID}-send` : undefined}
          >
            <Text style={[styles.sendBtnText, !canSend && styles.sendBtnTextDisabled]}>▶</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    color: colors.foreground,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.warmOat,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    ...textStyles.label,
    color: colors.foreground,
  },
  headerName: {
    ...textStyles.heading4,
    color: colors.foreground,
    flex: 1,
  },
  moreBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  moreBtnText: {
    fontSize: 22,
    color: colors.foreground,
  },
  messageList: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s2,
  },
  attachIn: {
    alignSelf: "flex-start",
    marginBottom: spacing.s1,
  },
  attachOut: {
    alignSelf: "flex-end",
    marginBottom: spacing.s1,
  },
  typingIndicator: {
    alignSelf: "flex-start",
    paddingVertical: spacing.s2,
  },
  typingText: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  quickReplies: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s2,
    gap: spacing.s2,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s2,
    gap: spacing.s2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  attachBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  attachBtnText: {
    fontSize: 24,
    color: colors.textMuted,
  },
  composerInput: {
    flex: 1,
    minHeight: spacing.touchTarget,
    maxHeight: spacing.touchTarget * 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    ...textStyles.body,
    color: colors.foreground,
  },
  sendBtn: {
    width: spacing.s8,
    height: spacing.s8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.s1,
  },
  sendBtnDisabled: {
    backgroundColor: colors.disabled,
  },
  sendBtnText: {
    fontSize: 14,
    color: colors.white,
  },
  sendBtnTextDisabled: {
    color: colors.surface,
  },
  centeredFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s3,
    padding: spacing.pageHorizontal,
  },
  emptyIcon: {
    fontSize: 40,
  },
  bodyMuted: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  errorGlyph: {
    fontSize: 32,
    color: colors.error,
  },
  retryBtn: {
    minHeight: spacing.touchTarget,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    ...textStyles.label,
    color: colors.primary,
  },
});
