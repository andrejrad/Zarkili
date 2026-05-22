/**
 * W39 — ConnectHealthStatusScreen: Connect account health, document submission
 * status, and restricted-state recovery guidance.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { ConnectAccount } from "../../domains/connect";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: ConnectAccount["status"]): string {
  if (status === "active") return "#22C55E";
  if (status === "pending_verification") return "#F59E0B";
  if (status === "restricted") return "#EF4444";
  return "#9CA3AF";
}

function statusLabel(status: ConnectAccount["status"]): string {
  const map: Record<ConnectAccount["status"], string> = {
    not_started: "Not started",
    pending_verification: "Pending verification",
    active: "Active",
    restricted: "Restricted",
  };
  return map[status];
}

function formatTimestamp(ts: { toDate: () => Date } | null): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConnectHealthStatusScreenProps = {
  loading: boolean;
  error: string | null;
  account: ConnectAccount | null;
  onRetry: () => void;
  onBack: () => void;
  onResumeOnboarding: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConnectHealthStatusScreen({
  loading,
  error,
  account,
  onRetry,
  onBack,
  onResumeOnboarding,
}: ConnectHealthStatusScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Billing</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Connect health</Text>

      {loading ? <AdminLoadingState label="Loading Connect account…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {!loading && !error && !account ? (
        <AdminEmptyState
          title="No Connect account"
          body="Set up payouts to connect your bank account and start receiving payments."
          cta="Set up payouts"
          onCta={onResumeOnboarding}
        />
      ) : null}

      {!loading && account ? (
        <>
          {/* Status banner */}
          <View style={[styles.statusBanner, { borderColor: statusColor(account.status) }]}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor(account.status) }]} />
              <Text style={[styles.statusLabel, { color: statusColor(account.status) }]}>
                {statusLabel(account.status)}
              </Text>
            </View>
            <Text style={styles.statusAccountId}>
              {account.stripeAccountId ?? "Account not yet created"}
            </Text>
          </View>

          {/* Restricted state — recovery guidance */}
          {account.status === "restricted" && account.restrictionReasons.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.warningTitle}>Action required to restore payouts</Text>
              <Text style={styles.body}>
                Stripe has restricted your account due to outstanding requirements. Resolve the following
                items to re-enable payouts:
              </Text>
              {account.restrictionReasons.map((reason) => (
                <View key={reason} style={styles.reasonRow}>
                  <Text style={styles.bullet}>·</Text>
                  <Text style={styles.reasonText}>{reason.replace(/_/g, " ")}</Text>
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={onResumeOnboarding}
                style={styles.primaryBtn}
                testID="resolve-restrictions-btn"
              >
                <Text style={styles.primaryBtnLabel}>Resolve in Stripe →</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Capabilities */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Capabilities</Text>
            <View style={styles.capabilityRow}>
              <Text style={styles.capabilityLabel}>Charges enabled</Text>
              <Text style={[styles.capabilityValue, { color: account.chargesEnabled ? "#22C55E" : "#EF4444" }]}>
                {account.chargesEnabled ? "Yes" : "No"}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.capabilityRow}>
              <Text style={styles.capabilityLabel}>Payouts enabled</Text>
              <Text style={[styles.capabilityValue, { color: account.payoutsEnabled ? "#22C55E" : "#EF4444" }]}>
                {account.payoutsEnabled ? "Yes" : "No"}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.capabilityRow}>
              <Text style={styles.capabilityLabel}>Details submitted</Text>
              <Text style={[styles.capabilityValue, { color: account.detailsSubmitted ? "#22C55E" : "#F59E0B" }]}>
                {account.detailsSubmitted ? "Yes" : "Pending"}
              </Text>
            </View>
          </View>

          {/* Tax form status */}
          {account.country === "US" ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Tax form (US)</Text>
              {account.taxFormType ? (
                <>
                  <View style={styles.capabilityRow}>
                    <Text style={styles.capabilityLabel}>Form on file</Text>
                    <Text style={styles.capabilityValue}>{account.taxFormType.toUpperCase()}</Text>
                  </View>
                  <View style={styles.capabilityRow}>
                    <Text style={styles.capabilityLabel}>Captured</Text>
                    <Text style={styles.capabilityValue}>{formatTimestamp(account.taxFormCapturedAt)}</Text>
                  </View>
                  <View style={styles.capabilityRow}>
                    <Text style={styles.capabilityLabel}>1099-K eligible</Text>
                    <Text style={styles.capabilityValue}>{account.eligible1099K ? "Yes" : "Not yet"}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.warningText}>
                  No tax form on file. W-9 (US persons) or W-8BEN (foreign owners) required before payouts activate.
                </Text>
              )}
            </View>
          ) : null}

          {/* Last payout failure */}
          {account.lastPayoutFailureAt ? (
            <View style={[styles.card, styles.failureCard]}>
              <Text style={styles.warningTitle}>Last payout failure</Text>
              <Text style={styles.body}>{account.lastPayoutFailureReason ?? "Unknown reason"}</Text>
              <Text style={styles.meta}>{formatTimestamp(account.lastPayoutFailureAt)}</Text>
            </View>
          ) : null}

          {/* Account details */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Account details</Text>
            <View style={styles.capabilityRow}>
              <Text style={styles.capabilityLabel}>Country</Text>
              <Text style={styles.capabilityValue}>{account.country}</Text>
            </View>
            <View style={styles.capabilityRow}>
              <Text style={styles.capabilityLabel}>Account type</Text>
              <Text style={styles.capabilityValue}>{account.accountType}</Text>
            </View>
            <View style={styles.capabilityRow}>
              <Text style={styles.capabilityLabel}>Created</Text>
              <Text style={styles.capabilityValue}>{formatTimestamp(account.createdAt)}</Text>
            </View>
          </View>

          {/* Resume onboarding if not complete */}
          {!account.detailsSubmitted ? (
            <Pressable
              accessibilityRole="button"
              onPress={onResumeOnboarding}
              style={styles.primaryBtn}
              testID="resume-onboarding-btn"
            >
              <Text style={styles.primaryBtnLabel}>Continue setup in Stripe →</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingBottom: 32, gap: 12 },
  backRow: { paddingBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  pageTitle: { fontSize: 26, lineHeight: 34, fontFamily: brandTypography.semibold, color: "#1A1A1A", marginBottom: 4 },
  statusBanner: { borderRadius: 16, borderWidth: 2, padding: 16, gap: 4, backgroundColor: "#FFFFFF" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 16, fontFamily: brandTypography.semibold },
  statusAccountId: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B", fontVariant: ["tabular-nums"] },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", padding: 16, gap: 8 },
  failureCard: { borderColor: "#EF4444" },
  sectionLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.5 },
  body: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  meta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#9CA3AF" },
  warningTitle: { fontSize: 14, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  warningText: { fontSize: 13, fontFamily: brandTypography.regular, color: "#F59E0B" },
  capabilityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  capabilityLabel: { fontSize: 14, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  capabilityValue: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  divider: { height: 1, backgroundColor: "#F5F0E8" },
  reasonRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bullet: { fontSize: 16, color: "#EF4444" },
  reasonText: { flex: 1, fontSize: 13, fontFamily: brandTypography.regular, color: "#1A1A1A", textTransform: "capitalize" },
  primaryBtn: { backgroundColor: "#E3A9A0", paddingVertical: 14, borderRadius: 9999, alignItems: "center" },
  primaryBtnLabel: { fontSize: 14, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
});
