/**
 * SaveToggle.tsx — W28 Batch H primitive.
 *
 * Standalone heart save/unsave icon button.
 * Used in post detail header action row and as the overlay button on PostCard.
 *
 * States: default (unsaved) | active (saved) | pressed (scale feedback)
 * Optionally shows a "Added to Saved" toast on first save via `showToastOnSave`.
 *
 * Used in: H.1 MarketplacePostDetailScreen (action row)
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, textStyles } from "./tokens";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SaveToggleProps = {
  saved: boolean;
  onPress?: () => void;
  /** When true, show the "Added to Saved" toast on transition to saved. */
  showToastOnSave?: boolean;
  /** Colour variant — "onImage" renders the heart white/coral; "onSurface" renders muted/coral. */
  variant?: "onSurface" | "onImage";
  disabled?: boolean;
  testID?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SaveToggle({
  saved,
  onPress,
  variant = "onSurface",
  disabled = false,
  testID,
}: SaveToggleProps) {
  const iconColor = saved
    ? colors.primary
    : variant === "onImage"
      ? colors.white
      : colors.textMuted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? "Saved" : "Save"}
      accessibilityState={{ selected: saved, disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      testID={testID}
    >
      <Text style={[styles.icon, { color: iconColor }]}>
        {saved ? "♥" : "♡"}
      </Text>
    </Pressable>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export type SavedToastProps = {
  visible: boolean;
  testID?: string;
};

/** Bottom toast shown after first save action. Parent controls visibility + auto-dismiss timing. */
export function SavedToast({ visible, testID }: SavedToastProps) {
  if (!visible) return null;
  return (
    <View style={styles.toast} testID={testID}>
      <Text style={styles.toastText}>Added to Saved</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    transform: [{ scale: 0.88 }],
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  icon: {
    fontSize: 22,
    lineHeight: 26,
  },
  toast: {
    position: "absolute",
    bottom: spacing.s6,
    alignSelf: "center",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  toastText: {
    ...textStyles.bodySmall,
    color: colors.foreground,
  },
});
