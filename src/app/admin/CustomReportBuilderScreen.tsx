/**
 * W47 — CustomReportBuilderScreen
 *
 * Mobile-adapted version of the admin report-builder design spec.
 * Allows the owner to select a report type, choose a date range,
 * run the report (results displayed in-screen), and export.
 *
 * The desktop drag-and-drop canvas from the spec is deferred to web.
 */
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { ReportKey } from "../../domains/analytics/model";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportResultRow = Record<string, string | number>;

export type ReportResult = {
  columns: string[];
  rows: ReportResultRow[];
};

export type CustomReportBuilderScreenProps = {
  loading: boolean;
  error: string | null;
  availableReports: ReportKey[];
  planTier: string;
  selectedReport: ReportKey | null;
  dateRangeStart: string;
  dateRangeEnd: string;
  result: ReportResult | null;
  exportEnabled: boolean;
  onSelectReport: (key: ReportKey) => void;
  onChangeDateStart: (v: string) => void;
  onChangeDateEnd: (v: string) => void;
  onRunReport: () => void;
  onExport: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Label map for report keys
// ---------------------------------------------------------------------------

const REPORT_LABELS: Record<ReportKey, string> = {
  retention: "Client Retention",
  rebooking: "Rebooking Rate",
  at_risk: "At-Risk Clients",
  visit_interval: "Visit Intervals",
  staff_performance: "Staff Performance",
  service_performance: "Service Performance",
  campaign_analytics: "Campaign Analytics",
  challenge_analytics: "Challenge Analytics",
  export: "Full Export",
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function CustomReportBuilderScreen({
  loading,
  error,
  availableReports,
  planTier,
  selectedReport,
  dateRangeStart,
  dateRangeEnd,
  result,
  exportEnabled,
  onSelectReport,
  onChangeDateStart,
  onChangeDateEnd,
  onRunReport,
  onExport,
  onBack,
  testID = "custom-report-builder-screen",
}: CustomReportBuilderScreenProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">Report Builder</Text>
        {exportEnabled && result && (
          <Pressable
            onPress={onExport}
            style={styles.exportBtn}
            accessibilityRole="button"
            accessibilityLabel="Export report"
            testID="export-btn"
          >
            <Text style={styles.exportBtnText}>Export</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Plan badge */}
        <View style={styles.planBadge} testID="plan-badge">
          <Text style={styles.planBadgeText}>Plan: {planTier}</Text>
        </View>

        {/* Report picker */}
        <Text style={styles.fieldLabel}>Report Type</Text>
        <Pressable
          style={styles.pickerBtn}
          onPress={() => setPickerOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityLabel="Select report type"
          testID="report-picker"
        >
          <Text style={styles.pickerBtnText}>
            {selectedReport ? REPORT_LABELS[selectedReport] : "Select a report…"}
          </Text>
          <Text style={styles.pickerArrow}>{pickerOpen ? "▲" : "▼"}</Text>
        </Pressable>

        {pickerOpen && (
          <View style={styles.pickerDropdown} testID="report-picker-dropdown">
            {(
              [
                "retention",
                "rebooking",
                "at_risk",
                "visit_interval",
                "staff_performance",
                "service_performance",
                "campaign_analytics",
                "challenge_analytics",
                "export",
              ] as ReportKey[]
            ).map((key) => {
              const available = availableReports.includes(key);
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    if (available) {
                      onSelectReport(key);
                      setPickerOpen(false);
                    }
                  }}
                  style={[styles.pickerOption, !available && styles.pickerOptionLocked]}
                  accessibilityRole="menuitem"
                  accessibilityState={{ disabled: !available }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      !available && styles.pickerOptionTextLocked,
                    ]}
                  >
                    {REPORT_LABELS[key]}
                  </Text>
                  {!available && (
                    <Text style={styles.lockedChip}>Upgrade</Text>
                  )}
                  {key === selectedReport && (
                    <Text style={styles.selectedMark}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Date range */}
        <Text style={styles.fieldLabel}>Date Range</Text>
        <View style={styles.dateRow} testID="date-range">
          <View style={styles.dateField}>
            <Text style={styles.dateFieldLabel}>From</Text>
            <TextInput
              style={styles.dateInput}
              value={dateRangeStart}
              onChangeText={onChangeDateStart}
              placeholder="YYYY-MM-DD"
              accessibilityLabel="Start date"
              testID="date-start"
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateFieldLabel}>To</Text>
            <TextInput
              style={styles.dateInput}
              value={dateRangeEnd}
              onChangeText={onChangeDateEnd}
              placeholder="YYYY-MM-DD"
              accessibilityLabel="End date"
              testID="date-end"
            />
          </View>
        </View>

        {/* Run button */}
        <Pressable
          onPress={onRunReport}
          style={[
            styles.runBtn,
            (!selectedReport || loading) && styles.runBtnDisabled,
          ]}
          disabled={!selectedReport || loading}
          accessibilityRole="button"
          accessibilityLabel="Run report"
          testID="run-btn"
        >
          <Text style={styles.runBtnText}>
            {loading ? "Running…" : "Run Report"}
          </Text>
        </Pressable>

        {/* Loading / error */}
        {loading && <AdminLoadingState label="Generating report…" />}
        {!loading && error && <AdminErrorState message={error} onRetry={onRunReport} />}

        {/* Results */}
        {!loading && !error && result && (
          <View style={styles.resultCard} testID="report-results">
            <Text style={styles.sectionLabel}>
              {selectedReport ? REPORT_LABELS[selectedReport] : "Results"} — {result.rows.length} row
              {result.rows.length !== 1 ? "s" : ""}
            </Text>
            {/* Column headers */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              {result.columns.map((col) => (
                <Text key={col} style={styles.tableHeaderCell} numberOfLines={1}>
                  {col}
                </Text>
              ))}
            </View>
            {/* Data rows */}
            {result.rows.map((row, i) => (
              <View
                key={i}
                style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}
              >
                {result.columns.map((col) => (
                  <Text key={col} style={styles.tableCell} numberOfLines={1}>
                    {String(row[col] ?? "—")}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backBtn: { padding: 4 },
  backText: { ...brandTypography.labelMd, color: "#6366F1" },
  title: { ...brandTypography.headingMd, color: "#111827", flex: 1 },
  exportBtn: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  exportBtnText: { ...brandTypography.labelMd, color: "#FFFFFF" },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },

  planBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 20,
  },
  planBadgeText: { ...brandTypography.labelSm, color: "#6366F1" },

  fieldLabel: {
    ...brandTypography.labelSm,
    color: "#374151",
    marginBottom: 6,
    marginTop: 16,
  },

  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerBtnText: { ...brandTypography.bodyMd, color: "#111827", flex: 1 },
  pickerArrow: { ...brandTypography.labelSm, color: "#6B7280" },

  pickerDropdown: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    marginTop: 4,
    overflow: "hidden",
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerOptionLocked: { opacity: 0.5 },
  pickerOptionText: { ...brandTypography.bodyMd, color: "#111827", flex: 1 },
  pickerOptionTextLocked: { color: "#9CA3AF" },
  lockedChip: {
    ...brandTypography.labelSm,
    color: "#6366F1",
    backgroundColor: "#EEF2FF",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  selectedMark: { ...brandTypography.labelMd, color: "#6366F1", marginLeft: 8 },

  dateRow: { flexDirection: "row", gap: 12 },
  dateField: { flex: 1 },
  dateFieldLabel: { ...brandTypography.labelSm, color: "#6B7280", marginBottom: 4 },
  dateInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...brandTypography.bodyMd,
    color: "#111827",
  },

  runBtn: {
    marginTop: 20,
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  runBtnDisabled: { backgroundColor: "#D1D5DB" },
  runBtnText: { ...brandTypography.labelMd, color: "#FFFFFF" },

  sectionLabel: {
    ...brandTypography.labelSm,
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  resultCard: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tableRowAlt: { backgroundColor: "#F9FAFB" },
  tableHeader: { backgroundColor: "#F3F4F6" },
  tableHeaderCell: {
    flex: 1,
    ...brandTypography.labelSm,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tableCell: { flex: 1, ...brandTypography.bodyMd, color: "#374151" },
});
