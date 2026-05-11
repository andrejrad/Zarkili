/**
 * W43 — RescheduleAdminScreen
 *
 * Admin reschedule (rebook on behalf of client).  Collects new date/time,
 * shows available slots for the selected date (slot-engine powered), surfaces
 * any conflicts, and allows an optional reschedule reason.
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
import type { SlotConflict, ConflictResolutionOption } from "../../domains/bookings/bookingOpsModel";
import type { AvailableSlot } from "../../domains/bookings/slotEngine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RescheduleBookingSummary = {
  bookingId: string;
  customerName: string;
  serviceName: string;
};

export type RescheduleAdminScreenProps = {
  booking: RescheduleBookingSummary | null;
  staffOptions: { staffId: string; name: string }[];
  selectedStaffId: string;
  newDate: string;
  availableSlots: AvailableSlot[];
  selectedStartTime: string;
  rescheduleReason: string;
  conflicts: SlotConflict[];
  conflictOptions: ConflictResolutionOption[];
  slotsLoading: boolean;
  submitting: boolean;
  formError: string | null;
  submitError: string | null;
  submitSuccess: string | null;
  onStaffChange: (v: string) => void;
  onNewDateChange: (v: string) => void;
  onLoadSlots: () => void;
  onSelectSlot: (startTime: string) => void;
  onRescheduleReasonChange: (v: string) => void;
  onSelectConflictStrategy: (strategy: ConflictResolutionOption["strategy"]) => void;
  onSubmit: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RescheduleAdminScreen({
  booking,
  staffOptions,
  selectedStaffId,
  newDate,
  availableSlots,
  selectedStartTime,
  rescheduleReason,
  conflicts,
  conflictOptions,
  slotsLoading,
  submitting,
  formError,
  submitError,
  submitSuccess,
  onStaffChange,
  onNewDateChange,
  onLoadSlots,
  onSelectSlot,
  onRescheduleReasonChange,
  onSelectConflictStrategy,
  onSubmit,
  onBack,
  testID = "reschedule-admin-screen",
}: RescheduleAdminScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable accessibilityRole="button" onPress={onBack}>
        <Text style={styles.back}>‹ Reschedule</Text>
      </Pressable>
      <Text style={styles.title}>Reschedule Booking</Text>

      {/* Booking summary */}
      {booking ? (
        <View style={styles.card} testID="booking-summary">
          <Text style={styles.rowLabel}>Customer</Text>
          <Text style={styles.rowValue}>{booking.customerName}</Text>
          <Text style={styles.rowLabel}>Service</Text>
          <Text style={styles.rowValue}>{booking.serviceName}</Text>
        </View>
      ) : null}

      {/* Staff selection */}
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

      {/* New date + slot picker */}
      <View style={styles.card}>
        <Text style={styles.label}>New date (YYYY-MM-DD) *</Text>
        <TextInput
          style={styles.input}
          value={newDate}
          onChangeText={onNewDateChange}
          placeholder="2026-05-12"
          testID="new-date-input"
        />
        <Pressable
          accessibilityRole="button"
          onPress={onLoadSlots}
          style={styles.loadSlotsBtn}
          testID="load-slots-btn"
        >
          <Text style={styles.loadSlotsBtnLabel}>
            {slotsLoading ? "Loading slots…" : "Load available slots"}
          </Text>
        </Pressable>

        {availableSlots.length > 0 ? (
          <View testID="available-slots">
            <Text style={[styles.label, styles.labelTop]}>
              Available slots — select one *
            </Text>
            <View style={styles.slotGrid}>
              {availableSlots.map((slot) => (
                <Pressable
                  key={slot.startTime}
                  accessibilityRole="button"
                  onPress={() => onSelectSlot(slot.startTime)}
                  style={[
                    styles.slotChip,
                    selectedStartTime === slot.startTime
                      ? styles.slotChipSelected
                      : null,
                  ]}
                  testID={`slot-chip-${slot.startTime}`}
                >
                  <Text
                    style={[
                      styles.slotChipLabel,
                      selectedStartTime === slot.startTime
                        ? styles.slotChipLabelSelected
                        : null,
                    ]}
                  >
                    {slot.startTime}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* Conflicts */}
      {conflicts.length > 0 ? (
        <View style={styles.conflictCard} testID="conflict-section">
          <Text style={styles.conflictTitle}>
            ⚠ Slot conflict ({conflicts.length} booking
            {conflicts.length > 1 ? "s" : ""})
          </Text>
          {conflictOptions.map((opt) => (
            <Pressable
              key={opt.strategy}
              accessibilityRole="button"
              onPress={() => onSelectConflictStrategy(opt.strategy)}
              style={styles.conflictOption}
              testID={`conflict-option-${opt.strategy}`}
            >
              <Text style={styles.conflictOptionLabel}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Reason */}
      <View style={styles.card}>
        <Text style={styles.label}>Reason for reschedule (optional)</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={rescheduleReason}
          onChangeText={onRescheduleReasonChange}
          multiline
          placeholder="Client requested earlier time, staff availability change…"
          testID="reschedule-reason-input"
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
          {submitting ? "Rescheduling…" : "Confirm reschedule"}
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
  rowLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#6B6B6B",
    fontFamily: brandTypography.medium,
    marginTop: 6,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
    marginTop: 2,
  },
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
  loadSlotsBtn: {
    borderWidth: 1,
    borderColor: "#6B21A8",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 10,
  },
  loadSlotsBtnLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#6B21A8",
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  slotChip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  slotChipSelected: { borderColor: "#6B21A8", backgroundColor: "#F5F3FF" },
  slotChipLabel: {
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#6B6B6B",
  },
  slotChipLabelSelected: { color: "#6B21A8" },
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
  conflictCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  conflictTitle: {
    fontSize: 14,
    fontFamily: brandTypography.semibold,
    color: "#92400E",
    marginBottom: 10,
  },
  conflictOption: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  conflictOptionLabel: {
    fontSize: 13,
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
