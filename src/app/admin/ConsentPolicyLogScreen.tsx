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
import type { ConsentPolicyEntry } from "./platformAdminTypes";

export type ConsentPolicyLogScreenProps = {
  loading: boolean;
  error: string | null;
  entries: ConsentPolicyEntry[];
  tenantFilter: string;
  onChangeTenantFilter: (tenantId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

export function ConsentPolicyLogScreen({
  loading,
  error,
  entries,
  tenantFilter,
  onChangeTenantFilter,
  onRetry,
  onBack,
  testID = "consent-policy-log-screen",
}: ConsentPolicyLogScreenProps) {
  const [filterText, setFilterText] = useState(tenantFilter);

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
        <Text style={styles.title}>Consent & Policy Log</Text>
      </View>

      <View style={styles.filterRow}>
        <TextInput
          style={styles.filterInput}
          placeholder="Filter by tenant ID…"
          value={filterText}
          onChangeText={(t) => {
            setFilterText(t);
            onChangeTenantFilter(t);
          }}
          testID="tenant-filter-input"
        />
      </View>

      <ScrollView style={styles.scroll} testID="consent-list">
        {entries.length === 0 && (
          <Text style={styles.emptyText}>No consent records found.</Text>
        )}
        {entries.map((e) => (
          <View key={e.entryId} style={styles.entryRow} testID={`entry-${e.entryId}`}>
            <View style={styles.entryLeft}>
              <Text style={styles.userEmail}>{e.userEmail}</Text>
              <Text style={styles.tenantId}>{e.tenantId}</Text>
              <Text style={styles.policyVersion}>Policy v{e.policyVersion}</Text>
              <Text style={styles.date}>Given: {e.consentGivenAt.slice(0, 10)}</Text>
              {e.consentWithdrawnAt && (
                <Text style={styles.withdrawn}>Withdrawn: {e.consentWithdrawnAt.slice(0, 10)}</Text>
              )}
            </View>
            <View style={[styles.statusBadge, e.active ? styles.activeStatus : styles.inactiveStatus]}>
              <Text style={styles.statusText}>{e.active ? "Active" : "Withdrawn"}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.countText} testID="entry-count">{entries.length} records</Text>
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
  filterInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 8, fontSize: 14 },
  scroll: { flex: 1 },
  entryRow: { backgroundColor: "#ffffff", marginHorizontal: 12, marginTop: 6, padding: 14, borderRadius: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  entryLeft: { flex: 1 },
  userEmail: { fontSize: 13, fontWeight: "600", color: "#111827" },
  tenantId: { fontSize: 11, color: "#9ca3af" },
  policyVersion: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  date: { fontSize: 11, color: "#6b7280" },
  withdrawn: { fontSize: 11, color: "#ef4444" },
  statusBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  activeStatus: { backgroundColor: "#10b981" },
  inactiveStatus: { backgroundColor: "#9ca3af" },
  statusText: { color: "#ffffff", fontSize: 10, fontWeight: "700" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 32 },
  countText: { textAlign: "center", fontSize: 12, color: "#9ca3af", padding: 8 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
