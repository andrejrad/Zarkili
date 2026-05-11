/**
 * W43 — ManualBookingScreen
 *
 * Creates a phone-in or walk-in booking on behalf of a customer.
 * Collects channel, staff, service, date/time, and customer info inline.
 * Slot conflict checking happens server-side; the form submits optimistically.
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
import type { ManualBookingChannel } from "../../domains/bookings/bookingOpsModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StaffOption = { staffId: string; name: string };
export type ServiceOption = { serviceId: string; name: string };

export type ManualBookingScreenProps = {
  staffOptions: StaffOption[];
  serviceOptions: ServiceOption[];
  channel: ManualBookingChannel;
  selectedStaffId: string;
  selectedServiceId: string;
  date: string;
  startTime: string;
  durationMinutes: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  submitting: boolean;
  formError: string | null;
  submitError: string | null;
  submitSuccess: string | null;
  onChannelChange: (v: ManualBookingChannel) => void;
  onStaffChange: (v: string) => void;
  onServiceChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onStartTimeChange: (v: string) => void;
  onDurationChange: (v: string) => void;
  onCustomerNameChange: (v: string) => void;
  onCustomerPhoneChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ManualBookingScreen({
  staffOptions,
  serviceOptions,
  channel,
  selectedStaffId,
  selectedServiceId,
  date,
  startTime,
  durationMinutes,
  customerName,
  customerPhone,
  notes,
  submitting,
  formError,
  submitError,
  submitSuccess,
  onChannelChange,
  onStaffChange,
  onServiceChange,
  onDateChange,
  onStartTimeChange,
  onDurationChange,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onNotesChange,
  onSubmit,
  onBack,
  testID = "manual-booking-screen",
}: ManualBookingScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable accessibilityRole="button" onPress={onBack}>
        <Text style={styles.back}>‹ Manual Booking</Text>
      </Pressable>
      <Text style={styles.title}>New Manual Booking</Text>

      {/* Channel */}
      <View style={styles.card}>
        <Text style={styles.label}>Booking channel *</Text>
        <View style={styles.channelRow} testID="channel-selector">
          <Pressable
            accessibilityRole="button"
            onPress={() => onChannelChange("phone_in")}
            style={[
              styles.channelBtn,
              channel === "phone_in" ? styles.channelBtnActive : null,
            ]}
            testID="channel-phone"
          >
            <Text
              style={[
                styles.channelBtnLabel,
                channel === "phone_in" ? styles.channelBtnLabelActive : null,
              ]}
            >
              Phone-in
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onChannelChange("walk_in")}
            style={[
              styles.channelBtn,
              channel === "walk_in" ? styles.channelBtnActive : null,
            ]}
            testID="channel-walkin"
          >
            <Text
              style={[
                styles.channelBtnLabel,
                channel === "walk_in" ? styles.channelBtnLabelActive : null,
              ]}
            >
              Walk-in
            </Text>
          </Pressable>
        </View>
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

      {/* Customer */}
      <View style={styles.card}>
        <Text style={styles.label}>Customer name *</Text>
        <TextInput
          style={styles.input}
          value={customerName}
          onChangeText={onCustomerNameChange}
          placeholder="Jane Smith"
          testID="customer-name-input"
        />
        <Text style={[styles.label, styles.labelTop]}>Phone (optional)</Text>
        <TextInput
          style={styles.input}
          value={customerPhone}
          onChangeText={onCustomerPhoneChange}
          keyboardType="phone-pad"
          placeholder="+1 555 000 0000"
          testID="customer-phone-input"
        />
        <Text style={[styles.label, styles.labelTop]}>Notes</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={notes}
          onChangeText={onNotesChange}
          multiline
          placeholder="Any relevant notes…"
          testID="notes-input"
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
          {submitting ? "Creating booking…" : "Create booking"}
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
  channelRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  channelBtn: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  channelBtnActive: { backgroundColor: "#6B21A8", borderColor: "#6B21A8" },
  channelBtnLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#6B6B6B",
  },
  channelBtnLabelActive: { color: "#FFFFFF" },
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
