/**
 * AdminModerationScreens.tsx
 *
 * Admin-facing review moderation console:
 *   - ReviewModerationList: tabs for pending / published / hidden+rejected
 *   - ReviewCard: displays review with moderator action buttons
 *   - RatingAggregateCard: shows average + count for a staff or location
 */

import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Review, ReviewStatus } from "../../domains/reviews/model";
import { StarRatingDisplay } from "./ClientReviewScreens";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const colors = {
  background: "#F2EDDD",
  surface: "#FFFFFF",
  border: "#E5E0D1",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  primary: "#E3A9A0",
  primaryPressed: "#CF8B80",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  chip: "#EDE8DC",
  chipActive: "#E3A9A0",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModerationTab = "pending_moderation" | "published" | "archived";

export type ModerateAction = {
  reviewId: string;
  status: "published" | "hidden" | "rejected";
  reason?: string;
};

export type ReviewCardProps = {
  review: Review;
  onModerate: (action: ModerateAction) => void;
  isModerating: boolean;
};

export type FilterOption = { id: string; name: string };

export type ReviewModerationListProps = {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  activeTab: ModerationTab;
  onTabChange: (tab: ModerationTab) => void;
  onModerate: (action: ModerateAction) => void;
  moderatingId: string | null;
  /** Optional list of locations for filter dropdown */
  locations?: FilterOption[];
  /** Optional list of staff for filter dropdown */
  staffMembers?: FilterOption[];
};

// ---------------------------------------------------------------------------
// ReasonModal
// ---------------------------------------------------------------------------

type ReasonModalProps = {
  visible: boolean;
  action: "hidden" | "rejected";
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

function ReasonModal({ visible, action, onConfirm, onCancel }: ReasonModalProps) {
  const [reason, setReason] = useState("");

  function handleConfirm() {
    onConfirm(reason.trim());
    setReason("");
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID="reason-modal"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {action === "hidden" ? "Hide Review" : "Reject Review"}
          </Text>
          <Text style={styles.modalSubtitle}>Reason (optional)</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Enter reason..."
            style={styles.reasonInput}
            multiline
            testID="reason-input"
            accessibilityLabel="Moderation reason"
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel} testID="modal-cancel-btn">
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, action === "rejected" && styles.rejectBtn]}
              onPress={handleConfirm}
              testID="modal-confirm-btn"
            >
              <Text style={styles.primaryBtnText}>
                {action === "hidden" ? "Hide" : "Reject"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// ReviewCard
// ---------------------------------------------------------------------------

export function ReviewCard({ review, onModerate, isModerating }: ReviewCardProps) {
  const [pendingAction, setPendingAction] = useState<"hidden" | "rejected" | null>(null);

  function handlePublish() {
    onModerate({ reviewId: review.reviewId, status: "published" });
  }

  function handleModalConfirm(reason: string) {
    if (!pendingAction) return;
    onModerate({ reviewId: review.reviewId, status: pendingAction, reason: reason || undefined });
    setPendingAction(null);
  }

  const statusColor = review.status === "published" ? colors.success
    : review.status === "hidden" ? colors.warning
    : review.status === "rejected" ? colors.error
    : colors.muted;

  return (
    <View style={styles.card} testID={`review-card-${review.reviewId}`}>
      <View style={styles.cardHeader}>
        <Text style={styles.reviewId} numberOfLines={1}>Booking {review.bookingId}</Text>
        <View style={[styles.statusChip, { borderColor: statusColor }]}>
          <Text style={[styles.statusChipText, { color: statusColor }]}>{review.status.replace("_", " ")}</Text>
        </View>
      </View>

      <StarRatingDisplay value={review.rating} />

      {review.comment ? (
        <Text style={styles.comment}>{review.comment}</Text>
      ) : (
        <Text style={styles.noComment}>No comment</Text>
      )}

      {review.moderationReason ? (
        <Text style={styles.moderationNote}>Reason: {review.moderationReason}</Text>
      ) : null}

      {isModerating ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
      ) : (
        <View style={styles.actionRow}>
          {review.status !== "published" && (
            <Pressable
              style={[styles.actionBtn, styles.publishBtn]}
              onPress={handlePublish}
              testID={`publish-btn-${review.reviewId}`}
              accessibilityRole="button"
              accessibilityLabel="Publish review"
            >
              <Text style={styles.publishBtnText}>Publish</Text>
            </Pressable>
          )}
          {review.status !== "hidden" && review.status !== "rejected" && (
            <Pressable
              style={[styles.actionBtn, styles.hideBtn]}
              onPress={() => setPendingAction("hidden")}
              testID={`hide-btn-${review.reviewId}`}
              accessibilityRole="button"
              accessibilityLabel="Hide review"
            >
              <Text style={styles.hideBtnText}>Hide</Text>
            </Pressable>
          )}
          {review.status !== "rejected" && (
            <Pressable
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => setPendingAction("rejected")}
              testID={`reject-btn-${review.reviewId}`}
              accessibilityRole="button"
              accessibilityLabel="Reject review"
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </Pressable>
          )}
        </View>
      )}

      <ReasonModal
        visible={pendingAction === "hidden" || pendingAction === "rejected"}
        action={pendingAction ?? "hidden"}
        onConfirm={handleModalConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------

const TABS: { key: ModerationTab; label: string }[] = [
  { key: "pending_moderation", label: "Pending" },
  { key: "published", label: "Published" },
  { key: "archived", label: "Archived" },
];

function filterByTab(reviews: Review[], tab: ModerationTab): Review[] {
  if (tab === "pending_moderation") return reviews.filter((r) => r.status === "pending_moderation");
  if (tab === "published") return reviews.filter((r) => r.status === "published");
  return reviews.filter((r) => r.status === "hidden" || r.status === "rejected");
}

function filterByDimension(
  reviews: Review[],
  locationId: string | null,
  staffId: string | null,
): Review[] {
  let result = reviews;
  if (locationId) result = result.filter((r) => r.locationId === locationId);
  if (staffId)   result = result.filter((r) => r.staffId === staffId);
  return result;
}

// ---------------------------------------------------------------------------
// FilterBar
// ---------------------------------------------------------------------------

type FilterBarProps = {
  locations: FilterOption[];
  staffMembers: FilterOption[];
  selectedLocationId: string | null;
  selectedStaffId: string | null;
  onLocationChange: (id: string | null) => void;
  onStaffChange:    (id: string | null) => void;
};

function FilterBar({
  locations,
  staffMembers,
  selectedLocationId,
  selectedStaffId,
  onLocationChange,
  onStaffChange,
}: FilterBarProps) {
  if (locations.length === 0 && staffMembers.length === 0) return null;
  return (
    <View style={styles.filterBar} testID="moderation-filter-bar">
      {locations.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
          testID="location-filter-row"
        >
          <Pressable
            style={[styles.filterChip, !selectedLocationId && styles.filterChipActive]}
            onPress={() => onLocationChange(null)}
            testID="location-filter-all"
          >
            <Text style={[styles.filterChipText, !selectedLocationId && styles.filterChipTextActive]}>All locations</Text>
          </Pressable>
          {locations.map((loc) => (
            <Pressable
              key={loc.id}
              style={[styles.filterChip, selectedLocationId === loc.id && styles.filterChipActive]}
              onPress={() => onLocationChange(selectedLocationId === loc.id ? null : loc.id)}
              testID={`location-filter-${loc.id}`}
            >
              <Text style={[styles.filterChipText, selectedLocationId === loc.id && styles.filterChipTextActive]}>
                {loc.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      {staffMembers.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
          testID="staff-filter-row"
        >
          <Pressable
            style={[styles.filterChip, !selectedStaffId && styles.filterChipActive]}
            onPress={() => onStaffChange(null)}
            testID="staff-filter-all"
          >
            <Text style={[styles.filterChipText, !selectedStaffId && styles.filterChipTextActive]}>All staff</Text>
          </Pressable>
          {staffMembers.map((s) => (
            <Pressable
              key={s.id}
              style={[styles.filterChip, selectedStaffId === s.id && styles.filterChipActive]}
              onPress={() => onStaffChange(selectedStaffId === s.id ? null : s.id)}
              testID={`staff-filter-${s.id}`}
            >
              <Text style={[styles.filterChipText, selectedStaffId === s.id && styles.filterChipTextActive]}>
                {s.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ReviewModerationList
// ---------------------------------------------------------------------------

export function ReviewModerationList({
  reviews,
  isLoading,
  error,
  activeTab,
  onTabChange,
  onModerate,
  moderatingId,
  locations = [],
  staffMembers = [],
}: ReviewModerationListProps) {
  const [selectedLocationId, setSelectedLocationId] = React.useState<string | null>(null);
  const [selectedStaffId,    setSelectedStaffId]    = React.useState<string | null>(null);

  const byTab        = filterByTab(reviews, activeTab);
  const filtered     = filterByDimension(byTab, selectedLocationId, selectedStaffId);

  return (
    <View style={styles.container} testID="review-moderation-list">
      {/* Filter bar */}
      <FilterBar
        locations={locations}
        staffMembers={staffMembers}
        selectedLocationId={selectedLocationId}
        selectedStaffId={selectedStaffId}
        onLocationChange={setSelectedLocationId}
        onStaffChange={setSelectedStaffId}
      />
      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            testID={`tab-${tab.key}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.centred} testID="moderation-loading" />
      ) : error ? (
        <Text style={styles.errorText} testID="moderation-error">{error}</Text>
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText} testID="moderation-empty">No reviews in this category.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.reviewId}
          renderItem={({ item }) => (
            <ReviewCard
              review={item}
              onModerate={onModerate}
              isModerating={moderatingId === item.reviewId}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// RatingAggregateCard
// ---------------------------------------------------------------------------

export type RatingAggregateCardProps = {
  label: string;
  averageRating: number;
  reviewCount: number;
  isLoading?: boolean;
};

export function RatingAggregateCard({ label, averageRating, reviewCount, isLoading }: RatingAggregateCardProps) {
  if (isLoading) {
    return (
      <View style={styles.aggregateCard} testID="rating-aggregate-loading">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (reviewCount === 0) {
    return (
      <View style={styles.aggregateCard} testID="rating-aggregate-empty">
        <Text style={styles.aggregateLabel}>{label}</Text>
        <Text style={styles.noReviewsText}>No reviews yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.aggregateCard} testID="rating-aggregate-card">
      <Text style={styles.aggregateLabel}>{label}</Text>
      <Text style={styles.aggregateScore}>{averageRating.toFixed(1)}</Text>
      <StarRatingDisplay value={averageRating} />
      <Text style={styles.reviewCountText}>
        {reviewCount} review{reviewCount !== 1 ? "s" : ""}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabBarContent: {
    flexDirection: "row",
    paddingHorizontal: 8,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "500",
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: "700",
  },
  centred: {
    marginTop: 48,
  },
  listContent: {
    padding: 12,
    gap: 12,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
    marginTop: 48,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewId: {
    fontSize: 13,
    color: colors.muted,
    flex: 1,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  comment: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  noComment: {
    fontSize: 14,
    color: colors.muted,
    fontStyle: "italic",
  },
  moderationNote: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  actionBtn: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  publishBtn: {
    borderColor: colors.success,
    backgroundColor: "#E8F5E9",
  },
  publishBtnText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "600",
  },
  hideBtn: {
    borderColor: colors.warning,
    backgroundColor: "#FFF3E0",
  },
  hideBtnText: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: "600",
  },
  rejectBtn: {
    borderColor: colors.error,
    backgroundColor: "#FFEBEE",
  },
  rejectBtnText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.muted,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 72,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.text,
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "600",
  },
  filterBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  filterChips: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
  },
  filterChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.chip,
  },
  filterChipActive: {
    backgroundColor: colors.chipActive,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.muted,
  },
  filterChipTextActive: {
    color: colors.text,
    fontWeight: "600",
  },
  aggregateCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 4,
  },
  aggregateLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  aggregateScore: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.text,
  },
  reviewCountText: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  noReviewsText: {
    fontSize: 14,
    color: colors.muted,
    fontStyle: "italic",
  },
});
