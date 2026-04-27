/**
 * ClientLoyaltyScreen.tsx
 *
 * Client-facing loyalty view:
 *   - Current tier badge + points balance
 *   - Progress bar to the next tier
 *   - Redemption options list
 *   - Transaction history
 *   - Loading, empty and error states
 */

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { CustomerLoyaltyState, LoyaltyTransaction } from "../../domains/loyalty/model";
import type { TenantLoyaltyConfig, LoyaltyTier } from "../../domains/loyalty/model";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const colors = {
  background: "#F2EDDD",
  surface: "#FFFFFF",
  border: "#E5E0D1",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  primary: "#E3A9A0",
  primaryPressed: "#CF8B80",
  accent: "#BBEDDA",
  gold: "#F5C842",
  success: "#4CAF50",
  error: "#F44336",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ClientLoyaltyScreenProps = {
  loyaltyState: CustomerLoyaltyState | null;
  config: TenantLoyaltyConfig | null;
  transactions: LoyaltyTransaction[];
  isLoading: boolean;
  error: string | null;
  onRedeem: (optionId: string) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveNextTier(
  lifetimePoints: number,
  tiers: LoyaltyTier[],
): { tier: LoyaltyTier; progressPct: number } | null {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  for (const tier of sorted) {
    if (lifetimePoints < tier.minPoints) {
      const prevMin = sorted[sorted.indexOf(tier) - 1]?.minPoints ?? 0;
      const range = tier.minPoints - prevMin;
      const earned = lifetimePoints - prevMin;
      return { tier, progressPct: Math.min(100, Math.round((earned / range) * 100)) };
    }
  }
  return null; // top tier
}

function formatTxType(type: "credit" | "debit"): string {
  return type === "credit" ? "+" : "−";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TierBadge({ tierId, tierName }: { tierId: string | null; tierName: string }) {
  return (
    <View style={styles.tierBadge}>
      <Text style={styles.tierBadgeText}>{tierName || "No Tier"}</Text>
    </View>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: clamped }}>
      <View style={[styles.progressFill, { width: `${clamped}%` }]} />
    </View>
  );
}

function TransactionRow({ tx }: { tx: LoyaltyTransaction }) {
  const sign = formatTxType(tx.type);
  const color = tx.type === "credit" ? colors.success : colors.error;
  return (
    <View style={styles.txRow}>
      <View style={styles.txInfo}>
        <Text style={styles.txReason}>{tx.reason}</Text>
        <Text style={styles.txDate}>{tx.referenceId}</Text>
      </View>
      <Text style={[styles.txPoints, { color }]}>
        {sign}{tx.points} pts
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ClientLoyaltyScreen({
  loyaltyState,
  config,
  transactions,
  isLoading,
  error,
  onRedeem,
}: ClientLoyaltyScreenProps) {
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!config || !config.enabled) {
    return (
      <View style={styles.centered}>
        <Text style={styles.mutedText}>Loyalty programme is not active.</Text>
      </View>
    );
  }

  const currentPoints = loyaltyState?.points ?? 0;
  const lifetimePoints = loyaltyState?.lifetimePoints ?? 0;
  const currentTierId = loyaltyState?.currentTierId ?? null;
  const currentTier = config.tiers.find((t) => t.tierId === currentTierId);
  const nextTierInfo = resolveNextTier(lifetimePoints, config.tiers);

  return (
    <View style={styles.container}>
      {/* Header: tier + balance */}
      <View style={styles.headerCard}>
        <TierBadge tierId={currentTierId} tierName={currentTier?.name ?? "Member"} />
        <Text style={styles.pointsLabel}>Your Points</Text>
        <Text style={styles.pointsValue}>{currentPoints.toLocaleString()}</Text>

        {/* Tier progress */}
        {nextTierInfo ? (
          <View style={styles.progressSection}>
            <Text style={styles.mutedText}>
              {nextTierInfo.progressPct}% toward {nextTierInfo.tier.name}
              {" "}({nextTierInfo.tier.minPoints - lifetimePoints} pts to go)
            </Text>
            <ProgressBar pct={nextTierInfo.progressPct} />
          </View>
        ) : (
          <Text style={styles.mutedText}>You are at the highest tier!</Text>
        )}
      </View>

      {/* Redemption options */}
      {config.redemptionOptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Redeem Your Points</Text>
          {config.redemptionOptions.map((opt) => {
            const canRedeem = currentPoints >= opt.pointsCost;
            return (
              <Pressable
                key={opt.optionId}
                style={[styles.redeemCard, !canRedeem && styles.redeemCardDisabled]}
                onPress={() => canRedeem && onRedeem(opt.optionId)}
                accessibilityRole="button"
                accessibilityLabel={`Redeem ${opt.name} for ${opt.pointsCost} points`}
                accessibilityState={{ disabled: !canRedeem }}
              >
                <View style={styles.redeemInfo}>
                  <Text style={styles.redeemName}>{opt.name}</Text>
                  <Text style={styles.redeemValue}>{opt.valueDescription}</Text>
                </View>
                <View style={styles.redeemCost}>
                  <Text style={[styles.redeemCostText, !canRedeem && styles.mutedText]}>
                    {opt.pointsCost} pts
                  </Text>
                  {!canRedeem && (
                    <Text style={styles.lockedLabel}>Locked</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Transaction history */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {transactions.length === 0 ? (
          <Text style={styles.mutedText}>No transactions yet.</Text>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(tx) => tx.txId}
            renderItem={({ item }) => <TransactionRow tx={item} />}
            scrollEnabled={false}
          />
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierBadge: {
    backgroundColor: colors.gold,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 12,
  },
  tierBadgeText: { fontWeight: "700", color: "#5A4000", fontSize: 13 },
  pointsLabel: { fontSize: 13, color: colors.muted, marginBottom: 2 },
  pointsValue: { fontSize: 36, fontWeight: "800", color: colors.text, marginBottom: 12 },
  progressSection: { width: "100%", marginTop: 4 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 10 },
  redeemCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  redeemCardDisabled: { opacity: 0.55 },
  redeemInfo: { flex: 1 },
  redeemName: { fontSize: 14, fontWeight: "600", color: colors.text },
  redeemValue: { fontSize: 12, color: colors.muted, marginTop: 2 },
  redeemCost: { alignItems: "flex-end" },
  redeemCostText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  lockedLabel: { fontSize: 10, color: colors.muted, marginTop: 2 },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txInfo: { flex: 1 },
  txReason: { fontSize: 13, color: colors.text },
  txDate: { fontSize: 11, color: colors.muted, marginTop: 2 },
  txPoints: { fontSize: 14, fontWeight: "700" },
  errorText: { color: colors.error, textAlign: "center" },
  mutedText: { fontSize: 13, color: colors.muted, textAlign: "center" },
});
