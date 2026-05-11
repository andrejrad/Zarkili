/**
 * AIChatComposer.tsx — W27 Batch G primitive.
 *
 * Input composer for the staff AI chat panel.
 * Layout: AI badge | auto-grow TextInput | token counter (composing only) | send/stop button
 *
 * States:
 *  default        — empty input, send disabled
 *  composing      — input has text, token counter visible, send enabled
 *  sending        — awaiting server, input locked
 *  generating     — AI streaming, send replaced by ◼ stop button
 *  budget-exhausted — daily limit reached, warning helper row shown below
 *  error          — last send failed, retry enabled
 */

import { StyleSheet, Text, TextInput, View, Pressable } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";
import type { AIBudgetState } from "../staffTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AIChatComposerState =
  | "default"
  | "composing"
  | "sending"
  | "generating"
  | "budget-exhausted"
  | "error";

export type AIChatComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  composerState?: AIChatComposerState;
  budgetState?: AIBudgetState;
  /** Estimated token count for current input — shown when composerState === "composing". */
  estimatedTokens?: number;
  /** Estimated cost string, e.g. "$0.01" — shown beside token count. */
  estimatedCost?: string;
  onSend?: () => void;
  onStop?: () => void;
  testID?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AIChatComposer({
  value,
  onChangeText,
  composerState = "default",
  budgetState = "ok",
  estimatedTokens,
  estimatedCost,
  onSend,
  onStop,
  testID,
}: AIChatComposerProps) {
  const isGenerating = composerState === "generating";
  const isComposing = composerState === "composing";
  const isSending = composerState === "sending";
  const isBudgetExhausted =
    composerState === "budget-exhausted" || budgetState === "exhausted";
  const isEditable = !isSending && !isGenerating;

  const canSend =
    isComposing && value.trim().length > 0 && !isBudgetExhausted;

  const showInputFocus = isComposing;

  return (
    <View style={styles.container} testID={testID}>
      {/* Main composer row */}
      <View style={styles.mainRow}>
        {/* AI badge */}
        <View style={styles.aiBadge} accessibilityElementsHidden>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>

        {/* TextInput */}
        <TextInput
          style={[styles.input, showInputFocus && styles.inputFocus]}
          value={value}
          onChangeText={onChangeText}
          placeholder="Ask AI…"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
          editable={isEditable}
          accessibilityLabel="Message AI assistant"
          accessibilityState={{ disabled: !isEditable }}
          textAlignVertical="top"
        />

        {/* Token counter — composing only */}
        {isComposing && estimatedTokens !== undefined && (
          <Text
            style={styles.tokenCounter}
            accessibilityLabel={`Estimated ${estimatedTokens} tokens${estimatedCost ? `, cost ${estimatedCost}` : ""}`}
          >
            {`~${estimatedTokens}`}
            {estimatedCost ? ` · ${estimatedCost}` : ""}
          </Text>
        )}

        {/* Stop button — generating state */}
        {isGenerating ? (
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.stopButton, pressed && styles.actionBtnPressed]}
            onPress={onStop}
            accessibilityRole="button"
            accessibilityLabel="Stop generating"
          >
            <Text style={styles.stopIcon}>◼</Text>
          </Pressable>
        ) : (
          /* Send button */
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              canSend ? styles.sendButtonActive : styles.sendButtonInactive,
              pressed && canSend && styles.actionBtnPressed,
            ]}
            onPress={canSend ? onSend : undefined}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSend }}
          >
            <Text style={[styles.sendIcon, canSend ? styles.sendIconActive : styles.sendIconInactive]}>
              ➤
            </Text>
          </Pressable>
        )}
      </View>

      {/* Budget exhausted helper row */}
      {isBudgetExhausted && (
        <View
          style={styles.helperRow}
          accessibilityRole="alert"
          accessibilityLabel="Budget exhausted — basic mode only"
        >
          <Text style={styles.helperIcon}>⚠</Text>
          <Text style={styles.helperText}>Budget exhausted — basic mode only</Text>
        </View>
      )}

      {/* Budget warning helper row */}
      {!isBudgetExhausted && budgetState === "warning" && (
        <View style={styles.helperRow}>
          <Text style={styles.helperIcon}>⚠</Text>
          <Text style={styles.helperText}>Running low on AI budget</Text>
        </View>
      )}

      {/* Error state helper row */}
      {composerState === "error" && (
        <View style={styles.helperRow} accessibilityRole="alert">
          <Text style={[styles.helperIcon, { color: colors.error }]}>✕</Text>
          <Text style={[styles.helperText, { color: colors.error }]}>
            Message failed — tap send to retry
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.elementGapSmall,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.elementGapSmall,
  },

  // AI badge
  aiBadge: {
    height: 24,
    paddingHorizontal: spacing.elementGapSmall,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  aiBadgeText: {
    ...textStyles.labelSmall,
    fontWeight: "600",
    color: colors.accentForeground,
  },

  // Input
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    borderRadius: radius.md,
    backgroundColor: colors.disabledBg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.elementGapSmall,
    ...textStyles.body,
    color: "#1A1A1A",
    fontSize: 14,
    lineHeight: 20,
  },
  inputFocus: {
    borderColor: colors.primary,
  },

  // Token counter
  tokenCounter: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
    flexShrink: 0,
  },

  // Action buttons (send / stop)
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  sendButtonInactive: {
    backgroundColor: colors.disabledBg,
  },
  stopButton: {
    backgroundColor: "rgba(244,67,54,0.10)",
  },
  actionBtnPressed: {
    opacity: 0.8,
  },
  sendIcon: {
    fontSize: 14,
    textAlign: "center",
  },
  sendIconActive: {
    color: colors.white,
  },
  sendIconInactive: {
    color: colors.disabled,
  },
  stopIcon: {
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
  },

  // Helper row (budget-exhausted, warning, error)
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: spacing.s1,
    paddingLeft: spacing.s3,
  },
  helperIcon: {
    fontSize: 12,
    color: colors.warning,
  },
  helperText: {
    ...textStyles.bodySmall,
    color: colors.warning,
  },
});
