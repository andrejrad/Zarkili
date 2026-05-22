/**
 * W47 — MarketplaceAttributionScreen
 *
 * Shows how many bookings came from the marketplace vs. direct,
 * campaign KPIs, and challenge completion rates.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { CampaignKpis, ChallengeKpis } from "../../domains/analytics/model";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import type { MarketplaceAttributionData } from "./analyticsTypes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type MarketplaceAttributionScreenProps = {
  loading: boolean;
  error: string | null;
  attribution: MarketplaceAttributionData | null;
  campaigns: CampaignKpis[];
  challenges: ChallengeKpis[];
  dateRangeLabel: string;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function MarketplaceAttributionScreen({
  loading,
  error,
  attribution,
  campaigns,
  challenges,
  dateRangeLabel,
  onRetry,
  onBack,
  testID = "marketplace-attribution-screen",
}: MarketplaceAttributionScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">Marketplace Attribution</Text>
      </View>

      {loading && <AdminLoadingState label="Loading attribution data…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.dateLabel}>{dateRangeLabel}</Text>

          {/* Attribution overview */}
          {attribution && (
            <>
              <Text style={styles.sectionLabel}>Booking Sources</Text>
              <View style={styles.kpiGrid} testID="attribution-grid">
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{attribution.marketplaceBookings}</Text>
                  <Text style={styles.kpiLabel}>Marketplace</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{attribution.directBookings}</Text>
                  <Text style={styles.kpiLabel}>Direct</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>
                    {(attribution.marketplaceAttributionRate * 100).toFixed(1)}%
                  </Text>
                  <Text style={styles.kpiLabel}>Mkt Share</Text>
                </View>
              </View>

              {attribution.bySource.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>By Source</Text>
                  <View style={styles.card} testID="source-breakdown">
                    {attribution.bySource.map((s) => (
                      <View key={s.source} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{s.source}</Text>
                        <Text style={styles.tableNum}>{s.bookings}</Text>
                        <Text style={styles.tableNum}>
                          {(s.rate * 100).toFixed(1)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          {/* Campaign KPIs */}
          {campaigns.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Campaign Performance</Text>
              <View style={styles.card} testID="campaign-kpis">
                {campaigns.map((c) => (
                  <View key={c.campaignId} style={styles.campaignRow}>
                    <View style={styles.campaignMeta}>
                      <Text style={styles.campaignName} numberOfLines={1}>{c.name}</Text>
                      <Text style={styles.campaignChannel}>{c.channel}</Text>
                    </View>
                    <View style={styles.campaignRates}>
                      <Text style={styles.rateChip}>
                        Open {(c.openRate * 100).toFixed(0)}%
                      </Text>
                      <Text style={styles.rateChip}>
                        Click {(c.clickRate * 100).toFixed(0)}%
                      </Text>
                      <Text style={styles.rateChip}>
                        Conv {(c.conversionRate * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Challenge KPIs */}
          {challenges.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Challenge Completion</Text>
              <View style={styles.card} testID="challenge-kpis">
                {challenges.map((ch) => (
                  <View key={ch.activityId} style={styles.tableRow}>
                    <Text style={styles.tableCell} numberOfLines={1}>{ch.name}</Text>
                    <Text style={styles.tableNum}>{ch.participants}</Text>
                    <Text style={styles.tableNum}>
                      {(ch.completionRate * 100).toFixed(0)}%
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {!attribution && campaigns.length === 0 && challenges.length === 0 && (
            <View style={styles.emptyState} testID="empty-state">
              <Text style={styles.emptyText}>No attribution data for this period.</Text>
            </View>
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
    minWidth: 90,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  kpiValue: { ...brandTypography.headingLg, color: "#111827" },
  kpiLabel: { ...brandTypography.labelSm, color: "#6B7280", marginTop: 4, textAlign: "center" },
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
  tableNum: { ...brandTypography.labelMd, color: "#374151", minWidth: 44, textAlign: "right" },
  campaignRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 6,
  },
  campaignMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  campaignName: { ...brandTypography.bodyMd, color: "#111827", flex: 1 },
  campaignChannel: { ...brandTypography.labelSm, color: "#6B7280" },
  campaignRates: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  rateChip: {
    ...brandTypography.labelSm,
    color: "#374151",
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: { ...brandTypography.bodyMd, color: "#9CA3AF" },
});
