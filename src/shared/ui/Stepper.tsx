/**
 * Stepper.tsx — A.C5 primitive.
 *
 * Horizontal pill with N steps. Active step coral-blossom; complete steps
 * mint-fresh check; remaining border-only.
 */

import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type StepperProps = {
  totalSteps: number;
  currentStep: number;
  /** Steps that have been completed (1-indexed). */
  completedSteps?: number[];
  testID?: string;
};

export function Stepper({
  totalSteps,
  currentStep,
  completedSteps = [],
  testID,
}: StepperProps) {
  const completedSet = new Set(completedSteps);
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
      accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }}
      testID={testID}
    >
      {Array.from({ length: totalSteps }, (_, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isComplete = completedSet.has(stepNum);
        return (
          <View
            key={stepNum}
            style={[
              styles.dot,
              isComplete && styles.dotComplete,
              isActive && styles.dotActive,
            ]}
            testID={`${testID ?? "stepper"}-dot-${stepNum}`}
          >
            {isComplete ? <Text style={styles.checkText}>✓</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    width: 16,
    height: 16,
  },
  dotComplete: {
    backgroundColor: colors.mintFresh,
    borderColor: colors.mintFresh,
  },
  checkText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "600",
    color: colors.accentForeground,
  },
});
