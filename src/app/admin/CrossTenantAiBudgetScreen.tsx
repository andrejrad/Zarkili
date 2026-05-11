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
import type { TenantAiBudgetOverride } from "./platformAdminTypes";

export type CrossTenantAiBudgetScreenProps = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  overrides: TenantAiBudgetOverride[];
  onSetOverride: (tenantId: string, capUsd: number) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

export function CrossTenantAiBudgetScreen({
  loading,
  saving,
  error,
  overrides,
  onSetOverride,
  onRetry,
  onBack,
  testID = "cross-tenant-ai-budget-screen",
}: CrossTenantAiBudgetScreenProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

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
        <Text style={styles.title}>Cross-Tenant AI Budget</Text>
      </View>

      <Text style={styles.description}>
        Override the monthly AI spending cap per tenant. Overrides take effect at next billing cycle.
      </Text>

      <ScrollView style={styles.scroll}>
        {overrides.length === 0 && (
          <Text style={styles.emptyText}>No tenant budget overrides configured.</Text>
        )}
        {overrides.map((row) => {
          const spendPct = row.platformCapUsd > 0
            ? Math.min(100, Math.round((row.currentSpendMtdUsd / row.platformCapUsd) * 100))
            : 0;

          return (
            <View key={row.tenantId} style={styles.row} testID={`budget-row-${row.tenantId}`}>
              <View style={styles.rowInfo}>
                <Text style={styles.tenantName}>{row.tenantName}</Text>
                <Text style={styles.spendText}>
                  ${row.currentSpendMtdUsd.toFixed(2)} / ${row.platformCapUsd.toFixed(2)} USD ({spendPct}%)
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${spendPct}%` as `${number}%`,
                        backgroundColor: spendPct >= 90 ? "#ef4444" : spendPct >= 70 ? "#f59e0b" : "#10b981",
                      },
                    ]}
                  />
                </View>
                {row.overriddenAt && (
                  <Text style={styles.metaText}>Overridden {row.overriddenAt.slice(0, 10)} by {row.overriddenBy}</Text>
                )}
              </View>

              {editingId === row.tenantId ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.capInput}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="numeric"
                    placeholder="Cap USD"
                    testID={`cap-input-${row.tenantId}`}
                  />
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => {
                      const cap = parseFloat(editValue);
                      if (!isNaN(cap) && cap > 0) {
                        onSetOverride(row.tenantId, cap);
                        setEditingId(null);
                      }
                    }}
                    disabled={saving}
                    testID={`save-cap-${row.tenantId}`}
                  >
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setEditingId(null)}
                    testID={`cancel-cap-${row.tenantId}`}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    setEditingId(row.tenantId);
                    setEditValue(String(row.platformCapUsd));
                  }}
                  testID={`edit-btn-${row.tenantId}`}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  backText: { color: "#6b7280", marginRight: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  description: { fontSize: 13, color: "#6b7280", padding: 16 },
  scroll: { flex: 1 },
  row: { backgroundColor: "#ffffff", marginHorizontal: 12, marginTop: 8, padding: 16, borderRadius: 8 },
  rowInfo: { marginBottom: 8 },
  tenantName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  spendText: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  progressBar: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, marginTop: 6 },
  progressFill: { height: 6, borderRadius: 3 },
  metaText: { fontSize: 10, color: "#d1d5db", marginTop: 4 },
  editRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  capInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 6, fontSize: 13, width: 80 },
  saveBtn: { backgroundColor: "#10b981", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  saveBtnText: { color: "#ffffff", fontWeight: "600", fontSize: 13 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  cancelBtnText: { color: "#6b7280", fontSize: 13 },
  editBtn: { alignSelf: "flex-start", backgroundColor: "#f3f4f6", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: "#d1d5db" },
  editBtnText: { color: "#374151", fontWeight: "600", fontSize: 13 },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 32 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
