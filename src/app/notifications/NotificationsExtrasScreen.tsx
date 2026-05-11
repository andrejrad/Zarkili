/**
 * NotificationsExtrasScreen.tsx — W31 Batch K (K.3)
 *
 * Exports:
 *   ChannelPreferencesScreen       — ChannelPreferenceMatrix + save CTA
 *   QuietHoursScreen               — start/end time pickers + day chips
 *   PermissionDeniedRecoveryScreen — deep-link to OS notification settings
 *   InAppNotificationBanner        — dismissible top-of-screen banner
 */

import { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ChannelPreferenceMatrix,
  type ChannelPreferenceMap,
  type NotificationChannel,
  type NotificationEventType,
} from "../../shared/ui/ChannelPreferenceMatrix";
import { colors, radius, spacing } from "../../shared/ui/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SaveState = "default" | "saving" | "saved" | "error";

export type ChannelPreferencesScreenProps = {
  initialPreferences: ChannelPreferenceMap;
  onSave: (prefs: ChannelPreferenceMap) => void | Promise<void>;
  testID?: string;
};

type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type QuietHoursConfig = {
  enabled: boolean;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  days: DayOfWeek[];
};

export type QuietHoursScreenProps = {
  initial: QuietHoursConfig;
  onSave: (config: QuietHoursConfig) => void | Promise<void>;
  testID?: string;
};

export type PermissionDeniedRecoveryScreenProps = {
  onDismiss: () => void;
  testID?: string;
};

export type InAppNotificationBannerProps = {
  visible: boolean;
  icon?: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// ChannelPreferencesScreen
// ---------------------------------------------------------------------------

export function ChannelPreferencesScreen({
  initialPreferences,
  onSave,
  testID,
}: ChannelPreferencesScreenProps) {
  const [prefs, setPrefs] = useState<ChannelPreferenceMap>(initialPreferences);
  const [saveState, setSaveState] = useState<SaveState>("default");

  function handleToggle(
    channel: NotificationChannel,
    eventType: NotificationEventType,
    enabled: boolean
  ) {
    setPrefs((prev) => ({
      ...prev,
      [eventType]: {
        ...prev[eventType],
        [channel]: enabled,
      },
    }));
    setSaveState("default");
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      const result = onSave(prefs);
      if (result instanceof Promise) await result;
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Notification channels</Text>
        <Text style={styles.pageSubtitle}>
          Choose how you want to be notified for each event type.
        </Text>

        <ChannelPreferenceMatrix
          preferences={prefs}
          onToggle={handleToggle}
          testID={testID ? `${testID}-matrix` : undefined}
        />

        {saveState === "error" && (
          <Text style={styles.errorText} testID={testID ? `${testID}-error` : undefined}>
            Failed to save. Please try again.
          </Text>
        )}

        <Pressable
          onPress={handleSave}
          disabled={saveState === "saving"}
          accessibilityRole="button"
          style={[styles.saveBtn, saveState === "saving" && styles.btnDisabled]}
          testID={testID ? `${testID}-save` : undefined}
        >
          <Text style={styles.saveBtnText}>
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
              ? "Saved ✓"
              : "Save preferences"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// QuietHoursScreen
// ---------------------------------------------------------------------------

/** Minimal inline time picker — production would use a native picker. */
function TimePicker({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testID?: string;
}) {
  const HOURS = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const [h, m] = value.split(":");

  return (
    <View style={styles.timePicker} testID={testID}>
      <Text style={styles.timePickerLabel}>{label}</Text>
      <View style={styles.timePickerRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeScroll}
        >
          {HOURS.map((hour) => (
            <Pressable
              key={hour}
              onPress={() => onChange(`${hour}:${m}`)}
              style={[styles.timeChip, h === hour && styles.timeChipSelected]}
              testID={testID ? `${testID}-h-${hour}` : undefined}
            >
              <Text
                style={[styles.timeChipText, h === hour && styles.timeChipTextSelected]}
              >
                {hour}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.timeColon}>:</Text>
        {["00", "15", "30", "45"].map((min) => (
          <Pressable
            key={min}
            onPress={() => onChange(`${h}:${min}`)}
            style={[styles.timeChip, m === min && styles.timeChipSelected]}
            testID={testID ? `${testID}-m-${min}` : undefined}
          >
            <Text
              style={[styles.timeChipText, m === min && styles.timeChipTextSelected]}
            >
              {min}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function QuietHoursScreen({
  initial,
  onSave,
  testID,
}: QuietHoursScreenProps) {
  const [config, setConfig] = useState<QuietHoursConfig>(initial);
  const [saveState, setSaveState] = useState<SaveState>("default");

  function toggleDay(day: DayOfWeek) {
    setConfig((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
    setSaveState("default");
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      const result = onSave(config);
      if (result instanceof Promise) await result;
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Quiet hours</Text>
        <Text style={styles.pageSubtitle}>
          Pause notifications during specific hours.
        </Text>

        <TimePicker
          label="Start time"
          value={config.startTime}
          onChange={(v) => {
            setConfig((prev) => ({ ...prev, startTime: v }));
            setSaveState("default");
          }}
          testID={testID ? `${testID}-start` : undefined}
        />
        <TimePicker
          label="End time"
          value={config.endTime}
          onChange={(v) => {
            setConfig((prev) => ({ ...prev, endTime: v }));
            setSaveState("default");
          }}
          testID={testID ? `${testID}-end` : undefined}
        />

        <View style={styles.daySection}>
          <Text style={styles.sectionLabel}>Active on</Text>
          <View style={styles.dayRow}>
            {DAYS.map((day) => {
              const active = config.days.includes(day);
              return (
                <Pressable
                  key={day}
                  onPress={() => toggleDay(day)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  testID={testID ? `${testID}-day-${day}` : undefined}
                >
                  <Text
                    style={[styles.dayChipText, active && styles.dayChipTextActive]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {saveState === "error" && (
          <Text style={styles.errorText} testID={testID ? `${testID}-error` : undefined}>
            Failed to save. Please try again.
          </Text>
        )}

        <Pressable
          onPress={handleSave}
          disabled={saveState === "saving"}
          accessibilityRole="button"
          style={[styles.saveBtn, saveState === "saving" && styles.btnDisabled]}
          testID={testID ? `${testID}-save` : undefined}
        >
          <Text style={styles.saveBtnText}>
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
              ? "Saved ✓"
              : "Save quiet hours"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// PermissionDeniedRecoveryScreen
// ---------------------------------------------------------------------------

function openNotificationSettings() {
  if (Platform.OS === "ios") {
    Linking.openURL("app-settings:");
  } else {
    Linking.openSettings();
  }
}

export function PermissionDeniedRecoveryScreen({
  onDismiss,
  testID,
}: PermissionDeniedRecoveryScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <View style={styles.recoveryContainer}>
        <Text style={styles.recoveryIcon}>🔔</Text>
        <Text style={styles.pageTitle} testID={testID ? `${testID}-title` : undefined}>
          Notifications are turned off
        </Text>
        <Text style={styles.recoveryBody}>
          To receive booking reminders and important updates, allow Zarkili to
          send you notifications in your device settings.
        </Text>
        <Pressable
          onPress={openNotificationSettings}
          accessibilityRole="button"
          style={styles.saveBtn}
          testID={testID ? `${testID}-settings` : undefined}
        >
          <Text style={styles.saveBtnText}>Open Settings</Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          testID={testID ? `${testID}-dismiss` : undefined}
        >
          <Text style={styles.ghostBtnText}>Maybe later</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// InAppNotificationBanner
// ---------------------------------------------------------------------------

export function InAppNotificationBanner({
  visible,
  icon,
  title,
  body,
  actionLabel,
  onAction,
  onDismiss,
  testID,
}: InAppNotificationBannerProps) {
  if (!visible) return null;

  return (
    <View style={styles.banner} testID={testID}>
      {icon ? <Text style={styles.bannerIcon}>{icon}</Text> : null}
      <View style={styles.bannerContent}>
        <Text
          style={styles.bannerTitle}
          numberOfLines={1}
          testID={testID ? `${testID}-title` : undefined}
        >
          {title}
        </Text>
        {body ? (
          <Text
            style={styles.bannerBody}
            numberOfLines={2}
            testID={testID ? `${testID}-body` : undefined}
          >
            {body}
          </Text>
        ) : null}
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            testID={testID ? `${testID}-action` : undefined}
          >
            <Text style={styles.bannerAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        style={styles.bannerDismiss}
        testID={testID ? `${testID}-dismiss` : undefined}
      >
        <Text style={styles.bannerDismissText}>✕</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: {
    padding: spacing.pageHorizontal,
    paddingTop: spacing.pageVertical,
    gap: spacing.s5,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
  },
  pageSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  errorText: { fontSize: 14, color: colors.error },
  saveBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: colors.surface },
  btnDisabled: { opacity: 0.4 },
  ghostBtnText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.s3,
  },
  // TimePicker
  timePicker: { gap: spacing.s2 },
  timePickerLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  timePickerRow: { flexDirection: "row", alignItems: "center", gap: spacing.s1 },
  timeScroll: { flexGrow: 0 },
  timeColon: { fontSize: 18, color: colors.foreground, marginHorizontal: spacing.s1 },
  timeChip: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.s1,
  },
  timeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeChipText: { fontSize: 13, color: colors.foreground },
  timeChipTextSelected: { color: colors.surface, fontWeight: "600" },
  // Day chips
  daySection: { gap: spacing.s2 },
  dayRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  dayChip: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: 13, color: colors.foreground },
  dayChipTextActive: { color: colors.surface, fontWeight: "600" },
  // Recovery
  recoveryContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  recoveryIcon: { fontSize: 56 },
  recoveryBody: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  // Banner
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.pageHorizontal,
    padding: spacing.s3,
    gap: spacing.s3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerIcon: { fontSize: 22 },
  bannerContent: { flex: 1, gap: spacing.s1 },
  bannerTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  bannerBody: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  bannerAction: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  bannerDismiss: { padding: spacing.s1 },
  bannerDismissText: { fontSize: 14, color: colors.textMuted },
});
