/**
 * W47 — StaffProductivityScreen
 *
 * Per-staff performance table: completed bookings, no-shows,
 * cancellations, no-show rate, and revenue contribution.
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
import type { StaffPerformanceMetrics } from "../../domains/analytics/model";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type StaffProductivityScreenProps = {
  loading: boolean;
  error: string | null;
  rows: StaffPerformanceMetrics[];
  /** Map of staffId → display name (may be partial) */
  staffNames: Record<string, string>;
  dateRangeLabel: string;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function StaffProductivityScreen({
  loading,
  error,
  rows,
  staffNames,
  dateRangeLabel,
  onRetry,
  onBack,
  testID = "staff-productivity-screen",
}: StaffProductivityScreenProps) {
  const sorted = [...rows].sort(
    (a, b) => b.completedBookings - a.completedBookings,
  );

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">Staff Productivity</Text>
      </View>

      {loading && <AdminLoadingState label="Loading staff data…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.dateLabel}>{dateRangeLabel}</Text>

          {sorted.length === 0 ? (
            <View style={styles.emptyState} testID="empty-state">
              <Text style={styles.emptyText}>No staff performance data for this period.</Text>
            </View>
          ) : (
            <>
              {/* Column headers */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.headerCell]}>Staff</Text>
                <Text style={[styles.tableNum, styles.headerCell]}>Done</Text>
                <Text style={[styles.tableNum, styles.headerCell]}>NoShow</Text>
                <Text style={[styles.tableNum, styles.headerCell]}>Cancel</Text>
                <Text style={[styles.tableNum, styles.headerCell]}>NS%</Text>
              </View>
              <View style={styles.card} testID="staff-table">
                {sorted.map((row) => (
                  <View key={row.staffId} style={styles.tableRow}>
                    <Text style={styles.tableCell} numberOfLines={1}>
                      {staffNames[row.staffId] ?? row.staffId}
                    </Text>
                    <Text style={styles.tableNum}>{row.completedBookings}</Text>
                    <Text style={styles.tableNum}>{row.noShowCount}</Text>
                    <Text style={styles.tableNum}>{row.cancellationCount}</Text>
                    <Text
                      style={[
                        styles.tableNum,
                        row.noShowRate > 0.1 && styles.rateHigh,
                      ]}
                    >
                      {pct(row.noShowRate)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Summary */}
              <View style={styles.summaryCard} testID="summary-card">
                <Text style={styles.summaryLabel}>Team total</Text>
                <Text style={styles.summaryValue}>
                  {sorted.reduce((s, r) => s + r.completedBookings, 0)} completed bookings
                </Text>
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
  tableCell: { flex: 1, ...brandTypography.bodyMd, color: "#111827" },
  tableNum: {
    ...brandTypography.labelMd,
    color: "#374151",
    minWidth: 44,
    textAlign: "right",
  },
  rateHigh: { color: "#EF4444" },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: { ...brandTypography.bodyMd, color: "#9CA3AF" },
  summaryCard: {
    marginTop: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { ...brandTypography.labelMd, color: "#1E40AF" },
  summaryValue: { ...brandTypography.bodyMd, color: "#1E40AF" },
});
