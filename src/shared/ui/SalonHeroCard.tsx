/**
 * SalonHeroCard.tsx — B.C2 salon hero card primitive.
 *
 * 16:9 image with bottom scrim, overlaid name + sub-info row, optional
 * favorite toggle in the top-right.
 */

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";
import { RatingStars } from "./RatingStars";

export type SalonHeroCardProps = {
  name: string;
  imageUri?: string;
  rating?: number;
  reviewCount?: number;
  /** Optional pre-formatted distance / city / hours. */
  metaLine?: string;
  hours?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPress?: () => void;
  testID?: string;
};

export function SalonHeroCard({
  name,
  imageUri,
  rating,
  reviewCount,
  metaLine,
  hours,
  isFavorite = false,
  onToggleFavorite,
  onPress,
  testID,
}: SalonHeroCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `Open ${name}` : name}
      testID={testID}
    >
      <View style={styles.image}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imageContent} resizeMode="cover" />
        ) : (
          <View style={[styles.imageContent, styles.imagePlaceholder]} />
        )}
        <View style={styles.scrim} />
        {onToggleFavorite ? (
          <Pressable
            onPress={onToggleFavorite}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? "Saved" : "Save salon"}
            accessibilityState={{ selected: isFavorite }}
            style={styles.favBtn}
            hitSlop={8}
            testID={testID ? `${testID}-fav` : undefined}
          >
            <Text style={styles.favIcon}>{isFavorite ? "♥" : "♡"}</Text>
          </Pressable>
        ) : null}
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.metaRow}>
            {typeof rating === "number" ? (
              <View style={styles.ratingRow}>
                <RatingStars value={rating} size={16} />
                {typeof reviewCount === "number" ? (
                  <Text style={styles.metaText}>({reviewCount})</Text>
                ) : null}
              </View>
            ) : null}
            {metaLine ? <Text style={styles.metaText}>{metaLine}</Text> : null}
            {hours ? <Text style={styles.metaText}>{hours}</Text> : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.disabledBg,
    justifyContent: "flex-end",
  },
  imageContent: {
    ...StyleSheet.absoluteFillObject,
  },
  imagePlaceholder: {
    backgroundColor: colors.disabledBg,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  favBtn: {
    position: "absolute",
    top: spacing.s3,
    right: spacing.s3,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  favIcon: {
    color: colors.white,
    fontSize: 18,
    lineHeight: 18,
  },
  body: {
    padding: spacing.s4,
    gap: spacing.s1,
  },
  name: {
    color: colors.white,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    flexWrap: "wrap",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s1,
  },
  metaText: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
});
