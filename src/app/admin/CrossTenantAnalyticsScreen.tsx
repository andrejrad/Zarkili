import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { CrossTenantKpi } from "./platformAdminTypes";

export type CrossTenantAnalyticsScreenProps = {
  loading: boolean;
  error: string | null;
  kpi: CrossTenantKpi | null;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

export function CrossTenantAnalyticsScreen({
  loading,
  error,
  kpi,
  onRetry,
  onBack,
  testID = "cross-tenant-analytics-screen",
}: CrossTenantAnalyticsScreenProps) {
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
        <Text style={styles.title}>Cross-Tenant Analytics</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard} testID="kpi-total-tenants">
            <Text style={styles.kpiValue}>{kpi?.totalTenants ?? 0}</Text>
            <Text style={styles.kpiLabel}>Total Tenants</Text>
          </View>
          <View style={styles.kpiCard} testID="kpi-active-tenants">
            <Text style={[styles.kpiValue, { color: "#10b981" }]}>{kpi?.activeTenants ?? 0}</Text>
            <Text style={styles.kpiLabel}>Active</Text>
          </View>
          <View style={styles.kpiCard} testID="kpi-trial-tenants">
            <Text style={[styles.kpiValue, { color: "#3b82f6" }]}>{kpi?.trialTenants ?? 0}</Text>
            <Text style={styles.kpiLabel}>Trial</Text>
          </View>
          <View style={styles.kpiCard} testID="kpi-suspended">
            <Text style={[styles.kpiValue, { color: "#ef4444" }]}>{kpi?.suspendedTenants ?? 0}</Text>
            <Text style={styles.kpiLabel}>Suspended</Text>
          </View>
          <View style={styles.kpiCard} testID="kpi-revenue">
            <Text style={styles.kpiValue}>
              ${kpi ? kpi.totalRevenueMtdUsd.toFixed(0) : "0"}
            </Text>
            <Text style={styles.kpiLabel}>MTD Revenue (USD)</Text>
          </View>
          <View style={styles.kpiCard} testID="kpi-health">
            <Text style={styles.kpiValue}>{kpi?.avgHealthScore ?? 0}</Text>
            <Text style={styles.kpiLabel}>Avg Health Score</Text>
          </View>
          <View style={styles.kpiCard} testID="kpi-new">
            <Text style={[styles.kpiValue, { color: "#10b981" }]}>{kpi?.newTenantsThisMonth ?? 0}</Text>
            <Text style={styles.kpiLabel}>New This Month</Text>
          </View>
          <View style={styles.kpiCard} testID="kpi-churned">
            <Text style={[styles.kpiValue, { color: "#ef4444" }]}>{kpi?.churnedThisMonth ?? 0}</Text>
            <Text style={styles.kpiLabel}>Churned This Month</Text>
          </View>
        </View>
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
  scroll: { flex: 1 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 12 },
  kpiCard: { width: "46%", backgroundColor: "#ffffff", padding: 16, borderRadius: 8, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  kpiValue: { fontSize: 32, fontWeight: "800", color: "#111827" },
  kpiLabel: { fontSize: 12, color: "#6b7280", marginTop: 4, textAlign: "center" },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
