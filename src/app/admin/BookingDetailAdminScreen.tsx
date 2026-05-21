/**
 * W43 — BookingDetailAdminScreen
 *
 * Admin-side view of a single booking: summary card, customer history,
 * ordered lifecycle audit trail, and action buttons for status transitions
 * (confirm, reschedule, no-show, force-book, cancel).
 */
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { AdminBookingDetailView } from "../../domains/bookings/bookingOpsModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BookingDetailAdminScreenProps = {
  loading: boolean;
  error: string | null;
  detail: AdminBookingDetailView | null;
  submitting: boolean;
  actionError: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  onMarkNoShow: () => void;
  onForceBook: () => void;
  onFinalizePayment?: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BookingDetailAdminScreen({
  loading,
  error,
  detail,
  submitting,
  actionError,
  onConfirm,
  onCancel,
  onReschedule,
  onMarkNoShow,
  onForceBook,
  onFinalizePayment,
  onRetry,
  onBack,
  testID = "booking-detail-admin-screen",
}: BookingDetailAdminScreenProps) {
  if (loading) return <AdminLoadingState label="Loading booking…" />;
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;

  const b = detail?.booking ?? null;

  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable accessibilityRole="button" onPress={onBack}>
        <Text style={styles.back}>‹ Booking Detail</Text>
      </Pressable>

      <Text style={styles.title}>
        Booking {b ? `#${b.bookingId.slice(-6)}` : "—"}
      </Text>

      {/* Summary card */}
      <View style={styles.card} testID="booking-summary-card">
        <Row label="Status" value={b?.status?.replace(/_/g, " ") ?? "—"} />
        <Row
          label="Date / time"
          value={b ? `${b.date} · ${b.startTime}–${b.endTime}` : "—"}
        />
        <Row label="Service" value={detail?.serviceName ?? "—"} />
        <Row label="Staff" value={detail?.staffName ?? "—"} />
        <Row label="Duration" value={b ? `${b.durationMinutes} min` : "—"} />
        <Row label="Notes" value={b?.notes ?? "None"} />
      </View>

      {/* Customer card */}
      <View style={styles.card} testID="booking-customer-card">
        <Text style={styles.sectionTitle}>Customer</Text>
        <Row label="Name" value={detail?.customerName ?? "—"} />
        <Row label="Email" value={detail?.customerEmail ?? "—"} />
        {detail?.customerPhone ? (
          <Row label="Phone" value={detail.customerPhone} />
        ) : null}
        <Row label="Past bookings" value={String(detail?.pastBookingsCount ?? 0)} />
        <Row
          label="Total spend"
          value={
            detail && detail.totalSpendCents > 0
              ? `$${(detail.totalSpendCents / 100).toFixed(2)}`
              : "—"
          }
        />
      </View>

      {/* Action error */}
      {actionError ? (
        <View style={styles.errorCard} testID="action-error">
          <Text style={styles.errorText}>{actionError}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actionsCard} testID="booking-actions">
        <ActionButton
          label="Confirm booking"
          variant="primary"
          disabled={submitting}
          onPress={onConfirm}
          testID="confirm-btn"
        />
        <ActionButton
          label="Reschedule"
          variant="secondary"
          disabled={submitting}
          onPress={onReschedule}
          testID="reschedule-btn"
        />
        <ActionButton
          label="Mark no-show"
          variant="secondary"
          disabled={submitting}
          onPress={onMarkNoShow}
          testID="no-show-btn"
        />
        <ActionButton
          label="Force book"
          variant="secondary"
          disabled={submitting}
          onPress={onForceBook}
          testID="force-book-btn"
        />
        <ActionButton
          label="Cancel booking"
          variant="destructive"
          disabled={submitting}
          onPress={onCancel}
          testID="cancel-booking-btn"
        />
        {onFinalizePayment ? (
          <ActionButton
            label="Finalize payment"
            variant="primary"
            disabled={submitting}
            onPress={onFinalizePayment}
            testID="finalize-payment-btn"
          />
        ) : null}
      </View>

      {/* Lifecycle audit trail */}
      {detail && detail.lifecycleEvents.length > 0 ? (
        <View style={styles.card} testID="lifecycle-audit">
          <Text style={styles.sectionTitle}>Timeline</Text>
          {detail.lifecycleEvents.map((ev, i) => (
            <View key={i} style={styles.auditRow}>
              <View style={styles.auditDot} />
              <View style={styles.auditContent}>
                <Text style={styles.auditStatus}>
                  {ev.status.replace(/_/g, " ")}
                </Text>
                <Text style={styles.auditActor}>by {ev.actor}</Text>
                {ev.reason ? (
                  <Text style={styles.auditReason}>{ev.reason}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </>
  );
}

function ActionButton({
  label,
  variant,
  disabled,
  onPress,
  testID,
}: {
  label: string;
  variant: "primary" | "secondary" | "destructive";
  disabled: boolean;
  onPress: () => void;
  testID: string;
}) {
  const containerStyle =
    variant === "primary"
      ? styles.primaryBtn
      : variant === "destructive"
        ? styles.destructiveBtn
        : styles.secondaryBtn;
  const labelStyle =
    variant === "primary" || variant === "destructive"
      ? styles.invertedBtnLabel
      : styles.secondaryBtnLabel;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[containerStyle, disabled ? styles.btnDisabled : null]}
      testID={testID}
    >
      <Text style={labelStyle}>{label}</Text>
    </Pressable>
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
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: brandTypography.semibold,
    color: "#6B21A8",
    marginBottom: 8,
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
    lineHeight: 20,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
    marginTop: 2,
    textTransform: "capitalize",
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
  actionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: "#6B21A8",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#6B21A8",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  destructiveBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  invertedBtnLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#FFFFFF",
  },
  secondaryBtnLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#6B21A8",
  },
  btnDisabled: { opacity: 0.5 },
  auditRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  auditDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6B21A8",
    marginTop: 4,
    marginRight: 10,
  },
  auditContent: { flex: 1 },
  auditStatus: {
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#1A1A1A",
    textTransform: "capitalize",
  },
  auditActor: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  auditReason: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#78350F",
    marginTop: 2,
  },
});
