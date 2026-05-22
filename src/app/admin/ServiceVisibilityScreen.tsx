/**
 * W42 — ServiceVisibilityScreen
 *
 * Toggle three visibility flags per service:
 *   onlineBooking     — accept bookings via the consumer app
 *   marketplaceListed — show in the marketplace discovery feed
 *   internalOnly      — visible only to staff (overrides above two)
 */
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";

import { AdminToggleRow } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServiceVisibilityScreenProps = {
  serviceName: string;
  onlineBooking: boolean;
  marketplaceListed: boolean;
  internalOnly: boolean;
  submitting: boolean;
  submitError: string | null;
  submitSuccess: string | null;
  onOnlineBookingChange: (v: boolean) => void;
  onMarketplaceListedChange: (v: boolean) => void;
  onInternalOnlyChange: (v: boolean) => void;
  onSave: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceVisibilityScreen({
  serviceName,
  onlineBooking,
  marketplaceListed,
  internalOnly,
  submitting,
  submitError,
  submitSuccess,
  onOnlineBookingChange,
  onMarketplaceListedChange,
  onInternalOnlyChange,
  onSave,
  onBack,
  testID = "service-visibility-screen",
}: ServiceVisibilityScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>‹ {serviceName}</Text>
      </Pressable>

      <Text style={styles.title}>Visibility Settings</Text>

      <View style={styles.card} testID={`${testID}-toggles`}>
        <AdminToggleRow
          label="Online booking"
          sublabel="Clients can book this service through the app"
          value={onlineBooking}
          onToggle={onOnlineBookingChange}
        />

        <View style={styles.divider} />

        <AdminToggleRow
          label="Marketplace listed"
          sublabel="Service appears in discovery feed for new clients"
          value={marketplaceListed}
          onToggle={onMarketplaceListedChange}
        />

        <View style={styles.divider} />

        <AdminToggleRow
          label="Internal only"
          sublabel="Only staff can see or book this service (overrides above)"
          value={internalOnly}
          onToggle={onInternalOnlyChange}
        />
      </View>

      {internalOnly ? (
        <View style={styles.warnCard}>
          <Text style={styles.warnText}>
            Internal only is ON — online booking and marketplace settings are overridden.
          </Text>
        </View>
      ) : null}

      {submitError ? <Text style={styles.error} testID={`${testID}-submit-error`}>{submitError}</Text> : null}
      {submitSuccess ? <Text style={styles.success} testID={`${testID}-submit-success`}>{submitSuccess}</Text> : null}

      <Pressable
        style={[styles.btn, submitting && styles.btnDisabled]}
        disabled={submitting}
        onPress={onSave}
        accessibilityRole="button"
        testID={`${testID}-save-visibility-btn`}
      >
        <Text style={styles.btnLabel}>{submitting ? "Saving…" : "Save visibility"}</Text>
      </Pressable>

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
  card: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 16,
    backgroundColor: "#FFFFFF", overflow: "hidden",
  },
  divider: { height: 1, backgroundColor: "#F5F0E8", marginHorizontal: 16 },
  warnCard: {
    borderWidth: 1, borderColor: "#F9A825", borderRadius: 12,
    padding: 12, backgroundColor: "#FFFDE7",
  },
  warnText: { fontSize: 13, lineHeight: 18, color: "#F57F17", fontFamily: brandTypography.regular },
  error: { fontSize: 13, lineHeight: 18, color: "#F44336", fontFamily: brandTypography.regular },
  success: { fontSize: 13, lineHeight: 18, color: "#4CAF50", fontFamily: brandTypography.regular },
  btn: {
    borderRadius: 9999, paddingVertical: 14,
    paddingHorizontal: 16, alignItems: "center", backgroundColor: "#E3A9A0",
  },
  btnDisabled: { opacity: 0.6 },
  btnLabel: { color: "#FFFFFF", fontSize: 14, fontFamily: brandTypography.medium },
  backBtn: {
    borderRadius: 9999, paddingVertical: 12,
    paddingHorizontal: 16, alignItems: "center",
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E0D1",
  },
  backBtnLabel: { color: "#6B6B6B", fontSize: 14, fontFamily: brandTypography.medium },
});
