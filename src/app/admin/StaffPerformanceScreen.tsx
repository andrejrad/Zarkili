/**
 * W41 — StaffPerformanceScreen
 *
 * Per-staff performance metrics dashboard.  In V1 the metrics are passed in
 * as props (sourced by ownerKpiService or a future staffMetricsService).
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import { AdminErrorState, AdminKpiTile, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StaffPerformanceSummary = {
  bookingsCompleted: number;
  bookingsCancelled: number;
  bookingsNoShow: number;
  averageRating: number | null;
  /** Estimated revenue in USD cents */
  revenueEstimatedCents: number | null;
};

export type StaffPerformanceScreenProps = {
  staffName: string;
  loading: boolean;
  error: string | null;
  summary: StaffPerformanceSummary | null;
  periodLabel: string;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StaffPerformanceScreen({
  staffName,
  loading,
  error,
  summary,
  periodLabel,
  onRetry,
  onBack,
  testID,
}: StaffPerformanceScreenProps) {
  function formatRevenue(cents: number | null): string {
    if (cents === null) return "—";
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatRating(rating: number | null): string {
    if (rating === null) return "—";
    return rating.toFixed(1);
  }

  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID ?? "staff-performance-screen"}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ {staffName}</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Performance</Text>
      <Text style={styles.pageSubtitle}>{periodLabel}</Text>

      {loading ? <AdminLoadingState label="Loading metrics…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {summary && !loading ? (
        <>
          <View style={styles.kpiGrid} testID="performance-kpi-grid">
            <AdminKpiTile
              label="Completed"
              value={String(summary.bookingsCompleted)}
              testID="kpi-completed"
            />
            <AdminKpiTile
              label="Cancelled"
              value={String(summary.bookingsCancelled)}
              testID="kpi-cancelled"
            />
          </View>
          <View style={styles.kpiGrid}>
            <AdminKpiTile
              label="No-show"
              value={String(summary.bookingsNoShow)}
              testID="kpi-noshow"
            />
            <AdminKpiTile
              label="Avg rating"
              value={formatRating(summary.averageRating)}
              nullLabel="No ratings yet"
              testID="kpi-rating"
            />
          </View>
          <View style={styles.kpiGrid}>
            <AdminKpiTile
              label="Revenue"
              value={formatRevenue(summary.revenueEstimatedCents)}
              sublabel={summary.revenueEstimatedCents === null ? "Pending payment data" : undefined}
              testID="kpi-revenue"
            />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    padding: 16,
    gap: 12,
  },
  backRow: {
    marginBottom: 4,
  },
  backLabel: {
    fontSize: 14,
    color: "#5E3A8C",
    fontFamily: brandTypography.medium,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: brandTypography.semibold,
    color: "#1A1A2E",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#6B6B6B",
    fontFamily: brandTypography.regular,
    marginBottom: 8,
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 12,
  },
});
