/**
 * W43 — CancellationAdminScreen
 *
 * Admin-initiated booking cancellation.  Requires a cancellation reason and
 * optionally records a cancellation fee (cents + currency).
 * The reason and fee are written to the booking audit log.
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

import type { NoShowBookingSummary } from "./NoShowMarkScreen";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CancellationAdminScreenProps = {
  booking: NoShowBookingSummary | null; // reuse same compact summary shape
  reason: string;
  feeAmount: string; // string so TextInput stays controlled
  feeCurrency: string;
  submitting: boolean;
  formError: string | null;
  submitError: string | null;
  submitSuccess: string | null;
  onReasonChange: (v: string) => void;
  onFeeAmountChange: (v: string) => void;
  onFeeCurrencyChange: (v: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CancellationAdminScreen({
  booking,
  reason,
  feeAmount,
  feeCurrency,
  submitting,
  formError,
  submitError,
  submitSuccess,
  onReasonChange,
  onFeeAmountChange,
  onFeeCurrencyChange,
  onConfirm,
  onBack,
  testID = "cancellation-admin-screen",
}: CancellationAdminScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable accessibilityRole="button" onPress={onBack}>
        <Text style={styles.back}>‹ Cancel Booking</Text>
      </Pressable>
      <Text style={styles.title}>Cancel Booking</Text>

      {booking ? (
        <View style={styles.card} testID="booking-summary">
          <Text style={styles.rowLabel}>Customer</Text>
          <Text style={styles.rowValue}>{booking.customerName}</Text>
          <Text style={styles.rowLabel}>Service</Text>
          <Text style={styles.rowValue}>{booking.serviceName}</Text>
          <Text style={styles.rowLabel}>Date / time</Text>
          <Text style={styles.rowValue}>
            {booking.date} · {booking.startTime}
          </Text>
        </View>
      ) : null}

      {/* Reason */}
      <View style={styles.card}>
        <Text style={styles.label}>Cancellation reason *</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={reason}
          onChangeText={onReasonChange}
          multiline
          placeholder="Customer requested, illness, slot no longer available…"
          testID="reason-input"
        />
      </View>

      {/* Fee */}
      <View style={styles.card}>
        <Text style={styles.label}>Cancellation fee (leave 0 for no fee)</Text>
        <View style={styles.feeRow}>
          <TextInput
            style={[styles.input, styles.feeAmount]}
            value={feeAmount}
            onChangeText={onFeeAmountChange}
            keyboardType="numeric"
            placeholder="0"
            testID="fee-amount-input"
          />
          <TextInput
            style={[styles.input, styles.feeCurrency]}
            value={feeCurrency}
            onChangeText={onFeeCurrencyChange}
            placeholder="USD"
            autoCapitalize="characters"
            maxLength={3}
            testID="fee-currency-input"
          />
        </View>
        <Text style={styles.hint}>
          Enter the fee in whole currency units (e.g. 25 for $25.00). The amount
          is stored in cents internally.
        </Text>
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
        onPress={onConfirm}
        style={[
          styles.confirmBtn,
          submitting ? styles.confirmBtnDisabled : null,
        ]}
        testID="confirm-btn"
      >
        <Text style={styles.confirmBtnLabel}>
          {submitting ? "Cancelling booking…" : "Cancel booking"}
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
  hint: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#9CA3AF",
    marginTop: 6,
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
  feeRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  feeAmount: { flex: 3 },
  feeCurrency: { flex: 1 },
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
