/**
 * ManageBookingScreen.tsx — C.9 Manage existing booking.
 *
 * Status banner + summary + action list (reschedule, cancel, message,
 * directions). Cancellation modal preview uses computeCancellationRefund
 * to show refund breakdown before user confirms.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Button,
  ModalSheet,
  SummaryRow,
  colors,
  radius,
  spacing,
} from "../../shared/ui";

import {
  BOOKING_STATUS_LABELS,
  computeCancellationRefund,
  formatLongDateLabel,
  formatUsd,
  type BookingPriceBreakdown,
  type BookingStatus,
} from "./bookingHelpers";

export type ManageBookingScreenProps = {
  bookingId: string;
  status: BookingStatus;
  salonName: string;
  servicesSummary: string;
  staffName: string;
  date: Date;
  timeSlot: string;
  pricing: BookingPriceBreakdown;
  /** Cancellation fee shown in the cancel modal preview. */
  cancellationFeeUsd: number;
  /** Cancellation modal visibility (caller-owned). */
  cancelModalVisible: boolean;
  cancelLoading?: boolean;
  cancelErrorMessage?: string;
  onPressReschedule?: () => void;
  onPressMessage?: () => void;
  onPressDirections?: () => void;
  onPressCancel: () => void;
  onPressConfirmCancel: () => void;
  onPressDismissCancel: () => void;
  onPressBack?: () => void;
  testID?: string;
};

export function ManageBookingScreen({
  bookingId,
  status,
  salonName,
  servicesSummary,
  staffName,
  date,
  timeSlot,
  pricing,
  cancellationFeeUsd,
  cancelModalVisible,
  cancelLoading,
  cancelErrorMessage,
  onPressReschedule,
  onPressMessage,
  onPressDirections,
  onPressCancel,
  onPressConfirmCancel,
  onPressDismissCancel,
  onPressBack,
  testID,
}: ManageBookingScreenProps) {
  const refundPreview = computeCancellationRefund({
    total: pricing.total,
    fee: cancellationFeeUsd,
  });
  const isActive = status === "confirmed" || status === "pending";

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        {onPressBack ? (
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID={testID ? `${testID}-back` : undefined}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>{"\u2190"}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>Manage booking</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View
          style={[styles.statusBanner, statusStyle(status)]}
          testID={testID ? `${testID}-status` : undefined}
        >
          <Text style={styles.statusText}>{BOOKING_STATUS_LABELS[status]}</Text>
        </View>
        <Text style={styles.bookingId} testID={testID ? `${testID}-booking-id` : undefined}>
          Confirmation #{bookingId}
        </Text>

        <View style={styles.card}>
          <Text style={styles.salonName}>{salonName}</Text>
          <View style={styles.cardDivider} />
          <SummaryRow label="Services" value={servicesSummary} />
          <SummaryRow label="Staff" value={staffName} />
          <SummaryRow label="When" value={`${formatLongDateLabel(date)} · ${timeSlot}`} />
          <SummaryRow label="Total" value={formatUsd(pricing.total)} noDivider />
        </View>

        {isActive ? (
          <View style={styles.actions}>
            {onPressReschedule ? (
              <ActionRow
                label="Reschedule"
                onPress={onPressReschedule}
                testID={testID ? `${testID}-reschedule` : undefined}
              />
            ) : null}
            {onPressMessage ? (
              <ActionRow
                label="Message salon"
                onPress={onPressMessage}
                testID={testID ? `${testID}-message` : undefined}
              />
            ) : null}
            {onPressDirections ? (
              <ActionRow
                label="Directions"
                onPress={onPressDirections}
                testID={testID ? `${testID}-directions` : undefined}
              />
            ) : null}
            <ActionRow
              label="Cancel booking"
              destructive
              onPress={onPressCancel}
              testID={testID ? `${testID}-cancel` : undefined}
            />
          </View>
        ) : null}
      </ScrollView>

      <ModalSheet
        visible={cancelModalVisible}
        onClose={onPressDismissCancel}
        title="Cancel booking?"
        testID={testID ? `${testID}-cancel-modal` : undefined}
        footer={
          <View>
            <Button
              label={`Cancel · refund ${formatUsd(refundPreview.refund)}`}
              variant="destructive"
              onPress={onPressConfirmCancel}
              fullWidth
              loading={cancelLoading}
              disabled={cancelLoading}
              testID={testID ? `${testID}-cancel-confirm` : undefined}
            />
            <View style={{ height: spacing.s2 }} />
            <Button
              label="Keep booking"
              variant="secondary"
              onPress={onPressDismissCancel}
              fullWidth
              disabled={cancelLoading}
              testID={testID ? `${testID}-cancel-dismiss` : undefined}
            />
          </View>
        }
      >
        <View style={styles.modalBody}>
          <Text style={styles.modalText}>
            Cancelling now applies a {formatUsd(refundPreview.fee)} fee. You will be
            refunded {formatUsd(refundPreview.refund)}.
          </Text>
          {cancelErrorMessage ? (
            <Text style={styles.modalError} testID={testID ? `${testID}-cancel-error` : undefined}>
              {cancelErrorMessage}
            </Text>
          ) : null}
        </View>
      </ModalSheet>
    </View>
  );
}

function ActionRow({
  label,
  onPress,
  destructive,
  testID,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={styles.actionRow}
    >
      <Text style={[styles.actionLabel, destructive ? styles.actionDestructive : null]}>
        {label}
      </Text>
      <Text style={styles.actionChev}>{"\u203A"}</Text>
    </Pressable>
  );
}

function statusStyle(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return { backgroundColor: colors.mintFresh };
    case "pending":
      return { backgroundColor: colors.creamSilk };
    case "cancelled":
    case "noShow":
      return { backgroundColor: "rgba(244, 67, 54, 0.1)" };
    case "completed":
      return { backgroundColor: colors.primary10 };
    case "waitlisted":
    default:
      return { backgroundColor: colors.surface };
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 56,
    paddingHorizontal: spacing.pageHorizontal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
  backText: { fontSize: 20, color: colors.foreground },
  title: { fontSize: 18, fontWeight: "600", color: colors.foreground },
  body: { padding: spacing.pageHorizontal, paddingBottom: spacing.s24 },
  statusBanner: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    alignSelf: "flex-start",
    marginBottom: spacing.s2,
  },
  statusText: { fontSize: 12, fontWeight: "600", color: colors.foreground },
  bookingId: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.s4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s4,
  },
  salonName: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.s3,
  },
  actions: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  actionRow: {
    minHeight: 56,
    paddingHorizontal: spacing.s4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionLabel: { fontSize: 14, color: colors.foreground, fontWeight: "500" },
  actionDestructive: { color: colors.error },
  actionChev: { fontSize: 20, color: colors.textMuted },
  modalBody: { padding: spacing.pageHorizontal, gap: spacing.s3 },
  modalText: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  modalError: { color: colors.error, fontSize: 12 },
});
