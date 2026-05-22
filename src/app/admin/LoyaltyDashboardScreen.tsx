/**
 * W45 — LoyaltyDashboardScreen
 *
 * Loyalty programme performance: stat cards, tier distribution,
 * and recent transaction feed.
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
import type {
  LoyaltyActivitySummary,
  LoyaltyProgramStats,
  TierDistributionEntry,
} from "../../domains/loyalty/loyaltyAdminModel";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type LoyaltyDashboardScreenProps = {
  loading: boolean;
  error: string | null;
  stats: LoyaltyProgramStats | null;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={statCardStyles.card}>
      <Text style={statCardStyles.value}>{value}</Text>
      <Text style={statCardStyles.label}>{label}</Text>
    </View>
  );
}

const statCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  value: { fontFamily: brandTypography.semibold, fontSize: 22, color: "#4f46e5" },
  label: { fontFamily: brandTypography.regular, fontSize: 11, color: "#6b7280", textAlign: "center", marginTop: 2 },
});

function TierRow({ entry }: { entry: TierDistributionEntry }) {
  return (
    <View style={tierRowStyles.row} testID={`tier-dist-${entry.tierId}`}>
      <Text style={tierRowStyles.name}>{entry.tierName}</Text>
      <Text style={tierRowStyles.count}>{entry.count}</Text>
    </View>
  );
}

const tierRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  name: { fontFamily: brandTypography.regular, fontSize: 14, color: "#374151" },
  count: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#111827" },
});

function TxRow({ tx }: { tx: LoyaltyActivitySummary }) {
  return (
    <View style={txRowStyles.row} testID={`tx-row-${tx.txId}`}>
      <View style={txRowStyles.info}>
        <Text style={txRowStyles.client}>{tx.clientName}</Text>
        <Text style={txRowStyles.reason}>{tx.reason}</Text>
      </View>
      <Text style={[txRowStyles.points, tx.direction === "credit" ? txRowStyles.credit : txRowStyles.debit]}>
        {tx.direction === "credit" ? "+" : "-"}{tx.points}
      </Text>
    </View>
  );
}

const txRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  info: { flex: 1, gap: 2 },
  client: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#111827" },
  reason: { fontFamily: brandTypography.regular, fontSize: 11, color: "#6b7280" },
  points: { fontFamily: brandTypography.semibold, fontSize: 14 },
  credit: { color: "#16a34a" },
  debit: { color: "#ef4444" },
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function LoyaltyDashboardScreen({
  loading,
  error,
  stats,
  onRetry,
  onBack,
  testID = "loyalty-dashboard-screen",
}: LoyaltyDashboardScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Loyalty Dashboard</Text>
      </View>

      {loading && <AdminLoadingState label="Loading dashboard…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && stats && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Stat cards */}
          <View style={styles.statRow}>
            <StatCard label="Enrolled" value={stats.totalEnrolled} />
            <StatCard label="Active (month)" value={stats.activeThisMonth} />
          </View>
          <View style={styles.statRow}>
            <StatCard label="Points issued" value={stats.totalPointsIssued} />
            <StatCard label="Points redeemed" value={stats.totalPointsRedeemed} />
          </View>
          <View style={styles.statRowSingle}>
            <StatCard label="Avg balance" value={stats.averageBalance.toFixed(0)} />
          </View>

          {/* Tier distribution */}
          <Text style={styles.sectionLabel}>Tier distribution</Text>
          <View style={styles.card} testID="tier-distribution">
            {stats.tierDistribution.map((t) => (
              <TierRow key={t.tierId} entry={t} />
            ))}
          </View>

          {/* Recent transactions */}
          <Text style={styles.sectionLabel}>Recent transactions</Text>
          <View style={styles.card} testID="recent-transactions">
            {stats.recentTransactions.length === 0 && (
              <Text style={styles.emptyText}>No recent transactions.</Text>
            )}
            {stats.recentTransactions.map((tx) => (
              <TxRow key={tx.txId} tx={tx} />
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
  title: { fontFamily: brandTypography.semibold, fontSize: 18, color: "#111827" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  statRow: { flexDirection: "row", gap: 12 },
  statRowSingle: { flexDirection: "row" },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#374151", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#9ca3af", textAlign: "center", paddingVertical: 8 },
});
