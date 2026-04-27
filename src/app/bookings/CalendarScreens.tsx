import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { Booking, BookingStatus } from "../../domains/bookings/model";
import type { AvailableSlot } from "../../domains/bookings/slotEngine";

// ---------------------------------------------------------------------------
// Shared design tokens
// ---------------------------------------------------------------------------
const colors = {
  background: "#F2EDDD",
  surface: "#FFFFFF",
  border: "#E5E0D1",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  primary: "#E3A9A0",
  primaryPressed: "#CF8B80",
  accent: "#BBEDDA",
  error: "#F44336",
  white: "#FFFFFF",
  disabled: "#B0B0B0",
  disabledBg: "#F5F5F5",
};

// ---------------------------------------------------------------------------
// Admin Calendar Screen
// ---------------------------------------------------------------------------

export type AdminCalendarScreenProps = {
  locationName: string;
  selectedDate: string; // YYYY-MM-DD
  staff: Array<{ staffId: string; displayName: string }>;
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onBack: () => void;
};

function formatDisplayDate(date: string): string {
  const parts = date.split("-").map(Number);
  const d = new Date(parts[0] ?? 0, (parts[1] ?? 1) - 1, parts[2] ?? 1);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function statusColor(status: BookingStatus): string {
  switch (status) {
    case "confirmed":           return colors.accent;
    case "completed":           return "#D1BFB3";
    case "cancelled":           return colors.disabledBg;
    case "no_show":             return "#FFD0CC";
    case "rejected":            return "#FFD0CC";
    case "reschedule_pending":  return "#FFF7D6";
    case "reschedule_rejected": return "#FDDAD8";
    case "rescheduled":         return "#DCEFD8";
    default:                    return "#FFF3E0";
  }
}

function statusLabel(status: BookingStatus): string {
  switch (status) {
    case "confirmed":           return "Confirmed";
    case "completed":           return "Completed";
    case "cancelled":           return "Cancelled";
    case "no_show":             return "No show";
    case "rejected":            return "Rejected";
    case "reschedule_pending":  return "Reschedule pending";
    case "reschedule_rejected": return "Reschedule rejected";
    case "rescheduled":         return "Rescheduled";
    default:                    return "Pending";
  }
}

export function AdminCalendarScreen({
  locationName,
  selectedDate,
  staff,
  bookings,
  isLoading,
  error,
  onRetry,
  onPrevDay,
  onNextDay,
  onBack,
}: AdminCalendarScreenProps) {
  const sortedBookings = [...bookings].sort((a, b) => a.startMinutes - b.startMinutes);

  return (
    <ScrollView contentContainerStyle={calendarStyles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={calendarStyles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={calendarStyles.backButton}>
          <Text style={calendarStyles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={calendarStyles.locationName}>{locationName}</Text>
      </View>

      {/* Date navigation */}
      <View style={calendarStyles.dateNav}>
        <Pressable accessibilityRole="button" onPress={onPrevDay} style={calendarStyles.navArrow}>
          <Text style={calendarStyles.navArrowText}>‹</Text>
        </Pressable>
        <Text style={calendarStyles.dateLabel}>{formatDisplayDate(selectedDate)}</Text>
        <Pressable accessibilityRole="button" onPress={onNextDay} style={calendarStyles.navArrow}>
          <Text style={calendarStyles.navArrowText}>›</Text>
        </Pressable>
      </View>

      {/* States */}
      {isLoading ? (
        <View style={calendarStyles.statePanel}>
          <Text style={calendarStyles.stateText}>Loading schedule...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={calendarStyles.statePanel}>
          <Text style={calendarStyles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={calendarStyles.retryButton}>
            <Text style={calendarStyles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Per-staff booking lists */}
      {!isLoading && !error
        ? staff.map((member) => {
            const memberBookings = sortedBookings.filter((b) => b.staffId === member.staffId);
            return (
              <View key={member.staffId} style={calendarStyles.staffSection}>
                <Text style={calendarStyles.staffName}>{member.displayName}</Text>
                {memberBookings.length === 0 ? (
                  <Text style={calendarStyles.emptyText}>No bookings</Text>
                ) : (
                  memberBookings.map((booking) => (
                    <View
                      key={booking.bookingId}
                      style={[calendarStyles.bookingCard, { backgroundColor: statusColor(booking.status) }]}
                    >
                      <View style={calendarStyles.bookingCardRow}>
                        <Text style={calendarStyles.bookingTime}>
                          {booking.startTime} – {booking.endTime}
                        </Text>
                        <View style={calendarStyles.statusChip}>
                          <Text style={calendarStyles.statusChipText}>{statusLabel(booking.status)}</Text>
                        </View>
                      </View>
                      <Text style={calendarStyles.bookingServiceId}>{booking.serviceId}</Text>
                    </View>
                  ))
                )}
              </View>
            );
          })
        : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Client Booking Screen
// ---------------------------------------------------------------------------

export type ClientBookingScreenProps = {
  services: Array<{
    serviceId: string;
    name: string;
    durationMinutes: number;
    price: number;
    currency: string;
  }>;
  staff: Array<{ staffId: string; displayName: string }>;
  availableSlots: AvailableSlot[];
  selectedServiceId: string | null;
  selectedStaffId: string | null;
  selectedDate: string; // YYYY-MM-DD
  isLoadingSlots: boolean;
  slotsError: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  onSelectService: (serviceId: string) => void;
  onSelectStaff: (staffId: string) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onSelectAndConfirmSlot: (slot: AvailableSlot) => Promise<void>;
  onBack: () => void;
};

export function ClientBookingScreen({
  services,
  staff,
  availableSlots,
  selectedServiceId,
  selectedStaffId,
  selectedDate,
  isLoadingSlots,
  slotsError,
  isSubmitting,
  submitError,
  onSelectService,
  onSelectStaff,
  onPrevDay,
  onNextDay,
  onSelectAndConfirmSlot,
  onBack,
}: ClientBookingScreenProps) {
  return (
    <ScrollView contentContainerStyle={bookingStyles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={bookingStyles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={bookingStyles.backButton}>
          <Text style={bookingStyles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={bookingStyles.title}>Book Appointment</Text>
      </View>

      {/* Step 1: Service */}
      <View style={bookingStyles.section}>
        <Text style={bookingStyles.sectionTitle}>Select service</Text>
        {services.map((service) => {
          const active = selectedServiceId === service.serviceId;
          return (
            <Pressable
              key={service.serviceId}
              accessibilityRole="button"
              onPress={() => onSelectService(service.serviceId)}
              style={[bookingStyles.serviceCard, active && bookingStyles.serviceCardActive]}
            >
              <Text style={[bookingStyles.serviceName, active && bookingStyles.serviceNameActive]}>
                {service.name}
              </Text>
              <Text style={[bookingStyles.serviceMeta, active && bookingStyles.serviceMetaActive]}>
                {service.durationMinutes} min · {service.currency}{service.price}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Step 2: Staff */}
      {selectedServiceId ? (
        <View style={bookingStyles.section}>
          <Text style={bookingStyles.sectionTitle}>Select staff</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={bookingStyles.pillRow}>
            {staff.map((member) => {
              const active = selectedStaffId === member.staffId;
              return (
                <Pressable
                  key={member.staffId}
                  accessibilityRole="button"
                  onPress={() => onSelectStaff(member.staffId)}
                  style={[bookingStyles.staffPill, active && bookingStyles.staffPillActive]}
                >
                  <Text style={[bookingStyles.staffPillText, active && bookingStyles.staffPillTextActive]}>
                    {member.displayName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Step 3: Date */}
      {selectedStaffId ? (
        <View style={bookingStyles.section}>
          <Text style={bookingStyles.sectionTitle}>Select date</Text>
          <View style={bookingStyles.dateNav}>
            <Pressable accessibilityRole="button" onPress={onPrevDay} style={bookingStyles.navArrow}>
              <Text style={bookingStyles.navArrowText}>‹</Text>
            </Pressable>
            <Text style={bookingStyles.dateLabel}>{formatDisplayDate(selectedDate)}</Text>
            <Pressable accessibilityRole="button" onPress={onNextDay} style={bookingStyles.navArrow}>
              <Text style={bookingStyles.navArrowText}>›</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Step 4: Available slots */}
      {selectedStaffId ? (
        <View style={bookingStyles.section}>
          <Text style={bookingStyles.sectionTitle}>Available times</Text>

          {isLoadingSlots ? (
            <Text style={bookingStyles.stateText}>Loading available times...</Text>
          ) : null}

          {slotsError ? (
            <Text style={bookingStyles.errorText}>{slotsError}</Text>
          ) : null}

          {!isLoadingSlots && !slotsError && availableSlots.length === 0 ? (
            <Text style={bookingStyles.emptyText}>No available times for this day.</Text>
          ) : null}

          {!isLoadingSlots && !slotsError ? (
            <View style={bookingStyles.slotsGrid}>
              {availableSlots.map((slot) => (
                <Pressable
                  key={`${slot.startMinutes}`}
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => void onSelectAndConfirmSlot(slot)}
                  style={({ pressed }) => [
                    bookingStyles.slotPill,
                    pressed && !isSubmitting ? bookingStyles.slotPillPressed : null,
                    isSubmitting ? bookingStyles.slotPillDisabled : null,
                  ]}
                >
                  <Text style={bookingStyles.slotPillText}>{slot.startTime}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Submit error */}
      {submitError ? (
        <View style={bookingStyles.statePanel}>
          <Text style={bookingStyles.errorText}>{submitError}</Text>
        </View>
      ) : null}

      {isSubmitting ? (
        <View style={bookingStyles.statePanel}>
          <Text style={bookingStyles.stateText}>Confirming your booking...</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const calendarStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 8,
    gap: 4,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: brandTypography.medium,
  },
  locationName: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 28,
    fontFamily: brandTypography.semibold,
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  navArrow: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  navArrowText: {
    color: colors.text,
    fontSize: 20,
    fontFamily: brandTypography.regular,
  },
  dateLabel: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: brandTypography.semibold,
  },
  statePanel: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    alignItems: "center",
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: brandTypography.regular,
    textAlign: "center",
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontFamily: brandTypography.regular,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: brandTypography.medium,
  },
  staffSection: {
    gap: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  staffName: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: brandTypography.semibold,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: brandTypography.regular,
  },
  bookingCard: {
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  bookingCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingTime: {
    color: colors.text,
    fontSize: 14,
    fontFamily: brandTypography.semibold,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  statusChipText: {
    color: colors.text,
    fontSize: 11,
    fontFamily: brandTypography.medium,
  },
  bookingServiceId: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: brandTypography.regular,
  },
});

const bookingStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 24,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 8,
    gap: 4,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: brandTypography.medium,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 28,
    fontFamily: brandTypography.semibold,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: brandTypography.semibold,
  },
  serviceCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  serviceCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceName: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: brandTypography.semibold,
  },
  serviceNameActive: {
    color: colors.white,
  },
  serviceMeta: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: brandTypography.regular,
  },
  serviceMetaActive: {
    color: "rgba(255,255,255,0.85)",
  },
  pillRow: {
    gap: 8,
    paddingRight: 8,
  },
  staffPill: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  staffPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  staffPillText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: brandTypography.medium,
  },
  staffPillTextActive: {
    color: colors.white,
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navArrow: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  navArrowText: {
    color: colors.text,
    fontSize: 20,
    fontFamily: brandTypography.regular,
  },
  dateLabel: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: brandTypography.semibold,
  },
  statePanel: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: brandTypography.regular,
    textAlign: "center",
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontFamily: brandTypography.regular,
    textAlign: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: brandTypography.regular,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotPill: {
    minWidth: 80,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  slotPillPressed: {
    backgroundColor: "rgba(227,169,160,0.15)",
    borderColor: colors.primary,
  },
  slotPillDisabled: {
    opacity: 0.5,
  },
  slotPillText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: brandTypography.medium,
  },
});
