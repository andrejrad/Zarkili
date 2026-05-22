import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";

import type { AiSuggestion, AiSuggestionFilter, AiSuggestionQueueSummary } from "./aiAdminTypes";

export type AiSuggestionQueueScreenProps = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  suggestions: AiSuggestion[];
  summary: AiSuggestionQueueSummary | null;
  filter: AiSuggestionFilter;
  onChangeFilter: (filter: AiSuggestionFilter) => void;
  onApprove: (suggestionId: string, note?: string) => void;
  onReject: (suggestionId: string, note?: string) => void;
  onApproveAllPending: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const FILTER_TABS: { label: string; kind?: AiSuggestion["kind"] }[] = [
  { label: "All" },
  { label: "Content", kind: "content" },
  { label: "Campaign", kind: "campaign" },
  { label: "Schedule", kind: "scheduling" },
  { label: "Pricing", kind: "pricing" },
];

function decisionColor(status: AiSuggestion["status"]): string {
  switch (status) {
    case "approved": return "#10b981";
    case "rejected": return "#ef4444";
    case "overridden": return "#6366f1";
    default: return "#f59e0b";
  }
}

export function AiSuggestionQueueScreen({
  loading,
  saving,
  error,
  suggestions,
  summary,
  filter,
  onChangeFilter,
  onApprove,
  onReject,
  onApproveAllPending,
  onRetry,
  onBack,
  testID = "ai-suggestion-queue-screen",
}: AiSuggestionQueueScreenProps) {
  if (loading) {
    return (
      <View style={styles.center} testID={testID}>
        <ActivityIndicator testID="loading-indicator" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center} testID={testID}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRetry} testID="retry-btn" style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pendingCount = summary?.pendingCount ?? 0;

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backLabel}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Review Queue</Text>
        <TouchableOpacity
          onPress={onApproveAllPending}
          disabled={pendingCount === 0 || saving}
          testID="approve-all-btn"
        >
          <Text style={[styles.approveAllLabel, (pendingCount === 0 || saving) && styles.disabled]}>
            Approve All ({pendingCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary strip */}
      {summary && (
        <View style={styles.summaryStrip} testID="summary-strip">
          <View style={[styles.chip, { backgroundColor: "rgba(245,158,11,0.1)" }]}>
            <Text style={{ color: "#b45309", fontSize: 13, fontWeight: "600" }}>
              {summary.pendingCount} pending
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: "rgba(16,185,129,0.1)" }]}>
            <Text style={{ color: "#047857", fontSize: 13, fontWeight: "600" }}>
              {summary.approvedToday} approved today
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
            <Text style={{ color: "#b91c1c", fontSize: 13, fontWeight: "600" }}>
              {summary.rejectedToday} rejected today
            </Text>
          </View>
        </View>
      )}

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
        testID="filter-tabs"
      >
        {FILTER_TABS.map((tab) => {
          const active = filter.kind === tab.kind;
          return (
            <TouchableOpacity
              key={tab.label}
              onPress={() => onChangeFilter({ ...filter, kind: tab.kind })}
              style={[styles.tab, active && styles.tabActive]}
              testID={`tab-${tab.label.toLowerCase()}`}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search suggestions…"
          value={filter.search ?? ""}
          onChangeText={(t) => onChangeFilter({ ...filter, search: t || undefined })}
          testID="search-input"
        />
      </View>

      {/* List */}
      {suggestions.length === 0 ? (
        <View style={styles.emptyState} testID="empty-state">
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyTitle}>Queue is clear</Text>
          <Text style={styles.emptySubtitle}>No AI suggestions match the current filters.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} testID="suggestion-list">
          {suggestions.map((s) => (
            <View key={s.suggestionId} style={styles.card} testID={`suggestion-${s.suggestionId}`}>
              <View style={styles.cardHeader}>
                <View style={[styles.kindBadge, { backgroundColor: "#eff6ff" }]}>
                  <Text style={styles.kindBadgeText}>{s.kind}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${decisionColor(s.status)}20` }]}>
                  <Text style={[styles.statusBadgeText, { color: decisionColor(s.status) }]}>{s.status}</Text>
                </View>
                <Text style={styles.confidence}>{Math.round(s.confidenceScore * 100)}% confidence</Text>
              </View>
              <Text style={styles.inputSummary} numberOfLines={2}>{s.inputSummary}</Text>
              <Text style={styles.outputPreview} numberOfLines={3}>{s.outputPreview}</Text>
              <Text style={styles.meta}>{s.model} · {s.generatedAt.slice(0, 10)}</Text>
              {s.status === "pending" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => onApprove(s.suggestionId, undefined)}
                    style={styles.approveBtn}
                    testID={`approve-${s.suggestionId}`}
                  >
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onReject(s.suggestionId, undefined)}
                    style={styles.rejectBtn}
                    testID={`reject-${s.suggestionId}`}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backLabel: { fontSize: 16, color: "#007AFF" },
  title: { fontSize: 18, fontWeight: "600", color: "#1a1a1a" },
  approveAllLabel: { fontSize: 14, color: "#10b981", fontWeight: "600" },
  disabled: { opacity: 0.4 },
  errorText: { fontSize: 15, color: "#ef4444", textAlign: "center", marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#007AFF", borderRadius: 8 },
  retryText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  summaryStrip: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  chip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tabBar: { maxHeight: 48, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  tabBarContent: { paddingHorizontal: 12, gap: 4, alignItems: "center" },
  tab: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  tabActive: { backgroundColor: "#eff6ff" },
  tabText: { fontSize: 14, color: "#888" },
  tabTextActive: { color: "#007AFF", fontWeight: "600" },
  searchRow: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  searchInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  scroll: { flex: 1 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: "#888", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    padding: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  kindBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  kindBadgeText: { fontSize: 11, color: "#1d4ed8", fontWeight: "600", textTransform: "uppercase" },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusBadgeText: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  confidence: { fontSize: 12, color: "#666", marginLeft: "auto" as any },
  inputSummary: { fontSize: 12, color: "#888", fontStyle: "italic", marginBottom: 6 },
  outputPreview: { fontSize: 14, color: "#333", lineHeight: 20, marginBottom: 8 },
  meta: { fontSize: 12, color: "#aaa", marginBottom: 8 },
  actionRow: { flexDirection: "row", gap: 10 },
  approveBtn: {
    flex: 1,
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  approveBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  rejectBtnText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },
});
