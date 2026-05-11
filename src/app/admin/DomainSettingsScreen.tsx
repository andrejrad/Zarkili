/**
 * W38 — DomainSettingsScreen: custom domain / booking URL (decision-gated).
 *
 * Custom domain connection is available on Professional plan and above.
 * Default booking URL is always available at zarkili.com/{tenantSlug}.
 * Full subdomain/CNAME wiring is a Phase 3.5 infrastructure decision;
 * this screen shows the current URL and explains the upgrade path.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type DomainSettingsScreenProps = {
  tenantSlug: string;
  onBack: () => void;
};

export function DomainSettingsScreen({ tenantSlug, onBack }: DomainSettingsScreenProps) {
  const defaultUrl = `https://zarkili.com/book/${tenantSlug || "your-salon"}`;

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Settings</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Domain settings</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Your booking URL</Text>
        <View style={styles.urlBox}>
          <Text style={styles.urlText} selectable>{defaultUrl}</Text>
        </View>
        <Text style={styles.hintText}>
          Share this link with clients to let them book directly. It is always
          available and requires no additional setup.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Custom domain</Text>
        <View style={styles.gateBadge}>
          <Text style={styles.gateBadgeLabel}>Professional plan required</Text>
        </View>
        <Text style={styles.bodyText}>
          Connect your own domain (e.g. book.mysalon.com) so clients see your
          brand instead of zarkili.com. You will need to add a CNAME record at
          your DNS provider pointing to our servers.
        </Text>
        <Text style={styles.bodyText}>
          Custom domain wiring is planned for a future release.
          Upgrade your plan or contact support to be notified when it launches.
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
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: brandTypography.semibold,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  urlBox: {
    backgroundColor: "#F9F8F5",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E0D1",
  },
  urlText: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
  },
  hintText: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
    lineHeight: 18,
  },
  gateBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gateBadgeLabel: {
    fontSize: 12,
    fontFamily: brandTypography.semibold,
    color: "#6B7280",
  },
  bodyText: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
    lineHeight: 20,
  },
});
