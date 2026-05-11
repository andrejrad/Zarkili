/**
 * W45 — ActivityAnalyticsScreen
 *
 * Stats for a single loyalty activity: participants, completions, rate,
 * rewards, and daily progress list.
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
import type { ActivityStats } from "../../domains/loyalty/loyaltyAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ActivityAnalyticsScreenProps = {
  loading: boolean;
  error: string | null;
  stats: ActivityStats | null;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ActivityAnalyticsScreen({
  loading,
  error,
  stats,
  onRetry,
  onBack,
  testID = "activity-analytics-screen",
}: ActivityAnalyticsScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {stats ? stats.activityName : "Activity Analytics"}
        </Text>
      </View>

      {loading && <AdminLoadingState label="Loading analytics…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && stats && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Stats grid */}
          <View style={styles.statsGrid} testID="stats-grid">
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalParticipants}</Text>
              <Text style={styles.statLabel}>Participants</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completedCount}</Text>
              <Text style={styles.statLabel}>Completions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{(stats.completionRate * 100).toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.rewardsIssued}</Text>
              <Text style={styles.statLabel}>Rewards</Text>
            </View>
          </View>

          {/* Daily progress */}
          <Text style={styles.sectionLabel}>Daily progress</Text>
          <View style={styles.card} testID="daily-progress">
            {stats.dailyProgress.length === 0 && (
              <Text style={styles.emptyText}>No daily data available.</Text>
            )}
            {stats.dailyProgress.map((d) => (
              <View key={d.date} style={styles.dailyRow} testID={`daily-row-${d.date}`}>
                <Text style={styles.dailyDate}>{d.date}</Text>
                <Text style={styles.dailyStat}>+{d.newParticipants} new</Text>
                <Text style={styles.dailyStat}>{d.completions} done</Text>
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
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    minWidth: "45%",
    flex: 1,
  },
  statValue: { fontFamily: brandTypography.semibold, fontSize: 22, color: "#4f46e5" },
  statLabel: { fontFamily: brandTypography.regular, fontSize: 11, color: "#6b7280", marginTop: 2 },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#374151", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#9ca3af", textAlign: "center", paddingVertical: 8 },
  dailyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dailyDate: { fontFamily: brandTypography.regular, fontSize: 13, color: "#374151", flex: 1 },
  dailyStat: { fontFamily: brandTypography.regular, fontSize: 13, color: "#6b7280", marginLeft: 8 },
});
