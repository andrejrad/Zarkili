/**
 * LegalPageScreen.tsx — I.1 Legal Pages (ToS / Privacy / Cookies / About / Licenses).
 *
 * Presentation-only. Container selects `pageType` and provides content.
 * Cookies variant shows CCPA "Do Not Sell or Share" toggle for CA residents.
 */

import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Button, LegalPageLayout, colors, spacing, textStyles } from "../../shared/ui";

export type LegalPageType =
  | "terms"
  | "privacy"
  | "cookies"
  | "about"
  | "licenses";

export type LegalPageState = "default" | "loading" | "error" | "accept-required";

export type LegalSection = {
  id: string;
  heading: string;
  body: string;
};

export type LegalPageScreenProps = {
  pageType: LegalPageType;
  state?: LegalPageState;
  lastUpdated?: string;
  sections?: LegalSection[];
  /** Cookies page: whether the user is in a CA/applicable state. */
  isCaResident?: boolean;
  /** Cookies page: current value of Do Not Sell toggle. */
  doNotSell?: boolean;
  onToggleDoNotSell?: (value: boolean) => void;
  onSaveCookiePreferences?: () => void;
  onDownloadPdf?: () => void;
  onAccept?: () => void;
  onBack?: () => void;
  testID?: string;
};

const PAGE_TITLES: Record<LegalPageType, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  cookies: "Cookie Policy",
  about: "About Zarkili",
  licenses: "Open-Source Licenses",
};

const DOWNLOAD_LABEL: Record<LegalPageType, string> = {
  terms: "Download PDF",
  privacy: "Download PDF",
  cookies: "Save preferences",
  about: "Download PDF",
  licenses: "Download PDF",
};

export function LegalPageScreen({
  pageType,
  state = "default",
  lastUpdated,
  sections = [],
  isCaResident,
  doNotSell,
  onToggleDoNotSell,
  onSaveCookiePreferences,
  onDownloadPdf,
  onAccept,
  onBack,
  testID,
}: LegalPageScreenProps) {
  const title = PAGE_TITLES[pageType];

  const jumpLinks = sections.map((s) => ({ id: s.id, label: s.heading }));

  const footer =
    pageType === "cookies" ? (
      <Button
        label={DOWNLOAD_LABEL[pageType]}
        variant="primary"
        onPress={onSaveCookiePreferences}
        testID={testID ? `${testID}-save-prefs` : undefined}
      />
    ) : (
      <Button
        label={DOWNLOAD_LABEL[pageType]}
        variant="tertiary"
        onPress={onDownloadPdf}
        testID={testID ? `${testID}-download` : undefined}
      />
    );

  if (state === "loading") {
    return (
      <View style={styles.centered} testID={testID}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (state === "error") {
    return (
      <View style={styles.centered} testID={testID}>
        <Text style={styles.errorText}>Failed to load. Please try again.</Text>
        <Button label="Retry" onPress={onBack} testID={testID ? `${testID}-retry` : undefined} />
      </View>
    );
  }

  return (
    <LegalPageLayout
      title={title}
      lastUpdated={lastUpdated}
      jumpLinks={jumpLinks}
      footer={footer}
      onBack={onBack}
      testID={testID}
    >
      {/* accept-required banner (cookie first-run) */}
      {state === "accept-required" ? (
        <View style={styles.acceptBanner} testID={testID ? `${testID}-accept-banner` : undefined}>
          <Text style={styles.acceptText}>
            Please review and accept our cookie policy to continue.
          </Text>
          <Button
            label="Accept"
            variant="primary"
            size="small"
            onPress={onAccept}
            testID={testID ? `${testID}-accept` : undefined}
          />
        </View>
      ) : null}

      {/* CCPA Do Not Sell (CA residents, cookies page) */}
      {pageType === "cookies" && isCaResident ? (
        <View style={styles.ccpaRow} testID={testID ? `${testID}-do-not-sell` : undefined}>
          <Text style={styles.ccpaLabel}>Do Not Sell or Share My Data</Text>
          <Button
            label={doNotSell ? "Opted out" : "Opt out"}
            variant={doNotSell ? "secondary" : "primary"}
            size="small"
            onPress={() => onToggleDoNotSell?.(!doNotSell)}
            testID={testID ? `${testID}-do-not-sell-btn` : undefined}
          />
        </View>
      ) : null}

      {/* Content sections */}
      {sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <Text
            style={styles.sectionHeading}
            testID={testID ? `${testID}-heading-${section.id}` : undefined}
          >
            {section.heading}
          </Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}

      {/* About: ADA / WCAG note */}
      {pageType === "about" ? (
        <View style={styles.section}>
          <Text style={styles.sectionBody}>
            Zarkili is committed to digital accessibility in accordance with ADA
            and WCAG 2.1 AA standards.
          </Text>
        </View>
      ) : null}
    </LegalPageLayout>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  errorText: {
    ...textStyles.body,
    color: colors.foreground,
    textAlign: "center",
  },
  acceptBanner: {
    backgroundColor: colors.primary10,
    borderRadius: 8,
    padding: spacing.s4,
    marginBottom: spacing.s4,
    gap: spacing.s3,
  },
  acceptText: {
    ...textStyles.body,
    color: colors.foreground,
  },
  ccpaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.s4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s4,
  },
  ccpaLabel: {
    ...textStyles.label,
    color: colors.foreground,
    flex: 1,
    marginRight: spacing.s3,
  },
  section: {
    marginBottom: spacing.s6,
    gap: spacing.s2,
  },
  sectionHeading: {
    ...textStyles.heading3,
    color: colors.foreground,
  },
  sectionBody: {
    ...textStyles.body,
    color: colors.foreground,
    lineHeight: 22,
  },
});
