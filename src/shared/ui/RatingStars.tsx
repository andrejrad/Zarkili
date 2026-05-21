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

  if (isInteractive) {
    return (
      <View
        style={styles.row}
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 5, now: v }}
        testID={testID}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable
            key={i}
            onPress={() => onChange?.(i)}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${i} stars`}
            hitSlop={8}
            testID={`${testID ?? "rating"}-star-${i}`}
          >
            <Text
              style={[
                styles.star,
                {
                  fontSize: size,
                  color: v >= i ? colors.coralBlossom : colors.disabled,
                  marginRight: i < 5 ? spacing.s1 : 0,
                },
              ]}
            >
              ★
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }

  // Read-only: smooth partial fill via overlay clip so e.g. 4.9 shows a
  // nearly-full 5th star rather than an empty/hollow character.
  const fillPct = `${((v / 5) * 100).toFixed(2)}%` as `${number}%`;
  const starStyle = (i: number) =>
    [styles.star, { fontSize: size, marginRight: i < 5 ? spacing.s1 : 0 }] as const;

  return (
    <View
      style={styles.starsContainer}
      accessibilityRole="image"
      accessibilityLabel={label}
      testID={testID}
    >
      {/* Base layer: 5 gray stars */}
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Text key={i} style={[...starStyle(i), { color: colors.disabled }]}>
            ★
          </Text>
        ))}
      </View>
      {/* Overlay: colored stars clipped to fill percentage */}
      <View style={[styles.fillOverlay, { width: fillPct }]}>
        <View style={styles.row}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Text key={i} style={[...starStyle(i), { color: colors.coralBlossom }]}>
              ★
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  starsContainer: {
    position: "relative",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  fillOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  star: {
    includeFontPadding: false,
  },
});
