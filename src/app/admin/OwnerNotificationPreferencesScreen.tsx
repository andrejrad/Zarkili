/**
 * W38 — OwnerNotificationPreferencesScreen: operational alerts and digest
 * preferences for the salon owner.
 *
 * W38-DEBT-8: Preferences are persisted to Firestore under
 * `tenants/{tenantId}/ownerNotificationPrefs/prefs` using setDoc with merge.
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../../shared/config/firebase";
import { brandTypography } from "../../shared/ui/brandTypography";

import { AdminToggleRow } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OwnerNotificationPrefs = {
  bookingAlerts: boolean;
  paymentAlerts: boolean;
  payoutAlerts: boolean;
  aiSafetyEvents: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
};

const DEFAULT_PREFS: OwnerNotificationPrefs = {
  bookingAlerts: true,
  paymentAlerts: true,
  payoutAlerts: true,
  aiSafetyEvents: true,
  dailyDigest: true,
  weeklyDigest: false,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type OwnerNotificationPreferencesScreenProps = {
  tenantId: string;
  onBack: () => void;
};

export function OwnerNotificationPreferencesScreen({
  tenantId,
  onBack,
}: OwnerNotificationPreferencesScreenProps) {
  const [prefs, setPrefs] = useState<OwnerNotificationPrefs>(DEFAULT_PREFS);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function toggle(key: keyof OwnerNotificationPrefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaveSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const ref = doc(db, "tenants", tenantId, "ownerNotificationPrefs", "prefs");
      await setDoc(ref, { ...prefs, updatedAt: serverTimestamp() }, { merge: true });
      setSaveSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save preferences.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Settings</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Notification preferences</Text>

      <View style={styles.card}>
        <Text style={styles.groupLabel}>Operational alerts</Text>
        <AdminToggleRow
          label="Booking alerts"
          sublabel="New bookings, cancellations, reschedule requests"
          value={prefs.bookingAlerts}
          onToggle={() => toggle("bookingAlerts")}
        />
        <View style={styles.divider} />
        <AdminToggleRow
          label="Payment alerts"
          sublabel="Failed charges, refund requests, chargeback notices"
          value={prefs.paymentAlerts}
          onToggle={() => toggle("paymentAlerts")}
        />
        <View style={styles.divider} />
        <AdminToggleRow
          label="Payout alerts"
          sublabel="Payout failures, Connect restricted state, pending balance"
          value={prefs.payoutAlerts}
          onToggle={() => toggle("payoutAlerts")}
        />
        <View style={styles.divider} />
        <AdminToggleRow
          label="AI safety events"
          sublabel="Content moderation flags, safety threshold breaches"
          value={prefs.aiSafetyEvents}
          onToggle={() => toggle("aiSafetyEvents")}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.groupLabel}>Digests</Text>
        <AdminToggleRow
          label="Daily summary"
          sublabel="End-of-day revenue, bookings, and action items"
          value={prefs.dailyDigest}
          onToggle={() => toggle("dailyDigest")}
        />
        <View style={styles.divider} />
        <AdminToggleRow
          label="Weekly report"
          sublabel="Week-over-week performance summary (email)"
          value={prefs.weeklyDigest}
          onToggle={() => toggle("weeklyDigest")}
        />
      </View>

      <View style={styles.footer}>
        {saveSuccess ? (
          <Text style={styles.successMsg}>Preferences saved.</Text>
        ) : null}
        {saveError ? (
          <Text style={styles.errorMsg}>{saveError}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={handleSave}
          style={[styles.ctaButton, saving && styles.ctaButtonDisabled]}
          testID="save-prefs-btn"
        >
          <Text style={styles.ctaLabel}>{saving ? "Saving…" : "Save preferences"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingBottom: 32, gap: 16 },
  backRow: { paddingBottom: 4 },
  backLabel: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  pageTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    padding: 16,
    gap: 4,
  },
  groupLabel: {
    fontSize: 12,
    fontFamily: brandTypography.semibold,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#F2EDDD",
    marginVertical: 2,
  },
  footer: {
    gap: 10,
  },
  successMsg: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#22C55E",
    textAlign: "center",
  },
  errorMsg: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#EF4444",
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: "#E3A9A0",
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: "center",
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaLabel: {
    fontSize: 15,
    fontFamily: brandTypography.medium,
    color: "#FFFFFF",
  },
});
