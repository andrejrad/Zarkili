/**
 * W39 — BillingHubScreen: billing overview and navigation hub.
 *
 * Shows the current subscription status, outstanding balance, Connect health
 * summary, and quick-nav rows to all billing sub-screens.
 *
 * W14-DEBT-3: Renders the admin suspension banner + upgrade CTA when the
 * subscription is suspended or past_due.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { Subscription } from "../../domains/billing";
import type { ConnectAccount } from "../../domains/connect";
import type { PendingBalance } from "../../domains/billing/payoutService";

import { AdminErrorState, AdminLoadingState, AdminSectionRow } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatTimestamp(ts: { toDate: () => Date } | null): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BillingSection =
  | "plan"
  | "invoices"
  | "payment-method"
  | "cancel"
  | "connect"
  | "connect-health"
  | "payouts"
  | "refunds";

type BillingHubScreenProps = {
  loading: boolean;
  error: string | null;
  subscription: Subscription | null;
  connectAccount: ConnectAccount | null;
  pendingBalance: PendingBalance | null;
  onBack: () => void;
  onNavigateTo: (section: BillingSection) => void;
  onRetry: () => void;
};

// ---------------------------------------------------------------------------
// SuspensionBanner (W14-DEBT-3)
// ---------------------------------------------------------------------------

function SuspensionBanner({
  subscription,
  onUpgrade,
}: {
  subscription: Subscription;
  onUpgrade: () => void;
}) {
  if (subscription.status === "suspended") {
    return (
      <View style={styles.suspensionBanner} testID="suspension-banner">
        <Text style={styles.suspensionTitle}>Account suspended</Text>
        <Text style={styles.suspensionBody}>
          Your account has been suspended due to a payment failure. Client-facing features are paused. Update your
          payment method to reactivate immediately.
        </Text>
        <Pressable accessibilityRole="button" onPress={onUpgrade} style={styles.suspensionCta} testID="suspension-cta">
          <Text style={styles.suspensionCtaLabel}>Update payment method →</Text>
        </Pressable>
      </View>
    );
  }

  if (subscription.status === "past_due") {
    return (
      <View style={styles.pastDueBanner} testID="past-due-banner">
        <Text style={styles.pastDueTitle}>Payment overdue</Text>
        <Text style={styles.pastDueBody}>
          Your latest invoice could not be collected. Update your payment method to avoid suspension.
        </Text>
        {subscription.pastDueSince ? (
          <Text style={styles.pastDueMeta}>Past due since {formatTimestamp(subscription.pastDueSince)}</Text>
        ) : null}
        <Pressable accessibilityRole="button" onPress={onUpgrade} style={styles.pastDueCta} testID="past-due-cta">
          <Text style={styles.pastDueCtaLabel}>Fix payment →</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BillingHubScreen({
  loading,
  error,
  subscription,
  connectAccount,
  pendingBalance,
  onBack,
  onNavigateTo,
  onRetry,
}: BillingHubScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Settings</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Billing &amp; payouts</Text>

      {loading ? <AdminLoadingState label="Loading billing…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {/* Suspension / past-due banner (W14-DEBT-3) */}
      {subscription && !loading ? (
        <SuspensionBanner
          subscription={subscription}
          onUpgrade={() => onNavigateTo("payment-method")}
        />
      ) : null}

      {/* Current plan summary */}
      {subscription && !loading ? (
        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Current plan</Text>
          <View style={styles.planRow}>
            <Text style={styles.planName}>
              {subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1)}
            </Text>
            <Text style={styles.planInterval}>
              {subscription.interval === "annual" ? "Annual" : "Monthly"}
            </Text>
          </View>
          {subscription.currentPeriodEnd ? (
            <Text style={styles.renewalMeta}>
              {subscription.cancelAtPeriodEnd
                ? `Cancels ${formatTimestamp(subscription.currentPeriodEnd)}`
                : `Renews ${formatTimestamp(subscription.currentPeriodEnd)}`}
            </Text>
          ) : null}
          {subscription.trialEndsAt ? (
            <View style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>
                Trial ends {formatTimestamp(subscription.trialEndsAt)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Connect health summary */}
      {connectAccount && !loading ? (
        <View style={styles.connectSummary}>
          <View style={[styles.connectDot, {
            backgroundColor:
              connectAccount.status === "active" ? "#22C55E" :
              connectAccount.status === "restricted" ? "#EF4444" : "#F59E0B",
          }]} />
          <Text style={styles.connectMeta}>
            Payouts:{" "}
            {connectAccount.status === "active"
              ? "Active"
              : connectAccount.status === "restricted"
              ? "Restricted — action required"
              : connectAccount.status === "pending_verification"
              ? "Pending verification"
              : "Not set up"}
          </Text>
        </View>
      ) : null}

      {/* Pending balance */}
      {pendingBalance && !loading ? (
        <View style={styles.balanceCard}>
          <Text style={styles.sectionLabel}>Available balance</Text>
          <Text style={styles.balanceValue}>
            {formatCents(pendingBalance.availableCents, pendingBalance.currency)}
          </Text>
          {pendingBalance.pendingCents > 0 ? (
            <Text style={styles.pendingMeta}>
              + {formatCents(pendingBalance.pendingCents, pendingBalance.currency)} pending
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Nav sections */}
      {!loading ? (
        <>
          <Text style={styles.groupLabel}>Subscription</Text>
          <View style={styles.group}>
            <AdminSectionRow
              label="Plan selection"
              sublabel="Upgrade, downgrade, or change billing interval"
              onPress={() => onNavigateTo("plan")}
            />
            <AdminSectionRow
              label="Invoice history"
              sublabel="Download PDF invoices"
              onPress={() => onNavigateTo("invoices")}
            />
            <AdminSectionRow
              label="Payment method"
              sublabel="Cards on file, add or remove"
              onPress={() => onNavigateTo("payment-method")}
            />
            <AdminSectionRow
              label="Cancel or pause"
              sublabel="Cancel subscription or pause billing"
              onPress={() => onNavigateTo("cancel")}
            />
          </View>

          <Text style={styles.groupLabel}>Payouts &amp; Connect</Text>
          <View style={styles.group}>
            <AdminSectionRow
              label="Connect onboarding"
              sublabel="Set up your bank account for payouts"
              onPress={() => onNavigateTo("connect")}
            />
            <AdminSectionRow
              label="Connect health"
              sublabel="Account status, documents, restrictions"
              onPress={() => onNavigateTo("connect-health")}
            />
            <AdminSectionRow
              label="Payout history"
              sublabel="History, pending balance, schedule"
              onPress={() => onNavigateTo("payouts")}
            />
            <AdminSectionRow
              label="Refunds &amp; disputes"
              sublabel="View refunds, respond to chargebacks"
              onPress={() => onNavigateTo("refunds")}
            />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingBottom: 32, gap: 8 },
  backRow: { paddingBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  pageTitle: { fontSize: 26, lineHeight: 34, fontFamily: brandTypography.semibold, color: "#1A1A1A", marginBottom: 4 },
  suspensionBanner: { backgroundColor: "#FEF2F2", borderRadius: 16, borderWidth: 1.5, borderColor: "#EF4444", padding: 16, gap: 8 },
  suspensionTitle: { fontSize: 15, fontFamily: brandTypography.semibold, color: "#EF4444" },
  suspensionBody: { fontSize: 13, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  suspensionCta: { backgroundColor: "#EF4444", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 9999, alignSelf: "flex-start" },
  suspensionCtaLabel: { fontSize: 13, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  pastDueBanner: { backgroundColor: "#FFFBF0", borderRadius: 16, borderWidth: 1.5, borderColor: "#F59E0B", padding: 16, gap: 8 },
  pastDueTitle: { fontSize: 15, fontFamily: brandTypography.semibold, color: "#F59E0B" },
  pastDueBody: { fontSize: 13, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  pastDueMeta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  pastDueCta: { backgroundColor: "#F59E0B", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 9999, alignSelf: "flex-start" },
  pastDueCtaLabel: { fontSize: 13, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  summaryCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", padding: 16, gap: 4 },
  sectionLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.5 },
  planRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  planName: { fontSize: 18, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  planInterval: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  renewalMeta: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  trialBadge: { alignSelf: "flex-start", backgroundColor: "#F5F0E8", borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  trialBadgeText: { fontSize: 12, fontFamily: brandTypography.medium, color: "#6B6B6B" },
  connectSummary: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E5E0D1" },
  connectDot: { width: 8, height: 8, borderRadius: 4 },
  connectMeta: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  balanceCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", padding: 16, gap: 4 },
  balanceValue: { fontSize: 24, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  pendingMeta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  groupLabel: { fontSize: 12, fontFamily: brandTypography.semibold, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4 },
  group: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", overflow: "hidden" },
});
