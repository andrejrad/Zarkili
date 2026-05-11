/**
 * MessagingExtrasScreen.tsx — W31 Batch K (K.2)
 *
 * Exports:
 *   ThreadActionsSheet      — mute / archive / block / report actions sheet
 *   MessageSearchScreen     — full-screen search within a thread
 *   ReadReceiptToggleSheet  — toggle read-receipt visibility
 *   DeliveryFailureBanner   — inline banner with retry for failed send
 */

import { useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Banner } from "../../shared/ui/Banner";
import { InputField } from "../../shared/ui/InputField";
import { ModalSheet } from "../../shared/ui/ModalSheet";
import { PreferenceToggleRow } from "../../shared/ui/PreferenceToggleRow";
import { SearchSuggestionRow } from "../../shared/ui/SearchSuggestionRow";
import { colors, spacing } from "../../shared/ui/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThreadActionsSheetProps = {
  visible: boolean;
  isMuted: boolean;
  isArchived: boolean;
  onMuteToggle: () => void;
  onArchiveToggle: () => void;
  onBlockUser: () => void;
  onReportMessage: () => void;
  onDismiss: () => void;
  testID?: string;
};

export type MessageSearchHit = {
  id: string;
  message: string;
  sender: string;
  timestamp: string;
};

export type MessageSearchScreenProps = {
  onSearch: (query: string) => MessageSearchHit[];
  onSelectHit: (id: string) => void;
  onClose: () => void;
  testID?: string;
};

export type ReadReceiptToggleSheetProps = {
  visible: boolean;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onDismiss: () => void;
  testID?: string;
};

export type DeliveryFailureBannerProps = {
  visible: boolean;
  onRetry: () => void;
  onDismiss: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// ThreadActionsSheet
// ---------------------------------------------------------------------------

export function ThreadActionsSheet({
  visible,
  isMuted,
  isArchived,
  onMuteToggle,
  onArchiveToggle,
  onBlockUser,
  onReportMessage,
  onDismiss,
  testID,
}: ThreadActionsSheetProps) {
  const actions = [
    {
      id: "mute",
      label: isMuted ? "Unmute conversation" : "Mute conversation",
      icon: isMuted ? "🔔" : "🔕",
      onPress: onMuteToggle,
      destructive: false,
    },
    {
      id: "archive",
      label: isArchived ? "Unarchive conversation" : "Archive conversation",
      icon: isArchived ? "📬" : "📦",
      onPress: onArchiveToggle,
      destructive: false,
    },
    {
      id: "block",
      label: "Block user",
      icon: "🚫",
      onPress: onBlockUser,
      destructive: true,
    },
    {
      id: "report",
      label: "Report message",
      icon: "⚑",
      onPress: onReportMessage,
      destructive: true,
    },
  ];

  return (
    <ModalSheet
      visible={visible}
      onClose={onDismiss}
      title="Conversation options"
      testID={testID}
    >
      <View style={styles.actionList}>
        {actions.map((action, idx) => (
          <Pressable
            key={action.id}
            onPress={() => {
              action.onPress();
              onDismiss();
            }}
            accessibilityRole="button"
            style={[
              styles.actionRow,
              idx < actions.length - 1 && styles.actionRowBorder,
            ]}
            testID={testID ? `${testID}-${action.id}` : undefined}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text
              style={[
                styles.actionLabel,
                action.destructive && styles.actionLabelDestructive,
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// MessageSearchScreen
// ---------------------------------------------------------------------------

export function MessageSearchScreen({
  onSearch,
  onSelectHit,
  onClose,
  testID,
}: MessageSearchScreenProps) {
  const [query, setQuery] = useState("");
  const results = query.trim().length >= 2 ? onSearch(query.trim()) : [];

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <View style={styles.searchHeader}>
        <View style={styles.searchInputWrap}>
          <InputField
            value={query}
            onChangeText={setQuery}
            variant="text"
            placeholder="Search messages…"
            testID={testID ? `${testID}-input` : undefined}
          />
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={styles.cancelBtn}
          testID={testID ? `${testID}-cancel` : undefined}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={results.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          query.trim().length >= 2 ? (
            <View>
              <Text
                style={styles.emptyText}
                testID={testID ? `${testID}-empty` : undefined}
              >
                No messages found for "{query}"
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <SearchSuggestionRow
            type="recent"
            label={item.sender}
            onPress={() => onSelectHit(item.id)}
            testID={testID ? `${testID}-hit-${item.id}` : undefined}
          />
        )}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// ReadReceiptToggleSheet
// ---------------------------------------------------------------------------

export function ReadReceiptToggleSheet({
  visible,
  enabled,
  onToggle,
  onDismiss,
  testID,
}: ReadReceiptToggleSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      onClose={onDismiss}
      title="Read receipts"
      testID={testID}
    >
      <View style={styles.sheetContent}>
        <PreferenceToggleRow
          label="Show read receipts"
          helperText="Let others know when you've read their messages."
          value={enabled}
          onValueChange={onToggle}
          testID={testID ? `${testID}-toggle` : undefined}
        />
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          style={styles.doneBtn}
          testID={testID ? `${testID}-done` : undefined}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// DeliveryFailureBanner
// ---------------------------------------------------------------------------

export function DeliveryFailureBanner({
  visible,
  onRetry,
  onDismiss,
  testID,
}: DeliveryFailureBannerProps) {
  if (!visible) return null;

  return (
    <View testID={testID}>
      <Banner
        variant="error"
        message="Message failed to send."
        actionLabel="Retry"
        onAction={onRetry}
        onDismiss={onDismiss}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s2,
    gap: spacing.s2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputWrap: { flex: 1 },
  cancelBtn: { paddingHorizontal: spacing.s2, paddingVertical: spacing.s2 },
  cancelBtnText: { fontSize: 15, color: colors.primary, fontWeight: "500" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.pageHorizontal,
  },
  emptyText: { fontSize: 15, color: colors.textMuted, textAlign: "center" },
  // ThreadActionsSheet
  actionList: { paddingHorizontal: spacing.pageHorizontal, paddingBottom: spacing.s4 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s4,
    gap: spacing.s3,
  },
  actionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 16, color: colors.foreground },
  actionLabelDestructive: { color: colors.error },
  // ReadReceiptToggleSheet
  sheetContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s6,
    gap: spacing.s4,
  },
  doneBtn: {
    height: spacing.touchTarget,
    borderRadius: 99,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  doneBtnText: { fontSize: 15, fontWeight: "600", color: colors.surface },
});
