/**
 * DiscoverFeedScreen.tsx — B.2 Discover Feed.
 *
 * Vertical feed of mixed cards: featured salons, sponsored placements,
 * editorial highlights. Sponsored content carries a clear "Sponsored"
 * badge per FTC guidance.
 */

import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import type { ServiceTypeCard } from "../../domains/discovery";
import { RatingStars, colors, radius, spacing, textStyles } from "../../shared/ui";

export type DiscoverFeedItem =
  | { kind: "salon"; salon: ServiceTypeCard }
  | { kind: "sponsored"; salon: ServiceTypeCard; sponsorName: string }
  | { kind: "editorial"; id: string; title: string; subtitle: string; ctaLabel: string };

export type DiscoverFeedScreenProps = {
  items: DiscoverFeedItem[];
  onPressSalon?: (salon: ServiceTypeCard) => void;
  onPressEditorial?: (id: string) => void;
  onPressFilters?: () => void;
  testID?: string;
};

export function DiscoverFeedScreen({
  items,
  onPressSalon,
  onPressEditorial,
  onPressFilters,
  testID,
}: DiscoverFeedScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Discover
        </Text>
        <Pressable
          onPress={onPressFilters}
          style={styles.filterBtn}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          testID={testID ? `${testID}-filters` : undefined}
        >
          <Text style={styles.filterText}>Filters</Text>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(it) => (it.kind === "editorial" ? `e-${it.id}` : `s-${it.salon.id}`)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          if (item.kind === "editorial") {
            return (
              <Pressable
                onPress={() => onPressEditorial?.(item.id)}
                style={styles.editorialCard}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                testID={testID ? `${testID}-editorial-${item.id}` : undefined}
              >
                <Text style={styles.editorialTitle}>{item.title}</Text>
                <Text style={styles.editorialSubtitle}>{item.subtitle}</Text>
                <Text style={styles.editorialCta}>{item.ctaLabel}</Text>
              </Pressable>
            );
          }
          const isSponsored = item.kind === "sponsored";
          return (
            <Pressable
              onPress={() => onPressSalon?.(item.salon)}
              style={styles.salonCard}
              accessibilityRole="button"
              accessibilityLabel={`${item.salon.serviceName} at ${item.salon.locationDisplayName}${isSponsored ? ", sponsored" : ""}`}
              testID={testID ? `${testID}-salon-${item.salon.id}` : undefined}
            >
              {isSponsored ? (
                <View
                  style={styles.sponsoredBadge}
                  testID={testID ? `${testID}-sponsored-${item.salon.id}` : undefined}
                >
                  <Text style={styles.sponsoredText}>Sponsored · {item.sponsorName}</Text>
                </View>
              ) : null}
              <View style={styles.salonImage} />
              <Text style={styles.salonName} numberOfLines={1}>
                {item.salon.serviceName}
              </Text>
              <Text style={styles.salonCity} numberOfLines={1}>
                {item.salon.locationDisplayName}
              </Text>
              <View style={styles.ratingRow}>
                <RatingStars value={item.salon.serviceAverageRating ?? item.salon.locationAverageRating ?? 0} size={16} />
                <Text style={styles.salonMeta}>({item.salon.serviceReviewCount})</Text>
              </View>
              <Text style={styles.salonMeta}>
                From £{item.salon.priceFrom.toFixed(0)}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.pageVertical,
    paddingBottom: spacing.s2,
  },
  title: { ...textStyles.heading1, color: colors.foreground },
  filterBtn: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
  },
  filterText: { ...textStyles.label, color: colors.foreground },
  list: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s12,
    gap: spacing.s4,
  },
  salonCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
    gap: spacing.s1,
  },
  sponsoredBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.warmOat,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.s2,
    paddingVertical: spacing.s1,
    marginBottom: spacing.s2,
  },
  sponsoredText: { ...textStyles.labelSmall, color: colors.foreground },
  salonImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.disabledBg,
    borderRadius: radius.md,
    marginBottom: spacing.s2,
  },
  salonName: { ...textStyles.heading4, color: colors.foreground },
  salonCity: { ...textStyles.bodySmall, color: colors.textMuted },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.s1 },
  salonMeta: { ...textStyles.bodySmall, color: colors.textMuted },
  editorialCard: {
    backgroundColor: colors.mintFresh,
    borderRadius: radius.lg,
    padding: spacing.cardPaddingLarge,
    gap: spacing.s1,
  },
  editorialTitle: { ...textStyles.heading3, color: colors.accentForeground },
  editorialSubtitle: { ...textStyles.body, color: colors.accentForeground },
  editorialCta: {
    ...textStyles.label,
    color: colors.accentForeground,
    marginTop: spacing.s2,
  },
});
