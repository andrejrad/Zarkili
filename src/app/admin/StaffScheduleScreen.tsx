/**
 * W41 — StaffScheduleScreen
 *
 * Weekly availability template editor for a single staff member.
 * Shows day-by-day time blocks and a list of one-off exceptions (date overrides
 * and closed days).  W41-DEBT-5 adds inline edit mode for per-day hours.
 */
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import type { ScheduleWeekday, StaffScheduleTemplate } from "../../domains/staff";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Editable per-day hours: start "HH:MM" or "" for off */
export type EditDayHours = {
  enabled: boolean;
  start: string;
  end: string;
};

/** Map of weekday → editable hours; built from schedule by the shell */
export type EditWeekHours = Record<ScheduleWeekday, EditDayHours>;

export type StaffScheduleScreenProps = {
  staffName: string;
  loading: boolean;
  error: string | null;
  schedule: StaffScheduleTemplate | null;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
  // --- Edit mode ---
  editMode?: boolean;
  onToggleEditMode?: () => void;
  /** Controlled edit state supplied by the shell */
  editWeekHours?: EditWeekHours;
  onToggleDay?: (day: ScheduleWeekday, enabled: boolean) => void;
  onUpdateDayStart?: (day: ScheduleWeekday, value: string) => void;
  onUpdateDayEnd?: (day: ScheduleWeekday, value: string) => void;
  onSaveSchedule?: () => void;
  scheduleSaving?: boolean;
  scheduleSaveError?: string | null;
  scheduleSaveSuccess?: string | null;
};

const WEEKDAY_LABELS: Record<ScheduleWeekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const WEEKDAY_ORDER: ScheduleWeekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StaffScheduleScreen({
  staffName,
  loading,
  error,
  schedule,
  onRetry,
  onBack,
  testID,
  editMode = false,
  onToggleEditMode,
  editWeekHours,
  onToggleDay,
  onUpdateDayStart,
  onUpdateDayEnd,
  onSaveSchedule,
  scheduleSaving = false,
  scheduleSaveError = null,
  scheduleSaveSuccess = null,
}: StaffScheduleScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID ?? "staff-schedule-screen"}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ {staffName}</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Schedule</Text>
      <Text style={styles.pageSubtitle}>Weekly availability template</Text>

      {/* Edit toggle */}
      {onToggleEditMode ? (
        <Pressable
          accessibilityRole="button"
          onPress={onToggleEditMode}
          style={styles.editToggleBtn}
          testID="schedule-edit-toggle"
        >
          <Text style={styles.editToggleLabel}>{editMode ? "Cancel" : "Edit hours"}</Text>
        </Pressable>
      ) : null}

      {loading ? <AdminLoadingState label="Loading schedule…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {!loading && !error && !schedule && !editMode ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyLabel}>No schedule set. Contact the owner to configure availability.</Text>
        </View>
      ) : null}

      {/* ---- EDIT MODE ---- */}
      {editMode && editWeekHours ? (
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Edit weekly hours</Text>
          {WEEKDAY_ORDER.map((day) => {
            const hours = editWeekHours[day];
            return (
              <View key={day} style={styles.editDayBlock} testID={`schedule-edit-${day}`}>
                <View style={styles.editDayHeaderRow}>
                  <Text style={styles.dayLabel}>{WEEKDAY_LABELS[day]}</Text>
                  <Switch
                    accessibilityLabel={`${WEEKDAY_LABELS[day]} enabled`}
                    onValueChange={(val) => onToggleDay?.(day, val)}
                    testID={`schedule-toggle-${day}`}
                    value={hours.enabled}
                  />
                </View>
                {hours.enabled ? (
                  <View style={styles.editTimeRow}>
                    <TextInput
                      accessibilityLabel={`${WEEKDAY_LABELS[day]} start time`}
                      onChangeText={(v) => onUpdateDayStart?.(day, v)}
                      placeholder="09:00"
                      style={styles.timeInput}
                      testID={`schedule-start-${day}`}
                      value={hours.start}
                    />
                    <Text style={styles.timeSep}>–</Text>
                    <TextInput
                      accessibilityLabel={`${WEEKDAY_LABELS[day]} end time`}
                      onChangeText={(v) => onUpdateDayEnd?.(day, v)}
                      placeholder="18:00"
                      style={styles.timeInput}
                      testID={`schedule-end-${day}`}
                      value={hours.end}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}

          {scheduleSaveError ? (
            <Text style={styles.errorText} testID="schedule-save-error">
              {scheduleSaveError}
            </Text>
          ) : null}
          {scheduleSaveSuccess ? (
            <Text style={styles.successText} testID="schedule-save-success">
              {scheduleSaveSuccess}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={scheduleSaving}
            onPress={onSaveSchedule}
            style={[styles.saveBtn, scheduleSaving && styles.saveBtnDisabled]}
            testID="schedule-save-btn"
          >
            <Text style={styles.saveBtnLabel}>
              {scheduleSaving ? "Saving…" : "Save schedule"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* ---- DISPLAY MODE ---- */}
      {!editMode && schedule ? (
        <>
          <Text style={styles.sectionHeader}>Weekly template</Text>
          <View style={styles.card}>
            {WEEKDAY_ORDER.map((day) => {
              const blocks = schedule.weekTemplate[day];
              return (
                <View key={day} style={styles.dayRow} testID={`schedule-day-${day}`}>
                  <Text style={styles.dayLabel}>{WEEKDAY_LABELS[day]}</Text>
                  {blocks && blocks.length > 0 ? (
                    <Text style={styles.dayBlocks}>
                      {blocks.map((b) => `${b.start}–${b.end}`).join(", ")}
                    </Text>
                  ) : (
                    <Text style={styles.dayOff}>Off</Text>
                  )}
                </View>
              );
            })}
          </View>

          <Text style={styles.sectionHeader}>Date exceptions</Text>
          {schedule.exceptions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyLabel}>No exceptions defined.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {schedule.exceptions.map((ex) => (
                <View key={ex.date} style={styles.exceptionRow} testID={`schedule-exception-${ex.date}`}>
                  <Text style={styles.dayLabel}>{ex.date}</Text>
                  {ex.isClosed ? (
                    <Text style={styles.dayOff}>Closed</Text>
                  ) : (
                    <Text style={styles.dayBlocks}>
                      {ex.blocks.map((b) => `${b.start}–${b.end}`).join(", ")}
                    </Text>
                  )}
                  {ex.note ? <Text style={styles.exceptionNote}>{ex.note}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    padding: 16,
    gap: 12,
  },
  backRow: {
    marginBottom: 4,
  },
  backLabel: {
    fontSize: 14,
    color: "#5E3A8C",
    fontFamily: brandTypography.medium,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: brandTypography.semibold,
    color: "#1A1A2E",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#6B6B6B",
    fontFamily: brandTypography.regular,
    marginBottom: 8,
  },
  editToggleBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#5E3A8C",
  },
  editToggleLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#5E3A8C",
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: brandTypography.semibold,
    color: "#1A1A2E",
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#E5E0D1",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: "#E5E0D1",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FAFAFA",
  },
  emptyLabel: {
    fontSize: 14,
    color: "#6B6B6B",
    fontFamily: brandTypography.regular,
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exceptionRow: {
    gap: 2,
  },
  dayLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#1A1A2E",
    flex: 1,
  },
  dayBlocks: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#333333",
  },
  dayOff: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#9E9E9E",
  },
  exceptionNote: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
    fontStyle: "italic",
  },
  // Edit mode
  editDayBlock: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingVertical: 8,
    gap: 6,
  },
  editDayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#1A1A2E",
    width: 80,
    textAlign: "center",
  },
  timeSep: {
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#D00",
    textAlign: "center",
  },
  successText: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#0A8A0A",
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: "#5E3A8C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnLabel: {
    fontSize: 15,
    fontFamily: brandTypography.semibold,
    color: "#FFFFFF",
  },
});
