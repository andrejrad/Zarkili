/**
 * W47 — ScheduledReportsScreen
 *
 * Lists existing scheduled reports for the tenant and lets the owner
 * create new ones (label, report key, cadence, format, recipient email)
 * or delete existing ones.
 */
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type {
  ScheduledReportCadence,
  ScheduledReportConfig,
  ScheduledReportFormat,
} from "./scheduledReportRepository";
import type { ReportKey } from "../../domains/analytics/model";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScheduledReportsScreenProps = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  reports: ScheduledReportConfig[];
  onCreateReport: (config: Omit<ScheduledReportConfig, "reportId" | "createdAt" | "active" | "createdBy">) => Promise<void>;
  onDeleteReport: (reportId: string) => Promise<void>;
  onBack: () => void;
  testID?: string;
};

type FormState = {
  label: string;
  reportKey: ReportKey | "";
  cadence: ScheduledReportCadence | "";
  format: ScheduledReportFormat | "";
  recipientEmail: string;
};

const EMPTY_FORM: FormState = {
  label: "",
  reportKey: "",
  cadence: "",
  format: "",
  recipientEmail: "",
};

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

const CADENCE_LABELS: Record<ScheduledReportCadence, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const FORMAT_LABELS: Record<ScheduledReportFormat, string> = {
  csv: "CSV",
  pdf: "PDF",
};

const REPORT_KEY_LABELS: Partial<Record<ReportKey, string>> = {
  retention: "Client Retention",
  rebooking: "Rebooking Rate",
  at_risk: "At-Risk Clients",
  staff_performance: "Staff Performance",
  service_performance: "Service Performance",
  campaign_analytics: "Campaign Analytics",
  export: "Full Export",
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ScheduledReportsScreen({
  loading,
  saving,
  error,
  reports,
  onCreateReport,
  onDeleteReport,
  onBack,
  testID = "scheduled-reports-screen",
}: ScheduledReportsScreenProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function handleCreate() {
    if (!form.label.trim()) {
      setFormError("Label is required.");
      return;
    }
    if (!form.reportKey) {
      setFormError("Select a report type.");
      return;
    }
    if (!form.cadence) {
      setFormError("Select a cadence.");
      return;
    }
    if (!form.format) {
      setFormError("Select a format.");
      return;
    }
    if (!form.recipientEmail.trim() || !form.recipientEmail.includes("@")) {
      setFormError("Enter a valid email address.");
      return;
    }
    setFormError(null);

    onCreateReport({
      tenantId: "", // filled by the shell handler
      label: form.label.trim(),
      reportKey: form.reportKey as ReportKey,
      cadence: form.cadence as ScheduledReportCadence,
      format: form.format as ScheduledReportFormat,
      recipientEmail: form.recipientEmail.trim(),
    }).then(() => {
      setForm(EMPTY_FORM);
      setFormOpen(false);
    });
  }

  function handleDelete(report: ScheduledReportConfig) {
    Alert.alert(
      "Delete Scheduled Report",
      `Delete "${report.label}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteReport(report.reportId),
        },
      ],
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">Scheduled Reports</Text>
        <Pressable
          onPress={() => setFormOpen((o) => !o)}
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel="Add scheduled report"
          testID="add-btn"
        >
          <Text style={styles.addBtnText}>{formOpen ? "Cancel" : "+ Add"}</Text>
        </Pressable>
      </View>

      {loading && <AdminLoadingState label="Loading scheduled reports…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={() => {}} />}

      {!loading && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* Create form */}
          {formOpen && (
            <View style={styles.formCard} testID="create-form">
              <Text style={styles.formTitle}>New Scheduled Report</Text>

              {formError && <Text style={styles.formError}>{formError}</Text>}

              <Text style={styles.fieldLabel}>Label</Text>
              <TextInput
                style={styles.textInput}
                value={form.label}
                onChangeText={(v) => setForm((f) => ({ ...f, label: v }))}
                placeholder="e.g. Weekly staff report"
                accessibilityLabel="Report label"
                testID="field-label"
              />

              <Text style={styles.fieldLabel}>Report Type</Text>
              <View style={styles.chipRow}>
                {(Object.keys(REPORT_KEY_LABELS) as ReportKey[]).map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => setForm((f) => ({ ...f, reportKey: key }))}
                    style={[styles.chip, form.reportKey === key && styles.chipSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: form.reportKey === key }}
                  >
                    <Text style={[styles.chipText, form.reportKey === key && styles.chipTextSelected]}>
                      {REPORT_KEY_LABELS[key]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Cadence</Text>
              <View style={styles.chipRow}>
                {(["daily", "weekly", "monthly"] as ScheduledReportCadence[]).map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setForm((f) => ({ ...f, cadence: c }))}
                    style={[styles.chip, form.cadence === c && styles.chipSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: form.cadence === c }}
                  >
                    <Text style={[styles.chipText, form.cadence === c && styles.chipTextSelected]}>
                      {CADENCE_LABELS[c]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Format</Text>
              <View style={styles.chipRow}>
                {(["csv", "pdf"] as ScheduledReportFormat[]).map((fmt) => (
                  <Pressable
                    key={fmt}
                    onPress={() => setForm((f) => ({ ...f, format: fmt }))}
                    style={[styles.chip, form.format === fmt && styles.chipSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: form.format === fmt }}
                  >
                    <Text style={[styles.chipText, form.format === fmt && styles.chipTextSelected]}>
                      {FORMAT_LABELS[fmt]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Recipient Email</Text>
              <TextInput
                style={styles.textInput}
                value={form.recipientEmail}
                onChangeText={(v) => setForm((f) => ({ ...f, recipientEmail: v }))}
                placeholder="owner@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Recipient email"
                testID="field-email"
              />

              <Pressable
                onPress={handleCreate}
                style={[styles.createBtn, saving && styles.createBtnDisabled]}
                disabled={saving}
                accessibilityRole="button"
                testID="create-btn"
              >
                <Text style={styles.createBtnText}>
                  {saving ? "Saving…" : "Create Schedule"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* List */}
          {reports.length === 0 && !formOpen && (
            <View style={styles.emptyState} testID="empty-state">
              <Text style={styles.emptyText}>No scheduled reports yet. Tap + Add to create one.</Text>
            </View>
          )}

          {reports.length > 0 && (
            <View style={styles.list} testID="report-list">
              {reports.map((r) => (
                <View key={r.reportId} style={styles.reportRow}>
                  <View style={styles.reportMeta}>
                    <Text style={styles.reportLabel}>{r.label}</Text>
                    <Text style={styles.reportSub}>
                      {REPORT_KEY_LABELS[r.reportKey as ReportKey] ?? r.reportKey} ·{" "}
                      {CADENCE_LABELS[r.cadence]} · {FORMAT_LABELS[r.format]}
                    </Text>
                    <Text style={styles.reportEmail}>{r.recipientEmail}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleDelete(r)}
                    style={styles.deleteBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${r.label}`}
                    testID={`delete-${r.reportId}`}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
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
  addBtn: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addBtnText: { ...brandTypography.labelMd, color: "#FFFFFF" },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 24,
  },
  formTitle: { ...brandTypography.headingSm, color: "#111827", marginBottom: 12 },
  formError: { ...brandTypography.bodyMd, color: "#DC2626", marginBottom: 10 },

  fieldLabel: {
    ...brandTypography.labelSm,
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...brandTypography.bodyMd,
    color: "#111827",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  chipSelected: { borderColor: "#6366F1", backgroundColor: "#EEF2FF" },
  chipText: { ...brandTypography.labelSm, color: "#374151" },
  chipTextSelected: { color: "#6366F1" },

  createBtn: {
    marginTop: 16,
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  createBtnDisabled: { backgroundColor: "#D1D5DB" },
  createBtnText: { ...brandTypography.labelMd, color: "#FFFFFF" },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: { ...brandTypography.bodyMd, color: "#9CA3AF", textAlign: "center" },

  list: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  reportMeta: { flex: 1, gap: 2 },
  reportLabel: { ...brandTypography.bodyMd, color: "#111827" },
  reportSub: { ...brandTypography.labelSm, color: "#6B7280" },
  reportEmail: { ...brandTypography.labelSm, color: "#9CA3AF" },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  deleteBtnText: { ...brandTypography.labelSm, color: "#DC2626" },
});
