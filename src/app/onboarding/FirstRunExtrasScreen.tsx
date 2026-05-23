/**
 * FirstRunExtrasScreen.tsx — W32 Batch L (L.3)
 *
 * First-run and re-engagement surfaces.
 *
 * Exports:
 *   CoachMarkTutorialOverlay  — 5-step in-app tutorial using CoachMark
 *   WhatsNewSheet             — bottom sheet showing release highlights
 *   RateTheAppScreen          — page-level wrapper for RateTheAppPrompt
 *   InviteFriendsSheet        — share sheet for app referral / invite friends
 */

import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CoachMark } from "../../shared/ui/CoachMark";
import { ModalSheet } from "../../shared/ui/ModalSheet";
import { RateTheAppPrompt } from "../../shared/ui/RateTheAppPrompt";
import { colors, radius, spacing } from "../../shared/ui/tokens";

// ---------------------------------------------------------------------------
// CoachMarkTutorialOverlay
// ---------------------------------------------------------------------------

const TUTORIAL_STEPS = [
  {
    title: "Welcome to Zarkili",
    body: "Discover and book beauty services in seconds. Let's show you around.",
  },
  {
    title: "Find your salon",
    body: "Browse salons near you, filter by service, price, and ratings.",
  },
  {
    title: "Book in a tap",
    body: "See real-time availability and confirm your booking without calls.",
  },
  {
    title: "Earn rewards",
    body: "Every booking earns Zarkili points. Redeem them for discounts.",
  },
  {
    title: "Stay connected",
    body: "Get reminders, message your salon, and manage your bookings any time.",
  },
];

export type CoachMarkTutorialOverlayProps = {
  visible: boolean;
  onComplete: () => void;
  testID?: string;
};

export function CoachMarkTutorialOverlay({
  visible,
  onComplete,
  testID,
}: CoachMarkTutorialOverlayProps) {
  const [step, setStep] = useState(0);

  function handleNext() {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setStep(0);
      onComplete();
    }
  }

  function handleSkip() {
    setStep(0);
    onComplete();
  }

  const current = TUTORIAL_STEPS[step];

  return (
    <CoachMark
      visible={visible}
      step={step}
      totalSteps={TUTORIAL_STEPS.length}
      title={current.title}
      body={current.body}
      primaryLabel="Next"
      onNext={handleNext}
      onSkip={handleSkip}
      testID={testID}
    />
  );
}

// ---------------------------------------------------------------------------
// WhatsNewSheet
// ---------------------------------------------------------------------------

export type WhatsNewFeature = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export type WhatsNewSheetProps = {
  visible: boolean;
  version: string;
  features: WhatsNewFeature[];
  onDismiss: () => void;
  testID?: string;
};

export function WhatsNewSheet({
  visible,
  version,
  features,
  onDismiss,
  testID,
}: WhatsNewSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      onClose={onDismiss}
      title={`What's new in ${version}`}
      testID={testID}
    >
      <ScrollView
        style={styles.whatsNewScroll}
        contentContainerStyle={styles.whatsNewContent}
        showsVerticalScrollIndicator={false}
      >
        {features.map((f) => (
          <View
            key={f.id}
            style={styles.featureRow}
            testID={testID ? `${testID}-feature-${f.id}` : undefined}
          >
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.description}</Text>
            </View>
          </View>
        ))}

        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          style={styles.continueBtn}
          testID={testID ? `${testID}-continue` : undefined}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </Pressable>
      </ScrollView>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// RateTheAppScreen
// ---------------------------------------------------------------------------

export type RateTheAppScreenProps = {
  onRateOnStore: (rating: number) => void;
  onDismiss: () => void;
  testID?: string;
};

export function RateTheAppScreen({
  onRateOnStore,
  onDismiss,
  testID,
}: RateTheAppScreenProps) {
  return (
    <RateTheAppPrompt
      visible
      onRateOnStore={onRateOnStore}
      onDismiss={onDismiss}
      testID={testID}
    />
  );
}

// ---------------------------------------------------------------------------
// InviteFriendsSheet
// ---------------------------------------------------------------------------

type ShareTarget = { id: string; label: string; icon: string };

const DEFAULT_SHARE_TARGETS: ShareTarget[] = [
  { id: "message", label: "Messages", icon: "💬" },
  { id: "whatsapp", label: "WhatsApp", icon: "📱" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "copy", label: "Copy link", icon: "🔗" },
  { id: "more", label: "More options", icon: "•••" },
];

export type InviteFriendsSheetProps = {
  visible: boolean;
  referralCode: string;
  referralUrl: string;
  onDismiss: () => void;
  testID?: string;
};

export function InviteFriendsSheet({
  visible,
  referralCode,
  referralUrl,
  onDismiss,
  testID,
}: InviteFriendsSheetProps) {
  async function handleNativeShare() {
    try {
      await Share.share({
        message: `Join me on Zarkili! Use my code ${referralCode} and get a free service credit.\n${referralUrl}`,
        url: referralUrl,
      });
    } catch {
      // share cancelled
    }
  }

  return (
    <ModalSheet
      visible={visible}
      onClose={onDismiss}
      title="Invite friends"
      testID={testID}
    >
      <View style={styles.inviteBody}>
        <View style={styles.referralBox} testID={testID ? `${testID}-code-box` : undefined}>
          <Text style={styles.referralLabel}>Your invite code</Text>
          <Text style={styles.referralCode} testID={testID ? `${testID}-code` : undefined}>
            {referralCode}
          </Text>
          <Text style={styles.referralSubtitle}>
            Your friend gets a credit. You get one too after their first booking.
          </Text>
        </View>

        <View style={styles.shareTargets}>
          {DEFAULT_SHARE_TARGETS.map((t) => (
            <Pressable
              key={t.id}
              style={styles.shareTargetRow}
              onPress={t.id === "more" ? handleNativeShare : () => {}}
              accessibilityRole="button"
              accessibilityLabel={t.label}
              testID={testID ? `${testID}-target-${t.id}` : undefined}
            >
              <Text style={styles.shareTargetIcon}>{t.icon}</Text>
              <Text style={styles.shareTargetLabel}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          testID={testID ? `${testID}-dismiss` : undefined}
        >
          <Text style={styles.dismissText}>Not now</Text>
        </Pressable>
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  whatsNewScroll: { maxHeight: 440 },
  whatsNewContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s6,
    gap: spacing.s4,
  },
  featureRow: {
    flexDirection: "row",
    gap: spacing.s3,
    alignItems: "flex-start",
  },
  featureIcon: { fontSize: 28, width: 36, textAlign: "center" },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  featureDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: 2 },
  continueBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.s2,
  },
  continueBtnText: { fontSize: 15, fontWeight: "600", color: colors.surface },
  inviteBody: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s6,
    gap: spacing.s5,
    alignItems: "center",
  },
  referralBox: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.s4,
    alignItems: "center",
    gap: spacing.s1,
    width: "100%",
  },
  referralLabel: { fontSize: 12, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  referralCode: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 4,
  },
  referralSubtitle: { fontSize: 12, color: colors.textMuted, textAlign: "center" },
  shareTargets: { width: "100%", gap: spacing.s1 },
  shareTargetRow: {
    flexDirection: "row",
    alignItems: "center",
    height: spacing.touchTarget,
    gap: spacing.s3,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareTargetIcon: { fontSize: 20, width: 28, textAlign: "center" },
  shareTargetLabel: { fontSize: 15, color: colors.foreground },
  dismissText: { fontSize: 13, color: colors.textMuted },
});
