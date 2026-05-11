/**
 * W45 — LoyaltyConfigScreen
 *
 * Loyalty programme configuration: enabled toggle, points per currency unit,
 * expiry days, tier list editor, and redemption options list.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { LoyaltyConfigInput, LoyaltyTierInput } from "../../domains/loyalty/loyaltyAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type LoyaltyConfigScreenProps = {
  loading: boolean;
  error: string | null;
  config: LoyaltyConfigInput | null;
  saving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onPointsPerUnitChange: (value: string) => void;
  onExpiryDaysChange: (value: string) => void;
  onAddTier: () => void;
  onRemoveTier: (tierId: string) => void;
  onTierChange: (tierId: string, field: keyof LoyaltyTierInput, value: string) => void;
  onSave: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function LoyaltyConfigScreen({
  loading,
  error,
  config,
  saving,
  saveError,
  saveSuccess,
  onToggleEnabled,
  onPointsPerUnitChange,
  onExpiryDaysChange,
  onAddTier,
  onRemoveTier,
  onTierChange,
  onSave,
  onRetry,
  onBack,
  testID = "loyalty-config-screen",
}: LoyaltyConfigScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Loyalty Settings</Text>
      </View>

      {loading && <AdminLoadingState label="Loading loyalty config…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && !config && (
        <AdminEmptyState
          title="No configuration"
          body="Loyalty has not been configured yet."
          cta="Create config"
          onCta={onSave}
        />
      )}
      {!loading && !error && config && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Enabled toggle */}
          <View style={styles.row}>
            <Text style={styles.label}>Programme enabled</Text>
            <Switch
              value={config.enabled}
              onValueChange={onToggleEnabled}
              testID="loyalty-enabled-switch"
            />
          </View>

          {/* Points per currency unit */}
          <Text style={styles.sectionLabel}>Points per currency unit</Text>
          <TextInput
            style={styles.input}
            value={String(config.pointsPerCurrencyUnit)}
            onChangeText={onPointsPerUnitChange}
            keyboardType="numeric"
            testID="points-per-unit-input"
          />

          {/* Expiry days */}
          <Text style={styles.sectionLabel}>Points expiry (days, blank = never)</Text>
          <TextInput
            style={styles.input}
            value={config.pointsExpiryDays != null ? String(config.pointsExpiryDays) : ""}
            onChangeText={onExpiryDaysChange}
            keyboardType="numeric"
            testID="expiry-days-input"
          />

          {/* Tiers */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Tiers</Text>
            <Pressable onPress={onAddTier} accessibilityRole="button" testID="add-tier-btn">
              <Text style={styles.addBtnText}>+ Add tier</Text>
            </Pressable>
          </View>
          {config.tiers.map((tier) => (
            <View key={tier.tierId} style={styles.card} testID={`tier-item-${tier.tierId}`}>
              <TextInput
                style={styles.input}
                placeholder="Tier name"
                value={tier.name}
                onChangeText={(v) => onTierChange(tier.tierId, "name", v)}
                testID={`tier-name-${tier.tierId}`}
              />
              <TextInput
                style={styles.input}
                placeholder="Min points"
                value={String(tier.minPoints)}
                onChangeText={(v) => onTierChange(tier.tierId, "minPoints", v)}
                keyboardType="numeric"
                testID={`tier-min-${tier.tierId}`}
              />
              <Pressable
                onPress={() => onRemoveTier(tier.tierId)}
                accessibilityRole="button"
                style={styles.removeBtn}
                testID={`tier-remove-${tier.tierId}`}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </Pressable>
            </View>
          ))}

          {/* Redemption options count */}
          <Text style={styles.sectionLabel}>
            Redemption options ({config.redemptionOptions.length})
          </Text>

          {saveError && <Text style={styles.errorText}>{saveError}</Text>}
          {saveSuccess && <Text style={styles.successText}>Saved successfully.</Text>}

          <Pressable
            onPress={onSave}
            disabled={saving}
            accessibilityRole="button"
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            testID="save-loyalty-config-btn"
          >
            <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save settings"}</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  backBtn: { paddingRight: 8 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6b7280" },
  title: { fontFamily: brandTypography.semibold, fontSize: 18, color: "#111827" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  label: { fontFamily: brandTypography.regular, fontSize: 14, color: "#374151" },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#374151", marginTop: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  addBtnText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#4f46e5" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: brandTypography.regular,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  removeBtn: { alignSelf: "flex-start" },
  removeBtnText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#ef4444" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#ef4444" },
  successText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#16a34a" },
  saveBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#fff" },
});
