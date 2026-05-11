/**
 * FilterSheetScreen.tsx — B.4 Filter Sheet.
 *
 * Modal-style filter sheet composing FilterSheet + RangeSlider +
 * RatingStars + category/availability pills + member-only toggle.
 * Live result count in the apply button uses `applyDiscoveryFilters`.
 */

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import type {
  DiscoveryCategoryId,
  DiscoverySalonCard,
} from "../../domains/discovery";
import {
  FilterSheet,
  RangeSlider,
  RatingStars,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import {
  DEFAULT_FILTERS,
  applyDiscoveryFilters,
  type AvailabilityWindow,
  type DiscoveryFilters,
  type DiscoverySortKey,
} from "./discoveryFilters";

export type FilterSheetScreenProps = {
  visible: boolean;
  initialFilters: DiscoveryFilters;
  salons: DiscoverySalonCard[];
  onClose: () => void;
  onApply: (filters: DiscoveryFilters) => void;
  testID?: string;
};

const CATEGORIES: { id: DiscoveryCategoryId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "nails", label: "Nails" },
  { id: "hair", label: "Hair" },
  { id: "skin", label: "Skin" },
  { id: "lashes", label: "Lashes" },
  { id: "brows", label: "Brows" },
  { id: "massage", label: "Massage" },
  { id: "makeup", label: "Makeup" },
  { id: "barber", label: "Barber" },
  { id: "waxing", label: "Waxing" },
  { id: "spa", label: "Spa" },
  { id: "injectables", label: "Injectables" },
  { id: "wellness", label: "Wellness" },
];

const AVAILABILITY: { id: AvailabilityWindow; label: string }[] = [
  { id: "any", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "this-week", label: "This week" },
];

const SORTS: { id: DiscoverySortKey; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "rating-desc", label: "Top rated" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

const RATING_OPTIONS: number[] = [0, 3, 4, 4.5];

export function FilterSheetScreen({
  visible,
  initialFilters,
  salons,
  onClose,
  onApply,
  testID,
}: FilterSheetScreenProps) {
  const [draft, setDraft] = useState<DiscoveryFilters>(initialFilters);

  useEffect(() => {
    if (visible) setDraft(initialFilters);
  }, [visible, initialFilters]);

  const previewCount = applyDiscoveryFilters(salons, draft).length;
  const applyLabel =
    previewCount === 1 ? "Show 1 result" : `Show ${previewCount} results`;

  return (
    <FilterSheet
      visible={visible}
      onClose={onClose}
      onReset={() => setDraft(DEFAULT_FILTERS)}
      applyLabel={applyLabel}
      onApply={() => onApply(draft)}
      testID={testID}
    >
      <Section title="Category">
        <View style={styles.pillRow}>
          {CATEGORIES.map((c) => {
            const selected = draft.category === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setDraft({ ...draft, category: c.id })}
                style={[styles.pill, selected && styles.pillActive]}
                accessibilityRole="button"
                accessibilityLabel={`${c.label} category`}
                accessibilityState={{ selected }}
                testID={testID ? `${testID}-cat-${c.id}` : undefined}
              >
                <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Price (USD, starts from)">
        <RangeSlider
          range={draft.priceRange}
          minValue={0}
          maxValue={500}
          step={10}
          onChange={(next: [number, number]) => setDraft({ ...draft, priceRange: next })}
          formatValue={(v) => `$${v}`}
          testID={testID ? `${testID}-price` : undefined}
        />
      </Section>

      <Section title="Minimum rating">
        <View style={styles.pillRow}>
          {RATING_OPTIONS.map((r) => {
            const selected = draft.minRating === r;
            return (
              <Pressable
                key={r}
                onPress={() => setDraft({ ...draft, minRating: r })}
                style={[styles.pill, selected && styles.pillActive]}
                accessibilityRole="button"
                accessibilityLabel={r === 0 ? "Any rating" : `${r} stars and up`}
                accessibilityState={{ selected }}
                testID={testID ? `${testID}-rating-${r}` : undefined}
              >
                {r === 0 ? (
                  <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                    Any
                  </Text>
                ) : (
                  <View style={styles.ratingPillBody}>
                    <RatingStars value={r} size={16} />
                    <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                      {r}+
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Availability">
        <View style={styles.pillRow}>
          {AVAILABILITY.map((a) => {
            const selected = draft.availability === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => setDraft({ ...draft, availability: a.id })}
                style={[styles.pill, selected && styles.pillActive]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={a.label}
                testID={testID ? `${testID}-avail-${a.id}` : undefined}
              >
                <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                  {a.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Sort">
        <View style={styles.pillRow}>
          {SORTS.map((s) => {
            const selected = draft.sort === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setDraft({ ...draft, sort: s.id })}
                style={[styles.pill, selected && styles.pillActive]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={s.label}
                testID={testID ? `${testID}-sort-${s.id}` : undefined}
              >
                <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Members only</Text>
        <Switch
          value={draft.memberOnly}
          onValueChange={(v) => setDraft({ ...draft, memberOnly: v })}
          accessibilityLabel="Members only"
          testID={testID ? `${testID}-member-toggle` : undefined}
        />
      </View>
    </FilterSheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.s2 },
  sectionTitle: { ...textStyles.heading4, color: colors.foreground },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  pill: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.coralBlossom,
    borderColor: colors.coralBlossom,
  },
  pillText: { ...textStyles.label, color: colors.foreground },
  pillTextActive: { color: colors.white },
  ratingPillBody: { flexDirection: "row", alignItems: "center", gap: spacing.s1 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.s2,
  },
  toggleLabel: { ...textStyles.bodyLarge, color: colors.foreground },
});
