/**
 * W44 — DeleteClientScreen
 *
 * Confirmation screen for hard-deleting a client and all associated data.
 * Requires a reason. Shows explicit warning text. Irreversible — double-confirm.
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeleteClientScreenProps = {
  clientName: string;
  reason: string;
  submitting: boolean;
  error: string | null;
  success: boolean;
  onReasonChange: (text: string) => void;
  onDelete: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function DeleteClientScreen({
  clientName,
  reason,
  submitting,
  error,
  success,
  onReasonChange,
  onDelete,
  onBack,
  testID = "delete-client-screen",
}: DeleteClientScreenProps) {
  const [confirmed, setConfirmed] = useState(false);
  const canSubmit = reason.trim().length > 0 && confirmed && !submitting;

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Delete Client</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Warning */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠ This action is irreversible</Text>
          <Text style={styles.warningBody}>
            Deleting <Text style={styles.warningName}>{clientName}</Text> will permanently
            remove all bookings, loyalty history, notes, photographs, and consent records.
            This action is logged in the platform audit trail.
          </Text>
        </View>

        {/* Reason */}
        <Text style={styles.label}>Reason for deletion *</Text>
        <TextInput
          style={styles.reasonInput}
          value={reason}
          onChangeText={onReasonChange}
          multiline
          numberOfLines={4}
          placeholder="Provide a reason (required for audit log)…"
          placeholderTextColor="#999"
          testID="delete-reason-input"
          accessibilityLabel="Deletion reason"
        />

        {/* Confirmation checkbox */}
        <Pressable
          onPress={() => setConfirmed((c) => !c)}
          style={styles.confirmRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
          testID="delete-confirm-checkbox"
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.confirmLabel}>
            I understand this action cannot be undone.
          </Text>
        </Pressable>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && (
          <Text style={styles.successText}>Client deleted and audit entry recorded.</Text>
        )}

        <Pressable
          onPress={onDelete}
          disabled={!canSubmit}
          style={[styles.deleteBtn, !canSubmit && styles.deleteBtnDisabled]}
          accessibilityRole="button"
          testID="delete-submit-btn"
        >
          <Text style={styles.deleteBtnText}>
            {submitting ? "Deleting…" : "Delete Client Permanently"}
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
  title: { fontFamily: brandTypography.semibold, fontSize: 22, color: "#CC0000" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  warningBox: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#CC0000",
    marginBottom: 20,
  },
  warningTitle: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#B71C1C", marginBottom: 8 },
  warningBody: { fontFamily: brandTypography.regular, fontSize: 14, color: "#444", lineHeight: 22 },
  warningName: { fontWeight: "700", color: "#B71C1C" },
  label: { fontFamily: brandTypography.regular, fontSize: 12, color: "#888", marginBottom: 6 },
  reasonInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#DDD",
    fontFamily: brandTypography.regular, fontSize: 14,
    marginBottom: 16,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#CCCCCC",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: { backgroundColor: "#CC0000", borderColor: "#CC0000" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  confirmLabel: { fontFamily: brandTypography.regular, fontSize: 14, flex: 1, color: "#444" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#CC0000", marginBottom: 12 },
  successText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#2E7D32", marginBottom: 12 },
  deleteBtn: {
    backgroundColor: "#CC0000",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteBtnDisabled: { backgroundColor: "#CCCCCC" },
  deleteBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#FFFFFF" },
});
