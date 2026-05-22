/**
 * W46 — ReviewFlagScreen
 *
 * Flag, dispute, or hide a review with reason / notes and audit record.
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

import { brandTypography } from "../../shared/ui/brandTypography";
import type { ReviewEntry } from "../../domains/reviews/reviewAdminModel";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ReviewFlagAction = "flag" | "dispute" | "hide";

export type ReviewFlagScreenProps = {
  loading: boolean;
  error: string | null;
  review: ReviewEntry | null;
  action: ReviewFlagAction;
  reason: string;
  submitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  onActionChange: (a: ReviewFlagAction) => void;
  onReasonChange: (r: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const ACTION_LABELS: Record<ReviewFlagAction, string> = {
  flag: "Flag as Inappropriate",
  dispute: "Dispute",
  hide: "Hide from Public",
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ReviewFlagScreen({
  loading,
  error,
  review,
  action,
  reason,
  submitting,
  submitError,
  submitSuccess,
  onActionChange,
  onReasonChange,
  onSubmit,
  onRetry,
  onBack,
  testID = "review-flag-screen",
}: ReviewFlagScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Manage Review</Text>

      {loading ? <AdminLoadingState label="Loading review…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {review && !loading ? (
        <View style={styles.reviewCard} testID="review-card">
          <Text style={styles.clientName}>{review.clientName}</Text>
          <Text style={styles.stars}>{"★".repeat(review.rating)}</Text>
          <Text style={styles.comment} numberOfLines={3}>{review.comment}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Action</Text>
      <View style={styles.actionRow}>
        {(["flag", "dispute", "hide"] as ReviewFlagAction[]).map((a) => (
          <Pressable
            key={a}
            onPress={() => onActionChange(a)}
            accessibilityRole="radio"
            testID={`action-${a}`}
            style={[styles.actionBtn, action === a && styles.actionBtnActive]}
          >
            <Text style={[styles.actionBtnText, action === a && styles.actionBtnTextActive]}>
              {ACTION_LABELS[a]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Reason / Notes</Text>
      <TextInput
        value={reason}
        onChangeText={onReasonChange}
        multiline
        numberOfLines={4}
        placeholder="Provide context for this action…"
        style={styles.textArea}
        testID="reason-input"
        accessibilityLabel="Reason"
      />

      {submitError ? (
        <Text style={styles.errorText} testID="submit-error">{submitError}</Text>
      ) : null}
      {submitSuccess ? (
        <Text style={styles.successText} testID="submit-success">Action recorded.</Text>
      ) : null}

      <Pressable
        onPress={onSubmit}
        disabled={submitting || !reason.trim()}
        accessibilityRole="button"
        testID="submit-flag-btn"
        style={[styles.submitBtn, (submitting || !reason.trim()) && styles.submitBtnDisabled]}
      >
        <Text style={styles.submitBtnText}>{submitting ? "Saving…" : "Confirm"}</Text>
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
  stars: { fontSize: 14, color: "#F59E0B" },
  comment: { fontFamily: brandTypography.regular, fontSize: 13, color: "#4B4B4B" },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#6B6B6B", marginTop: 4 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#E5E0D1",
  },
  actionBtnActive: { backgroundColor: "#1A1A1A" },
  actionBtnText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#1A1A1A" },
  actionBtnTextActive: { color: "#FFFFFF" },
  textArea: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    fontFamily: brandTypography.regular,
    fontSize: 14,
    color: "#1A1A1A",
    minHeight: 100,
    textAlignVertical: "top",
  },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#DC2626" },
  successText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#16A34A" },
  submitBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: { backgroundColor: "#D1D5DB" },
  submitBtnText: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#FFFFFF" },
});
