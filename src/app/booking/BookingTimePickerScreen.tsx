/**
 * BookingTimePickerScreen.tsx — C.4 Time Slot Picker (Booking step 4/5).
 *
 * Locked spec: design-handoff/specs/screen-booking-time-picker.json.
 * Composes SegmentedControl + TimeSlotChip grid + sticky footer. Times are
 * pre-formatted (US 12h "h:mm A") by the caller; this screen does not parse.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  SegmentedControl,
  StickyFooterCta,
  TimeSlotChip,
  colors,
  radius,
  spacing,
} from "../../shared/ui";

import {
  TIME_SEGMENT_LABELS,
  formatShortDateLabel,
  groupTimeSlotsBySegment,
  type TimeSegment,
} from "./bookingHelpers";

export type BookingTimePickerScreenProps = {
  date: Date;
  /** Available 12h slot strings (e.g. "9:00 AM"). */
  availableSlots: readonly string[];
  /** Disabled slots shown grayed/strikethrough alongside available. */
  disabledSlots?: readonly string[];
  selectedSlot: string | null;
  /** Selected time-of-day segment. */
  segment: TimeSegment;
  /** Timezone abbreviation (e.g. "PT", "EST"). */
  timezone: string;
  loading?: boolean;
  errorMessage?: string;
  onChangeSegment: (next: TimeSegment) => void;
  onSelectSlot: (slot: string) => void;
  onPressContinue: () => void;
  onPressBack?: () => void;
  onPressTryAnotherDay?: () => void;
  onPressRetry?: () => void;
  testID?: string;
};

export function BookingTimePickerScreen({
  date,
  availableSlots,
  disabledSlots = [],
  selectedSlot,
  segment,
  timezone,
  loading,
  errorMessage,
  onChangeSegment,
  onSelectSlot,
  onPressContinue,
  onPressBack,
  onPressTryAnotherDay,
  onPressRetry,
  testID,
}: BookingTimePickerScreenProps) {
  const groupedAvailable = groupTimeSlotsBySegment(availableSlots);
  const disabledSet = new Set(disabledSlots);
  const slotsForSegment = groupedAvailable[segment].map((time) => ({
    time,
    disabled: disabledSet.has(time),
  }));
  const noSlots = !loading && !errorMessage && availableSlots.length === 0;

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
        <Text style={styles.title}>Pick a time</Text>
        <Text style={styles.step}>4/5</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.dateLabel}>{formatShortDateLabel(date)}</Text>
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

        {errorMessage ? (
          <View style={styles.errorBanner} testID={testID ? `${testID}-error` : undefined}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            {onPressRetry ? (
              <Pressable
                onPress={onPressRetry}
                accessibilityRole="button"
                accessibilityLabel="Retry"
                testID={testID ? `${testID}-retry` : undefined}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.skeletonGrid} testID={testID ? `${testID}-skeleton` : undefined}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={styles.skeletonChip} />
            ))}
          </View>
        ) : noSlots ? (
          <View style={styles.empty} testID={testID ? `${testID}-empty` : undefined}>
            <View style={styles.emptyDot} />
            <Text style={styles.emptyTitle}>No times available</Text>
            {onPressTryAnotherDay ? (
              <Pressable
                onPress={onPressTryAnotherDay}
                accessibilityRole="button"
                accessibilityLabel="Try another day"
                testID={testID ? `${testID}-try-another-day` : undefined}
                style={styles.tryBtn}
              >
                <Text style={styles.tryText}>Try another day</Text>
              </Pressable>
            ) : null}
          </View>
        ) : !errorMessage ? (
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

        {!noSlots && !errorMessage ? (
          <Text style={styles.tzNote}>Times shown in {timezone}</Text>
        ) : null}
      </ScrollView>
      <StickyFooterCta
        primaryLabel="Continue"
        onPrimaryPress={onPressContinue}
        primaryDisabled={!selectedSlot || Boolean(loading) || Boolean(errorMessage) || noSlots}
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
  title: { fontSize: 20, fontWeight: "600", color: colors.foreground },
  step: { fontSize: 12, fontWeight: "500", color: colors.textMuted },
  body: { padding: spacing.pageHorizontal, paddingBottom: spacing.s24 },
  dateLabel: { fontSize: 20, fontWeight: "600", color: colors.foreground, marginBottom: spacing.s4 },
  segmentWrap: { marginBottom: spacing.s4 },
  errorBanner: {
    backgroundColor: "rgba(244, 67, 54, 0.05)",
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.sm,
    padding: spacing.s3,
    gap: spacing.s2,
    marginBottom: spacing.s4,
  },
  errorText: { color: colors.error, fontSize: 14 },
  retryBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.error,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.sm,
  },
  retryText: { color: colors.white, fontWeight: "500" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.s1 },
  cell: { width: "33.333%", padding: spacing.s1 },
  empty: { alignItems: "center", marginTop: spacing.s10, gap: spacing.s4 },
  emptyDot: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: colors.mintFresh,
  },
  emptyTitle: { fontSize: 14, color: colors.foreground, textAlign: "center" },
  tryBtn: {
    height: 40,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tryText: { color: colors.primary, fontWeight: "500" },
  tzNote: { marginTop: spacing.s4, fontSize: 12, color: colors.textMuted },
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.s1 },
  skeletonChip: {
    width: "33.333%",
    height: 44,
    padding: spacing.s1,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
  },
});
