/**
 * W43 — BlockTimeScreen
 *
 * Creates a blocked time slot (hold) for a staff member on a given date.
 * Blocked slots appear on the master calendar and prevent bookings from
 * being made in that window.
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
import type { StaffOption } from "./ManualBookingScreen";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BlockTimeScreenProps = {
  staffOptions: StaffOption[];
  selectedStaffId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  submitting: boolean;
  formError: string | null;
  submitError: string | null;
  submitSuccess: string | null;
  onStaffChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onStartTimeChange: (v: string) => void;
  onEndTimeChange: (v: string) => void;
  onReasonChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BlockTimeScreen({
  staffOptions,
  selectedStaffId,
  date,
  startTime,
  endTime,
  reason,
  submitting,
  formError,
  submitError,
  submitSuccess,
  onStaffChange,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onReasonChange,
  onSubmit,
  onBack,
  testID = "block-time-screen",
}: BlockTimeScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable accessibilityRole="button" onPress={onBack}>
        <Text style={styles.back}>‹ Block Time</Text>
      </Pressable>
      <Text style={styles.title}>Block Time Slot</Text>
      <Text style={styles.subtitle}>
        Blocked slots prevent bookings during the specified window and appear on
        the master calendar.
      </Text>

      {/* Staff */}
      <View style={styles.card}>
        <Text style={styles.label}>Staff member *</Text>
        <View style={styles.optionList} testID="staff-option-list">
          {staffOptions.map((s) => (
            <Pressable
              key={s.staffId}
              accessibilityRole="button"
              onPress={() => onStaffChange(s.staffId)}
              style={[
                styles.optionRow,
                selectedStaffId === s.staffId ? styles.optionRowSelected : null,
              ]}
              testID={`staff-option-${s.staffId}`}
            >
              <Text style={styles.optionLabel}>{s.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Date / time */}
      <View style={styles.card}>
        <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={onDateChange}
          placeholder="2026-05-10"
          testID="date-input"
        />
        <Text style={[styles.label, styles.labelTop]}>Start time (HH:mm) *</Text>
        <TextInput
          style={styles.input}
          value={startTime}
          onChangeText={onStartTimeChange}
          placeholder="14:00"
          testID="start-time-input"
        />
        <Text style={[styles.label, styles.labelTop]}>End time (HH:mm) *</Text>
        <TextInput
          style={styles.input}
          value={endTime}
          onChangeText={onEndTimeChange}
          placeholder="15:00"
          testID="end-time-input"
        />
      </View>

      {/* Reason */}
      <View style={styles.card}>
        <Text style={styles.label}>Reason *</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={reason}
          onChangeText={onReasonChange}
          multiline
          placeholder="Team meeting, staff break, cleaning…"
          testID="reason-input"
        />
      </View>

      {formError ? (
        <View style={styles.errorCard} testID="form-error">
          <Text style={styles.errorText}>{formError}</Text>
        </View>
      ) : null}
      {submitError ? (
        <View style={styles.errorCard} testID="submit-error">
          <Text style={styles.errorText}>{submitError}</Text>
        </View>
      ) : null}
      {submitSuccess ? (
        <View style={styles.successCard} testID="submit-success">
          <Text style={styles.successText}>{submitSuccess}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={submitting}
        onPress={onSubmit}
        style={[styles.submitBtn, submitting ? styles.submitBtnDisabled : null]}
        testID="submit-btn"
      >
        <Text style={styles.submitBtnLabel}>
          {submitting ? "Blocking slot…" : "Block slot"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 40 },
  back: {
    fontSize: 14,
    color: "#6B6B6B",
    fontFamily: brandTypography.regular,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    color: "#1A1A1A",
    fontFamily: brandTypography.medium,
  },
  labelTop: { marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
    backgroundColor: "#FFFFFF",
  },
  inputMulti: { height: 80, textAlignVertical: "top" },
  optionList: { marginTop: 8, gap: 4 },
  optionRow: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
  },
  optionRowSelected: { borderColor: "#6B21A8", backgroundColor: "#F5F3FF" },
  optionLabel: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
  },
  errorCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#DC2626",
  },
  successCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#15803D",
  },
  submitBtn: {
    backgroundColor: "#6B21A8",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#FFFFFF",
  },
});
