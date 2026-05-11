/**
 * LoyaltyExtrasScreen.tsx — W31 Batch K (K.4)
 *
 * Exports:
 *   TierUpCelebrationScreen       — full-screen tier celebration + explore CTA
 *   RewardRedemptionConfirmScreen — reward summary + points deduction + confirm
 *   PointsExpiryWarningSheet      — ModalSheet warning about expiring points
 *   LoyaltyTermsPage              — LegalPageLayout with loyalty T&C
 */

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { LegalPageLayout, type LegalJumpLink } from "../../shared/ui/LegalPageLayout";
import { ModalSheet } from "../../shared/ui/ModalSheet";
import { RewardCard } from "../../shared/ui/RewardCard";
import { SummaryRow } from "../../shared/ui/SummaryRow";
import { TierUpCelebration, type LoyaltyTier } from "../../shared/ui/TierUpCelebration";
import { colors, radius, spacing } from "../../shared/ui/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TierUpCelebrationScreenProps = {
  newTier: LoyaltyTier;
  benefitHeadline?: string;
  onExploreBenefits: () => void;
  testID?: string;
};

export type RewardItem = {
  id: string;
  title: string;
  pointsCost: number;
  imageUri?: string;
};

export type RewardRedemptionConfirmScreenProps = {
  reward: RewardItem;
  currentPoints: number;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
};

export type PointsExpiryWarningSheetProps = {
  visible: boolean;
  expiringPoints: number;
  daysUntilExpiry: number;
  onUseNow: () => void;
  onDismiss: () => void;
  testID?: string;
};

export type LoyaltyTermsPageProps = {
  onClose: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// TierUpCelebrationScreen
// ---------------------------------------------------------------------------

export function TierUpCelebrationScreen({
  newTier,
  benefitHeadline,
  onExploreBenefits,
  testID,
}: TierUpCelebrationScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      {/* The primitive handles the full-screen modal overlay internally */}
      <TierUpCelebration
        visible
        newTier={newTier}
        benefitHeadline={benefitHeadline}
        onDismiss={onExploreBenefits}
        testID={testID ? `${testID}-celebrate` : undefined}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// RewardRedemptionConfirmScreen
// ---------------------------------------------------------------------------

export function RewardRedemptionConfirmScreen({
  reward,
  currentPoints,
  onConfirm,
  onCancel,
  testID,
}: RewardRedemptionConfirmScreenProps) {
  const remaining = currentPoints - reward.pointsCost;
  const canAfford = remaining >= 0;

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle} testID={testID ? `${testID}-title` : undefined}>
          Confirm redemption
        </Text>

        <RewardCard
          title={reward.title}
          points={reward.pointsCost}
          state="unlocked"
          onPress={() => {}}
          testID={testID ? `${testID}-card` : undefined}
        />

        <View style={styles.summaryBox}>
          <SummaryRow
            label="Your points"
            value={currentPoints.toLocaleString()}
            testID={testID ? `${testID}-current-points` : undefined}
          />
          <SummaryRow
            label="Points used"
            value={`−${reward.pointsCost.toLocaleString()}`}
            testID={testID ? `${testID}-cost` : undefined}
          />
          <View style={styles.summaryDivider} />
          <SummaryRow
            label="Remaining points"
            value={remaining.toLocaleString()}
            testID={testID ? `${testID}-remaining` : undefined}
          />
        </View>

        {!canAfford && (
          <Text style={styles.errorText} testID={testID ? `${testID}-error` : undefined}>
            You don't have enough points to redeem this reward.
          </Text>
        )}

        <View style={styles.ctaStack}>
          <Pressable
            onPress={onConfirm}
            disabled={!canAfford}
            accessibilityRole="button"
            style={[styles.primaryBtn, !canAfford && styles.btnDisabled]}
            testID={testID ? `${testID}-confirm` : undefined}
          >
            <Text style={styles.primaryBtnText}>Redeem reward</Text>
          </Pressable>
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            style={styles.ghostBtn}
            testID={testID ? `${testID}-cancel` : undefined}
          >
            <Text style={styles.ghostBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// PointsExpiryWarningSheet
// ---------------------------------------------------------------------------

export function PointsExpiryWarningSheet({
  visible,
  expiringPoints,
  daysUntilExpiry,
  onUseNow,
  onDismiss,
  testID,
}: PointsExpiryWarningSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      onClose={onDismiss}
      title="Points expiring soon"
      testID={testID}
    >
      <View style={styles.sheetContent}>
        <Text style={styles.expiryIcon}>⚠️</Text>
        <Text
          style={styles.expiryMessage}
          testID={testID ? `${testID}-message` : undefined}
        >
          <Text style={styles.expiryBold}>{expiringPoints.toLocaleString()} points</Text>
          {" "}will expire in{" "}
          <Text style={styles.expiryBold}>
            {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"}
          </Text>
          . Use them before they disappear!
        </Text>
        <Pressable
          onPress={onUseNow}
          accessibilityRole="button"
          style={styles.primaryBtn}
          testID={testID ? `${testID}-use-now` : undefined}
        >
          <Text style={styles.primaryBtnText}>Use now</Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          testID={testID ? `${testID}-dismiss` : undefined}
        >
          <Text style={styles.ghostBtnText}>Remind me later</Text>
        </Pressable>
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// LoyaltyTermsPage
// ---------------------------------------------------------------------------

const LOYALTY_SECTIONS = [
  {
    id: "earn",
    heading: "Earning points",
    body:
      "You earn 1 point for every $1 spent on services. Points are awarded automatically after each completed booking and are reflected in your account within 24 hours.",
  },
  {
    id: "tiers",
    heading: "Tier levels",
    body:
      "Tiers are Bronze (0–499 pts), Silver (500–1,499 pts), Gold (1,500–4,999 pts), and Platinum (5,000+ pts). Your tier is recalculated at the start of each calendar year based on points earned in the prior year.",
  },
  {
    id: "expiration",
    heading: "Points expiration",
    body:
      "Points expire 12 months after they are earned. You will receive a reminder notification 30 days before expiry. Expired points cannot be reinstated.",
  },
  {
    id: "redemption",
    heading: "Redemption",
    body:
      "Points can be redeemed for service discounts via the Rewards Catalog. A minimum balance of 100 points is required for redemption. Points redeemed are non-reversible once applied to a booking.",
  },
];

const JUMP_LINKS: LegalJumpLink[] = LOYALTY_SECTIONS.map((s) => ({
  id: s.id,
  label: s.heading,
}));

export function LoyaltyTermsPage({ onClose, testID }: LoyaltyTermsPageProps) {
  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <LegalPageLayout
        title="Loyalty Programme Terms"
        jumpLinks={JUMP_LINKS}
        lastUpdated="1 January 2026"
        onBack={onClose}
      >
        {LOYALTY_SECTIONS.map((s) => (
          <View key={s.id} style={styles.termsSection}>
            <Text style={styles.termsSectionHeading}>{s.heading}</Text>
            <Text style={styles.termsSectionBody}>{s.body}</Text>
          </View>
        ))}
      </LegalPageLayout>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: {
    padding: spacing.pageHorizontal,
    paddingTop: spacing.pageVertical,
    gap: spacing.s5,
  },
  pageTitle: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  summaryBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    gap: spacing.s3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryDivider: { height: 1, backgroundColor: colors.border },
  errorText: { fontSize: 14, color: colors.error },
  ctaStack: { gap: spacing.s3 },
  primaryBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 15, fontWeight: "600", color: colors.surface },
  btnDisabled: { opacity: 0.4 },
  ghostBtn: {
    height: spacing.touchTarget,
    justifyContent: "center",
    alignItems: "center",
  },
  ghostBtnText: { fontSize: 15, color: colors.textMuted, textAlign: "center" },
  // Expiry sheet
  sheetContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s6,
    alignItems: "center",
    gap: spacing.s4,
  },
  expiryIcon: { fontSize: 40 },
  expiryMessage: {
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 22,
    textAlign: "center",
  },
  expiryBold: { fontWeight: "700" },
  // Terms
  termsSection: { gap: spacing.s2, marginBottom: spacing.s4 },
  termsSectionHeading: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.foreground,
  },
  termsSectionBody: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
