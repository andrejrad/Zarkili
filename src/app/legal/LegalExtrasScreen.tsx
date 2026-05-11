/**
 * LegalExtrasScreen.tsx — W32 Batch L (L.6)
 *
 * Supplementary legal / compliance screens.
 *
 * Exports:
 *   OpenSourceLicensesScreen    — searchable list of OSS dependencies
 *   AttributionsScreen          — asset / icon / font attributions
 *   AccessibilityStatementScreen — WCAG 2.1 AA / ADA statement
 *   CookiePolicyScreen          — cookie & tracking tech policy
 */

import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, radius, spacing } from "../../shared/ui/tokens";

// ---------------------------------------------------------------------------
// OpenSourceLicensesScreen
// ---------------------------------------------------------------------------

export type OssLicense = {
  id: string;
  package: string;
  version: string;
  license: string;
  url?: string;
};

export type OpenSourceLicensesScreenProps = {
  licenses: OssLicense[];
  testID?: string;
};

export function OpenSourceLicensesScreen({
  licenses,
  testID,
}: OpenSourceLicensesScreenProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? licenses.filter(
        (l) =>
          l.package.toLowerCase().includes(query.toLowerCase()) ||
          l.license.toLowerCase().includes(query.toLowerCase()),
      )
    : licenses;

  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search packages…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Search packages"
          testID={testID ? `${testID}-search` : undefined}
        />
      </View>

      <ScrollView contentContainerStyle={styles.page}>
        {filtered.length === 0 && (
          <Text
            style={styles.emptyText}
            testID={testID ? `${testID}-empty` : undefined}
          >
            No packages match your search.
          </Text>
        )}

        {filtered.map((oss) => (
          <View
            key={oss.id}
            style={styles.ossCard}
            testID={testID ? `${testID}-package-${oss.id}` : undefined}
          >
            <View style={styles.ossHeader}>
              <Text style={styles.ossName}>{oss.package}</Text>
              <Text style={styles.ossVersion}>{oss.version}</Text>
            </View>
            <Text style={styles.ossLicense}>{oss.license}</Text>
            {oss.url && (
              <Text
                style={styles.ossUrl}
                numberOfLines={1}
                testID={testID ? `${testID}-url-${oss.id}` : undefined}
              >
                {oss.url}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// AttributionsScreen
// ---------------------------------------------------------------------------

export type Attribution = {
  id: string;
  type: "icon" | "photo" | "font" | "illustration" | "other";
  name: string;
  author: string;
  source: string;
  license: string;
};

export type AttributionsScreenProps = {
  attributions: Attribution[];
  testID?: string;
};

const TYPE_LABEL: Record<Attribution["type"], string> = {
  icon: "Icons",
  photo: "Photos",
  font: "Fonts",
  illustration: "Illustrations",
  other: "Other",
};

export function AttributionsScreen({
  attributions,
  testID,
}: AttributionsScreenProps) {
  const groups = (Object.keys(TYPE_LABEL) as Attribution["type"][]).map(
    (type) => ({
      type,
      label: TYPE_LABEL[type],
      items: attributions.filter((a) => a.type === type),
    }),
  ).filter((g) => g.items.length > 0);

  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.pageTitle}>Attributions</Text>
        <Text style={styles.subtitle}>
          Third-party assets used in this application.
        </Text>

        {groups.map((group) => (
          <View key={group.type}>
            <Text
              style={styles.groupHeading}
              testID={testID ? `${testID}-group-${group.type}` : undefined}
            >
              {group.label}
            </Text>

            {group.items.map((item) => (
              <View
                key={item.id}
                style={styles.attrCard}
                testID={testID ? `${testID}-attr-${item.id}` : undefined}
              >
                <Text style={styles.attrName}>{item.name}</Text>
                <Text style={styles.attrAuthor}>by {item.author}</Text>
                <Text style={styles.attrSource}>{item.source}</Text>
                <Text style={styles.attrLicense}>{item.license}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// AccessibilityStatementScreen
// ---------------------------------------------------------------------------

export type AccessibilityStatementScreenProps = {
  onContactAccessibility?: () => void;
  testID?: string;
};

export function AccessibilityStatementScreen({
  onContactAccessibility,
  testID,
}: AccessibilityStatementScreenProps) {
  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.pageTitle}>Accessibility statement</Text>

        <Text style={styles.statementMeta}>
          Last reviewed: April 2025
        </Text>

        <View style={styles.complianceRow}>
          <View
            style={styles.complianceBadge}
            testID={testID ? `${testID}-wcag-badge` : undefined}
          >
            <Text style={styles.complianceBadgeText}>WCAG 2.1 Level AA</Text>
          </View>
          <View
            style={styles.complianceBadge}
            testID={testID ? `${testID}-ada-badge` : undefined}
          >
            <Text style={styles.complianceBadgeText}>ADA Compliant (intent)</Text>
          </View>
        </View>

        <Section
          title="Our commitment"
          body="Zarkili is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone, and apply the relevant accessibility standards."
          testID={testID ? `${testID}-commitment` : undefined}
        />

        <Section
          title="Standards applied"
          body="We aim to conform to WCAG 2.1 Level AA. All interactive elements meet a minimum 44 pt touch target. Colour contrast ratios are ≥ 4.5:1 for normal text and ≥ 3:1 for large text. All images have descriptive accessibility labels."
          testID={testID ? `${testID}-standards` : undefined}
        />

        <Section
          title="Known limitations"
          body="Some third-party content embedded in the app (e.g., maps, payment sheets) may not fully conform to WCAG 2.1 AA. We are actively working with our vendors to address these gaps."
          testID={testID ? `${testID}-limitations` : undefined}
        />

        <Section
          title="Feedback and contact"
          body="If you experience barriers, please contact us at accessibility@zarkili.com or through the in-app feedback tool. We endeavour to respond within 5 business days."
          testID={testID ? `${testID}-feedback` : undefined}
        />

        {onContactAccessibility && (
          <Pressable
            onPress={onContactAccessibility}
            accessibilityRole="button"
            style={styles.contactBtn}
            testID={testID ? `${testID}-contact-btn` : undefined}
          >
            <Text style={styles.contactBtnText}>Contact accessibility team</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  body,
  testID,
}: {
  title: string;
  body: string;
  testID?: string;
}) {
  return (
    <View style={styles.section} testID={testID}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CookiePolicyScreen
// ---------------------------------------------------------------------------

export type CookieCategory = {
  id: string;
  name: string;
  purpose: string;
  essential: boolean;
  thirdParty: boolean;
};

export type CookiePolicyScreenProps = {
  cookies: CookieCategory[];
  appName?: string;
  onPrivacyPolicy?: () => void;
  testID?: string;
};

export function CookiePolicyScreen({
  cookies,
  appName = "Zarkili",
  onPrivacyPolicy,
  testID,
}: CookiePolicyScreenProps) {
  const essential = cookies.filter((c) => c.essential);
  const nonEssential = cookies.filter((c) => !c.essential);

  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.pageTitle}>Cookie &amp; tracking technologies</Text>
        <Text style={styles.subtitle}>
          {appName} and its partners use cookies and similar technologies to
          provide, improve, and personalise the service.
        </Text>

        {essential.length > 0 && (
          <>
            <Text
              style={styles.groupHeading}
              testID={testID ? `${testID}-essential-heading` : undefined}
            >
              Essential (always active)
            </Text>
            {essential.map((c) => (
              <CookieRow key={c.id} cookie={c} testID={testID} />
            ))}
          </>
        )}

        {nonEssential.length > 0 && (
          <>
            <Text
              style={styles.groupHeading}
              testID={testID ? `${testID}-optional-heading` : undefined}
            >
              Optional
            </Text>
            {nonEssential.map((c) => (
              <CookieRow key={c.id} cookie={c} testID={testID} />
            ))}
          </>
        )}

        {onPrivacyPolicy && (
          <Pressable
            onPress={onPrivacyPolicy}
            accessibilityRole="link"
            testID={testID ? `${testID}-privacy-link` : undefined}
          >
            <Text style={styles.link}>View Privacy Policy for full details →</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CookieRow({
  cookie,
  testID,
}: {
  cookie: CookieCategory;
  testID?: string;
}) {
  return (
    <View
      style={styles.cookieCard}
      testID={testID ? `${testID}-cookie-${cookie.id}` : undefined}
    >
      <View style={styles.cookieHeader}>
        <Text style={styles.cookieName}>{cookie.name}</Text>
        {cookie.thirdParty && (
          <Text style={styles.thirdPartyTag}>3rd-party</Text>
        )}
      </View>
      <Text style={styles.cookiePurpose}>{cookie.purpose}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: {
    padding: spacing.pageHorizontal,
    paddingTop: spacing.pageVertical,
    gap: spacing.s4,
  },
  pageTitle: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    paddingTop: spacing.s8,
  },
  // Search
  searchRow: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    height: spacing.touchTarget,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s3,
    fontSize: 15,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // OSS cards
  ossCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s4,
    gap: spacing.s1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ossHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  ossName: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  ossVersion: { fontSize: 12, color: colors.textMuted },
  ossLicense: { fontSize: 13, color: colors.primary },
  ossUrl: { fontSize: 11, color: colors.textMuted },
  // Attributions
  groupHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: spacing.s2,
  },
  attrCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s4,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attrName: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  attrAuthor: { fontSize: 13, color: colors.foreground },
  attrSource: { fontSize: 12, color: colors.textMuted },
  attrLicense: { fontSize: 12, color: colors.primary },
  // Accessibility Statement
  statementMeta: { fontSize: 12, color: colors.textMuted },
  complianceRow: { flexDirection: "row", gap: spacing.s2, flexWrap: "wrap" },
  complianceBadge: {
    backgroundColor: colors.primary10,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
  },
  complianceBadgeText: { fontSize: 12, fontWeight: "600", color: colors.primary },
  section: { gap: spacing.s2 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  sectionBody: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  contactBtn: {
    height: spacing.touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  contactBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  // Cookie
  cookieCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s4,
    gap: spacing.s1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cookieHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cookieName: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  thirdPartyTag: {
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s2,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cookiePurpose: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  link: { fontSize: 14, color: colors.primary, textDecorationLine: "underline" },
});
