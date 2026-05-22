/**
 * W38 — OwnerHomeScreen: per-salon KPI dashboard.
 *
 * Displays live booking counts from Firestore (via ownerKpiService) and
 * revenue tiles (null until W23-DEBT-1 charge path lands).  Quick-nav rows
 * link into the operator console depth.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";

import { AdminErrorState, AdminKpiTile, AdminLoadingState, AdminSectionRow } from "./AdminPatterns";
import type { OwnerKpiSummary } from "./ownerKpiService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OwnerHomeScreenProps = {
  tenantName: string;
  loading: boolean;
  error: string | null;
  summary: OwnerKpiSummary | null;
  onRetry: () => void;
  onNavigateToSettings: () => void;
  onNavigateToBookingQueue: () => void;
  onNavigateToStaff: () => void;
  onNavigateToServices: () => void;
  onNavigateToDashboard: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OwnerHomeScreen({
  tenantName,
  loading,
  error,
  summary,
  onRetry,
  onNavigateToSettings,
  onNavigateToBookingQueue,
  onNavigateToStaff,
  onNavigateToServices,
  onNavigateToDashboard,
}: OwnerHomeScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onNavigateToDashboard} style={styles.backRow}>
          <Text style={styles.backLabel}>‹ All salons</Text>
        </Pressable>
        <Text style={styles.pageTitle}>{tenantName}</Text>
        <Text style={styles.pageSubtitle}>Owner console</Text>
      </View>

      {/* KPI section */}
      {loading ? <AdminLoadingState label="Loading dashboard…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {summary && !loading ? (
        <>
          <View style={styles.kpiGrid}>
            <AdminKpiTile
              label="Bookings today"
              value={String(summary.bookingsToday)}
            />
            <AdminKpiTile
              label="This week"
              value={String(summary.bookingsThisWeek)}
            />
          </View>

          <View style={styles.kpiGrid}>
            <AdminKpiTile
              label="Revenue today"
              value={
                summary.revenueEstimatedTodayUsd !== null
                  ? `$${summary.revenueEstimatedTodayUsd.toFixed(2)}`
                  : "—"
              }
              sublabel={
                summary.revenueEstimatedTodayUsd === null
                  ? "Pending payment data"
                  : undefined
              }
            />
            <AdminKpiTile
              label="Revenue this week"
              value={
                summary.revenueEstimatedThisWeekUsd !== null
                  ? `$${summary.revenueEstimatedThisWeekUsd.toFixed(2)}`
                  : "—"
              }
              sublabel={
                summary.revenueEstimatedThisWeekUsd === null
                  ? "Pending payment data"
                  : undefined
              }
            />
          </View>

          {/* Top staff */}
          {summary.topStaff.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Top staff today</Text>
              {summary.topStaff.map((s, i) => (
                <View key={s.staffId} style={styles.staffRow}>
                  <Text style={styles.staffRank}>#{i + 1}</Text>
                  <Text style={styles.staffId} numberOfLines={1}>
                    {s.staffId}
                  </Text>
                  <Text style={styles.staffCount}>
                    {s.bookingsToday} booking{s.bookingsToday !== 1 ? "s" : ""}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Operator alerts */}
          {summary.alerts.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Alerts</Text>
              {summary.alerts.map((a) => (
                <View
                  key={a.id}
                  style={[
                    styles.alertRow,
                    a.severity === "error" ? styles.alertError : styles.alertWarning,
                  ]}
                >
                  <Text style={styles.alertMessage}>{a.message}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noAlertsRow}>
              <Text style={styles.noAlertsLabel}>✓ No active alerts</Text>
            </View>
          )}
        </>
      ) : null}

      {/* Quick nav */}
      <Text style={styles.groupLabel}>Quick actions</Text>
      <View style={styles.navStack}>
        <AdminSectionRow
          label="Booking queue"
          sublabel="Pending, reschedule requests, exceptions"
          onPress={onNavigateToBookingQueue}
        />
        <AdminSectionRow
          label="Staff"
          sublabel="Manage staff members"
          onPress={onNavigateToStaff}
        />
        <AdminSectionRow
          label="Services"
          sublabel="Manage service catalog"
          onPress={onNavigateToServices}
        />
        <AdminSectionRow
          label="Settings"
          sublabel="Profile, brand, tax, currency, legal"
          onPress={onNavigateToSettings}
        />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    gap: 2,
    paddingBottom: 4,
  },
  backRow: {
    paddingBottom: 8,
  },
  backLabel: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  pageTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: brandTypography.semibold,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  staffRank: {
    fontSize: 13,
    fontFamily: brandTypography.semibold,
    color: "#9CA3AF",
    width: 24,
  },
  staffId: {
    flex: 1,
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
  },
  staffCount: {
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#6B6B6B",
  },
  alertRow: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  alertWarning: {
    backgroundColor: "#FEFCE8",
  },
  alertError: {
    backgroundColor: "#FEF2F2",
  },
  alertMessage: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
  },
  noAlertsRow: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  noAlertsLabel: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#22C55E",
  },
  groupLabel: {
    fontSize: 12,
    fontFamily: brandTypography.semibold,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  navStack: {
    gap: 8,
  },
});
