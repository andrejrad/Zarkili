/**
 * W45 — CampaignPerformanceScreen
 *
 * Metrics grid, delivery / open / click / conversion rates, and hourly delivery list.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { CampaignPerformanceDetail } from "../../domains/campaigns/campaignAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type CampaignPerformanceScreenProps = {
  loading: boolean;
  error: string | null;
  detail: CampaignPerformanceDetail | null;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function CampaignPerformanceScreen({
  loading,
  error,
  detail,
  onRetry,
  onBack,
  testID = "campaign-performance-screen",
}: CampaignPerformanceScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {detail ? detail.name : "Campaign Performance"}
        </Text>
      </View>

      {loading && <AdminLoadingState label="Loading performance…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && detail && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Meta */}
          <View style={styles.metaBanner}>
            <Text style={styles.metaText}>{detail.channel} · {detail.status}</Text>
            <Text style={styles.metaText}>Scheduled: {detail.scheduledAt}</Text>
            {detail.completedAt && <Text style={styles.metaText}>Completed: {detail.completedAt}</Text>}
          </View>

          {/* Metrics grid */}
          <View style={styles.metricsGrid} testID="metrics-grid">
            {[
              { label: "Sent", value: detail.metrics.sent },
              { label: "Delivered", value: detail.metrics.delivered },
              { label: "Opened", value: detail.metrics.opened },
              { label: "Clicked", value: detail.metrics.clicked },
              { label: "Converted", value: detail.metrics.converted },
              { label: "Failed", value: detail.metrics.failed },
            ].map((m) => (
              <View key={m.label} style={styles.metricCard}>
                <Text style={styles.metricValue}>{m.value}</Text>
                <Text style={styles.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>

          {/* Rates */}
          <Text style={styles.sectionLabel}>Rates</Text>
          <View style={styles.card} testID="rates-section">
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Open rate</Text>
              <Text style={styles.rateValue}>{(detail.metrics.openRate * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Click rate</Text>
              <Text style={styles.rateValue}>{(detail.metrics.clickRate * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Conversion rate</Text>
              <Text style={styles.rateValue}>{(detail.metrics.conversionRate * 100).toFixed(1)}%</Text>
            </View>
          </View>

          {/* Hourly */}
          <Text style={styles.sectionLabel}>Hourly delivery</Text>
          <View style={styles.card} testID="hourly-delivery">
            {detail.hourlyDelivery.length === 0 && (
              <Text style={styles.emptyText}>No hourly data yet.</Text>
            )}
            {detail.hourlyDelivery.map((h) => (
              <View key={h.hour} style={styles.hourlyRow} testID={`hourly-${h.hour}`}>
                <Text style={styles.hourlyTime}>{h.hour}</Text>
                <Text style={styles.hourlyCount}>{h.delivered} delivered</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  backBtn: { paddingRight: 8 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6b7280" },
  title: { flex: 1, fontFamily: brandTypography.semibold, fontSize: 18, color: "#111827" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  metaBanner: {
    backgroundColor: "#ede9fe",
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  metaText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#374151" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minWidth: "30%",
    flex: 1,
  },
  metricValue: { fontFamily: brandTypography.semibold, fontSize: 20, color: "#4f46e5" },
  metricLabel: { fontFamily: brandTypography.regular, fontSize: 11, color: "#6b7280", marginTop: 2 },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#374151", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  rateLabel: { fontFamily: brandTypography.regular, fontSize: 13, color: "#374151" },
  rateValue: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#111827" },
  emptyText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#9ca3af", textAlign: "center", paddingVertical: 8 },
  hourlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  hourlyTime: { fontFamily: brandTypography.regular, fontSize: 13, color: "#374151" },
  hourlyCount: { fontFamily: brandTypography.regular, fontSize: 13, color: "#6b7280" },
});
