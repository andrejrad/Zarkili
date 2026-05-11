/**
 * W43 — NoShowMarkScreen
 *
 * Confirms marking a booking as no-show.  Admin may add an optional policy
 * note for the customer and toggle whether a no-show penalty is applied.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NoShowBookingSummary = {
  bookingId: string;
  customerName: string;
  serviceName: string;
  date: string;
  startTime: string;
};

export type NoShowMarkScreenProps = {
  booking: NoShowBookingSummary | null;
  policyNote: string;
  penaltyApplied: boolean;
  submitting: boolean;
  submitError: string | null;
  submitSuccess: string | null;
  onPolicyNoteChange: (v: string) => void;
  onPenaltyToggle: (v: boolean) => void;
  onConfirm: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NoShowMarkScreen({
  booking,
  policyNote,
  penaltyApplied,
  submitting,
  submitError,
  submitSuccess,
  onPolicyNoteChange,
  onPenaltyToggle,
  onConfirm,
  onBack,
  testID = "no-show-mark-screen",
}: NoShowMarkScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable accessibilityRole="button" onPress={onBack}>
        <Text style={styles.back}>‹ No-Show</Text>
      </Pressable>
      <Text style={styles.title}>Mark No-Show</Text>

      {booking ? (
        <View style={styles.card} testID="booking-summary">
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{booking.customerName}</Text>
          <Text style={styles.label}>Service</Text>
          <Text style={styles.value}>{booking.serviceName}</Text>
          <Text style={styles.label}>Date / time</Text>
          <Text style={styles.value}>
            {booking.date} · {booking.startTime}
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Policy note (optional)</Text>
        <Text style={styles.hint}>
          This note will be stored on the booking record and may be used to
          notify the customer or update their account standing.
        </Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={policyNote}
          onChangeText={onPolicyNoteChange}
          multiline
          placeholder="First no-show; warning issued…"
          testID="policy-note-input"
        />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Apply no-show penalty</Text>
            <Text style={styles.toggleHint}>
              Charges the no-show fee configured in booking rules.
            </Text>
          </View>
          <Switch
            value={penaltyApplied}
            onValueChange={onPenaltyToggle}
            testID="penalty-toggle"
            trackColor={{ false: "#D1D5DB", true: "#6B21A8" }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

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
        onPress={onConfirm}
        style={[
          styles.confirmBtn,
          submitting ? styles.confirmBtnDisabled : null,
        ]}
        testID="confirm-btn"
      >
        <Text style={styles.confirmBtnLabel}>
          {submitting ? "Marking no-show…" : "Mark as no-show"}
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
    color: "#6B6B6B",
    fontFamily: brandTypography.medium,
    marginTop: 6,
  },
  value: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
    marginTop: 2,
  },
  hint: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#9CA3AF",
    marginTop: 2,
    marginBottom: 8,
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#1A1A1A",
  },
  toggleHint: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
    marginTop: 2,
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
  confirmBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#FFFFFF",
  },
});
