/**
 * W44 — GdprExportScreen
 *
 * Admin screen to request a GDPR data export for a specific client.
 * Export type (full / bookings / loyalty) and format (json / csv) selectors.
 * Previous requests table. Destructive delete-client button.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type {
  GdprExportFormat,
  GdprExportRequest,
  GdprExportType,
} from "../../domains/clients/clientCrmModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GdprExportScreenProps = {
  clientName: string;
  loading: boolean;
  error: string | null;
  exportType: GdprExportType;
  format: GdprExportFormat;
  previousRequests: GdprExportRequest[];
  submitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  onExportTypeChange: (t: GdprExportType) => void;
  onFormatChange: (f: GdprExportFormat) => void;
  onRequestExport: () => void;
  onDeleteClient: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const EXPORT_TYPE_LABELS: Record<GdprExportType, string> = {
  full: "Full data",
  bookings: "Bookings only",
  loyalty: "Loyalty only",
};

const FORMAT_LABELS: Record<GdprExportFormat, string> = {
  json: "JSON",
  csv: "CSV",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#FFF8E1",
  processing: "#E3F2FD",
  ready: "#E8F5E9",
  failed: "#FFEBEE",
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function GdprExportScreen({
  clientName,
  loading,
  error,
  exportType,
  format,
  previousRequests,
  submitting,
  submitError,
  submitSuccess,
  onExportTypeChange,
  onFormatChange,
  onRequestExport,
  onDeleteClient,
  onRetry,
  onBack,
  testID = "gdpr-export-screen",
}: GdprExportScreenProps) {
  if (loading) return <AdminLoadingState label="Loading GDPR records…" />;
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>GDPR / Data Export</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.clientLabel}>{clientName}</Text>

        {/* Export type */}
        <Text style={styles.sectionLabel}>Export type</Text>
        <View style={styles.optionRow}>
          {(Object.keys(EXPORT_TYPE_LABELS) as GdprExportType[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => onExportTypeChange(t)}
              style={[styles.optionChip, exportType === t && styles.optionChipActive]}
              testID={`export-type-${t}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: exportType === t }}
            >
              <Text
                style={[
                  styles.optionChipText,
                  exportType === t && styles.optionChipTextActive,
                ]}
              >
                {EXPORT_TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Format */}
        <Text style={styles.sectionLabel}>Format</Text>
        <View style={styles.optionRow}>
          {(Object.keys(FORMAT_LABELS) as GdprExportFormat[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => onFormatChange(f)}
              style={[styles.optionChip, format === f && styles.optionChipActive]}
              testID={`format-${f}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: format === f }}
            >
              <Text
                style={[
                  styles.optionChipText,
                  format === f && styles.optionChipTextActive,
                ]}
              >
                {FORMAT_LABELS[f]}
              </Text>
            </Pressable>
          ))}
        </View>

        {submitError && <Text style={styles.errorText}>{submitError}</Text>}
        {submitSuccess && (
          <Text style={styles.successText}>Export request submitted.</Text>
        )}

        <Pressable
          onPress={onRequestExport}
          disabled={submitting}
          style={[styles.exportBtn, submitting && styles.exportBtnDisabled]}
          accessibilityRole="button"
          testID="request-export-btn"
        >
          <Text style={styles.exportBtnText}>
            {submitting ? "Requesting…" : "Request Export"}
          </Text>
        </Pressable>

        {/* Previous requests */}
        <Text style={styles.sectionLabel}>Previous requests</Text>
        <View testID="previous-requests">
          {previousRequests.length === 0 ? (
            <Text style={styles.emptyText}>No previous export requests.</Text>
          ) : (
            previousRequests.map((req) => (
              <View
                key={req.requestId}
                style={[
                  styles.reqRow,
                  { backgroundColor: STATUS_COLORS[req.status] ?? "#F5F5F5" },
                ]}
              >
                <View style={styles.reqMeta}>
                  <Text style={styles.reqType}>
                    {EXPORT_TYPE_LABELS[req.exportType]} · {FORMAT_LABELS[req.format]}
                  </Text>
                  <Text style={styles.reqDate}>{req.requestedAt.slice(0, 10)}</Text>
                </View>
                <Text style={styles.reqStatus}>{req.status}</Text>
                {req.downloadUrl && (
                  <Text style={styles.reqDownload}>Download available</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Delete client — destructive */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerLabel}>Danger zone</Text>
          <Pressable
            onPress={onDeleteClient}
            style={styles.deleteBtn}
            accessibilityRole="button"
            testID="delete-client-btn"
          >
            <Text style={styles.deleteBtnText}>Delete client and all data</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backBtn: { marginRight: 12 },
  backText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6B4EFF" },
  title: { fontFamily: brandTypography.semibold, fontSize: 22 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  clientLabel: { fontFamily: brandTypography.semibold, fontSize: 14, marginBottom: 16 },
  sectionLabel: { fontFamily: brandTypography.regular, fontSize: 12, color: "#888", marginBottom: 8, marginTop: 16 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#CCC",
    backgroundColor: "#FFFFFF",
  },
  optionChipActive: { borderColor: "#6B4EFF", backgroundColor: "#6B4EFF" },
  optionChipText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#444" },
  optionChipTextActive: { color: "#FFFFFF" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#CC0000", marginTop: 12 },
  successText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#2E7D32", marginTop: 12 },
  exportBtn: {
    marginTop: 20,
    backgroundColor: "#6B4EFF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  exportBtnDisabled: { backgroundColor: "#CCCCCC" },
  exportBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#FFFFFF" },
  reqRow: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  reqMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  reqType: { fontFamily: brandTypography.regular, fontSize: 12, fontWeight: "600", color: "#444" },
  reqDate: { fontFamily: brandTypography.regular, fontSize: 12, color: "#888" },
  reqStatus: { fontFamily: brandTypography.regular, fontSize: 12, color: "#666", textTransform: "capitalize" },
  reqDownload: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6B4EFF", marginTop: 4 },
  emptyText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#888" },
  dangerZone: {
    marginTop: 32,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFCCCC",
    backgroundColor: "#FFF5F5",
  },
  dangerLabel: { fontFamily: brandTypography.regular, fontSize: 12, color: "#CC0000", marginBottom: 12 },
  deleteBtn: {
    backgroundColor: "#CC0000",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#FFFFFF" },
});
