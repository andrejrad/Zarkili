/**
 * SortSheetScreen — Phase 5.6
 *
 * Single-select sort options. Applies on selection; sheet dismisses immediately.
 * 4 options: Recommended / Nearest / Price: low to high / Rating
 */

import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, textStyles } from "../../shared/ui";

import type { DiscoverySortKey } from "./discoveryFilters";

const SORT_OPTIONS: { id: DiscoverySortKey; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "nearest", label: "Nearest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "rating-desc", label: "Rating" },
];

export type SortSheetScreenProps = {
  visible: boolean;
  currentSort: DiscoverySortKey;
  onSelect: (sort: DiscoverySortKey) => void;
  onClose: () => void;
  testID?: string;
};

export function SortSheetScreen({
  visible,
  currentSort,
  onSelect,
  onClose,
  testID,
}: SortSheetScreenProps) {
  function handleSelect(id: DiscoverySortKey) {
    onSelect(id);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityLabel="Close sort options"
          accessibilityRole="button"
          testID={testID ? `${testID}-scrim` : undefined}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Sort by</Text>
          <View
            style={styles.options}
            accessibilityRole="radiogroup"
          >
            {SORT_OPTIONS.map((opt) => {
              const selected = currentSort === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={styles.optionRow}
                  onPress={() => handleSelect(opt.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={opt.label}
                  testID={testID ? `${testID}-${opt.id}` : undefined}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      selected && styles.optionLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {selected ? (
                    <Text
                      style={styles.checkmark}
                      accessibilityElementsHidden
                    >
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function sortLabel(sort: DiscoverySortKey): string {
  return SORT_OPTIONS.find((o) => o.id === sort)?.label ?? "Recommended";
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black50,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.s8,
    paddingHorizontal: spacing.pageHorizontal,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    alignSelf: "center",
    marginTop: spacing.s2,
    marginBottom: spacing.s4,
  },
  title: {
    ...textStyles.heading3,
    color: colors.foreground,
    marginBottom: spacing.s4,
  },
  options: {
    gap: 0,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.s4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: spacing.touchTarget,
  },
  optionLabel: {
    ...textStyles.bodyLarge,
    color: colors.foreground,
  },
  optionLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
  },
});
