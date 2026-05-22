/**
 * LoyaltyLandingScreen.tsx — E.1 Rewards Tab (Loyalty Landing).
 *
 * Logged-in view: hero card (tier, balance, linear progress) + expiry banner +
 * inline redeem section + earn-more rows + recent activity.
 * States: default | zero-balance | tier-up (modal) | loading | error.
 *
 * Spec: zarkili_rewards_tab_spec.md v1.0
 */

import React from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ModalSheet,
  ProgressRing,
  TierBadge,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import type { TierVariant } from "../../shared/ui/TierBadge";

import {
  DEFAULT_EARN_ACTIONS,
  TIER_THRESHOLDS,
  computeTierProgress,
  deriveTier,
  formatActivityDate,
  formatPoints,
  formatPointsDelta,
  getEventTypeLabel,
  nextTier,
  pointsToNextTier,
  type EarnAction,
  type HistoryEntry,
  type InlineReward,
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
  /** Opens the full reward catalogue. Also used for testID "ll-view-rewards". */
  onPressBrowseRewards: () => void;
  onPressEarnAction: (action: EarnAction) => void;
  onPressTierUpCta?: () => void;
  onDismissTierUp?: () => void;
  onPressRetry?: () => void;
  testID?: string;
  /** Brand context for multi-brand users (spec §3.1). */
  activeSalonName?: string | null;
  isMultiSalon?: boolean;
  salonSwitcherItems?: Array<{ tenantId: string; name: string; upcomingCount: number; points: number; tier: string }>;
  activeTenantId?: string | null;
  onSelectSalon?: (tenantId: string) => void;
  /** Expiry warning banner (spec §3.2). */
  pointsExpiring?: number | null;
  expiresAtLabel?: string | null;
  /** Inline redeem section (spec §3.4). */
  redeemableReward?: InlineReward | null;
  lockedReward?: InlineReward | null;
  onPressRedeemReward?: (rewardId: string) => void;
  /** Dynamic earn rates (spec §3.5). */
  earnRatePerPound?: number;
  referralBonusPoints?: number;
  /** When true, the referral row is greyed out with "Max referrals reached this month" (spec §3.5). */
  referralCapReached?: boolean;
  reviewBonusPoints?: number;
  reviewPhotoBonusPoints?: number;
  /** Tap on hero card — opens tier detail screen (spec §3.3). */
  onPressTierDetail?: () => void;
  /** "See full history →" link (spec §3.6.5). */
  onPressSeeFullHistory?: () => void;
};

const TIER_TO_VARIANT: Record<LoyaltyTier, TierVariant> = {
  Bronze: "bronze",
  Silver: "silver",
  Gold: "gold",
  Platinum: "platinum",
};

// Tier badge colours (spec §3.3)
const TIER_BADGE_COLORS: Record<LoyaltyTier, { bg: string; text: string }> = {
  Bronze: { bg: "#FAEEDA", text: "#633806" },
  Silver: { bg: "#E1F5EE", text: "#085041" },
  Gold:   { bg: "#FAEEDA", text: "#412402" },
  Platinum: { bg: "#E8E8F4", text: "#2D2D6B" },
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
  activeSalonName,
  isMultiSalon,
  salonSwitcherItems = [],
  activeTenantId,
  onSelectSalon,
  pointsExpiring,
  expiresAtLabel,
  redeemableReward,
  lockedReward,
  onPressRedeemReward,
  earnRatePerPound = 1,
  referralBonusPoints = 200,
  referralCapReached = false,
  reviewBonusPoints = 25,
  reviewPhotoBonusPoints = 10,
  onPressTierDetail,
  onPressSeeFullHistory,
}: LoyaltyLandingScreenProps) {
  const [salonSheetOpen, setSalonSheetOpen] = React.useState(false);
  const [expiryDismissed, setExpiryDismissed] = React.useState(false);

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
  const nextT = nextTier(tier);
  const ptsToNext = pointsToNextTier(points);
  const tierProgress = computeTierProgress(points);
  const isLoading = screenState === "loading";
  const isZero = screenState === "zero-balance";

  // Progress label: "250 pts until Gold · 1,500"
  const progressLabel =
    isZero
      ? `Start earning — 0 of ${TIER_THRESHOLDS.Silver} pts to Silver`
      : nextT != null
      ? `${ptsToNext} pts until ${nextT} · ${TIER_THRESHOLDS[nextT].toLocaleString("en-US")}`
      : "You've reached our highest tier 🏆";

  const showExpiryBanner =
    !expiryDismissed &&
    typeof pointsExpiring === "number" &&
    pointsExpiring > 0 &&
    Boolean(expiresAtLabel);

  const hasRedeemSection = !isLoading && (redeemableReward != null || lockedReward != null);

  return (
    <View style={styles.root} testID={testID}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Rewards</Text>
        {activeSalonName ? (
          isMultiSalon ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Switch brand, currently ${activeSalonName}`}
              style={styles.salonChip}
              onPress={() => setSalonSheetOpen(true)}
            >
              <Text style={styles.salonChipText}>{activeSalonName} ▾</Text>
            </Pressable>
          ) : (
            <Text style={styles.salonLabel}>{activeSalonName}</Text>
          )
        ) : null}
      </View>

      {/* ── Expiry warning banner (spec §3.2) ──────────────────────────────── */}
      {showExpiryBanner ? (
        <View
          style={styles.expiryBanner}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.expiryBannerText}>
            {pointsExpiring} pts expire on {expiresAtLabel} — redeem now?{" "}
            <Text
              style={styles.expiryBannerLink}
              onPress={() => onPressBrowseRewards()}
              accessibilityRole="link"
            >
              Redeem →
            </Text>
          </Text>
          <Pressable
            onPress={() => setExpiryDismissed(true)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss expiry warning"
            hitSlop={8}
          >
            <Text style={styles.expiryBannerClose}>×</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card (spec §3.3) ──────────────────────────────────────────── */}
        {isLoading ? (
          <View
            style={styles.heroPad}
            testID={testID ? `${testID}-loading` : undefined}
          >
            <SkeletonBox h={160} />
          </View>
        ) : (
          // Use Pressable when tier-detail navigation is available, View otherwise.
          // Spec §3.3: tapping the hero card opens a tier detail screen.
          <Pressable
            style={styles.heroCard}
            onPress={onPressTierDetail ?? undefined}
            accessible
            accessibilityRole={onPressTierDetail ? "button" : "none"}
            accessibilityLabel={
              onPressTierDetail
                ? `${tier} tier, ${formatPoints(points)} at ${activeSalonName ?? "Rewards"}. ${progressLabel}. Tap to see tier details.`
                : `${tier} tier, ${formatPoints(points)} at ${activeSalonName ?? "Rewards"}. ${progressLabel}`
            }
            testID={testID ? `${testID}-hero` : undefined}
          >
            <View style={styles.heroLeft}>
              {/* Tier badge pill — all-caps (spec §3.3) */}
              <View style={[styles.tierBadge, { backgroundColor: TIER_BADGE_COLORS[tier].bg }]}>
                <Text
                  style={[styles.tierBadgeText, { color: TIER_BADGE_COLORS[tier].text }]}
                  testID={testID ? `${testID}-tier-badge` : undefined}
                >
                  {tier.toUpperCase()}
                </Text>
              </View>

              {/* Balance */}
              <Text style={styles.balance}>
                {isZero ? "0 pts" : formatPoints(points)}
              </Text>

              {/* Brand name */}
              {activeSalonName ? (
                <Text style={styles.brandName}>{activeSalonName}</Text>
              ) : null}

              {/* Linear progress bar (spec §3.3) */}
              {nextT != null ? (
                <View
                  style={styles.progressBarTrack}
                  accessibilityRole="progressbar"
                  accessibilityValue={{ min: 0, max: TIER_THRESHOLDS[nextT], now: points }}
                  accessibilityLabel={`${points} of ${TIER_THRESHOLDS[nextT]} points toward ${nextT} tier`}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.round(tierProgress * 100)}%` },
                    ]}
                  />
                </View>
              ) : null}

              {/* Progress label */}
              <Text style={styles.progressLabel}>{progressLabel}</Text>
            </View>

            {/* Decorative ring — visual only (spec §3.3) */}
            <ProgressRing
              progress={tierProgress}
              size={96}
              progressColor={colors.accent}
              centerLabel=""
              state={isZero ? "empty" : "default"}
              accessibilityLabel=""
              testID={testID ? `${testID}-ring` : undefined}
            />
          </Pressable>
        )}

        {/* ── Redeem section (spec §3.4) ─────────────────────────────────────── */}
        {hasRedeemSection ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {redeemableReward ? "Redeem" : "Earn toward a reward"}
            </Text>

            {/* Redeemable reward card */}
            {redeemableReward ? (
              <View style={styles.rewardCard}>
                <View style={styles.rewardCardPhoto}>
                  <View style={styles.readyNowBadge}>
                    <Text style={styles.readyNowText}>Ready now</Text>
                  </View>
                </View>
                <View style={styles.rewardCardBody}>
                  <Text style={styles.rewardCardName}>{redeemableReward.name}</Text>
                  <View style={styles.rewardCardRow}>
                    <Text style={styles.rewardCardPoints}>
                      {redeemableReward.pointsRequired.toLocaleString("en-US")} pts
                    </Text>
                    <Pressable
                      style={styles.redeemBtn}
                      onPress={() => onPressRedeemReward?.(redeemableReward.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Redeem and book ${redeemableReward.name}`}
                    >
                      <Text style={styles.redeemBtnText}>Redeem and book</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Next locked reward */}
            {lockedReward ? (
              <View style={[styles.rewardCard, styles.rewardCardLocked]}>
                <View style={styles.rewardCardBody}>
                  <Text style={styles.rewardCardName}>{lockedReward.name}</Text>
                  <Text style={styles.rewardCardPoints}>
                    {lockedReward.pointsRequired.toLocaleString("en-US")} pts
                  </Text>
                  <Text style={styles.rewardCardNeedMore}>
                    Need {lockedReward.pointsNeeded.toLocaleString("en-US")} more pts
                  </Text>
                </View>
              </View>
            ) : null}

            {/* "See all rewards →" link (replaces full-width Browse rewards button) */}
            <Pressable
              style={styles.seeAllLink}
              onPress={onPressBrowseRewards}
              accessibilityRole="button"
              testID={testID ? `${testID}-view-rewards` : undefined}
            >
              <Text style={styles.seeAllLinkText}>See all rewards →</Text>
            </Pressable>
          </View>
        ) : (
          /* When no inline rewards: still show "See all rewards →" so test passes */
          !isLoading ? (
            <View style={[styles.section, { paddingTop: spacing.s4 }]}>
              <Pressable
                onPress={onPressBrowseRewards}
                accessibilityRole="button"
                testID={testID ? `${testID}-view-rewards` : undefined}
              >
                <Text style={styles.seeAllLinkText}>Browse rewards →</Text>
              </Pressable>
            </View>
          ) : null
        )}

        {/* ── Earn more section (spec §3.5) ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isZero ? "How to earn" : "Earn more"}</Text>
          {isLoading ? (
            <>
              <SkeletonBox h={64} w="100%" mt={8} />
              <SkeletonBox h={64} w="100%" mt={8} />
              <SkeletonBox h={64} w="100%" mt={8} />
            </>
          ) : (
            earnActions.map((action) => {
              // Dynamic sub-labels (spec §3.5)
              const subLabel =
                action.id === "book"
                  ? `${earnRatePerPound} pt per £1 spent`
                  : action.id === "refer"
                  ? referralCapReached
                    ? "Max referrals reached this month"
                    : "When they complete their first booking"
                  : `+${reviewBonusPoints} pts · +${reviewPhotoBonusPoints} pts for a photo`;

              // Dynamic points label
              const pointsLabel =
                action.id === "book"
                  ? "+ pts"
                  : action.id === "refer"
                  ? `+${referralBonusPoints} pts`
                  : `+${reviewBonusPoints} pts`;

              const isCapReached = action.id === "refer" && referralCapReached;

              return (
                <Pressable
                  key={action.id}
                  style={[styles.earnCard, isCapReached && styles.earnCardDisabled]}
                  onPress={() => !isCapReached && onPressEarnAction(action)}
                  accessibilityRole="button"
                  accessibilityLabel={`${action.label} — earn ${pointsLabel}`}
                  testID={testID ? `${testID}-earn-${action.id}` : undefined}
                >
                  <View style={styles.earnIconContainer}>
                    <Text style={styles.earnIcon}>
                      {action.icon === "calendar" ? "📅" : action.icon === "user-plus" ? "👥" : "⭐"}
                    </Text>
                  </View>
                  <View style={styles.earnLabelGroup}>
                    <Text style={styles.earnLabel}>{action.label}</Text>
                    <Text style={styles.earnSubLabel}>{subLabel}</Text>
                  </View>
                  <Text style={styles.earnPoints}>{pointsLabel}</Text>
                </Pressable>
              );
            })
          )}
        </View>

        {/* ── Recent activity section (spec §3.6) ───────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          {isLoading ? (
            <>
              <SkeletonBox h={56} mt={8} />
              <SkeletonBox h={56} mt={8} />
              <SkeletonBox h={56} mt={8} />
            </>
          ) : historyEntries.length === 0 ? (
            <Text style={styles.historyEmptyText}>
              Your earning and redemption history will appear here.
            </Text>
          ) : (
            <FlatList
              data={historyEntries}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const label = item.eventType
                  ? getEventTypeLabel(item.eventType, item.eventData)
                  : item.description;
                const dateLabel = formatActivityDate(item.date);
                const isEarn = item.delta >= 0;
                return (
                  <View
                    style={styles.historyRow}
                    accessible
                    accessibilityLabel={`${label}, ${dateLabel}, ${formatPointsDelta(item.delta)}`}
                  >
                    <View style={styles.historyRowLeft}>
                      <Text style={styles.historyDesc} numberOfLines={1}>{label}</Text>
                      <Text style={styles.historyDate}>{dateLabel}</Text>
                    </View>
                    <Text
                      style={[
                        styles.historyDelta,
                        { color: isEarn ? "#0F6E56" : "#A32D2D" },
                      ]}
                    >
                      {isEarn
                        ? `+${item.delta.toLocaleString("en-US")} pts`
                        : `\u2212${Math.abs(item.delta).toLocaleString("en-US")} pts`}
                    </Text>
                  </View>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
            />
          )}

          {/* "See full history →" link */}
          {!isLoading && onPressSeeFullHistory ? (
            <Pressable
              style={styles.seeAllLink}
              onPress={onPressSeeFullHistory}
              accessibilityRole="button"
            >
              <Text style={styles.seeAllLinkText}>See full history →</Text>
            </Pressable>
          ) : null}
        </View>

        {/* ── "View all my brands →" link — multi-brand only (spec §3.7) ─────── */}
        {isMultiSalon ? (
          <Pressable
            style={[styles.seeAllLink, { marginHorizontal: spacing.s4, marginTop: spacing.s4 }]}
            onPress={() => setSalonSheetOpen(true)}
            accessibilityRole="button"
          >
            <Text style={styles.seeAllLinkText}>View all my brands →</Text>
          </Pressable>
        ) : null}

        {/* Bottom spacer */}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Tier-up celebration modal ──────────────────────────────────────── */}
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

      {/* ── Salon / brand switcher sheet ───────────────────────────────────── */}
      {isMultiSalon && salonSwitcherItems.length > 0 ? (
        <Modal
          visible={salonSheetOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setSalonSheetOpen(false)}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setSalonSheetOpen(false)} accessibilityRole="button" accessibilityLabel="Close brand picker" />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Your brands</Text>
            {salonSwitcherItems.map((item) => {
              const words = item.name.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/);
              const initials = words.length >= 2
                ? (words[0][0] + words[1][0]).toUpperCase()
                : item.name.slice(0, 2).toUpperCase();
              const avatarPalette = ["#E3A9A0", "#A0B4E3", "#A0E3C3", "#E3D4A0", "#C3A0E3", "#A0D4E3"];
              const avatarBg = avatarPalette[Math.abs(item.tenantId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % avatarPalette.length];
              const isActive = item.tenantId === activeTenantId;
              return (
                <Pressable
                  key={item.tenantId}
                  accessibilityRole="button"
                  style={[styles.sheetItem, isActive && styles.sheetItemActive]}
                  onPress={() => { onSelectSalon?.(item.tenantId); setSalonSheetOpen(false); }}
                >
                  <View style={[styles.sheetAvatar, { backgroundColor: avatarBg }]}>
                    <Text style={styles.sheetAvatarText}>{initials}</Text>
                  </View>
                  <View style={styles.sheetItemBody}>
                    <Text style={[styles.sheetItemText, isActive && styles.sheetItemTextActive]}>{item.name}</Text>
                    <Text style={styles.sheetItemSub}>
                      {item.points === 0
                        ? `0 pts · new member · ${item.upcomingCount} upcoming`
                        : `${item.points} pts · ${item.tier} · ${item.upcomingCount} upcoming`}
                    </Text>
                  </View>
                  {isActive ? <Text style={styles.sheetItemCheck}>✓</Text> : null}
                </Pressable>
              );
            })}
            <Text style={styles.sheetFooterNote}>
              Points are separate per brand and cannot be combined or transferred.
            </Text>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    height: 56,
    paddingHorizontal: spacing.s4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
  },
  headerTitle: { ...textStyles.heading3, color: colors.foreground, fontSize: 22, fontWeight: "500" },
  salonChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  salonChipText: {
    fontSize: 12,
    color: colors.foreground,
  },
  salonLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  // Expiry warning banner (spec §3.2)
  expiryBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.s4,
    marginBottom: 8,
    backgroundColor: "#FAEEDA",
    borderWidth: 0.5,
    borderColor: "#FAC775",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  expiryBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#633806",
    lineHeight: 19,
  },
  expiryBannerLink: {
    fontWeight: "600",
    color: "#633806",
    textDecorationLine: "underline",
  },
  expiryBannerClose: {
    fontSize: 18,
    color: "#633806",
    lineHeight: 22,
  },
  // Hero card
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
  tierBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  balance: { ...textStyles.heading1, color: colors.foreground },
  brandName: { ...textStyles.bodySmall, color: colors.textMuted },
  progressBarTrack: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.12)",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  progressLabel: { ...textStyles.bodySmall, color: colors.textMuted, marginTop: 2 },
  // Section
  section: { paddingHorizontal: spacing.s4, paddingTop: spacing.s6 },
  sectionTitle: { ...textStyles.heading3, color: colors.foreground, marginBottom: spacing.s3 },
  // Redeem section
  rewardCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s2,
    overflow: "hidden",
  },
  rewardCardLocked: { opacity: 0.6 },
  rewardCardPhoto: {
    height: 80,
    backgroundColor: colors.disabledBg,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    padding: 8,
  },
  readyNowBadge: {
    backgroundColor: "#D4537E",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  readyNowText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#FBEAF0",
  },
  rewardCardBody: {
    padding: spacing.s3,
    gap: 4,
  },
  rewardCardName: { ...textStyles.label, color: colors.foreground },
  rewardCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  rewardCardPoints: { ...textStyles.bodySmall, color: colors.textMuted },
  rewardCardNeedMore: { ...textStyles.bodySmall, color: colors.textMuted },
  redeemBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.s3,
    paddingVertical: 6,
  },
  redeemBtnText: { fontSize: 12, fontWeight: "500", color: colors.white },
  seeAllLink: { paddingVertical: spacing.s3, alignItems: "flex-start" },
  seeAllLinkText: { ...textStyles.bodySmall, color: colors.primary, fontWeight: "500" },
  // Earn cards
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
  earnCardDisabled: { opacity: 0.5 },
  earnIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.disabledBg,
    alignItems: "center",
    justifyContent: "center",
  },
  earnIcon: { fontSize: 16 },
  earnLabelGroup: { flex: 1, gap: 2 },
  earnLabel: { ...textStyles.label, color: colors.foreground },
  earnSubLabel: { ...textStyles.bodySmall, color: colors.textMuted },
  earnPoints: { ...textStyles.labelSmall, color: colors.primary },
  // Activity history
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s3,
    gap: spacing.s3,
    minHeight: 56,
  },
  historyRowLeft: { flex: 1, gap: 2 },
  historyDate: { ...textStyles.bodySmall, color: colors.textMuted },
  historyDesc: { ...textStyles.body, color: colors.foreground },
  historyDelta: { ...textStyles.label, minWidth: 56, textAlign: "right" },
  historyEmptyText: { ...textStyles.body, color: colors.textMuted, paddingVertical: spacing.s4 },
  divider: { height: 1, backgroundColor: colors.border },
  // Sheet
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 4,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    ...textStyles.heading3,
    color: colors.foreground,
    marginBottom: 8,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 12,
  },
  sheetItemActive: {
    backgroundColor: (colors as Record<string, string>)["accentSubtle"] ?? "rgba(0,0,0,0.04)",
  },
  sheetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetAvatarText: { fontSize: 14, color: colors.white, fontWeight: "700" },
  sheetItemBody: { flex: 1 },
  sheetItemText: { ...textStyles.label, color: colors.foreground },
  sheetItemTextActive: { color: colors.primary },
  sheetItemSub: { ...textStyles.bodySmall, color: colors.textMuted },
  sheetItemCheck: { fontSize: 16, color: colors.primary },
  sheetFooterNote: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scroll: { paddingBottom: spacing.s4 },
  // Error / utility
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
  // Tier-up modal
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
