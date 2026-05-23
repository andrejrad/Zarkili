/**
 * NotificationPreferencesScreen.tsx — F.5 Notification Preferences.
 *
 * Channel matrix: Push / Email / SMS sections, each with PreferenceToggleRow for
 * each of the 6 notification preference keys.
 * Quiet Hours section: start + end time + day-of-week chips.
 * "Reset to defaults" button.
 * System-permission-denied banner when !hasSystemPermission.
 * TCPA: SMS promotions row shows "Requires prior consent" helper.
 * CAN-SPAM: email promotions row shows "You may unsubscribe at any time" helper.
 */

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Banner,
  PreferenceToggleRow,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import {
  NOTIFICATION_PREFERENCE_LABELS,
  NotificationChannel,
  NotificationPreferenceKey,
  NotificationPreferences,
  QUIET_DAYS_ALL,
  QuietDay,
} from "../messaging/messagingHelpers";

const CHANNELS: { key: NotificationChannel; label: string }[] = [
  { key: "push", label: "Push notifications" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
];

const PREF_KEYS: NotificationPreferenceKey[] = [
  "bookingReminders",
  "bookingChanges",
  "promotions",
  "newSalonsNearby",
  "loyaltyUpdates",
  "reviewRequests",
];

const DAY_LABELS: Record<QuietDay, string> = {
  Sun: "Sun",
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
  Sat: "Sat",
};

function getSmsHelper(key: NotificationPreferenceKey): string | undefined {
  if (key === "promotions") return "Requires prior consent (TCPA).";
  return undefined;
}

function getEmailHelper(key: NotificationPreferenceKey): string | undefined {
  if (key === "promotions") return "You may unsubscribe at any time.";
  return undefined;
}

export type NotificationPreferencesScreenProps = {
  preferences: NotificationPreferences;
  onToggle: (key: NotificationPreferenceKey, channel: NotificationChannel, value: boolean) => void;
  quietHoursStart: string;
  quietHoursEnd: string;
  onQuietHoursStartChange: (t: string) => void;
  onQuietHoursEndChange: (t: string) => void;
  quietDays: QuietDay[];
  onToggleQuietDay: (day: QuietDay) => void;
  hasSystemPermission: boolean;
  onResetDefaults: () => void;
  isSaving?: boolean;
  testID?: string;
};

export function NotificationPreferencesScreen({
  preferences,
  onToggle,
  quietHoursStart,
  quietHoursEnd,
  onQuietHoursStartChange,
  onQuietHoursEndChange,
  quietDays,
  onToggleQuietDay,
  hasSystemPermission,
  onResetDefaults,
  isSaving,
  testID,
}: NotificationPreferencesScreenProps) {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      {/* System permission banner */}
      {!hasSystemPermission ? (
        <Banner
          variant="warning"
          title="Notifications are disabled"
          message="Enable notifications in your device settings to receive alerts."
          testID={testID ? `${testID}-permission-denied-banner` : undefined}
        />
      ) : null}

      {/* Channel matrix */}
      {CHANNELS.map((ch) => (
        <View key={ch.key} style={styles.section}>
          <Text style={styles.sectionTitle}>{ch.label}</Text>
          {PREF_KEYS.map((key) => {
            const helperText =
              ch.key === "sms"
                ? getSmsHelper(key)
                : ch.key === "email"
                ? getEmailHelper(key)
                : undefined;

            const isDisabled =
              !hasSystemPermission || (ch.key === "push" && false);

            return (
              <PreferenceToggleRow
                key={key}
                label={NOTIFICATION_PREFERENCE_LABELS[key]}
                helperText={helperText}
                value={preferences[key][ch.key]}
                onValueChange={(v) => onToggle(key, ch.key, v)}
                disabled={isDisabled || isSaving}
                testID={
                  testID ? `${testID}-pref-${key}-${ch.key}` : undefined
                }
              />
            );
          })}
        </View>
      ))}

      {/* Quiet Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet hours</Text>
        <Text style={styles.sectionHelper}>
          No notifications will be sent during quiet hours.
        </Text>

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.timeLabel}>Start</Text>
            <TextInput
              style={styles.timeInput}
              value={quietHoursStart}
              onChangeText={onQuietHoursStartChange}
              placeholder="HH:MM"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="Quiet hours start time"
              testID={testID ? `${testID}-quiet-start` : undefined}
            />
          </View>
          <Text style={styles.timeSeparator}>–</Text>
          <View style={styles.timeField}>
            <Text style={styles.timeLabel}>End</Text>
            <TextInput
              style={styles.timeInput}
              value={quietHoursEnd}
              onChangeText={onQuietHoursEndChange}
              placeholder="HH:MM"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="Quiet hours end time"
              testID={testID ? `${testID}-quiet-end` : undefined}
            />
          </View>
        </View>

        <Text style={[styles.timeLabel, { marginTop: spacing.s3, marginBottom: spacing.s2 }]}>
          Days
        </Text>
        <View style={styles.daysRow}>
          {QUIET_DAYS_ALL.map((day) => {
            const active = quietDays.includes(day);
            return (
              <Pressable
                key={day}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => onToggleQuietDay(day)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                accessibilityLabel={DAY_LABELS[day]}
                testID={testID ? `${testID}-day-${day}` : undefined}
              >
                <Text
                  style={[styles.dayChipText, active && styles.dayChipTextActive]}
                >
                  {DAY_LABELS[day]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Reset to defaults */}
      <Pressable
        style={styles.resetBtn}
        onPress={onResetDefaults}
        accessibilityRole="button"
        accessibilityLabel="Reset notification preferences to defaults"
        testID={testID ? `${testID}-reset-defaults` : undefined}
        disabled={isSaving}
      >
        <Text style={styles.resetBtnText}>Reset to defaults</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.s6,
    gap: spacing.s4,
  },
  section: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: spacing.s1,
  },
  sectionTitle: {
    ...textStyles.label,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.s1,
  },
  sectionHelper: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.s2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.s3,
    marginVertical: spacing.s2,
  },
  timeField: {
    flex: 1,
    gap: spacing.s1,
  },
  timeLabel: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  timeInput: {
    height: spacing.touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s3,
    ...textStyles.body,
    color: colors.foreground,
  },
  timeSeparator: {
    ...textStyles.body,
    color: colors.textMuted,
    paddingBottom: spacing.s2,
  },
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s2,
    marginBottom: spacing.s2,
  },
  dayChip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  dayChipTextActive: {
    color: colors.white,
    fontWeight: "600",
  },
  resetBtn: {
    marginHorizontal: spacing.pageHorizontal,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: spacing.s2,
  },
  resetBtnText: {
    ...textStyles.body,
    color: colors.error,
    fontWeight: "600",
  },
});
