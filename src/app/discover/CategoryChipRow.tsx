/**
 * CategoryChipRow — horizontal single-select category filter row.
 *
 * "All" is always leftmost, default, and always visible.
 * Categories with zero active services in the user's area should be filtered
 * out by the caller before passing the `categories` prop.
 *
 * Active style: background #FBEAF0, border 0.5px solid #F4C0D1, color #993556.
 * Accessibility: role="radiogroup", each chip role="radio".
 */

import { useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { DiscoveryCategory } from "../../domains/discovery";
import { colors, radius, spacing, textStyles } from "../../shared/ui";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  nails: "Nails",
  hair: "Hair",
  skin: "Skin",
  lashes: "Lashes",
  brows: "Brows",
  massage: "Massage",
  makeup: "Makeup",
  barber: "Barber",
  waxing: "Waxing",
  spa: "Spa",
  injectables: "Injectables",
  wellness: "Wellness",
};

export type CategoryChipRowProps = {
  categories: DiscoveryCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
  testID?: string;
};

export function CategoryChipRow({
  categories,
  selectedId,
  onSelect,
  testID,
}: CategoryChipRowProps) {
  const scrollRef = useRef<ScrollView>(null);

  // "All" always at front; de-dupe if already present in categories
  const items: DiscoveryCategory[] = [
    { id: "all" },
    ...categories.filter((c) => c.id !== "all"),
  ];

  return (
    <View
      accessibilityRole="radiogroup"
      testID={testID}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((cat) => {
          const isActive = cat.id === selectedId;
          const label = CATEGORY_LABELS[cat.id] ?? cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={label}
              onPress={() => {
                if (!isActive) onSelect(cat.id);
              }}
              style={[styles.chip, isActive && styles.chipActive]}
              testID={testID ? `${testID}-${cat.id}` : undefined}
            >
              <Text
                style={[styles.chipLabel, isActive && styles.chipLabelActive]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s2,
    gap: spacing.s2,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: "#FBEAF0",
    borderColor: "#F4C0D1",
  },
  chipLabel: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  chipLabelActive: {
    color: "#993556",
    fontWeight: "600",
  },
});
