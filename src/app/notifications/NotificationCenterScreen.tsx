/**
 * NotificationCenterScreen.tsx — F.4 Notification Center.
 *
 * Header: "Notifications" + "Mark all read" tertiary button.
 * Tabs: All | Bookings | Loyalty | Promos | System (SegmentedControl).
 * FlatList with date-group section headers via groupNotificationsByDate.
 * Permission banner (variant="info") when !hasPermission.
 * States: loading skeleton, empty per tab, error + retry.
 */

import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Banner,
  NotificationRow,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import {
  NotificationItem,
  NotificationTab,
  NOTIFICATION_TAB_LABELS,
  NOTIFICATION_TABS,
  filterNotificationsByTab,
  formatMessageTime,
  groupNotificationsByDate,
} from "../messaging/messagingHelpers";

export type NotificationCenterScreenProps = {
  notifications: NotificationItem[];
  activeTab: NotificationTab;
  onTabChange: (tab: NotificationTab) => void;
  onMarkAllRead: () => void;
  onPressNotification: (id: string) => void;
  onDismissNotification: (id: string) => void;
  hasPermission: boolean;
  onEnablePermissions: () => void;
  isLoading?: boolean;
  isError?: boolean;
  onPressRetry?: () => void;
  testID?: string;
};

type ListItem =
  | { kind: "header"; date: string }
  | { kind: "row"; notification: NotificationItem };

function buildListItems(
  groups: ReturnType<typeof groupNotificationsByDate>,
): ListItem[] {
  const items: ListItem[] = [];
  for (const group of groups) {
    items.push({ kind: "header", date: group.group });
    for (const n of group.items) {
      items.push({ kind: "row", notification: n });
    }
  }
  return items;
}

export function NotificationCenterScreen({
  notifications,
  activeTab,
  onTabChange,
  onMarkAllRead,
  onPressNotification,
  onDismissNotification,
  hasPermission,
  onEnablePermissions,
  isLoading,
  isError,
  onPressRetry,
  testID,
}: NotificationCenterScreenProps) {
  const filtered = filterNotificationsByTab(notifications, activeTab);
  const groups = groupNotificationsByDate(filtered);
  const listItems = buildListItems(groups);

  const tabOptions = NOTIFICATION_TABS.map((t) => ({
    value: t,
    label: NOTIFICATION_TAB_LABELS[t],
  }));

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable
          onPress={onMarkAllRead}
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
          testID={testID ? `${testID}-mark-all-read` : undefined}
        >
          <Text style={styles.markAllReadText}>Mark all read</Text>
        </Pressable>
      </View>

      {/* Permission banner */}
      {!hasPermission ? (
        <Banner
          variant="info"
          message="Enable notifications to stay updated on bookings and promotions."
          actionLabel="Enable"
          onAction={onEnablePermissions}
          testID={testID ? `${testID}-permission-banner` : undefined}
        />
      ) : null}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          accessibilityRole="tablist"
        >
          {tabOptions.map((opt) => {
            const selected = opt.value === activeTab;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onTabChange(opt.value as NotificationTab)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={opt.label}
                style={[styles.tabChip, selected && styles.tabChipActive]}
              >
                <Text style={[styles.tabChipText, selected && styles.tabChipTextActive]}>
                  {opt.label}
                </Text>
            </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Body */}
      {isLoading ? (
        <View
          style={styles.centerContent}
          testID={testID ? `${testID}-loading` : undefined}
        >
          <Text style={styles.bodyMuted}>Loading notifications…</Text>
        </View>
      ) : isError ? (
        <View
          style={styles.centerContent}
          testID={testID ? `${testID}-error` : undefined}
        >
          <Text style={styles.bodyMuted}>Something went wrong.</Text>
          {onPressRetry ? (
            <Pressable
              onPress={onPressRetry}
              style={styles.retryBtn}
              accessibilityRole="button"
              testID={testID ? `${testID}-retry` : undefined}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : listItems.length === 0 ? (
        <View
          style={styles.centerContent}
          testID={testID ? `${testID}-empty` : undefined}
        >
          <Text style={styles.bodyMuted}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item, idx) =>
            item.kind === "header" ? `header-${item.date}` : `row-${item.notification.id}-${idx}`
          }
          renderItem={({ item }) => {
            if (item.kind === "header") {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{item.date}</Text>
                </View>
              );
            }
            const n = item.notification;
            return (
              <NotificationRow
                tone={n.category as "booking" | "loyalty" | "promo" | "system" | "message"}
                title={n.title}
                preview={n.preview}
                formattedTime={formatMessageTime(n.receivedAt)}
                isUnread={!n.isRead}
                onPress={() => onPressNotification(n.id)}
                onDismiss={() => onDismissNotification(n.id)}
                testID={testID ? `${testID}-notification-${n.id}` : undefined}
              />
            );
          }}
        />
      )}
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
    justifyContent: "space-between",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...textStyles.heading3,
    color: colors.foreground,
  },
  markAllReadText: {
    ...textStyles.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
  tabsContainer: {
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: "center",
  },
  tabsContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    gap: spacing.s2,
  },
  tabChip: {
    height: 32,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    ...textStyles.bodySmall,
    color: colors.foreground,
    fontWeight: "500",
  },
  tabChipTextActive: {
    color: colors.white,
    fontWeight: "600",
  },
  sectionHeader: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s2,
    backgroundColor: colors.surface,
  },
  sectionHeaderText: {
    ...textStyles.label,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.s6,
    gap: spacing.s3,
  },
  bodyMuted: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: "600",
  },
});
