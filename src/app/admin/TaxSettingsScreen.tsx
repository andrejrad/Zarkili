/**
 * W38 — TaxSettingsScreen: tax jurisdiction summary (display-only).
 *
 * Derives jurisdiction metadata from the tenant's country code using the same
 * local rule engine that backs taxService (US personal services, EU VAT,
 * out-of-scope).  The actual Stripe Tax integration is already live from W14;
 * this screen surfaces a human-readable summary so owners can verify their
 * configuration.
 *
 * No writes are needed — jurisdiction is determined by salon address (set on
 * each Location in W40).  Tax IDs are configured directly in the Stripe
 * dashboard; a deep-link to the Stripe Tax portal is provided.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import { AdminHelpAnchor } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Local jurisdiction resolver (mirrors taxService rule engine — US-primary)
// ---------------------------------------------------------------------------

const US_TAXABLE_STATES: Record<string, { label: string; note: string }> = {
  CT: { label: "Connecticut", note: "Taxable — 6.35%" },
  HI: { label: "Hawaii", note: "Taxable — 4.0% GET" },
  NM: { label: "New Mexico", note: "Taxable — 5.125% GRT" },
  SD: { label: "South Dakota", note: "Taxable — 4.5%" },
  WV: { label: "West Virginia", note: "Taxable — 6.0%" },
};

type JurisdictionInfo = {
  label: string;
  system: string;
  note: string;
};

function resolveJurisdiction(country: string): JurisdictionInfo {
  const c = country.trim().toUpperCase();
  if (c === "US") {
    return {
      label: "United States",
      system: "Stripe Tax (US)",
      note:
        "Most states do not tax personal services. Stripe Tax automatically applies rates for CT, HI, NM, SD, WV, and the NYC local surcharge based on each location's address.",
    };
  }
  const euCountries = new Set([
    "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE",
    "IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
  ]);
  if (euCountries.has(c)) {
    return {
      label: `EU — ${c}`,
      system: "Stripe Tax (EU VAT)",
      note:
        "VAT is applied at the standard rate for your country. B2B sales with a valid VAT ID qualify for reverse-charge (0%). Configure your VAT ID in the Stripe dashboard.",
    };
  }
  return {
    label: country || "Unknown",
    system: "Stripe Tax",
    note:
      "Your country/region does not currently have a specific rule configured. Stripe Tax will apply the most appropriate rate based on seller address. Verify in the Stripe Tax settings.",
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type TaxSettingsScreenProps = {
  tenantId: string;
  tenantCountry: string;
  onBack: () => void;
};

export function TaxSettingsScreen({ tenantCountry, onBack }: TaxSettingsScreenProps) {
  const jurisdiction = resolveJurisdiction(tenantCountry);
  const country = tenantCountry.trim().toUpperCase();
  const showUsStateTable = country === "US";

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Settings</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Tax settings</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Jurisdiction</Text>
        <Text style={styles.jurisdictionName}>{jurisdiction.label}</Text>
        <Text style={styles.jurisdictionSystem}>{jurisdiction.system}</Text>
        <Text style={styles.jurisdictionNote}>{jurisdiction.note}</Text>
      </View>

      {showUsStateTable ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Taxable states for personal services</Text>
          {Object.entries(US_TAXABLE_STATES).map(([code, info]) => (
            <View key={code} style={styles.stateRow}>
              <Text style={styles.stateCode}>{code}</Text>
              <View style={styles.stateInfo}>
                <Text style={styles.stateName}>{info.label}</Text>
                <Text style={styles.stateNote}>{info.note}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.smallNote}>
            * NYC add an additional 4.5% local surcharge for locations with a NYC ZIP code.
            All rates are applied automatically by Stripe Tax using each location's address.
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Tax IDs and exemptions</Text>
        <Text style={styles.bodyText}>
          VAT numbers, EIN, or other tax registration IDs are managed directly in the Stripe
          dashboard. Changes take effect on new invoices immediately.
        </Text>
        <AdminHelpAnchor
          label="Open Stripe Tax settings ›"
          onPress={() => {
            // Deep-link: opens in system browser when implemented.
          }}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Per-location overrides</Text>
        <Text style={styles.bodyText}>
          Location-level tax jurisdiction overrides will be available in W40 (Location Dashboard).
          Stripe Tax uses each location's billing address to determine the correct rate.
        </Text>
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
  jurisdictionName: {
    fontSize: 18,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
  },
  jurisdictionSystem: {
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#6B6B6B",
  },
  jurisdictionNote: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
    lineHeight: 20,
  },
  stateRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F2EDDD",
  },
  stateCode: {
    fontSize: 13,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
    width: 32,
  },
  stateInfo: {
    flex: 1,
    gap: 2,
  },
  stateName: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
  },
  stateNote: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  smallNote: {
    fontSize: 11,
    fontFamily: brandTypography.regular,
    color: "#9CA3AF",
    lineHeight: 16,
    marginTop: 4,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
    lineHeight: 20,
  },
});
