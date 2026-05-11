/**
 * W43 — BookingCalendarScreen (master calendar, day view)
 *
 * Displays the daily master calendar for all staff at a location.
 * Provides day navigation (prev/next), a per-staff column layout, blocked-slot
 * summary, and quick-action buttons for manual booking, block-time, and
 * force-book.
 *
 * Week and month views are a post-launch enhancement.
 * Drag-to-reschedule surfaces through the RescheduleAdminScreen launched from
 * a booking card (gesture-free initial release).
 */
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type {
  BlockedSlot,
  CalendarBookingEntry,
  CalendarDayView,
} from "../../domains/bookings/bookingOpsModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BookingCalendarScreenProps = {
  loading: boolean;
  error: string | null;
  dayView: CalendarDayView | null;
  blockedSlots: BlockedSlot[];
  selectedDate: string; // YYYY-MM-DD
  onPrevDay: () => void;
  onNextDay: () => void;
  onSelectBooking: (bookingId: string) => void;
  onCreateManual: () => void;
  onBlockTime: () => void;
  onForceBook: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BookingCard({
  entry,
  onPress,
}: {
  entry: CalendarBookingEntry;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.bookingCard}
      testID={`booking-card-${entry.bookingId}`}
    >
      <Text style={styles.bookingCardTime}>
        {entry.startTime}–{entry.endTime}
      </Text>
      <Text style={styles.bookingCardService} numberOfLines={1}>
        {entry.serviceName}
      </Text>
      <Text style={styles.bookingCardCustomer} numberOfLines={1}>
        {entry.customerName}
      </Text>
      <Text style={styles.bookingCardStatus}>
        {entry.status.replace(/_/g, " ")}
      </Text>
    </Pressable>
  );
}

function StaffColumn({
  column,
  onSelectBooking,
}: {
  column: CalendarDayView["columns"][0];
  onSelectBooking: (id: string) => void;
}) {
  return (
    <View style={styles.staffColumn} testID={`staff-column-${column.staffId}`}>
      <Text style={styles.staffColumnHeader} numberOfLines={1}>
        {column.staffName}
      </Text>
      {column.entries.length === 0 ? (
        <Text style={styles.noBookingsLabel}>No bookings</Text>
      ) : (
        column.entries.map((e) => (
          <BookingCard
            key={e.bookingId}
            entry={e}
            onPress={() => onSelectBooking(e.bookingId)}
          />
        ))
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BookingCalendarScreen({
  loading,
  error,
  dayView,
  blockedSlots,
  selectedDate,
  onPrevDay,
  onNextDay,
  onSelectBooking,
  onCreateManual,
  onBlockTime,
  onForceBook,
  onRetry,
  onBack,
  testID = "booking-calendar-screen",
}: BookingCalendarScreenProps) {
  if (loading) return <AdminLoadingState label="Loading calendar…" />;
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;

  const columns = dayView?.columns ?? [];
  const isEmpty = columns.length === 0 && blockedSlots.length === 0;

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.back}>‹ Calendar</Text>
        </Pressable>
        <Text style={styles.title}>Master Calendar</Text>
      </View>

      {/* Date navigation */}
      <View style={styles.dateNav} testID="date-nav">
        <Pressable
          accessibilityRole="button"
          onPress={onPrevDay}
          style={styles.navBtn}
          testID="prev-day-btn"
        >
          <Text style={styles.navBtnLabel}>‹</Text>
        </Pressable>
        <Text style={styles.selectedDate} testID="selected-date">
          {selectedDate}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onNextDay}
          style={styles.navBtn}
          testID="next-day-btn"
        >
          <Text style={styles.navBtnLabel}>›</Text>
        </Pressable>
      </View>

      {/* Quick actions */}
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onCreateManual}
          style={styles.primaryAction}
          testID="create-manual-btn"
        >
          <Text style={styles.primaryActionLabel}>+ Manual</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onBlockTime}
          style={styles.secondaryAction}
          testID="block-time-btn"
        >
          <Text style={styles.secondaryActionLabel}>Block</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onForceBook}
          style={styles.secondaryAction}
          testID="force-book-btn"
        >
          <Text style={styles.secondaryActionLabel}>Force</Text>
        </Pressable>
      </View>

      {isEmpty ? (
        <AdminEmptyState
          title="Nothing scheduled"
          body="There are no bookings or blocked slots for this day."
          cta="Create manual booking"
          onCta={onCreateManual}
        />
      ) : (
        <ScrollView
          horizontal
          contentContainerStyle={styles.gridScroll}
          testID="calendar-grid"
        >
          {columns.map((col) => (
            <StaffColumn
              key={col.staffId}
              column={col}
              onSelectBooking={onSelectBooking}
            />
          ))}
        </ScrollView>
      )}

      {/* Blocked slots strip */}
      {blockedSlots.length > 0 ? (
        <View style={styles.blockedSection} testID="blocked-slots-section">
          <Text style={styles.blockedTitle}>Blocked slots</Text>
          {blockedSlots.map((s) => (
            <View
              key={s.slotId}
              style={styles.blockedCard}
              testID={`blocked-slot-${s.slotId}`}
            >
              <Text style={styles.blockedTime}>
                {s.startTime}–{s.endTime}
              </Text>
              <Text style={styles.blockedReason}>{s.reason}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: { marginRight: 12 },
  back: {
    fontSize: 14,
    color: "#6B6B6B",
    fontFamily: brandTypography.regular,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
    flex: 1,
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 16,
  },
  navBtn: { padding: 8 },
  navBtnLabel: {
    fontSize: 20,
    fontFamily: brandTypography.semibold,
    color: "#6B21A8",
  },
  selectedDate: {
    fontSize: 15,
    fontFamily: brandTypography.medium,
    minWidth: 120,
    textAlign: "center",
    color: "#1A1A1A",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primaryAction: {
    backgroundColor: "#6B21A8",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryActionLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#FFFFFF",
  },
  secondaryAction: {
    borderWidth: 1,
    borderColor: "#6B21A8",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryActionLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#6B21A8",
  },
  gridScroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24 },
  staffColumn: { width: 180, marginRight: 12 },
  staffColumnHeader: {
    fontSize: 13,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 4,
  },
  noBookingsLabel: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 16,
  },
  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#6B21A8",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  bookingCardTime: {
    fontSize: 12,
    fontFamily: brandTypography.medium,
    color: "#6B21A8",
  },
  bookingCardService: {
    fontSize: 13,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
    marginTop: 2,
  },
  bookingCardCustomer: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  bookingCardStatus: {
    fontSize: 11,
    fontFamily: brandTypography.regular,
    color: "#9CA3AF",
    marginTop: 4,
    textTransform: "capitalize",
  },
  blockedSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  blockedTitle: {
    fontSize: 12,
    fontFamily: brandTypography.medium,
    color: "#6B6B6B",
    marginBottom: 8,
  },
  blockedCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  blockedTime: {
    fontSize: 12,
    fontFamily: brandTypography.medium,
    color: "#92400E",
  },
  blockedReason: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#78350F",
  },
});
