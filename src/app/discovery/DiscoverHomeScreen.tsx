/**
 * DiscoverHomeScreen.tsx — W22/W34 Stream B.
 *
 * Discovery landing screen with featured salons and category chips.
 * Presentation-only; data flows in via props.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { RatingStars, colors, radius, spacing } from "../../shared/ui";

import type { DiscoveryCategory, FeaturedSalon } from "./discoveryHelpers";

export type DiscoverHomeScreenProps = {
  featuredSalons: FeaturedSalon[];
  categories: DiscoveryCategory[];
  onSelectSalon: (salonId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  testID?: string;
};

export function DiscoverHomeScreen({
  featuredSalons,
  categories,
  onSelectSalon,
  onSelectCategory,
  testID,
}: DiscoverHomeScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID ?? "discover-home"}
    >
      <Text style={styles.heading} accessibilityRole="header">
        Discover
      </Text>

      <Text style={styles.sectionLabel}>Browse categories</Text>
      <View style={styles.categoryRow}>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => onSelectCategory(cat.id)}
            style={styles.categoryChip}
            accessibilityRole="button"
            accessibilityLabel={`Browse ${cat.label}`}
            testID={`discover-home-category-${cat.id}`}
          >
            {cat.emoji ? <Text style={styles.categoryEmoji}>{cat.emoji}</Text> : null}
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Featured salons</Text>
      <View style={styles.salonList}>
        {featuredSalons.map((salon) => (
          <Pressable
            key={salon.id}
            onPress={() => onSelectSalon(salon.id)}
            style={styles.salonCard}
            accessibilityRole="button"
            accessibilityLabel={`Open ${salon.name}`}
            testID={`discover-home-salon-${salon.id}`}
          >
            <Text style={styles.salonName}>{salon.name}</Text>
            <Text style={styles.salonCity}>{salon.city}</Text>
            <View style={styles.ratingRow}>
              <RatingStars value={salon.rating} size={16} />
              <Text style={styles.reviewCount}>({salon.reviewCount})</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  heading: { fontSize: 28, fontWeight: "700", color: colors.foreground },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: spacing.s3,
  },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  categoryChip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s1,
  },
  categoryEmoji: { fontSize: 16 },
  categoryLabel: { fontSize: 14, color: colors.foreground },
  salonList: { gap: spacing.s3 },
  salonCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
  },
  salonName: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  salonCity: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.s2, marginTop: spacing.s2 },
  reviewCount: { fontSize: 12, color: colors.textMuted },
});
