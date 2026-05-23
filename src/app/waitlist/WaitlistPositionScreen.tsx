/**
 * WaitlistPositionScreen.tsx — F.7 Waitlist Position.
 *
 * Hero: position # heading1 + "in line for {serviceName}".
 * Salon mini-card (name + address).
 * Estimated wait body.
 * Slot offer banner (variant="success") when position.slotOffer exists —
 *   with formatWaitlistCountdown(expiresAt) + "Book now" CTA.
 * Update preferences button (secondary).
 * Leave waitlist button (destructive).
 */

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Banner,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import {
  WaitlistPositionData,
  formatPositionLabel,
  formatWaitlistCountdown,
} from "../messaging/messagingHelpers";

export type WaitlistPositionScreenProps = {
  position: WaitlistPositionData;
  onUpdatePreferences: () => void;
  onLeaveWaitlist: () => void;
  onAcceptOffer?: () => void;
  onDeclineOffer?: () => void;
  isLeaving?: boolean;
  testID?: string;
};

export function WaitlistPositionScreen({
  position,
  onUpdatePreferences,
  onLeaveWaitlist,
  onAcceptOffer,
  onDeclineOffer,
  isLeaving,
  testID,
}: WaitlistPositionScreenProps) {
  const countdown =
    position.slotOffer ? formatWaitlistCountdown(position.slotOffer.expiresAt) : null;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      {/* Hero */}
      <View style={styles.heroSection}>
        <Text
          style={styles.positionNumber}
          accessibilityRole="header"
          testID={testID ? `${testID}-position` : undefined}
        >
          {formatPositionLabel(position.positionNumber)}
        </Text>
        <Text style={styles.positionLabel}>in line for</Text>
        <Text style={styles.serviceName}>{position.serviceName}</Text>
      </View>

      {/* Slot offer banner */}
      {position.slotOffer ? (
        <Banner
          variant="success"
          title="A slot is available!"
          message={`Book now — offer expires in ${countdown ?? "soon"}.`}
          actionLabel="Book now"
          onAction={onAcceptOffer}
          testID={testID ? `${testID}-slot-offer` : undefined}
        />
      ) : null}

      {/* Salon mini-card */}
      <View style={styles.salonCard}>
        <Text style={styles.salonCardName}>{position.salonName}</Text>
        {position.salonAddress ? (
          <Text style={styles.salonCardAddress}>{position.salonAddress}</Text>
        ) : null}
      </View>

      {/* Estimated wait */}
      {position.estimatedWait ? (
        <View style={styles.estimateRow}>
          <Text style={styles.estimateLabel}>Estimated wait</Text>
          <Text style={styles.estimateValue}>{position.estimatedWait}</Text>
        </View>
      ) : null}

      {/* Spacer */}
      <View style={styles.actionsSection}>
        {/* Update preferences */}
        <Pressable
          style={styles.secondaryBtn}
          onPress={onUpdatePreferences}
          accessibilityRole="button"
          accessibilityLabel="Update waitlist preferences"
          testID={testID ? `${testID}-update-prefs` : undefined}
        >
          <Text style={styles.secondaryBtnText}>Update preferences</Text>
        </Pressable>

        {/* Decline slot offer */}
        {position.slotOffer && onDeclineOffer ? (
          <Pressable
            style={styles.ghostBtn}
            onPress={onDeclineOffer}
            accessibilityRole="button"
            accessibilityLabel="Decline slot offer"
            testID={testID ? `${testID}-decline-offer` : undefined}
          >
            <Text style={styles.ghostBtnText}>Decline offer</Text>
          </Pressable>
        ) : null}

        {/* Leave waitlist */}
        <Pressable
          style={[styles.destructiveBtn, isLeaving && styles.btnDisabled]}
          onPress={onLeaveWaitlist}
          disabled={isLeaving}
          accessibilityRole="button"
          accessibilityLabel="Leave waitlist"
          testID={testID ? `${testID}-leave` : undefined}
        >
          <Text style={styles.destructiveBtnText}>
            {isLeaving ? "Leaving…" : "Leave waitlist"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
    paddingBottom: spacing.s6,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: spacing.s5,
    gap: spacing.s1,
  },
  positionNumber: {
    fontSize: 72,
    fontWeight: "800",
    color: colors.primary,
    lineHeight: 80,
    letterSpacing: -2,
  },
  positionLabel: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  serviceName: {
    ...textStyles.heading3,
    color: colors.foreground,
    textAlign: "center",
  },
  salonCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.s1,
  },
  salonCardName: {
    ...textStyles.heading4,
    color: colors.foreground,
  },
  salonCardAddress: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  estimateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.s2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.s1,
  },
  estimateLabel: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  estimateValue: {
    ...textStyles.body,
    color: colors.foreground,
    fontWeight: "600",
  },
  actionsSection: {
    gap: spacing.s3,
    marginTop: spacing.s2,
  },
  secondaryBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: "600",
  },
  ghostBtn: {
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  destructiveBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  destructiveBtnText: {
    ...textStyles.body,
    color: colors.error,
    fontWeight: "600",
  },
});
