/**
 * StaffCalendarScreen.tsx — W27 Batch G screen G.2.
 *
 * Week-view calendar showing a staff member's appointment blocks.
 * Grid: rows = 30-minute slots (05:00–22:00), columns = days of the week.
 * Block vertical offset formula: ((startMin - 300) / 30) * 32
 * Block height: (durationMinutes / 30) * 32
 * SLOT_HEIGHT = 32 (half-hour) | HOUR_HEIGHT = 64 | START_MIN = 300 (05:00)
 *
 * Drag-to-reorder/resize is a W28 polish task — blocks are tap-only in W27.
 *
 * States: default | loading (shimmer blocks) | error
 */

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, radius, spacing, textStyles } from "../../shared/ui";

import type { StaffAppointment } from "./staffHelpers";

// ─── Layout constants ─────────────────────────────────────────────────────────

const SLOT_HEIGHT = 32; // px per 30-min slot
const HOUR_HEIGHT = SLOT_HEIGHT * 2; // 64px per hour
const START_MIN = 300; // 05:00 = 300 minutes from midnight
const END_MIN = 22 * 60; // 22:00
const TOTAL_SLOTS = (END_MIN - START_MIN) / 30; // 34 slots
const TOTAL_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT; // 1088px
const HOUR_LABEL_WIDTH = 44;

// ─── Types ────────────────────────────────────────────────────────────────────

export type WeekDay = {
  /** ISO-8601 date, e.g. "2026-05-11". */
  date: string;
  /** Short label, e.g. "Mon", "Tue". */
  dayLabel: string;
  /** Day of month number. */
  dayNumber: number;
  isToday: boolean;
};

export type StaffCalendarScreenProps = {
  weekDays: WeekDay[];
  appointments: StaffAppointment[];
  isLoading?: boolean;
  isError?: boolean;
  onPressRetry?: () => void;
  onPressAppointment?: (appointmentId: string) => void;
  /** Fired when user taps an empty slot — container can open "book" flow. */
  onPressEmptySlot?: (date: string, slotStartMin: number) => void;
  testID?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToMinutes(isoString: string): number {
  const d = new Date(isoString);
  return d.getHours() * 60 + d.getMinutes();
}

function blockTop(startMin: number): number {
  return ((startMin - START_MIN) / 30) * SLOT_HEIGHT;
}

function blockHeight(durationMinutes: number): number {
  return (durationMinutes / 30) * SLOT_HEIGHT;
}

function hourLabels(): number[] {
  const labels: number[] = [];
  for (let h = Math.ceil(START_MIN / 60); h <= END_MIN / 60; h++) {
    labels.push(h);
  }
  return labels;
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h} ${suffix}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function StaffCalendarScreen({
  weekDays,
  appointments,
  isLoading = false,
  isError = false,
  onPressRetry,
  onPressAppointment,
  testID,
}: StaffCalendarScreenProps) {
  const hours = hourLabels();
  const columnWidth = weekDays.length > 0
    ? `${(100 / weekDays.length).toFixed(2)}%`
    : "14.28%";

  if (isError) {
    return (
      <View style={[styles.root, styles.centered]} testID={testID}>
        <Text style={styles.errorTitle}>{"Couldn't load the calendar"}</Text>
        <Text style={styles.errorBody}>Check your connection and try again.</Text>
        {onPressRetry && (
          <Pressable style={styles.retryBtn} onPress={onPressRetry} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.root} testID={testID}>
      {/* Day header row */}
      <View style={styles.dayHeaderRow}>
        {/* Hour label spacer */}
        <View style={{ width: HOUR_LABEL_WIDTH }} />
        {weekDays.map((day) => (
          <View
            key={day.date}
            style={[styles.dayHeader, { flex: 1 }, day.isToday && styles.dayHeaderToday]}
          >
            <Text style={[styles.dayName, day.isToday && styles.dayNameToday]}>
              {day.dayLabel}
            </Text>
            <View style={[styles.dayNumberChip, day.isToday && styles.dayNumberChipToday]}>
              <Text style={[styles.dayNumber, day.isToday && styles.dayNumberToday]}>
                {day.dayNumber}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Scrollable grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.gridContainer, { height: TOTAL_HEIGHT }]}>
          {/* Hour label column */}
          <View style={[styles.hourColumn, { width: HOUR_LABEL_WIDTH }]}>
            {hours.map((h) => (
              <View
                key={h}
                style={[styles.hourCell, { height: HOUR_HEIGHT }]}
              >
                <Text style={styles.hourLabel}>{formatHour(h)}</Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          <View style={styles.dayColumns}>
            {weekDays.map((day) => {
              const dayAppts = appointments.filter((a) =>
                a.startTime.startsWith(day.date)
              );
              return (
                <View key={day.date} style={[styles.dayColumn, { flex: 1 }]}>
                  {/* Hour background lines */}
                  {hours.map((h) => (
                    <View
                      key={h}
                      style={[styles.hourLine, { top: (h - Math.ceil(START_MIN / 60)) * HOUR_HEIGHT }]}
                    />
                  ))}

                  {/* Loading shimmer blocks */}
                  {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.apptBlock,
                            styles.shimmerBlock,
                            { top: i * (SLOT_HEIGHT * 3) + SLOT_HEIGHT, height: SLOT_HEIGHT * 2 },
                          ]}
                        />
                      ))
                    : dayAppts.map((appt) => {
                        const startMin = isoToMinutes(appt.startTime);
                        const top = blockTop(startMin);
                        const height = blockHeight(appt.durationMinutes);
                        return (
                          <ApptBlock
                            key={appt.id}
                            appointment={appt}
                            top={top}
                            height={height}
                            onPress={() => onPressAppointment?.(appt.id)}
                          />
                        );
                      })}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── ApptBlock sub-component ──────────────────────────────────────────────────

function ApptBlock({
  appointment,
  top,
  height,
  onPress,
}: {
  appointment: StaffAppointment;
  top: number;
  height: number;
  onPress?: () => void;
}) {
  const isInService = appointment.status === "in-service";
  const isCompleted = appointment.status === "completed";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.apptBlock,
        isInService && styles.apptBlockInService,
        isCompleted && styles.apptBlockCompleted,
        pressed && styles.apptBlockPressed,
        { top, height },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${appointment.service} — ${appointment.clientName}, ${appointment.startTime}`}
    >
      <Text style={styles.apptClientName} numberOfLines={1}>
        {appointment.clientName}
      </Text>
      {height >= SLOT_HEIGHT * 2 && (
        <Text style={styles.apptServiceName} numberOfLines={1}>
          {appointment.service}
        </Text>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
  },

  // Day header row
  dayHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.s2,
  },
  dayHeader: {
    alignItems: "center",
    gap: 2,
  },
  dayHeaderToday: {},
  dayName: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  dayNameToday: {
    color: colors.primary,
    fontWeight: "600",
  },
  dayNumberChip: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  dayNumberChipToday: {
    backgroundColor: colors.primary,
  },
  dayNumber: {
    ...textStyles.label,
    color: "#1A1A1A",
    textAlign: "center",
  },
  dayNumberToday: {
    color: colors.white,
    fontWeight: "600",
  },

  // Grid
  gridContainer: {
    flexDirection: "row",
    position: "relative",
  },
  hourColumn: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  hourCell: {
    justifyContent: "flex-start",
    paddingTop: 2,
    paddingHorizontal: 4,
  },
  hourLabel: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  dayColumns: {
    flex: 1,
    flexDirection: "row",
    position: "relative",
  },
  dayColumn: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
    position: "relative",
  },
  hourLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },

  // Appointment blocks
  apptBlock: {
    position: "absolute",
    left: 2,
    right: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.primary20,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    overflow: "hidden",
  },
  apptBlockInService: {
    backgroundColor: "rgba(76,175,80,0.15)",
    borderLeftColor: "#4CAF50",
  },
  apptBlockCompleted: {
    backgroundColor: colors.disabledBg,
    borderLeftColor: colors.disabled,
  },
  apptBlockPressed: {
    opacity: 0.75,
  },
  apptClientName: {
    ...textStyles.labelSmall,
    fontWeight: "600",
    color: "#1A1A1A",
    fontSize: 11,
  },
  apptServiceName: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
    fontSize: 10,
  },

  // Shimmer
  shimmerBlock: {
    backgroundColor: "#EDE8D8",
    left: 2,
    right: 2,
    borderRadius: radius.sm,
    position: "absolute",
    borderLeftWidth: 0,
  },

  // Error
  errorTitle: {
    ...textStyles.heading3,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: spacing.elementGapSmall,
  },
  errorBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sectionGap,
  },
  retryBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  retryBtnText: {
    ...textStyles.label,
    fontWeight: "600",
    color: colors.white,
  },
});
