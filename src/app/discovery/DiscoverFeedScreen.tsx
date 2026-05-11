/**
 * DiscoverFeedScreen.tsx — W22/W34 Stream B.
 *
 * Social-style feed of salon posts with filter chips.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../../shared/ui";

import type { DiscoveryFeedFilter, DiscoveryFeedPost } from "./discoveryHelpers";

const FILTERS: { value: DiscoveryFeedFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "trending", label: "Trending" },
  { value: "near-me", label: "Near me" },
  { value: "new", label: "New" },
];

export type DiscoverFeedScreenProps = {
  posts: DiscoveryFeedPost[];
  activeFilter: DiscoveryFeedFilter;
  onFilterChange: (filter: DiscoveryFeedFilter) => void;
  onSelectPost: (postId: string) => void;
  onSelectSalon: (salonId: string) => void;
  testID?: string;
};

export function DiscoverFeedScreen({
  posts,
  activeFilter,
  onFilterChange,
  onSelectPost,
  onSelectSalon,
  testID,
}: DiscoverFeedScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID ?? "discover-feed"}
    >
      <Text style={styles.heading} accessibilityRole="header">
        Feed
      </Text>

      <View style={styles.filterRow} accessibilityRole="radiogroup">
        {FILTERS.map((filter) => {
          const selected = activeFilter === filter.value;
          return (
            <Pressable
              key={filter.value}
              onPress={() => onFilterChange(filter.value)}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={filter.label}
              testID={`discover-feed-filter-${filter.value}`}
            >
              <Text style={[styles.filterLabel, selected && styles.filterLabelSelected]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.feedList}>
        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <Pressable
              onPress={() => onSelectSalon(post.salonId)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${post.salonName}`}
              testID={`discover-feed-salon-${post.salonId}`}
            >
              <Text style={styles.salonName}>{post.salonName}</Text>
            </Pressable>
            <Pressable
              onPress={() => onSelectPost(post.id)}
              accessibilityRole="button"
              accessibilityLabel="Open post"
              testID={`discover-feed-post-${post.id}`}
            >
              <Text style={styles.caption}>{post.caption}</Text>
              <Text style={styles.metaRow}>
                ❤ {post.likeCount} • {post.postedAt}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  heading: { fontSize: 28, fontWeight: "700", color: colors.foreground },
  filterRow: { flexDirection: "row", gap: spacing.s2, flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: { backgroundColor: colors.foreground, borderColor: colors.foreground },
  filterLabel: { fontSize: 13, color: colors.foreground },
  filterLabelSelected: { color: colors.surface, fontWeight: "600" },
  feedList: { gap: spacing.s3 },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    gap: spacing.s2,
  },
  salonName: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  caption: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  metaRow: { fontSize: 12, color: colors.textMuted },
});
