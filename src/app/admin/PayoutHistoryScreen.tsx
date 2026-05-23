/**
 * W39 — PayoutHistoryScreen: payout history, pending balance, and payout
 * schedule controls.
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { Payout, PendingBalance, PayoutSchedule } from "../../domains/billing/payoutService";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import type { BillingAdminService } from "./billingAdminService";

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

function payoutStatusColor(status: Payout["status"]): string {
  if (status === "paid") return "#22C55E";
  if (status === "in_transit" || status === "pending") return "#F59E0B";
  return "#EF4444";
}

function payoutStatusLabel(status: Payout["status"]): string {
  const map: Record<Payout["status"], string> = {
    pending: "Pending",
    in_transit: "In transit",
    paid: "Paid",
    failed: "Failed",
    canceled: "Canceled",
  };
  return map[status];
}

const INTERVAL_LABELS: Record<PayoutSchedule["interval"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  manual: "Manual",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PayoutHistoryScreenProps = {
  tenantId: string;
  loading: boolean;
  error: string | null;
  payouts: Payout[];
  pendingBalance: PendingBalance | null;
  payoutSchedule: PayoutSchedule | null;
  service: BillingAdminService | null;
  onRetry: () => void;
  onBack: () => void;
  onScheduleSaved: () => void;
};

// ---------------------------------------------------------------------------
// PayoutScheduleCard
// ---------------------------------------------------------------------------

function PayoutScheduleCard({
  tenantId,
  schedule,
  service,
  onSaved,
}: {
  tenantId: string;
  schedule: PayoutSchedule | null;
  service: BillingAdminService | null;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [interval, setInterval] = useState<PayoutSchedule["interval"]>(schedule?.interval ?? "daily");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    if (!service) return;
    setSaving(true);
    setSaveError(null);
    try {
      await service.setPayoutSchedule(tenantId, {
        interval,
        weeklyAnchorDay: interval === "weekly" ? 1 : null,
        monthlyAnchorDay: interval === "monthly" ? 1 : null,
        delayDays: 2,
      });
      setEditing(false);
      onSaved();
    } catch {
      setSaveError("Could not save schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Payout schedule</Text>
      {!editing ? (
        <>
          <Text style={styles.scheduleValue}>
            {schedule ? INTERVAL_LABELS[schedule.interval] : "Not configured"}
          </Text>
          {schedule ? (
            <Text style={styles.scheduleMeta}>
              {schedule.delayDays} business-day delay · Stripe default for US Express accounts
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => setEditing(true)}
            style={styles.editBtn}
            testID="edit-schedule-btn"
          >
            <Text style={styles.editBtnLabel}>Edit schedule</Text>
          </Pressable>
        </>
      ) : (
        <>
          {(["daily", "weekly", "monthly", "manual"] as const).map((opt) => (
            <Pressable
              key={opt}
              accessibilityRole="radio"
              accessibilityState={{ checked: interval === opt }}
              onPress={() => setInterval(opt)}
              style={[styles.intervalOption, interval === opt && styles.intervalOptionSelected]}
              testID={`schedule-${opt}`}
            >
              <View style={[styles.radio, interval === opt && styles.radioSelected]} />
              <Text style={styles.intervalLabel}>{INTERVAL_LABELS[opt]}</Text>
            </Pressable>
          ))}
          {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => void handleSave()}
            style={[styles.primaryBtn, saving && styles.btnDisabled]}
            testID="save-schedule-btn"
          >
            <Text style={styles.primaryBtnLabel}>{saving ? "Saving…" : "Save schedule"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setEditing(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnLabel}>Cancel</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PayoutHistoryScreen({
  tenantId,
  loading,
  error,
  payouts,
  pendingBalance,
  payoutSchedule,
  service,
  onRetry,
  onBack,
  onScheduleSaved,
}: PayoutHistoryScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Billing</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Payouts</Text>

      {loading ? <AdminLoadingState label="Loading payout data…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {/* Pending balance */}
      {!loading && pendingBalance ? (
        <View style={styles.balanceCard}>
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>Available</Text>
            <Text style={styles.balanceValue} testID="available-balance">
              {formatCents(pendingBalance.availableCents, pendingBalance.currency)}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>Pending</Text>
            <Text style={[styles.balanceValue, styles.pendingValue]} testID="pending-balance">
              {formatCents(pendingBalance.pendingCents, pendingBalance.currency)}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Payout schedule */}
      {!loading ? (
        <PayoutScheduleCard
          tenantId={tenantId}
          schedule={payoutSchedule}
          service={service}
          onSaved={onScheduleSaved}
        />
      ) : null}

      {/* Payout history */}
      {!loading && !error ? (
        <>
          <Text style={styles.historyTitle}>Payout history</Text>
          {payouts.length === 0 ? (
            <AdminEmptyState
              title="No payouts yet"
              body="Payouts will appear here once your first payout cycle completes."
            />
          ) : (
            <View style={styles.list}>
              {payouts.map((payout) => (
                <View key={payout.payoutId} style={styles.payoutRow} testID={`payout-${payout.payoutId}`}>
                  <View style={styles.payoutLeft}>
                    <Text style={styles.payoutAmount}>
                      {formatCents(payout.amountCents, payout.currency)}
                    </Text>
                    <Text style={styles.payoutDate}>Arrival: {payout.arrivalDate}</Text>
                    {payout.failureMessage ? (
                      <Text style={styles.failureText}>{payout.failureMessage}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: `${payoutStatusColor(payout.status)}22` }]}>
                    <Text style={[styles.statusPillText, { color: payoutStatusColor(payout.status) }]}>
                      {payoutStatusLabel(payout.status)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
  balanceCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", padding: 16, flexDirection: "row", alignItems: "center" },
  balanceCol: { flex: 1, alignItems: "center", gap: 4 },
  balanceDivider: { width: 1, height: 40, backgroundColor: "#E5E0D1" },
  balanceLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.5 },
  balanceValue: { fontSize: 22, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  pendingValue: { color: "#6B6B6B" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", padding: 16, gap: 8 },
  sectionLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.5 },
  scheduleValue: { fontSize: 16, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  scheduleMeta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  editBtn: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnLabel: { fontSize: 13, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  intervalOption: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
  intervalOptionSelected: { backgroundColor: "#FDF7F6" },
  intervalLabel: { fontSize: 14, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#D1C7B7" },
  radioSelected: { borderColor: "#E3A9A0", backgroundColor: "#E3A9A0" },
  primaryBtn: { backgroundColor: "#E3A9A0", paddingVertical: 12, borderRadius: 9999, alignItems: "center" },
  primaryBtnLabel: { fontSize: 14, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  cancelBtn: { paddingVertical: 8, alignItems: "center" },
  cancelBtnLabel: { fontSize: 13, fontFamily: brandTypography.medium, color: "#6B6B6B" },
  btnDisabled: { opacity: 0.4 },
  errorText: { fontSize: 13, fontFamily: brandTypography.regular, color: "#EF4444", textAlign: "center" },
  historyTitle: { fontSize: 16, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  list: { gap: 8 },
  payoutRow: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E5E0D1", padding: 14, flexDirection: "row", alignItems: "center" },
  payoutLeft: { flex: 1, gap: 4 },
  payoutAmount: { fontSize: 16, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  payoutDate: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  failureText: { fontSize: 12, fontFamily: brandTypography.regular, color: "#EF4444" },
  statusPill: { borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 12, fontFamily: brandTypography.medium },
});
