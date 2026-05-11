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
import type { AiAuditLogEntry, AiAuditFilter, AiAuditDecision } from "./aiAdminTypes";
import type { AiFeatureKey } from "../../shared/ai";
import { aiFeatureKeys } from "../../shared/ai";

export type AiAuditLogScreenProps = {
  loading: boolean;
  error: string | null;
  entries: AiAuditLogEntry[];
  filter: AiAuditFilter;
  totalCount: number;
  onChangeFilter: (filter: AiAuditFilter) => void;
  onExportCsv: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const DECISION_OPTIONS: { label: string; value?: AiAuditDecision }[] = [
  { label: "All" },
  { label: "Auto", value: "auto_applied" },
  { label: "Approved", value: "human_approved" },
  { label: "Rejected", value: "human_rejected" },
  { label: "Overridden", value: "overridden" },
];

function decisionColor(decision: AiAuditDecision): string {
  switch (decision) {
    case "auto_applied": return "#6366f1";
    case "human_approved": return "#10b981";
    case "human_rejected": return "#ef4444";
    case "overridden": return "#f59e0b";
  }
}

function decisionLabel(decision: AiAuditDecision): string {
  switch (decision) {
    case "auto_applied": return "Auto";
    case "human_approved": return "Approved";
    case "human_rejected": return "Rejected";
    case "overridden": return "Overridden";
  }
}

export function AiAuditLogScreen({
  loading,
  error,
  entries,
  filter,
  totalCount,
  onChangeFilter,
  onExportCsv,
  onRetry,
  onBack,
  testID = "ai-audit-log-screen",
}: AiAuditLogScreenProps) {
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

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backLabel}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Audit Log</Text>
        <TouchableOpacity onPress={onExportCsv} testID="export-btn">
          <Text style={styles.exportLabel}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar} testID="filter-bar">
        <TextInput
          style={styles.searchInput}
          placeholder="Search entries…"
          value={filter.search ?? ""}
          onChangeText={(t) => onChangeFilter({ ...filter, search: t || undefined })}
          testID="search-input"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }}
          contentContainerStyle={{ gap: 6 }}
        >
          {/* Decision filter chips */}
          {DECISION_OPTIONS.map((opt) => {
            const active = filter.decision === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => onChangeFilter({ ...filter, decision: opt.value })}
                style={[styles.chip, active && styles.chipActive]}
                testID={`decision-chip-${opt.label.toLowerCase()}`}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <Text style={styles.summaryText}>{totalCount} entries</Text>
      </View>

      {/* Entries */}
      {entries.length === 0 ? (
        <View style={styles.emptyState} testID="empty-state">
          <Text style={styles.emptyTitle}>No entries found</Text>
          <Text style={styles.emptySubtitle}>Adjust filters to see AI audit log entries.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} testID="audit-entries">
          {entries.map((e) => (
            <View key={e.entryId} style={styles.entryRow} testID={`entry-${e.entryId}`}>
              <View style={styles.entryLeft}>
                <View style={styles.entryTopRow}>
                  <Text style={styles.featureTag}>
                    {e.featureKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <Text style={styles.modelTag}>{e.model}</Text>
                  <Text style={styles.inputHash}>{e.inputHash}</Text>
                </View>
                <Text style={styles.outputSnippet} numberOfLines={2}>{e.outputSnippet}</Text>
                <Text style={styles.actorRow}>{e.actorDisplay} · {e.latencyMs}ms · {e.createdAt.slice(0, 10)}</Text>
                {e.safetyFlags.length > 0 && (
                  <Text style={styles.safetyFlags}>⚠ {e.safetyFlags.join(", ")}</Text>
                )}
              </View>
              <View
                style={[
                  styles.decisionBadge,
                  { backgroundColor: `${decisionColor(e.decision)}20` },
                ]}
              >
                <Text style={[styles.decisionText, { color: decisionColor(e.decision) }]}>
                  {decisionLabel(e.decision)}
                </Text>
              </View>
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
  exportLabel: { fontSize: 14, color: "#007AFF" },
  errorText: { fontSize: 15, color: "#ef4444", textAlign: "center", marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#007AFF", borderRadius: 8 },
  retryText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  filterBar: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  chip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#f0f0f0",
  },
  chipActive: { backgroundColor: "#eff6ff" },
  chipText: { fontSize: 13, color: "#666" },
  chipTextActive: { color: "#007AFF", fontWeight: "600" },
  summaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  summaryText: { fontSize: 13, color: "#555" },
  scroll: { flex: 1 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: "#888", textAlign: "center" },
  entryRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    padding: 12,
    alignItems: "flex-start",
  },
  entryLeft: { flex: 1, marginRight: 10 },
  entryTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  featureTag: { fontSize: 12, fontWeight: "600", color: "#1d4ed8" },
  modelTag: { fontSize: 11, color: "#888" },
  inputHash: { fontSize: 11, fontFamily: "monospace", color: "#aaa" },
  outputSnippet: { fontSize: 13, color: "#333", lineHeight: 18, marginBottom: 4 },
  actorRow: { fontSize: 11, color: "#aaa" },
  safetyFlags: { fontSize: 11, color: "#ef4444", marginTop: 2 },
  decisionBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  decisionText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
});
