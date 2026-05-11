import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { PlatformHealthSignal, HealthSignalStatus } from "./platformAdminTypes";

export type PlatformHealthDashboardScreenProps = {
  loading: boolean;
  error: string | null;
  signals: PlatformHealthSignal[];
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const STATUS_COLORS: Record<HealthSignalStatus, string> = {
  healthy: "#10b981",
  degraded: "#f59e0b",
  down: "#ef4444",
};

const STATUS_ICONS: Record<HealthSignalStatus, string> = {
  healthy: "✅",
  degraded: "⚠️",
  down: "🔴",
};

export function PlatformHealthDashboardScreen({
  loading,
  error,
  signals,
  onRetry,
  onBack,
  testID = "platform-health-dashboard-screen",
}: PlatformHealthDashboardScreenProps) {
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

  const degradedCount = signals.filter((s) => s.status === "degraded").length;
  const downCount = signals.filter((s) => s.status === "down").length;
  const overallOk = degradedCount === 0 && downCount === 0;

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Platform Health</Text>
      </View>

      <View style={[styles.overallBanner, { backgroundColor: overallOk ? "#f0fdf4" : "#fef2f2" }]}>
        <Text style={styles.overallText} testID="overall-status">
          {overallOk ? "✅ All systems operational" : `⚠️ ${downCount} down, ${degradedCount} degraded`}
        </Text>
      </View>

      <ScrollView style={styles.scroll}>
        {signals.length === 0 && (
          <Text style={styles.emptyText}>No health signals available.</Text>
        )}
        {signals.map((s) => (
          <View key={s.service} style={styles.signalRow} testID={`signal-${s.service}`}>
            <View style={styles.signalLeft}>
              <Text style={styles.serviceName}>{s.service}</Text>
              {s.note && <Text style={styles.serviceNote}>{s.note}</Text>}
            </View>
            <View style={styles.signalRight}>
              <Text style={[styles.statusBadge, { color: STATUS_COLORS[s.status] }]}>
                {STATUS_ICONS[s.status]} {s.status}
              </Text>
              {s.latencyMs !== undefined && (
                <Text style={styles.metricText}>{s.latencyMs}ms</Text>
              )}
              {s.errorRate !== undefined && (
                <Text style={styles.metricText}>{(s.errorRate * 100).toFixed(1)}% err</Text>
              )}
            </View>
          </View>
        ))}
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
  overallBanner: { padding: 16, margin: 12, borderRadius: 8, alignItems: "center" },
  overallText: { fontSize: 15, fontWeight: "600" },
  scroll: { flex: 1 },
  signalRow: { backgroundColor: "#ffffff", marginHorizontal: 12, marginTop: 8, padding: 16, borderRadius: 8, flexDirection: "row", justifyContent: "space-between" },
  signalLeft: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  serviceNote: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  signalRight: { alignItems: "flex-end", gap: 4 },
  statusBadge: { fontSize: 13, fontWeight: "700" },
  metricText: { fontSize: 11, color: "#6b7280" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 32 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
