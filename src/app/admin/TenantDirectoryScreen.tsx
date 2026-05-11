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
import type { TenantRecord, TenantFilter, TenantStatus } from "./platformAdminTypes";

export type TenantDirectoryScreenProps = {
  loading: boolean;
  error: string | null;
  tenants: TenantRecord[];
  filter: TenantFilter;
  onChangeFilter: (f: TenantFilter) => void;
  onSelectTenant: (tenantId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const STATUS_COLORS: Record<TenantStatus, string> = {
  active: "#10b981",
  trial: "#3b82f6",
  suspended: "#ef4444",
  churned: "#6b7280",
};

export function TenantDirectoryScreen({
  loading,
  error,
  tenants,
  filter,
  onChangeFilter,
  onSelectTenant,
  onRetry,
  onBack,
  testID = "tenant-directory-screen",
}: TenantDirectoryScreenProps) {
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
        <Text style={styles.title}>Tenant Directory</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tenants…"
          value={queryText}
          onChangeText={(t) => {
            setQueryText(t);
            onChangeFilter({ ...filter, query: t });
          }}
          testID="search-input"
        />
      </View>

      <View style={styles.filterRow}>
        {(["active", "trial", "suspended", "churned"] as TenantStatus[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filter.status === s && styles.filterChipActive]}
            onPress={() => onChangeFilter({ ...filter, status: filter.status === s ? undefined : s })}
            testID={`filter-${s}`}
          >
            <Text style={[styles.filterChipText, filter.status === s && styles.filterChipTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list} testID="tenant-list">
        {tenants.length === 0 && (
          <Text style={styles.emptyText}>No tenants match current filters.</Text>
        )}
        {tenants.map((t) => (
          <TouchableOpacity
            key={t.tenantId}
            style={styles.tenantRow}
            onPress={() => onSelectTenant(t.tenantId)}
            testID={`tenant-row-${t.tenantId}`}
          >
            <View style={styles.tenantMain}>
              <Text style={styles.tenantName}>{t.displayName}</Text>
              <Text style={styles.tenantEmail}>{t.ownerEmail}</Text>
            </View>
            <View style={styles.tenantMeta}>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[t.status] }]}>
                <Text style={styles.statusText}>{t.status}</Text>
              </View>
              <Text style={styles.planText}>{t.plan}</Text>
              <Text style={styles.healthText}>Health: {t.healthScore}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.countText} testID="tenant-count">
        {tenants.length} tenant{tenants.length !== 1 ? "s" : ""}
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
  searchRow: { padding: 12, backgroundColor: "#ffffff" },
  searchInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 8, fontSize: 14 },
  filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 8, backgroundColor: "#ffffff", flexWrap: "wrap", gap: 8 },
  filterChip: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  filterChipActive: { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8" },
  filterChipText: { fontSize: 12, color: "#374151" },
  filterChipTextActive: { color: "#ffffff" },
  list: { flex: 1 },
  tenantRow: { backgroundColor: "#ffffff", padding: 16, marginHorizontal: 12, marginTop: 8, borderRadius: 8, flexDirection: "row", justifyContent: "space-between" },
  tenantMain: { flex: 1 },
  tenantName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  tenantEmail: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  tenantMeta: { alignItems: "flex-end", gap: 4 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { color: "#ffffff", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  planText: { fontSize: 11, color: "#6b7280" },
  healthText: { fontSize: 11, color: "#374151" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 32 },
  countText: { textAlign: "center", color: "#9ca3af", fontSize: 12, padding: 8 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
