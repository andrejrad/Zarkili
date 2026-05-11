/**
 * W47 — ServicePerformanceScreen
 *
 * Per-service performance table: completed bookings, cancellations,
 * cancellation rate, and popularity rank.
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
import type { ServicePerformanceMetrics } from "../../domains/analytics/model";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ServicePerformanceScreenProps = {
  loading: boolean;
  error: string | null;
  rows: ServicePerformanceMetrics[];
  /** Map of serviceId → display name */
  serviceNames: Record<string, string>;
  dateRangeLabel: string;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ServicePerformanceScreen({
  loading,
  error,
  rows,
  serviceNames,
  dateRangeLabel,
  onRetry,
  onBack,
  testID = "service-performance-screen",
}: ServicePerformanceScreenProps) {
  const sorted = [...rows].sort((a, b) => a.popularityRank - b.popularityRank);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">Service Performance</Text>
      </View>

      {loading && <AdminLoadingState label="Loading service data…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.dateLabel}>{dateRangeLabel}</Text>

          {sorted.length === 0 ? (
            <View style={styles.emptyState} testID="empty-state">
              <Text style={styles.emptyText}>No service performance data for this period.</Text>
            </View>
          ) : (
            <>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.rankCol, styles.headerCell]}>#</Text>
                <Text style={[styles.tableCell, styles.headerCell]}>Service</Text>
                <Text style={[styles.tableNum, styles.headerCell]}>Done</Text>
                <Text style={[styles.tableNum, styles.headerCell]}>Cancel</Text>
              </View>
              <View style={styles.card} testID="service-table">
                {sorted.map((row) => {
                  const cancelRate =
                    row.completedBookings + row.cancellationCount > 0
                      ? row.cancellationCount /
                        (row.completedBookings + row.cancellationCount)
                      : 0;
                  return (
                    <View key={row.serviceId} style={styles.tableRow}>
                      <Text style={styles.rankCol}>{row.popularityRank}</Text>
                      <Text style={styles.tableCell} numberOfLines={1}>
                        {serviceNames[row.serviceId] ?? row.serviceId}
                      </Text>
                      <Text style={styles.tableNum}>{row.completedBookings}</Text>
                      <Text
                        style={[
                          styles.tableNum,
                          cancelRate > 0.1 && styles.rateHigh,
                        ]}
                      >
                        {row.cancellationCount}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backBtn: { padding: 4 },
  backText: { ...brandTypography.labelMd, color: "#6366F1" },
  title: { ...brandTypography.headingMd, color: "#111827", flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  dateLabel: { ...brandTypography.labelSm, color: "#6B7280", marginBottom: 16 },
  tableHeader: {
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerCell: { color: "#6B7280", fontWeight: "600" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rankCol: {
    ...brandTypography.labelMd,
    color: "#6B7280",
    width: 28,
    textAlign: "center",
  },
  tableCell: { flex: 1, ...brandTypography.bodyMd, color: "#111827" },
  tableNum: {
    ...brandTypography.labelMd,
    color: "#374151",
    minWidth: 44,
    textAlign: "right",
  },
  rateHigh: { color: "#EF4444" },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: { ...brandTypography.bodyMd, color: "#9CA3AF" },
});
