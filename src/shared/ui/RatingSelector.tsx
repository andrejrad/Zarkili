/**
 * RatingSelector.tsx — Batch E rating-selector primitive.
 *
 * Row of 5 stars. Tap to select; tap same star again to clear (clear-on-retap).
 * accessibilityRole="adjustable" with increment/decrement actions.
 * Visual sizes: 32 (default) | 24 (compact). Hit target always 44×44.
 *
 * States: default | disabled | error | readonly
 * Label mapping: 0→"" 1→"Not for me" 2→"Meh" 3→"OK" 4→"Great" 5→"Loved it!"
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, textStyles } from "./tokens";

export type RatingSelectorSize = 32 | 24;
export type RatingSelectorState = "default" | "disabled" | "error" | "readonly";

const RATING_LABELS: Record<number, string> = {
  0: "",
  1: "Not for me",
  2: "Meh",
  3: "OK",
  4: "Great",
  5: "Loved it!",
};

export type RatingSelectorProps = {
  value: number;
  onChange?: (next: number) => void;
  size?: RatingSelectorSize;
  state?: RatingSelectorState;
  /** Show label below stars. */
  showLabel?: boolean;
  errorText?: string;
  testID?: string;
};

export function RatingSelector({
  value,
  onChange,
  size = 32,
  state = "default",
  showLabel = false,
  errorText,
  testID,
}: RatingSelectorProps) {
  const isReadonly = state === "readonly";
  const isDisabled = state === "disabled";
  const isInteractive = !isReadonly && !isDisabled;
  // hitSlop to ensure 44pt min touch target
  const hitSlop = size === 32 ? 6 : 10;

  function handlePress(star: number) {
    if (!isInteractive || !onChange) return;
    // Clear-on-retap: pressing selected star resets to 0
    onChange(star === value ? 0 : star);
  }

  function handleAccessibilityAction(actionName: string) {
    if (!isInteractive || !onChange) return;
    if (actionName === "increment") onChange(Math.min(5, value + 1));
    if (actionName === "decrement") onChange(Math.max(0, value - 1));
  }

  const starColor = isDisabled ? colors.disabled : colors.primary;
  const emptyColor = isDisabled ? colors.disabledBg : colors.border;
  const label = RATING_LABELS[value] ?? "";

  return (
    <View testID={testID} accessibilityState={{ disabled: isDisabled }}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Rating"
        accessibilityValue={{
          min: 0,
          max: 5,
          now: value,
          text: value > 0 ? `${value} of 5 stars${label ? `, ${label}` : ""}` : "No rating selected",
        }}
        accessibilityState={{ disabled: isDisabled }}
        accessibilityActions={[
          { name: "increment", label: "increase rating" },
          { name: "decrement", label: "decrease rating" },
        ]}
        onAccessibilityAction={(event) =>
          handleAccessibilityAction(event.nativeEvent.actionName)
        }
        style={styles.starsRow}
        // Stars inside handle their own press — outer view is the a11y unit
        importantForAccessibility="yes"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= value;
          return (
            <Pressable
              key={star}
              onPress={() => handlePress(star)}
              disabled={!isInteractive}
              hitSlop={hitSlop}
              testID={testID ? `${testID}-star-${star}` : undefined}
              style={[
                styles.starWrap,
                { width: size, height: size },
              ]}
            >
              <Text
                style={[
                  styles.star,
                  { fontSize: size, lineHeight: size + 4 },
                  { color: filled ? starColor : emptyColor },
                ]}
              >
                ★
              </Text>
            </Pressable>
          );
        })}
      </View>

      {state === "error" && errorText ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {errorText}
        </Text>
      ) : null}

      {showLabel && label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  starsRow: {
    flexDirection: "row",
    gap: spacing.s1,
  },
  starWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  star: {
    textAlign: "center",
  },
  label: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.s1,
    textAlign: "center",
  },
  errorText: {
    ...textStyles.bodySmall,
    color: colors.error,
    marginTop: spacing.s1,
  },
});
