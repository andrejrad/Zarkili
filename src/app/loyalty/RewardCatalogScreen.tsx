/**
 * RewardCatalogScreen.tsx — E.2 Reward Catalog.
 *
 * Header with title + points balance pill. Filter chips. 2-col grid of RewardCards.
 * Sticky bottom sort button. States: default | loading | empty | error.
 */

import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  RewardCard,
  StickyCtaBar,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import {
  REWARD_FILTER_TABS,
  filterRewards,
  formatPoints,
  sortRewards,
  type Reward,
  type RewardFilterTab,
  type RewardSortOption,
} from "./loyaltyHelpers";

export type RewardCatalogScreenProps = {
  userPoints: number;
  rewards: readonly Reward[];
  activeTab: RewardFilterTab;
  sortOption: RewardSortOption;
  loading?: boolean;
  error?: string;
  onTabChange: (tab: RewardFilterTab) => void;
  onSortPress: () => void;
  onRewardPress: (reward: Reward) => void;
  onPressBack?: () => void;
  onRetry?: () => void;
  testID?: string;
};

export function RewardCatalogScreen({
  userPoints,
  rewards,
  activeTab,
  sortOption,
  loading,
  error,
  onTabChange,
  onSortPress,
  onRewardPress,
  onPressBack,
  onRetry,
  testID,
}: RewardCatalogScreenProps) {
  const visible = sortRewards(filterRewards(rewards, activeTab, userPoints), sortOption);
  const sortLabel =
    sortOption === "lowest-points"
      ? "Lowest points"
      : sortOption === "highest-points"
      ? "Highest points"
      : "Newest";

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        {onPressBack ? (
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}
          >
            <Text style={styles.backGlyph}>←</Text>
          </Pressable>
        ) : null}
        <Text style={styles.headerTitle}>Rewards</Text>
        <View
          style={styles.pointsPill}
          accessible
          accessibilityLabel={`Balance: ${formatPoints(userPoints)}`}
        >
          <Text style={styles.pointsPillText}>{formatPoints(userPoints)}</Text>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabsRow}
        accessibilityRole="tablist"
      >
        {REWARD_FILTER_TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
            style={[styles.tab, activeTab === tab ? styles.tabActive : null]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
            accessibilityLabel={tab}
            testID={testID ? `${testID}-tab-${tab}` : undefined}
          >
            <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : null]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      {error ? (
        <View style={styles.centeredFill}>
          <Text style={styles.errorGlyph}>⚠</Text>
          <Text style={styles.bodyMuted}>{error}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} style={styles.retryBtn} accessibilityRole="button" accessibilityLabel="Retry">
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : loading ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <View key={i} style={styles.gridItem}>
              <View style={[styles.skeletonCard, { height: 260 }]} />
            </View>
          ))}
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.centeredFill}>
          <Text style={styles.emptyIcon}>🎁</Text>
          <Text style={styles.bodyMuted}>No rewards in this category</Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(r) => r.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <RewardCard
                title={item.title}
                points={item.points}
                imageAlt={item.imageAlt}
                state={item.redeemed ? "redeemed" : item.points > userPoints ? "locked" : "unlocked"}
                compact
                onPress={() => onRewardPress(item)}
                testID={testID ? `${testID}-reward-${item.id}` : undefined}
              />
            </View>
          )}
        />
      )}

      {/* Sticky sort bar */}
      {!loading && !error && (
        <View style={styles.sortBar}>
          <Pressable
            onPress={onSortPress}
            accessibilityRole="button"
            accessibilityLabel={`Sort: ${sortLabel}`}
            testID={testID ? `${testID}-sort` : undefined}
          >
            <Text style={styles.sortText}>Sort: {sortLabel}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 56,
    paddingHorizontal: spacing.s4,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    backgroundColor: colors.background,
  },
  backBtn: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
  backGlyph: { fontSize: 20, color: colors.foreground },
  headerTitle: { ...textStyles.heading3, color: colors.foreground, flex: 1 },
  pointsPill: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s3,
    paddingVertical: 4,
  },
  pointsPillText: { ...textStyles.labelSmall, color: colors.white },
  tabsRow: { flexGrow: 0 },
  tabs: { paddingHorizontal: spacing.s4, paddingVertical: spacing.s2, gap: spacing.s2 },
  tab: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { ...textStyles.label, color: colors.foreground },
  tabTextActive: { color: colors.white },
  grid: { padding: spacing.s4, gap: spacing.s3, paddingBottom: 80 },
  gridRow: { gap: spacing.s3 },
  gridItem: { flex: 1 },
  centeredFill: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.s3, padding: spacing.s8 },
  errorGlyph: { fontSize: 40, color: colors.error },
  emptyIcon: { fontSize: 48 },
  bodyMuted: { ...textStyles.body, color: colors.textMuted, textAlign: "center" },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.s6, paddingVertical: spacing.s2 },
  retryText: { ...textStyles.label, color: colors.white },
  skeletonCard: { borderRadius: radius.lg, backgroundColor: colors.disabledBg },
  sortBar: {
    height: 56,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  sortText: { ...textStyles.label, color: colors.textMuted },
});
