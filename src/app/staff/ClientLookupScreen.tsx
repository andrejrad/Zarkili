/**
 * ClientLookupScreen.tsx — W27 Batch G screen G.4.1.
 *
 * Staff-facing client directory with live search, tier filter tabs,
 * and sort dropdown. Each row is a pressable client card navigating to G.4.2.
 *
 * States: default | loading (7 skeleton rows) | error | empty (no results)
 */

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SegmentedControl, colors, radius, spacing, textStyles } from "../../shared/ui";
import type { ClientRow } from "./staffHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientLookupSortKey = "recent" | "name" | "ltv" | "noShows";

export type ClientLookupScreenProps = {
  clients: ClientRow[];
  searchQuery: string;
  activeFilter: "all" | "vip" | "at-risk";
  sortKey: ClientLookupSortKey;
  isLoading?: boolean;
  isError?: boolean;
  onPressRetry?: () => void;
  onChangeSearch: (query: string) => void;
  onClearSearch?: () => void;
  onChangeFilter: (filter: "all" | "vip" | "at-risk") => void;
  onChangeSortKey: (key: ClientLookupSortKey) => void;
  onPressClient: (clientId: string) => void;
  testID?: string;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ClientLookupScreen({
  clients,
  searchQuery,
  activeFilter,
  sortKey,
  isLoading = false,
  isError = false,
  onPressRetry,
  onChangeSearch,
  onClearSearch,
  onChangeFilter,
  onChangeSortKey,
  onPressClient,
  testID,
}: ClientLookupScreenProps) {
  const filterOptions = [
    { value: "all" as const, label: "All" },
    { value: "vip" as const, label: "VIP" },
    { value: "at-risk" as const, label: "At risk" },
  ];

  const sortOptions: { key: ClientLookupSortKey; label: string }[] = [
    { key: "recent", label: "Recent visit" },
    { key: "name", label: "Name" },
    { key: "ltv", label: "LTV" },
    { key: "noShows", label: "No-shows" },
  ];

  return (
    <View style={styles.root} testID={testID}>
      {/* Sticky header — search + filter + sort */}
      <View style={styles.stickyHeader}>
        {/* Search bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onChangeSearch}
            placeholder="Search name, phone, email…"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Search clients"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable
              style={styles.clearBtn}
              onPress={onClearSearch}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Filter + sort row */}
        <View style={styles.filterSortRow}>
          <SegmentedControl
            options={filterOptions}
            value={activeFilter}
            onChange={onChangeFilter}
          />
          <SortButton
            sortOptions={sortOptions}
            sortKey={sortKey}
            onChangeSortKey={onChangeSortKey}
          />
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.listContent}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={[styles.shimmerBlock, styles.shimmerRow]} />
          ))}
        </View>
      ) : isError ? (
        <View style={[styles.centered, styles.listContent]}>
          <Text style={styles.errorTitle}>Couldn't load clients</Text>
          <Text style={styles.errorBody}>Check your connection and try again.</Text>
          {onPressRetry && (
            <Pressable style={styles.retryBtn} onPress={onPressRetry} accessibilityRole="button">
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          )}
        </View>
      ) : clients.length === 0 ? (
        <View style={[styles.centered, styles.listContent]}>
          <Text style={styles.emptyIcon}>🔍</Text>
          {searchQuery.length > 0 ? (
            <>
              <Text style={styles.emptyTitle}>No results for "{searchQuery}"</Text>
              <Pressable onPress={onClearSearch} accessibilityRole="button">
                <Text style={styles.clearSearchLink}>Clear search</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.emptyTitle}>No clients yet</Text>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {clients.map((client) => (
            <ClientRowCard
              key={client.id}
              client={client}
              onPress={() => onPressClient(client.id)}
            />
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ClientRowCard({
  client,
  onPress,
}: {
  client: ClientRow;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.clientCard, pressed && styles.clientCardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${client.name}, ${client.tier} tier${client.isVIP ? ", VIP" : ""}`}
    >
      {/* Avatar */}
      <View style={styles.clientAvatar}>
        <Text style={styles.clientInitials}>{client.initials}</Text>
        {client.isVIP && <View style={styles.vipDot} accessibilityElementsHidden />}
      </View>

      {/* Main text */}
      <View style={styles.clientInfo}>
        <Text style={styles.clientName} numberOfLines={1}>{client.name}</Text>
        <Text style={styles.clientMeta}>
          {client.lastVisit ? `Last visit: ${client.lastVisit}` : "No visits yet"}
          {client.noShows > 0 && (
            <Text style={styles.noShowWarning}>  ·  {client.noShows} no-show{client.noShows !== 1 ? "s" : ""}</Text>
          )}
        </Text>
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function SortButton({
  sortOptions,
  sortKey,
  onChangeSortKey,
}: {
  sortOptions: { key: ClientLookupSortKey; label: string }[];
  sortKey: ClientLookupSortKey;
  onChangeSortKey: (key: ClientLookupSortKey) => void;
}) {
  const current = sortOptions.find((o) => o.key === sortKey);
  const nextIdx = (sortOptions.findIndex((o) => o.key === sortKey) + 1) % sortOptions.length;

  return (
    <Pressable
      style={({ pressed }) => [styles.sortBtn, pressed && styles.sortBtnPressed]}
      onPress={() => onChangeSortKey(sortOptions[nextIdx].key)}
      accessibilityRole="button"
      accessibilityLabel={`Sort by ${current?.label ?? ""}. Tap to change`}
    >
      <Text style={styles.sortBtnText}>{current?.label ?? "Sort"} ↕</Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: spacing.pageHorizontal,
  },

  // Sticky header
  stickyHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.s2,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.s3,
    height: spacing.touchTarget,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: "#1A1A1A",
    fontSize: 14,
    lineHeight: 20,
  },
  clearBtn: {
    paddingLeft: spacing.s2,
  },
  clearBtnText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  filterSortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.s2,
  },
  sortBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  sortBtnPressed: {
    opacity: 0.8,
  },
  sortBtnText: {
    ...textStyles.labelSmall,
    color: "#1A1A1A",
  },

  // List
  listContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s3,
  },

  // Client row card
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: spacing.s3,
    marginBottom: spacing.elementGapSmall,
    gap: spacing.s3,
  },
  clientCardPressed: {
    backgroundColor: colors.hover,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  clientInitials: {
    ...textStyles.label,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
  },
  vipDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: "#F59E0B",
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  clientInfo: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    ...textStyles.body,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  clientMeta: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  noShowWarning: {
    color: colors.warning,
  },
  chevron: {
    fontSize: 18,
    color: colors.textMuted,
  },

  // Empty / error
  emptyIcon: {
    fontSize: 36,
    marginBottom: spacing.s3,
  },
  emptyTitle: {
    ...textStyles.heading3,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: spacing.elementGapSmall,
  },
  clearSearchLink: {
    ...textStyles.label,
    color: colors.primary,
    marginTop: spacing.s2,
  },
  errorTitle: {
    ...textStyles.heading3,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: spacing.elementGapSmall,
  },
  errorBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sectionGap,
  },
  retryBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  retryBtnText: {
    ...textStyles.label,
    fontWeight: "600",
    color: colors.white,
  },

  // Shimmer
  shimmerBlock: {
    backgroundColor: "#EDE8D8",
    borderRadius: radius.md,
  },
  shimmerRow: {
    height: 64,
    marginBottom: spacing.elementGapSmall,
  },

  bottomSpacer: {
    height: spacing.s8,
  },
});
