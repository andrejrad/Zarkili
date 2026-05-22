/**
 * RewardRedemptionScreen.tsx — E.3 Reward Redemption.
 *
 * Hero image + title + cost + balance. Terms collapsible. Sticky redeem CTA.
 * Success ModalSheet with QR placeholder + expiry + wallet CTA.
 * States: default | insufficient-points | redeeming | redeemed | expired | error.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Banner,
  ModalSheet,
  StickyCtaBar,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";

import { formatPoints } from "./loyaltyHelpers";

export type RedemptionState =
  | "default"
  | "insufficient-points"
  | "redeeming"
  | "redeemed"
  | "expired"
  | "error";

export type RewardRedemptionScreenProps = {
  title: string;
  description: string;
  imageAlt?: string;
  pointsCost: number;
  userPoints: number;
  expiryLabel?: string;
  termsText?: string;
  screenState?: RedemptionState;
  errorMessage?: string;
  onRedeem: () => void;
  onAddToWallet?: () => void;
  onDismissSuccess?: () => void;
  onPressBack?: () => void;
  onRetry?: () => void;
  testID?: string;
};

export function RewardRedemptionScreen({
  title,
  description,
  imageAlt,
  pointsCost,
  userPoints,
  expiryLabel,
  termsText,
  screenState = "default",
  errorMessage,
  onRedeem,
  onAddToWallet,
  onDismissSuccess,
  onPressBack,
  onRetry,
  testID,
}: RewardRedemptionScreenProps) {
  const canAfford = userPoints >= pointsCost;
  const isExpired = screenState === "expired";
  const isRedeemed = screenState === "redeemed";
  const isRedeeming = screenState === "redeeming";
  const isError = screenState === "error";
  const isInsufficient = screenState === "insufficient-points" || !canAfford;

  const ctaLabel = isRedeeming
    ? "Redeeming…"
    : `Redeem for ${formatPoints(pointsCost)}`;

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {isError ? (
        <View style={styles.centeredFill}>
          <Text style={styles.errorGlyph}>⚠</Text>
          <Text style={styles.bodyMuted}>{errorMessage ?? "Something went wrong."}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} style={styles.retryBtn} accessibilityRole="button" accessibilityLabel="Retry">
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Hero image */}
            <View style={[styles.heroImage]} accessible accessibilityLabel={imageAlt ?? title}>
              <View style={styles.heroImagePlaceholder}>
                <Text style={styles.heroPlaceholderText}>🖼</Text>
              </View>
            </View>

            {/* Core info */}
            <View style={styles.body}>
              {/* Expired / insufficient banners */}
              {isExpired && (
                <Banner
                  variant="warning"
                  message="This reward has expired and can no longer be redeemed."
                />
              )}
              {isInsufficient && !isExpired && (
                <Banner
                  variant="info"
                  message={`You need ${formatPoints(pointsCost - userPoints)} more to redeem.`}
                />
              )}

              <Text style={styles.rewardTitle}>{title}</Text>
              <Text style={styles.rewardDescription}>{description}</Text>

              {/* Cost row */}
              <View style={styles.costRow}>
                <View>
                  <Text style={styles.costSmall}>Cost</Text>
                  <Text style={styles.costBig}>{formatPoints(pointsCost)}</Text>
                </View>
                <View style={styles.balanceBox}>
                  <Text style={styles.costSmall}>Your balance</Text>
                  <Text
                    style={[
                      styles.costBig,
                      !canAfford ? styles.insufficient : null,
                    ]}
                  >
                    {formatPoints(userPoints)}
                  </Text>
                </View>
              </View>

              {expiryLabel ? (
                <Text style={styles.expiry}>Expires: {expiryLabel}</Text>
              ) : null}

              {/* Terms collapsible (always visible when termsText provided) */}
              {termsText ? (
                <View style={styles.terms} testID={testID ? `${testID}-terms` : undefined}>
                  <Text style={styles.termsLabel}>Terms & Conditions</Text>
                  <Text style={styles.termsBody}>{termsText}</Text>
                </View>
              ) : null}

              {isInsufficient && !isExpired && (
                <Text style={styles.earnMoreHint}>Earn more points to unlock this reward</Text>
              )}

              <View style={{ height: 96 }} />
            </View>
          </ScrollView>

          {/* Sticky CTA */}
          {!isExpired && !isRedeemed && (
            <StickyCtaBar
              primaryLabel={ctaLabel}
              onPrimaryPress={isRedeeming || isInsufficient ? (() => {}) : onRedeem}
              primaryDisabled={isRedeeming || isInsufficient}
              primaryTestID={testID ? `${testID}-cta` : undefined}
            />
          )}
        </>
      )}

      {/* Success ModalSheet */}
      <ModalSheet
        visible={isRedeemed}
        onClose={onDismissSuccess ?? (() => {})}
        title="Reward redeemed!"
        testID={testID ? `${testID}-success-sheet` : undefined}
      >
        <View style={styles.successContent}>
          {/* QR placeholder */}
          <View style={styles.qrPlaceholder} accessible accessibilityLabel="QR code">
            <Text style={styles.qrPlaceholderText}>QR</Text>
          </View>
          {expiryLabel ? (
            <Text style={styles.bodyMuted}>Valid until {expiryLabel}</Text>
          ) : null}
          {onAddToWallet ? (
            <Pressable
              onPress={onAddToWallet}
              style={styles.walletBtn}
              accessibilityRole="button"
              accessibilityLabel="Add to wallet"
              testID={testID ? `${testID}-wallet` : undefined}
            >
              <Text style={styles.walletText}>Add to Wallet</Text>
            </Pressable>
          ) : null}
        </View>
      </ModalSheet>
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
  scrollContent: { paddingBottom: 32 },
  heroImage: { width: "100%", height: 240, backgroundColor: colors.disabledBg, overflow: "hidden" },
  heroImagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroPlaceholderText: { fontSize: 48 },
  body: { padding: spacing.s4, gap: spacing.s4 },
  rewardTitle: { ...textStyles.heading2, color: colors.foreground },
  rewardDescription: { ...textStyles.body, color: colors.textMuted },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  costSmall: { ...textStyles.labelSmall, color: colors.textMuted, marginBottom: 2 },
  costBig: { ...textStyles.heading3, color: colors.foreground },
  insufficient: { color: colors.error },
  balanceBox: { alignItems: "flex-end" },
  expiry: { ...textStyles.labelSmall, color: colors.textMuted },
  terms: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.s2,
  },
  termsLabel: { ...textStyles.label, color: colors.foreground },
  termsBody: { ...textStyles.bodySmall, color: colors.textMuted },
  ctaBtn: {
    height: spacing.touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnDisabled: { backgroundColor: colors.disabledBg },
  ctaText: { ...textStyles.labelLarge, color: colors.white },
  earnMoreHint: { ...textStyles.bodySmall, color: colors.textMuted, textAlign: "center", marginTop: spacing.s2 },
  centeredFill: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.s3, padding: spacing.s8 },
  errorGlyph: { fontSize: 40, color: colors.error },
  bodyMuted: { ...textStyles.body, color: colors.textMuted, textAlign: "center" },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.s6, paddingVertical: spacing.s2 },
  retryText: { ...textStyles.label, color: colors.white },
  successContent: { alignItems: "center", gap: spacing.s4, paddingBottom: spacing.s6 },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qrPlaceholderText: { ...textStyles.heading1, color: colors.textMuted },
  walletBtn: {
    height: spacing.touchTarget,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s8,
    alignItems: "center",
    justifyContent: "center",
  },
  walletText: { ...textStyles.label, color: colors.accentForeground },
});
