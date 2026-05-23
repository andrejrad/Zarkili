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

import type { AiBudgetGuardConfig } from "../../shared/ai";
import { aiFeatureKeys } from "../../shared/ai";

import type { AiUsageByFeature } from "./aiAdminTypes";

export type AiBudgetConfigScreenProps = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  budgetConfig: AiBudgetGuardConfig | null;
  usageByFeature: AiUsageByFeature[];
  onUpdateGlobalCap: (capUsd: number) => void;
  onUpdateFeatureCap: (featureKey: string, capUsd: number) => void;
  onSave: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

function usagePct(used: number, cap: number): number {
  if (cap <= 0) return 0;
  return Math.min(100, Math.round((used / cap) * 100));
}

function budgetStatusColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 70) return "#f59e0b";
  return "#10b981";
}

export function AiBudgetConfigScreen({
  loading,
  saving,
  error,
  budgetConfig,
  usageByFeature,
  onUpdateGlobalCap,
  onUpdateFeatureCap,
  onSave,
  onRetry,
  onBack,
  testID = "ai-budget-config-screen",
}: AiBudgetConfigScreenProps) {
  const getUsage = (featureKey: string): AiUsageByFeature | undefined =>
    usageByFeature.find((u) => u.featureKey === featureKey);

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

  const globalSpend = usageByFeature.reduce((sum, u) => sum + u.costUsd, 0);
  const globalCap = budgetConfig?.globalMonthlyCapUsd ?? 0;
  const globalPct = usagePct(globalSpend, globalCap);

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backLabel}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Budget Config</Text>
        <TouchableOpacity onPress={onSave} disabled={saving} testID="save-btn">
          <Text style={[styles.saveLabel, saving && styles.disabled]}>
            {saving ? "Saving…" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Global summary card */}
        <View style={styles.summaryCard} testID="summary-card">
          <Text style={styles.cardTitle}>Global Monthly Budget</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${globalSpend.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Current Spend</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${(globalCap - globalSpend).toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Remaining</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: budgetStatusColor(globalPct) }]}>{globalPct}%</Text>
              <Text style={styles.summaryLabel}>Used</Text>
            </View>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressBar, { width: `${globalPct}%` as any, backgroundColor: budgetStatusColor(globalPct) }]} />
          </View>
          <View style={styles.globalCapRow}>
            <Text style={styles.fieldLabel}>Monthly Cap ($)</Text>
            <TextInput
              style={styles.numberInput}
              defaultValue={String(globalCap)}
              keyboardType="numeric"
              onEndEditing={(e) => {
                const v = parseFloat(e.nativeEvent.text);
                if (!isNaN(v) && v > 0) onUpdateGlobalCap(v);
              }}
              testID="global-cap-input"
            />
          </View>
        </View>

        {/* Per-feature budget table */}
        <View style={styles.card} testID="budget-table">
          <Text style={styles.cardTitle}>Per-Feature Budgets</Text>
          {aiFeatureKeys.map((featureKey) => {
            const usage = getUsage(featureKey);
            const cap = budgetConfig?.featureCaps[featureKey]?.monthlyCapUsd ?? 0;
            const pct = usagePct(usage?.costUsd ?? 0, cap);
            return (
              <View key={featureKey} style={styles.featureRow} testID={`feature-row-${featureKey}`}>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureName}>
                    {featureKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${pct}%` as any, backgroundColor: budgetStatusColor(pct) },
                      ]}
                    />
                  </View>
                  <Text style={styles.spendLine}>
                    ${(usage?.costUsd ?? 0).toFixed(2)} / ${cap.toFixed(2)} ({pct}%)
                  </Text>
                </View>
                <TextInput
                  style={styles.featureCapInput}
                  defaultValue={String(cap)}
                  keyboardType="numeric"
                  onEndEditing={(e) => {
                    const v = parseFloat(e.nativeEvent.text);
                    if (!isNaN(v) && v > 0) onUpdateFeatureCap(featureKey, v);
                  }}
                  testID={`cap-input-${featureKey}`}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  saveLabel: { fontSize: 16, color: "#007AFF", fontWeight: "600" },
  disabled: { opacity: 0.4 },
  errorText: { fontSize: 15, color: "#ef4444", textAlign: "center", marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#007AFF", borderRadius: 8 },
  retryText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryItem: { alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  summaryLabel: { fontSize: 11, color: "#999", marginTop: 2 },
  progressBg: { height: 6, backgroundColor: "#e0e0e0", borderRadius: 3, overflow: "hidden", marginVertical: 6 },
  progressBar: { height: 6, borderRadius: 3 },
  globalCapRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  fieldLabel: { fontSize: 14, color: "#555" },
  numberInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    width: 100,
    textAlign: "right",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 12,
  },
  featureInfo: { flex: 1 },
  featureName: { fontSize: 14, fontWeight: "500", color: "#1a1a1a", marginBottom: 4 },
  spendLine: { fontSize: 12, color: "#888" },
  featureCapInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    width: 80,
    textAlign: "right",
  },
});
