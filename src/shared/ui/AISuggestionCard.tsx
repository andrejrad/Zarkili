/**
 * AISuggestionCard.tsx — W27 Batch G primitive.
 *
 * AI-generated suggestion card with:
 *  – tinted top-bar: "AI" pill + type label + "Why?" explainability link
 *  – body text (up to 3 lines)
 *  – action row: primary + secondary + dismiss (×)
 *  – feedback row: thumbs-up / thumbs-down (shown after accepted/dismissed resolution)
 *
 * States: default | accepted | dismissed | error
 * Suggest types: scheduling | retention | content
 *
 * Used in: G.1 StaffTodayScreen, G.7 AI Suggestion Patterns library.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";
import type { AISuggestion } from "../staffTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AISuggestionState = "default" | "accepted" | "dismissed" | "error";

export type AISuggestionCardProps = {
  suggestion: AISuggestion;
  cardState?: AISuggestionState;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onDismiss?: () => void;
  onUndo?: () => void;
  onWhy?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  testID?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AISuggestionCard({
  suggestion,
  cardState = "default",
  onPrimaryAction,
  onSecondaryAction,
  onDismiss,
  onUndo,
  onWhy,
  onThumbsUp,
  onThumbsDown,
  testID,
}: AISuggestionCardProps) {
  const isAccepted = cardState === "accepted";
  const isDismissed = cardState === "dismissed";
  const isError = cardState === "error";
  const isResolved = isAccepted || isDismissed;

  const topBarBg = isAccepted
    ? "rgba(76,175,80,0.12)"
    : "rgba(187,237,218,0.30)";
  const aiTagBg = isAccepted ? "#4CAF50" : colors.accent;
  const aiTagFg = isAccepted ? colors.white : colors.accentForeground;

  return (
    <View
      style={[
        styles.container,
        isDismissed && styles.containerDismissed,
        isError && styles.containerError,
      ]}
      testID={testID}
      accessible
      accessibilityRole="none"
    >
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: topBarBg }]}>
        <View
          style={[styles.aiTag, { backgroundColor: aiTagBg }]}
          accessibilityLabel="AI generated suggestion"
          accessibilityRole="image"
        >
          <Text style={[styles.aiTagText, { color: aiTagFg }]}>AI</Text>
        </View>
        <Text style={styles.typeLabel} numberOfLines={1}>
          {suggestion.typeLabel}
        </Text>
        <Pressable
          style={styles.whyBtn}
          onPress={onWhy}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Explain why this was suggested"
        >
          <Text style={styles.whyText}>Why?</Text>
        </Pressable>
      </View>

      {/* Body */}
      {!isDismissed && (
        <View style={styles.bodyBox}>
          <Text
            style={[styles.bodyText, isAccepted && styles.bodyTextAccepted]}
            numberOfLines={3}
          >
            {suggestion.body}
          </Text>
          {isError && (
            <Text style={styles.errorText}>
              Something went wrong. Please try again.
            </Text>
          )}
        </View>
      )}

      {/* Action / resolution row */}
      {!isDismissed && (
        <View style={styles.actionRow}>
          {isAccepted ? (
            <>
              <Text style={styles.acceptedLabel}>✓ Accepted</Text>
              <Pressable
                style={styles.undoBtn}
                onPress={onUndo}
                accessibilityRole="button"
                accessibilityLabel="Undo acceptance"
              >
                <Text style={styles.undoText}>Undo</Text>
              </Pressable>
            </>
          ) : (
            <>
              {suggestion.primaryActionLabel ? (
                <Pressable
                  style={({ pressed }) => [styles.actionBtnBase, styles.primaryBtn, pressed && styles.btnPressed]}
                  onPress={onPrimaryAction}
                  accessibilityRole="button"
                  accessibilityLabel={suggestion.primaryActionLabel}
                >
                  <Text style={styles.primaryBtnText}>{suggestion.primaryActionLabel}</Text>
                </Pressable>
              ) : null}
              {suggestion.secondaryActionLabel ? (
                <Pressable
                  style={({ pressed }) => [styles.actionBtnBase, styles.secondaryBtn, pressed && styles.btnPressed]}
                  onPress={onSecondaryAction}
                  accessibilityRole="button"
                  accessibilityLabel={suggestion.secondaryActionLabel}
                >
                  <Text style={styles.secondaryBtnText}>{suggestion.secondaryActionLabel}</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.dismissBtn, pressed && styles.btnPressed]}
                onPress={onDismiss}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Dismiss suggestion"
              >
                <Text style={styles.dismissIcon}>✕</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {/* Dismissed collapsed state */}
      {isDismissed && (
        <View style={styles.dismissedRow}>
          <Text style={styles.dismissedLabel}>Dismissed</Text>
          <Pressable
            onPress={onUndo}
            accessibilityRole="button"
            accessibilityLabel="Undo dismissal"
          >
            <Text style={styles.undoText}>Undo</Text>
          </Pressable>
        </View>
      )}

      {/* Feedback row — shown after resolution */}
      {isResolved && (
        <View style={styles.feedbackRow}>
          <Pressable
            style={styles.feedbackBtn}
            onPress={onThumbsUp}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Mark as helpful"
          >
            <Text style={styles.feedbackIcon}>👍</Text>
          </Pressable>
          <Pressable
            style={styles.feedbackBtn}
            onPress={onThumbsDown}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Mark as not helpful"
          >
            <Text style={styles.feedbackIcon}>👎</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  containerDismissed: {
    // collapsed visually — only top-bar + dismissed row visible
  },
  containerError: {
    borderColor: "rgba(244,67,54,0.30)",
  },

  // Top bar
  topBar: {
    height: 32,
    paddingHorizontal: spacing.s3,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.elementGapSmall,
  },
  aiTag: {
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  aiTagText: {
    ...textStyles.labelSmall,
    fontWeight: "600",
  },
  typeLabel: {
    ...textStyles.labelSmall,
    fontWeight: "500",
    color: colors.accentForeground,
    flex: 1,
  },
  whyBtn: {
    marginLeft: "auto" as unknown as number,
    minWidth: spacing.touchTarget,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  whyText: {
    ...textStyles.labelSmall,
    fontWeight: "500",
    color: colors.primary,
  },

  // Body
  bodyBox: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s3,
  },
  bodyText: {
    ...textStyles.body,
    color: "#1A1A1A",
  },
  bodyTextAccepted: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  errorText: {
    ...textStyles.bodySmall,
    color: colors.error,
    marginTop: spacing.s2,
  },

  // Action row
  actionRow: {
    paddingHorizontal: spacing.s3,
    paddingBottom: spacing.s3,
    gap: spacing.elementGapSmall,
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtnBase: {
    flex: 1,
    height: 36,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  secondaryBtn: {
    backgroundColor: colors.disabledBg,
  },
  btnPressed: {
    opacity: 0.8,
  },
  primaryBtnText: {
    ...textStyles.labelSmall,
    fontWeight: "500",
    color: colors.white,
  },
  secondaryBtnText: {
    ...textStyles.labelSmall,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  dismissBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  dismissIcon: {
    fontSize: 14,
    color: colors.textMuted,
  },
  acceptedLabel: {
    ...textStyles.labelSmall,
    color: "#2E7D32",
    flex: 1,
  },
  undoBtn: {
    marginLeft: "auto" as unknown as number,
  },
  undoText: {
    ...textStyles.labelSmall,
    color: colors.primary,
  },

  // Dismissed
  dismissedRow: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dismissedLabel: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },

  // Feedback row
  feedbackRow: {
    paddingHorizontal: spacing.s3,
    paddingBottom: spacing.s3,
    paddingTop: spacing.s1,
    flexDirection: "row",
    gap: spacing.s4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  feedbackBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackIcon: {
    fontSize: 18,
  },
});
