/**
 * W45 — PointAdjustmentScreen
 *
 * Manual loyalty point credit / debit for a client, with reason picker and audit note.
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
import type {
  PointAdjustmentDirection,
  PointAdjustmentReason,
} from "../../domains/loyalty/loyaltyAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type PointAdjustmentScreenProps = {
  clientName: string;
  clientId: string;
  direction: PointAdjustmentDirection;
  points: string;
  reason: PointAdjustmentReason;
  note: string;
  saving: boolean;
  error: string | null;
  success: boolean;
  onDirectionChange: (d: PointAdjustmentDirection) => void;
  onPointsChange: (v: string) => void;
  onReasonChange: (r: PointAdjustmentReason) => void;
  onNoteChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  testID?: string;
};

const REASONS: { value: PointAdjustmentReason; label: string }[] = [
  { value: "goodwill", label: "Goodwill" },
  { value: "correction", label: "Correction" },
  { value: "event_bonus", label: "Event bonus" },
  { value: "promotion", label: "Promotion" },
  { value: "other", label: "Other" },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function PointAdjustmentScreen({
  clientName,
  clientId,
  direction,
  points,
  reason,
  note,
  saving,
  error,
  success,
  onDirectionChange,
  onPointsChange,
  onReasonChange,
  onNoteChange,
  onSubmit,
  onBack,
  testID = "point-adjustment-screen",
}: PointAdjustmentScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Adjust Points</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Client info */}
        <View style={styles.clientBanner} testID="client-banner">
          <Text style={styles.clientLabel}>Client</Text>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.clientId}>{clientId}</Text>
        </View>

        {/* Direction toggle */}
        <Text style={styles.sectionLabel}>Direction</Text>
        <View style={styles.toggleRow} testID="direction-selector">
          {(["credit", "debit"] as PointAdjustmentDirection[]).map((d) => (
            <Pressable
              key={d}
              onPress={() => onDirectionChange(d)}
              style={[styles.toggleChip, direction === d && styles.toggleChipActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: direction === d }}
              testID={`direction-${d}`}
            >
              <Text style={[styles.toggleChipText, direction === d && styles.toggleChipTextActive]}>
                {d === "credit" ? "Credit" : "Debit"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Points */}
        <Text style={styles.sectionLabel}>Points</Text>
        <TextInput
          style={styles.input}
          value={points}
          onChangeText={onPointsChange}
          keyboardType="numeric"
          placeholder="e.g. 100"
          testID="points-input"
        />

        {/* Reason */}
        <Text style={styles.sectionLabel}>Reason</Text>
        <View style={styles.reasonGrid} testID="reason-selector">
          {REASONS.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => onReasonChange(r.value)}
              style={[styles.reasonChip, reason === r.value && styles.reasonChipActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: reason === r.value }}
              testID={`reason-${r.value}`}
            >
              <Text style={[styles.reasonChipText, reason === r.value && styles.reasonChipTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Note */}
        <Text style={styles.sectionLabel}>Audit note (required)</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={onNoteChange}
          multiline
          placeholder="Reason for this adjustment…"
          testID="note-input"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>Points adjusted successfully.</Text>}

        <Pressable
          onPress={onSubmit}
          disabled={saving}
          accessibilityRole="button"
          style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
          testID="submit-adjustment-btn"
        >
          <Text style={styles.submitBtnText}>{saving ? "Saving…" : "Apply adjustment"}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  backBtn: { paddingRight: 8 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6b7280" },
  title: { fontFamily: brandTypography.semibold, fontSize: 18, color: "#111827" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  clientBanner: {
    backgroundColor: "#ede9fe",
    borderRadius: 8,
    padding: 12,
    gap: 2,
  },
  clientLabel: { fontFamily: brandTypography.regular, fontSize: 11, color: "#7c3aed" },
  clientName: { fontFamily: brandTypography.semibold, fontSize: 16, color: "#111827" },
  clientId: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6b7280" },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#374151", marginTop: 4 },
  toggleRow: { flexDirection: "row", gap: 10 },
  toggleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  toggleChipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  toggleChipText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#374151" },
  toggleChipTextActive: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: brandTypography.regular,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  reasonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reasonChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  reasonChipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  reasonChipText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#374151" },
  reasonChipTextActive: { color: "#fff" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#ef4444" },
  successText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#16a34a" },
  submitBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#fff" },
});
