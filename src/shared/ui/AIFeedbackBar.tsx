/**
 * AIFeedbackBar.tsx — W31 Batch K primitive.
 *
 * Inline feedback row rendered below an AI-generated response.
 * Two states per vote:
 *   - neutral  (neither voted)
 *   - positive (thumbs-up voted)
 *   - negative (thumbs-down voted)
 *
 * Optionally shows an expandable "Tell us more" free-text input after a vote.
 */

import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type AIFeedbackVote = "positive" | "negative" | null;

export type AIFeedbackBarProps = {
  vote?: AIFeedbackVote;
  /** When true the free-text follow-up is shown after a vote. */
  allowFreeText?: boolean;
  onVote: (vote: AIFeedbackVote) => void;
  onSubmitFreeText?: (text: string) => void;
  testID?: string;
};

export function AIFeedbackBar({
  vote = null,
  allowFreeText = false,
  onVote,
  onSubmitFreeText,
  testID,
}: AIFeedbackBarProps) {
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const showFreeText = allowFreeText && vote !== null && !submitted;

  function handleVote(next: "positive" | "negative") {
    // Toggling the same vote restores neutral
    onVote(vote === next ? null : next);
    setFreeText("");
    setSubmitted(false);
  }

  function handleSubmit() {
    if (!freeText.trim()) return;
    onSubmitFreeText?.(freeText.trim());
    setSubmitted(true);
  }

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.row}>
        <Text style={styles.label}>Was this helpful?</Text>
        <Pressable
          onPress={() => handleVote("positive")}
          accessibilityRole="button"
          accessibilityLabel="Thumbs up"
          accessibilityState={{ selected: vote === "positive" }}
          style={[styles.chip, vote === "positive" && styles.chipPositive]}
          testID={testID ? `${testID}-positive` : undefined}
        >
          <Text style={[styles.chipIcon, vote === "positive" && styles.chipIconActive]}>
            👍
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleVote("negative")}
          accessibilityRole="button"
          accessibilityLabel="Thumbs down"
          accessibilityState={{ selected: vote === "negative" }}
          style={[styles.chip, vote === "negative" && styles.chipNegative]}
          testID={testID ? `${testID}-negative` : undefined}
        >
          <Text style={[styles.chipIcon, vote === "negative" && styles.chipIconActive]}>
            👎
          </Text>
        </Pressable>
      </View>

      {submitted ? (
        <Text
          style={styles.thankYou}
          testID={testID ? `${testID}-thanks` : undefined}
        >
          Thanks for the feedback!
        </Text>
      ) : showFreeText ? (
        <View
          style={styles.freeTextRow}
          testID={testID ? `${testID}-freetext-area` : undefined}
        >
          <TextInput
            style={styles.freeTextInput}
            value={freeText}
            onChangeText={setFreeText}
            placeholder="Tell us more (optional)…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            testID={testID ? `${testID}-freetext` : undefined}
          />
          <Pressable
            onPress={handleSubmit}
            disabled={!freeText.trim()}
            accessibilityRole="button"
            style={[styles.submitBtn, !freeText.trim() && styles.submitBtnDisabled]}
            testID={testID ? `${testID}-submit` : undefined}
          >
            <Text style={styles.submitBtnText}>Send</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.s2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  chip: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  chipPositive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipNegative: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipIconActive: {
    // emoji colour shift handled by background
  },
  thankYou: {
    fontSize: 13,
    color: colors.success,
    fontStyle: "italic",
  },
  freeTextRow: {
    gap: spacing.s2,
  },
  freeTextInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    fontSize: 14,
    color: colors.foreground,
    minHeight: 64,
    textAlignVertical: "top",
  },
  submitBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.surface,
  },
});
