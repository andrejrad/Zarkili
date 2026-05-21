/**
 * BookingProgressIndicator.tsx — Spec §5.1
 *
 * Shows dots for each step the user will actually see:
 *   ✓  → pre-filled step (already answered by entry-point context)
 *   [n] → currently active step
 *   ○   → future step
 *
 * Below the dots, a SelectionSummaryStrip renders chips for every confirmed
 * selection. Tapping a chip navigates the user back to that step without
 * resetting later steps.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../../shared/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BookingStepDef = {
  /** Internal key. */
  key: string;
  /** Short display label shown in the dot. */
  label: string;
  /** 1-based step number within the user's visible steps. */
  stepNumber: number;
};

export type BookingProgressIndicatorProps = {
  steps: readonly BookingStepDef[];
  /** Key of the currently active step. */
  activeStepKey: string;
  /** Keys of pre-filled steps (rendered as ✓). */
  prefilledStepKeys?: readonly string[];
  /** Confirmed selection chips. Each is rendered as a tappable pill. */
  selectionChips?: readonly { key: string; label: string; onPress: () => void }[];
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BookingProgressIndicator({
  steps,
  activeStepKey,
  prefilledStepKeys = [],
  selectionChips = [],
  testID,
}: BookingProgressIndicatorProps) {
  const totalSteps = steps.length;
  const activeStep = steps.find((s) => s.key === activeStepKey);
  const currentNumber = activeStep?.stepNumber ?? 1;

  return (
    <View style={styles.root} testID={testID}>
      {/* Step dots */}
      <View
        style={styles.dotsRow}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: totalSteps, now: currentNumber }}
        accessibilityLabel={`Step ${currentNumber} of ${totalSteps}: ${activeStep?.label ?? ""}`}
      >
        {steps.map((step, idx) => {
          const isPrefilled = prefilledStepKeys.includes(step.key);
          const isActive = step.key === activeStepKey;
          const isFuture = !isPrefilled && !isActive;

          return (
            <View key={step.key} style={styles.dotItem}>
              {/* Connector line between dots */}
              {idx > 0 ? (
                <View
                  style={[
                    styles.connector,
                    isPrefilled || isActive ? styles.connectorDone : styles.connectorFuture,
                  ]}
                />
              ) : null}

              <View
                style={[
                  styles.dot,
                  isPrefilled && styles.dotDone,
                  isActive && styles.dotActive,
                  isFuture && styles.dotFuture,
                ]}
              >
                {isPrefilled ? (
                  <Text style={styles.dotCheckmark}>✓</Text>
                ) : isActive ? (
                  <Text style={styles.dotActiveText}>{step.stepNumber}</Text>
                ) : (
                  <View style={styles.dotFutureInner} />
                )}
              </View>

              <Text
                style={[
                  styles.dotLabel,
                  isActive && styles.dotLabelActive,
                  isFuture && styles.dotLabelFuture,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Selection summary chips */}
      {selectionChips.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          style={styles.chipsRow}
          accessibilityRole="toolbar"
          accessibilityLabel="Booking selections"
        >
          {selectionChips.map((chip) => (
            <Pressable
              key={chip.key}
              style={styles.chip}
              onPress={chip.onPress}
              accessibilityRole="button"
              accessibilityLabel={`Change ${chip.label}`}
            >
              <Text style={styles.chipText} numberOfLines={1}>
                {chip.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.s4,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s2,
    gap: spacing.s2,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 0,
  },
  dotItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  connector: {
    position: "absolute",
    top: 12,
    left: "-50%",
    right: "50%",
    height: 2,
  },
  connectorDone: { backgroundColor: colors.primary },
  connectorFuture: { backgroundColor: colors.border },

  dot: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: colors.primary },
  dotActive: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dotFuture: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotCheckmark: { fontSize: 12, fontWeight: "700", color: "#fff" },
  dotActiveText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  dotFutureInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },

  dotLabel: { fontSize: 10, color: colors.textMuted, textAlign: "center" },
  dotLabelActive: { color: colors.primary, fontWeight: "600" },
  dotLabelFuture: { color: colors.textMuted },

  chipsRow: { flexGrow: 0 },
  chipsContent: { gap: spacing.s2, paddingVertical: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary10,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s3,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.primary },
});
