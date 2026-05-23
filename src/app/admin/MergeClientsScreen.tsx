/**
 * W44 — MergeClientsScreen
 *
 * Two-column comparison between primary vs duplicate client. Required reason
 * text area. Confirm button submits the merge.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { MergeCandidateSummary } from "../../domains/clients/clientCrmModel";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MergeClientsScreenProps = {
  loading: boolean;
  error: string | null;
  primary: MergeCandidateSummary | null;
  duplicate: MergeCandidateSummary | null;
  reason: string;
  submitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  onReasonChange: (text: string) => void;
  onConfirm: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

type CompareRowProps = {
  label: string;
  primaryVal: string;
  duplicateVal: string;
  conflict: boolean;
};

function CompareRow({ label, primaryVal, duplicateVal, conflict }: CompareRowProps) {
  return (
    <View
      style={[styles.compareRow, conflict && styles.compareRowConflict]}
      testID={`conflict-row-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Text style={styles.compareLabel}>{label}</Text>
      <View style={styles.compareCols}>
        <Text style={[styles.compareVal, styles.primaryVal]} numberOfLines={2}>
          {primaryVal || "—"}
        </Text>
        <Text style={[styles.compareVal, styles.duplicateVal]} numberOfLines={2}>
          {duplicateVal || "—"}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function MergeClientsScreen({
  loading,
  error,
  primary,
  duplicate,
  reason,
  submitting,
  submitError,
  submitSuccess,
  onReasonChange,
  onConfirm,
  onRetry,
  onBack,
  testID = "merge-clients-screen",
}: MergeClientsScreenProps) {
  if (loading) return <AdminLoadingState label="Loading client records…" />;
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Merge Clients</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Column headers */}
        <View style={styles.colHeaders} testID="comparison-table">
          <Text style={[styles.colHeader, styles.primaryHeader]} testID="primary-col">
            Primary (keep)
          </Text>
          <Text style={[styles.colHeader, styles.duplicateHeader]} testID="duplicate-col">
            Duplicate (merge away)
          </Text>
        </View>

        {primary && duplicate ? (
          <>
            <CompareRow
              label="Name"
              primaryVal={primary.name}
              duplicateVal={duplicate.name}
              conflict={primary.name !== duplicate.name}
            />
            <CompareRow
              label="Phone"
              primaryVal={primary.phone ?? ""}
              duplicateVal={duplicate.phone ?? ""}
              conflict={primary.phone !== duplicate.phone}
            />
            <CompareRow
              label="Email"
              primaryVal={primary.email ?? ""}
              duplicateVal={duplicate.email ?? ""}
              conflict={primary.email !== duplicate.email}
            />
            <CompareRow
              label="Bookings"
              primaryVal={String(primary.bookingCount)}
              duplicateVal={String(duplicate.bookingCount)}
              conflict={false}
            />
            <CompareRow
              label="Loyalty pts"
              primaryVal={String(primary.loyaltyPoints)}
              duplicateVal={String(duplicate.loyaltyPoints)}
              conflict={false}
            />
          </>
        ) : (
          <Text style={styles.emptyText}>Client data unavailable.</Text>
        )}

        {/* Reason */}
        <Text style={styles.reasonLabel}>Reason for merge *</Text>
        <TextInput
          style={styles.reasonInput}
          value={reason}
          onChangeText={onReasonChange}
          multiline
          numberOfLines={4}
          placeholder="Explain why these records should be merged…"
          placeholderTextColor="#999"
          testID="reason-input"
          accessibilityLabel="Merge reason"
        />

        {submitError && <Text style={styles.errorText}>{submitError}</Text>}
        {submitSuccess && (
          <Text style={styles.successText}>Clients merged successfully.</Text>
        )}

        <Pressable
          onPress={onConfirm}
          disabled={submitting || !reason.trim()}
          style={[
            styles.confirmBtn,
            (submitting || !reason.trim()) && styles.confirmBtnDisabled,
          ]}
          accessibilityRole="button"
          testID="confirm-btn"
        >
          <Text style={styles.confirmBtnText}>
            {submitting ? "Merging…" : "Confirm Merge"}
          </Text>
        </Pressable>
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
  colHeaders: {
    flexDirection: "row",
    marginBottom: 4,
  },
  colHeader: { flex: 1, fontFamily: brandTypography.regular, fontSize: 12, fontWeight: "700", paddingVertical: 8, textAlign: "center" },
  primaryHeader: { color: "#2E7D32", backgroundColor: "#E8F5E9", borderRadius: 4 },
  duplicateHeader: { color: "#C62828", backgroundColor: "#FFEBEE", borderRadius: 4, marginLeft: 4 },
  compareRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 6,
    padding: 10,
  },
  compareRowConflict: { borderLeftWidth: 3, borderLeftColor: "#F57F17" },
  compareLabel: { fontFamily: brandTypography.regular, fontSize: 12, color: "#888", marginBottom: 4 },
  compareCols: { flexDirection: "row", gap: 8 },
  compareVal: { flex: 1, fontFamily: brandTypography.regular, fontSize: 14 },
  primaryVal: { color: "#2E7D32" },
  duplicateVal: { color: "#C62828" },
  emptyText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#666", textAlign: "center", marginVertical: 24 },
  reasonLabel: { fontFamily: brandTypography.regular, fontSize: 12, color: "#555", marginTop: 16, marginBottom: 6 },
  reasonInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#DDD",
    fontFamily: brandTypography.regular, fontSize: 14,
  },
  errorText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#CC0000", marginTop: 10 },
  successText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#2E7D32", marginTop: 10 },
  confirmBtn: {
    marginTop: 20,
    backgroundColor: "#6B4EFF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmBtnDisabled: { backgroundColor: "#CCCCCC" },
  confirmBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#FFFFFF" },
});
