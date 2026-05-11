/**
 * W42 — ServicePricingScreen
 *
 * Per-location price overrides for a service.
 * Each override specifies a location, price, and currency.
 * Default price is managed on the service itself (ServiceEditScreen).
 */
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { ServicePriceOverride } from "../../domains/services/serviceCatalogModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServicePricingScreenProps = {
  serviceName: string;
  loading: boolean;
  error: string | null;
  overrides: ServicePriceOverride[];
  locationId: string;
  price: string;
  currency: string;
  submitting: boolean;
  formError: string | null;
  onLocationIdChange: (v: string) => void;
  onPriceChange: (v: string) => void;
  onCurrencyChange: (v: string) => void;
  onUpsert: () => void;
  onDeleteOverride: (overrideId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServicePricingScreen({
  serviceName,
  loading,
  error,
  overrides,
  locationId,
  price,
  currency,
  submitting,
  formError,
  onLocationIdChange,
  onPriceChange,
  onCurrencyChange,
  onUpsert,
  onDeleteOverride,
  onRetry,
  onBack,
  testID = "service-pricing-screen",
}: ServicePricingScreenProps) {
  if (loading) return <AdminLoadingState label="Loading price overrides…" />;
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;

  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>‹ {serviceName}</Text>
      </Pressable>

      <Text style={styles.title}>Per-Location Pricing</Text>
      <Text style={styles.subtitle}>Override the default price for specific locations.</Text>

      {/* Upsert form */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Add / update override</Text>

        <Text style={styles.label}>Location ID</Text>
        <TextInput
          style={styles.input}
          value={locationId}
          onChangeText={onLocationIdChange}
          placeholder="loc_abc123"
          autoCapitalize="none"
          testID={`${testID}-location-input`}
        />

        <Text style={styles.label}>Price</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={onPriceChange}
          keyboardType="numeric"
          placeholder="0"
          testID={`${testID}-price-input`}
        />

        <Text style={styles.label}>Currency</Text>
        <TextInput
          style={styles.input}
          value={currency}
          onChangeText={onCurrencyChange}
          placeholder="USD"
          autoCapitalize="characters"
          maxLength={3}
          testID={`${testID}-currency-input`}
        />

        {formError ? <Text style={styles.error} testID={`${testID}-form-error`}>{formError}</Text> : null}

        <Pressable
          style={[styles.btn, submitting && styles.btnDisabled]}
          disabled={submitting}
          onPress={onUpsert}
          accessibilityRole="button"
          testID={`${testID}-upsert-btn`}
        >
          <Text style={styles.btnLabel}>{submitting ? "Saving…" : "Save override"}</Text>
        </Pressable>
      </View>

      {/* Existing overrides */}
      <Text style={styles.sectionLabel}>Existing overrides</Text>
      {overrides.length === 0 ? (
        <AdminEmptyState
          title="No overrides"
          body="The default service price applies to all locations."
        />
      ) : (
        overrides.map((ov) => (
          <View key={ov.overrideId} style={styles.overrideRow} testID={`${testID}-override-${ov.overrideId}`}>
            <View style={styles.overrideInfo}>
              <Text style={styles.overrideName}>Location: {ov.locationId}</Text>
              <Text style={styles.overrideMeta}>{ov.price} {ov.currency}</Text>
            </View>
            <Pressable
              onPress={() => onDeleteOverride(ov.overrideId)}
              accessibilityRole="button"
              testID={`${testID}-delete-override-${ov.overrideId}`}
            >
              <Text style={styles.deleteLabel}>Remove</Text>
            </Pressable>
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
  subtitle: { fontSize: 14, lineHeight: 20, color: "#6B6B6B", fontFamily: brandTypography.regular },
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
  overrideRow: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 12,
    padding: 12, backgroundColor: "#FFFFFF",
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  overrideInfo: { gap: 2 },
  overrideName: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  overrideMeta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  deleteLabel: { fontSize: 13, color: "#F44336", fontFamily: brandTypography.medium },
  backBtn: {
    marginTop: 4, borderRadius: 9999, paddingVertical: 12,
    paddingHorizontal: 16, alignItems: "center",
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E0D1",
  },
  backBtnLabel: { color: "#6B6B6B", fontSize: 14, fontFamily: brandTypography.medium },
});
