/**
 * ReviewsEdgeScreen.tsx — J.11 Reviews Edge Cases (W30 Batch J).
 *
 * Covers the review-list surfaces not included in the W25 Batch E foundation:
 *
 *   ReviewsEdgeScreen      — list with filter/sort chips + HelpfulUnhelpfulChip
 *                            on each row, salon reply, photo lightbox trigger.
 *   ReviewFilterSortSheet  — ModalSheet for filter (rating, photos) + sort.
 *   ReviewphotoLightbox    — full-screen pinch-zoom swipe overlay (placeholder).
 *   ReviewGuidelinesPage   — uses LegalPageLayout.
 *
 * States: default | filtered | sorted | helpful-voted | edited | deleted |
 *         lightbox-open | error
 */

import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import {
  Banner,
  Button,
  HelpfulUnhelpfulChip,
  LegalPageLayout,
  ModalSheet,
  RatingStars,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import type { HelpfulVote } from "../../shared/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewFilter = {
  minRating?: 1 | 2 | 3 | 4 | 5;
  withPhotosOnly?: boolean;
};

export type ReviewSortOption = "newest" | "highest-rated" | "most-helpful";

export type ReviewSalonReply = {
  salonName: string;
  text: string;
  replyDate: string;
};

export type ReviewListItem = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  postedDate: string;
  photoCount?: number;
  helpfulCount: number;
  unhelpfulCount: number;
  userVote?: HelpfulVote;
  salonReply?: ReviewSalonReply;
  isMyReview?: boolean;
};

// ---------------------------------------------------------------------------
// J.11.1 — Reviews edge list screen
// ---------------------------------------------------------------------------

export type ReviewsEdgeScreenProps = {
  reviews: ReviewListItem[];
  filter?: ReviewFilter;
  sort?: ReviewSortOption;
  errorMessage?: string;
  onVoteHelpful: (reviewId: string) => void;
  onVoteUnhelpful: (reviewId: string) => void;
  onOpenPhoto: (reviewId: string, photoIndex: number) => void;
  onEditReview: (reviewId: string) => void;
  onDeleteReview: (reviewId: string) => void;
  onOpenFilterSort: () => void;
  testID?: string;
};

export function ReviewsEdgeScreen({
  reviews,
  errorMessage,
  onVoteHelpful,
  onVoteUnhelpful,
  onOpenPhoto,
  onEditReview,
  onDeleteReview,
  onOpenFilterSort,
  testID,
}: ReviewsEdgeScreenProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  return (
    <View style={styles.root} testID={testID}>
      {/* Filter/sort header bar */}
      <Pressable
        style={styles.filterBar}
        onPress={onOpenFilterSort}
        accessibilityRole="button"
        testID={testID ? `${testID}-filter-sort` : undefined}
      >
        <Text style={styles.filterBarText}>Filter & Sort</Text>
        <Text style={styles.filterBarChevron}>⚙</Text>
      </Pressable>

      {errorMessage && (
        <Banner
          variant="error"
          message={errorMessage}
          testID={testID ? `${testID}-error` : undefined}
        />
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {reviews.map((review) => (
          <View
            key={review.id}
            style={styles.card}
            testID={testID ? `${testID}-review-${review.id}` : undefined}
          >
            {/* Author + rating row */}
            <View style={styles.cardHeader}>
              <View style={styles.authorWrap}>
                <Text style={styles.authorName}>{review.authorName}</Text>
                <Text style={styles.reviewDate}>{review.postedDate}</Text>
              </View>
              <RatingStars value={review.rating} size={16} />
            </View>

            {/* Body */}
            <Text style={styles.reviewBody}>{review.body}</Text>

            {/* Photos row */}
            {review.photoCount && review.photoCount > 0 ? (
              <Pressable
                style={styles.photosRow}
                onPress={() => onOpenPhoto(review.id, 0)}
                accessibilityRole="button"
                testID={testID ? `${testID}-photo-${review.id}` : undefined}
              >
                <Text style={styles.photosLabel}>
                  📷 {review.photoCount} photo{review.photoCount > 1 ? "s" : ""}
                </Text>
              </Pressable>
            ) : null}

            {/* Salon reply */}
            {review.salonReply && (
              <View
                style={styles.salonReply}
                testID={testID ? `${testID}-reply-${review.id}` : undefined}
              >
                <Text style={styles.salonReplyAuthor}>
                  {review.salonReply.salonName} replied
                  <Text style={styles.salonReplyDate}>
                    {" · " + review.salonReply.replyDate}
                  </Text>
                </Text>
                <Text style={styles.salonReplyText}>{review.salonReply.text}</Text>
              </View>
            )}

            {/* Footer: helpful chip + my-review actions */}
            <View style={styles.cardFooter}>
              <HelpfulUnhelpfulChip
                helpfulCount={review.helpfulCount}
                unhelpfulCount={review.unhelpfulCount}
                userVote={review.userVote}
                onPressHelpful={() => onVoteHelpful(review.id)}
                onPressUnhelpful={() => onVoteUnhelpful(review.id)}
                testID={testID ? `${testID}-vote-${review.id}` : undefined}
              />

              {review.isMyReview && (
                <View style={styles.myReviewActions}>
                  <Pressable
                    onPress={() => onEditReview(review.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    testID={testID ? `${testID}-edit-${review.id}` : undefined}
                  >
                    <Text style={styles.editLink}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingDeleteId(review.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    testID={testID ? `${testID}-delete-${review.id}` : undefined}
                  >
                    <Text style={styles.deleteLink}>Delete</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Delete confirmation sheet */}
      <ModalSheet
        visible={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        title="Delete this review?"
        testID={testID ? `${testID}-delete-confirm-sheet` : undefined}
        footer={
          <View style={styles.deleteFooter}>
            <Button
              label="Delete review"
              variant="destructive"
              onPress={() => {
                if (pendingDeleteId) onDeleteReview(pendingDeleteId);
                setPendingDeleteId(null);
              }}
              testID={testID ? `${testID}-confirm-delete` : undefined}
            />
            <Button
              label="Keep review"
              variant="tertiary"
              onPress={() => setPendingDeleteId(null)}
              testID={testID ? `${testID}-cancel-delete` : undefined}
            />
          </View>
        }
      >
        <View style={styles.deleteBody}>
          <Text style={styles.deleteDescription}>
            This action cannot be undone. The review will be permanently removed.
          </Text>
        </View>
      </ModalSheet>
    </View>
  );
}

// ---------------------------------------------------------------------------
// J.11.2 — Filter + Sort sheet
// ---------------------------------------------------------------------------

export type ReviewFilterSortSheetProps = {
  visible: boolean;
  filter: ReviewFilter;
  sort: ReviewSortOption;
  onApply: (filter: ReviewFilter, sort: ReviewSortOption) => void;
  onClose: () => void;
  testID?: string;
};

const SORT_LABELS: Record<ReviewSortOption, string> = {
  newest: "Newest first",
  "highest-rated": "Highest rated",
  "most-helpful": "Most helpful",
};

export function ReviewFilterSortSheet({
  visible,
  filter: initialFilter,
  sort: initialSort,
  onApply,
  onClose,
  testID,
}: ReviewFilterSortSheetProps) {
  const [filter, setFilter] = useState<ReviewFilter>(initialFilter);
  const [sort, setSort] = useState<ReviewSortOption>(initialSort);

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Filter & Sort"
      testID={testID}
      footer={
        <View style={styles.sheetFooter}>
          <Button
            label="Apply"
            variant="primary"
            onPress={() => onApply(filter, sort)}
            testID={testID ? `${testID}-apply` : undefined}
          />
        </View>
      }
    >
      <View style={styles.sheetBody}>
        {/* Rating filter */}
        <Text style={styles.sheetSectionTitle}>Minimum rating</Text>
        <View style={styles.ratingFilterRow}>
          {([1, 2, 3, 4, 5] as const).map((r) => (
            <Pressable
              key={r}
              style={[
                styles.ratingChip,
                filter.minRating === r && styles.ratingChipSelected,
              ]}
              onPress={() =>
                setFilter((f) => ({
                  ...f,
                  minRating: f.minRating === r ? undefined : r,
                }))
              }
              accessibilityRole="radio"
              accessibilityState={{ selected: filter.minRating === r }}
              testID={testID ? `${testID}-rating-${r}` : undefined}
            >
              <Text
                style={[
                  styles.ratingChipText,
                  filter.minRating === r && styles.ratingChipTextSelected,
                ]}
              >
                {"⭐".repeat(r)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Photos filter */}
        <Pressable
          style={styles.toggleRow}
          onPress={() =>
            setFilter((f) => ({
              ...f,
              withPhotosOnly: !f.withPhotosOnly,
            }))
          }
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!filter.withPhotosOnly }}
          testID={testID ? `${testID}-photos-filter` : undefined}
        >
          <Text style={styles.toggleLabel}>With photos only</Text>
          <View
            style={[
              styles.checkbox,
              filter.withPhotosOnly && styles.checkboxChecked,
            ]}
          >
            {filter.withPhotosOnly && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </Pressable>

        {/* Sort */}
        <Text style={styles.sheetSectionTitle}>Sort by</Text>
        {(Object.keys(SORT_LABELS) as ReviewSortOption[]).map((opt) => (
          <Pressable
            key={opt}
            style={[styles.sortRow, sort === opt && styles.sortRowSelected]}
            onPress={() => setSort(opt)}
            accessibilityRole="radio"
            accessibilityState={{ selected: sort === opt }}
            testID={testID ? `${testID}-sort-${opt}` : undefined}
          >
            <Text
              style={[
                styles.sortLabel,
                sort === opt && styles.sortLabelSelected,
              ]}
            >
              {SORT_LABELS[opt]}
            </Text>
            {sort === opt && <Text style={styles.sortCheck}>✓</Text>}
          </Pressable>
        ))}
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// J.11.3 — Photo Lightbox
// ---------------------------------------------------------------------------

export type ReviewPhotoLightboxProps = {
  visible: boolean;
  photoCount: number;
  initialIndex?: number;
  onClose: () => void;
  testID?: string;
};

export function ReviewPhotoLightbox({
  visible,
  photoCount,
  initialIndex = 0,
  onClose,
  testID,
}: ReviewPhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.lightboxRoot}>
        {/* Close button */}
        <Pressable
          style={styles.lightboxClose}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          testID={testID ? `${testID}-close` : undefined}
        >
          <Text style={styles.lightboxCloseIcon}>✕</Text>
        </Pressable>

        {/* Placeholder photo area (pinch-zoom handled by native GestureHandler) */}
        <View
          style={styles.lightboxPhoto}
          testID={testID ? `${testID}-photo-${currentIndex}` : undefined}
        >
          <Text style={styles.lightboxPhotoPlaceholder}>
            📷 Photo {currentIndex + 1} of {photoCount}
          </Text>
        </View>

        {/* Nav buttons */}
        <View style={styles.lightboxNav}>
          <Pressable
            style={[styles.lightboxNavBtn, currentIndex === 0 && styles.navBtnDisabled]}
            onPress={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            accessibilityRole="button"
            accessibilityLabel="Previous photo"
            testID={testID ? `${testID}-prev` : undefined}
          >
            <Text style={styles.lightboxNavIcon}>‹</Text>
          </Pressable>
          <Text style={styles.lightboxCounter}>
            {currentIndex + 1} / {photoCount}
          </Text>
          <Pressable
            style={[
              styles.lightboxNavBtn,
              currentIndex === photoCount - 1 && styles.navBtnDisabled,
            ]}
            onPress={() =>
              setCurrentIndex((i) => Math.min(photoCount - 1, i + 1))
            }
            disabled={currentIndex === photoCount - 1}
            accessibilityRole="button"
            accessibilityLabel="Next photo"
            testID={testID ? `${testID}-next` : undefined}
          >
            <Text style={styles.lightboxNavIcon}>›</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// J.11.4 — Review Guidelines Page (uses LegalPageLayout)
// ---------------------------------------------------------------------------

const GUIDELINES_SECTIONS = [
  {
    id: "authentic",
    heading: "Be authentic",
    body: "Only review businesses you've actually visited. Your honest experiences help other customers make informed decisions.",
  },
  {
    id: "respectful",
    heading: "Be respectful",
    body: "Constructive criticism is welcome. Profanity, personal attacks, and hate speech are not permitted.",
  },
  {
    id: "relevant",
    heading: "Stay relevant",
    body: "Focus on the service, staff, and salon experience. Mentions of pricing disputes or legal matters should be directed to support.",
  },
  {
    id: "no-spam",
    heading: "No spam or promotions",
    body: "Do not post reviews on behalf of the salon, as part of a coordinated campaign, or that include promotional content.",
  },
  {
    id: "photos",
    heading: "Photos",
    body: "Only upload photos taken at the salon. No screenshots, logos, or unrelated images.",
  },
];

export type ReviewGuidelinesPageProps = {
  onPressBack?: () => void;
  testID?: string;
};

export function ReviewGuidelinesPage({
  onPressBack,
  testID,
}: ReviewGuidelinesPageProps) {
  return (
    <LegalPageLayout
      title="Review Guidelines"
      lastUpdated="January 1, 2025"
      onBack={onPressBack}
      testID={testID}
    >
      {GUIDELINES_SECTIONS.map((s) => (
        <View key={s.id} style={styles.guidelineSection}>
          <Text style={styles.guidelineHeading}>{s.heading}</Text>
          <Text style={styles.guidelineBody}>{s.body}</Text>
        </View>
      ))}
    </LegalPageLayout>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
  },
  filterBarText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  filterBarChevron: {
    fontSize: 18,
    color: colors.textMuted,
  },
  list: {
    padding: spacing.pageHorizontal,
    gap: spacing.s3,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.s4,
    gap: spacing.s3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  authorWrap: {
    gap: spacing.s1,
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  reviewBody: {
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 22,
  },
  photosRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
  },
  photosLabel: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
  },
  salonReply: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.s3,
    gap: spacing.s1,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  salonReplyAuthor: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
  },
  salonReplyDate: {
    fontWeight: "400",
    color: colors.textMuted,
  },
  salonReplyText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  myReviewActions: {
    flexDirection: "row",
    gap: spacing.s3,
  },
  editLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
  },
  deleteLink: {
    fontSize: 13,
    color: colors.error,
    fontWeight: "500",
  },
  deleteFooter: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s2,
  },
  deleteBody: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s4,
  },
  deleteDescription: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  sheetBody: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s4,
    gap: spacing.s4,
  },
  sheetFooter: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
  },
  sheetSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  ratingFilterRow: {
    flexDirection: "row",
    gap: spacing.s2,
    flexWrap: "wrap",
  },
  ratingChip: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ratingChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ratingChipText: {
    fontSize: 14,
    color: colors.foreground,
  },
  ratingChipTextSelected: {
    color: colors.surface,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
  },
  toggleLabel: {
    fontSize: 15,
    color: colors.foreground,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
  },
  sortRowSelected: {
    backgroundColor: colors.primary10,
  },
  sortLabel: {
    fontSize: 15,
    color: colors.foreground,
  },
  sortLabelSelected: {
    fontWeight: "600",
    color: colors.primary,
  },
  sortCheck: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "700",
  },
  // Lightbox styles
  lightboxRoot: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxClose: {
    position: "absolute",
    top: spacing.s6,
    right: spacing.s4,
    zIndex: 10,
    padding: spacing.s2,
  },
  lightboxCloseIcon: {
    fontSize: 22,
    color: "#FFF",
  },
  lightboxPhoto: {
    width: "100%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  lightboxPhotoPlaceholder: {
    fontSize: 18,
    color: "#AAA",
    textAlign: "center",
  },
  lightboxNav: {
    position: "absolute",
    bottom: spacing.s8,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s6,
  },
  lightboxNavBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.full,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  lightboxNavIcon: {
    fontSize: 28,
    color: "#FFF",
    fontWeight: "300",
  },
  lightboxCounter: {
    fontSize: 14,
    color: "#FFF",
    opacity: 0.8,
  },
  guidelineSection: {
    marginBottom: spacing.s6,
  },
  guidelineHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: spacing.s2,
  },
  guidelineBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
