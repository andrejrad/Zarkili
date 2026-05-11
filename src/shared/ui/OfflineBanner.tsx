/**
 * OfflineBanner.tsx — W32 Batch L
 *
 * Sticky top banner that reflects the device's network/connectivity state.
 * Three internal states: offline | reconnecting | restored (auto-hides after 3 s)
 *
 * Props:
 *   status            — "offline" | "reconnecting" | "restored"
 *   onRetry?          — called when user taps "Retry" (offline state only)
 *   testID
 */

import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "./tokens";

export type OfflineBannerStatus = "offline" | "reconnecting" | "restored";

export type OfflineBannerProps = {
  status: OfflineBannerStatus;
  onRetry?: () => void;
  testID?: string;
};

const CONFIG: Record<
  OfflineBannerStatus,
  { bg: string; icon: string; label: string; showRetry: boolean }
> = {
  offline: {
    bg: colors.error,
    icon: "📵",
    label: "No internet connection",
    showRetry: true,
  },
  reconnecting: {
    bg: "#B57300",
    icon: "🔄",
    label: "Reconnecting…",
    showRetry: false,
  },
  restored: {
    bg: "#2E7D32",
    icon: "✓",
    label: "Back online",
    showRetry: false,
  },
};

export function OfflineBanner({ status, onRetry, testID }: OfflineBannerProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    setVisible(true);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    if (status === "restored") {
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(
          () => setVisible(false)
        );
      }, 3000);
    }

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible && status !== "offline") return null;

  const cfg = CONFIG[status];

  return (
    <Animated.View
      style={[styles.banner, { backgroundColor: cfg.bg }, { opacity }]}
      testID={testID}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text style={styles.icon}>{cfg.icon}</Text>
      <Text style={styles.label} testID={testID ? `${testID}-label` : undefined}>
        {cfg.label}
      </Text>
      {cfg.showRetry && onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={styles.retryBtn}
          testID={testID ? `${testID}-retry` : undefined}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      )}
      <View style={styles.status}>
        <View
          style={[styles.statusDot, { backgroundColor: cfg.bg === colors.error ? colors.error : "#fff" }]}
          testID={testID ? `${testID}-status-${status}` : undefined}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s2,
    gap: spacing.s2,
  },
  icon: { fontSize: 14 },
  label: { flex: 1, fontSize: 13, fontWeight: "500", color: colors.surface },
  retryBtn: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 4,
  },
  retryText: { fontSize: 12, fontWeight: "600", color: colors.surface },
  status: { width: 0 }, // invisible; purely for testID anchoring
  statusDot: { width: 0, height: 0 },
});
