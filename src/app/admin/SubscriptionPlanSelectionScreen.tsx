/**
 * W39 — SubscriptionPlanSelectionScreen: plan selection, current plan display,
 * and change-plan flow.
 *
 * Shows the current active subscription (status, plan, interval, next renewal)
 * and allows the owner to upgrade, downgrade, or switch to annual billing.
 * Uses BillingAdminService.changePlan which calls the Stripe Cloud Function.
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { Subscription } from "../../domains/billing";

import { AdminErrorState, AdminLoadingState, AdminRoleDeniedState } from "./AdminPatterns";
import type { BillingAdminService, PlanTier } from "./billingAdminService";
import { PLAN_CATALOGUE } from "./billingAdminService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatTimestamp(ts: { toDate: () => Date } | null): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    trialing: "Trial",
    active: "Active",
    past_due: "Past due",
    suspended: "Suspended",
    cancelled: "Cancelled",
  };
  return map[status] ?? status;
}

function statusColor(status: string): string {
  if (status === "active" || status === "trialing") return "#22C55E";
  if (status === "past_due") return "#F59E0B";
  return "#EF4444";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubscriptionPlanSelectionScreenProps = {
  tenantId: string;
  loading: boolean;
  error: string | null;
  subscription: Subscription | null;
  userRole: "owner" | "location_manager" | "salon_staff" | "platform_owner" | null;
  service: BillingAdminService | null;
  onBack: () => void;
  onPlanChanged: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubscriptionPlanSelectionScreen({
  subscription,
  loading,
  error,
  userRole,
  service,
  onBack,
  onPlanChanged,
}: SubscriptionPlanSelectionScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanTier["planId"] | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<"monthly" | "annual">(
    subscription?.interval ?? "monthly"
  );
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSuccess, setChangeSuccess] = useState(false);

  if (userRole && userRole !== "owner" && userRole !== "platform_owner") {
    return <AdminRoleDeniedState requiredRole="owner" onBack={onBack} />;
  }

  async function handleChangePlan() {
    if (!service || !selectedPlan) return;
    setChanging(true);
    setChangeError(null);
    try {
      await service.changePlan(subscription?.tenantId ?? "", selectedPlan, selectedInterval);
      setChangeSuccess(true);
      onPlanChanged();
    } catch {
      setChangeError("Plan change failed. Please try again or contact support.");
    } finally {
      setChanging(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Billing</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Subscription plan</Text>

      {loading ? <AdminLoadingState label="Loading subscription…" /> : null}
      {error && !loading ? <AdminErrorState message={error} /> : null}

      {/* Current subscription status */}
      {subscription && !loading ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Current plan</Text>
          <View style={styles.row}>
            <Text style={styles.planName}>
              {subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor(subscription.status)}22` }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor(subscription.status) }]}>
                {statusLabel(subscription.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.meta}>
            {subscription.interval === "annual" ? "Annual billing" : "Monthly billing"}
            {" · "}
            Renews {formatTimestamp(subscription.currentPeriodEnd)}
          </Text>
          {subscription.trialEndsAt ? (
            <Text style={styles.trialNote}>
              Trial ends {formatTimestamp(subscription.trialEndsAt)}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Interval toggle */}
      {!loading ? (
        <View style={styles.intervalToggle}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedInterval("monthly")}
            style={[styles.intervalBtn, selectedInterval === "monthly" && styles.intervalBtnActive]}
          >
            <Text style={[styles.intervalBtnLabel, selectedInterval === "monthly" && styles.intervalBtnLabelActive]}>
              Monthly
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedInterval("annual")}
            style={[styles.intervalBtn, selectedInterval === "annual" && styles.intervalBtnActive]}
          >
            <Text style={[styles.intervalBtnLabel, selectedInterval === "annual" && styles.intervalBtnLabelActive]}>
              Annual
            </Text>
            <Text style={styles.savingsBadge}>Save 17%</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Plan cards */}
      {!loading ? PLAN_CATALOGUE.map((plan) => {
        const isCurrentPlan = subscription?.planId === plan.planId;
        const priceCents = selectedInterval === "annual" ? plan.annualPriceCents : plan.monthlyPriceCents;
        const priceLabel = selectedInterval === "annual"
          ? `${formatCents(priceCents)}/yr`
          : `${formatCents(priceCents)}/mo`;
        const isSelected = selectedPlan === plan.planId;

        return (
          <Pressable
            key={plan.planId}
            accessibilityRole="button"
            onPress={() => setSelectedPlan(isCurrentPlan ? null : plan.planId)}
            style={[styles.planCard, isSelected && styles.planCardSelected, isCurrentPlan && styles.planCardCurrent]}
            testID={`plan-card-${plan.planId}`}
          >
            <View style={styles.planCardHeader}>
              <Text style={styles.planCardName}>{plan.displayName}</Text>
              <View style={styles.planCardPriceWrap}>
                <Text style={styles.planCardPrice}>{priceLabel}</Text>
                {isCurrentPlan ? (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                ) : null}
              </View>
            </View>
            {plan.descriptionLines.map((line) => (
              <Text key={line} style={styles.planCardFeature}>· {line}</Text>
            ))}
          </Pressable>
        );
      }) : null}

      {/* Change plan CTA */}
      {selectedPlan && selectedPlan !== subscription?.planId && !loading ? (
        <View style={styles.ctaSection}>
          {changeError ? <Text style={styles.errorText}>{changeError}</Text> : null}
          {changeSuccess ? (
            <Text style={styles.successText}>Plan updated successfully.</Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={changing}
              onPress={() => void handleChangePlan()}
              style={[styles.primaryBtn, changing && styles.primaryBtnDisabled]}
              testID="confirm-plan-change"
            >
              <Text style={styles.primaryBtnLabel}>
                {changing ? "Updating…" : `Switch to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`}
              </Text>
            </Pressable>
          )}
        </View>
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
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", padding: 16, gap: 8 },
  sectionLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  planName: { fontSize: 18, fontFamily: brandTypography.semibold, color: "#1A1A1A", flex: 1 },
  statusBadge: { borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 },
  statusBadgeText: { fontSize: 12, fontFamily: brandTypography.medium },
  meta: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  trialNote: { fontSize: 12, fontFamily: brandTypography.regular, color: "#F59E0B" },
  intervalToggle: { flexDirection: "row", gap: 8, backgroundColor: "#F5F0E8", borderRadius: 12, padding: 4 },
  intervalBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", gap: 2 },
  intervalBtnActive: { backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4,  shadowOffset: { width: 0, height: 2 } },
  intervalBtnLabel: { fontSize: 14, fontFamily: brandTypography.medium, color: "#6B6B6B" },
  intervalBtnLabelActive: { color: "#1A1A1A" },
  savingsBadge: { fontSize: 10, fontFamily: brandTypography.medium, color: "#22C55E" },
  planCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1.5, borderColor: "#E5E0D1", padding: 16, gap: 4 },
  planCardSelected: { borderColor: "#E3A9A0" },
  planCardCurrent: { borderColor: "#22C55E" },
  planCardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  planCardName: { fontSize: 16, fontFamily: brandTypography.semibold, color: "#1A1A1A", flex: 1 },
  planCardPriceWrap: { alignItems: "flex-end", gap: 4 },
  planCardPrice: { fontSize: 15, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  currentBadge: { backgroundColor: "#22C55E22", borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 },
  currentBadgeText: { fontSize: 10, fontFamily: brandTypography.medium, color: "#22C55E" },
  planCardFeature: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  ctaSection: { gap: 8 },
  primaryBtn: { backgroundColor: "#E3A9A0", paddingVertical: 14, borderRadius: 9999, alignItems: "center" },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnLabel: { fontSize: 14, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  errorText: { fontSize: 13, fontFamily: brandTypography.regular, color: "#EF4444", textAlign: "center" },
  successText: { fontSize: 13, fontFamily: brandTypography.regular, color: "#22C55E", textAlign: "center" },
});
