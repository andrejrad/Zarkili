/**
 * W46 — ReviewQueueScreen
 *
 * Admin review queue with filter chips (all / pending / replied / flagged /
 * hidden / disputed), bulk-action bar, and row-level reply/flag/hide shortcuts.
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
import type { ReviewEntry, ReviewQueueFilter } from "../../domains/reviews/reviewAdminModel";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ReviewQueueScreenProps = {
  loading: boolean;
  error: string | null;
  reviews: ReviewEntry[];
  filter: ReviewQueueFilter;
  selectedIds: string[];
  onFilterChange: (f: ReviewQueueFilter) => void;
  onOpenReview: (reviewId: string) => void;
  onToggleSelect: (reviewId: string) => void;
  onBulkHide: () => void;
  onBulkFlag: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const FILTER_LABELS: Record<ReviewQueueFilter, string> = {
  all: "All",
  pending: "Pending",
  replied: "Replied",
  flagged: "Flagged",
  hidden: "Hidden",
  disputed: "Disputed",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  replied: "#16a34a",
  flagged: "#ef4444",
  hidden: "#9ca3af",
  disputed: "#7c3aed",
};

const FILTERS: ReviewQueueFilter[] = ["all", "pending", "replied", "flagged", "hidden", "disputed"];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <Text style={styles.stars}>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</Text>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ReviewQueueScreen({
  loading,
  error,
  reviews,
  filter,
  selectedIds,
  onFilterChange,
  onOpenReview,
  onToggleSelect,
  onBulkHide,
  onBulkFlag,
  onRetry,
  onBack,
  testID = "review-queue-screen",
}: ReviewQueueScreenProps) {
  const hasSelection = selectedIds.length > 0;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Review Queue</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => onFilterChange(f)}
            style={[styles.chip, filter === f && styles.chipActive]}
            testID={`filter-${f}`}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {hasSelection && (
        <View style={styles.bulkBar} testID="bulk-action-bar">
          <Text style={styles.bulkLabel}>{selectedIds.length} selected</Text>
          <Pressable onPress={onBulkHide} accessibilityRole="button" testID="bulk-hide-btn" style={styles.bulkBtn}>
            <Text style={styles.bulkBtnText}>Hide</Text>
          </Pressable>
          <Pressable onPress={onBulkFlag} accessibilityRole="button" testID="bulk-flag-btn" style={[styles.bulkBtn, styles.bulkBtnDanger]}>
            <Text style={styles.bulkBtnText}>Flag</Text>
          </Pressable>
        </View>
      )}

      {loading ? <AdminLoadingState label="Loading reviews…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {!loading && !error && reviews.length === 0 ? (
        <AdminEmptyState title="No Reviews" body="No reviews match the current filter." />
      ) : null}

      {!loading && !error && reviews.length > 0 ? (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {reviews.map((review) => {
            const isSelected = selectedIds.includes(review.reviewId);
            return (
              <Pressable
                key={review.reviewId}
                onPress={() => onOpenReview(review.reviewId)}
                onLongPress={() => onToggleSelect(review.reviewId)}
                accessibilityRole="button"
                testID={`review-row-${review.reviewId}`}
                style={[styles.row, isSelected && styles.rowSelected]}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.clientName}>{review.clientName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[review.status] + "22" }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[review.status] }]}>
                      {review.status}
                    </Text>
                  </View>
                </View>
                <StarDisplay rating={review.rating} />
                <Text style={styles.comment} numberOfLines={2}>{review.comment}</Text>
                <Text style={styles.date}>{review.createdAt.split("T")[0]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2EDDD" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6B6B6B" },
  title: { fontFamily: brandTypography.semibold, fontSize: 20, color: "#1A1A1A", flex: 1 },
  filterBar: { flexGrow: 0 },
  filterBarContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E5E0D1",
  },
  chipActive: { backgroundColor: "#1A1A1A" },
  chipText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#6B6B6B" },
  chipTextActive: { color: "#FFFFFF" },
  bulkBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1A1A1A",
    gap: 8,
  },
  bulkLabel: { fontFamily: brandTypography.regular, fontSize: 13, color: "#FFFFFF", flex: 1 },
  bulkBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#4B5563",
  },
  bulkBtnDanger: { backgroundColor: "#DC2626" },
  bulkBtnText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#FFFFFF" },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  row: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  rowSelected: { borderWidth: 2, borderColor: "#1A1A1A" },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clientName: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#1A1A1A" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontFamily: brandTypography.semibold, fontSize: 11 },
  stars: { fontSize: 14, color: "#F59E0B", letterSpacing: 1 },
  comment: { fontFamily: brandTypography.regular, fontSize: 13, color: "#4B4B4B", lineHeight: 18 },
  date: { fontFamily: brandTypography.regular, fontSize: 11, color: "#9CA3AF" },
});
