/**
 * StoreReadinessScreens.tsx — W32 Batch L (L.5)
 *
 * In-app screens that support App Store / Play Store submission review.
 *
 * Exports:
 *   PrivacyNutritionLabelScreen  — Apple-style "Privacy Nutrition Label" data summary
 *   DataSafetyScreen             — Google Play "Data safety" section equivalent
 *   AppInfoScreen                — Version, build, channel, environment info
 *   ReleaseNotesScreen           — Formatted changelog / release notes
 */

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SummaryRow } from "../../shared/ui/SummaryRow";
import { colors, radius, spacing } from "../../shared/ui/tokens";

// ---------------------------------------------------------------------------
// PrivacyNutritionLabelScreen
// ---------------------------------------------------------------------------

type DataCategory = {
  id: string;
  label: string;
  purpose: string;
  linked: boolean;
  tracking: boolean;
};

const DATA_CATEGORIES: DataCategory[] = [
  { id: "contact", label: "Contact info", purpose: "Account, bookings", linked: true, tracking: false },
  { id: "identifiers", label: "Identifiers", purpose: "Analytics, fraud prevention", linked: true, tracking: false },
  { id: "usage", label: "Usage data", purpose: "App analytics", linked: false, tracking: false },
  { id: "location", label: "Location", purpose: "Nearby salons", linked: false, tracking: false },
  { id: "photos", label: "Photos", purpose: "Profile photo, review images", linked: true, tracking: false },
  { id: "purchases", label: "Purchases", purpose: "Booking history, receipts", linked: true, tracking: false },
  { id: "health", label: "Health & fitness", purpose: "Not collected", linked: false, tracking: false },
];

export type PrivacyNutritionLabelScreenProps = {
  appName?: string;
  onPrivacyPolicy?: () => void;
  testID?: string;
};

export function PrivacyNutritionLabelScreen({
  appName = "Zarkili",
  onPrivacyPolicy,
  testID,
}: PrivacyNutritionLabelScreenProps) {
  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.pageTitle}>Privacy Nutrition Label</Text>
        <Text style={styles.subtitle}>
          Data {appName} may collect and how it's used.
        </Text>

        <View style={styles.table} testID={testID ? `${testID}-table` : undefined}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableCellFlex]}>Category</Text>
            <Text style={styles.tableCell}>Linked</Text>
            <Text style={styles.tableCell}>Tracked</Text>
          </View>
          {DATA_CATEGORIES.map((cat) => (
            <View
              key={cat.id}
              style={styles.tableRow}
              testID={testID ? `${testID}-row-${cat.id}` : undefined}
            >
              <View style={styles.tableCellFlex}>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catPurpose}>{cat.purpose}</Text>
              </View>
              <Text style={styles.tableCell}>
                {cat.linked ? "✓" : "—"}
              </Text>
              <Text style={styles.tableCell}>
                {cat.tracking ? "✓" : "—"}
              </Text>
            </View>
          ))}
        </View>

        {onPrivacyPolicy && (
          <Pressable
            onPress={onPrivacyPolicy}
            accessibilityRole="link"
            testID={testID ? `${testID}-policy-link` : undefined}
          >
            <Text style={styles.link}>View full Privacy Policy →</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// DataSafetyScreen
// ---------------------------------------------------------------------------

type SafetyEntry = {
  id: string;
  category: string;
  dataTypes: string[];
  purpose: string;
  optional: boolean;
};

const SAFETY_ENTRIES: SafetyEntry[] = [
  {
    id: "account",
    category: "Personal info",
    dataTypes: ["Name", "Email address", "Phone number"],
    purpose: "Account management",
    optional: false,
  },
  {
    id: "location",
    category: "Location",
    dataTypes: ["Approximate location"],
    purpose: "Show nearby salons",
    optional: true,
  },
  {
    id: "financial",
    category: "Financial info",
    dataTypes: ["Payment info"],
    purpose: "Booking payments",
    optional: false,
  },
  {
    id: "photos",
    category: "Photos and videos",
    dataTypes: ["Photos"],
    purpose: "Profile photos, review images",
    optional: true,
  },
  {
    id: "app-activity",
    category: "App activity",
    dataTypes: ["App interactions", "In-app search history"],
    purpose: "App analytics and personalisation",
    optional: false,
  },
];

export type DataSafetyScreenProps = {
  onLearnMore?: () => void;
  testID?: string;
};

export function DataSafetyScreen({ onLearnMore, testID }: DataSafetyScreenProps) {
  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.pageTitle}>Data safety</Text>
        <Text style={styles.subtitle}>
          Information about how Zarkili collects and uses your data (Google
          Play Data Safety format).
        </Text>

        {SAFETY_ENTRIES.map((entry) => (
          <View
            key={entry.id}
            style={styles.safetyCard}
            testID={testID ? `${testID}-entry-${entry.id}` : undefined}
          >
            <Text style={styles.safetyCategory}>{entry.category}</Text>
            <Text style={styles.safetyTypes}>{entry.dataTypes.join(" · ")}</Text>
            <Text style={styles.safetyPurpose}>{entry.purpose}</Text>
            <Text style={styles.safetyOptional}>
              {entry.optional ? "Optional — you may decline" : "Required for app functionality"}
            </Text>
          </View>
        ))}

        {onLearnMore && (
          <Pressable
            onPress={onLearnMore}
            accessibilityRole="link"
            testID={testID ? `${testID}-learn-more` : undefined}
          >
            <Text style={styles.link}>Learn more about data practices →</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// AppInfoScreen
// ---------------------------------------------------------------------------

export type AppInfoScreenProps = {
  version: string;
  buildNumber: string;
  channel?: "production" | "staging" | "development";
  commitHash?: string;
  onCopyDiagnostics?: () => void;
  testID?: string;
};

export function AppInfoScreen({
  version,
  buildNumber,
  channel = "production",
  commitHash,
  onCopyDiagnostics,
  testID,
}: AppInfoScreenProps) {
  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.pageTitle}>App info</Text>

        <View style={styles.infoBox}>
          <SummaryRow
            label="Version"
            value={version}
            testID={testID ? `${testID}-version` : undefined}
          />
          <SummaryRow
            label="Build"
            value={buildNumber}
            testID={testID ? `${testID}-build` : undefined}
          />
          <SummaryRow
            label="Channel"
            value={channel}
            testID={testID ? `${testID}-channel` : undefined}
          />
          {commitHash && (
            <SummaryRow
              label="Commit"
              value={commitHash.slice(0, 7)}
              noDivider
              testID={testID ? `${testID}-commit` : undefined}
            />
          )}
        </View>

        {onCopyDiagnostics && (
          <Pressable
            onPress={onCopyDiagnostics}
            accessibilityRole="button"
            style={styles.diagBtn}
            testID={testID ? `${testID}-diagnostics` : undefined}
          >
            <Text style={styles.diagBtnText}>Copy diagnostics</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// ReleaseNotesScreen
// ---------------------------------------------------------------------------

export type ReleaseNote = {
  version: string;
  date: string;
  highlights: string[];
};

export type ReleaseNotesScreenProps = {
  notes: ReleaseNote[];
  testID?: string;
};

export function ReleaseNotesScreen({ notes, testID }: ReleaseNotesScreenProps) {
  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.pageTitle}>Release notes</Text>

        {notes.map((note, idx) => (
          <View
            key={note.version}
            style={styles.releaseBlock}
            testID={testID ? `${testID}-release-${note.version}` : undefined}
          >
            <View style={styles.releaseHeader}>
              <Text style={styles.releaseVersion}>{note.version}</Text>
              <Text style={styles.releaseDate}>{note.date}</Text>
              {idx === 0 && (
                <View style={styles.latestBadge} testID={testID ? `${testID}-latest-badge` : undefined}>
                  <Text style={styles.latestBadgeText}>Latest</Text>
                </View>
              )}
            </View>
            {note.highlights.map((h, hi) => (
              <Text
                key={hi}
                style={styles.highlight}
                testID={testID ? `${testID}-highlight-${note.version}-${hi}` : undefined}
              >
                • {h}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
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
  // Table
  table: {
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.background,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  tableCell: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    width: 56,
    textAlign: "center",
  },
  tableCellFlex: { flex: 1 },
  catLabel: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  catPurpose: { fontSize: 12, color: colors.textMuted },
  link: { fontSize: 14, color: colors.primary, textDecorationLine: "underline" },
  // Data safety
  safetyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s4,
    gap: spacing.s1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  safetyCategory: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  safetyTypes: { fontSize: 13, color: colors.foreground },
  safetyPurpose: { fontSize: 13, color: colors.textMuted },
  safetyOptional: { fontSize: 12, color: colors.textMuted, fontStyle: "italic" },
  // App info
  infoBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  diagBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  diagBtnText: { fontSize: 14, color: colors.foreground },
  // Release notes
  releaseBlock: { gap: spacing.s2 },
  releaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
  },
  releaseVersion: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  releaseDate: { fontSize: 13, color: colors.textMuted, flex: 1 },
  latestBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s2,
    paddingVertical: 2,
  },
  latestBadgeText: { fontSize: 11, fontWeight: "700", color: colors.surface },
  highlight: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
});
