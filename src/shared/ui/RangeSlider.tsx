/**
 * RangeSlider.tsx — B.C2 range-slider primitive.
 *
 * Single-thumb (`value`) or two-thumb range (`min`/`max`).
 * Pure-React-Native: no gesture lib dependency. Stepper buttons + accessible
 * adjustable role drive the value (web/RN simulator-friendly + a11y compliant).
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

type Common = {
  minValue: number;
  maxValue: number;
  step?: number;
  /** Render value labels (e.g., "$30") — defaults to numeric. */
  formatValue?: (n: number) => string;
  testID?: string;
};

export type SingleRangeSliderProps = Common & {
  value: number;
  onChange: (value: number) => void;
};

export type DualRangeSliderProps = Common & {
  range: [number, number];
  onChange: (range: [number, number]) => void;
};

export type RangeSliderProps = SingleRangeSliderProps | DualRangeSliderProps;

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

function isDual(p: RangeSliderProps): p is DualRangeSliderProps {
  return Array.isArray((p as DualRangeSliderProps).range);
}

export function RangeSlider(props: RangeSliderProps) {
  const { minValue, maxValue, step = 1, formatValue, testID } = props;
  const fmt = formatValue ?? ((n: number) => `${n}`);

  if (isDual(props)) {
    const [lo, hi] = props.range;
    return (
      <View testID={testID} style={styles.container}>
        <View style={styles.labels}>
          <Text style={styles.label}>{fmt(lo)}</Text>
          <Text style={styles.label}>{fmt(hi)}</Text>
        </View>
        <View style={styles.controlsRow}>
          <ThumbControls
            label="Minimum"
            value={lo}
            min={minValue}
            max={hi - step}
            step={step}
            onChange={(next) => props.onChange([clamp(next, minValue, hi - step), hi])}
            testIDPrefix={`${testID ?? "range"}-lo`}
          />
          <ThumbControls
            label="Maximum"
            value={hi}
            min={lo + step}
            max={maxValue}
            step={step}
            onChange={(next) => props.onChange([lo, clamp(next, lo + step, maxValue)])}
            testIDPrefix={`${testID ?? "range"}-hi`}
          />
        </View>
      </View>
    );
  }

  const { value, onChange } = props;
  return (
    <View testID={testID} style={styles.container}>
      <Text style={styles.label}>{fmt(value)}</Text>
      <ThumbControls
        label="Value"
        value={value}
        min={minValue}
        max={maxValue}
        step={step}
        onChange={(next) => onChange(clamp(next, minValue, maxValue))}
        testIDPrefix={testID ?? "range"}
      />
    </View>
  );
}

function ThumbControls({
  label,
  value,
  min,
  max,
  step,
  onChange,
  testIDPrefix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  testIDPrefix: string;
}) {
  return (
    <View
      style={styles.thumbRow}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
    >
      <Pressable
        onPress={() => onChange(value - step)}
        disabled={value <= min}
        style={[styles.btn, value <= min && styles.btnDisabled]}
        accessibilityLabel={`Decrease ${label.toLowerCase()}`}
        testID={`${testIDPrefix}-dec`}
      >
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <Text style={styles.value} testID={`${testIDPrefix}-value`}>
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(value + step)}
        disabled={value >= max}
        style={[styles.btn, value >= max && styles.btnDisabled]}
        accessibilityLabel={`Increase ${label.toLowerCase()}`}
        testID={`${testIDPrefix}-inc`}
      >
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.s2,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: colors.textMuted,
  },
  controlsRow: {
    flexDirection: "row",
    gap: spacing.s4,
  },
  thumbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.coralBlossom,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    backgroundColor: colors.disabled,
  },
  btnText: {
    color: colors.white,
    fontSize: 18,
    lineHeight: 18,
    fontWeight: "600",
  },
  value: {
    minWidth: 32,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.foreground,
  },
});
