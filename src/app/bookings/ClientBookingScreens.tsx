/**
 * ClientBookingScreens.tsx
 *
 * Pure-UI components for the multi-step client booking flow:
 *
 *   Step 1 — choose location
 *   Step 2 — choose service
 *   Step 3 — choose technician (staff member)
 *   Step 4 — choose date
 *   Step 5 — choose time slot
 *   Step 6 — confirm booking summary
 *   Step 7 — booking result (success / slot-unavailable retry / error)
 *
 * All screens are prop-driven and free of side-effects; business logic lives
 * in clientBookingFlow.ts.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { AvailableSlot } from "../../domains/bookings/slotEngine";
import type { Location } from "../../domains/locations/model";
import type { Service } from "../../domains/services/model";
import type { StaffMember } from "../../domains/staff/model";

// ---------------------------------------------------------------------------
// Design tokens (shared with CalendarScreens palette)
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
// Shared primitives
// ---------------------------------------------------------------------------

function StepHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <View style={shared.header}>
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={shared.backButton}
        >
          <Text style={shared.backButtonText}>← Back</Text>
        </Pressable>
      )}
      <Text style={shared.title}>{title}</Text>
      {subtitle ? <Text style={shared.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function LoadingState({ message }: { message?: string }) {
  return (
    <View style={shared.centred}>
      <Text style={shared.mutedText}>{message ?? "Loading…"}</Text>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={shared.centred}>
      <Text style={shared.errorText}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry"
        onPress={onRetry}
        style={shared.retryButton}
      >
        <Text style={shared.retryButtonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={shared.centred}>
      <Text style={shared.mutedText}>{message}</Text>
    </View>
  );
}

function SelectionCard({
  label,
  sublabel,
  onPress,
  testID,
}: {
  label: string;
  sublabel?: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [card.container, pressed && card.pressed]}
      testID={testID}
    >
      <View style={card.content}>
        <Text style={card.label}>{label}</Text>
        {sublabel ? <Text style={card.sublabel}>{sublabel}</Text> : null}
      </View>
      <Text style={card.arrow}>›</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Pick location
// ---------------------------------------------------------------------------

export type LocationPickerScreenProps = {
  tenantName: string;
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  onSelect: (location: Location) => void;
  onRetry: () => void;
  onBack: () => void;
};

export function LocationPickerScreen({
  tenantName,
  locations,
  isLoading,
  error,
  onSelect,
  onRetry,
  onBack,
}: LocationPickerScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={shared.screen}
      showsVerticalScrollIndicator={false}
      testID="location-picker-screen"
    >
      <StepHeader
        title="Choose a location"
        subtitle={`Booking at ${tenantName}`}
        onBack={onBack}
      />

      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorState message={error} onRetry={onRetry} />}
      {!isLoading && !error && locations.length === 0 && (
        <EmptyState message="No locations available at the moment." />
      )}
      {!isLoading && !error && locations.map((loc) => (
        <SelectionCard
          key={loc.locationId}
          label={loc.name}
          sublabel={loc.address?.city ?? undefined}
          onPress={() => onSelect(loc)}
          testID={`location-card-${loc.locationId}`}
        />
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Pick service
// ---------------------------------------------------------------------------

export type ServicePickerScreenProps = {
  locationName: string;
  services: Service[];
  isLoading: boolean;
  error: string | null;
  onSelect: (service: Service) => void;
  onRetry: () => void;
  onBack: () => void;
};

function formatPrice(price: number, currency: string): string {
  return `${currency} ${price.toFixed(2)}`;
}

export function ServicePickerScreen({
  locationName,
  services,
  isLoading,
  error,
  onSelect,
  onRetry,
  onBack,
}: ServicePickerScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={shared.screen}
      showsVerticalScrollIndicator={false}
      testID="service-picker-screen"
    >
      <StepHeader
        title="Choose a service"
        subtitle={locationName}
        onBack={onBack}
      />

      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorState message={error} onRetry={onRetry} />}
      {!isLoading && !error && services.length === 0 && (
        <EmptyState message="No services available at this location." />
      )}
      {!isLoading && !error && services.map((svc) => (
        <SelectionCard
          key={svc.serviceId}
          label={svc.name}
          sublabel={`${svc.durationMinutes} min · ${formatPrice(svc.price, svc.currency)}`}
          onPress={() => onSelect(svc)}
          testID={`service-card-${svc.serviceId}`}
        />
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Pick technician
// ---------------------------------------------------------------------------

export type TechnicianPickerScreenProps = {
  serviceName: string;
  technicians: StaffMember[];
  isLoading: boolean;
  error: string | null;
  onSelect: (technician: StaffMember) => void;
  onRetry: () => void;
  onBack: () => void;
};

export function TechnicianPickerScreen({
  serviceName,
  technicians,
  isLoading,
  error,
  onSelect,
  onRetry,
  onBack,
}: TechnicianPickerScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={shared.screen}
      showsVerticalScrollIndicator={false}
      testID="technician-picker-screen"
    >
      <StepHeader
        title="Choose a technician"
        subtitle={serviceName}
        onBack={onBack}
      />

      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorState message={error} onRetry={onRetry} />}
      {!isLoading && !error && technicians.length === 0 && (
        <EmptyState message="No technicians available for this service." />
      )}
      {!isLoading && !error && technicians.map((tech) => (
        <SelectionCard
          key={tech.staffId}
          label={tech.displayName}
          sublabel={tech.role}
          onPress={() => onSelect(tech)}
          testID={`technician-card-${tech.staffId}`}
        />
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Pick date
// ---------------------------------------------------------------------------

export type DatePickerScreenProps = {
  technicianName: string;
  /**
   * List of ISO date strings (YYYY-MM-DD) that should be presented as
   * selectable days.  Typically caller generates the next N days.
   */
  availableDates: string[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
  onConfirm: () => void;
  onBack: () => void;
};

function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isToday(iso: string): boolean {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return iso === todayIso;
}

export function DatePickerScreen({
  technicianName,
  availableDates,
  selectedDate,
  onSelect,
  onConfirm,
  onBack,
}: DatePickerScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={shared.screen}
      showsVerticalScrollIndicator={false}
      testID="date-picker-screen"
    >
      <StepHeader
        title="Choose a date"
        subtitle={`With ${technicianName}`}
        onBack={onBack}
      />

      <View style={datePicker.grid}>
        {availableDates.map((iso) => {
          const isSelected = iso === selectedDate;
          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityLabel={formatDateLabel(iso)}
              onPress={() => onSelect(iso)}
              style={({ pressed }) => [
                datePicker.day,
                isSelected && datePicker.daySelected,
                pressed && !isSelected && datePicker.dayPressed,
              ]}
              testID={`date-${iso}`}
            >
              <Text style={[datePicker.dayText, isSelected && datePicker.dayTextSelected]}>
                {formatDateLabel(iso)}
              </Text>
              {isToday(iso) && (
                <Text style={datePicker.todayBadge}>Today</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue"
        disabled={!selectedDate}
        onPress={onConfirm}
        style={({ pressed }) => [
          shared.primaryButton,
          !selectedDate && shared.primaryButtonDisabled,
          pressed && selectedDate && shared.primaryButtonPressed,
        ]}
        testID="date-confirm-button"
      >
        <Text style={shared.primaryButtonText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Pick time slot
// ---------------------------------------------------------------------------

export type SlotPickerScreenProps = {
  date: string;
  slots: AvailableSlot[];
  isLoading: boolean;
  error: string | null;
  onSelect: (slot: AvailableSlot) => void;
  onRetry: () => void;
  onBack: () => void;
};

export function SlotPickerScreen({
  date,
  slots,
  isLoading,
  error,
  onSelect,
  onRetry,
  onBack,
}: SlotPickerScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={shared.screen}
      showsVerticalScrollIndicator={false}
      testID="slot-picker-screen"
    >
      <StepHeader
        title="Choose a time"
        subtitle={formatDateLabel(date)}
        onBack={onBack}
      />

      {isLoading && <LoadingState message="Loading available slots…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={onRetry} />}
      {!isLoading && !error && slots.length === 0 && (
        <EmptyState message="No slots available on this day. Try a different date." />
      )}

      {!isLoading && !error && (
        <View style={slotPicker.grid}>
          {slots.map((slot) => (
            <Pressable
              key={slot.startTime}
              accessibilityRole="button"
              accessibilityLabel={slot.startTime}
              onPress={() => onSelect(slot)}
              style={({ pressed }) => [slotPicker.slot, pressed && slotPicker.slotPressed]}
              testID={`slot-${slot.startTime}`}
            >
              <Text style={slotPicker.slotTime}>{slot.startTime}</Text>
              <Text style={slotPicker.slotDuration}>{slot.endMinutes - slot.startMinutes} min</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Step 6 — Confirm booking summary
// ---------------------------------------------------------------------------

export type BookingConfirmSummary = {
  locationName: string;
  serviceName: string;
  technicianName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  price: number;
  currency: string;
};

export type BookingConfirmScreenProps = {
  summary: BookingConfirmSummary;
  isSubmitting: boolean;
  onConfirm: () => void;
  onBack: () => void;
};

export function BookingConfirmScreen({
  summary,
  isSubmitting,
  onConfirm,
  onBack,
}: BookingConfirmScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={shared.screen}
      showsVerticalScrollIndicator={false}
      testID="booking-confirm-screen"
    >
      <StepHeader title="Confirm booking" onBack={isSubmitting ? undefined : onBack} />

      <View style={confirm.card}>
        <ConfirmRow label="Location" value={summary.locationName} />
        <ConfirmRow label="Service" value={summary.serviceName} />
        <ConfirmRow label="Technician" value={summary.technicianName} />
        <ConfirmRow label="Date" value={formatDateLabel(summary.date)} />
        <ConfirmRow label="Time" value={`${summary.startTime} – ${summary.endTime}`} />
        <ConfirmRow label="Duration" value={`${summary.durationMinutes} min`} />
        <ConfirmRow
          label="Price"
          value={formatPrice(summary.price, summary.currency)}
          emphasis
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Confirm booking"
        disabled={isSubmitting}
        onPress={onConfirm}
        style={({ pressed }) => [
          shared.primaryButton,
          isSubmitting && shared.primaryButtonDisabled,
          pressed && !isSubmitting && shared.primaryButtonPressed,
        ]}
        testID="confirm-booking-button"
      >
        <Text style={shared.primaryButtonText}>
          {isSubmitting ? "Booking…" : "Book now"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function ConfirmRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={confirm.row}>
      <Text style={confirm.rowLabel}>{label}</Text>
      <Text style={[confirm.rowValue, emphasis && confirm.rowValueEmphasis]}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 7 — Booking result
// ---------------------------------------------------------------------------

export type BookingResultScreenProps =
  | { outcome: "success"; bookingId: string; startTime: string; date: string; onDone: () => void }
  | { outcome: "slot_unavailable"; onRetry: () => void; onBack: () => void }
  | { outcome: "error"; message: string; onRetry: () => void; onBack: () => void };

export function BookingResultScreen(props: BookingResultScreenProps) {
  if (props.outcome === "success") {
    return (
      <ScrollView
        contentContainerStyle={shared.screen}
        showsVerticalScrollIndicator={false}
        testID="booking-result-success"
      >
        <View style={result.artwork} />
        <Text style={result.headline}>Booking confirmed!</Text>
        <Text style={result.body}>
          {`${formatDateLabel(props.date)} at ${props.startTime}`}
        </Text>
        <Text style={result.bookingId}>Booking ID: {props.bookingId}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done"
          onPress={props.onDone}
          style={shared.primaryButton}
          testID="booking-done-button"
        >
          <Text style={shared.primaryButtonText}>Done</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (props.outcome === "slot_unavailable") {
    return (
      <ScrollView
        contentContainerStyle={shared.screen}
        showsVerticalScrollIndicator={false}
        testID="booking-result-slot-unavailable"
      >
        <Text style={result.headline}>Slot just taken</Text>
        <Text style={result.body}>
          Someone else booked this slot while you were confirming. Please choose another time.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pick another slot"
          onPress={props.onRetry}
          style={shared.primaryButton}
          testID="slot-retry-button"
        >
          <Text style={shared.primaryButtonText}>Pick another slot</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={props.onBack}
          style={shared.ghostButton}
          testID="slot-back-button"
        >
          <Text style={shared.ghostButtonText}>Back to date picker</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // generic error
  return (
    <ScrollView
      contentContainerStyle={shared.screen}
      showsVerticalScrollIndicator={false}
      testID="booking-result-error"
    >
      <Text style={result.headline}>Something went wrong</Text>
      <Text style={result.body}>{props.message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Try again"
        onPress={props.onRetry}
        style={shared.primaryButton}
        testID="booking-error-retry-button"
      >
        <Text style={shared.primaryButtonText}>Try again</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={props.onBack}
        style={shared.ghostButton}
        testID="booking-error-back-button"
      >
        <Text style={shared.ghostButtonText}>Go back</Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Bookings list screen (shown when Bookings tab is opened before a flow starts)
// ---------------------------------------------------------------------------

export type BookingsListScreenProps = {
  onStartBooking: () => void;
};

export function BookingsListScreen({ onStartBooking }: BookingsListScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={shared.screen}
      showsVerticalScrollIndicator={false}
      testID="bookings-list-screen"
    >
      <Text style={shared.title}>My bookings</Text>

      <View style={shared.centred}>
        <View style={noBookings.artwork} />
        <Text style={noBookings.headline}>No bookings yet</Text>
        <Text style={noBookings.body}>
          Your upcoming and past bookings will appear here.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Book a service"
          onPress={onStartBooking}
          style={shared.primaryButton}
          testID="start-booking-button"
        >
          <Text style={shared.primaryButtonText}>Book a service</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const shared = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
  },
  backButton: {
    marginBottom: 6,
  },
  backButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  centred: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  mutedText: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  ghostButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.muted,
  },
});

const card = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pressed: {
    backgroundColor: "#F8F4EC",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  sublabel: {
    fontSize: 13,
    color: colors.muted,
  },
  arrow: {
    fontSize: 22,
    color: colors.muted,
    marginLeft: 8,
  },
});

const datePicker = StyleSheet.create({
  grid: {
    gap: 8,
  },
  day: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  daySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayPressed: {
    backgroundColor: "#F8F4EC",
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: "700",
  },
  todayBadge: {
    fontSize: 12,
    color: colors.muted,
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
  },
});

const slotPicker = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slot: {
    width: "30%",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  slotPressed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotTime: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  slotDuration: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
});

const confirm = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  rowValueEmphasis: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
});

const result = StyleSheet.create({
  artwork: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    alignSelf: "center",
    marginBottom: 16,
  },
  headline: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
  },
  bookingId: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    marginTop: -4,
  },
});

const noBookings = StyleSheet.create({
  artwork: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  headline: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  body: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 260,
  },
});
