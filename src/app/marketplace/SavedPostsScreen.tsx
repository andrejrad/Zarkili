/**
 * SavedPostsScreen.tsx — W28 Batch H screen H.2
 *
 * Saved posts and collections view with two tabs:
 *  – "All saved" — 2-column grid of PostCard
 *  – "Collections" — list of named collections + "New collection" tile
 *
 * Presentation-only. Container wires navigation + data.
 *
 * States: default | empty | loading | error
 */

import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PostCard, SegmentedControl, colors, radius, spacing, textStyles } from "../../shared/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SavedPost = {
  postId: string;
  title: string;
  imageUri: string;
  saved: boolean;
};

export type Collection = {
  collectionId: string;
  name: string;
  coverImageUri: string;
  postCount: number;
};

export type SavedTab = "all" | "collections";

export type SavedPostsScreenProps = {
  activeTab: SavedTab;
  onChangeTab: (tab: SavedTab) => void;
  savedPosts: SavedPost[];
  collections: Collection[];
  isLoading?: boolean;
  isError?: boolean;
  onPressRetry?: () => void;
  onPressPost?: (postId: string) => void;
  onPressSaveToggle?: (postId: string, saved: boolean) => void;
  onPressCollection?: (collectionId: string) => void;
  onPressNewCollection?: () => void;
  testID?: string;
};

const TAB_OPTIONS = [
  { value: "all" as SavedTab, label: "All saved" },
  { value: "collections" as SavedTab, label: "Collections" },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SavedPostsScreen({
  activeTab,
  onChangeTab,
  savedPosts,
  collections,
  isLoading = false,
  isError = false,
  onPressRetry,
  onPressPost,
  onPressSaveToggle,
  onPressCollection,
  onPressNewCollection,
  testID,
}: SavedPostsScreenProps) {
  return (
    <View style={styles.screen} testID={testID}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        <SegmentedControl
          options={TAB_OPTIONS}
          value={activeTab}
          onChange={onChangeTab}
          testID={testID ? `${testID}-tabs` : undefined}
        />
      </View>

      {/* Error */}
      {isError && (
        <View style={styles.centered}>
          <Text style={styles.emptyBody}>Couldn't load saved posts</Text>
          {onPressRetry && (
            <Pressable accessibilityRole="button" onPress={onPressRetry} style={styles.retryButton}>
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Loading */}
      {!isError && isLoading && (
        <View style={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.gridItem}>
              <PostCard
                postId={`shimmer-${i}`}
                title=""
                imageUri=""
                isLoading
              />
            </View>
          ))}
        </View>
      )}

      {/* All saved tab */}
      {!isError && !isLoading && activeTab === "all" && (
        savedPosts.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No saved posts yet</Text>
            <Text style={styles.emptyBody}>Posts you save will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={savedPosts}
            keyExtractor={(item) => item.postId}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <PostCard
                  postId={item.postId}
                  title={item.title}
                  imageUri={item.imageUri}
                  saved={item.saved}
                  onPress={() => onPressPost?.(item.postId)}
                  onPressSave={() => onPressSaveToggle?.(item.postId, !item.saved)}
                  testID={testID ? `${testID}-post-${item.postId}` : undefined}
                />
              </View>
            )}
          />
        )
      )}

      {/* Collections tab */}
      {!isError && !isLoading && activeTab === "collections" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.collectionsContent}
        >
          {/* New collection tile */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New collection"
            onPress={onPressNewCollection}
            style={({ pressed }) => [styles.newCollectionTile, pressed && styles.tilePressed]}
            testID={testID ? `${testID}-new-collection` : undefined}
          >
            <Text style={styles.newCollectionIcon}>+</Text>
            <Text style={styles.newCollectionLabel}>New collection</Text>
          </Pressable>

          {collections.length === 0 && (
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>No collections yet</Text>
              <Text style={styles.emptyBody}>Organise your saved looks into collections</Text>
            </View>
          )}

          {collections.map((col) => (
            <Pressable
              key={col.collectionId}
              accessibilityRole="button"
              accessibilityLabel={`${col.name}, ${col.postCount} posts`}
              onPress={() => onPressCollection?.(col.collectionId)}
              style={({ pressed }) => [styles.collectionRow, pressed && styles.tilePressed]}
              testID={testID ? `${testID}-collection-${col.collectionId}` : undefined}
            >
              <View style={styles.collectionCover} />
              <View style={styles.collectionMeta}>
                <Text style={styles.collectionName} numberOfLines={1}>{col.name}</Text>
                <Text style={styles.collectionCount}>{col.postCount} posts</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.pageHorizontal,
    gap: spacing.s2,
  },
  emptyTitle: {
    ...textStyles.heading4,
    color: colors.foreground,
    textAlign: "center",
  },
  emptyBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.s2,
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s4,
  },
  retryLabel: {
    ...textStyles.label,
    color: colors.primary,
  },
  // Grid
  gridContent: {
    padding: spacing.s3,
    paddingBottom: spacing.s12,
  },
  row: {
    gap: spacing.s3,
    marginBottom: spacing.s3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: spacing.s3,
    gap: spacing.s3,
  },
  gridItem: {
    flex: 1,
  },
  // Collections
  collectionsContent: {
    padding: spacing.pageHorizontal,
    gap: spacing.s3,
    paddingBottom: spacing.s12,
  },
  newCollectionTile: {
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s2,
  },
  tilePressed: {
    opacity: 0.72,
  },
  newCollectionIcon: {
    fontSize: 22,
    color: colors.primary,
    lineHeight: 26,
  },
  newCollectionLabel: {
    ...textStyles.label,
    color: colors.primary,
  },
  collectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    paddingVertical: spacing.s3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  collectionCover: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.warmOat,
    flexShrink: 0,
  },
  collectionMeta: {
    flex: 1,
    gap: spacing.s1,
  },
  collectionName: {
    ...textStyles.label,
    color: colors.foreground,
  },
  collectionCount: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
    flexShrink: 0,
  },
});
