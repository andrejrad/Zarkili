/**
 * MarketplaceExtrasScreen.tsx — W31 Batch K (K.5)
 *
 * Exports:
 *   HashtagLandingScreen — tag header + PostCard grid
 *   TrendingFeedScreen   — trending section chips + PostCard list + FollowToggle
 *   AuthorActionsSheet   — block author / report post sheet
 *   FollowSalonButton    — FollowToggle + salon name label
 */

import { useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { FollowToggle } from "../../shared/ui/FollowToggle";
import { ModalSheet } from "../../shared/ui/ModalSheet";
import { PostCard, type PostCardProps } from "../../shared/ui/PostCard";
import { colors, radius, spacing } from "../../shared/ui/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HashtagLandingScreenProps = {
  tag: string;
  posts: PostCardProps[];
  onSelectPost: (id: string) => void;
  testID?: string;
};

export type TrendingTopic = {
  id: string;
  label: string;
};

export type TrendingSalon = {
  id: string;
  name: string;
  isFollowing: boolean;
};

export type TrendingFeedScreenProps = {
  topics: TrendingTopic[];
  posts: PostCardProps[];
  salonSuggestions: TrendingSalon[];
  onSelectPost: (id: string) => void;
  onFollowSalon: (salonId: string, following: boolean) => void;
  testID?: string;
};

export type AuthorActionsSheetProps = {
  visible: boolean;
  authorName: string;
  onBlockAuthor: () => void;
  onReportPost: (reason: string) => void;
  onDismiss: () => void;
  testID?: string;
};

export type FollowSalonButtonProps = {
  salonId: string;
  salonName: string;
  following: boolean;
  onToggle: (following: boolean) => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// HashtagLandingScreen
// ---------------------------------------------------------------------------

export function HashtagLandingScreen({
  tag,
  posts,
  onSelectPost,
  testID,
}: HashtagLandingScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      {/* Tag header */}
      <View style={styles.hashtagHeader}>
        <Text
          style={styles.hashtagTag}
          testID={testID ? `${testID}-tag` : undefined}
        >
          #{tag}
        </Text>
        <Text style={styles.hashtagCount}>
          {posts.length.toLocaleString()}{" "}
          {posts.length === 1 ? "post" : "posts"}
        </Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(_, i) => String(i)}
        numColumns={2}
        contentContainerStyle={
          posts.length === 0 ? styles.emptyContainer : styles.gridContent
        }
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={
          <View testID={testID ? `${testID}-empty` : undefined}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No posts for #{tag} yet.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.gridCell}>
            <PostCard
              {...item}
              onPress={() => {
                if (item.postId) onSelectPost(item.postId);
              }}
              testID={testID ? `${testID}-post-${index}` : undefined}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// TrendingFeedScreen
// ---------------------------------------------------------------------------

export function TrendingFeedScreen({
  topics,
  posts,
  salonSuggestions,
  onSelectPost,
  onFollowSalon,
  testID,
}: TrendingFeedScreenProps) {
  const [activeTopic, setActiveTopic] = useState<string>(
    topics[0]?.id ?? ""
  );

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      {/* Topic chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.topicChipsRow}
        style={styles.topicChipsScroll}
      >
        {topics.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setActiveTopic(t.id)}
            accessibilityRole="button"
            style={[
              styles.topicChip,
              activeTopic === t.id && styles.topicChipActive,
            ]}
            testID={testID ? `${testID}-topic-${t.id}` : undefined}
          >
            <Text
              style={[
                styles.topicChipText,
                activeTopic === t.id && styles.topicChipTextActive,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Salon suggestions strip */}
      {salonSuggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.salonRow}
          testID={testID ? `${testID}-salons` : undefined}
        >
          {salonSuggestions.map((salon) => (
            <View key={salon.id} style={styles.salonChip}>
              <Text style={styles.salonName} numberOfLines={1}>
                {salon.name}
              </Text>
              <FollowToggle
                followed={salon.isFollowing}
                onToggle={(f) => onFollowSalon(salon.id, f)}
                size="sm"
                testID={testID ? `${testID}-follow-${salon.id}` : undefined}
              />
            </View>
          ))}
        </ScrollView>
      )}

      {/* Posts */}
      <FlatList
        data={posts}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={
          posts.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View testID={testID ? `${testID}-empty` : undefined}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyText}>Nothing trending right now.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <PostCard
            {...item}
            onPress={() => {
              if (item.postId) onSelectPost(item.postId);
            }}
            testID={testID ? `${testID}-post-${index}` : undefined}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// AuthorActionsSheet
// ---------------------------------------------------------------------------

const REPORT_REASONS = [
  "Spam or misleading",
  "Inappropriate content",
  "Harassment",
  "Copyright violation",
  "Other",
];

export function AuthorActionsSheet({
  visible,
  authorName,
  onBlockAuthor,
  onReportPost,
  onDismiss,
  testID,
}: AuthorActionsSheetProps) {
  const [reportMode, setReportMode] = useState(false);
  const [reason, setReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleReport() {
    const finalReason = reason === "Other" ? otherText.trim() : reason;
    if (!finalReason) return;
    onReportPost(finalReason);
    setSubmitted(true);
  }

  function handleDismiss() {
    setReportMode(false);
    setReason("");
    setOtherText("");
    setSubmitted(false);
    onDismiss();
  }

  return (
    <ModalSheet
      visible={visible}
      onClose={handleDismiss}
      title={
        submitted
          ? "Report submitted"
          : reportMode
          ? "Report post"
          : `Options for @${authorName}`
      }
      testID={testID}
    >
      <View style={styles.sheetBody}>
        {submitted ? (
          <View style={styles.submittedBox} testID={testID ? `${testID}-submitted` : undefined}>
            <Text style={styles.submittedIcon}>✓</Text>
            <Text style={styles.submittedText}>
              {"Thanks for letting us know. We'll review the post shortly."}
            </Text>
            <Pressable
              onPress={handleDismiss}
              accessibilityRole="button"
              style={styles.doneBtn}
              testID={testID ? `${testID}-done` : undefined}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        ) : reportMode ? (
          <>
            {REPORT_REASONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setReason(r)}
                accessibilityRole="radio"
                accessibilityState={{ selected: reason === r }}
                style={[styles.reasonRow, reason === r && styles.reasonRowSelected]}
                testID={testID ? `${testID}-reason-${r.replace(/\s+/g, "-").toLowerCase()}` : undefined}
              >
                <Text style={styles.reasonText}>{r}</Text>
              </Pressable>
            ))}
            {reason === "Other" && (
              <TextInput
                style={styles.otherInput}
                value={otherText}
                onChangeText={setOtherText}
                placeholder="Describe the issue…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={300}
                testID={testID ? `${testID}-other-input` : undefined}
              />
            )}
            <Pressable
              onPress={handleReport}
              disabled={!reason || (reason === "Other" && !otherText.trim())}
              accessibilityRole="button"
              style={[
                styles.doneBtn,
                (!reason || (reason === "Other" && !otherText.trim())) && styles.btnDisabled,
              ]}
              testID={testID ? `${testID}-submit-report` : undefined}
            >
              <Text style={styles.doneBtnText}>Submit report</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={() => setReportMode(true)}
              accessibilityRole="button"
              style={styles.actionRow}
              testID={testID ? `${testID}-report` : undefined}
            >
              <Text style={styles.actionIcon}>⚑</Text>
              <Text style={styles.actionLabel}>Report post</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onBlockAuthor();
                handleDismiss();
              }}
              accessibilityRole="button"
              style={styles.actionRow}
              testID={testID ? `${testID}-block` : undefined}
            >
              <Text style={styles.actionIcon}>🚫</Text>
              <Text style={[styles.actionLabel, styles.actionLabelDestructive]}>
                Block @{authorName}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// FollowSalonButton
// ---------------------------------------------------------------------------

export function FollowSalonButton({
  salonName,
  following,
  onToggle,
  testID,
}: FollowSalonButtonProps) {
  return (
    <View style={styles.followSalonRoot} testID={testID}>
      <Text
        style={styles.followSalonName}
        numberOfLines={1}
        testID={testID ? `${testID}-name` : undefined}
      >
        {salonName}
      </Text>
      <FollowToggle
        followed={following}
        onToggle={onToggle}
        testID={testID ? `${testID}-toggle` : undefined}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  hashtagHeader: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s4,
    gap: spacing.s1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hashtagTag: { fontSize: 22, fontWeight: "700", color: colors.foreground },
  hashtagCount: { fontSize: 14, color: colors.textMuted },
  gridContent: {
    paddingHorizontal: spacing.s2,
    paddingTop: spacing.s2,
    gap: spacing.s2,
  },
  gridRow: { gap: spacing.s2 },
  gridCell: { flex: 1 },
  listContent: { paddingVertical: spacing.s2 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.pageHorizontal,
    gap: spacing.s3,
  },
  emptyIcon: { fontSize: 48, textAlign: "center" },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  separator: { height: 1, backgroundColor: colors.border },
  topicChipsScroll: { flexGrow: 0 },
  topicChipsRow: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s2,
  },
  topicChip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  topicChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  topicChipText: { fontSize: 13, color: colors.foreground },
  topicChipTextActive: { color: colors.surface, fontWeight: "600" },
  salonRow: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s3,
    gap: spacing.s3,
  },
  salonChip: {
    alignItems: "center",
    gap: spacing.s1,
    width: 100,
  },
  salonName: { fontSize: 12, color: colors.foreground, textAlign: "center" },
  // AuthorActionsSheet
  sheetBody: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s6,
    gap: spacing.s2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s4,
    gap: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 16, color: colors.foreground },
  actionLabelDestructive: { color: colors.error },
  reasonRow: {
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  reasonText: { fontSize: 15, color: colors.foreground },
  otherInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    fontSize: 14,
    color: colors.foreground,
    minHeight: 80,
    textAlignVertical: "top",
  },
  doneBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  doneBtnText: { fontSize: 15, fontWeight: "600", color: colors.surface },
  btnDisabled: { opacity: 0.4 },
  submittedBox: { alignItems: "center", gap: spacing.s3, paddingVertical: spacing.s4 },
  submittedIcon: { fontSize: 40, color: colors.success },
  submittedText: { fontSize: 15, color: colors.foreground, textAlign: "center", lineHeight: 22 },
  // FollowSalonButton
  followSalonRoot: {
    alignItems: "center",
    gap: spacing.s2,
  },
  followSalonName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
    maxWidth: 160,
  },
});
