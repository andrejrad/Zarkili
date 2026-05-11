/**
 * W46 — WaitlistConvertScreen
 *
 * Convert a waitlist entry into a confirmed booking.
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

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { WaitlistAdminEntry } from "../../domains/waitlist/waitlistAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type WaitlistConvertScreenProps = {
  loading: boolean;
  error: string | null;
  entry: WaitlistAdminEntry | null;
  staffId: string;
  date: string;
  startTime: string;
  durationMinutes: string;
  notes: string;
  submitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  onStaffIdChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function WaitlistConvertScreen({
  loading,
  error,
  entry,
  staffId,
  date,
  startTime,
  durationMinutes,
  notes,
  submitting,
  submitError,
  submitSuccess,
  onStaffIdChange,
  onDateChange,
  onStartTimeChange,
  onDurationChange,
  onNotesChange,
  onSubmit,
  onRetry,
  onBack,
  testID = "waitlist-convert-screen",
}: WaitlistConvertScreenProps) {
  const canSubmit =
    staffId.trim().length > 0 &&
    date.trim().length > 0 &&
    startTime.trim().length > 0 &&
    durationMinutes.trim().length > 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Convert to Booking</Text>
      </View>

      {loading ? <AdminLoadingState label="Loading entry…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {entry ? (
        <View style={styles.entryCard} testID="entry-card">
          <Text style={styles.clientName}>{entry.clientName}</Text>
          <Text style={styles.serviceName}>{entry.serviceName}</Text>
          <Text style={styles.dateRange}>
            {entry.preferredDateFrom} → {entry.preferredDateTo} • {entry.preferredTime}
          </Text>
        </View>
      ) : null}

      {!loading && !error ? (
        <View style={styles.form}>
          <Text style={styles.sectionLabel}>Staff ID</Text>
          <TextInput
            value={staffId}
            onChangeText={onStaffIdChange}
            placeholder="staff-id"
            style={styles.input}
            testID="staff-id-input"
            accessibilityLabel="Staff ID"
          />

          <Text style={styles.sectionLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput
            value={date}
            onChangeText={onDateChange}
            placeholder="2025-06-01"
            style={styles.input}
            testID="date-input"
            accessibilityLabel="Booking date"
          />

          <Text style={styles.sectionLabel}>Start Time (HH:mm)</Text>
          <TextInput
            value={startTime}
            onChangeText={onStartTimeChange}
            placeholder="10:00"
            style={styles.input}
            testID="start-time-input"
            accessibilityLabel="Start time"
          />

          <Text style={styles.sectionLabel}>Duration (minutes)</Text>
          <TextInput
            value={durationMinutes}
            onChangeText={onDurationChange}
            placeholder="60"
            keyboardType="number-pad"
            style={styles.input}
            testID="duration-input"
            accessibilityLabel="Duration in minutes"
          />

          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={onNotesChange}
            placeholder="Optional booking notes…"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
            testID="notes-input"
            accessibilityLabel="Notes"
          />

          {submitError ? (
            <Text style={styles.errorText} testID="submit-error">{submitError}</Text>
          ) : null}
          {submitSuccess ? (
            <Text style={styles.successText} testID="submit-success">Booking created.</Text>
          ) : null}

          <Pressable
            onPress={onSubmit}
            disabled={submitting || !canSubmit}
            accessibilityRole="button"
            testID="convert-btn"
            style={[styles.convertBtn, (submitting || !canSubmit) && styles.convertBtnDisabled]}
          >
            <Text style={styles.convertBtnText}>
              {submitting ? "Converting…" : "Convert to Booking"}
            </Text>
          </Pressable>
        </View>
      ) : null}
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
  entryCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, gap: 4 },
  clientName: { fontFamily: brandTypography.semibold, fontSize: 16, color: "#1A1A1A" },
  serviceName: { fontFamily: brandTypography.regular, fontSize: 14, color: "#4B4B4B" },
  dateRange: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6B6B6B" },
  form: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 16, gap: 12 },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#6B6B6B" },
  input: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 10,
    fontFamily: brandTypography.regular,
    fontSize: 14,
    color: "#1A1A1A",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#DC2626" },
  successText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#16A34A" },
  convertBtn: { backgroundColor: "#1A1A1A", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  convertBtnDisabled: { backgroundColor: "#D1D5DB" },
  convertBtnText: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#FFFFFF" },
});
