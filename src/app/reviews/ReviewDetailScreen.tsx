/**
 * ReviewDetailScreen.tsx — E.8 Review Detail.
 *
 * Author header (avatar + name + date). Star rating + aspect chips.
 * Body text. Gallery carousel (photo placeholders). Salon response card.
 * Helpful counter + Report kebab.
 * States: default | with-response | reported | removed-by-moderation | error.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, colors, radius, spacing, textStyles } from "../../shared/ui";

export type ReviewDetailState =
  | "default"
  | "with-response"
  | "reported"
  | "removed-by-moderation"
  | "error";

export type AspectRatingDisplay = {
  id: string;
  label: string;
  value: number;
};

export type SalonResponse = {
  salonName: string;
  responseText: string;
  postedDate: string; // "MM/DD/YYYY"
};

export type ReviewDetailScreenProps = {
  authorName: string;
  authorAvatarLabel?: string;
  postedDate: string; // "MM/DD/YYYY"
  overallRating: number; // 1–5
  aspectRatings?: readonly AspectRatingDisplay[];
  body?: string;
  photoCount?: number;
  salonResponse?: SalonResponse;
  helpfulCount?: number;
  isHelpful?: boolean;
  screenState?: ReviewDetailState;
  errorMessage?: string;
  onHelpfulPress?: () => void;
  onReportPress?: () => void;
  onPressBack?: () => void;
  onRetry?: () => void;
  testID?: string;
};

export function ReviewDetailScreen({
  authorName,
  authorAvatarLabel,
  postedDate,
  overallRating,
  aspectRatings,
  body,
  photoCount = 0,
  salonResponse,
  helpfulCount = 0,
  isHelpful,
  screenState = "default",
  errorMessage,
  onHelpfulPress,
  onReportPress,
  onPressBack,
  onRetry,
  testID,
}: ReviewDetailScreenProps) {
  const isReported = screenState === "reported";
  const isRemoved = screenState === "removed-by-moderation";
  const isError = screenState === "error";

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
        <Text style={styles.headerTitle}>Review</Text>
        {onReportPress && !isReported && !isRemoved ? (
          <Pressable
            onPress={onReportPress}
            accessibilityRole="button"
            accessibilityLabel="More options"
            style={styles.kebabBtn}
            testID={testID ? `${testID}-kebab` : undefined}
          >
            <Text style={styles.kebabGlyph}>⋮</Text>
          </Pressable>
        ) : null}
      </View>

      {isError ? (
        <View style={styles.centeredFill}>
          <Text style={styles.errorGlyph}>⚠</Text>
          <Text style={styles.bodyMuted}>{errorMessage ?? "Unable to load review."}</Text>
          {onRetry ? (
            <Pressable
              onPress={onRetry}
              style={styles.retryBtn}
              accessibilityRole="button"
              accessibilityLabel="Retry"
              testID={testID ? `${testID}-retry` : undefined}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : isRemoved ? (
        <View style={styles.centeredFill}>
          <Text style={styles.emptyIcon}>🚫</Text>
          <Text style={styles.bodyMuted}>This review has been removed.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {isReported && (
            <Banner variant="info" message="You've reported this review. It's under review by moderation." />
          )}

          {/* Author header */}
          <View style={styles.authorRow}>
            <View
              style={styles.avatar}
              accessible
              accessibilityLabel={`${authorName} avatar`}
            >
              <Text style={styles.avatarText}>
                {authorAvatarLabel ?? authorName[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{authorName}</Text>
              <Text style={styles.postedDate}>{postedDate}</Text>
            </View>
          </View>

          {/* Star rating */}
          <View
            style={styles.starsRow}
            accessible
            accessibilityLabel={`Overall rating: ${overallRating} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <Text key={s} style={[styles.star, s <= overallRating ? styles.starFilled : null]}>
                ★
              </Text>
            ))}
          </View>

          {/* Aspect rating chips */}
          {aspectRatings && aspectRatings.length > 0 ? (
            <View style={styles.aspectRow}>
              {aspectRatings.map((a) => a.value > 0 ? (
                <View
                  key={a.id}
                  style={styles.aspectChip}
                  accessible
                  accessibilityLabel={`${a.label}: ${a.value} stars`}
                >
                  <Text style={styles.aspectChipText}>{a.label} </Text>
                  <Text style={styles.aspectChipStar}>★</Text>
                  <Text style={styles.aspectChipValue}>{a.value}</Text>
                </View>
              ) : null)}
            </View>
          ) : null}

          {/* Body text */}
          {body ? (
            <Text style={[styles.bodyText, isReported ? styles.bodyTextMuted : null]}>
              {body}
            </Text>
          ) : null}

          {/* Photos gallery (placeholders) */}
          {photoCount > 0 ? (
            <View style={styles.gallery}>
              {Array.from({ length: photoCount }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <View key={i} style={styles.photo} accessible accessibilityLabel={`Photo ${i + 1}`}>
                  <Text style={styles.photoGlyph}>🖼</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Salon response */}
          {salonResponse && screenState === "with-response" ? (
            <View style={styles.responseCard}>
              <Text style={styles.responseOwnerLabel}>Owner response</Text>
              <Text style={styles.responseDate}>{salonResponse.postedDate}</Text>
              <Text style={styles.responseText}>{salonResponse.responseText}</Text>
            </View>
          ) : null}

          {/* Footer: helpful + report */}
          <View style={styles.footerRow}>
            {onHelpfulPress ? (
              <Pressable
                onPress={onHelpfulPress}
                style={[styles.helpfulBtn, isHelpful ? styles.helpfulBtnActive : null]}
                accessibilityRole="button"
                accessibilityLabel={`Mark as helpful. ${helpfulCount} people found this helpful.`}
                accessibilityState={{ selected: isHelpful }}
                testID={testID ? `${testID}-helpful` : undefined}
              >
                <Text style={[styles.helpfulText, isHelpful ? styles.helpfulTextActive : null]}>
                  👍 Helpful ({helpfulCount})
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
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
  kebabBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  kebabGlyph: { fontSize: 24, color: colors.foreground },
  scroll: { padding: spacing.s4, gap: spacing.s4, paddingBottom: 32 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: spacing.s3, marginBottom: spacing.s2 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...textStyles.label, color: colors.white },
  authorInfo: { flex: 1 },
  authorName: { ...textStyles.label, color: colors.foreground },
  postedDate: { ...textStyles.bodySmall, color: colors.textMuted },
  starsRow: { flexDirection: "row", gap: 4 },
  star: { fontSize: 24, color: colors.border },
  starFilled: { color: colors.primary },
  aspectRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  aspectChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s3,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aspectChipText: { ...textStyles.bodySmall, color: colors.foreground },
  aspectChipStar: { fontSize: 12, color: colors.primary },
  aspectChipValue: { ...textStyles.bodySmall, color: colors.foreground },
  bodyText: { ...textStyles.body, color: colors.foreground, lineHeight: 24 },
  bodyTextMuted: { color: colors.textMuted },
  gallery: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  photo: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.disabledBg,
    alignItems: "center",
    justifyContent: "center",
  },
  photoGlyph: { fontSize: 32 },
  responseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.accent,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    gap: spacing.s1,
  },
  responseOwnerLabel: { ...textStyles.label, color: colors.accentForeground },
  responseDate: { ...textStyles.bodySmall, color: colors.textMuted },
  responseText: { ...textStyles.body, color: colors.foreground },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", paddingTop: spacing.s2, borderTopWidth: 1, borderTopColor: colors.border },
  helpfulBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpfulBtnActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  helpfulText: { ...textStyles.label, color: colors.textMuted },
  helpfulTextActive: { color: colors.primary },
  centeredFill: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.s3, padding: spacing.s8 },
  errorGlyph: { fontSize: 40, color: colors.error },
  emptyIcon: { fontSize: 48 },
  bodyMuted: { ...textStyles.body, color: colors.textMuted, textAlign: "center" },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.s6, paddingVertical: spacing.s2 },
  retryText: { ...textStyles.label, color: colors.white },
});
