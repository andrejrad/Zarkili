import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { FeatureFlag } from "./platformAdminTypes";

export type FeatureFlagConsoleScreenProps = {
  loading: boolean;
  saving?: boolean;
  error: string | null;
  /** Platform-wide flags */
  platformFlags: FeatureFlag[];
  /** Tenant-scoped flags for the currently selected tenant */
  tenantFlags: FeatureFlag[];
  selectedTenantId?: string;
  selectedTenantName?: string;
  onTogglePlatformFlag: (flagKey: string, enabled: boolean) => void;
  onToggleTenantFlag: (flagKey: string, tenantId: string, enabled: boolean) => void;
  onSaveAll: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

export function FeatureFlagConsoleScreen({
  loading,
  saving,
  error,
  platformFlags,
  tenantFlags,
  selectedTenantId,
  selectedTenantName,
  onTogglePlatformFlag,
  onToggleTenantFlag,
  onSaveAll,
  onRetry,
  onBack,
  testID = "feature-flag-console-screen",
}: FeatureFlagConsoleScreenProps) {
  const [filterText, setFilterText] = useState("");

  if (loading) {
    return (
      <View style={styles.center} testID={`${testID}-loading`}>
        <ActivityIndicator />
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

  const filteredPlatform = platformFlags.filter((f) =>
    filterText.length === 0 || f.flagKey.toLowerCase().includes(filterText.toLowerCase()) || f.label.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredTenant = tenantFlags.filter((f) =>
    filterText.length === 0 || f.flagKey.toLowerCase().includes(filterText.toLowerCase()) || f.label.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Feature Flag Console</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Filter flags…"
          value={filterText}
          onChangeText={setFilterText}
          testID="flag-filter-input"
        />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Platform-wide flags */}
        <Text style={styles.sectionHeader}>Platform-wide Flags</Text>
        {filteredPlatform.length === 0 && (
          <Text style={styles.emptyText}>No platform flags.</Text>
        )}
        {filteredPlatform.map((flag) => (
          <View key={flag.flagKey} style={styles.flagRow} testID={`platform-flag-${flag.flagKey}`}>
            <View style={styles.flagInfo}>
              <Text style={styles.flagKey}>{flag.flagKey}</Text>
              <Text style={styles.flagLabel}>{flag.label}</Text>
              {flag.description ? <Text style={styles.flagDesc}>{flag.description}</Text> : null}
              {flag.updatedAt ? <Text style={styles.flagMeta}>Updated {flag.updatedAt.slice(0, 10)} by {flag.updatedBy}</Text> : null}
            </View>
            <Switch
              value={flag.enabled}
              onValueChange={(newVal) => onTogglePlatformFlag(flag.flagKey, newVal)}
              testID={`flag-toggle-${flag.flagKey}`}
            />
          </View>
        ))}

        {/* Tenant-scoped flags */}
        {selectedTenantId && (
          <>
            <Text style={styles.sectionHeader}>
              Tenant Flags — {selectedTenantName}
            </Text>
            {filteredTenant.length === 0 && (
              <Text style={styles.emptyText}>No tenant-specific flags.</Text>
            )}
            {filteredTenant.map((flag) => (
              <View key={flag.flagKey} style={styles.flagRow} testID={`tenant-flag-${flag.flagKey}`}>
                <View style={styles.flagInfo}>
                  <Text style={styles.flagKey}>{flag.flagKey}</Text>
                  <Text style={styles.flagLabel}>{flag.label}</Text>
              {flag.updatedAt ? <Text style={styles.flagMeta}>Updated {flag.updatedAt.slice(0, 10)} by {flag.updatedBy}</Text> : null}
                </View>
                <TouchableOpacity
                  style={[styles.toggle, flag.enabled ? styles.toggleOn : styles.toggleOff]}
                  onPress={() => onToggleTenantFlag(flag.flagKey, selectedTenantId, !flag.enabled)}
                  testID={`flag-toggle-tenant-${flag.flagKey}`}
                >
                  <Text style={styles.toggleText}>{flag.enabled ? "ON" : "OFF"}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={onSaveAll}
          disabled={saving}
          testID={`${testID}-save`}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save All Changes"}</Text>
        </TouchableOpacity>
      </View>
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
  scroll: { flex: 1 },
  sectionHeader: { fontSize: 12, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
  flagRow: { backgroundColor: "#ffffff", marginHorizontal: 12, marginTop: 6, padding: 14, borderRadius: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  flagInfo: { flex: 1, marginRight: 12 },
  flagKey: { fontSize: 13, fontWeight: "700", color: "#111827", fontFamily: "monospace" },
  flagLabel: { fontSize: 13, color: "#374151", marginTop: 2 },
  flagDesc: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  flagMeta: { fontSize: 10, color: "#d1d5db", marginTop: 4 },
  toggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  toggleOn: { backgroundColor: "#10b981" },
  toggleOff: { backgroundColor: "#d1d5db" },
  toggleText: { color: "#ffffff", fontWeight: "700", fontSize: 12 },
  emptyText: { textAlign: "center", color: "#9ca3af", padding: 16 },
  footer: { padding: 16, backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  saveBtn: { backgroundColor: "#1d4ed8", padding: 14, borderRadius: 8, alignItems: "center" },
  saveBtnText: { color: "#ffffff", fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
