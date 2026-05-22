/**
 * W39 — CancelSubscriptionScreen: cancel or pause subscription flow.
 *
 * The owner must select a reason before cancelling. Cancel-at-period-end
 * is the default (preserves access until current period ends). Immediate
 * cancellation is available but requires an additional confirmation step.
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { Subscription } from "../../domains/billing";

import { AdminErrorState, AdminLoadingState, AdminRoleDeniedState } from "./AdminPatterns";
import type { BillingAdminService } from "./billingAdminService";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANCELLATION_REASONS = [
  "Too expensive",
  "Missing features I need",
  "Switching to a competitor",
  "Business is closing or on hold",
  "Just testing — will return",
  "Other",
] as const;

type CancellationReason = typeof CANCELLATION_REASONS[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: { toDate: () => Date } | null): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CancelSubscriptionScreenProps = {
  tenantId: string;
  loading: boolean;
  error: string | null;
  subscription: Subscription | null;
  userRole: "owner" | "location_manager" | "salon_staff" | "platform_owner" | null;
  service: BillingAdminService | null;
  onBack: () => void;
  onCancelled: () => void;
  onPaused: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CancelSubscriptionScreen({
  tenantId,
  loading,
  error,
  subscription,
  userRole,
  service,
  onBack,
  onCancelled,
  onPaused,
}: CancelSubscriptionScreenProps) {
  const [selectedReason, setSelectedReason] = useState<CancellationReason | null>(null);
  const [atPeriodEnd, setAtPeriodEnd] = useState(true);
  const [confirmStep, setConfirmStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<"cancelled" | "paused" | null>(null);

  if (userRole && userRole !== "owner" && userRole !== "platform_owner") {
    return <AdminRoleDeniedState requiredRole="owner" onBack={onBack} />;
  }

  async function handleCancel() {
    if (!service || !selectedReason || !subscription) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await service.cancelSubscription(tenantId, selectedReason, atPeriodEnd);
      setDone("cancelled");
      onCancelled();
    } catch {
      setSubmitError("Cancellation failed. Please contact support.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePause() {
    if (!service || !subscription) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await service.pauseSubscription(tenantId);
      setDone("paused");
      onPaused();
    } catch {
      setSubmitError("Could not pause subscription. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <AdminLoadingState label="Loading subscription…" />;
  if (error) return <AdminErrorState message={error} />;
  if (!subscription) return null;

  if (done === "cancelled") {
    return (
      <ScrollView contentContainerStyle={styles.root}>
        <View style={styles.doneCard}>
          <Text style={styles.doneTitle}>Subscription cancelled</Text>
          <Text style={styles.doneBody}>
            {atPeriodEnd
              ? `Your account remains active until ${formatTimestamp(subscription.currentPeriodEnd)}.`
              : "Your account has been cancelled immediately."}
          </Text>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnLabel}>Back to billing</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (done === "paused") {
    return (
      <ScrollView contentContainerStyle={styles.root}>
        <View style={styles.doneCard}>
          <Text style={styles.doneTitle}>Subscription paused</Text>
          <Text style={styles.doneBody}>
            Your subscription is paused. You can resume at any time from the billing screen.
          </Text>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnLabel}>Back to billing</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Billing</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Cancel subscription</Text>

      {/* Current plan summary */}
      <View style={styles.card}>
        <Text style={styles.currentPlan}>
          {subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1)} –{" "}
          {subscription.interval === "annual" ? "Annual" : "Monthly"}
        </Text>
        <Text style={styles.meta}>Renews {formatTimestamp(subscription.currentPeriodEnd)}</Text>
      </View>

      {/* Pause option */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Try pausing first</Text>
        <Text style={styles.body}>
          Pausing keeps your data and settings intact. Resume any time without re-entering payment info.
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={() => void handlePause()}
          style={[styles.secondaryBtn, submitting && styles.btnDisabled]}
          testID="pause-subscription-btn"
        >
          <Text style={styles.secondaryBtnLabel}>{submitting ? "Pausing…" : "Pause subscription"}</Text>
        </Pressable>
      </View>

      {/* Cancellation reason */}
      {!confirmStep ? (
        <>
          <Text style={styles.sectionTitle}>Why are you leaving?</Text>
          <View style={styles.reasonList}>
            {CANCELLATION_REASONS.map((reason) => (
              <Pressable
                key={reason}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedReason === reason }}
                onPress={() => setSelectedReason(reason)}
                style={[styles.reasonRow, selectedReason === reason && styles.reasonRowSelected]}
                testID={`reason-${reason}`}
              >
                <View style={[styles.radio, selectedReason === reason && styles.radioSelected]} />
                <Text style={styles.reasonLabel}>{reason}</Text>
              </Pressable>
            ))}
          </View>

          {/* Cancel timing */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>When should cancellation take effect?</Text>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: atPeriodEnd }}
              onPress={() => setAtPeriodEnd(true)}
              style={styles.timingRow}
              testID="cancel-at-period-end"
            >
              <View style={[styles.radio, atPeriodEnd && styles.radioSelected]} />
              <View style={styles.timingText}>
                <Text style={styles.timingLabel}>At period end (recommended)</Text>
                <Text style={styles.timingMeta}>
                  Keep access until {formatTimestamp(subscription.currentPeriodEnd)}
                </Text>
              </View>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: !atPeriodEnd }}
              onPress={() => setAtPeriodEnd(false)}
              style={styles.timingRow}
              testID="cancel-immediately"
            >
              <View style={[styles.radio, !atPeriodEnd && styles.radioSelected]} />
              <View style={styles.timingText}>
                <Text style={styles.timingLabel}>Immediately</Text>
                <Text style={styles.timingMeta}>Access ends now. No refund on unused period.</Text>
              </View>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!selectedReason || submitting}
            onPress={() => setConfirmStep(true)}
            style={[styles.dangerBtn, (!selectedReason || submitting) && styles.btnDisabled]}
            testID="proceed-to-confirm"
          >
            <Text style={styles.dangerBtnLabel}>Proceed to cancellation</Text>
          </Pressable>
        </>
      ) : (
        /* Confirm step */
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Confirm cancellation</Text>
          <Text style={styles.confirmBody}>
            {atPeriodEnd
              ? `Your subscription will end on ${formatTimestamp(subscription.currentPeriodEnd)}. You can reactivate before then.`
              : "Your subscription will end immediately. This action cannot be undone."}
          </Text>
          <Text style={styles.confirmReason}>Reason: {selectedReason}</Text>
          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={() => void handleCancel()}
            style={[styles.dangerBtn, submitting && styles.btnDisabled]}
            testID="confirm-cancel-btn"
          >
            <Text style={styles.dangerBtnLabel}>{submitting ? "Cancelling…" : "Confirm cancellation"}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirmStep(false)}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnLabel}>Go back</Text>
          </Pressable>
        </View>
      )}
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
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", padding: 16, gap: 8 },
  currentPlan: { fontSize: 16, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  meta: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  sectionLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.5 },
  body: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  sectionTitle: { fontSize: 16, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  reasonList: { gap: 4 },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E5E0D1" },
  reasonRowSelected: { borderColor: "#E3A9A0", backgroundColor: "#FDF7F6" },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#D1C7B7" },
  radioSelected: { borderColor: "#E3A9A0", backgroundColor: "#E3A9A0" },
  reasonLabel: { fontSize: 14, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  timingRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 8 },
  timingText: { flex: 1, gap: 2 },
  timingLabel: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  timingMeta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  divider: { height: 1, backgroundColor: "#E5E0D1", marginVertical: 4 },
  confirmCard: { backgroundColor: "#FDF7F6", borderRadius: 16, borderWidth: 1, borderColor: "#E3A9A0", padding: 16, gap: 12 },
  confirmTitle: { fontSize: 16, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  confirmBody: { fontSize: 14, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  confirmReason: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  doneCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", padding: 24, gap: 12, alignItems: "center" },
  doneTitle: { fontSize: 20, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  doneBody: { fontSize: 14, fontFamily: brandTypography.regular, color: "#6B6B6B", textAlign: "center" },
  primaryBtn: { backgroundColor: "#E3A9A0", paddingVertical: 14, borderRadius: 9999, alignItems: "center", minWidth: 200 },
  primaryBtnLabel: { fontSize: 14, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  secondaryBtn: { borderWidth: 1, borderColor: "#E5E0D1", paddingVertical: 12, borderRadius: 9999, alignItems: "center" },
  secondaryBtnLabel: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  dangerBtn: { backgroundColor: "#EF4444", paddingVertical: 14, borderRadius: 9999, alignItems: "center" },
  dangerBtnLabel: { fontSize: 14, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  btnDisabled: { opacity: 0.4 },
  errorText: { fontSize: 13, fontFamily: brandTypography.regular, color: "#EF4444", textAlign: "center" },
});
