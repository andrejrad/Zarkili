import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import type { MarketplacePost, PostPerformanceMetrics, PostBookingRow } from "./marketplaceAdminTypes";

export type PerPostPerformanceScreenProps = {
  loading: boolean;
  error: string | null;
  post: MarketplacePost | null;
  metrics: PostPerformanceMetrics | null;
  bookings: PostBookingRow[];
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

function fmt(n: number, dp = 0): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function PerPostPerformanceScreen({
  loading,
  error,
  post,
  metrics,
  bookings,
  onRetry,
  onBack,
  testID = "per-post-performance-screen",
}: PerPostPerformanceScreenProps) {
  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backLabel}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {post?.title ?? "Post Performance"}
        </Text>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRetry} style={styles.retryBtn} testID="retry-btn">
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Post summary card */}
          {post && (
            <View style={styles.postCard} testID="post-summary-card">
              <View style={styles.postCardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postMeta}>{post.category} · {post.status}</Text>
                </View>
                <View style={[styles.statusBadge, statusColor(post.status)]}>
                  <Text style={styles.statusBadgeText}>{post.status.replace("_", " ")}</Text>
                </View>
              </View>
              {post.priceUsd != null && (
                <Text style={styles.postPrice}>${fmt(post.priceUsd, 2)}{post.durationMin ? ` · ${post.durationMin} min` : ""}</Text>
              )}
            </View>
          )}

          {/* KPI row */}
          {metrics && (
            <View style={styles.kpiRow} testID="kpi-row">
              {[
                { label: "Impressions", value: fmt(metrics.impressions) },
                { label: "Clicks", value: fmt(metrics.clicks) },
                { label: "CTR", value: pct(metrics.ctr) },
                { label: "Bookings", value: fmt(metrics.bookings) },
                { label: "Revenue", value: `$${fmt(metrics.revenueUsd, 2)}` },
              ].map((kpi) => (
                <View key={kpi.label} style={styles.kpiTile}>
                  <Text style={styles.kpiValue}>{kpi.value}</Text>
                  <Text style={styles.kpiLabel}>{kpi.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ratings */}
          {metrics && (
            <View style={styles.ratingsCard}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <View style={styles.ratingsRow}>
                <View style={styles.ratingTile}>
                  <Text style={styles.ratingValue}>
                    {metrics.avgRating != null ? metrics.avgRating.toFixed(1) : "—"}
                  </Text>
                  <Text style={styles.ratingLabel}>Avg Rating</Text>
                </View>
                <View style={styles.ratingTile}>
                  <Text style={styles.ratingValue}>{fmt(metrics.totalReviews)}</Text>
                  <Text style={styles.ratingLabel}>Reviews</Text>
                </View>
                <View style={styles.ratingTile}>
                  <Text style={styles.ratingValue}>{pct(metrics.fiveStarPct)}</Text>
                  <Text style={styles.ratingLabel}>5-Star</Text>
                </View>
                <View style={styles.ratingTile}>
                  <Text style={[styles.ratingValue, metrics.lowRatingPct > 0.1 && styles.ratingValueWarn]}>
                    {pct(metrics.lowRatingPct)}
                  </Text>
                  <Text style={styles.ratingLabel}>Low Rating</Text>
                </View>
              </View>
            </View>
          )}

          {/* Bookings table */}
          <View style={styles.table} testID="bookings-table">
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            {bookings.length === 0 ? (
              <View style={styles.emptyState} testID="empty-state">
                <Text style={styles.emptyText}>No bookings from this post yet</Text>
              </View>
            ) : (
              <>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 2 }]}>Client</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Revenue</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Rating</Text>
                </View>
                {bookings.map((row) => (
                  <View key={row.bookingId} style={styles.tableRow} testID={`booking-row-${row.bookingId}`}>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{row.clientName}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{row.serviceDate.slice(0, 10)}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>${fmt(row.revenueUsd, 2)}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                      {row.rating != null ? `${row.rating}★` : "—"}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

type PostStatus = "draft" | "published" | "hidden" | "compliance_blocked";
function statusColor(status: PostStatus) {
  const map: Record<PostStatus, object> = {
    draft: { backgroundColor: "#f3f4f6" },
    published: { backgroundColor: "#d1fae5" },
    hidden: { backgroundColor: "#fef9c3" },
    compliance_blocked: { backgroundColor: "#fee2e2" },
  };
  return map[status] ?? {};
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 8,
  },
  backLabel: { fontSize: 16, color: "#007AFF", marginRight: 4 },
  title: { flex: 1, fontSize: 18, fontWeight: "600", color: "#1a1a1a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 14, color: "#ef4444", textAlign: "center", paddingHorizontal: 24 },
  retryBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: { color: "#fff", fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
  },
  postCardRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  postTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  postMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  postPrice: { fontSize: 14, color: "#007AFF", fontWeight: "600", marginTop: 6 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: "600", color: "#333", textTransform: "capitalize" },
  kpiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  kpiTile: {
    flex: 1,
    minWidth: "18%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  kpiValue: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  kpiLabel: { fontSize: 11, color: "#888", marginTop: 2, textAlign: "center" },
  ratingsCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  ratingsRow: { flexDirection: "row", gap: 8 },
  ratingTile: { flex: 1, alignItems: "center" },
  ratingValue: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  ratingValueWarn: { color: "#ef4444" },
  ratingLabel: { fontSize: 11, color: "#888", marginTop: 2, textAlign: "center" },
  table: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
  },
  emptyState: { paddingVertical: 24, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#aaa" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 6,
    marginBottom: 2,
  },
  tableHeaderCell: { fontWeight: "700", color: "#555", fontSize: 12 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableCell: { fontSize: 13, color: "#333" },
});
