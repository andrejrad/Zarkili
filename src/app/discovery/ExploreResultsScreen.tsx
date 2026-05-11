/**
 * ExploreResultsScreen.tsx — W22/W34 Stream B.
 *
 * Search results list. Shows query, applied filter summary, and salon results.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, RatingStars, colors, radius, spacing } from "../../shared/ui";

import type { DiscoveryFilters, FeaturedSalon } from "./discoveryHelpers";

export type ExploreResultsScreenProps = {
  query: string;
  results: FeaturedSalon[];
  filters: DiscoveryFilters;
  onSelectSalon: (salonId: string) => void;
  onChangeFilters: () => void;
  onOpenMap?: () => void;
  testID?: string;
};

function summarizeFilters(filters: DiscoveryFilters): string {
  const parts: string[] = [];
  if (filters.minRating > 0) parts.push(`${filters.minRating}+ ★`);
  if (filters.priceLevels.length > 0) parts.push(`${filters.priceLevels.length} price tiers`);
  if (filters.categoryIds.length > 0) parts.push(`${filters.categoryIds.length} categories`);
  if (filters.openNow) parts.push("Open now");
  return parts.length === 0 ? "No filters" : parts.join(" • ");
}

export function ExploreResultsScreen({
  query,
  results,
  filters,
  onSelectSalon,
  onChangeFilters,
  onOpenMap,
  testID,
}: ExploreResultsScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID ?? "explore-results"}
    >
      <Text style={styles.heading} accessibilityRole="header">
        {query.length > 0 ? `Results for "${query}"` : "Explore"}
      </Text>

      <View style={styles.actionRow}>
        <Button
          variant="secondary"
          size="small"
          label="Filters"
          onPress={onChangeFilters}
          testID="explore-results-filters-cta"
        />
        {onOpenMap ? (
          <Button
            variant="secondary"
            size="small"
            label="Map"
            onPress={onOpenMap}
            testID="explore-results-map-cta"
          />
        ) : null}
      </View>

      <Text style={styles.filterSummary} testID="explore-results-filter-summary">
        {summarizeFilters(filters)}
      </Text>

      <View style={styles.resultList}>
        {results.length === 0 ? (
          <Text style={styles.empty} testID="explore-results-empty">
            No salons match your filters.
          </Text>
        ) : (
          results.map((salon) => (
            <Pressable
              key={salon.id}
              onPress={() => onSelectSalon(salon.id)}
              style={styles.resultCard}
              accessibilityRole="button"
              accessibilityLabel={`Open ${salon.name}`}
              testID={`explore-results-salon-${salon.id}`}
            >
              <Text style={styles.salonName}>{salon.name}</Text>
              <Text style={styles.salonCity}>{salon.city}</Text>
              <View style={styles.ratingRow}>
                <RatingStars value={salon.rating} size={16} />
                <Text style={styles.reviewCount}>({salon.reviewCount})</Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  heading: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  actionRow: { flexDirection: "row", gap: spacing.s2 },
  filterSummary: { fontSize: 13, color: colors.textMuted },
  resultList: { gap: spacing.s3 },
  empty: { fontSize: 14, color: colors.textMuted, textAlign: "center", paddingVertical: spacing.s4 },
  resultCard: {
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
