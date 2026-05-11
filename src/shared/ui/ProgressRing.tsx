/**
 * ProgressRing.tsx — Batch E progress-ring primitive.
 *
 * Circular SVG progress indicator. Three sizes: 64 / 96 / 128.
 * Track: colors.border (#E5E0D1). Progress stroke: configurable
 * (defaults coral-blossom; tier arc uses mint-fresh).
 *
 * States: default | loading (indeterminate rotate) | empty | error | disabled.
 * Accessibility: accessibilityRole="progressbar" with accessibilityValue.
 * Reduce-motion: pass reduceMotion=true to skip rotation animation.
 */

import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type AccessibilityValue,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import { colors, spacing, textStyles } from "./tokens";

export type ProgressRingSize = 64 | 96 | 128;
export type ProgressRingState = "default" | "loading" | "empty" | "error" | "disabled";

export type ProgressRingProps = {
  /** 0–1, inclusive. */
  progress: number;
  size?: ProgressRingSize;
  /** Stroke color for the progress arc. */
  progressColor?: string;
  /** Label displayed in the ring center (e.g. "65%"). */
  centerLabel?: string;
  /** Sub-label displayed below centerLabel. */
  centerSubLabel?: string;
  state?: ProgressRingState;
  reduceMotion?: boolean;
  accessibilityLabel?: string;
  accessibilityValue?: AccessibilityValue;
  testID?: string;
};

const STROKE: Record<ProgressRingSize, number> = { 64: 6, 96: 8, 128: 10 };

export function ProgressRing({
  progress,
  size = 96,
  progressColor = colors.primary,
  centerLabel,
  centerSubLabel,
  state = "default",
  reduceMotion = false,
  accessibilityLabel,
  accessibilityValue,
  testID,
}: ProgressRingProps) {
  const strokeWidth = STROKE[size];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const dashOffset = state === "empty" ? circumference : circumference * (1 - clampedProgress);

  // Indeterminate animation for "loading" state
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === "loading" && !reduceMotion) {
      const anim = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      );
      anim.start();
      return () => anim.stop();
    } else {
      rotateAnim.setValue(0);
      return undefined;
    }
  }, [state, reduceMotion, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const isDisabled = state === "disabled";
  const isError = state === "error";
  const trackColor = isDisabled ? colors.disabledBg : colors.border;
  const arcColor = isDisabled ? colors.disabled : isError ? colors.error : progressColor;
  const loadingArcOffset = circumference * (1 - 0.75); // 270° arc

  const defaultAccessibilityValue: AccessibilityValue = {
    min: 0,
    max: 100,
    now: Math.round(clampedProgress * 100),
    text: `${Math.round(clampedProgress * 100)}%`,
  };

  return (
    <View
      style={[styles.root, { width: size, height: size }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `Progress: ${Math.round(clampedProgress * 100)}%`}
      accessibilityValue={accessibilityValue ?? defaultAccessibilityValue}
      testID={testID}
    >
      {state === "loading" ? (
        <View
          style={styles.loadingMarker}
          testID={testID ? `${testID}-loading` : undefined}
        />
      ) : null}
      <Animated.View
        style={[
          styles.svgWrap,
          state === "loading" && !reduceMotion ? { transform: [{ rotate }] } : undefined,
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          {state !== "empty" && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={arcColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={state === "loading" ? loadingArcOffset : dashOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2},${size / 2}`}
            />
          )}
        </Svg>
      </Animated.View>

      {/* Center content */}
      {isError ? (
        <View
          style={[styles.center, { width: size, height: size }]}
          testID={testID ? `${testID}-error` : undefined}
        >
          <Text style={[styles.errorGlyph, { fontSize: size * 0.25 }]}>⚠</Text>
        </View>
      ) : centerLabel != null ? (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text
            style={[styles.centerLabel, { fontSize: size === 64 ? 14 : size === 96 ? 18 : 22 }]}
            numberOfLines={1}
          >
            {centerLabel}
          </Text>
          {centerSubLabel != null ? (
            <Text
              style={[
                styles.centerSubLabel,
                { fontSize: size === 64 ? 10 : size === 96 ? 12 : 14 },
              ]}
              numberOfLines={1}
            >
              {centerSubLabel}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
  },
  svgWrap: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s1,
  },
  loadingMarker: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  centerLabel: {
    ...textStyles.heading3,
    color: colors.foreground,
    textAlign: "center",
  },
  centerSubLabel: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  errorGlyph: {
    color: colors.error,
  },
});
