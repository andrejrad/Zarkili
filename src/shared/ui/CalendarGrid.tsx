/**
 * CalendarGrid.tsx — C.C1 calendar-grid primitive.
 *
 * Locked spec: design-handoff/components/calendar-grid.json (Batch C, 2026-04-27).
 *
 * Month view, 7 cols x 6 rows. Sun-start (US). Cells 44x44.
 * - Today: 1px coral ring.
 * - Selected: filled coral, white text.
 * - Disabled: 30% opacity, no interaction.
 * - Holiday: 4x4 mint-fresh dot below number (bumped from spec's 2x2 for visibility).
 *
 * Screen layer (BookingDatePickerScreen) owns the quick-pick chip row, month
 * switcher, and selected-date info. This component renders only the grid.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type CalendarAvailability = {
  staffName?: string;
  slotCount: number;
};

export type CalendarGridProps = {
  /** First day of the month to render (any date in target month works). */
  month: Date;
  /** Currently selected date or null. */
  selectedDate?: Date | null;
  /** Earliest selectable date. Any date before this is disabled. Defaults to today. */
  minDate?: Date;
  /** Dates that are fully booked or otherwise non-selectable. */
  disabledDates?: Date[];
  /** Dates flagged as holidays (renders mint dot). */
  holidays?: Date[];
  /** Availability lookup keyed by ISO yyyy-mm-dd. */
  availabilityMap?: Record<string, CalendarAvailability>;
  onSelectDate?: (date: Date) => void;
  testID?: string;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthCells(month: Date): Array<Date | null> {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = first.getDay(); // 0 = Sun
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length < 42) cells.push(null);
  return cells;
}

export function CalendarGrid({
  month,
  selectedDate,
  minDate,
  disabledDates = [],
  holidays = [],
  availabilityMap = {},
  onSelectDate,
  testID,
}: CalendarGridProps) {
  const today = new Date();
  // Normalise minDate to start-of-day so same-day comparisons work correctly.
  const minDay = minDate
    ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    : new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const cells = buildMonthCells(month);
  const monthLabel = `${MONTH_NAMES[month.getMonth()]} ${month.getFullYear()}`;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.weekdayRow} accessibilityRole="header">
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Text style={styles.weekdayLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <View
        style={styles.grid}
        accessibilityLabel={`Calendar for ${monthLabel}`}
      >
        {cells.map((date, idx) => {
          if (!date) {
            return <View key={`empty-${idx}`} style={styles.cell} />;
          }
          const iso = toIsoDate(date);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isPast = date < minDay;
          const isDisabled = isPast || disabledDates.some((d) => isSameDay(d, date));
          const isHoliday = holidays.some((d) => isSameDay(d, date));
          const availability = availabilityMap[iso];
          const slotCount = availability?.slotCount ?? 0;

          const a11yLabel = isPast
            ? `${WEEKDAY_LABELS[date.getDay()]} ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, not available`
            : isDisabled
              ? `${WEEKDAY_LABELS[date.getDay()]} ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, fully booked`
              : `${WEEKDAY_LABELS[date.getDay()]} ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${slotCount} slots available`;

          return (
            <Pressable
              key={iso}
              onPress={isDisabled ? undefined : () => onSelectDate?.(date)}
              disabled={isDisabled}
              accessibilityRole="button"
              accessibilityLabel={a11yLabel}
              accessibilityState={{ disabled: isDisabled, selected: isSelected }}
              testID={testID ? `${testID}-cell-${iso}` : undefined}
              style={[
                styles.cell,
                isToday && !isSelected ? styles.cellToday : null,
                isSelected ? styles.cellSelected : null,
                isDisabled ? styles.cellDisabled : null,
              ]}
            >
              <Text
                style={[
                  styles.cellText,
                  isSelected ? styles.cellTextSelected : null,
                ]}
              >
                {date.getDate()}
              </Text>
              {isHoliday ? <View style={styles.holidayDot} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL = 44;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  weekdayRow: {
    flexDirection: "row",
  },
  weekdayCell: {
    width: CELL,
    height: CELL,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: colors.textMuted,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    height: CELL,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cellToday: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
  },
  cellSelected: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  cellDisabled: {
    opacity: 0.3,
  },
  cellText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: colors.foreground,
  },
  cellTextSelected: {
    color: colors.white,
  },
  holidayDot: {
    position: "absolute",
    bottom: spacing.s1,
    width: 4,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.mintFresh,
  },
});
