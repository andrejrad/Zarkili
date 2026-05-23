/**
 * SearchHelpersScreen.tsx — J.8 Search Helpers (W30 Batch J).
 *
 * Consolidates three related search-assist surfaces:
 *
 *   SearchHelpersScreen  — main screen showing recents list + saved searches
 *                          with "Clear all" CTA and inline SearchSuggestionRow
 *                          items.
 *   SearchSortSheet      — ModalSheet for sort order selection.
 *
 * States: recents-populated, saved-populated, empty (no-results), typing.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Button,
  ModalSheet,
  SearchSuggestionRow,
  colors,
  spacing,
} from "../../shared/ui";

export type SavedSearch = {
  id: string;
  label: string;
};

export type SearchHelperState = "default" | "typing" | "no-results";

export type SearchHelpersScreenProps = {
  recentSearches: string[];
  savedSearches: SavedSearch[];
  /** Suggestions shown when state === "typing". */
  suggestions?: string[];
  /** Prefix typed so far — used to highlight match in suggestion rows. */
  query?: string;
  state?: SearchHelperState;
  onSelectRecent: (label: string) => void;
  onSelectSaved: (saved: SavedSearch) => void;
  onSelectSuggestion: (label: string) => void;
  onRemoveRecent: (label: string) => void;
  onRemoveSaved: (id: string) => void;
  onClearAllRecents: () => void;
  onExpandSearch?: () => void;
  testID?: string;
};

export function SearchHelpersScreen({
  recentSearches,
  savedSearches,
  suggestions = [],
  query = "",
  state = "default",
  onSelectRecent,
  onSelectSaved,
  onSelectSuggestion,
  onRemoveRecent,
  onRemoveSaved,
  onClearAllRecents,
  onExpandSearch,
  testID,
}: SearchHelpersScreenProps) {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      testID={testID}
    >
      {/* Typing / suggestions state */}
      {state === "typing" && suggestions.length > 0 && (
        <View style={styles.section} testID={testID ? `${testID}-suggestions` : undefined}>
          {suggestions.map((s) => (
            <SearchSuggestionRow
              key={s}
              type="suggested"
              label={s}
              highlight={query}
              onPress={() => onSelectSuggestion(s)}
              testID={testID ? `${testID}-sugg-${s}` : undefined}
            />
          ))}
        </View>
      )}

      {/* No-results state */}
      {state === "no-results" && (
        <View style={styles.noResults} testID={testID ? `${testID}-no-results` : undefined}>
          <Text style={styles.noResultsText}>{`No results found for "${query}"`}</Text>
          {onExpandSearch && (
            <Button
              label="Expand search"
              variant="secondary"
              onPress={onExpandSearch}
              testID={testID ? `${testID}-expand` : undefined}
            />
          )}
        </View>
      )}

      {/* Recents */}
      {state === "default" && recentSearches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent searches</Text>
            <Pressable
              onPress={onClearAllRecents}
              hitSlop={8}
              accessibilityRole="button"
              testID={testID ? `${testID}-clear-all` : undefined}
            >
              <Text style={styles.clearAll}>Clear all</Text>
            </Pressable>
          </View>
          {recentSearches.map((r) => (
            <SearchSuggestionRow
              key={r}
              type="recent"
              label={r}
              onPress={() => onSelectRecent(r)}
              onRemove={() => onRemoveRecent(r)}
              testID={testID ? `${testID}-recent-${r}` : undefined}
            />
          ))}
        </View>
      )}

      {/* Saved searches */}
      {state === "default" && savedSearches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved searches</Text>
          {savedSearches.map((s) => (
            <SearchSuggestionRow
              key={s.id}
              type="saved"
              label={s.label}
              onPress={() => onSelectSaved(s)}
              onRemove={() => onRemoveSaved(s.id)}
              testID={testID ? `${testID}-saved-${s.id}` : undefined}
            />
          ))}
        </View>
      )}

      {state === "default" &&
        recentSearches.length === 0 &&
        savedSearches.length === 0 && (
          <View style={styles.empty} testID={testID ? `${testID}-empty` : undefined}>
            <Text style={styles.emptyText}>Start typing to search for salons.</Text>
          </View>
        )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sort Sheet
// ---------------------------------------------------------------------------

export type SortOption = "recommended" | "distance" | "rating" | "price-asc";

export const SORT_LABELS: Record<SortOption, string> = {
  recommended: "Recommended",
  distance:    "Nearest first",
  rating:      "Highest rated",
  "price-asc": "Price: Low to High",
};

export type SearchSortSheetProps = {
  visible: boolean;
  selected: SortOption;
  onSelect: (option: SortOption) => void;
  onClose: () => void;
  testID?: string;
};

export function SearchSortSheet({
  visible,
  selected,
  onSelect,
  onClose,
  testID,
}: SearchSortSheetProps) {
  return (
    <ModalSheet visible={visible} onClose={onClose} title="Sort by" testID={testID}>
      <View style={styles.sortBody}>
        {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
          <Pressable
            key={opt}
            style={[styles.sortRow, selected === opt && styles.sortRowSelected]}
            onPress={() => onSelect(opt)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === opt }}
            testID={testID ? `${testID}-sort-${opt}` : undefined}
          >
            <Text
              style={[
                styles.sortLabel,
                selected === opt && styles.sortLabelSelected,
              ]}
            >
              {SORT_LABELS[opt]}
            </Text>
            {selected === opt && <Text style={styles.sortCheck}>✓</Text>}
          </Pressable>
        ))}
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingVertical: spacing.s3,
    gap: spacing.s4,
  },
  section: {
    gap: spacing.s1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s2,
  },
  clearAll: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
  },
  noResults: {
    padding: spacing.pageHorizontal,
    gap: spacing.s3,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
  },
  empty: {
    padding: spacing.pageHorizontal,
    alignItems: "center",
    paddingTop: spacing.s10,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
  },
  sortBody: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s4,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.s4,
    borderBottomWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
  },
  sortRowSelected: {
    backgroundColor: colors.primary10,
    marginHorizontal: -spacing.pageHorizontal,
    paddingHorizontal: spacing.pageHorizontal,
  },
  sortLabel: {
    fontSize: 16,
    color: colors.foreground,
  },
  sortLabelSelected: {
    fontWeight: "600",
    color: colors.primary,
  },
  sortCheck: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "700",
  },
});
