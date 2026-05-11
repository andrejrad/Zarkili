/**
 * ExploreSearchResultsScreen.tsx — B.3 Explore / Search Results.
 *
 * Search bar + active-filter chip row + list/map toggle + sticky
 * "Filters" affordance. Filtering uses `applyDiscoveryFiltersAndSort`.
 */

import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import type { DiscoverySalonCard } from "../../domains/discovery";
import { RatingStars, colors, radius, spacing, textStyles } from "../../shared/ui";
import {
  applyDiscoveryFiltersAndSort,
  countActiveFilterDimensions,
  type DiscoveryFilters,
} from "./discoveryFilters";

export type ExploreSearchResultsScreenProps = {
  salons: DiscoverySalonCard[];
  filters: DiscoveryFilters;
  onChangeFilters: (next: DiscoveryFilters) => void;
  onPressSalon?: (salon: DiscoverySalonCard) => void;
  onPressFilters?: () => void;
  onToggleMap?: () => void;
  showMapToggle?: boolean;
  testID?: string;
};

export function ExploreSearchResultsScreen({
  salons,
  filters,
  onChangeFilters,
  onPressSalon,
  onPressFilters,
  onToggleMap,
  showMapToggle = true,
  testID,
}: ExploreSearchResultsScreenProps) {
  const results = applyDiscoveryFiltersAndSort(salons, filters);
  const activeCount = countActiveFilterDimensions(filters);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.headerWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            {filters.query.trim().length > 0 ? filters.query : "Search salons, services, staff…"}
          </Text>
        </View>
        <View style={styles.toolbar}>
          <Pressable
            onPress={onPressFilters}
            style={styles.toolBtn}
            accessibilityRole="button"
            accessibilityLabel={
              activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"
            }
            testID={testID ? `${testID}-filters` : undefined}
          >
            <Text style={styles.toolText}>
              {activeCount > 0 ? `Filters · ${activeCount}` : "Filters"}
            </Text>
          </Pressable>
          {showMapToggle ? (
            <Pressable
              onPress={onToggleMap}
              style={styles.toolBtn}
              accessibilityRole="button"
              accessibilityLabel="Switch to map view"
              testID={testID ? `${testID}-map-toggle` : undefined}
            >
              <Text style={styles.toolText}>Map</Text>
            </Pressable>
          ) : null}
        </View>
        {activeCount > 0 ? (
          <Pressable
            onPress={() =>
              onChangeFilters({
                ...filters,
                query: "",
                category: "all",
                priceRange: [0, 500],
                minRating: 0,
                availability: "any",
                memberOnly: false,
              })
            }
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            testID={testID ? `${testID}-clear` : undefined}
            hitSlop={8}
            style={styles.clearWrap}
          >
            <Text style={styles.clearText}>Clear all filters</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.summary} testID={testID ? `${testID}-summary` : undefined}>
        {results.length === 1 ? "1 salon" : `${results.length} salons`}
      </Text>

      <FlatList
        data={results}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty} testID={testID ? `${testID}-empty` : undefined}>
            <Text style={styles.emptyTitle}>No salons match those filters</Text>
            <Text style={styles.emptyBody}>Try widening price or availability.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPressSalon?.(item)}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={`${item.name} in ${item.city}`}
            testID={testID ? `${testID}-salon-${item.id}` : undefined}
          >
            <View style={styles.rowImage} />
            <View style={styles.rowBody}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rowCity} numberOfLines={1}>
                {item.city}
              </Text>
              <View style={styles.ratingRow}>
                <RatingStars value={item.rating} size={16} />
                <Text style={styles.rowMeta}>({item.reviewCount})</Text>
              </View>
              <Text style={styles.rowMeta}>
                From ${item.priceFrom} · {item.nextAvailableLabel}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerWrap: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.pageVertical,
    paddingBottom: spacing.s2,
    gap: spacing.s2,
  },
  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
  },
  searchPlaceholder: { ...textStyles.body, color: colors.foreground },
  toolbar: { flexDirection: "row", gap: spacing.s2 },
  toolBtn: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
  },
  toolText: { ...textStyles.label, color: colors.foreground },
  clearWrap: { alignSelf: "flex-start", minHeight: spacing.touchTarget, justifyContent: "center" },
  clearText: { ...textStyles.label, color: colors.coralBlossom },
  summary: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s2,
  },
  list: { paddingHorizontal: spacing.pageHorizontal, paddingBottom: spacing.s12, gap: spacing.s3 },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
    gap: spacing.s3,
  },
  rowImage: {
    width: 96,
    height: 96,
    backgroundColor: colors.disabledBg,
    borderRadius: radius.md,
  },
  rowBody: { flex: 1, gap: spacing.s1 },
  rowName: { ...textStyles.heading4, color: colors.foreground },
  rowCity: { ...textStyles.bodySmall, color: colors.textMuted },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.s1 },
  rowMeta: { ...textStyles.bodySmall, color: colors.textMuted },
  empty: {
    paddingVertical: spacing.s12,
    alignItems: "center",
    gap: spacing.s2,
  },
  emptyTitle: { ...textStyles.heading3, color: colors.foreground },
  emptyBody: { ...textStyles.body, color: colors.textMuted },
});
