/**
 * DiscoverFiltersScreen.tsx — W22/W34 Stream B.
 *
 * Filter editor: rating, price, categories, distance, open-now toggle.
 */

import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import * as Location from "expo-location";

import { Button, colors, radius, spacing } from "../../shared/ui";

import type { DiscoveryCategory, DiscoveryFilters } from "./discoveryHelpers";

export type DiscoverFiltersScreenProps = {
  filters: DiscoveryFilters;
  categories: DiscoveryCategory[];
  onChange: (next: DiscoveryFilters) => void;
  onApply: () => void;
  onReset: () => void;
  testID?: string;
};

const PRICE_LEVELS: Array<{ value: 1 | 2 | 3; label: string }> = [
  { value: 1, label: "$" },
  { value: 2, label: "$$" },
  { value: 3, label: "$$$" },
];

const RATING_OPTIONS = [0, 3, 4, 4.5];

const DISTANCE_OPTIONS = [2, 5, 10, 25] as const;

export function DiscoverFiltersScreen({
  filters,
  categories,
  onChange,
  onApply,
  onReset,
  testID,
}: DiscoverFiltersScreenProps) {
  const [gpsGranted, setGpsGranted] = useState(false);
  useEffect(() => {
    if (Platform.OS === "web") return;
    void Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === "granted") {
        setGpsGranted(true);
      } else {
        void Location.requestForegroundPermissionsAsync().then((r) => {
          if (r.status === "granted") setGpsGranted(true);
        });
      }
    });
  }, []);

  function togglePrice(level: 1 | 2 | 3) {
    const next = filters.priceLevels.includes(level)
      ? filters.priceLevels.filter((p) => p !== level)
      : [...filters.priceLevels, level];
    onChange({ ...filters, priceLevels: next });
  }

  function toggleCategory(catId: string) {
    const next = filters.categoryIds.includes(catId)
      ? filters.categoryIds.filter((c) => c !== catId)
      : [...filters.categoryIds, catId];
    onChange({ ...filters, categoryIds: next });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID ?? "discover-filters"}
    >
      <Text style={styles.heading} accessibilityRole="header">
        Filters
      </Text>

      <Text style={styles.sectionLabel}>Rating</Text>
      <View style={styles.row}>
        {RATING_OPTIONS.map((rating) => {
          const selected = filters.minRating === rating;
          return (
            <Pressable
              key={rating}
              onPress={() => onChange({ ...filters, minRating: rating })}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={rating === 0 ? "Any rating" : `${rating} stars or higher`}
              testID={`discover-filters-rating-${rating}`}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {rating === 0 ? "Any" : `${rating}+ ★`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Price</Text>
      <View style={styles.row}>
        {PRICE_LEVELS.map((p) => {
          const selected = filters.priceLevels.includes(p.value);
          return (
            <Pressable
              key={p.value}
              onPress={() => togglePrice(p.value)}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`Price ${p.label}`}
              testID={`discover-filters-price-${p.value}`}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Categories</Text>
      <View style={styles.row}>
        {categories.map((cat) => {
          const selected = filters.categoryIds.includes(cat.id);
          return (
            <Pressable
              key={cat.id}
              onPress={() => toggleCategory(cat.id)}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={cat.label}
              testID={`discover-filters-category-${cat.id}`}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Distance</Text>
      {gpsGranted ? (
        <View style={styles.row}>
          {DISTANCE_OPTIONS.map((km) => {
            const selected = filters.maxDistanceMiles === km;
            return (
              <Pressable
                key={km}
                onPress={() => onChange({ ...filters, maxDistanceMiles: km })}
                style={[styles.chip, selected && styles.chipSelected]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Within ${km} miles`}
                testID={`discover-filters-distance-${km}`}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {km} mi
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.gpsHint}>Enable location access to filter by distance.</Text>
      )}

      <View style={styles.toggleRow}>
        <Text style={styles.sectionLabel}>Open now</Text>
        <Switch
          value={filters.openNow}
          onValueChange={(v) => onChange({ ...filters, openNow: v })}
          accessibilityLabel="Open now"
          testID="discover-filters-open-now"
        />
      </View>

      <View style={styles.footerRow}>
        <Button
          variant="secondary"
          label="Reset"
          onPress={onReset}
          testID="discover-filters-reset"
        />
        <View style={styles.applyWrap}>
          <Button label="Apply" onPress={onApply} fullWidth testID="discover-filters-apply" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  heading: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginTop: spacing.s2 },
  row: { flexDirection: "row", gap: spacing.s2, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.foreground, borderColor: colors.foreground },
  chipText: { fontSize: 13, color: colors.foreground },
  chipTextSelected: { color: colors.surface, fontWeight: "600" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.s2,
  },
  footerRow: { flexDirection: "row", gap: spacing.s2, marginTop: spacing.s4 },
  applyWrap: { flex: 1 },
  gpsHint: { fontSize: 13, color: colors.textMuted ?? "#9CA3AF", fontStyle: "italic" },
});
