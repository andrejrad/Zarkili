/**
 * W46 — ThreadAssignScreen
 *
 * Pick a staff member to assign an inbox thread to.
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
import type { AdminThread } from "../../domains/messaging/messagingAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type StaffOption = {
  staffId: string;
  displayName: string;
};

export type ThreadAssignScreenProps = {
  loading: boolean;
  error: string | null;
  thread: AdminThread | null;
  staffOptions: StaffOption[];
  selectedStaffId: string | null;
  onSelectStaff: (staffId: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ThreadAssignScreen({
  loading,
  error,
  thread,
  staffOptions,
  selectedStaffId,
  onSelectStaff,
  onSubmit,
  submitting,
  submitError,
  submitSuccess,
  onRetry,
  onBack,
  testID = "thread-assign-screen",
}: ThreadAssignScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Assign Thread</Text>
      </View>

      {loading ? <AdminLoadingState label="Loading…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {thread ? (
        <View style={styles.threadCard} testID="thread-card">
          <Text style={styles.clientName}>{thread.clientName}</Text>
          {thread.subject ? <Text style={styles.subject}>{thread.subject}</Text> : null}
          <Text style={styles.preview} numberOfLines={2}>{thread.lastMessage}</Text>
          {thread.assignedStaffName ? (
            <Text style={styles.currentAssign} testID="current-assign">
              Currently assigned to: {thread.assignedStaffName}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Select Staff Member</Text>
      {staffOptions.map((staff) => (
        <Pressable
          key={staff.staffId}
          onPress={() => onSelectStaff(staff.staffId)}
          testID={`staff-${staff.staffId}`}
          style={[styles.staffRow, selectedStaffId === staff.staffId && styles.staffRowSelected]}
          accessibilityRole="button"
        >
          <View style={[styles.radioOuter, selectedStaffId === staff.staffId && styles.radioOuterSelected]}>
            {selectedStaffId === staff.staffId ? <View style={styles.radioInner} /> : null}
          </View>
          <Text style={styles.staffName}>{staff.displayName}</Text>
        </Pressable>
      ))}

      {submitError ? <Text style={styles.errorText} testID="submit-error">{submitError}</Text> : null}
      {submitSuccess ? (
        <Text style={styles.successText} testID="submit-success">Thread assigned.</Text>
      ) : null}

      <Pressable
        onPress={onSubmit}
        disabled={submitting || !selectedStaffId}
        accessibilityRole="button"
        testID="assign-btn"
        style={[styles.assignBtn, (submitting || !selectedStaffId) && styles.assignBtnDisabled]}
      >
        <Text style={styles.assignBtnText}>{submitting ? "Assigning…" : "Assign"}</Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14, backgroundColor: "#F2EDDD" },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { paddingVertical: 4 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6B6B6B" },
  title: { fontFamily: brandTypography.semibold, fontSize: 20, color: "#1A1A1A" },
  threadCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, gap: 6 },
  clientName: { fontFamily: brandTypography.semibold, fontSize: 16, color: "#1A1A1A" },
  subject: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#4B4B4B" },
  preview: { fontFamily: brandTypography.regular, fontSize: 13, color: "#6B6B6B" },
  currentAssign: { fontFamily: brandTypography.regular, fontSize: 12, color: "#9CA3AF" },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#6B6B6B" },
  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
  },
  staffRowSelected: { borderWidth: 2, borderColor: "#1A1A1A" },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: "#1A1A1A" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1A1A1A" },
  staffName: { fontFamily: brandTypography.regular, fontSize: 15, color: "#1A1A1A" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#DC2626" },
  successText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#16A34A" },
  assignBtn: { backgroundColor: "#1A1A1A", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  assignBtnDisabled: { backgroundColor: "#D1D5DB" },
  assignBtnText: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#FFFFFF" },
});
