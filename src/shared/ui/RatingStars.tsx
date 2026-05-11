/**
 * RatingStars.tsx — B.C2 rating-star-group primitive.
 *
 * - Sizes: 16 (compact), 20 (list), 32 (selector input).
 * - Half-star supported via 0.5 increments on `value`.
 * - Read-only by default; pass `onChange` to enable selector mode.
 *   Selector mode exposes accessibilityRole="adjustable".
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "./tokens";

export type RatingStarsSize = 16 | 20 | 32;

export type RatingStarsProps = {
  /** 0–5, supports half-star (e.g. 4.5) */
  value: number;
  size?: RatingStarsSize;
  onChange?: (value: number) => void;
  /** Override the announced label; defaults to "X of 5 stars". */
  accessibilityLabel?: string;
  testID?: string;
};

function clamp(v: number, min = 0, max = 5): number {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

export function RatingStars({
  value,
  size = 20,
  onChange,
  accessibilityLabel,
  testID,
}: RatingStarsProps) {
  const v = clamp(value);
  const isInteractive = typeof onChange === "function";
  const label = accessibilityLabel ?? `${v} of 5 stars`;

  return (
    <View
      style={styles.row}
      accessibilityRole={isInteractive ? "adjustable" : "image"}
      accessibilityLabel={label}
      accessibilityValue={isInteractive ? { min: 0, max: 5, now: v } : undefined}
      testID={testID}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = v >= i;
        const half = !filled && v >= i - 0.5;
        const star = filled ? "★" : half ? "☆" : "☆";
        const color = filled || half ? colors.coralBlossom : colors.disabled;
        const child = (
          <Text
            key={i}
            style={[
              styles.star,
              {
                fontSize: size,
                color,
                marginRight: i < 5 ? spacing.s1 : 0,
              },
            ]}
          >
            {star}
          </Text>
        );
        if (!isInteractive) return child;
        return (
          <Pressable
            key={i}
            onPress={() => onChange?.(i)}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${i} stars`}
            hitSlop={8}
            testID={`${testID ?? "rating"}-star-${i}`}
          >
            {child}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  star: {
    includeFontPadding: false,
  },
});
