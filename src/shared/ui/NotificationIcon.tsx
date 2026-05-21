/**
 * NotificationIcon.tsx — React Native adaptation of the web NotificationIcon component.
 *
 * Supports bell / message / mail / users icons (Tabler outline SVG paths),
 * badge color variants, three sizes, and a spring pop animation when the
 * count increases.
 */

import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { brandTypography } from "./brandTypography";
import { colors } from "./tokens";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationIconVariant = "bell" | "message" | "mail" | "users";
export type NotificationIconColor   = "red" | "blue" | "teal" | "amber" | "purple";
export type NotificationIconSize    = "sm" | "md" | "lg";

export interface NotificationIconProps {
  /** Number of unread items. 0 hides the badge. */
  count?: number;
  /** Clamp display above this value — shows "99+" etc. Default 99. */
  maxCount?: number;
  /** Which icon to render. Default "bell". */
  icon?: NotificationIconVariant;
  /** Badge colour. Default "red". */
  color?: NotificationIconColor;
  /** Component size. Default "md". */
  size?: NotificationIconSize;
  /** Spring pop ring on badge when count > 0. */
  pulse?: boolean;
  /** Called when the button is pressed. */
  onPress?: () => void;
  /** Accessibility label override. */
  accessibilityLabel?: string;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

const SIZE_MAP: Record<NotificationIconSize, {
  btn: number; icon: number; badge: number; badgeFont: number; badgeOffset: number;
}> = {
  sm: { btn: 40, icon: 18, badge: 17, badgeFont: 10, badgeOffset: -4 },
  md: { btn: 44, icon: 22, badge: 20, badgeFont: 11, badgeOffset: -4 },
  lg: { btn: 56, icon: 28, badge: 24, badgeFont: 13, badgeOffset: -5 },
};

const COLOR_MAP: Record<NotificationIconColor, { bg: string; text: string }> = {
  red:    { bg: "#E24B4A", text: "#fff"    },
  blue:   { bg: "#378ADD", text: "#fff"    },
  teal:   { bg: "#1D9E75", text: "#fff"    },
  amber:  { bg: "#EF9F27", text: "#412402" },
  purple: { bg: "#7F77DD", text: "#fff"    },
};

// ─── SVG icon paths (Tabler outline, 24×24 viewBox, stroke-width 2) ──────────

const ICON_PATHS: Record<NotificationIconVariant, string[]> = {
  bell: [
    "M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6",
    "M9 17v1a3 3 0 0 0 6 0v-1",
  ],
  message: [
    "M3 20l1.3 -3.9a9 8 0 1 1 3.4 2.9l-4.7 1",
  ],
  mail: [
    "M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2V7z",
    "M3 7l9 6l9 -6",
  ],
  users: [
    "M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",
    "M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2",
    "M16 3.13a4 4 0 0 1 0 7.75",
    "M21 21v-2a4 4 0 0 0 -3 -3.85",
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationIcon({
  count     = 0,
  maxCount  = 99,
  icon      = "bell",
  color     = "red",
  size      = "md",
  onPress,
  accessibilityLabel,
}: NotificationIconProps) {
  const tokens    = SIZE_MAP[size];
  const colorTokens = COLOR_MAP[color];
  const paths     = ICON_PATHS[icon];
  const visible   = count > 0;
  const label     = count > maxCount ? `${maxCount}+` : String(count);

  // Spring pop animation when count increases
  const scaleAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > 0 && count !== prevCount.current) {
      // Pop: shrink to 0.4 then spring overshoot to 1
      scaleAnim.setValue(0.4);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 8,
        stiffness: 180,
      }).start();
    } else if (count === 0) {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else if (count > 0 && prevCount.current === 0) {
      scaleAnim.setValue(0.4);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 8,
        stiffness: 180,
      }).start();
    }
    prevCount.current = count;
  }, [count, scaleAnim]);

  const a11yLabel = accessibilityLabel
    ?? `${icon}${visible ? `, ${count} unread` : ""}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { width: tokens.btn, height: tokens.btn, borderRadius: tokens.btn / 2 },
        pressed && styles.btnPressed,
      ]}
    >
      {/* Icon */}
      <Svg
        width={tokens.icon}
        height={tokens.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.foreground ?? "#1A1A1A"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths.map((d, i) => (
          <Path key={i} d={d} />
        ))}
      </Svg>

      {/* Badge */}
      <Animated.View
        style={[
          styles.badge,
          {
            top:         tokens.badgeOffset,
            right:       tokens.badgeOffset,
            minWidth:    tokens.badge,
            height:      tokens.badge,
            borderRadius: tokens.badge / 2,
            backgroundColor: colorTokens.bg,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        accessibilityElementsHidden
      >
        <Text
          style={[
            styles.badgeText,
            { fontSize: tokens.badgeFont, color: colorTokens.text },
          ]}
          numberOfLines={1}
        >
          {visible ? label : ""}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btn: {
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: colors.surface,
    borderWidth:     1,
    borderColor:     colors.border,
    overflow:        "visible",
  },
  btnPressed: {
    opacity: 0.75,
  },
  badge: {
    position:        "absolute",
    alignItems:      "center",
    justifyContent:  "center",
    paddingHorizontal: 4,
    borderWidth:     2,
    borderColor:     colors.background,
  },
  badgeText: {
    fontFamily:  brandTypography.semibold,
    lineHeight:  14,
    letterSpacing: -0.3,
  },
});
