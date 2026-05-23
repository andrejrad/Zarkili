/**
 * AIEdgeScreens.tsx — W31 Batch K (K.1)
 *
 * Exports:
 *   AIConsentScreen      — first-run explainer + opt-in/opt-out
 *   AIFeedbackScreen     — full feedback page with AIFeedbackBar + text area
 *   AIHistoryScreen      — scrollable list of past AI conversations
 *   AIDegradedScreen     — full-screen "AI unavailable" empty state
 *   AIOptOutScreen       — confirmation to opt out from all AI features
 */

import { useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AIFeedbackBar, type AIFeedbackVote } from "../../shared/ui/AIFeedbackBar";
import { Banner } from "../../shared/ui/Banner";
import { colors, radius, spacing } from "../../shared/ui/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIConsentScreenProps = {
  onOptIn: () => void;
  onOptOut: () => void;
  testID?: string;
};

export type AIFeedbackScreenState = "default" | "submitting" | "submitted";

export type AIFeedbackScreenProps = {
  /** The suggestion that feedback is being given on. */
  suggestionPreview?: string;
  onSubmit: (vote: AIFeedbackVote, freeText?: string) => void | Promise<void>;
  onDismiss: () => void;
  testID?: string;
};

export type AIConversationSummary = {
  id: string;
  createdAt: string;
  summary: string;
};

export type AIHistoryScreenProps = {
  conversations: AIConversationSummary[];
  onSelectConversation: (id: string) => void;
  testID?: string;
};

export type AIDegradedScreenProps = {
  onRetry: () => void;
  onDismiss: () => void;
  testID?: string;
};

export type AIOptOutScreenProps = {
  onConfirmOptOut: () => void;
  onCancel: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// AIConsentScreen
// ---------------------------------------------------------------------------

const CONSENT_FEATURES = [
  {
    icon: "✨",
    title: "Personalised suggestions",
    body: "AI analyses your booking history to recommend services you'll love.",
  },
  {
    icon: "💬",
    title: "Smart chat assistant",
    body: "Get instant answers about bookings, services, and salon info.",
  },
  {
    icon: "🔒",
    title: "Private by design",
    body: "Your data is never sold. AI insights stay within Zarkili.",
  },
];

export function AIConsentScreen({ onOptIn, onOptOut, testID }: AIConsentScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heroIcon}>🤖</Text>
        <Text
          style={styles.pageTitle}
          testID={testID ? `${testID}-title` : undefined}
        >
          Introducing Zarkili AI
        </Text>
        <Text style={styles.pageSubtitle}>
          Smarter booking experiences, powered by AI.
        </Text>

        <View style={styles.featureList}>
          {CONSENT_FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaStack}>
          <Pressable
            onPress={onOptIn}
            accessibilityRole="button"
            style={styles.primaryBtn}
            testID={testID ? `${testID}-opt-in` : undefined}
          >
            <Text style={styles.primaryBtnText}>Enable Zarkili AI</Text>
          </Pressable>
          <Pressable
            onPress={onOptOut}
            accessibilityRole="button"
            style={styles.ghostBtn}
            testID={testID ? `${testID}-opt-out` : undefined}
          >
            <Text style={styles.ghostBtnText}>No thanks, skip</Text>
          </Pressable>
        </View>

        <Text style={styles.legalNote}>
          You can change this at any time in Settings → AI Preferences.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// AIFeedbackScreen
// ---------------------------------------------------------------------------

export function AIFeedbackScreen({
  suggestionPreview,
  onSubmit,
  onDismiss,
  testID,
}: AIFeedbackScreenProps) {
  const [vote, setVote] = useState<AIFeedbackVote>(null);
  const [freeText, setFreeText] = useState("");
  const [state, setState] = useState<AIFeedbackScreenState>("default");

  async function handleSubmit() {
    if (!vote) return;
    setState("submitting");
    const result = onSubmit(vote, freeText.trim() || undefined);
    if (result instanceof Promise) {
      await result;
    }
    setState("submitted");
  }

  if (state === "submitted") {
    return (
      <SafeAreaView style={styles.safeArea} testID={testID}>
        <View style={styles.submittedContainer}>
          <Text style={styles.submittedIcon}>🙏</Text>
          <Text
            style={styles.submittedHeadline}
            testID={testID ? `${testID}-submitted` : undefined}
          >
            Thank you for your feedback!
          </Text>
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            style={styles.primaryBtn}
            testID={testID ? `${testID}-done` : undefined}
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Share your feedback</Text>
        <Text style={styles.pageSubtitle}>
          Help us improve Zarkili AI suggestions.
        </Text>

        {suggestionPreview && (
          <View
            style={styles.suggestionPreviewBox}
            testID={testID ? `${testID}-preview` : undefined}
          >
            <Text style={styles.suggestionPreviewText} numberOfLines={3}>
              {`"${suggestionPreview}"`}
            </Text>
          </View>
        )}

        <AIFeedbackBar
          vote={vote}
          allowFreeText={false}
          onVote={setVote}
          testID={testID ? `${testID}-bar` : undefined}
        />

        <View style={styles.freeTextSection}>
          <Text style={styles.sectionLabel}>Tell us more (optional)</Text>
          <TextInput
            style={styles.freeTextInput}
            value={freeText}
            onChangeText={setFreeText}
            placeholder="What could be improved?"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            textAlignVertical="top"
            testID={testID ? `${testID}-freetext` : undefined}
          />
        </View>

        <View style={styles.ctaStack}>
          <Pressable
            onPress={handleSubmit}
            disabled={!vote || state === "submitting"}
            accessibilityRole="button"
            style={[
              styles.primaryBtn,
              (!vote || state === "submitting") && styles.btnDisabled,
            ]}
            testID={testID ? `${testID}-submit` : undefined}
          >
            <Text style={styles.primaryBtnText}>
              {state === "submitting" ? "Submitting…" : "Submit feedback"}
            </Text>
          </Pressable>
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            style={styles.ghostBtn}
            testID={testID ? `${testID}-cancel` : undefined}
          >
            <Text style={styles.ghostBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// AIHistoryScreen
// ---------------------------------------------------------------------------

export function AIHistoryScreen({
  conversations,
  onSelectConversation,
  testID,
}: AIHistoryScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          conversations.length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
        ListEmptyComponent={
          <View testID={testID ? `${testID}-empty` : undefined}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyHeadline}>No AI conversations yet</Text>
            <Text style={styles.emptyBody}>
              Start chatting with Zarkili AI and your history will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectConversation(item.id)}
            accessibilityRole="button"
            style={styles.historyRow}
            testID={testID ? `${testID}-row-${item.id}` : undefined}
          >
            <Text style={styles.historyDate}>{item.createdAt}</Text>
            <Text style={styles.historySummary} numberOfLines={2}>
              {item.summary}
            </Text>
            <Text style={styles.historyChevron}>›</Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// AIDegradedScreen
// ---------------------------------------------------------------------------

export function AIDegradedScreen({
  onRetry,
  onDismiss,
  testID,
}: AIDegradedScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <View style={styles.degradedContainer}>
        <Text style={styles.degradedIcon}>🤔</Text>
        <Text
          style={styles.degradedHeadline}
          testID={testID ? `${testID}-headline` : undefined}
        >
          AI features temporarily unavailable
        </Text>
        <Text style={styles.degradedBody}>
          {"We're experiencing a hiccup with our AI service. Basic booking and"}
          browsing still work normally.
        </Text>
        <View style={styles.ctaStack}>
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            style={styles.primaryBtn}
            testID={testID ? `${testID}-retry` : undefined}
          >
            <Text style={styles.primaryBtnText}>Try again</Text>
          </Pressable>
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            style={styles.ghostBtn}
            testID={testID ? `${testID}-dismiss` : undefined}
          >
            <Text style={styles.ghostBtnText}>Continue without AI</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// AIOptOutScreen
// ---------------------------------------------------------------------------

const OPT_OUT_CONSEQUENCES = [
  "Personalised service recommendations will be turned off.",
  "Smart booking suggestions won't appear.",
  "AI chat assistant will be disabled.",
  "You won't receive AI-driven promotions.",
];

export function AIOptOutScreen({
  onConfirmOptOut,
  onCancel,
  testID,
}: AIOptOutScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Turn off Zarkili AI?</Text>
        <Text style={styles.pageSubtitle}>
          {"Here's what you'll miss if you opt out:"}
        </Text>

        <View style={styles.consequenceList}>
          {OPT_OUT_CONSEQUENCES.map((c, i) => (
            <View key={i} style={styles.consequenceRow}>
              <Text style={styles.consequenceBullet}>•</Text>
              <Text style={styles.consequenceText}>{c}</Text>
            </View>
          ))}
        </View>

        <Banner
          variant="warning"
          message="You can re-enable AI features at any time in Settings."
        />

        <View style={styles.ctaStack}>
          <Pressable
            onPress={onConfirmOptOut}
            accessibilityRole="button"
            style={styles.destructiveBtn}
            testID={testID ? `${testID}-confirm` : undefined}
          >
            <Text style={styles.destructiveBtnText}>Yes, turn off AI</Text>
          </Pressable>
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            style={styles.primaryBtn}
            testID={testID ? `${testID}-cancel` : undefined}
          >
            <Text style={styles.primaryBtnText}>Keep AI enabled</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: {
    padding: spacing.pageHorizontal,
    paddingTop: spacing.pageVertical,
    gap: spacing.s5,
  },
  heroIcon: { fontSize: 56, textAlign: "center" },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  pageSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  featureList: { gap: spacing.s4 },
  featureRow: {
    flexDirection: "row",
    gap: spacing.s3,
    alignItems: "flex-start",
  },
  featureIcon: { fontSize: 24, marginTop: 2 },
  featureText: { flex: 1, gap: spacing.s1 },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  featureBody: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  freeTextSection: { gap: spacing.s2 },
  freeTextInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    fontSize: 14,
    color: colors.foreground,
    minHeight: 100,
  },
  suggestionPreviewBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.s3,
  },
  suggestionPreviewText: {
    fontSize: 14,
    color: colors.foreground,
    fontStyle: "italic",
    lineHeight: 20,
  },
  ctaStack: { gap: spacing.s3 },
  primaryBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 15, fontWeight: "600", color: colors.surface },
  ghostBtn: {
    height: spacing.touchTarget,
    justifyContent: "center",
    alignItems: "center",
  },
  ghostBtnText: { fontSize: 15, color: colors.textMuted },
  btnDisabled: { opacity: 0.4 },
  destructiveBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  destructiveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface,
  },
  legalNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  // History
  listContent: { paddingVertical: spacing.s2 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s3,
    backgroundColor: colors.surface,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textMuted,
    width: 72,
  },
  historySummary: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 20,
  },
  historyChevron: { fontSize: 18, color: colors.textMuted },
  separator: { height: 1, backgroundColor: colors.border },
  // Empty / Degraded / Submitted states
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  emptyIcon: { fontSize: 48 },
  emptyHeadline: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.foreground,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  degradedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  degradedIcon: { fontSize: 56 },
  degradedHeadline: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  degradedBody: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  submittedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  submittedIcon: { fontSize: 56 },
  submittedHeadline: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  // Opt-out
  consequenceList: { gap: spacing.s3 },
  consequenceRow: { flexDirection: "row", gap: spacing.s2, alignItems: "flex-start" },
  consequenceBullet: { fontSize: 15, color: colors.error, lineHeight: 22 },
  consequenceText: { flex: 1, fontSize: 15, color: colors.foreground, lineHeight: 22 },
});
