/**
 * LoyaltyLandingScreen.tsx — E.1 Loyalty Landing.
 *
 * Hero card with tier-badge + balance + tier-progress label + progress-ring.
 * Earn-more action list. Points history (FlashList-shaped FlatList).
 * Sticky footer "Browse rewards" → E.2.
 * States: default (with points) | zero-balance | tier-up (modal overlay) | loading | error.
 */

import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Banner,
  ModalSheet,
  ProgressRing,
  StickyFooterCta,
  TierBadge,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import type { TierVariant } from "../../shared/ui/TierBadge";
import {
  DEFAULT_EARN_ACTIONS,
  computeTierProgress,
  deriveTier,
  formatHistoryDate,
  formatPoints,
  formatPointsDelta,
  nextTier,
  pointsToNextTier,
  type EarnAction,
  type HistoryEntry,
  type LoyaltyTier,
} from "./loyaltyHelpers";

export type LoyaltyLandingState = "default" | "zero-balance" | "tier-up" | "loading" | "error";

export type LoyaltyLandingScreenProps = {
  points: number;
  historyEntries: readonly HistoryEntry[];
  earnActions?: readonly EarnAction[];
  screenState?: LoyaltyLandingState;
  /** New tier name shown in tier-up celebration. */
  newTier?: LoyaltyTier;
  reduceMotion?: boolean;
  errorMessage?: string;
  onPressBrowseRewards: () => void;
  onPressEarnAction: (action: EarnAction) => void;
  onPressTierUpCta?: () => void;
  onDismissTierUp?: () => void;
  onPressRetry?: () => void;
  testID?: string;
};

const TIER_TO_VARIANT: Record<LoyaltyTier, TierVariant> = {
  Bronze: "bronze",
  Silver: "silver",
  Gold: "gold",
  Platinum: "platinum",
};

function SkeletonBox({ h, w, mt }: { h: number; w?: number | `${number}%`; mt?: number }) {
  return (
    <View
      style={{
        height: h,
        width: (w ?? "100%") as `${number}%` | number,
        borderRadius: radius.sm,
        backgroundColor: colors.disabledBg,
        marginTop: mt,
      }}
    />
  );
}

export function LoyaltyLandingScreen({
  points,
  historyEntries,
  earnActions = DEFAULT_EARN_ACTIONS,
  screenState = "default",
  newTier,
  errorMessage,
  onPressBrowseRewards,
  onPressEarnAction,
  onPressTierUpCta,
  onDismissTierUp,
  onPressRetry,
  testID,
}: LoyaltyLandingScreenProps) {
  if (screenState === "error") {
    return (
      <View style={styles.centeredFill} testID={testID}>
        <Text style={styles.errorGlyph}>⚠</Text>
        <Text style={styles.h3}>{errorMessage ?? "Couldn't load loyalty data"}</Text>
        <Text style={styles.bodyMuted}>Check your connection and try again.</Text>
        {onPressRetry ? (
          <Pressable
            onPress={onPressRetry}
            style={styles.retryBtn}
            accessibilityRole="button"
            accessibilityLabel="Retry"
            testID={testID ? `${testID}-retry` : undefined}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const tier = deriveTier(points);
  const tierVariant = TIER_TO_VARIANT[tier];
  const nextT = nextTier(tier);
  const ptsToNext = pointsToNextTier(points);
  const tierProgress = computeTierProgress(points);
  const isLoading = screenState === "loading";
  const isZero = screenState === "zero-balance";

  const heroCopy =
    isZero
      ? "Earn your first points"
      : nextT != null
      ? `${tier} — ${ptsToNext} pts to ${nextT}`
      : `${tier} — Maximum tier`;

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loyalty</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        {isLoading ? (
          <View
            style={styles.heroPad}
            testID={testID ? `${testID}-loading` : undefined}
          >
            <SkeletonBox h={160} />
          </View>
        ) : (
          <View
            style={styles.heroCard}
            accessible
            accessibilityLabel={`${formatPoints(points)}. ${heroCopy}`}
            testID={testID ? `${testID}-hero` : undefined}
          >
            <View style={styles.heroLeft}>
              <TierBadge
                tier={tierVariant}
                testID={testID ? `${testID}-tier-badge` : undefined}
              />
              <Text style={styles.balance}>{isZero ? "0 pts" : formatPoints(points)}</Text>
              <Text style={styles.tierCopy}>{heroCopy}</Text>
            </View>
            <ProgressRing
              progress={tierProgress}
              size={96}
              progressColor={colors.accent}
              centerLabel={`${Math.round(tierProgress * 100)}%`}
              state={isZero ? "empty" : "default"}
              accessibilityLabel={`Tier progress: ${Math.round(tierProgress * 100)}%`}
              testID={testID ? `${testID}-ring` : undefined}
            />
          </View>
        )}

        {/* Earn section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isZero ? "How to earn" : "Earn more"}</Text>
          {isLoading ? (
            <>
              <SkeletonBox h={64} w="100%" mt={8} />
              <SkeletonBox h={64} w="100%" mt={8} />
              <SkeletonBox h={64} w="100%" mt={8} />
            </>
          ) : (
            earnActions.map((action) => (
              <Pressable
                key={action.id}
                style={styles.earnCard}
                onPress={() => onPressEarnAction(action)}
                accessibilityRole="button"
                accessibilityLabel={`${action.label} — earn ${formatPointsDelta(action.points)}`}
                testID={testID ? `${testID}-earn-${action.id}` : undefined}
              >
                <Text style={styles.earnIcon}>{action.icon === "calendar" ? "📅" : action.icon === "user-plus" ? "👥" : "⭐"}</Text>
                <Text style={styles.earnLabel}>{action.label}</Text>
                <Text style={styles.earnPoints}>{formatPointsDelta(action.points)}</Text>
              </Pressable>
            ))
          )}
        </View>

        {/* History section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          {isLoading ? (
            <>
              <SkeletonBox h={56} mt={8} />
              <SkeletonBox h={56} mt={8} />
              <SkeletonBox h={56} mt={8} />
            </>
          ) : historyEntries.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyIcon}>🎁</Text>
              <Text style={styles.h3}>No activity yet</Text>
              <Text style={styles.bodyMuted}>Complete your first booking to earn points</Text>
            </View>
          ) : (
            <FlatList
              data={historyEntries}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View
                  style={styles.historyRow}
                  accessible
                  accessibilityLabel={`${item.description}, ${formatHistoryDate(item.date)}, ${formatPointsDelta(item.delta)}`}
                >
                  <Text style={styles.historyDate}>{formatHistoryDate(item.date)}</Text>
                  <Text style={styles.historyDesc} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text
                    style={[
                      styles.historyDelta,
                      { color: item.delta >= 0 ? colors.success : colors.error },
                    ]}
                  >
                    {formatPointsDelta(item.delta)}
                  </Text>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
            />
          )}
        </View>

        {/* Bottom spacer so footer doesn't cover last item */}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Sticky footer */}
      {!isLoading && (
        <StickyFooterCta
          primaryLabel="Browse rewards"
          onPrimaryPress={onPressBrowseRewards}
          primaryTestID={testID ? `${testID}-view-rewards` : undefined}
          testID={testID ? `${testID}-footer` : undefined}
        />
      )}

      {/* Tier-up celebration modal */}
      {screenState === "tier-up" && newTier ? (
        <ModalSheet
          visible
          title=""
          onClose={onDismissTierUp ?? (() => {})}
          testID={testID ? `${testID}-tier-up-modal` : undefined}
        >
          <View style={styles.tierUpBody}>
            <Text style={styles.tierUpEmoji}>🎉</Text>
            <TierBadge tier={TIER_TO_VARIANT[newTier]} />
            <Text style={styles.tierUpHeading}>You reached {newTier}!</Text>
            <Text style={styles.tierUpSubBody}>Unlock exclusive rewards with your new tier.</Text>
            <Pressable
              style={styles.tierUpCta}
              onPress={onPressTierUpCta ?? onDismissTierUp}
              accessibilityRole="button"
              accessibilityLabel="Explore rewards"
              testID={testID ? `${testID}-tier-up-cta` : undefined}
            >
              <Text style={styles.tierUpCtaText}>Explore rewards</Text>
            </Pressable>
            <Pressable
              onPress={onDismissTierUp}
              accessibilityRole="button"
              accessibilityLabel="Maybe later"
              style={styles.tierUpDismiss}
              testID={testID ? `${testID}-tier-up-dismiss` : undefined}
            >
              <Text style={styles.tierUpDismissText}>Maybe later</Text>
            </Pressable>
          </View>
        </ModalSheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 56,
    paddingHorizontal: spacing.s4,
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  headerTitle: { ...textStyles.heading3, color: colors.foreground },
  scroll: { paddingBottom: spacing.s4 },
  heroPad: { paddingHorizontal: spacing.s4, paddingTop: spacing.s4 },
  heroCard: {
    marginHorizontal: spacing.s4,
    marginTop: spacing.s4,
    borderRadius: radius.xxl,
    backgroundColor: colors.accent,
    padding: spacing.s5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 160,
  },
  heroLeft: { flex: 1, gap: spacing.s2 },
  balance: { ...textStyles.heading1, color: colors.foreground },
  tierCopy: { ...textStyles.bodySmall, color: colors.textMuted },
  section: { paddingHorizontal: spacing.s4, paddingTop: spacing.s6 },
  sectionTitle: { ...textStyles.heading3, color: colors.foreground, marginBottom: spacing.s3 },
  earnCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    marginBottom: spacing.s2,
    minHeight: 64,
    gap: spacing.s3,
  },
  earnIcon: { fontSize: 20 },
  earnLabel: { ...textStyles.label, color: colors.foreground, flex: 1 },
  earnPoints: { ...textStyles.labelSmall, color: colors.primary },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s3,
    gap: spacing.s3,
    minHeight: 56,
  },
  historyDate: { ...textStyles.bodySmall, color: colors.textMuted, width: 74 },
  historyDesc: { ...textStyles.body, color: colors.foreground, flex: 1 },
  historyDelta: { ...textStyles.label },
  divider: { height: 1, backgroundColor: colors.border },
  emptyHistory: { alignItems: "center", paddingVertical: spacing.s10, gap: spacing.s2 },
  emptyIcon: { fontSize: 48 },
  centeredFill: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s8,
    gap: spacing.s3,
  },
  errorGlyph: { fontSize: 48, color: colors.error },
  h3: { ...textStyles.heading3, color: colors.foreground, textAlign: "center" },
  bodyMuted: { ...textStyles.body, color: colors.textMuted, textAlign: "center" },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s8,
    paddingVertical: spacing.s3,
    marginTop: spacing.s2,
  },
  retryBtnText: { ...textStyles.label, color: colors.white },
  tierUpBody: { alignItems: "center", paddingHorizontal: spacing.s6, paddingBottom: spacing.s6, gap: spacing.s4 },
  tierUpEmoji: { fontSize: 48 },
  tierUpHeading: { ...textStyles.heading2, color: colors.foreground, textAlign: "center" },
  tierUpSubBody: { ...textStyles.body, color: colors.textMuted, textAlign: "center" },
  tierUpCta: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s8,
    height: 48,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  tierUpCtaText: { ...textStyles.label, color: colors.white },
  tierUpDismiss: { marginTop: spacing.s1, paddingVertical: spacing.s2 },
  tierUpDismissText: { ...textStyles.label, color: colors.textMuted },
});
