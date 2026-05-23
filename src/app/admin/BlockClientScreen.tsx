/**
 * W44 — BlockClientScreen
 *
 * Admin form to block a client. Reason radio group (noShow / harassment /
 * payment / other) and duration selector. Submits to blockClient service.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { BlockClientReason } from "../../domains/clients/clientCrmModel";

import { AdminErrorState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BlockClientScreenProps = {
  clientName: string;
  reason: BlockClientReason;
  durationDays: number | null; // null = permanent
  submitting: boolean;
  error: string | null;
  success: boolean;
  onReasonChange: (r: BlockClientReason) => void;
  onDurationChange: (days: number | null) => void;
  onBlock: () => void;
  onBack: () => void;
  testID?: string;
};

const REASON_OPTIONS: { value: BlockClientReason; label: string }[] = [
  { value: "no_show", label: "No-show" },
  { value: "harassment", label: "Harassment" },
  { value: "payment", label: "Payment issue" },
  { value: "other", label: "Other" },
];

const DURATION_OPTIONS: { days: number | null; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: null, label: "Permanent" },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function BlockClientScreen({
  clientName,
  reason,
  durationDays,
  submitting,
  error,
  success,
  onReasonChange,
  onDurationChange,
  onBlock,
  onBack,
  testID = "block-client-screen",
}: BlockClientScreenProps) {
  if (error && !submitting && !success) {
    return <AdminErrorState message={error} onRetry={onBack} />;
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Block Client</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.clientLabel}>Blocking: {clientName}</Text>

        {/* Reason */}
        <Text style={styles.sectionLabel}>Reason *</Text>
        <View style={styles.reasonGroup} testID="reason-selector">
          {REASON_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => onReasonChange(opt.value)}
              style={[styles.radioRow, reason === opt.value && styles.radioRowActive]}
              testID={`reason-${opt.value.replace("_", "")}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: reason === opt.value }}
            >
              <View style={[styles.radioCircle, reason === opt.value && styles.radioCircleActive]} />
              <Text style={styles.radioLabel}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Duration */}
        <Text style={styles.sectionLabel}>Duration</Text>
        <View style={styles.durationGroup} testID="duration-selector">
          {DURATION_OPTIONS.map((opt) => (
            <Pressable
              key={String(opt.days)}
              onPress={() => onDurationChange(opt.days)}
              style={[
                styles.durationChip,
                durationDays === opt.days && styles.durationChipActive,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: durationDays === opt.days }}
            >
              <Text
                style={[
                  styles.durationChipText,
                  durationDays === opt.days && styles.durationChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>Client blocked successfully.</Text>}

        <Pressable
          onPress={onBlock}
          disabled={submitting}
          style={[styles.blockBtn, submitting && styles.blockBtnDisabled]}
          accessibilityRole="button"
          testID="block-btn"
        >
          <Text style={styles.blockBtnText}>{submitting ? "Blocking…" : "Block Client"}</Text>
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
  clientLabel: { fontFamily: brandTypography.semibold, fontSize: 14, marginBottom: 20 },
  sectionLabel: { fontFamily: brandTypography.regular, fontSize: 12, color: "#888", marginBottom: 8, marginTop: 16 },
  reasonGroup: { gap: 8 },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  radioRowActive: { borderColor: "#6B4EFF", backgroundColor: "#F0EDFF" },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CCCCCC",
  },
  radioCircleActive: { borderColor: "#6B4EFF", backgroundColor: "#6B4EFF" },
  radioLabel: { fontFamily: brandTypography.regular, fontSize: 14 },
  durationGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#CCCCCC",
    backgroundColor: "#FFFFFF",
  },
  durationChipActive: { borderColor: "#6B4EFF", backgroundColor: "#6B4EFF" },
  durationChipText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#444" },
  durationChipTextActive: { color: "#FFFFFF" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#CC0000", marginTop: 12 },
  successText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#2E7D32", marginTop: 12 },
  blockBtn: {
    marginTop: 24,
    backgroundColor: "#CC0000",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  blockBtnDisabled: { backgroundColor: "#CCCCCC" },
  blockBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#FFFFFF" },
});
