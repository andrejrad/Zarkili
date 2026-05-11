/**
 * W39 — RefundDisputeAdminScreen: view refunds and disputes, initiate refunds
 * where allowed.
 *
 * Refunds: list charges that have been partially or fully refunded.
 * Disputes: list open/closed chargebacks. Owners can view evidence details
 * but cannot submit evidence directly from this screen (links to Stripe).
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import type { RefundRow, DisputeRow, BillingAdminService } from "./billingAdminService";

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

function refundStatusColor(status: RefundRow["status"]): string {
  if (status === "succeeded") return "#22C55E";
  if (status === "pending") return "#F59E0B";
  return "#EF4444";
}

function disputeStatusColor(status: DisputeRow["status"]): string {
  if (status === "won" || status === "warning_closed") return "#22C55E";
  if (status === "needs_response" || status === "under_review") return "#F59E0B";
  return "#EF4444";
}

function disputeStatusLabel(status: DisputeRow["status"]): string {
  const map: Record<DisputeRow["status"], string> = {
    needs_response: "Needs response",
    under_review: "Under review",
    won: "Won",
    lost: "Lost",
    warning_closed: "Closed",
  };
  return map[status];
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "refunds" | "disputes";

type RefundDisputeAdminScreenProps = {
  tenantId: string;
  loading: boolean;
  error: string | null;
  refunds: RefundRow[];
  disputes: DisputeRow[];
  service: BillingAdminService | null;
  onRetry: () => void;
  onBack: () => void;
  onRefundInitiated: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RefundDisputeAdminScreen({
  tenantId,
  loading,
  error,
  refunds,
  disputes,
  service,
  onRetry,
  onBack,
  onRefundInitiated,
}: RefundDisputeAdminScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>("refunds");
  const [initiatingRefundId, setInitiatingRefundId] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);

  async function handleInitiateRefund(chargeId: string, amountCents: number) {
    if (!service) return;
    setInitiatingRefundId(chargeId);
    setRefundError(null);
    try {
      await service.initiateRefund(tenantId, chargeId, amountCents, "Requested by owner");
      onRefundInitiated();
    } catch {
      setRefundError("Refund initiation failed. Please try again or contact support.");
    } finally {
      setInitiatingRefundId(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Billing</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Refunds &amp; disputes</Text>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "refunds" }}
          onPress={() => setActiveTab("refunds")}
          style={[styles.tab, activeTab === "refunds" && styles.tabActive]}
          testID="tab-refunds"
        >
          <Text style={[styles.tabLabel, activeTab === "refunds" && styles.tabLabelActive]}>
            Refunds {refunds.length > 0 ? `(${refunds.length})` : ""}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "disputes" }}
          onPress={() => setActiveTab("disputes")}
          style={[styles.tab, activeTab === "disputes" && styles.tabActive]}
          testID="tab-disputes"
        >
          <Text style={[styles.tabLabel, activeTab === "disputes" && styles.tabLabelActive]}>
            Disputes {disputes.filter((d) => d.status === "needs_response").length > 0
              ? `(${disputes.filter((d) => d.status === "needs_response").length} urgent)`
              : ""}
          </Text>
        </Pressable>
      </View>

      {loading ? <AdminLoadingState label="Loading…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {/* Refunds tab */}
      {!loading && !error && activeTab === "refunds" ? (
        refunds.length === 0 ? (
          <AdminEmptyState title="No refunds" body="Refund records will appear here when processed." />
        ) : (
          <View style={styles.list}>
            {refundError ? <Text style={styles.errorText}>{refundError}</Text> : null}
            {refunds.map((refund) => (
              <View key={refund.refundId} style={styles.row} testID={`refund-${refund.refundId}`}>
                <View style={styles.rowLeft}>
                  <Text style={styles.amount}>{formatCents(refund.amountCents, refund.currency)}</Text>
                  <Text style={styles.meta}>{refund.reason}</Text>
                  <Text style={styles.meta}>{refund.createdAtIso.split("T")[0]}</Text>
                </View>
                <View style={styles.rowRight}>
                  <View style={[styles.statusPill, { backgroundColor: `${refundStatusColor(refund.status)}22` }]}>
                    <Text style={[styles.statusPillText, { color: refundStatusColor(refund.status) }]}>
                      {refund.status}
                    </Text>
                  </View>
                  {refund.status === "pending" ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={initiatingRefundId === refund.chargeId}
                      onPress={() => void handleInitiateRefund(refund.chargeId, refund.amountCents)}
                      style={[styles.actionBtn, initiatingRefundId === refund.chargeId && styles.btnDisabled]}
                      testID={`initiate-refund-${refund.refundId}`}
                    >
                      <Text style={styles.actionBtnLabel}>
                        {initiatingRefundId === refund.chargeId ? "Processing…" : "Process"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )
      ) : null}

      {/* Disputes tab */}
      {!loading && !error && activeTab === "disputes" ? (
        disputes.length === 0 ? (
          <AdminEmptyState title="No disputes" body="Open chargebacks will appear here for your review." />
        ) : (
          <View style={styles.list}>
            {disputes.map((dispute) => (
              <View
                key={dispute.disputeId}
                style={[styles.row, dispute.status === "needs_response" && styles.rowUrgent]}
                testID={`dispute-${dispute.disputeId}`}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.amount}>{formatCents(dispute.amountCents, dispute.currency)}</Text>
                  <Text style={styles.meta}>{dispute.reason}</Text>
                  {dispute.dueByIso ? (
                    <Text style={styles.dueDate}>
                      Respond by: {dispute.dueByIso.split("T")[0]}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.statusPill, { backgroundColor: `${disputeStatusColor(dispute.status)}22` }]}>
                  <Text style={[styles.statusPillText, { color: disputeStatusColor(dispute.status) }]}>
                    {disputeStatusLabel(dispute.status)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )
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
  tabBar: { flexDirection: "row", gap: 0, borderBottomWidth: 1, borderBottomColor: "#E5E0D1" },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#E3A9A0" },
  tabLabel: { fontSize: 14, fontFamily: brandTypography.medium, color: "#6B6B6B" },
  tabLabelActive: { color: "#1A1A1A" },
  list: { gap: 8 },
  row: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E5E0D1", padding: 14, flexDirection: "row", alignItems: "flex-start" },
  rowUrgent: { borderColor: "#F59E0B", backgroundColor: "#FFFBF0" },
  rowLeft: { flex: 1, gap: 4 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  amount: { fontSize: 15, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  meta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  dueDate: { fontSize: 12, fontFamily: brandTypography.medium, color: "#F59E0B" },
  statusPill: { borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 },
  statusPillText: { fontSize: 11, fontFamily: brandTypography.medium },
  actionBtn: { borderWidth: 1, borderColor: "#E3A9A0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  actionBtnLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#E3A9A0" },
  btnDisabled: { opacity: 0.4 },
  errorText: { fontSize: 13, fontFamily: brandTypography.regular, color: "#EF4444", textAlign: "center" },
});
