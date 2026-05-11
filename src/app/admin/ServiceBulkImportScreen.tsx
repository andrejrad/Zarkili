/**
 * W42 — ServiceBulkImportScreen
 *
 * Paste or type CSV data to bulk-import services.
 * Expected columns: name, category, durationMinutes, price, currency
 *
 * Parse errors are shown inline before the user commits the import.
 * Actual Firestore writes are performed by the shell (onImport callback).
 */
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { ServiceImportRow } from "../../domains/services/serviceCatalogModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServiceBulkImportScreenProps = {
  csvText: string;
  parsedRows: ServiceImportRow[];
  parseErrors: string[];
  importSubmitting: boolean;
  importSuccess: string | null;
  importError: string | null;
  onCsvChange: (v: string) => void;
  onImport: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TEMPLATE = "name,category,durationMinutes,price,currency\nHaircut,hair,45,35,USD\nBlowout,hair,30,25,USD";

export function ServiceBulkImportScreen({
  csvText,
  parsedRows,
  parseErrors,
  importSubmitting,
  importSuccess,
  importError,
  onCsvChange,
  onImport,
  onBack,
  testID = "service-bulk-import-screen",
}: ServiceBulkImportScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>‹ Import Services</Text>
      </Pressable>

      <Text style={styles.title}>Bulk Import Services</Text>
      <Text style={styles.hint}>
        Required columns: <Text style={styles.mono}>name, category, durationMinutes, price, currency</Text>
      </Text>

      <TextInput
        style={styles.csvInput}
        value={csvText}
        onChangeText={onCsvChange}
        multiline
        numberOfLines={8}
        placeholder={TEMPLATE}
        autoCapitalize="none"
        autoCorrect={false}
        testID={`${testID}-csv-input`}
      />

      {/* Parse errors */}
      {parseErrors.length > 0 ? (
        <View style={styles.errorCard} testID={`${testID}-parse-errors`}>
          {parseErrors.map((e, i) => (
            <Text key={i} style={styles.error}>{e}</Text>
          ))}
        </View>
      ) : null}

      {/* Preview table */}
      {parsedRows.length > 0 && parseErrors.length === 0 ? (
        <View style={styles.previewCard} testID={`${testID}-preview`}>
          <Text style={styles.previewTitle}>{parsedRows.length} service{parsedRows.length === 1 ? "" : "s"} ready to import</Text>
          {parsedRows.map((row, i) => (
            <View key={i} style={styles.previewRow}>
              <Text style={styles.previewName}>{row.name}</Text>
              <Text style={styles.previewMeta}>{row.category} · {row.durationMinutes} min · {row.price} {row.currency}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Import outcome */}
      {importSuccess ? <Text style={styles.success} testID={`${testID}-import-success`}>{importSuccess}</Text> : null}
      {importError ? <Text style={styles.error} testID={`${testID}-import-error`}>{importError}</Text> : null}

      <Pressable
        style={[styles.btn, (importSubmitting || parsedRows.length === 0 || parseErrors.length > 0) && styles.btnDisabled]}
        disabled={importSubmitting || parsedRows.length === 0 || parseErrors.length > 0}
        onPress={onImport}
        accessibilityRole="button"
        testID={`${testID}-import-btn`}
      >
        <Text style={styles.btnLabel}>
          {importSubmitting ? "Importing…" : `Import ${parsedRows.length} service${parsedRows.length === 1 ? "" : "s"}`}
        </Text>
      </Pressable>

      <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button">
        <Text style={styles.backBtnLabel}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { gap: 12, paddingBottom: 24 },
  back: { fontSize: 14, color: "#6B6B6B", fontFamily: brandTypography.regular, marginBottom: 4 },
  title: { fontSize: 20, lineHeight: 28, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  hint: { fontSize: 13, lineHeight: 18, color: "#6B6B6B", fontFamily: brandTypography.regular },
  mono: { fontFamily: brandTypography.medium, color: "#1A1A1A" },
  csvInput: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: "#FFFFFF", fontFamily: brandTypography.regular,
    color: "#1A1A1A", textAlignVertical: "top", minHeight: 140,
  },
  errorCard: {
    borderWidth: 1, borderColor: "#FFCDD2", borderRadius: 12,
    padding: 12, backgroundColor: "#FFF5F5", gap: 4,
  },
  error: { fontSize: 13, lineHeight: 18, color: "#F44336", fontFamily: brandTypography.regular },
  previewCard: {
    borderWidth: 1, borderColor: "#C8E6C9", borderRadius: 12,
    padding: 12, backgroundColor: "#F5FFF5", gap: 6,
  },
  previewTitle: { fontSize: 13, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  previewRow: { gap: 2 },
  previewName: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  previewMeta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  success: { fontSize: 13, lineHeight: 18, color: "#4CAF50", fontFamily: brandTypography.regular },
  btn: {
    borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 16,
    alignItems: "center", backgroundColor: "#E3A9A0",
  },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { color: "#FFFFFF", fontSize: 14, fontFamily: brandTypography.medium },
  backBtn: {
    marginTop: 4, borderRadius: 9999, paddingVertical: 12,
    paddingHorizontal: 16, alignItems: "center",
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E0D1",
  },
  backBtnLabel: { color: "#6B6B6B", fontSize: 14, fontFamily: brandTypography.medium },
});
