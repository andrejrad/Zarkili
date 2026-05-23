/**
 * FilterSheetScreen.tsx — Phase 5.5 Filter Sheet (full spec).
 *
 * Filters: Price range (dual-handle), Availability (Today/This week/Any time),
 * Minimum rating (star icons), Distance (1-25 km, GPS-gated).
 *
 * Filters apply live via onChangeFilters.
 * The sheet dismisses on swipe-down or tap-outside (no confirm button).
 */

import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
  ServiceTypeCard,
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
} from "./discoveryFilters";

export type FilterSheetScreenProps = {
  visible: boolean;
  initialFilters: DiscoveryFilters;
  services: ServiceTypeCard[];
  onClose: () => void;
  /** Called on every filter change so results update live behind the sheet. */
  onChangeFilters?: (filters: DiscoveryFilters) => void;
  /** p95 local price (pence) — upper bound of price slider. Defaults to 50000 (£500). */
  p95Price?: number;
  /** Whether GPS is granted — enables distance dimension. */
  gpsGranted?: boolean;
  /** Controlled live service count to show below price slider. null = hide. */
  serviceCount?: number | null;
  testID?: string;
};

const AVAILABILITY: { id: AvailabilityWindow; label: string }[] = [
  { id: "any", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "this-week", label: "This week" },
];

const RATING_STEPS = [1, 2, 3, 4, 5] as const;

const MIN_DISTANCE_KM = 1;
const MAX_DISTANCE_KM = 25;

export function FilterSheetScreen({
  visible,
  initialFilters,
  services,
  onClose,
  onChangeFilters,
  p95Price = 50000,
  gpsGranted = false,
  serviceCount,
  testID,
}: FilterSheetScreenProps) {
  const [draft, setDraft] = useState<DiscoveryFilters>(initialFilters);

  // Only reset draft when the sheet opens (visible transitions to true).
  // Do NOT include initialFilters in deps: during a drag, onChangeFilters
  // updates the parent on every frame → parent re-renders → new initialFilters
  // reference → useEffect fires → setDraft → re-render → loop at 60fps.
  // The sheet's own draft is the single source of truth while it is visible.
  const prevVisible = useRef(false);
  useEffect(() => {
    if (visible && !prevVisible.current) {
      setDraft(initialFilters);
    }
    prevVisible.current = visible;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function updateDraft(next: DiscoveryFilters) {
    setDraft(next);
    onChangeFilters?.(next);
  }

  // Legacy: live count from services prop if serviceCount not provided
  const liveCount =
    serviceCount != null
      ? serviceCount
      : applyDiscoveryFilters(services, draft).length;

  const countLabel =
    liveCount === 1 ? "1 service in this range" : `${liveCount} services in this range`;

  return (
    <FilterSheet
      visible={visible}
      onClose={onClose}
      onReset={() => updateDraft({ ...DEFAULT_FILTERS })}
      title="Filters"
      testID={testID}
    >
      {/* Price range */}
      <Section title="Price">
        <RangeSlider
          range={draft.priceRange}
          minValue={0}
          maxValue={p95Price}
          step={100}
          onChange={(next: [number, number]) =>
            updateDraft({ ...draft, priceRange: next })
          }
          formatValue={(v) => `£${(v / 100).toFixed(0)}`}
          testID={testID ? `${testID}-price` : undefined}
        />
        {liveCount >= 0 ? (
          <Text
            style={styles.countLabel}
            testID={testID ? `${testID}-count` : undefined}
          >
            {countLabel}
          </Text>
        ) : null}
      </Section>

      {/* Availability */}
      <Section title="Availability">
        <View style={styles.pillRow}>
          {AVAILABILITY.map((a) => {
            const selected = draft.availability === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => updateDraft({ ...draft, availability: a.id })}
                style={[styles.pill, selected && styles.pillActive]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={a.label}
                testID={testID ? `${testID}-avail-${a.id}` : undefined}
              >
                <Text
                  style={[styles.pillText, selected && styles.pillTextActive]}
                  numberOfLines={1}
                >
                  {a.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      {/* Minimum rating */}
      <Section title="Minimum rating">
        <View
          style={styles.starsRow}
          accessibilityRole="radiogroup"
          testID={testID ? `${testID}-rating` : undefined}
        >
          <Pressable
            onPress={() => updateDraft({ ...draft, minRating: 0 })}
            style={[styles.pill, draft.minRating === 0 && styles.pillActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: draft.minRating === 0 }}
            accessibilityLabel="Any rating"
            testID={testID ? `${testID}-rating-any` : undefined}
          >
            <Text
              style={[
                styles.pillText,
                draft.minRating === 0 && styles.pillTextActive,
              ]}
            >
              Any
            </Text>
          </Pressable>
          {RATING_STEPS.map((r) => {
            const selected = draft.minRating === r;
            return (
              <Pressable
                key={r}
                onPress={() => updateDraft({ ...draft, minRating: r })}
                style={[styles.starBtn, selected && styles.starBtnActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${r} star minimum`}
                testID={testID ? `${testID}-rating-${r}` : undefined}
              >
                <RatingStars value={r} size={20} />
              </Pressable>
            );
          })}
        </View>
      </Section>

      {/* Distance — GPS-gated */}
      {gpsGranted ? (
        <Section title="Distance">
          <RangeSlider
            value={draft.distanceKm}
            minValue={MIN_DISTANCE_KM}
            maxValue={MAX_DISTANCE_KM}
            step={1}
            onChange={(v: number) =>
              updateDraft({ ...draft, distanceKm: v })
            }
            formatValue={(v) => `${v} km`}
            testID={testID ? `${testID}-distance` : undefined}
          />
        </Section>
      ) : (
        <Section title="Distance">
          <Text style={styles.gpsHint}>
            Enable location access to filter by distance.
          </Text>
        </Section>
      )}
    </FilterSheet>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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
  starsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2, alignItems: "center" },
  pill: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  pillActive: {
    backgroundColor: colors.coralBlossom,
    borderColor: colors.coralBlossom,
  },
  pillText: { ...textStyles.label, color: colors.foreground, flexShrink: 0 },
  pillTextActive: { color: colors.white },
  starBtn: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
  },
  starBtnActive: {
    backgroundColor: colors.primary10,
    borderColor: colors.primary,
  },
  countLabel: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.s1,
  },
  gpsHint: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  distanceDefault: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.s1,
  },
});

