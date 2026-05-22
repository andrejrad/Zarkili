/**
 * W42 — ServiceBookingRulesScreen
 *
 * Edit per-service booking policy rules:
 *   depositPercent       — % of service price required upfront (0 = no deposit)
 *   cancellationWindowHours — client must cancel this many hours before
 *   leadTimeHours        — how far in advance a booking must be made
 *   bufferMinutes        — gap added after the service slot
 */
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { ServiceBookingRules } from "../../domains/services/serviceCatalogModel";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServiceBookingRulesScreenProps = {
  serviceName: string;
  loading: boolean;
  error: string | null;
  rules: ServiceBookingRules | null;
  depositPercent: string;
  cancellationWindowHours: string;
  leadTimeHours: string;
  bufferMinutes: string;
  submitting: boolean;
  submitError: string | null;
  submitSuccess: string | null;
  onDepositChange: (v: string) => void;
  onCancellationWindowChange: (v: string) => void;
  onLeadTimeChange: (v: string) => void;
  onBufferChange: (v: string) => void;
  onSave: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceBookingRulesScreen({
  serviceName,
  loading,
  error,
  rules,
  depositPercent,
  cancellationWindowHours,
  leadTimeHours,
  bufferMinutes,
  submitting,
  submitError,
  submitSuccess,
  onDepositChange,
  onCancellationWindowChange,
  onLeadTimeChange,
  onBufferChange,
  onSave,
  onRetry,
  onBack,
  testID = "service-booking-rules-screen",
}: ServiceBookingRulesScreenProps) {
  if (loading) return <AdminLoadingState label="Loading booking rules…" />;
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;

  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>‹ {serviceName}</Text>
      </Pressable>

      <Text style={styles.title}>Booking Rules</Text>

      {!rules ? (
        <Text style={styles.hint}>No custom rules saved yet — defaults apply. Set values below to override.</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Deposit (%)</Text>
        <TextInput
          style={styles.input}
          value={depositPercent}
          onChangeText={onDepositChange}
          keyboardType="numeric"
          placeholder="0"
          testID={`${testID}-deposit-input`}
        />

        <Text style={styles.label}>Cancellation window (hours)</Text>
        <TextInput
          style={styles.input}
          value={cancellationWindowHours}
          onChangeText={onCancellationWindowChange}
          keyboardType="numeric"
          placeholder="24"
          testID={`${testID}-cancellation-window-input`}
        />

        <Text style={styles.label}>Lead time (hours)</Text>
        <TextInput
          style={styles.input}
          value={leadTimeHours}
          onChangeText={onLeadTimeChange}
          keyboardType="numeric"
          placeholder="1"
          testID={`${testID}-lead-time-input`}
        />

        <Text style={styles.label}>Buffer after service (minutes)</Text>
        <TextInput
          style={styles.input}
          value={bufferMinutes}
          onChangeText={onBufferChange}
          keyboardType="numeric"
          placeholder="0"
          testID={`${testID}-buffer-input`}
        />

        {submitError ? <Text style={styles.error} testID={`${testID}-submit-error`}>{submitError}</Text> : null}
        {submitSuccess ? <Text style={styles.success} testID={`${testID}-submit-success`}>{submitSuccess}</Text> : null}

        <Pressable
          style={[styles.btn, submitting && styles.btnDisabled]}
          disabled={submitting}
          onPress={onSave}
          accessibilityRole="button"
          testID={`${testID}-save-rules-btn`}
        >
          <Text style={styles.btnLabel}>{submitting ? "Saving…" : "Save rules"}</Text>
        </Pressable>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Rule reference</Text>
        <Text style={styles.info}>Deposit %: 0 means no upfront payment required.</Text>
        <Text style={styles.info}>Cancellation window: 0 means clients can cancel any time.</Text>
        <Text style={styles.info}>Lead time: minimum advance notice for new bookings.</Text>
        <Text style={styles.info}>Buffer: unavailable gap added after each appointment.</Text>
      </View>

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
  hint: { fontSize: 13, lineHeight: 18, color: "#6B6B6B", fontFamily: brandTypography.regular },
  card: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 16,
    padding: 16, gap: 8, backgroundColor: "#FFFFFF",
  },
  infoCard: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 12,
    padding: 12, backgroundColor: "#FAF8F4", gap: 4,
  },
  infoTitle: { fontSize: 12, fontFamily: brandTypography.medium, color: "#1A1A1A", marginBottom: 2 },
  info: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  label: { fontSize: 12, lineHeight: 16, color: "#1A1A1A", fontFamily: brandTypography.medium },
  input: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: "#FFFFFF", fontFamily: brandTypography.regular, color: "#1A1A1A",
  },
  error: { fontSize: 13, lineHeight: 18, color: "#F44336", fontFamily: brandTypography.regular },
  success: { fontSize: 13, lineHeight: 18, color: "#4CAF50", fontFamily: brandTypography.regular },
  btn: {
    marginTop: 4, borderRadius: 9999, paddingVertical: 14,
    paddingHorizontal: 16, alignItems: "center", backgroundColor: "#E3A9A0",
  },
  btnDisabled: { opacity: 0.6 },
  btnLabel: { color: "#FFFFFF", fontSize: 14, fontFamily: brandTypography.medium },
  backBtn: {
    marginTop: 4, borderRadius: 9999, paddingVertical: 12,
    paddingHorizontal: 16, alignItems: "center",
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E0D1",
  },
  backBtnLabel: { color: "#6B6B6B", fontSize: 14, fontFamily: brandTypography.medium },
});
