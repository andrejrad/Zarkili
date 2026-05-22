/**
 * W38 — CurrencySettingsScreen: tenant default currency and FX disclosure.
 *
 * USD is the primary currency at launch. EUR is supported as a secondary.
 * Per-location currency overrides are a W40+ concern; this screen manages
 * the tenant-level default.  Cross-currency settlement is handled by Stripe
 * Connect (already configured in W14).
 */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";

import { AdminErrorState, AdminLoadingState, AdminToggleRow } from "./AdminPatterns";
import type { TenantLocationAdminService } from "./tenantLocationAdminService";

// ---------------------------------------------------------------------------
// Supported currencies (Group B launch set)
// ---------------------------------------------------------------------------

const SUPPORTED_CURRENCIES = ["USD", "EUR"] as const;
type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  USD: "US Dollar (USD) — primary",
  EUR: "Euro (EUR) — secondary",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type CurrencySettingsScreenProps = {
  tenantId: string;
  initialCurrency: string;
  service: TenantLocationAdminService | null;
  onBack: () => void;
};

export function CurrencySettingsScreen({
  tenantId,
  initialCurrency,
  service,
  onBack,
}: CurrencySettingsScreenProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    initialCurrency || "USD",
  );
  const [fxDisclosureEnabled, setFxDisclosureEnabled] = useState(true);
  const [customCurrencyInput, setCustomCurrencyInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Loading state is lightweight — initialCurrency comes from the parent.
  const [loading] = useState(false);
  const [loadError] = useState<string | null>(null);

  // Re-sync if the prop changes (e.g. parent refreshed tenant profile).
  useEffect(() => {
    if (initialCurrency) setSelectedCurrency(initialCurrency);
  }, [initialCurrency]);

  const effectiveCurrency =
    customCurrencyInput.trim().toUpperCase() ||
    selectedCurrency.toUpperCase();

  async function handleSubmit() {
    if (!service || !tenantId || !effectiveCurrency) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    const result = await service.updateCurrencySettings(tenantId, {
      defaultCurrency: effectiveCurrency,
    });
    setSubmitting(false);
    if (result.ok) {
      setSubmitSuccess(true);
      setCustomCurrencyInput("");
      setSelectedCurrency(effectiveCurrency);
    } else {
      setSubmitError(result.message);
    }
  }

  if (loading) return <AdminLoadingState label="Loading currency settings…" />;
  if (loadError) return <AdminErrorState message={loadError} />;

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Settings</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Currency settings</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Default currency</Text>

        {SUPPORTED_CURRENCIES.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedCurrency === c && !customCurrencyInput }}
            onPress={() => {
              setSelectedCurrency(c);
              setCustomCurrencyInput("");
              setSubmitSuccess(false);
            }}
            style={[
              styles.currencyOption,
              selectedCurrency === c && !customCurrencyInput
                ? styles.currencyOptionSelected
                : null,
            ]}
          >
            <View style={[
              styles.radioCircle,
              selectedCurrency === c && !customCurrencyInput
                ? styles.radioCircleSelected
                : null,
            ]} />
            <Text style={styles.currencyLabel}>{CURRENCY_LABELS[c]}</Text>
          </Pressable>
        ))}

        <Text style={styles.inputLabel}>Other currency code (ISO 4217)</Text>
        <TextInput
          style={styles.input}
          value={customCurrencyInput}
          onChangeText={(v) => {
            setCustomCurrencyInput(v.toUpperCase());
            setSubmitSuccess(false);
          }}
          placeholder="e.g. GBP, CAD, AUD"
          autoCapitalize="characters"
          maxLength={3}
          accessibilityLabel="Custom currency code"
        />
        <Text style={styles.hint}>
          Leave blank to use the selected currency above. Stripe Connect handles
          cross-currency settlement automatically.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>FX disclosure</Text>
        <AdminToggleRow
          label="Show FX disclosure on receipts"
          sublabel="Display exchange-rate notice when currency differs from USD"
          value={fxDisclosureEnabled}
          onToggle={(next) => {
            setFxDisclosureEnabled(next);
            setSubmitSuccess(false);
          }}
        />
      </View>

      <View style={styles.footer}>
        {submitError ? <Text style={styles.errorMsg}>{submitError}</Text> : null}
        {submitSuccess ? (
          <Text style={styles.successMsg}>
            Currency set to {effectiveCurrency}.
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={() => void handleSubmit()}
          style={[styles.ctaButton, submitting ? styles.ctaDisabled : null]}
        >
          <Text style={styles.ctaLabel}>
            {submitting ? "Saving…" : "Save currency settings"}
          </Text>
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
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: brandTypography.semibold,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currencyOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  currencyOptionSelected: {
    backgroundColor: "#FDF5F4",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E5E0D1",
  },
  radioCircleSelected: {
    borderColor: "#E3A9A0",
    backgroundColor: "#E3A9A0",
  },
  currencyLabel: {
    fontSize: 15,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#1A1A1A",
    marginTop: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
    backgroundColor: "#FFFFFF",
  },
  hint: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#9CA3AF",
    lineHeight: 18,
  },
  footer: {
    gap: 8,
  },
  errorMsg: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#EF4444",
  },
  successMsg: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#22C55E",
  },
  ctaButton: {
    backgroundColor: "#E3A9A0",
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaLabel: {
    fontSize: 15,
    fontFamily: brandTypography.medium,
    color: "#FFFFFF",
  },
});
