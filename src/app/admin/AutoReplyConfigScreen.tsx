/**
 * W46 — AutoReplyConfigScreen
 *
 * Configure automated out-of-hours replies for the messaging inbox.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { AutoReplyConfig, AutoReplyDay } from "../../domains/messaging/messagingAdminModel";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type AutoReplyConfigScreenProps = {
  loading: boolean;
  error: string | null;
  config: AutoReplyConfig | null;
  form: AutoReplyConfig;
  saving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  onFormChange: <K extends keyof AutoReplyConfig>(field: K, value: AutoReplyConfig[K]) => void;
  onSave: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const ALL_DAYS: { label: string; value: AutoReplyDay }[] = [
  { label: "Mon", value: "mon" },
  { label: "Tue", value: "tue" },
  { label: "Wed", value: "wed" },
  { label: "Thu", value: "thu" },
  { label: "Fri", value: "fri" },
  { label: "Sat", value: "sat" },
  { label: "Sun", value: "sun" },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function AutoReplyConfigScreen({
  loading,
  error,
  form,
  saving,
  saveError,
  saveSuccess,
  onFormChange,
  onSave,
  onRetry,
  onBack,
  testID = "auto-reply-config-screen",
}: AutoReplyConfigScreenProps) {
  function toggleDay(day: AutoReplyDay) {
    const current = form.enabledDays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    onFormChange("enabledDays", next);
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Auto-Reply Config</Text>
      </View>

      {loading ? <AdminLoadingState label="Loading config…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {!loading && !error ? (
        <View style={styles.card}>
          {/* Master toggle */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Auto-Reply Enabled</Text>
            <Switch
              value={form.enabled}
              onValueChange={(v) => onFormChange("enabled", v)}
              testID="enabled-switch"
            />
          </View>

          {/* Enabled days */}
          <Text style={styles.sectionLabel}>Active Days</Text>
          <View style={styles.daysRow}>
            {ALL_DAYS.map(({ label, value }) => {
              const active = form.enabledDays.includes(value);
              return (
                <Pressable
                  key={value}
                  onPress={() => toggleDay(value)}
                  testID={`day-${value}`}
                  style={[styles.dayBtn, active && styles.dayBtnActive]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.dayBtnText, active && styles.dayBtnTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Hours */}
          <View style={styles.hoursRow}>
            <View style={styles.hourField}>
              <Text style={styles.sectionLabel}>Open Hour (0–23)</Text>
              <TextInput
                value={String(form.openHour)}
                onChangeText={(v) => onFormChange("openHour", parseInt(v, 10) || 0)}
                keyboardType="number-pad"
                style={styles.hourInput}
                testID="open-hour-input"
                accessibilityLabel="Open hour"
              />
            </View>
            <View style={styles.hourField}>
              <Text style={styles.sectionLabel}>Close Hour (0–23)</Text>
              <TextInput
                value={String(form.closeHour)}
                onChangeText={(v) => onFormChange("closeHour", parseInt(v, 10) || 0)}
                keyboardType="number-pad"
                style={styles.hourInput}
                testID="close-hour-input"
                accessibilityLabel="Close hour"
              />
            </View>
          </View>

          {/* Custom message toggle */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Use Custom Message</Text>
            <Switch
              value={form.useCustomMessage}
              onValueChange={(v) => onFormChange("useCustomMessage", v)}
              testID="custom-message-switch"
            />
          </View>

          {form.useCustomMessage ? (
            <>
              <Text style={styles.sectionLabel}>Out-of-Hours Message</Text>
              <TextInput
                value={form.outsideHoursMessage}
                onChangeText={(v) => onFormChange("outsideHoursMessage", v)}
                multiline
                numberOfLines={4}
                placeholder="We're currently closed…"
                style={[styles.input, styles.textArea]}
                testID="message-input"
                accessibilityLabel="Out-of-hours message"
              />
            </>
          ) : null}

          {saveError ? <Text style={styles.errorText} testID="save-error">{saveError}</Text> : null}
          {saveSuccess ? <Text style={styles.successText} testID="save-success">Saved.</Text> : null}

          <Pressable
            onPress={onSave}
            disabled={saving}
            accessibilityRole="button"
            testID="save-btn"
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Config"}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 16, backgroundColor: "#F2EDDD" },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { paddingVertical: 4 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6B6B6B" },
  title: { fontFamily: brandTypography.semibold, fontSize: 20, color: "#1A1A1A" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 16, gap: 14 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#1A1A1A" },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#6B6B6B" },
  daysRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  dayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E5E0D1",
  },
  dayBtnActive: { backgroundColor: "#1A1A1A" },
  dayBtnText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#4B4B4B" },
  dayBtnTextActive: { color: "#FFFFFF", fontFamily: brandTypography.semibold },
  hoursRow: { flexDirection: "row", gap: 12 },
  hourField: { flex: 1, gap: 6 },
  hourInput: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 10,
    fontFamily: brandTypography.regular,
    fontSize: 14,
    color: "#1A1A1A",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 10,
    fontFamily: brandTypography.regular,
    fontSize: 14,
    color: "#1A1A1A",
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#DC2626" },
  successText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#16A34A" },
  saveBtn: { backgroundColor: "#1A1A1A", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  saveBtnDisabled: { backgroundColor: "#D1D5DB" },
  saveBtnText: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#FFFFFF" },
});
