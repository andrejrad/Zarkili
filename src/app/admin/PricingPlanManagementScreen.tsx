import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import type { PricingPlan } from "./platformAdminTypes";

export type PricingPlanManagementScreenProps = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  plans: PricingPlan[];
  onEditPlan: (planId: string) => void;
  onTogglePlanActive: (planId: string, isActive: boolean) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

export function PricingPlanManagementScreen({
  loading,
  saving,
  error,
  plans,
  onEditPlan,
  onTogglePlanActive,
  onRetry,
  onBack,
  testID = "pricing-plan-management-screen",
}: PricingPlanManagementScreenProps) {
  if (loading) {
    return (
      <View style={styles.center} testID={testID}>
        <ActivityIndicator testID="loading-indicator" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center} testID={testID}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRetry} testID="retry-btn" style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pricing Plans</Text>
      </View>

      <ScrollView style={styles.scroll}>
        {plans.length === 0 && (
          <Text style={styles.emptyText}>No pricing plans configured.</Text>
        )}
        {plans.map((plan) => (
          <View key={plan.planId} style={styles.planCard} testID={`plan-${plan.planId}`}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.displayName}</Text>
              <View style={[styles.activeBadge, plan.isActive ? styles.active : styles.inactive]}>
                <Text style={styles.activeBadgeText}>{plan.isActive ? "Active" : "Inactive"}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceBlock}>
                <Text style={styles.priceValue}>${plan.monthlyPriceUsd}/mo</Text>
                <Text style={styles.priceLabel}>Monthly</Text>
              </View>
              <View style={styles.priceBlock}>
                <Text style={styles.priceValue}>${plan.yearlyPriceUsd}/yr</Text>
                <Text style={styles.priceLabel}>Yearly</Text>
              </View>
            </View>

            <View style={styles.limitsRow}>
              <Text style={styles.limitText}>Locations: {plan.maxLocations}</Text>
              <Text style={styles.limitText}>Staff: {plan.maxStaff}</Text>
              <Text style={styles.limitText}>AI: ${plan.maxMonthlyAiCallsUsd}/mo</Text>
            </View>

            <View style={styles.features}>
              {plan.features.slice(0, 4).map((f) => (
                <Text key={f} style={styles.featureTag}>✓ {f}</Text>
              ))}
              {plan.features.length > 4 && (
                <Text style={styles.featureMore}>+{plan.features.length - 4} more</Text>
              )}
            </View>

            <View style={styles.planActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => onEditPlan(plan.planId)}
                testID={`edit-btn-${plan.planId}`}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, plan.isActive ? styles.deactivateBtn : styles.activateBtn]}
                onPress={() => onTogglePlanActive(plan.planId, !plan.isActive)}
                disabled={saving}
                testID={`toggle-btn-${plan.planId}`}
              >
                <Text style={styles.toggleBtnText}>
                  {plan.isActive ? "Deactivate" : "Activate"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  backText: { color: "#6b7280", marginRight: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  scroll: { flex: 1 },
  planCard: { backgroundColor: "#ffffff", marginHorizontal: 12, marginTop: 12, padding: 16, borderRadius: 12 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  planName: { fontSize: 18, fontWeight: "800", color: "#111827" },
  activeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  active: { backgroundColor: "#10b981" },
  inactive: { backgroundColor: "#9ca3af" },
  activeBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  priceRow: { flexDirection: "row", gap: 24, marginBottom: 12 },
  priceBlock: { alignItems: "center" },
  priceValue: { fontSize: 20, fontWeight: "800", color: "#1d4ed8" },
  priceLabel: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  limitsRow: { flexDirection: "row", gap: 16, marginBottom: 12 },
  limitText: { fontSize: 12, color: "#6b7280" },
  features: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  featureTag: { fontSize: 12, color: "#374151", backgroundColor: "#f3f4f6", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  featureMore: { fontSize: 12, color: "#9ca3af" },
  planActions: { flexDirection: "row", gap: 8 },
  editBtn: { flex: 1, backgroundColor: "#f3f4f6", padding: 10, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#d1d5db" },
  editBtnText: { color: "#374151", fontWeight: "600" },
  toggleBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: "center" },
  activateBtn: { backgroundColor: "#10b981" },
  deactivateBtn: { backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#d1d5db" },
  toggleBtnText: { color: "#ffffff", fontWeight: "600" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 32 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
