/**
 * RangeSlider.tsx — B.C2 range-slider primitive.
 *
 * Single-thumb  (`value` prop)  — visual track + draggable handle.
 * Dual-thumb    (`range` prop)  — visual track + two draggable handles,
 *               filled segment between them.
 *
 * Pure React Native — no extra gesture library. Uses PanResponder on each
 * handle and onLayout on the track to translate pixel offsets to values.
 *
 * The handle hit-target is 44×44 pt so it passes Apple HIG / WCAG 2.5.5.
 */

import { useRef } from "react";
import {
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { colors, radius, spacing } from "./tokens";

// ---------------------------------------------------------------------------
// Public types (unchanged — FilterSheetScreen keeps working without edits)
// ---------------------------------------------------------------------------

type Common = {
  minValue: number;
  maxValue: number;
  step?: number;
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isDual(p: RangeSliderProps): p is DualRangeSliderProps {
  return Array.isArray((p as DualRangeSliderProps).range);
}

// ---------------------------------------------------------------------------
// Single thumb
// ---------------------------------------------------------------------------

function SingleSlider({
  value,
  minValue,
  maxValue,
  step = 1,
  formatValue,
  onChange,
  testID,
}: SingleRangeSliderProps) {
  const fmt = formatValue ?? String;

  // Refs updated on every render so PanResponder callbacks always see fresh values.
  // This avoids stale-closure bugs: PanResponder is created once via useRef, but
  // reads these refs at call-time, so it always operates on current state.
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // trackWidth is set by onLayout — no setState here (avoids render loops).
  // Handle positions use percentage-based `left`, so they don't need trackWidth.
  // Only gesture math needs it, and we guard with `if (tw === 0) return`.
  const trackWidth = useRef(0);
  const baseOffset = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const frac = (valueRef.current - minValue) / (maxValue - minValue);
        baseOffset.current = frac * trackWidth.current;
      },
      onPanResponderMove: (_, gs) => {
        const tw = trackWidth.current;
        if (tw === 0) return;
        const px = baseOffset.current + gs.dx;
        const ratio = Math.min(1, Math.max(0, px / tw));
        const raw = minValue + ratio * (maxValue - minValue);
        const stepped = Math.round((raw - minValue) / step) * step + minValue;
        const clamped = Math.min(Math.max(stepped, minValue), maxValue);
        onChangeRef.current(clamped);
      },
    })
  ).current;

  const fillFrac = (value - minValue) / (maxValue - minValue);
  const fillPct = `${Math.min(100, Math.max(0, fillFrac * 100))}%`;

  return (
    <View testID={testID} style={styles.wrapper}>
      <Text style={styles.singleLabel}>{fmt(value)}</Text>
      <View
        style={styles.trackContainer}
        onLayout={(e: LayoutChangeEvent) => {
          trackWidth.current = e.nativeEvent.layout.width;
        }}
      >
        <View style={styles.trackInactive} />
        <View style={[styles.trackActive, { width: fillPct as any }]} />
        <View
          {...pan.panHandlers}
          style={[styles.handle, { left: fillPct as any }]}
          accessibilityRole="adjustable"
          accessibilityLabel="Value"
          accessibilityValue={{ min: minValue, max: maxValue, now: value }}
          testID={testID ? `${testID}-thumb` : undefined}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dual thumb
// ---------------------------------------------------------------------------

function DualSlider({
  range,
  minValue,
  maxValue,
  step = 1,
  formatValue,
  onChange,
  testID,
}: DualRangeSliderProps) {
  const fmt = formatValue ?? String;
  const [lo, hi] = range;

  // Refs updated on every render — PanResponder callbacks always see fresh values.
  const loRef = useRef(lo);
  loRef.current = lo;
  const hiRef = useRef(hi);
  hiRef.current = hi;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // trackWidth: set by onLayout, never triggers a re-render.
  // Calling setState in onLayout caused the "Maximum update depth exceeded" loop:
  //   onChange → setDraft → DualSlider re-renders → onLayout fires → setState → loop.
  const trackWidth = useRef(0);

  // Each handle has its own base offset so one grant can never overwrite the other.
  const baseOffsetLo = useRef(0);
  const baseOffsetHi = useRef(0);

  const panLo = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const frac = (loRef.current - minValue) / (maxValue - minValue);
        baseOffsetLo.current = frac * trackWidth.current;
      },
      onPanResponderMove: (_, gs) => {
        const tw = trackWidth.current;
        if (tw === 0) return;
        const px = baseOffsetLo.current + gs.dx;
        const ratio = Math.min(1, Math.max(0, px / tw));
        const raw = minValue + ratio * (maxValue - minValue);
        const stepped = Math.round((raw - minValue) / step) * step + minValue;
        const clamped = Math.min(Math.max(stepped, minValue), hiRef.current - step);
        onChangeRef.current([clamped, hiRef.current]);
      },
    })
  ).current;

  const panHi = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const frac = (hiRef.current - minValue) / (maxValue - minValue);
        baseOffsetHi.current = frac * trackWidth.current;
      },
      onPanResponderMove: (_, gs) => {
        const tw = trackWidth.current;
        if (tw === 0) return;
        const px = baseOffsetHi.current + gs.dx;
        const ratio = Math.min(1, Math.max(0, px / tw));
        const raw = minValue + ratio * (maxValue - minValue);
        const stepped = Math.round((raw - minValue) / step) * step + minValue;
        const clamped = Math.min(Math.max(stepped, loRef.current + step), maxValue);
        onChangeRef.current([loRef.current, clamped]);
      },
    })
  ).current;

  const loFrac = (lo - minValue) / (maxValue - minValue);
  const hiFrac = (hi - minValue) / (maxValue - minValue);
  const loPercent = `${Math.min(100, Math.max(0, loFrac * 100))}%`;
  const hiPercent = `${Math.min(100, Math.max(0, hiFrac * 100))}%`;
  const fillLeft = loPercent;
  const fillWidth = `${Math.min(100, Math.max(0, (hiFrac - loFrac) * 100))}%`;

  return (
    <View testID={testID} style={styles.wrapper}>
      {/* Value labels */}
      <View style={styles.dualLabels}>
        <Text style={styles.dualLabel} testID={testID ? `${testID}-lo-label` : undefined}>
          {fmt(lo)}
        </Text>
        <Text style={styles.dualLabel} testID={testID ? `${testID}-hi-label` : undefined}>
          {fmt(hi)}
        </Text>
      </View>

      {/* Track + handles */}
      <View
        style={styles.trackContainer}
        onLayout={(e: LayoutChangeEvent) => {
          trackWidth.current = e.nativeEvent.layout.width;
        }}
      >
        {/* inactive track */}
        <View style={styles.trackInactive} />
        {/* active fill between handles */}
        <View
          style={[styles.trackActive, { left: fillLeft as any, width: fillWidth as any, position: "absolute" }]}
        />
        {/* lo handle */}
        <View
          {...panLo.panHandlers}
          style={[styles.handle, { left: loPercent as any }]}
          accessibilityRole="adjustable"
          accessibilityLabel="Minimum price"
          accessibilityValue={{ min: minValue, max: hi - step, now: lo }}
          testID={testID ? `${testID}-lo` : undefined}
        />
        {/* hi handle */}
        <View
          {...panHi.panHandlers}
          style={[styles.handle, { left: hiPercent as any }]}
          accessibilityRole="adjustable"
          accessibilityLabel="Maximum price"
          accessibilityValue={{ min: lo + step, max: maxValue, now: hi }}
          testID={testID ? `${testID}-hi` : undefined}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function RangeSlider(props: RangeSliderProps) {
  if (isDual(props)) {
    return <DualSlider {...props} />;
  }
  return <SingleSlider {...props} />;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const TRACK_HEIGHT = 4;
const HANDLE_SIZE = 24;
const HIT_SLOP = (44 - HANDLE_SIZE) / 2; // expands tap target to 44pt

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.s3,
    paddingBottom: HIT_SLOP,   // room for handle to breathe
  },
  // Single label centred above
  singleLabel: {
    alignSelf: "center",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.foreground,
  },
  // Dual labels left / right
  dualLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dualLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.foreground,
  },
  // Track container — positions children absolutely relative to this
  trackContainer: {
    height: HANDLE_SIZE,
    justifyContent: "center",
    marginHorizontal: HANDLE_SIZE / 2,  // so handles can reach 0% and 100%
  },
  trackInactive: {
    position: "absolute",
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.disabled,
  },
  trackActive: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.coralBlossom,
  },
  handle: {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.coralBlossom,
    // centre the handle on its percentage position
    marginLeft: -(HANDLE_SIZE / 2),
    // centred vertically in trackContainer
    top: (HANDLE_SIZE - HANDLE_SIZE) / 2,
    // shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
