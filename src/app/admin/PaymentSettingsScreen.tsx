/**
 * src/app/admin/PaymentSettingsScreen.tsx
 *
 * Admin screen for configuring per-tenant Stripe payment settings:
 *   - Enable/disable payments
 *   - Payment mode: deposit | full | card_on_file
 *   - Deposit percentage (when mode = deposit)
 *   - Connect onboarding status with a "Set Up Stripe" CTA
 *
 * Props:
 *   - functions: Firebase Functions instance (injected from App / Shell)
 *   - tenantId: current tenant
 *   - connectAccount: pre-fetched connect/account record (may be null)
 *   - userRole: used for role-gating (owner/location_manager required)
 *   - onBack: back nav handler
 *   - onLaunchConnectOnboarding: opens in-app browser for onboarding URL
 */

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { httpsCallable, type Functions } from "firebase/functions";

import { colors, spacing } from "../../shared/ui";
import type { ConnectAccount } from "../../domains/connect";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentMode = "deposit" | "full" | "card_on_file";

type CancellationCharge = "deposit" | "custom";

type PaymentSettings = {
  paymentsEnabled: boolean;
  paymentMode: PaymentMode;
  depositPercentage: number;
  currency: string;
  platformFeePercent: number;
  cancellationPolicy: boolean;
  cancellationHours: number;
  cancellationCharge: CancellationCharge;
  cancellationAmountMinor: number;
};

type PaymentSettingsScreenProps = {
  tenantId: string;
  functions: Functions;
  connectAccount: ConnectAccount | null;
  userRole: "owner" | "location_manager" | "salon_staff" | "platform_owner" | null;
  onBack: () => void;
  onLaunchConnectOnboarding: (url: string) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MODE_LABELS: Record<PaymentMode, string> = {
  deposit: "Deposit only (hold, charge remainder later)",
  full: "Full amount (hold, capture after service)",
  card_on_file: "Card on file (charge full post-service)",
};

const DEFAULT_SETTINGS: PaymentSettings = {
  paymentsEnabled: false,
  paymentMode: "full",
  depositPercentage: 30,
  currency: "usd",
  platformFeePercent: 0.02,
  cancellationPolicy: false,
  cancellationHours: 24,
  cancellationCharge: "deposit",
  cancellationAmountMinor: 0,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PaymentSettingsScreen({
  tenantId,
  functions,
  connectAccount,
  userRole,
  onBack,
  onLaunchConnectOnboarding,
}: PaymentSettingsScreenProps) {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [depositPctText, setDepositPctText] = useState("30");
  const [cancellationAmountText, setCancellationAmountText] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, [tenantId]);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const fn = httpsCallable<{ tenantId: string }, PaymentSettings>(
        functions,
        "getPaymentSettings",
      );
      const result = await fn({ tenantId });
      const s = result.data;
      setSettings(s);
      setDepositPctText(String(s.depositPercentage ?? 30));
      setCancellationAmountText(String((s.cancellationAmountMinor ?? 0) / 100));
    } catch {
      setError("Failed to load payment settings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const depositPct = parseInt(depositPctText, 10);
    if (isNaN(depositPct) || depositPct < 1 || depositPct > 99) {
      setError("Deposit percentage must be between 1 and 99.");
      return;
    }
    const cancellationAmountDollars = parseFloat(cancellationAmountText);
    if (
      settings.cancellationPolicy &&
      settings.cancellationCharge === "custom" &&
      (isNaN(cancellationAmountDollars) || cancellationAmountDollars < 0)
    ) {
      setError("Cancellation amount must be a positive number.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const fn = httpsCallable<{ tenantId: string } & Partial<PaymentSettings>, void>(
        functions,
        "updatePaymentSettings",
      );
      await fn({
        tenantId,
        paymentsEnabled: settings.paymentsEnabled,
        paymentMode: settings.paymentMode,
        depositPercentage: depositPct,
        cancellationPolicy: settings.cancellationPolicy,
        cancellationHours: settings.cancellationHours,
        cancellationCharge: settings.cancellationCharge,
        cancellationAmountMinor: Math.round((cancellationAmountDollars || 0) * 100),
      });
      setSettings((s) => ({
        ...s,
        depositPercentage: depositPct,
        cancellationAmountMinor: Math.round((cancellationAmountDollars || 0) * 100),
      }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStripeSetup() {
    setOnboarding(true);
    setError(null);
    try {
      const returnUrl = "zarkili://admin/stripe-return";
      const refreshUrl = "zarkili://admin/stripe-refresh";
      const fn = httpsCallable<
        { tenantId: string; country: string; returnUrl: string; refreshUrl: string },
        { stripeAccountId: string; onboardingUrl: string }
      >(functions, "stripeConnectOnboard");
      const result = await fn({
        tenantId,
        country: "US",
        returnUrl,
        refreshUrl,
      });
      if (result.data.onboardingUrl) {
        onLaunchConnectOnboarding(result.data.onboardingUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start Stripe setup.");
    } finally {
      setOnboarding(false);
    }
  }

  if (userRole && userRole !== "owner" && userRole !== "platform_owner") {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Only the salon owner can manage payment settings.</Text>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingLabel}>Loading settings…</Text>
      </View>
    );
  }

  const connectStatus = connectAccount?.status ?? "not_started";
  const connectReady = connectAccount?.chargesEnabled ?? false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment Settings</Text>
      </View>

      {/* Stripe Connect status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stripe Account</Text>
        <View style={styles.connectRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: connectReady ? "#22c55e" : "#f59e0b" },
            ]}
          />
          <Text style={styles.connectStatusText}>
            {connectReady
              ? "Connected — ready to accept payments"
              : connectStatus === "pending_verification"
                ? "Onboarding in progress"
                : "Not set up"}
          </Text>
        </View>
        {!connectReady && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => void handleStripeSetup()}
            disabled={onboarding}
          >
            {onboarding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Set Up Stripe</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Enable payments toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Online Payments</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Accept online payments</Text>
          <Switch
            value={settings.paymentsEnabled}
            onValueChange={(v) => setSettings((s) => ({ ...s, paymentsEnabled: v }))}
            trackColor={{ true: "#000", false: "#ccc" }}
            disabled={!connectReady}
          />
        </View>
        {!connectReady && (
          <Text style={styles.hint}>Set up your Stripe account first to enable payments.</Text>
        )}
      </View>

      {/* Payment mode */}
      {settings.paymentsEnabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Mode</Text>
          {(["deposit", "full", "card_on_file"] as PaymentMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={styles.radioRow}
              onPress={() => setSettings((s) => ({ ...s, paymentMode: mode }))}
            >
              <View
                style={[
                  styles.radioOuter,
                  settings.paymentMode === mode && styles.radioOuterSelected,
                ]}
              >
                {settings.paymentMode === mode && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>{MODE_LABELS[mode]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Deposit percentage */}
      {settings.paymentsEnabled && settings.paymentMode === "deposit" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deposit Percentage</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Deposit %</Text>
            <TextInput
              style={styles.numericInput}
              value={depositPctText}
              onChangeText={setDepositPctText}
              keyboardType="numeric"
              maxLength={2}
              selectTextOnFocus
            />
          </View>
          <Text style={styles.hint}>
            Customers will be charged {depositPctText || "?"}% of the service price upfront.
          </Text>
        </View>
      )}

      {/* Cancellation policy */}
      {settings.paymentsEnabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancellation Policy</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Charge cancellation fee</Text>
            <Switch
              value={settings.cancellationPolicy}
              onValueChange={(v) => setSettings((s) => ({ ...s, cancellationPolicy: v }))}
              trackColor={{ true: "#000", false: "#ccc" }}
            />
          </View>
          {settings.cancellationPolicy && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Charge if cancelled within (hours)</Text>
                <TextInput
                  style={styles.numericInput}
                  value={String(settings.cancellationHours)}
                  onChangeText={(v) => {
                    const n = parseInt(v, 10);
                    if (!isNaN(n) && n >= 1) setSettings((s) => ({ ...s, cancellationHours: n }));
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                  selectTextOnFocus
                />
              </View>
              <Text style={styles.sectionTitle}>Fee amount</Text>
              {(["deposit", "custom"] as CancellationCharge[])
                .filter((charge) => charge !== "deposit" || settings.paymentMode === "deposit")
                .map((charge) => (
                <TouchableOpacity
                  key={charge}
                  style={styles.radioRow}
                  onPress={() => setSettings((s) => ({ ...s, cancellationCharge: charge }))}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      settings.cancellationCharge === charge && styles.radioOuterSelected,
                    ]}
                  >
                    {settings.cancellationCharge === charge && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>
                    {charge === "deposit" ? "Keep deposit" : "Custom amount"}
                  </Text>
                </TouchableOpacity>
              ))}
              {settings.cancellationCharge === "custom" && (
                <View style={styles.row}>
                  <Text style={styles.label}>Custom fee ($)</Text>
                  <TextInput
                    style={styles.numericInput}
                    value={cancellationAmountText}
                    onChangeText={setCancellationAmountText}
                    keyboardType="decimal-pad"
                    maxLength={7}
                    selectTextOnFocus
                  />
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Feedback */}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {saveSuccess && <Text style={styles.successText}>Settings saved.</Text>}

      {/* Save */}
      <TouchableOpacity
        style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
        onPress={() => void handleSave()}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save Settings</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: spacing.s6, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.s6 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: spacing.s6, gap: 12 },
  backText: { fontSize: 16, color: colors.primary ?? "#000" },
  title: { fontSize: 20, fontWeight: "700" },
  section: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: spacing.s4,
    marginBottom: spacing.s4,
    gap: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 15, color: "#111" },
  hint: { fontSize: 12, color: "#888", marginTop: 2 },
  connectRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  connectStatusText: { fontSize: 14, color: "#444" },
  radioRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: "#ccc",
    alignItems: "center", justifyContent: "center",
    marginTop: 1,
  },
  radioOuterSelected: { borderColor: "#000" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#000" },
  radioLabel: { flex: 1, fontSize: 14, color: "#222", lineHeight: 20 },
  numericInput: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    fontSize: 16, width: 72, textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: "#000", borderRadius: 10,
    paddingVertical: 14, alignItems: "center",
    marginTop: spacing.s2,
  },
  primaryBtnDisabled: { backgroundColor: "#888" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  loadingLabel: { marginTop: 8, color: "#666" },
  errorText: { color: "#dc2626", fontSize: 14, marginBottom: 8, textAlign: "center" },
  successText: { color: "#16a34a", fontSize: 14, marginBottom: 8, textAlign: "center" },
  backBtn: {
    marginTop: 16, paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: 8, borderWidth: 1, borderColor: "#ccc",
  },
  backBtnText: { fontSize: 15, color: "#333" },
});
