/**
 * W47 — ClientRetentionScreen
 *
 * Unified retention dashboard:
 *   - Retention rate (clients with ≥2 visits)
 *   - Rebooking rate (clients with ≥2 completed bookings)
 *   - At-risk client count + threshold
 *   - Visit interval (avg / median days between visits)
 *   - At-risk client attention list
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
import type {
  AtRiskMetrics,
  ClientRiskEntry,
  RebookingMetrics,
  RetentionMetrics,
  VisitIntervalMetrics,
} from "../../domains/analytics/model";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ClientRetentionScreenProps = {
  loading: boolean;
  error: string | null;
  retention: RetentionMetrics | null;
  rebooking: RebookingMetrics | null;
  atRisk: AtRiskMetrics | null;
  visitInterval: VisitIntervalMetrics | null;
  atRiskList: ClientRiskEntry[];
  dateRangeLabel: string;
  planLockedReports: string[];
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

const RISK_COLOR: Record<string, string> = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ClientRetentionScreen({
  loading,
  error,
  retention,
  rebooking,
  atRisk,
  visitInterval,
  atRiskList,
  dateRangeLabel,
  planLockedReports,
  onRetry,
  onBack,
  testID = "client-retention-screen",
}: ClientRetentionScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">Client Retention</Text>
      </View>

      {loading && <AdminLoadingState label="Loading retention data…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.dateLabel}>{dateRangeLabel}</Text>

          {/* Plan lock banner */}
          {planLockedReports.length > 0 && (
            <View style={styles.planBanner} testID="plan-lock-banner">
              <Text style={styles.planBannerText}>
                Upgrade your plan to unlock: {planLockedReports.join(", ")}
              </Text>
            </View>
          )}

          {/* Retention + rebooking headline */}
          <Text style={styles.sectionLabel}>Retention</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard} testID="retention-card">
              <Text style={styles.kpiValue}>
                {retention ? pct(retention.retentionRate) : "—"}
              </Text>
              <Text style={styles.kpiLabel}>Retention Rate</Text>
              {retention && (
                <Text style={styles.kpiSub}>
                  {retention.retainedClients} / {retention.totalUniqueClients} clients
                </Text>
              )}
            </View>
            <View style={styles.kpiCard} testID="rebooking-card">
              <Text style={styles.kpiValue}>
                {rebooking ? pct(rebooking.rebookingRate) : "—"}
              </Text>
              <Text style={styles.kpiLabel}>Rebooking Rate</Text>
              {rebooking && (
                <Text style={styles.kpiSub}>
                  {rebooking.rebookedClients} / {rebooking.totalUniqueClients} clients
                </Text>
              )}
            </View>
          </View>

          {/* At-risk + visit interval */}
          <Text style={styles.sectionLabel}>At-Risk & Visit Cadence</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard} testID="at-risk-card">
              <Text style={styles.kpiValue}>{atRisk?.atRiskClients ?? "—"}</Text>
              <Text style={styles.kpiLabel}>At-Risk Clients</Text>
              {atRisk && (
                <Text style={styles.kpiSub}>
                  No visit in {atRisk.thresholdDays}+ days
                </Text>
              )}
            </View>
            <View style={styles.statCard} testID="visit-interval-card">
              <Text style={styles.kpiValue}>
                {visitInterval?.avgDaysBetweenVisits != null
                  ? `${visitInterval.avgDaysBetweenVisits.toFixed(0)}d`
                  : "—"}
              </Text>
              <Text style={styles.kpiLabel}>Avg Visit Interval</Text>
              {visitInterval?.medianDaysBetweenVisits != null && (
                <Text style={styles.kpiSub}>
                  Median: {visitInterval.medianDaysBetweenVisits.toFixed(0)}d
                </Text>
              )}
            </View>
          </View>

          {/* At-risk list */}
          {atRiskList.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Client Attention List</Text>
              <View style={styles.card} testID="at-risk-list">
                {atRiskList.slice(0, 20).map((entry) => (
                  <View key={entry.userId} style={styles.tableRow}>
                    <View style={styles.riskDot}>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: RISK_COLOR[entry.riskLevel] ?? "#9CA3AF" },
                        ]}
                      />
                    </View>
                    <Text style={styles.tableCell} numberOfLines={1}>
                      {entry.userId}
                    </Text>
                    <Text style={styles.tableCellRight}>
                      {entry.daysSinceLastVisit}d ago
                    </Text>
                    <Text style={styles.tableCellMeta}>
                      {entry.totalVisits} visits
                    </Text>
                  </View>
                ))}
                {atRiskList.length > 20 && (
                  <View style={styles.moreRow}>
                    <Text style={styles.moreText}>
                      +{atRiskList.length - 20} more clients
                    </Text>
                  </View>
                )}
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
  planBanner: {
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  planBannerText: { ...brandTypography.labelSm, color: "#92400E" },
  sectionLabel: {
    ...brandTypography.labelSm,
    color: "#6B7280",
    marginTop: 20,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiGrid: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  kpiCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  kpiValue: { ...brandTypography.headingLg, color: "#111827" },
  kpiLabel: { ...brandTypography.labelSm, color: "#6B7280", marginTop: 4, textAlign: "center" },
  kpiSub: { ...brandTypography.labelSm, color: "#9CA3AF", marginTop: 2, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  statCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
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
  riskDot: { width: 16, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tableCell: { flex: 1, ...brandTypography.bodyMd, color: "#111827", marginLeft: 8 },
  tableCellRight: { ...brandTypography.labelMd, color: "#374151", minWidth: 56, textAlign: "right" },
  tableCellMeta: { ...brandTypography.labelSm, color: "#9CA3AF", marginLeft: 8 },
  moreRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  moreText: { ...brandTypography.labelSm, color: "#6B7280" },
});
