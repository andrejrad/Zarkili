/**
 * RateTheAppPrompt.tsx — W32 Batch L
 *
 * Modal that asks the user to rate the app. Three stages:
 *   1. star — pick 1–5 stars
 *   2. feedback — (optional) choose a reason chip and/or free-text
 *   3. thanks — confirmation then auto-dismiss
 *
 * Props:
 *   visible
 *   onRateOnStore(rating) — called when user taps "Rate on App Store"
 *   onDismiss             — called when user taps "Not now" or after thanks
 *   testID
 */

import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type RateTheAppPromptProps = {
  visible: boolean;
  onRateOnStore: (rating: number) => void;
  onDismiss: () => void;
  testID?: string;
};

type Stage = "star" | "feedback" | "thanks";

const STARS = [1, 2, 3, 4, 5];
const REASON_CHIPS = [
  "Easy to use",
  "Fast & reliable",
  "Great design",
  "Helpful features",
  "Other",
];

export function RateTheAppPrompt({
  visible,
  onRateOnStore,
  onDismiss,
  testID,
}: RateTheAppPromptProps) {
  const [stage, setStage] = useState<Stage>("star");
  const [rating, setRating] = useState(0);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  function handleStarPress(star: number) {
    setRating(star);
    if (star >= 4) {
      // Happy path — go straight to thanks + store prompt
      setStage("feedback");
    } else {
      // Unhappy — collect feedback first
      setStage("feedback");
    }
  }

  function handleSubmitFeedback() {
    setStage("thanks");
    onRateOnStore(rating);
  }

  function handleDismiss() {
    setStage("star");
    setRating(0);
    setSelectedReason(null);
    onDismiss();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      testID={testID}
    >
      <View style={styles.overlay}>
        <View style={styles.card} testID={testID ? `${testID}-card` : undefined}>
          {stage === "star" && (
            <>
              <Text style={styles.title} testID={testID ? `${testID}-title` : undefined}>
                Enjoying Zarkili?
              </Text>
              <Text style={styles.subtitle}>Tap to rate your experience</Text>
              <View style={styles.starsRow} testID={testID ? `${testID}-stars` : undefined}>
                {STARS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => handleStarPress(s)}
                    accessibilityRole="button"
                    accessibilityLabel={`${s} star${s > 1 ? "s" : ""}`}
                    testID={testID ? `${testID}-star-${s}` : undefined}
                  >
                    <Text style={[styles.star, rating >= s && styles.starActive]}>
                      ★
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={handleDismiss}
                accessibilityRole="button"
                testID={testID ? `${testID}-not-now` : undefined}
              >
                <Text style={styles.notNow}>Not now</Text>
              </Pressable>
            </>
          )}

          {stage === "feedback" && (
            <>
              <Text style={styles.title} testID={testID ? `${testID}-feedback-title` : undefined}>
                {rating >= 4 ? "What do you love?" : "How can we improve?"}
              </Text>
              <View style={styles.chipRow} testID={testID ? `${testID}-chips` : undefined}>
                {REASON_CHIPS.map((chip) => (
                  <Pressable
                    key={chip}
                    onPress={() => setSelectedReason(chip)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedReason === chip }}
                    style={[styles.chip, selectedReason === chip && styles.chipActive]}
                    testID={testID ? `${testID}-chip-${chip.replace(/\s+/g, "-").toLowerCase()}` : undefined}
                  >
                    <Text
                      style={[styles.chipText, selectedReason === chip && styles.chipTextActive]}
                    >
                      {chip}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={handleSubmitFeedback}
                accessibilityRole="button"
                style={styles.primaryBtn}
                testID={testID ? `${testID}-submit` : undefined}
              >
                <Text style={styles.primaryBtnText}>
                  {rating >= 4 ? "Rate on App Store" : "Send feedback"}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDismiss}
                accessibilityRole="button"
                testID={testID ? `${testID}-skip-feedback` : undefined}
              >
                <Text style={styles.notNow}>Skip</Text>
              </Pressable>
            </>
          )}

          {stage === "thanks" && (
            <View
              style={styles.thanksContainer}
              testID={testID ? `${testID}-thanks` : undefined}
            >
              <Text style={styles.thanksIcon}>🎉</Text>
              <Text style={styles.title}>Thank you!</Text>
              <Text style={styles.subtitle}>Your feedback means a lot to us.</Text>
              <Pressable
                onPress={handleDismiss}
                accessibilityRole="button"
                style={styles.primaryBtn}
                testID={testID ? `${testID}-done` : undefined}
              >
                <Text style={styles.primaryBtnText}>Done</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.pageHorizontal,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s6,
    width: "100%",
    maxWidth: 360,
    gap: spacing.s4,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
  starsRow: { flexDirection: "row", gap: spacing.s3 },
  star: { fontSize: 40, color: colors.border },
  starActive: { color: "#F5A623" },
  notNow: { fontSize: 13, color: colors.textMuted },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s2,
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.foreground },
  chipTextActive: { color: colors.surface, fontWeight: "500" },
  primaryBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  primaryBtnText: { fontSize: 15, fontWeight: "600", color: colors.surface },
  thanksContainer: { alignItems: "center", gap: spacing.s3, width: "100%" },
  thanksIcon: { fontSize: 48 },
});
