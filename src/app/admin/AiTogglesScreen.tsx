import React from "react";
import { View, Text, Switch, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";

import type { AiFeatureToggleConfig } from "./aiAdminTypes";
import { AI_FEATURE_GROUPS } from "./aiAdminTypes";

export type AiTogglesScreenProps = {
  loading: boolean;
  saving: boolean;
  toggles: AiFeatureToggleConfig[];
  pendingChanges: boolean;
  onToggle: (featureKey: string, enabled: boolean) => void;
  onSaveAll: () => void;
  onBack: () => void;
  testID?: string;
};

export function AiTogglesScreen({
  loading,
  saving,
  toggles,
  pendingChanges,
  onToggle,
  onSaveAll,
  onBack,
  testID = "ai-toggles-screen",
}: AiTogglesScreenProps) {
  const getToggleEnabled = (featureKey: string): boolean => {
    const found = toggles.find((t) => t.featureKey === featureKey);
    return found?.enabled ?? false;
  };

  if (loading) {
    return (
      <View style={styles.center} testID={testID}>
        <ActivityIndicator testID="loading-spinner" />
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
        <Text style={styles.title}>AI Features</Text>
        <TouchableOpacity
          onPress={onSaveAll}
          disabled={!pendingChanges || saving}
          testID="save-all-btn"
        >
          <Text style={[styles.saveLabel, (!pendingChanges || saving) && styles.disabled]}>
            {saving ? "Saving…" : "Save All"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pending warning banner */}
      {pendingChanges && (
        <View style={styles.warningBanner} testID="pending-banner">
          <Text style={styles.warningText}>
            {'You have unsaved changes. Press "Save All" to apply them.'}
          </Text>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {AI_FEATURE_GROUPS.map((group) => (
          <View key={group.id} style={styles.group} testID={`group-${group.id}`}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            {group.features.map((featureKey) => {
              const enabled = getToggleEnabled(featureKey);
              return (
                <View key={featureKey} style={styles.toggleRow} testID={`toggle-row-${featureKey}`}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.featureLabel}>{featureKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</Text>
                    <Text style={styles.featureKey}>{featureKey}</Text>
                  </View>
                  <Switch
                    value={enabled}
                    onValueChange={(val) => onToggle(featureKey, val)}
                    testID={`toggle-${featureKey}`}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  saveLabel: { fontSize: 16, color: "#007AFF", fontWeight: "600" },
  disabled: { opacity: 0.4 },
  warningBanner: {
    backgroundColor: "rgba(255,193,7,0.15)",
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  warningText: { fontSize: 13, color: "#7a5c00" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  group: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  toggleInfo: { flex: 1, marginRight: 12 },
  featureLabel: { fontSize: 15, fontWeight: "500", color: "#1a1a1a" },
  featureKey: { fontSize: 12, color: "#999", marginTop: 2 },
});
