/**
 * W38 — TenantSettingsShellScreen: sectioned settings navigation hub.
 *
 * All sub-settings screens branch from here.  The shell itself holds no form
 * state — it is purely a navigation list.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import { AdminSectionRow } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Section key type (consumed by AppNavigatorShell route mapping)
// ---------------------------------------------------------------------------

export type TenantSettingsSection =
  | "business-profile"
  | "brand"
  | "tax"
  | "currency"
  | "legal-docs"
  | "domain"
  | "notifications"
  // W39 billing & payouts
  | "billing"
  | "plan"
  | "invoices"
  | "payment-method"
  | "cancel-subscription"
  | "connect"
  | "connect-health"
  | "payouts"
  | "refunds-disputes"
  // W40 locations
  | "locations"
  | "location-settings"
  | "location-service-overrides"
  | "resources"
  | "admin-walk-in-queue"
  | "daily-close";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type TenantSettingsShellScreenProps = {
  tenantName: string;
  onNavigateTo: (section: TenantSettingsSection) => void;
  onBack: () => void;
};

export function TenantSettingsShellScreen({
  tenantName,
  onNavigateTo,
  onBack,
}: TenantSettingsShellScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ {tenantName}</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Settings</Text>

      <Text style={styles.groupLabel}>Business</Text>
      <View style={styles.group}>
        <AdminSectionRow
          label="Business profile"
          sublabel="Legal name, address, contact, business hours"
          onPress={() => onNavigateTo("business-profile")}
        />
        <AdminSectionRow
          label="Brand settings"
          sublabel="Logo, colors, public profile preview"
          onPress={() => onNavigateTo("brand")}
        />
        <AdminSectionRow
          label="Legal documents"
          sublabel="Business license, contracts, insurance"
          onPress={() => onNavigateTo("legal-docs")}
        />
        <AdminSectionRow
          label="Domain settings"
          sublabel="Custom URL for your booking page"
          onPress={() => onNavigateTo("domain")}
        />
      </View>

      <Text style={styles.groupLabel}>Payments &amp; Tax</Text>
      <View style={styles.group}>
        <AdminSectionRow
          label="Tax settings"
          sublabel="Jurisdiction summary, tax IDs"
          onPress={() => onNavigateTo("tax")}
        />
        <AdminSectionRow
          label="Currency settings"
          sublabel="Default currency, FX disclosure preferences"
          onPress={() => onNavigateTo("currency")}
        />
      </View>

      <Text style={styles.groupLabel}>Notifications</Text>
      <View style={styles.group}>
        <AdminSectionRow
          label="Notification preferences"
          sublabel="Operational alerts, daily and weekly digests"
          onPress={() => onNavigateTo("notifications")}
        />
      </View>

      <Text style={styles.groupLabel}>Billing &amp; subscription</Text>
      <View style={styles.group}>
        <AdminSectionRow
          label="Billing overview"
          sublabel="Subscription status, balance summary"
          onPress={() => onNavigateTo("billing")}
        />
        <AdminSectionRow
          label="Subscription plan"
          sublabel="Upgrade, downgrade, or change billing interval"
          onPress={() => onNavigateTo("plan")}
        />
        <AdminSectionRow
          label="Invoice history"
          sublabel="Download PDF invoices"
          onPress={() => onNavigateTo("invoices")}
        />
        <AdminSectionRow
          label="Payment method"
          sublabel="Cards on file, add or remove"
          onPress={() => onNavigateTo("payment-method")}
        />
        <AdminSectionRow
          label="Cancel or pause subscription"
          sublabel="Cancel subscription or pause billing"
          onPress={() => onNavigateTo("cancel-subscription")}
        />
      </View>

      <Text style={styles.groupLabel}>Payouts &amp; Stripe Connect</Text>
      <View style={styles.group}>
        <AdminSectionRow
          label="Connect onboarding"
          sublabel="Set up your bank account for payouts"
          onPress={() => onNavigateTo("connect")}
        />
        <AdminSectionRow
          label="Connect health"
          sublabel="Account status, documents, restrictions"
          onPress={() => onNavigateTo("connect-health")}
        />
        <AdminSectionRow
          label="Payout history"
          sublabel="History, pending balance, schedule"
          onPress={() => onNavigateTo("payouts")}
        />
        <AdminSectionRow
          label="Refunds &amp; disputes"
          sublabel="View refunds, respond to chargebacks"
          onPress={() => onNavigateTo("refunds-disputes")}
        />
      </View>

      <Text style={styles.groupLabel}>Locations &amp; operations</Text>
      <View style={styles.group}>
        <AdminSectionRow
          label="Locations overview"
          sublabel="All locations, today's KPIs"
          onPress={() => onNavigateTo("locations")}
        />
        <AdminSectionRow
          label="Location settings"
          sublabel="Hours, holidays, address, photos, accessibility"
          onPress={() => onNavigateTo("location-settings")}
        />
        <AdminSectionRow
          label="Service overrides"
          sublabel="Per-location price, duration, availability"
          onPress={() => onNavigateTo("location-service-overrides")}
        />
        <AdminSectionRow
          label="Resources"
          sublabel="Rooms, chairs, equipment"
          onPress={() => onNavigateTo("resources")}
        />
        <AdminSectionRow
          label="Walk-in queue"
          sublabel="Admin walk-in management"
          onPress={() => onNavigateTo("admin-walk-in-queue")}
        />
        <AdminSectionRow
          label="Daily close"
          sublabel="Cash reconciliation &amp; end-of-day report"
          onPress={() => onNavigateTo("daily-close")}
        />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    paddingBottom: 32,
    gap: 8,
  },
  backRow: {
    paddingBottom: 4,
  },
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
    marginBottom: 8,
  },
  groupLabel: {
    fontSize: 12,
    fontFamily: brandTypography.semibold,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  group: {
    gap: 8,
    marginBottom: 4,
  },
});
