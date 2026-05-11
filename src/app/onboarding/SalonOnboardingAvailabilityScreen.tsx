/**
 * SalonOnboardingAvailabilityScreen.tsx — Salon onboarding step 7/9.
 *
 * Set weekly opening hours — toggle each day and enter open/close times.
 * W37-DEBT-7 closed.
 */

import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { Banner, Button, InputField, Stepper, colors, radius, spacing } from "../../shared/ui";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DaySchedule = {
  open: boolean;
  openTime: string;
  closeTime: string;
};

export type WeekTemplate = Record<DayKey, DaySchedule>;

export type SalonOnboardingAvailabilityScreenProps = {
  totalSteps: number;
  currentStep: number;
  initialWeekTemplate?: Partial<WeekTemplate>;
  onContinue: (data: { weekTemplate: WeekTemplate }) => Promise<void>;
  onBack?: () => void;
};

const ALL_DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const DEFAULT_DAY: DaySchedule = { open: false, openTime: "09:00", closeTime: "18:00" };

function buildDefault(initial?: Partial<WeekTemplate>): WeekTemplate {
  const result: Partial<WeekTemplate> = {};
  const workdays: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
  for (const d of ALL_DAYS) {
    const preset = initial?.[d.key];
    result[d.key] = preset ?? { ...DEFAULT_DAY, open: workdays.includes(d.key) };
  }
  return result as WeekTemplate;
}

const TIME_RE = /^\d{2}:\d{2}$/;

export function SalonOnboardingAvailabilityScreen({
  totalSteps,
  currentStep,
  initialWeekTemplate,
  onContinue,
  onBack,
}: SalonOnboardingAvailabilityScreenProps) {
  const [week, setWeek] = useState<WeekTemplate>(() => buildDefault(initialWeekTemplate));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleDay(key: DayKey, value: boolean) {
    setWeek((prev) => ({ ...prev, [key]: { ...prev[key], open: value } }));
  }

  function setTime(key: DayKey, field: "openTime" | "closeTime", value: string) {
    setWeek((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  async function handleContinue() {
    setError(null);
    const openDays = (Object.keys(week) as DayKey[]).filter((k) => week[k].open);
    if (openDays.length === 0) {
      setError("Please set at least one open day.");
      return;
    }
    for (const k of openDays) {
      const d = week[k];
      if (!TIME_RE.test(d.openTime) || !TIME_RE.test(d.closeTime)) {
        setError(`Use HH:MM format for times (e.g. 09:00).`);
        return;
      }
      if (d.openTime >= d.closeTime) {
        const label = ALL_DAYS.find((x) => x.key === k)?.label ?? k;
        setError(`${label}: close time must be after open time.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await onContinue({ weekTemplate: week });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save availability.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="salon-availability-stepper" />
      <Text style={styles.heading} accessibilityRole="header">Opening hours</Text>
      <Text style={styles.body}>Set the days and times your salon is open for bookings.</Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      {ALL_DAYS.map(({ key, label }) => {
        const day = week[key];
        return (
          <View key={key} style={styles.dayRow}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayLabel, !day.open && styles.dayLabelOff]}>{label}</Text>
              <Switch
                value={day.open}
                onValueChange={(v) => toggleDay(key, v)}
                disabled={submitting}
                accessibilityLabel={label}
                testID={`salon-availability-toggle-${key}`}
              />
            </View>
            {day.open ? (
              <View style={styles.timesRow}>
                <View style={styles.timeField}>
                  <InputField
                    label="Open"
                    value={day.openTime}
                    onChangeText={(v) => setTime(key, "openTime", v)}
                    placeholder="09:00"
                    disabled={submitting}
                    testID={`salon-availability-open-${key}`}
                  />
                </View>
                <View style={styles.timeField}>
                  <InputField
                    label="Close"
                    value={day.closeTime}
                    onChangeText={(v) => setTime(key, "closeTime", v)}
                    placeholder="18:00"
                    disabled={submitting}
                    testID={`salon-availability-close-${key}`}
                  />
                </View>
              </View>
            ) : null}
          </View>
        );
      })}

      <View style={styles.actions}>
        <Button
          label="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          disabled={submitting}
          testID="salon-availability-continue"
        />
        {onBack ? (
          <Button label="Back" onPress={onBack} variant="secondary" size="large" disabled={submitting} testID="salon-availability-back" />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: "800", color: colors.foreground, marginBottom: spacing.s2 },
  body: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.s4 },
  bannerWrap: { marginBottom: spacing.s3 },
  dayRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s3,
    marginBottom: spacing.s2,
  },
  dayHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayLabel: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  dayLabelOff: { color: colors.textMuted },
  timesRow: { flexDirection: "row", gap: spacing.s3, marginTop: spacing.s2 },
  timeField: { flex: 1 },
  actions: { marginTop: spacing.s4, gap: spacing.s2 },
});
