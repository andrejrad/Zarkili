import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { PlatformAuditEntry, PlatformAuditFilter } from "./platformAdminTypes";

export type PlatformAuditLogScreenProps = {
  loading: boolean;
  error: string | null;
  entries: PlatformAuditEntry[];
  filter: PlatformAuditFilter;
  totalCount: number;
  onChangeFilter: (f: PlatformAuditFilter) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

export function PlatformAuditLogScreen({
  loading,
  error,
  entries,
  filter,
  totalCount,
  onChangeFilter,
  onRetry,
  onBack,
  testID = "platform-audit-log-screen",
}: PlatformAuditLogScreenProps) {
  const [queryText, setQueryText] = useState(filter.query ?? "");

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
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Platform Audit Log</Text>
      </View>

      <View style={styles.filterRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by action…"
          value={queryText}
          onChangeText={(t) => {
            setQueryText(t);
            onChangeFilter({ ...filter, query: t });
          }}
          testID="query-input"
        />
      </View>

      <View style={styles.actorFilterRow}>
        {(["platform_admin", "system", "tenant_owner"] as PlatformAuditEntry["actorKind"][]).map((k) => (
          <TouchableOpacity
            key={k}
            style={[styles.chip, filter.actorKind === k && styles.chipActive]}
            onPress={() => onChangeFilter({ ...filter, actorKind: filter.actorKind === k ? undefined : k })}
            testID={`actor-filter-${k}`}
          >
            <Text style={[styles.chipText, filter.actorKind === k && styles.chipTextActive]}>
              {k.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} testID="audit-log-list">
        {entries.length === 0 && (
          <Text style={styles.emptyText}>No audit entries found.</Text>
        )}
        {entries.map((e) => (
          <View key={e.entryId} style={styles.entryRow} testID={`entry-${e.entryId}`}>
            <View style={styles.entryMeta}>
              <Text style={styles.entryAction}>{e.action}</Text>
              <Text style={styles.entryDate}>{e.occurredAt?.slice?.(0, 19).replace("T", " ")}</Text>
            </View>
            <View style={styles.entryDetail}>
              <Text style={styles.entryActor}>{e.actorKind} · {e.actorId.slice(0, 8)}…</Text>
              <Text style={styles.entryTarget}>{e.targetKind}: {e.targetId.slice(0, 12)}…</Text>
              {e.detail ? <Text style={styles.entryNote}>{e.detail}</Text> : null}
            </View>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.countText} testID="entry-count">
        Showing {entries.length} / {totalCount} entries
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  backText: { color: "#6b7280", marginRight: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  filterRow: { padding: 12, backgroundColor: "#ffffff" },
  searchInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 8, fontSize: 14 },
  actorFilterRow: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 8, backgroundColor: "#ffffff", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  chipActive: { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8" },
  chipText: { fontSize: 11, color: "#374151" },
  chipTextActive: { color: "#ffffff" },
  scroll: { flex: 1 },
  entryRow: { backgroundColor: "#ffffff", marginHorizontal: 12, marginTop: 6, padding: 12, borderRadius: 8 },
  entryMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  entryAction: { fontSize: 13, fontWeight: "700", color: "#111827" },
  entryDate: { fontSize: 11, color: "#9ca3af" },
  entryDetail: { gap: 2 },
  entryActor: { fontSize: 12, color: "#6b7280" },
  entryTarget: { fontSize: 12, color: "#6b7280" },
  entryNote: { fontSize: 12, color: "#374151", marginTop: 2 },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 32 },
  countText: { textAlign: "center", color: "#9ca3af", fontSize: 12, padding: 8 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
