/**
 * PostCard.tsx — W28 Batch H primitive.
 *
 * Square or 4:5 image card for marketplace posts.
 * Shows a bottom-scrim overlay with title text and a save-toggle heart
 * in the top-right corner.
 *
 * Image source is a URI string (remote URL or local file path).
 * Use `aspectRatio` prop to switch between 1:1 (square) and 4:5 portrait.
 *
 * States: default (unsaved) | saved | loading
 * Used in: H.1 MarketplacePostDetailScreen (related posts),
 *          H.2 SavedPostsScreen (grid)
 */

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostCardProps = {
  postId: string;
  title: string;
  /** Remote image URI for the post cover. */
  imageUri: string;
  saved?: boolean;
  /** Card aspect ratio. Defaults to "square" (1:1). */
  aspectRatio?: "square" | "portrait";
  onPress?: () => void;
  onPressSave?: () => void;
  isLoading?: boolean;
  testID?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PostCard({
  title,
  imageUri,
  saved = false,
  aspectRatio = "square",
  onPress,
  onPressSave,
  isLoading = false,
  testID,
}: PostCardProps) {
  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          aspectRatio === "portrait" ? styles.containerPortrait : styles.containerSquare,
          styles.shimmer,
        ]}
        testID={testID}
        accessibilityElementsHidden
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        aspectRatio === "portrait" ? styles.containerPortrait : styles.containerSquare,
        pressed && styles.containerPressed,
      ]}
      testID={testID}
    >
      {/* Cover image */}
      <Image
        source={{ uri: imageUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityElementsHidden
      />

      {/* Bottom scrim gradient approximation — solid-to-transparent using View layers */}
      <View style={styles.scrim} pointerEvents="none" />

      {/* Title on scrim */}
      <View style={styles.titleContainer} pointerEvents="none">
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>

      {/* Save heart */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saved ? "Saved" : "Save"}
        accessibilityState={{ selected: saved }}
        onPress={onPressSave}
        hitSlop={8}
        style={({ pressed }) => [styles.heartButton, pressed && styles.heartButtonPressed]}
        testID={testID ? `${testID}-save` : undefined}
      >
        {/* Heart shape drawn with text character for zero-dependency approach */}
        <Text style={[styles.heartIcon, saved && styles.heartIconSaved]}>
          {saved ? "♥" : "♡"}
        </Text>
      </Pressable>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.border,
    position: "relative",
  },
  containerSquare: {
    aspectRatio: 1,
  },
  containerPortrait: {
    aspectRatio: 4 / 5,
  },
  containerPressed: {
    opacity: 0.88,
  },
  shimmer: {
    backgroundColor: colors.border,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    // Approximate gradient with a translucent layer at the bottom 40%
    backgroundColor: "transparent",
    // We use a top-to-bottom gradient simulation with a solid dark at the bottom
    // In production a LinearGradient library call would replace this View.
    justifyContent: "flex-end",
  },
  // Solid dark overlay only over bottom portion
  titleContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.s4,
    paddingBottom: spacing.s4,
    paddingTop: spacing.s8,
    // Dark-to-transparent scrim effect
    backgroundColor: "rgba(0,0,0,0.40)",
  },
  title: {
    ...textStyles.heading3,
    color: colors.white,
  },
  heartButton: {
    position: "absolute",
    top: spacing.s2,
    right: spacing.s2,
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  heartButtonPressed: {
    transform: [{ scale: 0.88 }],
  },
  heartIcon: {
    fontSize: 22,
    color: colors.white,
    lineHeight: 26,
  },
  heartIconSaved: {
    color: colors.primary,
  },
});
