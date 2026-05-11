/**
 * DataExportScreen.tsx — I.3 Data Export Request / Status / Download (3 frames).
 *
 * exportState:
 *  - "default"   → I.3.1 Request form (category checkboxes + CTA)
 *  - "building"  → I.3.2 Status card (Pending / Building / Ready)
 *  - "ready"     → I.3.3 Download card (file info + expiry)
 *  - "expired"   → Download link expired state
 *  - "error"     → Generic error state
 */

import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, colors, spacing, textStyles } from "../../shared/ui";

export type DataExportState = "default" | "building" | "ready" | "expired" | "error";

export type ExportCategory = {
  id: string;
  label: string;
};

export type DataExportScreenProps = {
  exportState?: DataExportState;
  categories?: ExportCategory[];
  /** ISO date string of when the export was requested. */
  requestedAt?: string;
  /** Approximate progress label e.g. "Building". */
  buildStatus?: "Pending" | "Building" | "Ready";
  fileSize?: string;
  /** ISO date string when the download link expires. */
  expiresAt?: string;
  onRequestExport: (categoryIds: string[]) => void;
  onDownload?: () => void;
  onRequestNew?: () => void;
  testID?: string;
};

const DEFAULT_CATEGORIES: ExportCategory[] = [
  { id: "profile", label: "Profile information" },
  { id: "bookings", label: "Booking history" },
  { id: "payments", label: "Payment records" },
  { id: "loyalty", label: "Loyalty & rewards" },
  { id: "messages", label: "Messages" },
  { id: "reviews", label: "Reviews & ratings" },
];

export function DataExportScreen({
  exportState = "default",
  categories = DEFAULT_CATEGORIES,
  requestedAt,
  buildStatus = "Pending",
  fileSize,
  expiresAt,
  onRequestExport,
  onDownload,
  onRequestNew,
  testID,
}: DataExportScreenProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );

  function toggleCategory(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (exportState === "error") {
    return (
      <View style={styles.centered} testID={testID}>
        <Banner variant="error" message="Something went wrong. Please try again." />
        <Button
          label="Try again"
          onPress={() => onRequestNew?.()}
          testID={testID ? `${testID}-retry` : undefined}
        />
      </View>
    );
  }

  // I.3.2 Status frame
  if (exportState === "building") {
    return (
      <View style={styles.container} testID={testID}>
        <Text style={styles.heading}>Export in progress</Text>
        <View style={styles.statusCard} testID={testID ? `${testID}-status-card` : undefined}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.statusLabel}>{buildStatus}</Text>
          <Text style={styles.statusEta}>Your export will be ready within 30 days.</Text>
          {requestedAt ? (
            <Text style={styles.statusMeta}>Requested {requestedAt}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  // I.3.3 Download frame
  if (exportState === "ready" || exportState === "expired") {
    const isExpired = exportState === "expired";
    return (
      <View style={styles.container} testID={testID}>
        <Text style={styles.heading}>Your export is ready</Text>
        <View style={styles.fileCard} testID={testID ? `${testID}-file-card` : undefined}>
          <Text style={styles.fileIcon}>{"🗂"}</Text>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>zarkili-data-export.zip</Text>
            {fileSize ? <Text style={styles.fileMeta}>{fileSize} · JSON + CSV</Text> : null}
          </View>
        </View>
        {isExpired ? (
          <Banner
            variant="warning"
            message="This download link has expired. Request a new export."
            testID={testID ? `${testID}-expired-banner` : undefined}
          />
        ) : null}
        {expiresAt && !isExpired ? (
          <Text style={styles.expiry}>Download link expires {expiresAt}.</Text>
        ) : null}
        {isExpired ? (
          <Button
            label="Request new export"
            variant="primary"
            onPress={onRequestNew}
            testID={testID ? `${testID}-request-new` : undefined}
          />
        ) : (
          <Button
            label="Download"
            variant="primary"
            onPress={onDownload}
            testID={testID ? `${testID}-download` : undefined}
          />
        )}
      </View>
    );
  }

  // I.3.1 Request form (default)
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      <Text style={styles.heading}>Export your data</Text>
      <Text style={styles.body}>
        Request a copy of your Zarkili data. Your export will be prepared within
        30 days in compliance with CCPA and GDPR data portability rights.
      </Text>

      <Text style={styles.sectionLabel}>Select data to include</Text>
      {categories.map((cat) => (
        <Pressable
          key={cat.id}
          style={styles.checkRow}
          onPress={() => toggleCategory(cat.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected.has(cat.id) }}
          testID={testID ? `${testID}-cat-${cat.id}` : undefined}
        >
          <View style={[styles.checkbox, selected.has(cat.id) ? styles.checkboxChecked : null]}>
            {selected.has(cat.id) ? <Text style={styles.checkmark}>{"✓"}</Text> : null}
          </View>
          <Text style={styles.checkLabel}>{cat.label}</Text>
        </Pressable>
      ))}

      <Button
        label="Request export"
        variant="primary"
        disabled={selected.size === 0}
        onPress={() => onRequestExport(Array.from(selected))}
        testID={testID ? `${testID}-request` : undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.pageHorizontal,
    paddingBottom: spacing.s12,
    gap: spacing.s4,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  heading: {
    ...textStyles.heading2,
    color: colors.foreground,
  },
  body: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.foreground,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    minHeight: spacing.touchTarget,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "700",
  },
  checkLabel: {
    ...textStyles.body,
    color: colors.foreground,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.s6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.s3,
    alignItems: "center",
  },
  statusLabel: {
    ...textStyles.heading4,
    color: colors.foreground,
  },
  statusEta: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  statusMeta: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.s3,
  },
  fileIcon: {
    fontSize: 32,
  },
  fileInfo: {
    flex: 1,
    gap: spacing.s1,
  },
  fileName: {
    ...textStyles.label,
    color: colors.foreground,
  },
  fileMeta: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  expiry: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
  },
});
