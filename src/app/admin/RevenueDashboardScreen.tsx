/**
 * W47 — RevenueDashboardScreen
 *
 * Owner-facing revenue summary: today / this week / this month figures,
 * per-currency breakdown, occupancy, and top-performing staff.
 * Wires into ownerKpiService (live bookings) + reportingService (historical trends).
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
import type { OwnerKpiSummary } from "./ownerKpiService";
import type { RevenueBreakdown } from "./analyticsTypes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type RevenueDashboardScreenProps = {
  loading: boolean;
  error: string | null;
  kpi: OwnerKpiSummary | null;
  revenueBreakdown: RevenueBreakdown | null;
  onRetry: () => void;
  onNavigateBookingFunnel: () => void;
  onNavigateStaffProductivity: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function RevenueDashboardScreen({
  loading,
  error,
  kpi,
  revenueBreakdown,
  onRetry,
  onNavigateBookingFunnel,
  onNavigateStaffProductivity,
  testID = "revenue-dashboard-screen",
}: RevenueDashboardScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Revenue Dashboard</Text>
      </View>

      {loading && <AdminLoadingState label="Loading revenue data…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* KPI cards */}
          <Text style={styles.sectionLabel}>Today</Text>
          <View style={styles.kpiGrid} testID="kpi-grid">
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpi?.bookingsToday ?? 0}</Text>
              <Text style={styles.kpiLabel}>Bookings</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>
                {kpi?.revenueEstimatedTodayUsd != null
                  ? `$${kpi.revenueEstimatedTodayUsd.toFixed(2)}`
                  : "—"}
              </Text>
              <Text style={styles.kpiLabel}>Revenue (USD)</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>
                {kpi?.occupancyTodayPct != null
                  ? `${(kpi.occupancyTodayPct * 100).toFixed(0)}%`
                  : "—"}
              </Text>
              <Text style={styles.kpiLabel}>Occupancy</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>This Week</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpi?.bookingsThisWeek ?? 0}</Text>
              <Text style={styles.kpiLabel}>Bookings</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>
                {revenueBreakdown?.weekTotalUsd != null
                  ? `$${revenueBreakdown.weekTotalUsd.toFixed(2)}`
                  : "—"}
              </Text>
              <Text style={styles.kpiLabel}>Revenue (USD)</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>This Month</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>
                {revenueBreakdown?.monthTotalUsd != null
                  ? `$${revenueBreakdown.monthTotalUsd.toFixed(2)}`
                  : "—"}
              </Text>
              <Text style={styles.kpiLabel}>Revenue (USD)</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{revenueBreakdown?.monthBookingCount ?? 0}</Text>
              <Text style={styles.kpiLabel}>Bookings</Text>
            </View>
          </View>

          {/* Multi-currency breakdown */}
          {revenueBreakdown?.byCurrency && revenueBreakdown.byCurrency.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>By Currency (Month)</Text>
              <View style={styles.card} testID="currency-breakdown">
                {revenueBreakdown.byCurrency.map((row) => (
                  <View key={row.currency} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{row.currency}</Text>
                    <Text style={styles.tableCellRight}>
                      {row.amount.toFixed(2)}
                    </Text>
                    {row.fxRateToUsd != null && (
                      <Text style={styles.tableCellMeta}>
                        Rate: {row.fxRateToUsd.toFixed(4)}
                      </Text>
                    )}
                  </View>
                ))}
                <Text style={styles.fxDisclosure}>
                  Cross-currency totals use daily ECB rates at transaction time.
                </Text>
              </View>
            </>
          )}

          {/* Top staff */}
          {kpi?.topStaff && kpi.topStaff.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Top Staff Today</Text>
              <View style={styles.card} testID="top-staff-list">
                {kpi.topStaff.map((s) => (
                  <View key={s.staffId} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{s.displayName}</Text>
                    <Text style={styles.tableCellRight}>{s.bookingsToday} bookings</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Navigation to drill-downs */}
          <View style={styles.navLinks}>
            <Pressable
              style={styles.navLink}
              onPress={onNavigateBookingFunnel}
              accessibilityRole="button"
              testID="nav-booking-funnel"
            >
              <Text style={styles.navLinkText}>Booking Funnel →</Text>
            </Pressable>
            <Pressable
              style={styles.navLink}
              onPress={onNavigateStaffProductivity}
              accessibilityRole="button"
              testID="nav-staff-productivity"
            >
              <Text style={styles.navLinkText}>Staff Productivity →</Text>
            </Pressable>
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
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  title: { ...brandTypography.headingMd, color: "#111827" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  sectionLabel: {
    ...brandTypography.labelSm,
    color: "#6B7280",
    marginTop: 20,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  kpiCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  kpiValue: { ...brandTypography.headingLg, color: "#111827" },
  kpiLabel: { ...brandTypography.labelSm, color: "#6B7280", marginTop: 4 },
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
  tableCellRight: { ...brandTypography.bodyMd, color: "#374151", minWidth: 80, textAlign: "right" },
  tableCellMeta: { ...brandTypography.labelSm, color: "#9CA3AF", marginLeft: 8 },
  fxDisclosure: {
    ...brandTypography.labelSm,
    color: "#9CA3AF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontStyle: "italic",
  },
  navLinks: { marginTop: 24, gap: 8 },
  navLink: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  navLinkText: { ...brandTypography.labelMd, color: "#2563EB" },
});
