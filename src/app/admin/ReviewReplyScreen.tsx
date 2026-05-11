/**
 * W46 — ReviewReplyScreen
 *
 * Owner reply composer with canned-reply template picker.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { ReviewEntry } from "../../domains/reviews/reviewAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ReviewReplyScreenProps = {
  loading: boolean;
  error: string | null;
  review: ReviewEntry | null;
  replyText: string;
  submitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  templates: string[];
  onReplyTextChange: (text: string) => void;
  onApplyTemplate: (template: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ReviewReplyScreen({
  loading,
  error,
  review,
  replyText,
  submitting,
  submitError,
  submitSuccess,
  templates,
  onReplyTextChange,
  onApplyTemplate,
  onSubmit,
  onRetry,
  onBack,
  testID = "review-reply-screen",
}: ReviewReplyScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Reply to Review</Text>

      {loading ? <AdminLoadingState label="Loading review…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {review && !loading ? (
        <View style={styles.reviewCard} testID="review-card">
          <Text style={styles.clientName}>{review.clientName}</Text>
          <Text style={styles.stars}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</Text>
          <Text style={styles.comment}>{review.comment}</Text>
          {review.replyText ? (
            <View style={styles.existingReply} testID="existing-reply">
              <Text style={styles.existingReplyLabel}>Current reply:</Text>
              <Text style={styles.existingReplyText}>{review.replyText}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {templates.length > 0 ? (
        <View style={styles.templatesSection}>
          <Text style={styles.sectionLabel}>Templates</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {templates.map((t, i) => (
              <Pressable
                key={i}
                onPress={() => onApplyTemplate(t)}
                accessibilityRole="button"
                testID={`template-${i}`}
                style={styles.templateChip}
              >
                <Text style={styles.templateChipText} numberOfLines={1}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Your Reply</Text>
      <TextInput
        value={replyText}
        onChangeText={onReplyTextChange}
        multiline
        numberOfLines={5}
        placeholder="Write a public reply visible to all clients…"
        style={styles.textArea}
        testID="reply-input"
        accessibilityLabel="Reply text"
      />

      {submitError ? (
        <Text style={styles.errorText} testID="submit-error">{submitError}</Text>
      ) : null}
      {submitSuccess ? (
        <Text style={styles.successText} testID="submit-success">Reply published.</Text>
      ) : null}

      <Pressable
        onPress={onSubmit}
        disabled={submitting || !replyText.trim()}
        accessibilityRole="button"
        testID="submit-reply-btn"
        style={[styles.submitBtn, (submitting || !replyText.trim()) && styles.submitBtnDisabled]}
      >
        <Text style={styles.submitBtnText}>
          {submitting ? "Publishing…" : "Publish Reply"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14, backgroundColor: "#F2EDDD" },
  backBtn: { paddingVertical: 4, alignSelf: "flex-start" },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6B6B6B" },
  title: { fontFamily: brandTypography.semibold, fontSize: 22, color: "#1A1A1A" },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  clientName: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#1A1A1A" },
  stars: { fontSize: 16, color: "#F59E0B" },
  comment: { fontFamily: brandTypography.regular, fontSize: 14, color: "#4B4B4B" },
  existingReply: {
    marginTop: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    padding: 10,
  },
  existingReplyLabel: { fontFamily: brandTypography.semibold, fontSize: 12, color: "#6B7280" },
  existingReplyText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#374151" },
  templatesSection: { gap: 8 },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#6B6B6B", marginTop: 4 },
  templateChip: {
    backgroundColor: "#E5E0D1",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    maxWidth: 180,
  },
  templateChipText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#1A1A1A" },
  textArea: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    fontFamily: brandTypography.regular,
    fontSize: 14,
    color: "#1A1A1A",
    minHeight: 120,
    textAlignVertical: "top",
  },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#DC2626" },
  successText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#16A34A" },
  submitBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: { backgroundColor: "#D1D5DB" },
  submitBtnText: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#FFFFFF" },
});
