import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { AiUsageKpi, AiUsageByFeature, AiSafetyIncident } from "./aiAdminTypes";

export type AiUsageAnalyticsScreenProps = {
  loading: boolean;
  error: string | null;
  kpi: AiUsageKpi | null;
  usageByFeature: AiUsageByFeature[];
  incidents: AiSafetyIncident[];
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

function severityColor(severity: AiSafetyIncident["severity"]): string {
  switch (severity) {
    case "high": return "#ef4444";
    case "medium": return "#f59e0b";
    default: return "#6b7280";
  }
}

function incidentTypeLabel(type: AiSafetyIncident["incidentType"]): string {
  switch (type) {
    case "prompt_injection": return "Prompt Injection";
    case "policy_violation": return "Policy Violation";
    case "hallucination": return "Hallucination";
    case "pii_leak": return "PII Leak";
    default: return "Other";
  }
}

export function AiUsageAnalyticsScreen({
  loading,
  error,
  kpi,
  usageByFeature,
  incidents,
  onRetry,
  onBack,
  testID = "ai-usage-analytics-screen",
}: AiUsageAnalyticsScreenProps) {
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
        <Text style={styles.title}>AI Usage Analytics</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* KPI row */}
        <View style={styles.kpiRow} testID="kpi-row">
          {[
            { label: "Tokens", value: (kpi?.totalTokens ?? 0).toLocaleString() },
            { label: "Cost ($)", value: `$${(kpi?.totalCostUsd ?? 0).toFixed(2)}` },
            { label: "Avg Latency", value: `${kpi?.avgLatencyMs ?? 0}ms` },
            { label: "Incidents", value: String(kpi?.incidentCount ?? 0), warn: (kpi?.incidentCount ?? 0) > 0 },
            { label: "Blocks", value: String(kpi?.blockCount ?? 0), warn: (kpi?.blockCount ?? 0) > 0 },
          ].map((tile) => (
            <View key={tile.label} style={styles.kpiTile}>
              <Text style={[styles.kpiValue, tile.warn && styles.kpiValueWarn]}>{tile.value}</Text>
              <Text style={styles.kpiLabel}>{tile.label}</Text>
            </View>
          ))}
        </View>

        {/* Usage by feature */}
        <View style={styles.card} testID="usage-by-feature">
          <Text style={styles.cardTitle}>Usage by Feature</Text>
          {usageByFeature.length === 0 ? (
            <Text style={styles.emptyText}>No usage data yet.</Text>
          ) : (
            usageByFeature
              .slice()
              .sort((a, b) => b.costUsd - a.costUsd)
              .map((u) => (
                <View key={u.featureKey} style={styles.featureRow}>
                  <Text style={styles.featureName}>
                    {u.featureKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <Text style={styles.featureStat}>${u.costUsd.toFixed(2)}</Text>
                  <Text style={styles.featureStatMuted}>{u.tokensUsed.toLocaleString()} tokens</Text>
                  <Text style={styles.featureStatMuted}>{u.avgLatencyMs}ms</Text>
                </View>
              ))
          )}
        </View>

        {/* Safety incidents */}
        <View style={styles.card} testID="incident-table">
          <Text style={styles.cardTitle}>Safety Incidents</Text>
          {incidents.length === 0 ? (
            <Text style={styles.emptyText}>No safety incidents recorded.</Text>
          ) : (
            incidents.map((inc) => (
              <View key={inc.incidentId} style={styles.incidentRow}>
                <View style={styles.incidentLeft}>
                  <Text style={styles.incidentType}>{incidentTypeLabel(inc.incidentType)}</Text>
                  <Text style={styles.incidentFeature}>{inc.featureKey}</Text>
                  <Text style={styles.incidentDesc} numberOfLines={2}>{inc.description}</Text>
                </View>
                <View style={styles.incidentRight}>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: `${severityColor(inc.severity)}20` },
                    ]}
                  >
                    <Text style={[styles.severityText, { color: severityColor(inc.severity) }]}>
                      {inc.severity}
                    </Text>
                  </View>
                  <Text style={styles.incidentDate}>{inc.createdAt.slice(0, 10)}</Text>
                </View>
              </View>
            ))
          )}
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
  errorText: { fontSize: 15, color: "#ef4444", textAlign: "center", marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#007AFF", borderRadius: 8 },
  retryText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  kpiRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
  },
  kpiTile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: "#f0f0f0",
  },
  kpiValue: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  kpiValueWarn: { color: "#ef4444" },
  kpiLabel: { fontSize: 11, color: "#888", marginTop: 2, textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  emptyText: { fontSize: 14, color: "#888", textAlign: "center", paddingVertical: 12 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 8,
  },
  featureName: { flex: 1, fontSize: 13, fontWeight: "500", color: "#1a1a1a" },
  featureStat: { fontSize: 13, fontWeight: "600", color: "#1a1a1a", minWidth: 60, textAlign: "right" },
  featureStatMuted: { fontSize: 12, color: "#999", minWidth: 70, textAlign: "right" },
  incidentRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  incidentLeft: { flex: 1, marginRight: 12 },
  incidentType: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  incidentFeature: { fontSize: 12, color: "#666", marginTop: 1 },
  incidentDesc: { fontSize: 12, color: "#888", marginTop: 4 },
  incidentRight: { alignItems: "flex-end" },
  severityBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  severityText: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  incidentDate: { fontSize: 11, color: "#aaa" },
});
