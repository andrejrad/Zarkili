/**
 * ClientReviewScreens.tsx
 *
 * Client-facing review submission flow:
 *   - ReviewPromptBanner: CTA shown after a completed appointment when no review exists yet
 *   - StarRatingInput: interactive 1–5 star picker
 *   - ReviewSubmitForm: rating + optional comment + submit button with states
 *   - ReviewSuccessView: post-submit confirmation
 */

import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Review } from "../../domains/reviews/model";

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
  starActive: "#F5C842",
  starInactive: "#D1C7B0",
  success: "#4CAF50",
  error: "#F44336",
};

// ---------------------------------------------------------------------------
// StarRatingInput
// ---------------------------------------------------------------------------

export type StarRatingInputProps = {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
};

export function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
  return (
    <View style={styles.starRow} accessibilityRole="radiogroup" accessibilityLabel="Star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => !disabled && onChange(star)}
          accessibilityRole="radio"
          accessibilityLabel={`${star} star${star !== 1 ? "s" : ""}`}
          accessibilityState={{ checked: value >= star, disabled }}
          testID={`star-${star}`}
          style={styles.starBtn}
        >
          <Text style={[styles.starIcon, { color: value >= star ? colors.starActive : colors.starInactive }]}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// StarRatingDisplay (read-only)
// ---------------------------------------------------------------------------

export type StarRatingDisplayProps = {
  value: number;
  /** Max integer 1–5. Defaults to 5. */
  max?: number;
};

export function StarRatingDisplay({ value, max = 5 }: StarRatingDisplayProps) {
  const rounded = Math.round(value);
  return (
    <View style={styles.starRow} accessibilityLabel={`${value} out of 5 stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Text
          key={i}
          style={[styles.starIcon, { color: rounded > i ? colors.starActive : colors.starInactive }]}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ReviewPromptBanner
// ---------------------------------------------------------------------------

export type ReviewPromptBannerProps = {
  /** The existing review for this booking — null means user is eligible to submit */
  existingReview: Review | null;
  isLoading: boolean;
  onWriteReview: () => void;
};

export function ReviewPromptBanner({ existingReview, isLoading, onWriteReview }: ReviewPromptBannerProps) {
  if (isLoading) {
    return (
      <View style={styles.bannerContainer} testID="review-banner-loading">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (existingReview) {
    return (
      <View style={styles.bannerContainer} testID="review-banner-submitted">
        <Text style={styles.bannerText}>You've already reviewed this appointment.</Text>
        <StarRatingDisplay value={existingReview.rating} />
      </View>
    );
  }

  return (
    <View style={styles.bannerContainer} testID="review-banner-cta">
      <Text style={styles.bannerHeading}>How was your appointment?</Text>
      <Text style={styles.bannerText}>Share your experience to help others.</Text>
      <Pressable
        style={styles.primaryBtn}
        onPress={onWriteReview}
        accessibilityRole="button"
        testID="write-review-btn"
      >
        <Text style={styles.primaryBtnText}>Write a Review</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ReviewSubmitForm
// ---------------------------------------------------------------------------

export type ReviewSubmitFormProps = {
  staffName?: string;
  onSubmit: (rating: number, comment: string | null) => void;
  isSubmitting: boolean;
  submitError: string | null;
};

export function ReviewSubmitForm({ staffName, onSubmit, isSubmitting, submitError }: ReviewSubmitFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  function handleSubmit() {
    if (rating < 1) return;
    onSubmit(rating, comment.trim() || null);
  }

  return (
    <ScrollView contentContainerStyle={styles.formContainer} testID="review-submit-form">
      {staffName ? (
        <Text style={styles.formHeading}>Review for {staffName}</Text>
      ) : (
        <Text style={styles.formHeading}>Rate your appointment</Text>
      )}

      <Text style={styles.label}>Your rating</Text>
      <StarRatingInput value={rating} onChange={setRating} disabled={isSubmitting} />

      <Text style={styles.label}>Comment (optional)</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Share details about your experience..."
        multiline
        numberOfLines={4}
        style={styles.commentInput}
        editable={!isSubmitting}
        testID="review-comment-input"
        accessibilityLabel="Review comment"
      />

      {submitError ? (
        <Text style={styles.errorText} testID="review-submit-error">{submitError}</Text>
      ) : null}

      <Pressable
        style={[styles.primaryBtn, (rating < 1 || isSubmitting) && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={rating < 1 || isSubmitting}
        accessibilityRole="button"
        testID="submit-review-btn"
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.primaryBtnText}>Submit Review</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// ReviewSuccessView
// ---------------------------------------------------------------------------

export type ReviewSuccessViewProps = {
  onDone: () => void;
};

export function ReviewSuccessView({ onDone }: ReviewSuccessViewProps) {
  return (
    <View style={styles.successContainer} testID="review-success-view">
      <Text style={styles.successIcon}>✓</Text>
      <Text style={styles.successHeading}>Thank you for your review!</Text>
      <Text style={styles.bannerText}>Your feedback helps us improve.</Text>
      <Pressable
        style={styles.primaryBtn}
        onPress={onDone}
        accessibilityRole="button"
        testID="review-done-btn"
      >
        <Text style={styles.primaryBtnText}>Done</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  starRow: {
    flexDirection: "row",
    gap: 4,
    marginVertical: 8,
  },
  starBtn: {
    padding: 4,
  },
  starIcon: {
    fontSize: 32,
  },
  bannerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 8,
  },
  bannerHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  bannerText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
  },
  formContainer: {
    padding: 16,
    gap: 4,
  },
  formHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: "top",
    minHeight: 96,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 16,
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 8,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  successIcon: {
    fontSize: 56,
    color: colors.success,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
});
