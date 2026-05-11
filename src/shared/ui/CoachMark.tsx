/**
 * CoachMark.tsx — W32 Batch L
 *
 * Step-based tooltip overlay for in-app tutorials. Renders a semi-transparent
 * backdrop with a positioned tooltip card (title, body, step indicator, CTA).
 *
 * Props:
 *   visible           — show/hide the overlay
 *   step              — current step index (0-based)
 *   totalSteps        — total number of steps
 *   title             — tooltip heading
 *   body              — tooltip body copy
 *   primaryLabel?     — CTA label (default "Next")
 *   onNext            — called when primary CTA is pressed
 *   onSkip?           — optional skip / dismiss all
 *   testID
 */

import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type CoachMarkProps = {
  visible: boolean;
  step: number;
  totalSteps: number;
  title: string;
  body: string;
  primaryLabel?: string;
  onNext: () => void;
  onSkip?: () => void;
  testID?: string;
};

export function CoachMark({
  visible,
  step,
  totalSteps,
  title,
  body,
  primaryLabel = "Next",
  onNext,
  onSkip,
  testID,
}: CoachMarkProps) {
  const isLast = step >= totalSteps - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      testID={testID}
    >
      <View style={styles.backdrop} testID={testID ? `${testID}-backdrop` : undefined}>
        {/* Tooltip card anchored at the bottom of the overlay */}
        <View style={styles.card} testID={testID ? `${testID}-card` : undefined}>
          {/* Step indicators */}
          <View
            style={styles.dotsRow}
            testID={testID ? `${testID}-dots` : undefined}
          >
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive]}
                testID={testID ? `${testID}-dot-${i}` : undefined}
              />
            ))}
          </View>

          <Text style={styles.title} testID={testID ? `${testID}-title` : undefined}>
            {title}
          </Text>
          <Text style={styles.body} testID={testID ? `${testID}-body` : undefined}>
            {body}
          </Text>

          <View style={styles.actions}>
            {onSkip && (
              <Pressable
                onPress={onSkip}
                accessibilityRole="button"
                style={styles.skipBtn}
                testID={testID ? `${testID}-skip` : undefined}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onNext}
              accessibilityRole="button"
              style={styles.nextBtn}
              testID={testID ? `${testID}-next` : undefined}
            >
              <Text style={styles.nextText}>
                {isLast ? "Got it" : primaryLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.pageHorizontal,
    paddingBottom: spacing.s8,
    gap: spacing.s3,
  },
  dotsRow: {
    flexDirection: "row",
    gap: spacing.s2,
    justifyContent: "center",
    marginBottom: spacing.s1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  title: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  body: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.s3,
    marginTop: spacing.s1,
  },
  skipBtn: { paddingHorizontal: spacing.s3, paddingVertical: spacing.s2 },
  skipText: { fontSize: 14, color: colors.textMuted },
  nextBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  nextText: { fontSize: 15, fontWeight: "600", color: colors.surface },
});
