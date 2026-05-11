/**
 * W46 — ReputationDashboardScreen
 *
 * High-level review reputation metrics for the salon owner.
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
import type { ReputationStats } from "../../domains/reviews/reviewAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ReputationDashboardScreenProps = {
  loading: boolean;
  error: string | null;
  stats: ReputationStats | null;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ReputationDashboardScreen({
  loading,
  error,
  stats,
  onRetry,
  onBack,
  testID = "reputation-dashboard-screen",
}: ReputationDashboardScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Reputation</Text>
      </View>

      {loading ? <AdminLoadingState label="Loading stats…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {!loading && !error && stats ? (
        <>
          <View style={styles.bigCard}>
            <Text style={styles.bigLabel}>Avg Rating</Text>
            <Text style={styles.bigValue} testID="avg-rating">
              {stats.averageRating.toFixed(1)} ★
            </Text>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue} testID="total-reviews">{stats.totalReviews}</Text>
              <Text style={styles.metricLabel}>Total Reviews</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue} testID="reply-rate">
                {(stats.replyRate * 100).toFixed(0)}%
              </Text>
              <Text style={styles.metricLabel}>Reply Rate</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue} testID="pending-count">{stats.pendingCount}</Text>
              <Text style={styles.metricLabel}>Pending</Text>
            </View>
          </View>

          <View style={styles.breakdownCard} testID="rating-breakdown">
            <Text style={styles.breakdownTitle}>Rating Breakdown</Text>
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = stats.breakdown[star] ?? 0;
              const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <View key={star} style={styles.barRow}>
                  <Text style={styles.barLabel}>{star}★</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              );
            })}
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
  scroll: { padding: 16, gap: 16, backgroundColor: "#F2EDDD" },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { paddingVertical: 4 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6B6B6B" },
  title: { fontFamily: brandTypography.semibold, fontSize: 20, color: "#1A1A1A" },
  bigCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
  },
  bigLabel: { fontFamily: brandTypography.regular, fontSize: 14, color: "#9CA3AF", marginBottom: 6 },
  bigValue: { fontFamily: brandTypography.semibold, fontSize: 48, color: "#F59E0B" },
  metricsRow: { flexDirection: "row", gap: 10 },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  metricValue: { fontFamily: brandTypography.semibold, fontSize: 24, color: "#1A1A1A" },
  metricLabel: { fontFamily: brandTypography.regular, fontSize: 11, color: "#6B6B6B", marginTop: 4 },
  breakdownCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, gap: 10 },
  breakdownTitle: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#1A1A1A" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { fontFamily: brandTypography.regular, fontSize: 13, color: "#4B4B4B", width: 24 },
  barTrack: { flex: 1, height: 8, backgroundColor: "#E5E0D1", borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, backgroundColor: "#F59E0B", borderRadius: 4 },
  barCount: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6B6B6B", width: 28, textAlign: "right" },
});
