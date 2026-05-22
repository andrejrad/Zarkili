/**
 * ExploreSearchResultsScreen.tsx — Phase 5.8 Explore feed (full rewrite).
 *
 * Structure:
 *   1. Header: "Explore" + map-pin toggle
 *   2. Search bar with live suggestions
 *   3. Category chip row
 *   4. Results bar: "[n] services near [city]" + sort label + Filters badge
 *   5. FlatList of ServiceTypeCard with infinite scroll + skeleton loading
 */

import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type {
  DiscoveryCategory,
  SearchSuggestion,
  ServiceTypeCard as ServiceTypeCardData,
} from "../../domains/discovery";
import { colors, radius, spacing, textStyles } from "../../shared/ui";

import { CategoryChipRow } from "./CategoryChipRow";
import {
  DEFAULT_FILTERS,
  countFilterBadge,
  type DiscoveryFilters,
} from "./discoveryFilters";
import { FilterSheetScreen } from "./FilterSheetScreen";
import { LocationChangeSheetScreen, type LocationChangeResult } from "./LocationChangeSheetScreen";
import { ServiceTypeCard } from "./ServiceTypeCard";
import { SortSheetScreen, sortLabel as getSortLabel } from "./SortSheetScreen";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ExploreSearchResultsScreenProps = {
  /** Phase 5: new service-card result set */
  services?: ServiceTypeCardData[];
  /** Loading first page / next page */
  isLoading?: boolean;
  /** True when there are more pages to fetch */
  hasMore?: boolean;
  onLoadMore?: () => void;
  categories?: DiscoveryCategory[];
  filters: DiscoveryFilters;
  onChangeFilters: (next: DiscoveryFilters) => void;
  locationLabel?: string;
  totalCount?: number;
  /** p95 price for filter badge count */
  p95Price?: number;
  gpsGranted?: boolean;
  gpsPermissionDenied?: boolean;
  currentLocationLabel?: string;
  isLoggedIn?: boolean;
  onPressService?: (card: ServiceTypeCardData) => void;
  onBookService?: (card: ServiceTypeCardData) => void;
  onJoinWaitlist?: (card: ServiceTypeCardData) => void;
  onCallToBook?: (card: ServiceTypeCardData) => void;
  onToggleSave?: (card: ServiceTypeCardData, next: boolean) => void;
  onLocationChange?: (result: LocationChangeResult) => void;
  onToggleMap?: () => void;
  onEmailCaptureCta?: (email: string) => void;
  /** Search suggestions to show below the search bar */
  suggestions?: SearchSuggestion[];
  onSearchQueryChange?: (q: string) => void;

  testID?: string;
};

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <View style={skelStyles.card}>
      <View style={skelStyles.photo} />
      <View style={skelStyles.body}>
        <View style={skelStyles.line} />
        <View style={[skelStyles.line, skelStyles.lineShort]} />
        <View style={[skelStyles.line, skelStyles.lineXShort]} />
      </View>
    </View>
  );
}

const skelStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginHorizontal: spacing.pageHorizontal,
    marginBottom: spacing.s4,
  },
  photo: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceMuted,
  },
  body: { padding: spacing.s4, gap: spacing.s2 },
  line: {
    height: 14,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    width: "80%",
  },
  lineShort: { width: "55%" },
  lineXShort: { width: "35%" },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ExploreSearchResultsScreen({
  services = [],
  isLoading = false,
  hasMore = false,
  onLoadMore,
  categories = [],
  filters,
  onChangeFilters,
  locationLabel = "your area",
  totalCount,
  p95Price = 50000,
  gpsGranted = false,
  gpsPermissionDenied = false,
  currentLocationLabel,
  isLoggedIn = false,
  onPressService,
  onBookService,
  onJoinWaitlist,
  onCallToBook,
  onToggleSave,
  onLocationChange,
  onToggleMap,
  suggestions = [],
  onSearchQueryChange,
  testID,
}: ExploreSearchResultsScreenProps) {
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.query);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const badgeCount = countFilterBadge(filters, p95Price, gpsGranted);
  const displayCount = totalCount ?? services.length;
  const currentSortLabel = getSortLabel(filters.sort);

  function handleQueryChange(q: string) {
    setSearchQuery(q);
    onSearchQueryChange?.(q);
    if (q.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }

  function handleClearSearch() {
    setSearchQuery("");
    onSearchQueryChange?.("");
    setShowSuggestions(false);
    onChangeFilters({ ...filters, query: "" });
    inputRef.current?.blur();
  }

  function handleSubmitSearch() {
    setShowSuggestions(false);
    onChangeFilters({ ...filters, query: searchQuery });
  }

  const renderItem = useCallback(
    ({ item }: { item: ServiceTypeCardData }) => (
      <ServiceTypeCard
        card={item}
        isLoggedIn={isLoggedIn}
        onPress={onPressService}
        onBook={onBookService}
        onJoinWaitlist={onJoinWaitlist}
        onCallToBook={onCallToBook}
        onToggleSave={onToggleSave}
        onCategoryPress={(catId) =>
          onChangeFilters({ ...filters, category: catId as import("../../domains/discovery").DiscoveryCategoryId })
        }
        testID={testID ? `${testID}-service-${item.id}` : undefined}
      />
    ),
    [
      isLoggedIn,
      onPressService,
      onBookService,
      onJoinWaitlist,
      onCallToBook,
      onToggleSave,
      filters,
      onChangeFilters,
      testID,
    ]
  );

  // Empty state selection
  const isEmpty = !isLoading && services.length === 0;
  const hasActiveQuery = searchQuery.trim().length > 0;
  const hasActiveFilters =
    filters.category !== "all" ||
    filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] ||
    filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1] ||
    filters.minRating !== DEFAULT_FILTERS.minRating ||
    filters.availability !== "any";

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Pressable
          onPress={onToggleMap}
          accessibilityRole="button"
          accessibilityLabel="Map view"
          testID={testID ? `${testID}-map-toggle` : undefined}
          hitSlop={8}
        >
          <Text style={styles.mapIcon}>📍</Text>
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search services, salons…"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleQueryChange}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
            accessibilityLabel="Search services or salons"
            testID={testID ? `${testID}-search` : undefined}
          />
          {searchQuery.length > 0 ? (
            <Pressable
              onPress={handleClearSearch}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Search suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 ? (
        <View
          style={styles.suggestionsBox}
          testID={testID ? `${testID}-suggestions` : undefined}
        >
          {suggestions.map((s) => (
            <Pressable
              key={`${s.type}-${s.id}`}
              style={styles.suggestionRow}
              onPress={() => {
                setSearchQuery(s.label);
                setShowSuggestions(false);
                onChangeFilters({ ...filters, query: s.label });
              }}
              accessibilityRole="button"
              accessibilityLabel={s.label}
            >
              <Text style={styles.suggestionIcon}>
                {s.type === "service" ? "✦" : s.type === "location" ? "🏢" : "🏷"}
              </Text>
              <View style={styles.suggestionTextBlock}>
                <Text style={styles.suggestionLabel}>{s.label}</Text>
                {s.sublabel ? (
                  <Text style={styles.suggestionSublabel}>{s.sublabel}</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Category chip row */}
      <CategoryChipRow
        categories={categories}
        selectedId={filters.category}
        onSelect={(id) =>
          onChangeFilters({
            ...filters,
            category: id as import("../../domains/discovery").DiscoveryCategoryId,
          })
        }
        testID={testID ? `${testID}-categories` : undefined}
      />

      {/* Results bar */}
      <View style={styles.resultsBar}>
        <Pressable
          onPress={() => setLocationSheetVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Services near ${locationLabel}. Change location.`}
          testID={testID ? `${testID}-location-btn` : undefined}
        >
          <Text style={styles.resultsCount} testID={testID ? `${testID}-summary` : undefined}>
            {displayCount === 1
              ? `1 service near ${locationLabel}`
              : `${displayCount} services near ${locationLabel}`}
          </Text>
        </Pressable>
        <View style={styles.resultsRight}>
          <Pressable
            onPress={() => setSortSheetVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${currentSortLabel}`}
            testID={testID ? `${testID}-sort-btn` : undefined}
          >
            <Text style={styles.sortLabel}>{currentSortLabel} ▾</Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterSheetVisible(true)}
            style={[styles.filterBtn, badgeCount > 0 && styles.filterBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={
              badgeCount > 0 ? `Filters, ${badgeCount} active` : "Filters"
            }
            testID={testID ? `${testID}-filters` : undefined}
          >
            <Text
              style={[styles.filterBtnText, badgeCount > 0 && styles.filterBtnTextActive]}
            >
              {badgeCount > 0 ? `Filters ${badgeCount}` : "Filters"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* FlatList */}
      <FlatList
        data={services}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={hasMore ? onLoadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading ? (
            <View>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isEmpty ? (
            <View
              style={styles.empty}
              testID={testID ? `${testID}-empty` : undefined}
            >
              {hasActiveQuery ? (
                <>
                  <Text style={styles.emptyTitle}>
                    No results for "{searchQuery}"
                  </Text>
                  <Pressable
                    onPress={handleClearSearch}
                    style={styles.emptyChip}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                  >
                    <Text style={styles.emptyChipText}>Clear search</Text>
                  </Pressable>
                  <CategoryChipRow
                    categories={categories}
                    selectedId={filters.category}
                    onSelect={(id) =>
                      onChangeFilters({
                        ...filters,
                        category: id as import("../../domains/discovery").DiscoveryCategoryId,
                      })
                    }
                  />
                </>
              ) : hasActiveFilters ? (
                <>
                  <Text style={styles.emptyTitle}>
                    No services match these filters
                  </Text>
                  <Pressable
                    onPress={() => onChangeFilters({ ...DEFAULT_FILTERS })}
                    style={styles.emptyChip}
                    accessibilityRole="button"
                    accessibilityLabel="Clear all filters"
                    testID={testID ? `${testID}-clear` : undefined}
                  >
                    <Text style={styles.emptyChipText}>Clear all filters</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.emptyTitle}>
                  No services in your area yet
                </Text>
              )}
            </View>
          ) : null
        }
      />

      {/* Filter sheet */}
      <FilterSheetScreen
        visible={filterSheetVisible}
        initialFilters={filters}
        services={services ?? []}
        onClose={() => setFilterSheetVisible(false)}
        onChangeFilters={onChangeFilters}
        p95Price={p95Price}
        gpsGranted={gpsGranted}
        serviceCount={displayCount}
        testID={testID ? `${testID}-filter-sheet` : undefined}
      />

      {/* Sort sheet */}
      <SortSheetScreen
        visible={sortSheetVisible}
        currentSort={filters.sort}
        onSelect={(sort) => onChangeFilters({ ...filters, sort })}
        onClose={() => setSortSheetVisible(false)}
        testID={testID ? `${testID}-sort-sheet` : undefined}
      />

      {/* Location sheet */}
      <LocationChangeSheetScreen
        visible={locationSheetVisible}
        gpsGranted={gpsGranted}
        gpsPermissionDenied={gpsPermissionDenied}
        currentLocationLabel={currentLocationLabel}
        onSelectLocation={(result) => {
          onLocationChange?.(result);
        }}
        onClose={() => setLocationSheetVisible(false)}
        testID={testID ? `${testID}-location-sheet` : undefined}
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
    paddingTop: spacing.s6,
    paddingBottom: spacing.s2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "500",
    color: colors.foreground,
    lineHeight: 28,
  },
  mapIcon: { fontSize: 22 },
  searchWrap: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
    gap: spacing.s2,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.foreground,
  },
  clearIcon: { fontSize: 16, color: colors.textMuted },
  suggestionsBox: {
    marginHorizontal: spacing.pageHorizontal,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    zIndex: 100,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    gap: spacing.s3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: spacing.touchTarget,
  },
  suggestionIcon: { fontSize: 16, width: 24, textAlign: "center" },
  suggestionTextBlock: { flex: 1 },
  suggestionLabel: { ...textStyles.body, color: colors.foreground },
  suggestionSublabel: { ...textStyles.bodySmall, color: colors.textMuted },
  resultsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s2,
    gap: spacing.s2,
  },
  resultsCount: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    flex: 1,
  },
  resultsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
  },
  sortLabel: {
    ...textStyles.label,
    color: colors.foreground,
  },
  filterBtn: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterBtnActive: {
    backgroundColor: colors.primary10,
    borderColor: colors.primary,
  },
  filterBtnText: { ...textStyles.labelSmall, color: colors.foreground },
  filterBtnTextActive: { color: colors.primary },
  list: { paddingBottom: spacing.s12 },
  empty: {
    paddingVertical: spacing.s12,
    alignItems: "center",
    gap: spacing.s3,
    paddingHorizontal: spacing.pageHorizontal,
  },
  emptyTitle: { ...textStyles.heading3, color: colors.foreground, textAlign: "center" },
  emptyChip: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary10,
  },
  emptyChipText: { ...textStyles.label, color: colors.primary },
});
