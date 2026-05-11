/**
 * MarketplacePostDetailScreen.tsx — W28 Batch H screen H.1
 *
 * Full post detail view with:
 *  – Hero gallery carousel (index dots)
 *  – Author header: salon avatar + name + Follow toggle
 *  – Title, collapsible description, hashtag chips
 *  – "Book this look" primary CTA
 *  – Action row: save-toggle + share + comment
 *  – Related posts horizontal scroll
 *
 * Presentation-only. Container wires navigation + data.
 *
 * States: default | saved | loading | error
 */

import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  PostCard,
  SaveToggle,
  SavedToast,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MarketplacePost = {
  postId: string;
  title: string;
  description: string;
  imageUri: string;
  tags: string[];
  salonId: string;
  salonName: string;
  /** Pre-computed initials e.g. "VS" */
  salonInitials: string;
  saved: boolean;
  commentCount: number;
};

export type RelatedPost = {
  postId: string;
  title: string;
  imageUri: string;
  saved: boolean;
};

export type MarketplacePostDetailScreenProps = {
  post: MarketplacePost | null;
  relatedPosts: RelatedPost[];
  isFollowing?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onPressRetry?: () => void;
  onPressBookThisLook?: () => void;
  onPressSave?: (postId: string, saved: boolean) => void;
  onPressFollow?: (salonId: string) => void;
  onPressShare?: () => void;
  onPressComment?: () => void;
  onPressRelatedPost?: (postId: string) => void;
  onPressRelatedSave?: (postId: string, saved: boolean) => void;
  onPressBack?: () => void;
  testID?: string;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MarketplacePostDetailScreen({
  post,
  relatedPosts,
  isFollowing = false,
  isLoading = false,
  isError = false,
  onPressRetry,
  onPressBookThisLook,
  onPressSave,
  onPressFollow,
  onPressShare,
  onPressComment,
  onPressRelatedPost,
  onPressRelatedSave,
  onPressBack,
  testID,
}: MarketplacePostDetailScreenProps) {
  const [expanded, setExpanded] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const handleSave = useCallback(() => {
    if (!post) return;
    const next = !post.saved;
    onPressSave?.(post.postId, next);
    if (next) {
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
    }
  }, [post, onPressSave]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.screen} testID={testID}>
        <View style={styles.heroShimmer} />
        <View style={styles.loadingBody}>
          <View style={[styles.shimmerLine, { width: "50%" }]} />
          <View style={[styles.shimmerLine, { width: "90%" }]} />
          <View style={[styles.shimmerLine, { width: "70%" }]} />
        </View>
      </View>
    );
  }

  // Error state
  if (isError || !post) {
    return (
      <View style={[styles.screen, styles.centered]} testID={testID}>
        <Text style={styles.errorText}>Couldn't load this post</Text>
        {onPressRetry && (
          <Pressable
            accessibilityRole="button"
            onPress={onPressRetry}
            style={styles.retryButton}
          >
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.screen} testID={testID}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero image (single image; carousel pagination dots shown) */}
        <View style={styles.heroContainer}>
          <View style={styles.heroImagePlaceholder}>
            {/* PostCard as full-width hero */}
            <View style={styles.heroDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        </View>

        {/* Author header */}
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorInitials}>{post.salonInitials}</Text>
          </View>
          <Text style={styles.authorName} numberOfLines={1}>
            {post.salonName}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isFollowing ? "Following" : "Follow"}
            accessibilityState={{ selected: isFollowing }}
            onPress={() => onPressFollow?.(post.salonId)}
            style={[styles.followChip, isFollowing && styles.followChipActive]}
          >
            <Text style={[styles.followChipLabel, isFollowing && styles.followChipLabelActive]}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </Pressable>
        </View>

        {/* Title */}
        <Text style={styles.title} testID={testID ? `${testID}-title` : undefined}>
          {post.title}
        </Text>

        {/* Collapsible description */}
        <View style={styles.descriptionContainer}>
          <Text
            style={styles.description}
            numberOfLines={expanded ? undefined : 3}
          >
            {post.description}
          </Text>
          {!expanded && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setExpanded(true)}
              hitSlop={8}
            >
              <Text style={styles.showMore}>Show more</Text>
            </Pressable>
          )}
        </View>

        {/* Tag chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagRow}
        >
          {post.tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagLabel}>#{tag}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Book this look CTA */}
        <View style={styles.ctaContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Book this look"
            onPress={onPressBookThisLook}
            style={({ pressed }) => [
              styles.bookCta,
              pressed && styles.bookCtaPressed,
            ]}
            testID={testID ? `${testID}-book-cta` : undefined}
          >
            <Text style={styles.bookCtaLabel}>Book this look</Text>
          </Pressable>
        </View>

        {/* Action row */}
        <View style={styles.actionRow}>
          <SaveToggle
            saved={post.saved}
            onPress={handleSave}
            testID={testID ? `${testID}-save-toggle` : undefined}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share"
            onPress={onPressShare}
            style={styles.actionIconButton}
          >
            <Text style={styles.actionIconText}>↗</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Comment, ${post.commentCount} comments`}
            onPress={onPressComment}
            style={styles.actionIconButton}
          >
            <Text style={styles.actionIconText}>💬</Text>
          </Pressable>
        </View>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedHeader}>Related posts</Text>
            <FlatList
              horizontal
              data={relatedPosts}
              keyExtractor={(item) => item.postId}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedList}
              ItemSeparatorComponent={() => <View style={{ width: spacing.s3 }} />}
              renderItem={({ item }) => (
                <View style={styles.relatedCard}>
                  <PostCard
                    postId={item.postId}
                    title={item.title}
                    imageUri={item.imageUri}
                    saved={item.saved}
                    aspectRatio="portrait"
                    onPress={() => onPressRelatedPost?.(item.postId)}
                    onPressSave={() => onPressRelatedSave?.(item.postId, !item.saved)}
                    testID={testID ? `${testID}-related-${item.postId}` : undefined}
                  />
                </View>
              )}
            />
          </View>
        )}
      </ScrollView>

      {/* Toast */}
      <SavedToast
        visible={toastVisible}
        testID={testID ? `${testID}-saved-toast` : undefined}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.s12,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  // Loading / shimmer
  heroShimmer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.border,
  },
  loadingBody: {
    padding: spacing.pageHorizontal,
    gap: spacing.s3,
  },
  shimmerLine: {
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  // Error
  errorText: {
    ...textStyles.body,
    color: colors.textMuted,
    marginBottom: spacing.s4,
  },
  retryButton: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s4,
  },
  retryLabel: {
    ...textStyles.label,
    color: colors.primary,
  },
  // Hero
  heroContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.border,
  },
  heroImagePlaceholder: {
    flex: 1,
    backgroundColor: colors.warmOat,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: spacing.s3,
  },
  heroDots: {
    flexDirection: "row",
    gap: spacing.s1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  // Author
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s3,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.warmOat,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  authorInitials: {
    ...textStyles.labelSmall,
    color: colors.foreground,
  },
  authorName: {
    ...textStyles.label,
    color: colors.foreground,
    flex: 1,
  },
  followChip: {
    height: 32,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  followChipActive: {
    backgroundColor: colors.primary10,
  },
  followChipLabel: {
    ...textStyles.labelSmall,
    color: colors.primary,
  },
  followChipLabelActive: {
    color: colors.primaryPressed,
  },
  // Content
  title: {
    ...textStyles.heading3,
    color: colors.foreground,
    paddingHorizontal: spacing.pageHorizontal,
    marginBottom: spacing.s3,
  },
  descriptionContainer: {
    paddingHorizontal: spacing.pageHorizontal,
    marginBottom: spacing.s3,
    gap: spacing.s1,
  },
  description: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  showMore: {
    ...textStyles.labelSmall,
    color: colors.primary,
    marginTop: spacing.s1,
  },
  tagRow: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s4,
    gap: spacing.s2,
  },
  tagChip: {
    height: 28,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tagLabel: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },
  // CTA
  ctaContainer: {
    paddingHorizontal: spacing.pageHorizontal,
    marginBottom: spacing.s4,
  },
  bookCta: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  bookCtaPressed: {
    backgroundColor: colors.primaryPressed,
  },
  bookCtaLabel: {
    ...textStyles.label,
    color: colors.white,
  },
  // Action row
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s2,
    gap: spacing.s6,
    alignItems: "center",
    marginBottom: spacing.s4,
  },
  actionIconButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconText: {
    fontSize: 20,
    color: colors.textMuted,
  },
  // Related
  relatedSection: {
    marginTop: spacing.s2,
  },
  relatedHeader: {
    ...textStyles.label,
    color: colors.foreground,
    paddingHorizontal: spacing.pageHorizontal,
    marginBottom: spacing.s3,
  },
  relatedList: {
    paddingHorizontal: spacing.pageHorizontal,
  },
  relatedCard: {
    width: 160,
  },
});
