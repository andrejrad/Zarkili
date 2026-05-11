/**
 * ClientOnboardingLoyaltyScreen.tsx — client onboarding step: loyalty.
 *
 * Presents the Zarkili loyalty programme overview and asks the user to opt in.
 * Tapping "Join programme" writes `loyaltyOptIn: true` to their profile and
 * advances the wizard. Tapping "Skip" advances without opting in.
 */

import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, Stepper, colors, radius, spacing } from "../../shared/ui";
import { LOYALTY_TIERS, TIER_THRESHOLDS } from "../loyalty/loyaltyHelpers";

export type ClientOnboardingLoyaltyScreenProps = {
  totalSteps: number;
  currentStep: number;
  /** Called with true when the user opts in, false if they skip. */
  onContinue: (optIn: boolean) => Promise<void>;
  onSkip?: () => void;
};

const TIER_BENEFITS: Record<string, string> = {
  Bronze: "Earn 1 pt per $1 spent",
  Silver: "10% birthday discount",
  Gold: "Priority booking + free add-on",
  Platinum: "Dedicated concierge",
};

export function ClientOnboardingLoyaltyScreen({
  totalSteps,
  currentStep,
  onContinue,
  onSkip,
}: ClientOnboardingLoyaltyScreenProps) {
  async function handleJoin() {
    await onContinue(true);
  }

  async function handleSkip() {
    if (onSkip) {
      onSkip();
    } else {
      await onContinue(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="loyalty-stepper" />

      <Text style={styles.heading} accessibilityRole="header">
        Join Zarkili Rewards
      </Text>
      <Text style={styles.subtitle}>
        Earn points every time you book. Redeem for discounts, free services and exclusive perks.
      </Text>

      <View style={styles.tiersCard}>
        {LOYALTY_TIERS.map((tier) => (
          <View key={tier} style={styles.tierRow} accessibilityLabel={`${tier} tier`}>
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>{tier.charAt(0)}</Text>
            </View>
            <View style={styles.tierInfo}>
              <Text style={styles.tierName}>{tier}</Text>
              <Text style={styles.tierPoints}>
                {TIER_THRESHOLDS[tier] === 0
                  ? "Starting tier"
                  : `From ${TIER_THRESHOLDS[tier].toLocaleString("en-US")} pts`}
              </Text>
              <Text style={styles.tierBenefit}>{TIER_BENEFITS[tier]}</Text>
            </View>
          </View>
        ))}
      </View>

      <Banner
        variant="info"
        message="You can change your loyalty preferences at any time in Settings → Loyalty."
      />

      <View style={styles.actions}>
        <Button
          label="Join the programme"
          onPress={() => void handleJoin()}
          testID="loyalty-join"
        />
        <Button
          variant="secondary"
          label="Skip for now"
          onPress={() => void handleSkip()}
          testID="loyalty-skip"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.s6, gap: spacing.s4 },
  heading: { fontSize: 24, fontWeight: "700", color: colors.foreground, marginTop: spacing.s4 },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  tiersCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.s4,
    gap: spacing.s4,
  },
  tierRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.s3 },
  tierBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tierBadgeText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  tierInfo: { flex: 1, gap: 2 },
  tierName: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  tierPoints: { fontSize: 12, color: colors.textMuted },
  tierBenefit: { fontSize: 13, color: colors.foreground },
  actions: { gap: spacing.s3, marginTop: spacing.s3 },
});
