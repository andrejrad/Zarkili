/**
 * W46 — InboxTriageScreen
 *
 * Admin inbox: list threads with status filter, assign/resolve/archive actions.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { AdminThread, AdminThreadStatus } from "../../domains/messaging/messagingAdminModel";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const STATUS_FILTERS: { label: string; value: AdminThreadStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Assigned", value: "assigned" },
  { label: "Resolved", value: "resolved" },
  { label: "Archived", value: "archived" },
];

export type InboxTriageScreenProps = {
  loading: boolean;
  error: string | null;
  threads: AdminThread[];
  statusFilter: AdminThreadStatus | "all";
  onStatusFilter: (status: AdminThreadStatus | "all") => void;
  onOpenThread: (threadId: string) => void;
  onAssignThread: (threadId: string) => void;
  onResolveThread: (threadId: string) => void;
  onArchiveThread: (threadId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function InboxTriageScreen({
  loading,
  error,
  threads,
  statusFilter,
  onStatusFilter,
  onOpenThread,
  onAssignThread,
  onResolveThread,
  onArchiveThread,
  onRetry,
  onBack,
  testID = "inbox-triage-screen",
}: InboxTriageScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Inbox Triage</Text>
      </View>

      {/* Status filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {STATUS_FILTERS.map(({ label, value }) => (
          <Pressable
            key={value}
            onPress={() => onStatusFilter(value)}
            testID={`filter-${value}`}
            style={[styles.chip, statusFilter === value && styles.chipActive]}
          >
            <Text style={[styles.chipText, statusFilter === value && styles.chipTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? <AdminLoadingState label="Loading threads…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}
      {!loading && !error && threads.length === 0 ? (
        <AdminEmptyState title="No Threads" body="No threads match the current filter." />
      ) : null}

      {threads.map((thread) => (
        <Pressable
          key={thread.threadId}
          onPress={() => onOpenThread(thread.threadId)}
          testID={`thread-${thread.threadId}`}
          style={styles.threadCard}
          accessibilityRole="button"
        >
          <View style={styles.threadTop}>
            <Text style={styles.threadClient} numberOfLines={1}>{thread.clientName}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{thread.status}</Text>
            </View>
          </View>
          {thread.subject ? (
            <Text style={styles.threadSubject} numberOfLines={1}>{thread.subject}</Text>
          ) : null}
          <Text style={styles.threadPreview} numberOfLines={2}>{thread.lastMessage}</Text>
          {thread.unreadCount > 0 ? (
            <Text style={styles.unreadBadge} testID={`unread-${thread.threadId}`}>
              {thread.unreadCount} unread
            </Text>
          ) : null}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => onAssignThread(thread.threadId)}
              testID={`assign-${thread.threadId}`}
              style={styles.actionBtn}
              accessibilityRole="button"
            >
              <Text style={styles.actionBtnText}>Assign</Text>
            </Pressable>
            <Pressable
              onPress={() => onResolveThread(thread.threadId)}
              testID={`resolve-${thread.threadId}`}
              style={styles.actionBtn}
              accessibilityRole="button"
            >
              <Text style={styles.actionBtnText}>Resolve</Text>
            </Pressable>
            <Pressable
              onPress={() => onArchiveThread(thread.threadId)}
              testID={`archive-${thread.threadId}`}
              style={[styles.actionBtn, styles.actionBtnAlt]}
              accessibilityRole="button"
            >
              <Text style={[styles.actionBtnText, styles.actionBtnAltText]}>Archive</Text>
            </Pressable>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 12, backgroundColor: "#F2EDDD" },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { paddingVertical: 4 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6B6B6B" },
  title: { fontFamily: brandTypography.semibold, fontSize: 20, color: "#1A1A1A" },
  chips: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#E5E0D1",
  },
  chipActive: { backgroundColor: "#1A1A1A" },
  chipText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#4B4B4B" },
  chipTextActive: { color: "#FFFFFF", fontFamily: brandTypography.semibold },
  threadCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  threadTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  threadClient: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#1A1A1A", flex: 1 },
  statusBadge: {
    backgroundColor: "#E5E0D1",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontFamily: brandTypography.regular, fontSize: 11, color: "#4B4B4B" },
  threadSubject: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#4B4B4B" },
  threadPreview: { fontFamily: brandTypography.regular, fontSize: 13, color: "#6B6B6B" },
  unreadBadge: { fontFamily: brandTypography.semibold, fontSize: 12, color: "#DC2626" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1A1A1A",
  },
  actionBtnAlt: { backgroundColor: "#E5E0D1" },
  actionBtnText: { fontFamily: brandTypography.semibold, fontSize: 12, color: "#FFFFFF" },
  actionBtnAltText: { color: "#4B4B4B" },
});
