/**
 * W46 — MessageArchiveScreen
 *
 * Search and browse archived message threads.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { AdminThread, MessageArchiveFilter } from "../../domains/messaging/messagingAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type MessageArchiveScreenProps = {
  loading: boolean;
  error: string | null;
  threads: AdminThread[];
  filter: MessageArchiveFilter;
  onFilterChange: <K extends keyof MessageArchiveFilter>(field: K, value: MessageArchiveFilter[K]) => void;
  onSearch: () => void;
  onOpenThread: (threadId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function MessageArchiveScreen({
  loading,
  error,
  threads,
  filter,
  onFilterChange,
  onSearch,
  onOpenThread,
  onRetry,
  onBack,
  testID = "message-archive-screen",
}: MessageArchiveScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Message Archive</Text>
      </View>

      {/* Search / filter bar */}
      <View style={styles.searchBar}>
        <TextInput
          value={filter.searchText ?? ""}
          onChangeText={(v) => onFilterChange("searchText", v || undefined)}
          placeholder="Search messages…"
          style={styles.searchInput}
          testID="search-input"
          accessibilityLabel="Search messages"
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        <Pressable onPress={onSearch} accessibilityRole="button" testID="search-btn" style={styles.searchBtn}>
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>
      </View>

      {/* Date range */}
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>From</Text>
          <TextInput
            value={filter.dateFrom ?? ""}
            onChangeText={(v) => onFilterChange("dateFrom", v || undefined)}
            placeholder="YYYY-MM-DD"
            style={styles.dateInput}
            testID="date-from-input"
            accessibilityLabel="Date from"
          />
        </View>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>To</Text>
          <TextInput
            value={filter.dateTo ?? ""}
            onChangeText={(v) => onFilterChange("dateTo", v || undefined)}
            placeholder="YYYY-MM-DD"
            style={styles.dateInput}
            testID="date-to-input"
            accessibilityLabel="Date to"
          />
        </View>
      </View>

      {loading ? <AdminLoadingState label="Searching archive…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}
      {!loading && !error && threads.length === 0 ? (
        <AdminEmptyState title="No Results" body="No archived threads match your search." />
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
            <Text style={styles.clientName} numberOfLines={1}>{thread.clientName}</Text>
            <Text style={styles.date}>{thread.lastMessageAt.slice(0, 10)}</Text>
          </View>
          {thread.subject ? (
            <Text style={styles.subject} numberOfLines={1}>{thread.subject}</Text>
          ) : null}
          <Text style={styles.preview} numberOfLines={2}>{thread.lastMessage}</Text>
          <Text style={styles.msgCount}>{thread.messageCount} messages</Text>
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
  searchBar: { flexDirection: "row", gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: brandTypography.regular,
    fontSize: 14,
    color: "#1A1A1A",
  },
  searchBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchBtnText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#FFFFFF" },
  dateRow: { flexDirection: "row", gap: 12 },
  dateField: { flex: 1, gap: 4 },
  dateLabel: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6B6B6B" },
  dateInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: brandTypography.regular,
    fontSize: 13,
    color: "#1A1A1A",
  },
  threadCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, gap: 6 },
  threadTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clientName: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#1A1A1A", flex: 1 },
  date: { fontFamily: brandTypography.regular, fontSize: 12, color: "#9CA3AF" },
  subject: { fontFamily: brandTypography.semibold, fontSize: 12, color: "#4B4B4B" },
  preview: { fontFamily: brandTypography.regular, fontSize: 13, color: "#6B6B6B" },
  msgCount: { fontFamily: brandTypography.regular, fontSize: 11, color: "#9CA3AF" },
});
