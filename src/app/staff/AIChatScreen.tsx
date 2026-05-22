/**
 * AIChatScreen.tsx — W27 Batch G screen G.6.
 *
 * Full-page AI chat panel for staff. Combines:
 *  G.6 — AI Chat panel base (message thread + composer)
 *  G.7 — AI Suggestion patterns (inline suggestion cards in the feed)
 *  G.8 — AI Budget banners (warning + exhausted states via budgetState prop)
 *
 * Message thread is a flat list (oldest to newest, top to bottom).
 * "Generating" state shows a typing indicator row at the bottom of the thread.
 * AIChatComposer is pinned at the bottom.
 * Budget banner is displayed between header and thread when state is warning/exhausted.
 */

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRef } from "react";

import {
  AIChatComposer,
  AISuggestionCard,
  Banner,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import type { AIChatComposerState } from "../../shared/ui/AIChatComposer";

import type {
  AIBudgetState,
  AIChatMessage,
  AISuggestion,
} from "./staffHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AIChatScreenProps = {
  messages: AIChatMessage[];
  composerValue: string;
  composerState?: AIChatComposerState;
  budgetState?: AIBudgetState;
  estimatedTokens?: number;
  estimatedCost?: string;
  /** Inline suggestion shown when AI responds with a structured suggestion. */
  inlineSuggestion?: AISuggestion;
  isLoading?: boolean;
  isError?: boolean;
  onPressRetry?: () => void;
  onChangeComposer: (text: string) => void;
  onSend?: () => void;
  onStop?: () => void;
  onSuggestionPrimary?: () => void;
  onSuggestionSecondary?: () => void;
  onSuggestionDismiss?: () => void;
  onSuggestionWhy?: () => void;
  testID?: string;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AIChatScreen({
  messages,
  composerValue,
  composerState = "default",
  budgetState = "ok",
  estimatedTokens,
  estimatedCost,
  inlineSuggestion,
  isLoading = false,
  isError = false,
  onPressRetry,
  onChangeComposer,
  onSend,
  onStop,
  onSuggestionPrimary,
  onSuggestionSecondary,
  onSuggestionDismiss,
  onSuggestionWhy,
  testID,
}: AIChatScreenProps) {
  const scrollRef = useRef<ScrollView>(null);
  const isGenerating = composerState === "generating";

  if (isError) {
    return (
      <View style={[styles.root, styles.centered]} testID={testID}>
        <Text style={styles.errorTitle}>Couldn't connect to AI assistant</Text>
        <Text style={styles.errorBody}>Check your connection and try again.</Text>
        {onPressRetry && (
          <Pressable style={styles.retryBtn} onPress={onPressRetry} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      testID={testID}
    >
      {/* Budget banners */}
      {budgetState === "warning" && (
        <Banner
          variant="warning"
          title="AI budget low"
          message="You're running low on your daily AI budget. Basic queries only may be available soon."
        />
      )}
      {budgetState === "exhausted" && (
        <Banner
          variant="warning"
          title="AI budget exhausted"
          message="Daily AI budget reached. Basic (non-AI) mode only until tomorrow."
        />
      )}

      {/* Message thread */}
      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.shimmerBubble,
                i % 2 === 0 ? styles.shimmerBubbleUser : styles.shimmerBubbleAI,
              ]}
            />
          ))
        ) : messages.length === 0 ? (
          <View style={styles.emptyThread}>
            <Text style={styles.emptyThreadIcon}>🤖</Text>
            <Text style={styles.emptyThreadTitle}>Ask your AI assistant</Text>
            <Text style={styles.emptyThreadBody}>
              Ask for scheduling help, client insights, or content suggestions.
            </Text>
          </View>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        {/* Typing indicator */}
        {isGenerating && <TypingIndicator />}

        {/* Inline suggestion card */}
        {inlineSuggestion && !isGenerating && (
          <View style={styles.suggestionWrapper}>
            <AISuggestionCard
              suggestion={inlineSuggestion}
              onPrimaryAction={onSuggestionPrimary}
              onSecondaryAction={onSuggestionSecondary}
              onDismiss={onSuggestionDismiss}
              onWhy={onSuggestionWhy}
            />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Composer */}
      <AIChatComposer
        value={composerValue}
        onChangeText={onChangeComposer}
        composerState={composerState}
        budgetState={budgetState}
        estimatedTokens={estimatedTokens}
        estimatedCost={estimatedCost}
        onSend={onSend}
        onStop={onStop}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: AIChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View
      style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? "You" : "AI"}: ${message.body}`}
    >
      {!isUser && (
        <View style={styles.aiBubgeAvatar} accessibilityElementsHidden>
          <Text style={styles.aiBubbleAvatarText}>AI</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAI,
        ]}
      >
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.body}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View
      style={styles.bubbleRow}
      accessibilityRole="text"
      accessibilityLabel="AI is generating a response"
    >
      <View style={styles.aiBubgeAvatar} accessibilityElementsHidden>
        <Text style={styles.aiBubbleAvatarText}>AI</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
        <Text style={styles.typingDots}>• • •</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
  },

  // Thread
  thread: {
    flex: 1,
  },
  threadContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s4,
  },

  // Bubbles
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing.s2,
    gap: spacing.s2,
  },
  bubbleRowUser: {
    flexDirection: "row-reverse",
  },
  bubbleRowAI: {
    flexDirection: "row",
  },
  aiBubgeAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginBottom: 2,
  },
  aiBubbleAvatarText: {
    ...textStyles.labelSmall,
    fontWeight: "600",
    color: colors.accentForeground,
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleAI: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  bubbleText: {
    ...textStyles.body,
    color: "#1A1A1A",
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: colors.white,
  },
  typingBubble: {
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s4,
  },
  typingDots: {
    fontSize: 16,
    color: colors.textMuted,
    letterSpacing: 4,
  },

  // Inline suggestion
  suggestionWrapper: {
    marginTop: spacing.s3,
    marginBottom: spacing.s2,
  },

  // Empty thread
  emptyThread: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.s12,
    paddingHorizontal: spacing.pageHorizontal,
  },
  emptyThreadIcon: {
    fontSize: 40,
    marginBottom: spacing.s3,
  },
  emptyThreadTitle: {
    ...textStyles.heading3,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: spacing.elementGapSmall,
  },
  emptyThreadBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },

  // Error
  errorTitle: {
    ...textStyles.heading3,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: spacing.elementGapSmall,
  },
  errorBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sectionGap,
  },
  retryBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  retryBtnText: {
    ...textStyles.label,
    fontWeight: "600",
    color: colors.white,
  },

  // Shimmer
  shimmerBubble: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: "#EDE8D8",
    marginBottom: spacing.s2,
  },
  shimmerBubbleUser: {
    alignSelf: "flex-end",
    width: "60%",
  },
  shimmerBubbleAI: {
    alignSelf: "flex-start",
    width: "70%",
  },

  bottomSpacer: {
    height: spacing.s3,
  },
});
