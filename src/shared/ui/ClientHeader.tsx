/**
 * ClientHeader.tsx — W27 Batch G primitive.
 *
 * Full client identity block: avatar with optional VIP overlay, name, tier badge,
 * client-since line, contact shortcut row (Call / Text / Email), and a 4-card
 * stat strip (Visits / LTV / Last Visit / No-shows).
 *
 * loading prop activates shimmer placeholders for the full header.
 * Contact buttons use Linking to open tel:, sms:, and mailto: deep links.
 *
 * Used in: G.4 ClientDetailScreen, G.5 ClientNotesHistoryScreen.
 */

import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { TierVariant } from "./TierBadge";
import { TierBadge } from "./TierBadge";
import { colors, radius, spacing, textStyles } from "./tokens";
import { djb2AvatarColor } from "../staffTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientHeaderProps = {
  clientName: string;
  initials: string;
  tier: TierVariant;
  isVIP: boolean;
  phone: string | null;
  email: string | null;
  /** Display string of client-since date, e.g. "Jan 2023". */
  since: string;
  visits: number;
  /** Lifetime value as a pre-formatted display string, e.g. "$1,234". */
  lifetimeValue: string;
  lastVisit: string | null;
  noShows: number;
  loading?: boolean;
  testID?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientHeader({
  clientName,
  initials,
  tier,
  isVIP,
  phone,
  email,
  since,
  visits,
  lifetimeValue,
  lastVisit,
  noShows,
  loading = false,
  testID,
}: ClientHeaderProps) {
  const avatarBg = djb2AvatarColor(clientName);

  if (loading) {
    return (
      <View
        style={styles.container}
        accessibilityLabel="Loading client profile"
        accessibilityRole="none"
        testID={testID}
      >
        <View style={styles.row1}>
          <View style={[styles.shimmerBlock, styles.shimmerAvatar]} />
          <View style={styles.infoBlock}>
            <View style={[styles.shimmerBlock, styles.shimmerName]} />
            <View style={[styles.shimmerBlock, styles.shimmerBadge]} />
            <View style={[styles.shimmerBlock, styles.shimmerContact]} />
          </View>
        </View>
        <View style={styles.statStrip}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.shimmerBlock, styles.shimmerStat]} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Row 1 – avatar + info block */}
      <View style={styles.row1}>
        {/* Avatar */}
        <View
          style={[styles.avatar, { backgroundColor: avatarBg }]}
          accessibilityElementsHidden
        >
          <Text style={styles.avatarInitials}>{initials}</Text>
          {isVIP && (
            <View
              style={styles.vipOverlay}
              accessibilityRole="image"
              accessibilityLabel="VIP client"
            >
              <Text style={styles.vipStar}>★</Text>
            </View>
          )}
        </View>

        {/* Info block */}
        <View style={styles.infoBlock}>
          <Text style={styles.clientName}>{clientName}</Text>

          <View style={styles.badgeRow}>
            <TierBadge tier={tier} />
            {isVIP && (
              <View style={styles.vipPill} accessibilityElementsHidden>
                <Text style={styles.vipPillText}>VIP</Text>
              </View>
            )}
          </View>

          <Text style={styles.clientSince}>Client since {since}</Text>

          {/* Contact shortcuts */}
          <View style={styles.contactRow}>
            {phone && (
              <Pressable
                style={({ pressed }) => [styles.contactBtn, pressed && styles.contactBtnPressed]}
                onPress={() => Linking.openURL(`tel:${phone}`)}
                accessibilityRole="link"
                accessibilityLabel={`Call ${clientName}`}
              >
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={styles.contactLabel}>Call</Text>
              </Pressable>
            )}
            {phone && (
              <Pressable
                style={({ pressed }) => [styles.contactBtn, pressed && styles.contactBtnPressed]}
                onPress={() => Linking.openURL(`sms:${phone}`)}
                accessibilityRole="link"
                accessibilityLabel={`Text ${clientName}`}
              >
                <Text style={styles.contactIcon}>💬</Text>
                <Text style={styles.contactLabel}>Text</Text>
              </Pressable>
            )}
            {email && (
              <Pressable
                style={({ pressed }) => [styles.contactBtn, pressed && styles.contactBtnPressed]}
                onPress={() => Linking.openURL(`mailto:${email}`)}
                accessibilityRole="link"
                accessibilityLabel={`Email ${clientName}`}
              >
                <Text style={styles.contactIcon}>✉️</Text>
                <Text style={styles.contactLabel}>Email</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Stat strip */}
      <View style={styles.statStrip}>
        <StatCard label="Visits" value={String(visits)} />
        <StatCard label="LTV" value={lifetimeValue} />
        <StatCard label="Last visit" value={lastVisit ?? "—"} />
        <StatCard
          label="No-shows"
          value={String(noShows)}
          warning={noShows > 0}
        />
      </View>
    </View>
  );
}

// ─── StatCard sub-component ──────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: string;
  warning?: boolean;
};

function StatCard({ label, value, warning = false }: StatCardProps) {
  return (
    <View
      style={[styles.statCard, warning && styles.statCardWarning]}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text
        style={[styles.statValue, warning && styles.statValueWarning]}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Row 1
  row1: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.cardPadding,
  },

  // Avatar
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    ...textStyles.heading2,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
  },
  vipOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  vipStar: {
    fontSize: 16,
    color: "#F59E0B",
    textAlign: "center",
  },

  // Info block
  infoBlock: {
    flex: 1,
    gap: 4,
  },
  clientName: {
    ...textStyles.heading2,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.elementGapSmall,
    marginTop: 4,
  },
  vipPill: {
    height: 22,
    paddingHorizontal: spacing.elementGapSmall,
    borderRadius: radius.full,
    backgroundColor: "rgba(245,158,11,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  vipPillText: {
    ...textStyles.labelSmall,
    fontWeight: "600",
    color: "#F59E0B",
  },
  clientSince: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Contact row
  contactRow: {
    flexDirection: "row",
    gap: spacing.elementGapSmall,
    marginTop: spacing.s3,
  },
  contactBtn: {
    flex: 1,
    height: spacing.touchTarget,
    borderRadius: radius.md,
    backgroundColor: colors.disabledBg,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  contactBtnPressed: {
    opacity: 0.75,
  },
  contactIcon: {
    fontSize: 14,
    lineHeight: 18,
  },
  contactLabel: {
    ...textStyles.labelSmall,
    color: "#1A1A1A",
  },

  // Stat strip
  statStrip: {
    flexDirection: "row",
    gap: spacing.elementGapSmall,
    marginTop: spacing.s3,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCardWarning: {
    backgroundColor: "rgba(255,152,0,0.06)",
  },
  statValue: {
    ...textStyles.body,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  statValueWarning: {
    color: colors.warning,
  },
  statLabel: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Shimmer placeholders
  shimmerBlock: {
    backgroundColor: "#F0EBE1",
    borderRadius: radius.sm,
  },
  shimmerAvatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
  },
  shimmerName: {
    height: 28,
    width: "60%",
  },
  shimmerBadge: {
    height: 20,
    width: "30%",
    borderRadius: radius.full,
    marginTop: 4,
  },
  shimmerContact: {
    height: spacing.touchTarget,
    width: "100%",
    borderRadius: radius.md,
    marginTop: spacing.s3,
  },
  shimmerStat: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
  },
});
