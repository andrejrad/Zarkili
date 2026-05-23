/**
 * W43 — ForceBookScreen
 *
 * Override / force-book — bypasses slot-engine conflict checks.
 * A non-empty override reason is required and is written to the audit log
 * so the decision is always traceable.
 *
 * Same fields as ManualBookingScreen plus overrideReason.
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

import type { StaffOption, ServiceOption } from "./ManualBookingScreen";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ForceBookScreenProps = {
  staffOptions: StaffOption[];
  serviceOptions: ServiceOption[];
  selectedStaffId: string;
  selectedServiceId: string;
  customerUserId: string;
  date: string;
  startTime: string;
  durationMinutes: string;
  overrideReason: string;
  submitting: boolean;
  formError: string | null;
  submitError: string | null;
  submitSuccess: string | null;
  onStaffChange: (v: string) => void;
  onServiceChange: (v: string) => void;
  onCustomerUserIdChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onStartTimeChange: (v: string) => void;
  onDurationChange: (v: string) => void;
  onOverrideReasonChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ForceBookScreen({
  staffOptions,
  serviceOptions,
  selectedStaffId,
  selectedServiceId,
  customerUserId,
  date,
  startTime,
  durationMinutes,
  overrideReason,
  submitting,
  formError,
  submitError,
  submitSuccess,
  onStaffChange,
  onServiceChange,
  onCustomerUserIdChange,
  onDateChange,
  onStartTimeChange,
  onDurationChange,
  onOverrideReasonChange,
  onSubmit,
  onBack,
  testID = "force-book-screen",
}: ForceBookScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable accessibilityRole="button" onPress={onBack}>
        <Text style={styles.back}>‹ Force Book</Text>
      </Pressable>
      <Text style={styles.title}>Force Book</Text>
      <View style={styles.warningCard} testID="force-book-warning">
        <Text style={styles.warningText}>
          Force booking overrides slot availability. The reason you provide will
          be recorded in the booking audit log.
        </Text>
      </View>

      {/* Staff & service */}
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

        <Text style={[styles.label, styles.labelTop]}>Service *</Text>
        <View style={styles.optionList} testID="service-option-list">
          {serviceOptions.map((sv) => (
            <Pressable
              key={sv.serviceId}
              accessibilityRole="button"
              onPress={() => onServiceChange(sv.serviceId)}
              style={[
                styles.optionRow,
                selectedServiceId === sv.serviceId
                  ? styles.optionRowSelected
                  : null,
              ]}
              testID={`service-option-${sv.serviceId}`}
            >
              <Text style={styles.optionLabel}>{sv.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Customer */}
      <View style={styles.card}>
        <Text style={styles.label}>Customer user ID *</Text>
        <TextInput
          style={styles.input}
          value={customerUserId}
          onChangeText={onCustomerUserIdChange}
          placeholder="uid_abc123"
          testID="customer-uid-input"
        />
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
          placeholder="10:00"
          testID="start-time-input"
        />
        <Text style={[styles.label, styles.labelTop]}>Duration (minutes) *</Text>
        <TextInput
          style={styles.input}
          value={durationMinutes}
          onChangeText={onDurationChange}
          keyboardType="numeric"
          placeholder="45"
          testID="duration-input"
        />
      </View>

      {/* Override reason */}
      <View style={styles.card}>
        <Text style={styles.label}>Override reason * (required for audit)</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={overrideReason}
          onChangeText={onOverrideReasonChange}
          multiline
          placeholder="Explain why slot conflict is being overridden…"
          testID="override-reason-input"
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
          {submitting ? "Force booking…" : "Force book"}
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
    marginBottom: 12,
  },
  warningCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#92400E",
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
    backgroundColor: "#DC2626",
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
