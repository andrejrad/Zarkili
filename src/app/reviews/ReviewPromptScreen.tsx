/**
 * ReviewPromptScreen.tsx — E.7 Leave a Review.
 *
 * Header + salon mini-card. RatingSelector (5 stars 32). Aspect rating chips.
 * PhotoUploadTile grid (max 5). Multi-line TextInput (500 char counter).
 * Anonymous toggle. Sticky "Submit review" CTA.
 * States: default | uploading-photos | profanity-warning | submitted | error.
 */

import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import {
  Banner,
  PhotoUploadTile,
  RatingSelector,
  StickyCtaBar,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import {
  MAX_REVIEW_PHOTOS,
  MAX_REVIEW_TEXT_LENGTH,
  REVIEW_ASPECTS,
  isReviewSubmittable,
  type ReviewAspect,
  type ReviewDraft,
} from "../loyalty/loyaltyHelpers";

export type ReviewPromptState =
  | "default"
  | "uploading-photos"
  | "profanity-warning"
  | "submitted"
  | "error";

export type ReviewPromptSalonCard = {
  name: string;
  address?: string;
  avatarLabel?: string;
};

export type ReviewPromptScreenProps = {
  salon: ReviewPromptSalonCard;
  draft: ReviewDraft;
  screenState?: ReviewPromptState;
  errorMessage?: string;
  onDraftChange: (patch: Partial<ReviewDraft>) => void;
  onPhotoAdd?: () => void;
  onPhotoRemove?: (uri: string) => void;
  onSubmit: () => void;
  onPressBack?: () => void;
  testID?: string;
};

export function ReviewPromptScreen({
  salon,
  draft,
  screenState = "default",
  errorMessage,
  onDraftChange,
  onPhotoAdd,
  onPhotoRemove,
  onSubmit,
  onPressBack,
  testID,
}: ReviewPromptScreenProps) {
  const submittable = isReviewSubmittable(draft);
  const isUploading = screenState === "uploading-photos";
  const hasProfanity = screenState === "profanity-warning";
  const isError = screenState === "error";
  const bodyLength = draft.text.length;

  function handleRatingChange(value: number) {
    onDraftChange({ overallRating: value });
  }

  function handleAspectChange(aspect: ReviewAspect, value: number) {
    onDraftChange({
      aspectRatings: { ...draft.aspectRatings, [aspect]: value },
    });
  }

  function handleBodyChange(text: string) {
    if (text.length <= MAX_REVIEW_TEXT_LENGTH) {
      onDraftChange({ text });
    }
  }

  function handleAnonymousToggle(value: boolean) {
    onDraftChange({ anonymous: value });
  }

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
        <Text style={styles.headerTitle}>How was it?</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Banners */}
        {isError && (
          <Banner variant="error" message={errorMessage ?? "Unable to submit review. Try again."} />
        )}
        {hasProfanity && (
          <Banner
            variant="warning"
            message="Your review contains prohibited language. Please revise before submitting."
          />
        )}

        {/* Salon mini-card */}
        <View style={styles.salonCard} accessible accessibilityLabel={`Review for ${salon.name}`}>
          <View style={styles.salonAvatar}>
            <Text style={styles.salonAvatarText}>
              {salon.avatarLabel ?? salon.name[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.salonInfo}>
            <Text style={styles.salonName}>{salon.name}</Text>
            {salon.address ? (
              <Text style={styles.salonAddress}>{salon.address}</Text>
            ) : null}
          </View>
        </View>

        {/* Overall star rating */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Overall rating</Text>
          <RatingSelector
            value={draft.overallRating}
            onChange={handleRatingChange}
            size={32}
            showLabel
            testID={testID ? `${testID}-overall-rating` : undefined}
          />
        </View>

        {/* Aspect ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rate specific aspects</Text>
          <View style={styles.aspectGrid}>
            {REVIEW_ASPECTS.map((aspect) => (
              <AspectChip
                key={aspect}
                aspect={aspect}
                value={draft.aspectRatings[aspect] ?? 0}
                onChange={(v) => handleAspectChange(aspect, v)}
                testID={testID ? `${testID}-aspect-${aspect}` : undefined}
              />
            ))}
          </View>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Add photos (optional)</Text>
          <View style={styles.photoGrid}>
            {draft.photoUris.map((uri) => (
              <PhotoUploadTile
                key={uri}
                state="filled"
                onRemove={() => onPhotoRemove?.(uri)}
                testID={testID ? `${testID}-photo-${uri}` : undefined}
              />
            ))}
            {draft.photoUris.length < MAX_REVIEW_PHOTOS && (
              isUploading ? (
                <PhotoUploadTile state="uploading" />
              ) : (
                <PhotoUploadTile
                  state="empty"
                  onPress={onPhotoAdd}
                  testID={testID ? `${testID}-photo-add` : undefined}
                />
              )
            )}
            {draft.photoUris.length >= MAX_REVIEW_PHOTOS && (
              <PhotoUploadTile state="max-reached" />
            )}
          </View>
        </View>

        {/* Text body */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Share your experience</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={5}
            placeholder="Describe your experience…"
            placeholderTextColor={colors.textMuted}
            value={draft.text}
            onChangeText={handleBodyChange}
            maxLength={MAX_REVIEW_TEXT_LENGTH}
            accessibilityLabel="Review text"
            accessibilityHint={`Maximum ${MAX_REVIEW_TEXT_LENGTH} characters`}
            testID={testID ? `${testID}-body` : undefined}
          />
          <Text
            style={[
              styles.charCounter,
              bodyLength >= MAX_REVIEW_TEXT_LENGTH ? styles.charLimit : null,
            ]}
            accessibilityLabel={`${bodyLength} of ${MAX_REVIEW_TEXT_LENGTH} characters`}
          >
            {bodyLength}/{MAX_REVIEW_TEXT_LENGTH}
          </Text>
        </View>

        {/* Anonymous toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Post anonymously</Text>
          <Switch
            value={draft.anonymous}
            onValueChange={handleAnonymousToggle}
            accessibilityLabel="Post anonymously"
            accessibilityRole="switch"
            accessibilityState={{ checked: draft.anonymous }}
            testID={testID ? `${testID}-anonymous` : undefined}
          />
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Sticky CTA */}
      <StickyCtaBar
        primaryLabel="Submit review"
        onPrimaryPress={submittable ? onSubmit : (() => {})}
        primaryDisabled={!submittable}
        primaryTestID={testID ? `${testID}-submit` : undefined}
      />
    </View>
  );
}

/* ---------- AspectChip ---------- */

type AspectChipProps = {
  aspect: ReviewAspect;
  value: number;
  onChange: (value: number) => void;
  testID?: string;
};

function AspectChip({ aspect, value, onChange, testID }: AspectChipProps) {
  return (
    <View style={styles.aspectChip} testID={testID}>
      <Text style={styles.aspectLabel}>{aspect}</Text>
      <View style={styles.miniStars} accessibilityRole="adjustable" accessibilityLabel={`${aspect} rating`} accessibilityValue={{ min: 0, max: 5, now: value }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Pressable
            key={s}
            onPress={() => onChange(s === value ? 0 : s)}
            hitSlop={6}
            accessibilityLabel={`${s} star${s !== 1 ? "s" : ""}`}
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={[styles.miniStar, s <= value ? styles.miniStarFilled : null]}>★</Text>
          </Pressable>
        ))}
      </View>
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
  scroll: { padding: spacing.s4, gap: spacing.s4, paddingBottom: 32 },
  salonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  salonAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  salonAvatarText: { ...textStyles.label, color: colors.white },
  salonInfo: { flex: 1 },
  salonName: { ...textStyles.label, color: colors.foreground },
  salonAddress: { ...textStyles.bodySmall, color: colors.textMuted },
  section: { gap: spacing.s2 },
  sectionLabel: { ...textStyles.label, color: colors.foreground },
  aspectGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  aspectChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s3,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    alignItems: "center",
    minWidth: 80,
  },
  aspectLabel: { ...textStyles.bodySmall, color: colors.foreground },
  miniStars: { flexDirection: "row", gap: 2 },
  miniStar: { fontSize: 16, color: colors.border },
  miniStarFilled: { color: colors.primary },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s3,
    ...textStyles.body,
    color: colors.foreground,
    textAlignVertical: "top",
    minHeight: 120,
  },
  charCounter: { ...textStyles.bodySmall, color: colors.textMuted, alignSelf: "flex-end" },
  charLimit: { color: colors.error },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.s2,
  },
  toggleLabel: { ...textStyles.body, color: colors.foreground },
  submitBtn: {
    height: spacing.touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: { backgroundColor: colors.disabledBg },
  submitBtnText: { ...textStyles.labelLarge, color: colors.white },
});
