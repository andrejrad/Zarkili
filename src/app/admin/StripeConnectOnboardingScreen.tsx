/**
 * W39 — StripeConnectOnboardingScreen: admin-side full Connect onboarding.
 *
 * For US salons, guides the owner through:
 *   1. Country confirmation (US default)
 *   2. Tax form selection (W-9 for US persons, W-8BEN for foreign owners)
 *   3. Launch Stripe-hosted onboarding link
 *
 * The onboarding link is retrieved from `billingAdminService.startConnectOnboarding`
 * which calls the `createConnectAccountLink` Cloud Function.
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import { AdminErrorState, AdminLoadingState, AdminRoleDeniedState } from "./AdminPatterns";
import type { BillingAdminService } from "./billingAdminService";
import type { ConnectAccount } from "../../domains/connect";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TaxFormType = "w9" | "w8ben";

type StripeConnectOnboardingScreenProps = {
  tenantId: string;
  loading: boolean;
  error: string | null;
  account: ConnectAccount | null;
  userRole: "owner" | "location_manager" | "salon_staff" | "platform_owner" | null;
  service: BillingAdminService | null;
  onBack: () => void;
  onOnboardingLinkReady: (url: string) => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StripeConnectOnboardingScreen({
  tenantId,
  loading,
  error,
  account,
  userRole,
  service,
  onBack,
  onOnboardingLinkReady,
}: StripeConnectOnboardingScreenProps) {
  const [country, setCountry] = useState(account?.country ?? "US");
  const [taxFormType, setTaxFormType] = useState<TaxFormType | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  if (userRole && userRole !== "owner" && userRole !== "platform_owner") {
    return <AdminRoleDeniedState requiredRole="owner" onBack={onBack} />;
  }

  if (loading) return <AdminLoadingState label="Loading Connect account…" />;
  if (error) return <AdminErrorState message={error} />;

  const isUS = country === "US";
  const canLaunch = !isUS || taxFormType !== null;

  async function handleLaunch() {
    if (!service || !canLaunch) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      const url = await service.startConnectOnboarding(tenantId, country, taxFormType);
      if (url) {
        onOnboardingLinkReady(url);
      } else {
        setLaunchError("Unable to generate onboarding link. Please try again.");
      }
    } catch {
      setLaunchError("Failed to start onboarding. Please try again.");
    } finally {
      setLaunching(false);
    }
  }

  // Already active — show success state
  if (account?.status === "active") {
    return (
      <ScrollView contentContainerStyle={styles.root}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
          <Text style={styles.backLabel}>‹ Billing</Text>
        </Pressable>
        <Text style={styles.pageTitle}>Stripe Connect</Text>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.activeDot} />
            <Text style={styles.activeLabel}>Active</Text>
          </View>
          <Text style={styles.body}>
            Your Stripe Connect account is active. Payouts are enabled and ready.
          </Text>
          <Text style={styles.meta}>Account: {account.stripeAccountId ?? "—"}</Text>
          <Text style={styles.meta}>Country: {account.country}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnLabel}>Back to billing</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Billing</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Set up payouts</Text>
      <Text style={styles.subtitle}>
        Connect your bank account to receive payments from clients. We use Stripe Connect — the same system
        trusted by millions of businesses worldwide.
      </Text>

      {/* Country */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Your country</Text>
        <View style={styles.countryRow}>
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: country === "US" }}
            onPress={() => setCountry("US")}
            style={[styles.countryBtn, country === "US" && styles.countryBtnActive]}
            testID="country-us"
          >
            <Text style={styles.countryBtnLabel}>🇺🇸 United States</Text>
          </Pressable>
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: country !== "US" }}
            onPress={() => setCountry("EU")}
            style={[styles.countryBtn, country !== "US" && styles.countryBtnActive]}
            testID="country-other"
          >
            <Text style={styles.countryBtnLabel}>🌍 Other</Text>
          </Pressable>
        </View>
      </View>

      {/* US tax form */}
      {isUS ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Tax form (required for US)</Text>
          <Text style={styles.body}>
            US IRS regulations require a tax form before payouts can begin. Select the form that applies to you.
          </Text>
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: taxFormType === "w9" }}
            onPress={() => setTaxFormType("w9")}
            style={[styles.formRow, taxFormType === "w9" && styles.formRowSelected]}
            testID="tax-form-w9"
          >
            <View style={[styles.radio, taxFormType === "w9" && styles.radioSelected]} />
            <View style={styles.formText}>
              <Text style={styles.formLabel}>W-9 — US person or entity</Text>
              <Text style={styles.formMeta}>For US citizens, permanent residents, and US-incorporated entities</Text>
            </View>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: taxFormType === "w8ben" }}
            onPress={() => setTaxFormType("w8ben")}
            style={[styles.formRow, taxFormType === "w8ben" && styles.formRowSelected]}
            testID="tax-form-w8ben"
          >
            <View style={[styles.radio, taxFormType === "w8ben" && styles.radioSelected]} />
            <View style={styles.formText}>
              <Text style={styles.formLabel}>W-8BEN — Foreign person</Text>
              <Text style={styles.formMeta}>For non-US individuals operating a business in the US</Text>
            </View>
          </Pressable>
        </View>
      ) : null}

      {/* How it works */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>What happens next</Text>
        {[
          "You'll be redirected to Stripe's secure onboarding form.",
          "Enter your business and banking details (takes ~5 minutes).",
          "Once approved, payouts begin on your next payout cycle.",
          "You can return here any time to check Connect health and payout status.",
        ].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {launchError ? <Text style={styles.errorText}>{launchError}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={!canLaunch || launching}
        onPress={() => void handleLaunch()}
        style={[styles.primaryBtn, (!canLaunch || launching) && styles.btnDisabled]}
        testID="launch-connect-onboarding"
      >
        <Text style={styles.primaryBtnLabel}>
          {launching ? "Opening Stripe…" : "Continue to Stripe →"}
        </Text>
      </Pressable>

      <Text style={styles.disclaimer}>
        By continuing, you agree to Stripe's Connected Account Agreement. Stripe, not Zarkili, holds and processes your funds.
      </Text>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingBottom: 32, gap: 12 },
  backRow: { paddingBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  pageTitle: { fontSize: 26, lineHeight: 34, fontFamily: brandTypography.semibold, color: "#1A1A1A", marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: brandTypography.regular, color: "#6B6B6B", lineHeight: 22 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", padding: 16, gap: 8 },
  sectionLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.5 },
  body: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  meta: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  activeLabel: { fontSize: 15, fontFamily: brandTypography.semibold, color: "#22C55E" },
  countryRow: { flexDirection: "row", gap: 8 },
  countryBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E0D1", alignItems: "center" },
  countryBtnActive: { borderColor: "#E3A9A0", backgroundColor: "#FDF7F6" },
  countryBtnLabel: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  formRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 8 },
  formRowSelected: { backgroundColor: "#FDF7F6", borderRadius: 8, marginHorizontal: -8, paddingHorizontal: 8 },
  formText: { flex: 1, gap: 2 },
  formLabel: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  formMeta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#D1C7B7", marginTop: 2 },
  radioSelected: { borderColor: "#E3A9A0", backgroundColor: "#E3A9A0" },
  divider: { height: 1, backgroundColor: "#E5E0D1" },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#E3A9A0", alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 12, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  stepText: { flex: 1, fontSize: 13, fontFamily: brandTypography.regular, color: "#1A1A1A", paddingTop: 2 },
  primaryBtn: { backgroundColor: "#E3A9A0", paddingVertical: 16, borderRadius: 9999, alignItems: "center" },
  primaryBtnLabel: { fontSize: 15, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  secondaryBtn: { borderWidth: 1, borderColor: "#E5E0D1", paddingVertical: 12, borderRadius: 9999, alignItems: "center" },
  secondaryBtnLabel: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  btnDisabled: { opacity: 0.4 },
  errorText: { fontSize: 13, fontFamily: brandTypography.regular, color: "#EF4444", textAlign: "center" },
  disclaimer: { fontSize: 11, fontFamily: brandTypography.regular, color: "#9CA3AF", textAlign: "center", lineHeight: 18 },
});
