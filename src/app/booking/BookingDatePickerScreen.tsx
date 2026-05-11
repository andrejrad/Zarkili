/**
 * BookingDatePickerScreen.tsx — C.3 Date Picker (Booking step 3/5).
 *
 * Locked spec: design-handoff/specs/screen-booking-date-picker.json.
 * Composes CalendarGrid + quick-pick chips + month switcher + sticky footer.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  CalendarGrid,
  StickyFooterCta,
  colors,
  radius,
  spacing,
  toIsoDate,
} from "../../shared/ui";
import {
  formatLongDateLabel,
  type BookingStaffOption,
} from "./bookingHelpers";

export type DatePickerQuickPick = "today" | "tomorrow" | "this-weekend";

export type BookingDatePickerScreenProps = {
  /** Reference month to render (any date in target month works). */
  month: Date;
  selectedDate: Date | null;
  disabledDates?: Date[];
  holidays?: Date[];
  /** Per-day availability: ISO yyyy-mm-dd → { staffName, slotCount }. */
  availabilityMap?: Record<string, { staffName?: string; slotCount: number }>;
  /** Optional banner shown for holidays affecting hours. */
  holidayBanner?: { name: string; message?: string } | null;
  staff?: BookingStaffOption | null;
  loading?: boolean;
  errorMessage?: string;
  onSelectDate: (date: Date) => void;
  onChangeMonth: (delta: -1 | 1) => void;
  onPressQuickPick?: (which: DatePickerQuickPick) => void;
  onPressContinue: () => void;
  onPressBack?: () => void;
  onPressRetry?: () => void;
  testID?: string;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function BookingDatePickerScreen({
  month,
  selectedDate,
  disabledDates,
  holidays,
  availabilityMap,
  holidayBanner,
  staff,
  loading,
  errorMessage,
  onSelectDate,
  onChangeMonth,
  onPressQuickPick,
  onPressContinue,
  onPressBack,
  onPressRetry,
  testID,
}: BookingDatePickerScreenProps) {
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
        <Text style={styles.title}>Pick a date</Text>
        <Text style={styles.step}>3/5</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.quickPicks}>
          {(["today", "tomorrow", "this-weekend"] as const).map((id) => (
            <Pressable
              key={id}
              onPress={() => onPressQuickPick?.(id)}
              accessibilityRole="button"
              accessibilityLabel={
                id === "today" ? "Today" : id === "tomorrow" ? "Tomorrow" : "This weekend"
              }
              testID={testID ? `${testID}-qp-${id}` : undefined}
              style={styles.qpChip}
            >
              <Text style={styles.qpText}>
                {id === "today" ? "Today" : id === "tomorrow" ? "Tomorrow" : "This weekend"}
              </Text>
            </Pressable>
          ))}
        </View>

        {holidayBanner ? (
          <View style={styles.holidayBanner} testID={testID ? `${testID}-holiday-banner` : undefined}>
            <View style={styles.holidayDot} />
            <Text style={styles.holidayText}>
              {holidayBanner.name}{holidayBanner.message ? ` — ${holidayBanner.message}` : " — limited hours"}
            </Text>
          </View>
        ) : null}

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

        <View style={styles.monthSwitcher}>
          <Pressable
            onPress={() => onChangeMonth(-1)}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            testID={testID ? `${testID}-prev-month` : undefined}
            style={styles.monthBtn}
          >
            <Text style={styles.monthChev}>{"\u2039"}</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable
            onPress={() => onChangeMonth(1)}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            testID={testID ? `${testID}-next-month` : undefined}
            style={styles.monthBtn}
          >
            <Text style={styles.monthChev}>{"\u203A"}</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.skeletonGrid} testID={testID ? `${testID}-skeleton` : undefined}>
            {Array.from({ length: 42 }).map((_, i) => (
              <View key={i} style={styles.skeletonCell} />
            ))}
          </View>
        ) : !errorMessage ? (
          <CalendarGrid
            month={month}
            selectedDate={selectedDate}
            disabledDates={disabledDates}
            holidays={holidays}
            availabilityMap={availabilityMap}
            onSelectDate={onSelectDate}
            testID={testID ? `${testID}-grid` : undefined}
          />
        ) : null}

        {selectedDate && !loading && !errorMessage ? (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedLabel}>{formatLongDateLabel(selectedDate)}</Text>
            <Text style={styles.availabilityLabel}>
              {isFullyBooked
                ? "Fully booked"
                : selectedAvailability
                  ? `${staff?.name ?? selectedAvailability.staffName ?? "Staff"} has ${selectedAvailability.slotCount} slots available`
                  : "Tap to see times"}
            </Text>
          </View>
        ) : null}
      </ScrollView>
      <StickyFooterCta
        primaryLabel="Continue"
        onPrimaryPress={onPressContinue}
        primaryDisabled={!selectedDate || isFullyBooked || Boolean(loading) || Boolean(errorMessage)}
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
  quickPicks: { flexDirection: "row", gap: spacing.s3, marginBottom: spacing.s4 },
  qpChip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  qpText: { color: colors.white, fontSize: 12, fontWeight: "500" },
  holidayBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
    padding: spacing.s3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.creamSilk,
    marginBottom: spacing.s4,
  },
  holidayDot: {
    width: 4,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.mintFresh,
  },
  holidayText: { fontSize: 12, color: colors.foreground, flex: 1 },
  errorBanner: {
    backgroundColor: "rgba(244, 67, 54, 0.05)",
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.sm,
    padding: spacing.s3,
    marginBottom: spacing.s4,
    gap: spacing.s2,
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
  monthSwitcher: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.s2,
  },
  monthBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  monthChev: { fontSize: 24, color: colors.foreground },
  monthLabel: { fontSize: 20, fontWeight: "600", color: colors.foreground },
  selectedInfo: { marginTop: spacing.s4, gap: spacing.s1 },
  selectedLabel: { fontSize: 14, color: colors.foreground },
  availabilityLabel: { fontSize: 12, color: colors.textMuted },
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap" },
  skeletonCell: {
    width: `${100 / 7}%`,
    height: 44,
    padding: 4,
  },
});
