/**
 * W42 — ServiceAddOnsScreen
 *
 * Manage tenant-level add-on services that can be attached to any service.
 * Each add-on has a name, price, duration, and active flag.
 */
import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { ServiceAddon } from "../../domains/services/serviceCatalogModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServiceAddOnsScreenProps = {
  loading: boolean;
  error: string | null;
  addons: ServiceAddon[];
  newName: string;
  newPrice: string;
  newDuration: string;
  submitting: boolean;
  formError: string | null;
  onNewNameChange: (v: string) => void;
  onNewPriceChange: (v: string) => void;
  onNewDurationChange: (v: string) => void;
  onCreate: () => void;
  onToggleActive: (addonId: string, active: boolean) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceAddOnsScreen({
  loading,
  error,
  addons,
  newName,
  newPrice,
  newDuration,
  submitting,
  formError,
  onNewNameChange,
  onNewPriceChange,
  onNewDurationChange,
  onCreate,
  onToggleActive,
  onRetry,
  onBack,
  testID = "service-addons-screen",
}: ServiceAddOnsScreenProps) {
  if (loading) return <AdminLoadingState label="Loading add-ons…" />;
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;

  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>‹ Add-ons & Packages</Text>
      </Pressable>

      <Text style={styles.title}>Add-ons & Packages</Text>

      {/* Create form */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>New add-on</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={onNewNameChange}
          placeholder="e.g. Deep conditioning"
          testID={`${testID}-new-name`}
        />

        <Text style={styles.label}>Price</Text>
        <TextInput
          style={styles.input}
          value={newPrice}
          onChangeText={onNewPriceChange}
          keyboardType="numeric"
          placeholder="0"
          testID={`${testID}-new-price`}
        />

        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={newDuration}
          onChangeText={onNewDurationChange}
          keyboardType="numeric"
          placeholder="15"
          testID={`${testID}-new-duration`}
        />

        {formError ? <Text style={styles.error} testID={`${testID}-form-error`}>{formError}</Text> : null}

        <Pressable
          style={[styles.btn, submitting && styles.btnDisabled]}
          disabled={submitting}
          onPress={onCreate}
          accessibilityRole="button"
          testID={`${testID}-create-btn`}
        >
          <Text style={styles.btnLabel}>{submitting ? "Creating…" : "Create add-on"}</Text>
        </Pressable>
      </View>

      {/* Add-on list */}
      <Text style={styles.sectionLabel}>All add-ons</Text>
      {addons.length === 0 ? (
        <AdminEmptyState title="No add-ons yet" body="Create your first add-on above." />
      ) : (
        addons.map((addon) => (
          <View key={addon.addonId} style={styles.addonRow} testID={`${testID}-addon-${addon.addonId}`}>
            <View style={styles.addonInfo}>
              <Text style={styles.addonName}>{addon.name}</Text>
              <Text style={styles.addonMeta}>
                {addon.price} {addon.currency} · {addon.durationMinutes} min
              </Text>
            </View>
            <Switch
              value={addon.active}
              onValueChange={(v) => onToggleActive(addon.addonId, v)}
              testID={`${testID}-toggle-${addon.addonId}`}
            />
          </View>
        ))
      )}

      <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button">
        <Text style={styles.backBtnLabel}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { gap: 12, paddingBottom: 24 },
  back: { fontSize: 14, color: "#6B6B6B", fontFamily: brandTypography.regular, marginBottom: 4 },
  title: { fontSize: 20, lineHeight: 28, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  sectionLabel: { fontSize: 13, fontFamily: brandTypography.medium, color: "#1A1A1A", marginTop: 4 },
  card: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 16,
    padding: 16, gap: 8, backgroundColor: "#FFFFFF",
  },
  label: { fontSize: 12, lineHeight: 16, color: "#1A1A1A", fontFamily: brandTypography.medium },
  input: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: "#FFFFFF", fontFamily: brandTypography.regular, color: "#1A1A1A",
  },
  error: { fontSize: 13, lineHeight: 18, color: "#F44336", fontFamily: brandTypography.regular },
  btn: {
    marginTop: 4, borderRadius: 9999, paddingVertical: 14,
    paddingHorizontal: 16, alignItems: "center", backgroundColor: "#E3A9A0",
  },
  btnDisabled: { opacity: 0.6 },
  btnLabel: { color: "#FFFFFF", fontSize: 14, fontFamily: brandTypography.medium },
  addonRow: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 12,
    padding: 12, backgroundColor: "#FFFFFF",
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  addonInfo: { gap: 2 },
  addonName: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  addonMeta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  backBtn: {
    marginTop: 4, borderRadius: 9999, paddingVertical: 12,
    paddingHorizontal: 16, alignItems: "center",
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E0D1",
  },
  backBtnLabel: { color: "#6B6B6B", fontSize: 14, fontFamily: brandTypography.medium },
});
