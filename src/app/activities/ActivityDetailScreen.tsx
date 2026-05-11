/**
 * ActivityDetailScreen.tsx — E.5 Activity Detail.
 *
 * Hero (mint-fresh bg) + heading-2 + body + numbered steps with completion checkmarks.
 * Reward block (points + bonus) + expiry date. Sticky CTA via deriveActivityCtaLabel.
 * States: not_started | in_progress | ready_to_claim | completed | expired | error.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { StickyCtaBar, colors, radius, spacing, textStyles } from "../../shared/ui";
import {
  deriveActivityCtaLabel,
  type Activity,
  type ActivityStep,
} from "../loyalty/loyaltyHelpers";

export type ActivityDetailScreenProps = {
  activity: Activity;
  loading?: boolean;
  error?: string;
  onCtaPress?: () => void;
  onPressBack?: () => void;
  onRetry?: () => void;
  testID?: string;
};

export function ActivityDetailScreen({
  activity,
  loading,
  error,
  onCtaPress,
  onPressBack,
  onRetry,
  testID,
}: ActivityDetailScreenProps) {
  const {
    title,
    icon,
    description,
    status,
    steps,
    pointsReward,
    bonusPoints,
    expiryLabel,
  } = activity;

  const ctaLabel = deriveActivityCtaLabel(status);
  const isExpired = status === "expired";
  const isCompleted = status === "completed";

  if (error) {
    return (
      <View style={styles.root} testID={testID}>
        <View style={styles.header}>
          <BackButton onPress={onPressBack} />
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        </View>
        <View style={styles.centeredFill}>
          <Text style={styles.errorGlyph}>⚠</Text>
          <Text style={styles.bodyMuted}>{error}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} style={styles.retryBtn} accessibilityRole="button" accessibilityLabel="Retry">
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={onPressBack} />
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, isExpired ? styles.heroExpired : null]}>
          <Text style={styles.heroIcon}>{icon ?? "⭐"}</Text>
          {isExpired && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>Expired</Text>
            </View>
          )}
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ Completed</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.pageTitle}>{title}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          {/* Steps */}
          {steps && steps.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Steps</Text>
              {steps.map((step, i) => (
                <StepRow key={step.id ?? String(i)} step={step} index={i} />
              ))}
            </View>
          ) : null}

          {/* Reward block */}
          <View style={styles.rewardBlock}>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardLabel}>Points reward</Text>
              <Text style={styles.rewardValue}>+{pointsReward} pts</Text>
            </View>
            {bonusPoints ? (
              <View style={styles.rewardRow}>
                <Text style={styles.rewardLabel}>Bonus</Text>
                <Text style={[styles.rewardValue, styles.bonusValue]}>+{bonusPoints} pts</Text>
              </View>
            ) : null}
          </View>

          {expiryLabel ? (
            <Text style={styles.expiry}>Expires {expiryLabel}</Text>
          ) : null}

          <View style={{ height: 96 }} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      {!isCompleted && !isExpired && (
        <StickyCtaBar
          primaryLabel={ctaLabel}
          onPrimaryPress={onCtaPress ?? (() => {})}
          primaryTestID={testID ? `${testID}-cta` : undefined}
        />
      )}
    </View>
  );
}

/* ---------- Support components ---------- */

function BackButton({ onPress }: { onPress?: () => void }) {
  if (!onPress) return null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={styles.backBtn}
    >
      <Text style={styles.backGlyph}>←</Text>
    </Pressable>
  );
}

type StepRowProps = { step: ActivityStep; index: number };
function StepRow({ step, index }: StepRowProps) {
  return (
    <View style={styles.stepRow} accessible accessibilityLabel={`Step ${index + 1}: ${step.label}${step.completed ? ", completed" : ""}`}>
      <View style={[styles.stepNumBox, step.completed ? styles.stepNumBoxDone : null]}>
        {step.completed ? (
          <Text style={styles.stepCheck}>✓</Text>
        ) : (
          <Text style={styles.stepNum}>{index + 1}</Text>
        )}
      </View>
      <Text style={[styles.stepLabel, step.completed ? styles.stepLabelDone : null]}>
        {step.label}
      </Text>
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
  hero: {
    height: 180,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  heroExpired: { opacity: 0.5 },
  heroIcon: { fontSize: 72 },
  expiredBadge: {
    position: "absolute",
    top: spacing.s3,
    right: spacing.s3,
    backgroundColor: colors.textMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s3,
    paddingVertical: 4,
  },
  expiredBadgeText: { ...textStyles.labelSmall, color: colors.white },
  completedBadge: {
    position: "absolute",
    top: spacing.s3,
    right: spacing.s3,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s3,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.accentForeground,
  },
  completedBadgeText: { ...textStyles.labelSmall, color: colors.accentForeground },
  scrollContent: { paddingBottom: 32 },
  body: { padding: spacing.s4, gap: spacing.s4 },
  pageTitle: { ...textStyles.heading2, color: colors.foreground },
  description: { ...textStyles.body, color: colors.textMuted },
  section: { gap: spacing.s2 },
  sectionLabel: { ...textStyles.label, color: colors.foreground },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.s3, paddingVertical: spacing.s2 },
  stepNumBox: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumBoxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNum: { ...textStyles.labelSmall, color: colors.primary },
  stepCheck: { ...textStyles.labelSmall, color: colors.white },
  stepLabel: { ...textStyles.body, color: colors.foreground, flex: 1 },
  stepLabelDone: { color: colors.textMuted, textDecorationLine: "line-through" },
  rewardBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    gap: spacing.s2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rewardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rewardLabel: { ...textStyles.body, color: colors.textMuted },
  rewardValue: { ...textStyles.heading4, color: colors.foreground },
  bonusValue: { color: colors.accentForeground },
  expiry: { ...textStyles.labelSmall, color: colors.textMuted },
  ctaBtn: {
    height: spacing.touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { ...textStyles.labelLarge, color: colors.white },
  centeredFill: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.s3, padding: spacing.s8 },
  errorGlyph: { fontSize: 40, color: colors.error },
  bodyMuted: { ...textStyles.body, color: colors.textMuted, textAlign: "center" },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.s6, paddingVertical: spacing.s2 },
  retryText: { ...textStyles.label, color: colors.white },
});
