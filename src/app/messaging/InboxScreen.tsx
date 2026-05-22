/**
 * InboxScreen.tsx — F.1 Messaging Inbox.
 *
 * Header: "Messages" + compose (+) button.
 * Search bar (TextInput).
 * Tabs: All | Unread | Salons (SegmentedControl).
 * Thread rows (FlatList) with avatar, name, last-message preview, time, unread badge.
 * States: loading skeleton | empty | error | default.
 */

import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Banner, SegmentedControl, colors, radius, spacing, textStyles } from "../../shared/ui";

import {
  INBOX_TAB_LABELS,
  INBOX_TABS,
  filterThreadsByTab,
  formatThreadDate,
  type InboxTab,
  type ThreadSummary,
} from "./messagingHelpers";

export type InboxScreenProps = {
  threads: ThreadSummary[];
  activeTab: InboxTab;
  searchQuery: string;
  onTabChange: (tab: InboxTab) => void;
  onSearchChange: (query: string) => void;
  onPressThread: (threadId: string) => void;
  onPressCompose: () => void;
  onOpenNotificationCenter?: () => void;
  isLoading?: boolean;
  isError?: boolean;
  onPressRetry?: () => void;
  testID?: string;
};

export function InboxScreen({
  threads,
  activeTab,
  searchQuery,
  onTabChange,
  onSearchChange,
  onPressThread,
  onPressCompose,
  onOpenNotificationCenter,
  isLoading,
  isError,
  onPressRetry,
  testID,
}: InboxScreenProps) {
  const filtered = filterThreadsByTab(threads, activeTab).filter((t) =>
    searchQuery.trim() === ""
      ? true
      : t.salonName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Messages</Text>
        {onOpenNotificationCenter && (
          <Pressable
            onPress={onOpenNotificationCenter}
            style={[styles.composeBtn, styles.notifBtn]}
            accessibilityRole="button"
            accessibilityLabel="Notification centre"
            hitSlop={8}
          >
            <Text style={styles.composeBtnText}>🔔</Text>
          </Pressable>
        )}
        <Pressable
          onPress={onPressCompose}
          style={styles.composeBtn}
          accessibilityRole="button"
          accessibilityLabel="Compose new message"
          hitSlop={8}
          testID={testID ? `${testID}-compose` : undefined}
        >
          <Text style={styles.composeBtnText}>+</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages…"
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          accessibilityLabel="Search messages"
          testID={testID ? `${testID}-search` : undefined}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <SegmentedControl
          options={INBOX_TABS.map((t) => ({ label: INBOX_TAB_LABELS[t], value: t }))}
          value={activeTab}
          onChange={(v) => onTabChange(v as InboxTab)}
          testID={testID ? `${testID}-tabs` : undefined}
        />
      </View>

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
        <View testID={testID ? `${testID}-loading` : undefined}>
          {Array.from({ length: 5 }).map((_, i) => (
             
            <View key={i} style={styles.skeletonRow} />
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centeredFill} testID={testID ? `${testID}-empty` : undefined}>
          <Text style={styles.emptyIcon}>✉</Text>
          <Text style={styles.bodyMuted}>
            {activeTab === "unread" ? "No unread messages" : "No messages yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThreadRow
              thread={item}
              onPress={() => onPressThread(item.id)}
              testID={testID ? `${testID}-thread-${item.id}` : undefined}
            />
          )}
        />
      )}
    </View>
  );
}

/* ---------- ThreadRow sub-component ---------- */

type ThreadRowProps = {
  thread: ThreadSummary;
  onPress: () => void;
  testID?: string;
};

function ThreadRow({ thread, onPress, testID }: ThreadRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.threadRow,
        thread.unreadCount > 0 && styles.threadRowUnread,
        pressed && styles.threadRowPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${thread.salonName}: ${thread.lastMessage}`}
      testID={testID}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>
          {thread.salonName.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.threadContent}>
        <View style={styles.threadTopRow}>
          <Text style={[styles.salonName, thread.unreadCount > 0 && styles.salonNameUnread]}>
            {thread.salonName}
          </Text>
          <Text style={styles.threadTime}>{formatThreadDate(thread.lastMessageAt)}</Text>
        </View>
        <View style={styles.threadBottomRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {thread.isMuted ? "🔇 " : ""}{thread.lastMessage}
          </Text>
          {thread.unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{thread.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
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
    paddingTop: spacing.s6,
    paddingBottom: spacing.s3,
  },
  heading: {
    ...textStyles.heading2,
    color: colors.foreground,
    flex: 1,
  },
  composeBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  notifBtn: {
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  composeBtnText: {
    ...textStyles.heading3,
    color: colors.white,
    lineHeight: 28,
  },
  searchRow: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s3,
  },
  searchInput: {
    height: spacing.touchTarget,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s4,
    ...textStyles.body,
    color: colors.foreground,
  },
  tabs: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s3,
  },
  threadRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s3,
    minHeight: spacing.touchTarget,
    backgroundColor: colors.background,
  },
  threadRowUnread: {
    backgroundColor: colors.primary10,
  },
  threadRowPressed: {
    backgroundColor: colors.hover,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.warmOat,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarInitial: {
    ...textStyles.heading4,
    color: colors.foreground,
  },
  threadContent: {
    flex: 1,
    gap: spacing.s1,
  },
  threadTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  salonName: {
    ...textStyles.label,
    color: colors.foreground,
  },
  salonNameUnread: {
    fontWeight: "700",
  },
  threadTime: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },
  threadBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    flex: 1,
    marginRight: spacing.s2,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.mintFresh,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.s1,
  },
  unreadCount: {
    ...textStyles.labelSmall,
    color: colors.accentForeground,
    fontWeight: "700",
  },
  skeletonRow: {
    height: 72,
    marginHorizontal: spacing.pageHorizontal,
    marginBottom: spacing.s2,
    borderRadius: radius.md,
    backgroundColor: colors.border,
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
    color: colors.textMuted,
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
