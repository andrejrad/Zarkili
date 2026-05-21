/**
 * BookingDateTimeScreen.tsx — Merged Date + Time Picker (Booking step 3/5).
 *
 * Replaces the two-screen BookingDatePickerScreen → BookingTimePickerScreen
 * sequence with a single scrollable screen. When the user taps a date the
 * time-slot grid below updates reactively (slots are loaded by the caller
 * and passed in via `availableSlots`).
 *
 * Closes W35-DEBT-1 (UX merger portion).
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  CalendarGrid,
  SegmentedControl,
  StickyFooterCta,
  TimeSlotChip,
  colors,
  radius,
  spacing,
  toIsoDate,
} from "../../shared/ui";
import {
  TIME_SEGMENT_LABELS,
  formatLongDateLabel,
  groupTimeSlotsBySegment,
  type BookingStaffOption,
  type TimeSegment,
} from "./bookingHelpers";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type BookingDateTimeScreenProps = {
  // ---- Date picker ----
  month: Date;
  selectedDate: Date | null;
  disabledDates?: Date[];
  holidays?: Date[];
  availabilityMap?: Record<string, { staffName?: string; slotCount: number }>;
  holidayBanner?: { name: string; message?: string } | null;
  staff?: BookingStaffOption | null;
  dateLoading?: boolean;
  dateErrorMessage?: string;
  onSelectDate: (date: Date) => void;
  onChangeMonth: (delta: -1 | 1) => void;
  onPressQuickPick?: (which: "today" | "tomorrow" | "this-weekend") => void;
  // ---- Time picker ----
  availableSlots: readonly string[];
  disabledSlots?: readonly string[];
  selectedSlot: string | null;
  segment: TimeSegment;
  timezone: string;
  slotsLoading?: boolean;
  slotsErrorMessage?: string;
  onChangeSegment: (next: TimeSegment) => void;
  onSelectSlot: (slot: string) => void;
  onPressTryAnotherDay?: () => void;
  // ---- Footer ----
  onPressContinue: () => void;
  onPressBack?: () => void;
  onPressRetry?: () => void;
  /** BookingProgressIndicator slot — replaces the plain "3–4/5" step badge when provided. W50-DEBT-6 */
  progressIndicator?: React.ReactNode;
  testID?: string;
};

export function BookingDateTimeScreen({
  month,
  selectedDate,
  disabledDates,
  holidays,
  availabilityMap,
  holidayBanner,
  staff,
  dateLoading,
  dateErrorMessage,
  onSelectDate,
  onChangeMonth,
  onPressQuickPick,
  availableSlots,
  disabledSlots = [],
  selectedSlot,
  segment,
  timezone,
  slotsLoading,
  slotsErrorMessage,
  onChangeSegment,
  onSelectSlot,
  onPressTryAnotherDay,
  onPressContinue,
  onPressBack,
  onPressRetry,
  progressIndicator,
  testID,
}: BookingDateTimeScreenProps) {
  const monthLabel = `${MONTH_NAMES[month.getMonth()]} ${month.getFullYear()}`;

  const selectedAvailability = selectedDate
    ? availabilityMap?.[toIsoDate(selectedDate)]
    : undefined;

  const isFullyBooked = Boolean(
    selectedDate &&
      disabledDates?.some(
        (d) =>
          d.getFullYear() === selectedDate.getFullYear() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getDate() === selectedDate.getDate(),
      ),
  );

  const groupedAvailable = groupTimeSlotsBySegment(availableSlots);
  const disabledSet = new Set(disabledSlots);
  const slotsForSegment = groupedAvailable[segment].map((time) => ({
    time,
    disabled: disabledSet.has(time),
  }));
  const noSlots = !slotsLoading && !slotsErrorMessage && selectedDate != null && availableSlots.length === 0;

  const canContinue = Boolean(selectedDate) && Boolean(selectedSlot) && !dateLoading && !dateErrorMessage;

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        {onPressBack ? (
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}
          >
            <Text style={styles.backText}>{"\u2190"}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>Pick date &amp; time</Text>
        {progressIndicator ? null : <Text style={styles.step}>3–4/5</Text>}
      </View>
      {progressIndicator}

      <ScrollView contentContainerStyle={styles.body}>
        {/* Quick-picks */}
        <View style={styles.quickPicks}>
          {(["today", "tomorrow", "this-weekend"] as const).map((id) => (
            <Pressable
              key={id}
              onPress={() => onPressQuickPick?.(id)}
              accessibilityRole="button"
              accessibilityLabel={
                id === "today" ? "Today" : id === "tomorrow" ? "Tomorrow" : "This weekend"
              }
              style={styles.qpChip}
            >
              <Text style={styles.qpText}>
                {id === "today" ? "Today" : id === "tomorrow" ? "Tomorrow" : "This weekend"}
              </Text>
            </Pressable>
          ))}
        </View>

        {holidayBanner ? (
          <View style={styles.holidayBanner}>
            <View style={styles.holidayDot} />
            <Text style={styles.holidayText}>
              {holidayBanner.name}
              {holidayBanner.message ? ` — ${holidayBanner.message}` : " — limited hours"}
            </Text>
          </View>
        ) : null}

        {dateErrorMessage ? (
          <View style={styles.errorBanner} testID={testID ? `${testID}-date-error` : undefined}>
            <Text style={styles.errorText}>{dateErrorMessage}</Text>
            {onPressRetry ? (
              <Pressable onPress={onPressRetry} accessibilityRole="button" accessibilityLabel="Retry" style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Month switcher */}
        <View style={styles.monthSwitcher}>
          <Pressable onPress={() => onChangeMonth(-1)} accessibilityRole="button" accessibilityLabel="Previous month" style={styles.monthBtn}>
            <Text style={styles.monthChev}>{"\u2039"}</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable onPress={() => onChangeMonth(1)} accessibilityRole="button" accessibilityLabel="Next month" style={styles.monthBtn}>
            <Text style={styles.monthChev}>{"\u203A"}</Text>
          </Pressable>
        </View>

        {dateLoading ? (
          <View style={styles.skeletonGrid} testID={testID ? `${testID}-cal-skeleton` : undefined}>
            {Array.from({ length: 42 }).map((_, i) => (
              <View key={i} style={styles.skeletonCell} />
            ))}
          </View>
        ) : !dateErrorMessage ? (
          <CalendarGrid
            month={month}
            selectedDate={selectedDate}
            minDate={new Date()}
            disabledDates={disabledDates}
            holidays={holidays}
            availabilityMap={availabilityMap}
            onSelectDate={onSelectDate}
            testID={testID ? `${testID}-cal` : undefined}
          />
        ) : null}

        {selectedDate && !dateLoading && !dateErrorMessage ? (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedLabel}>{formatLongDateLabel(selectedDate)}</Text>
            <Text style={styles.availabilityLabel}>
              {isFullyBooked
                ? "Fully booked"
                : selectedAvailability
                  ? `${staff?.name ?? selectedAvailability.staffName ?? "Staff"} has ${selectedAvailability.slotCount} slots available`
                  : ""}
            </Text>
          </View>
        ) : null}

        {/* ---- Time slots (visible only after a date is selected) ---- */}
        {selectedDate ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.timeSectionLabel}>Available times</Text>

            <View style={styles.segmentWrap}>
              <SegmentedControl<TimeSegment>
                options={[
                  { value: "morning", label: TIME_SEGMENT_LABELS.morning },
                  { value: "afternoon", label: TIME_SEGMENT_LABELS.afternoon },
                  { value: "evening", label: TIME_SEGMENT_LABELS.evening },
                ]}
                value={segment}
                onChange={onChangeSegment}
                testID={testID ? `${testID}-segment` : undefined}
              />
            </View>

            {slotsErrorMessage ? (
              <View style={styles.errorBanner} testID={testID ? `${testID}-slots-error` : undefined}>
                <Text style={styles.errorText}>{slotsErrorMessage}</Text>
                {onPressRetry ? (
                  <Pressable onPress={onPressRetry} accessibilityRole="button" accessibilityLabel="Retry" style={styles.retryBtn}>
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {slotsLoading ? (
              <View style={styles.skeletonGrid} testID={testID ? `${testID}-slots-skeleton` : undefined}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <View key={i} style={styles.skeletonChip} />
                ))}
              </View>
            ) : noSlots ? (
              <View style={styles.empty} testID={testID ? `${testID}-empty` : undefined}>
                <View style={styles.emptyDot} />
                <Text style={styles.emptyTitle}>No times available</Text>
                {onPressTryAnotherDay ? (
                  <Pressable onPress={onPressTryAnotherDay} accessibilityRole="button" accessibilityLabel="Try another day" style={styles.tryBtn}>
                    <Text style={styles.tryText}>Try another day</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : !slotsErrorMessage ? (
              <View style={styles.grid} testID={testID ? `${testID}-grid` : undefined}>
                {slotsForSegment.map(({ time, disabled }) => (
                  <View key={time} style={styles.cell}>
                    <TimeSlotChip
                      time={time}
                      selected={selectedSlot === time}
                      disabled={disabled}
                      onPress={onSelectSlot}
                      testID={testID ? `${testID}-slot-${time.replace(/\s/g, "-")}` : undefined}
                    />
                  </View>
                ))}
              </View>
            ) : null}

            {!noSlots && !slotsErrorMessage && !slotsLoading ? (
              <Text style={styles.tzNote}>Times shown in {timezone}</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.promptLabel}>Select a date to see available times</Text>
        )}
      </ScrollView>

      <StickyFooterCta
        primaryLabel="Continue"
        onPrimaryPress={onPressContinue}
        primaryDisabled={!canContinue}
        primaryTestID={testID ? `${testID}-continue` : undefined}
      />
    </View>
  );
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
  step: { fontSize: 12, fontWeight: "500", color: colors.textMuted },
  body: { padding: spacing.pageHorizontal, paddingBottom: spacing.s24 },

  // Quick picks
  quickPicks: { flexDirection: "row", gap: spacing.s2, marginBottom: spacing.s3 },
  qpChip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  qpText: { fontSize: 13, color: colors.foreground },

  // Holiday banner
  holidayBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
    backgroundColor: "rgba(255, 193, 7, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.4)",
    borderRadius: radius.sm,
    padding: spacing.s3,
    marginBottom: spacing.s3,
  },
  holidayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFC107" },
  holidayText: { fontSize: 13, color: colors.foreground, flex: 1 },

  // Error banner
  errorBanner: {
    backgroundColor: "rgba(244, 67, 54, 0.05)",
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.sm,
    padding: spacing.s3,
    gap: spacing.s2,
    marginBottom: spacing.s4,
  },
  errorText: { fontSize: 14, color: colors.error },
  retryBtn: { alignSelf: "flex-start" },
  retryText: { fontSize: 14, color: colors.primary, fontWeight: "600" },

  // Month switcher
  monthSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.s3,
  },
  monthBtn: { padding: spacing.s2 },
  monthChev: { fontSize: 22, color: colors.foreground },
  monthLabel: { fontSize: 16, fontWeight: "600", color: colors.foreground },

  // Skeleton grids
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2, marginBottom: spacing.s4 },
  skeletonCell: { width: "13%", aspectRatio: 1, borderRadius: radius.sm, backgroundColor: colors.border },
  skeletonChip: { width: 72, height: 36, borderRadius: radius.sm, backgroundColor: colors.border, margin: spacing.s1 },

  // Selected date info
  selectedInfo: { marginTop: spacing.s3, marginBottom: spacing.s2 },
  selectedLabel: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  availabilityLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  // Divider between date and time sections
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.s4 },
  timeSectionLabel: { fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: spacing.s3 },

  // Segment + slot grid
  segmentWrap: { marginBottom: spacing.s4 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: spacing.s2 },
  cell: { marginRight: spacing.s2, marginBottom: spacing.s2 },
  tzNote: { fontSize: 11, color: colors.textMuted, marginTop: spacing.s2 },

  // Empty state
  empty: { alignItems: "center", paddingVertical: spacing.s8 },
  emptyDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border, marginBottom: spacing.s3 },
  emptyTitle: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.s3 },
  tryBtn: { paddingHorizontal: spacing.s4, paddingVertical: spacing.s2, borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary },
  tryText: { fontSize: 14, color: colors.primary, fontWeight: "600" },

  // Prompt
  promptLabel: { fontSize: 14, color: colors.textMuted, textAlign: "center", marginTop: spacing.s6 },
});
